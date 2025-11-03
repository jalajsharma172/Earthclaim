type WeatherResponse = {
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode?: number[];
  };
};

function getWeatherDescription(code: number): string {
  const weatherCodes: Record<number, string> = {
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

export function formatTodayWeather(data: WeatherResponse): string {
  if (!data.daily) return "Weather data not available";

  const maxTemp = data.daily.temperature_2m_max[0];
  const minTemp = data.daily.temperature_2m_min[0];
  const weatherCode = data.daily.weathercode?.[0] ?? 0;
  const description = getWeatherDescription(weatherCode);

  return `Today: ${maxTemp}°C max, ${minTemp}°C min, ${description}`;
}
