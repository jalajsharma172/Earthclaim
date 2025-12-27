export function getWeatherDescription(code) {
    const weatherCodes = {
        0: "clear sky",
        1: "mainly clear",
        2: "partly cloudy",
        3: "overcast",
        45: "foggy",
        48: "depositing rime fog",
        51: "light drizzle",
        53: "moderate drizzle",
        55: "dense drizzle",
        61: "slight rain",
        63: "moderate rain",
        65: "heavy rain",
        71: "slight snow",
        73: "moderate snow",
        75: "heavy snow",
        80: "rain showers",
        81: "moderate rain showers",
        82: "violent rain showers",
        95: "thunderstorm",
        99: "thunderstorm with hail"
    };
    return weatherCodes[code] || "unknown weather";
}
export function formatTodayWeather(data) {
    // Check if we have the required data
    if (!data?.daily?.temperature_2m_max?.[0] || !data?.daily?.temperature_2m_min?.[0]) {
        return "Weather data not available";
    }
    const maxTemp = Math.round(data.daily.temperature_2m_max[0]);
    const minTemp = Math.round(data.daily.temperature_2m_min[0]);
    const weatherCode = data.daily.weathercode?.[0] ?? 0;
    const description = getWeatherDescription(weatherCode);
    return `Today: ${maxTemp}°C max, ${minTemp}°C min, ${description}`;
}
// If you need to export the weather code mapping for use elsewhere
export const weatherCodeDescriptions = {
    0: "clear sky",
    1: "mainly clear",
    // ... rest of the codes
};
