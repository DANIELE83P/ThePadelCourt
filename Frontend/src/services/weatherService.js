import { supabase } from '../lib/supabase';

/**
 * Weather Service
 * Integrates with OpenWeatherMap API for outdoor court forecasts
 * Uses club address from settings with geocoding
 */

// Free tier OpenWeatherMap API
const WEATHER_API_KEY = 'YOUR_API_KEY'; // User needs to add their key
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';
const GEO_API_BASE = 'https://api.openweathermap.org/geo/1.0';

/**
 * Get coordinates from club address
 */
const getCoordinatesFromClubAddress = async () => {
    try {
        // Fetch club settings
        const { data: settings, error } = await supabase
            .from('club_settings')
            .select('address, city, country')
            .single();

        if (error || !settings) {
            console.warn('[Weather] Club settings not found, using defaults');
            return { lat: 41.9028, lon: 12.4964 }; // Rome default
        }

        // Build address string
        const addressParts = [settings.address, settings.city, settings.country].filter(Boolean);
        const fullAddress = addressParts.join(', ');

        if (!fullAddress) {
            return { lat: 41.9028, lon: 12.4964 };
        }

        // Geocode address
        if (!WEATHER_API_KEY || WEATHER_API_KEY === 'YOUR_API_KEY') {
            console.warn('[Weather] API key not configured');
            return { lat: 41.9028, lon: 12.4964 };
        }

        const geoUrl = `${GEO_API_BASE}/direct?q=${encodeURIComponent(fullAddress)}&limit=1&appid=${WEATHER_API_KEY}`;
        const geoResponse = await fetch(geoUrl);

        if (!geoResponse.ok) throw new Error('Geocoding failed');

        const geoData = await geoResponse.json();

        if (geoData && geoData.length > 0) {
            return {
                lat: geoData[0].lat,
                lon: geoData[0].lon
            };
        }

        return { lat: 41.9028, lon: 12.4964 };

    } catch (error) {
        console.error('[Weather] Error geocoding address:', error);
        return { lat: 41.9028, lon: 12.4964 };
    }
};

/**
 * Get weather forecast for a specific date
 */
export const getWeatherForecast = async (date) => {
    // Get coordinates from club address
    const { lat, lon } = await getCoordinatesFromClubAddress();

    // If API key not configured, return mock data
    if (!WEATHER_API_KEY || WEATHER_API_KEY === 'YOUR_API_KEY') {
        console.warn('[Weather] API key not configured, returning mock data');
        return getMockWeather();
    }

    try {
        const targetDate = new Date(date);
        const now = new Date();
        const daysDiff = Math.floor((targetDate - now) / (1000 * 60 * 60 * 24));

        // Use different endpoints based on how far in the future
        let url;
        if (daysDiff <= 5) {
            // 5-day forecast
            url = `${WEATHER_API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=it`;
        } else {
            // Current weather only (for demo)
            url = `${WEATHER_API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=it`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather API error');

        const data = await response.json();

        // Parse response based on endpoint
        if (daysDiff <= 5 && data.list) {
            // Find forecast closest to target date at noon
            const targetTimestamp = new Date(targetDate.setHours(12, 0, 0, 0)).getTime();
            const closestForecast = data.list.reduce((closest, item) => {
                const itemTime = new Date(item.dt * 1000).getTime();
                const closestTime = new Date(closest.dt * 1000).getTime();
                return Math.abs(itemTime - targetTimestamp) < Math.abs(closestTime - targetTimestamp)
                    ? item
                    : closest;
            });

            return parseWeatherData(closestForecast);
        } else {
            // Current weather
            return parseWeatherData(data);
        }

    } catch (error) {
        console.error('[Weather] Error fetching forecast:', error);
        return getMockWeather();
    }
};

/**
 * Parse weather data into consistent format
 */
const parseWeatherData = (data) => {
    return {
        temp: Math.round(data.main?.temp || data.temp || 20),
        feels_like: Math.round(data.main?.feels_like || data.feels_like || 20),
        humidity: data.main?.humidity || data.humidity || 50,
        description: data.weather?.[0]?.description || 'Sereno',
        icon: data.weather?.[0]?.icon || '01d',
        wind_speed: Math.round((data.wind?.speed || 0) * 3.6), // m/s to km/h
        rain_probability: data.pop ? Math.round(data.pop * 100) : 0,
        rain_mm: data.rain?.['3h'] || data.rain?.['1h'] || 0,
        clouds: data.clouds?.all || 0,
        condition: getConditionFromCode(data.weather?.[0]?.id || 800),
        location: data.name || 'Location'
    };
};

/**
 * Get weather condition from OpenWeather code
 */
const getConditionFromCode = (code) => {
    if (code >= 200 && code < 300) return 'thunderstorm';
    if (code >= 300 && code < 400) return 'drizzle';
    if (code >= 500 && code < 600) return 'rain';
    if (code >= 600 && code < 700) return 'snow';
    if (code >= 700 && code < 800) return 'atmospheric';
    if (code === 800) return 'clear';
    if (code > 800) return 'clouds';
    return 'clear';
};

/**
 * Determine if weather is suitable for outdoor play
 */
export const isWeatherSuitable = (weather) => {
    const unsuitable = ['thunderstorm', 'rain', 'snow'];
    if (unsuitable.includes(weather.condition)) return false;
    if (weather.rain_probability > 70) return false;
    if (weather.wind_speed > 30) return false; // km/h
    return true;
};

/**
 * Get weather warning level
 */
export const getWeatherWarning = (weather) => {
    if (!isWeatherSuitable(weather)) {
        return {
            level: 'danger',
            message: 'Condizioni meteo sfavorevoli',
            icon: '⚠️',
            color: 'red'
        };
    }

    if (weather.rain_probability > 40) {
        return {
            level: 'warning',
            message: `${weather.rain_probability}% probabilità di pioggia`,
            icon: '🌧️',
            color: 'amber'
        };
    }

    if (weather.wind_speed > 20) {
        return {
            level: 'info',
            message: 'Vento moderato previsto',
            icon: '💨',
            color: 'blue'
        };
    }

    return {
        level: 'good',
        message: 'Condizioni ideali',
        icon: '☀️',
        color: 'green'
    };
};

/**
 * Get weather icon emoji
 */
export const getWeatherEmoji = (condition) => {
    const emojis = {
        'thunderstorm': '⛈️',
        'drizzle': '🌦️',
        'rain': '🌧️',
        'snow': '❄️',
        'atmospheric': '🌫️',
        'clear': '☀️',
        'clouds': '☁️'
    };
    return emojis[condition] || '🌤️';
};

/**
 * Mock weather data for testing
 */
const getMockWeather = () => {
    const conditions = ['clear', 'clouds', 'drizzle'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    return {
        temp: 18 + Math.floor(Math.random() * 10),
        feels_like: 17 + Math.floor(Math.random() * 10),
        humidity: 50 + Math.floor(Math.random() * 30),
        description: condition === 'clear' ? 'Sereno' : condition === 'clouds' ? 'Nuvoloso' : 'Pioviggine',
        icon: '01d',
        wind_speed: Math.floor(Math.random() * 20),
        rain_probability: Math.floor(Math.random() * 60),
        rain_mm: 0,
        clouds: Math.floor(Math.random() * 100),
        condition,
        location: 'Rome (Mock)'
    };
};

export default {
    getWeatherForecast,
    isWeatherSuitable,
    getWeatherWarning,
    getWeatherEmoji
};
