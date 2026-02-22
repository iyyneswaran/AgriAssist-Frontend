export interface WeatherData {
    temperature: number;
    windSpeed: number;
    precipitation: number;
    humidity: number;
    conditionName: string;
    iconFile: string;
}

// Map WMO Weather Codes to local asset files
const wmoToAssetMap = (code: number): { condition: string, file: string } => {
    // Exact Open-Meteo WMO Codes
    if (code === 0) return { condition: 'Sunny', file: 'sunny.png' };
    if ([1, 2].includes(code)) return { condition: 'Partly Cloudy', file: 'sunny_and_cloudy.png' };
    if ([3, 45, 48].includes(code)) return { condition: 'Cloudy', file: 'cloudy.png' };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { condition: 'Rain', file: 'rain.png' };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: 'Snow', file: 'snow.png' };
    if ([95, 96, 99].includes(code)) return { condition: 'Thunderstorm', file: 'thunderstrom.png' };

    // Default fallback
    return { condition: 'Clear', file: 'sunny.png' };
};

export const getWeather = async (lat: number, lng: number): Promise<WeatherData> => {
    // Adding timezone=auto and relative_humidity
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=precipitation,windspeed_10m,relativehumidity_2m&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch weather data');
    }

    const data = await response.json();
    const weather = data.current_weather;

    // Match the current_weather time to the hourly array
    let currentPrecip = 0;
    let currentHumidity = 50; // default
    if (data.hourly?.time) {
        const currentHour = weather.time.substring(0, 13) + ':00';
        const hourIndex = data.hourly.time.indexOf(currentHour);
        if (hourIndex !== -1) {
            currentPrecip = data.hourly.precipitation?.[hourIndex] ?? 0;
            currentHumidity = data.hourly.relativehumidity_2m?.[hourIndex] ?? 50;
        }
    }

    const mappedWeather = wmoToAssetMap(weather.weathercode);

    return {
        temperature: Math.round(weather.temperature),
        windSpeed: weather.windspeed,
        precipitation: currentPrecip,
        humidity: currentHumidity,
        conditionName: mappedWeather.condition,
        iconFile: mappedWeather.file
    };
};
