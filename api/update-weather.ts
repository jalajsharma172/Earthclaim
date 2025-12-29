import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowCors } from './utils/cors.js';
import { getAllSaveLocations } from "../shared/getAllSaveLocations.js";
import { formatTodayWeather } from "../server/getWeatherDescription.js";
import { saveWeatherReport } from "../shared/saveWeatherReport.js";
import axios from "axios";

async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // get all data
        const data = await getAllSaveLocations();
        if (!data || data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No locations found to update'
            });
        }

        const results = [];
        for (const location of data) {
            try {
                const response = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
                    params: {
                        latitude: location.latitude,
                        longitude: location.longitude,
                        current_weather: true,
                        hourly: 'temperature_2m,precipitation,weathercode',
                        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset',
                        timezone: 'auto'
                    }
                });

                const weatherReport = formatTodayWeather(response.data);
                const saveResult = await saveWeatherReport(location.username, weatherReport);

                results.push({
                    username: location.username,
                    success: saveResult.success,
                    message: saveResult.message,
                    weatherReport
                });
            } catch (error) {
                console.error(`Error processing location for ${location.username}:`, error);
                results.push({
                    username: location.username,
                    success: false,
                    message: error instanceof Error ? error.message : 'Unknown error',
                    weatherReport: null
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        return res.json({
            success: true,
            totalProcessed: data.length,
            successfulUpdates: successCount,
            failedUpdates: data.length - successCount,
            results
        });

    } catch (err) {
        console.error("Error in updating Weather Reports:", err);
        return res.status(500).json({
            success: false,
            message: err instanceof Error ? err.message : 'Unknown error occurred'
        });
    }
}

export default allowCors(handler);
