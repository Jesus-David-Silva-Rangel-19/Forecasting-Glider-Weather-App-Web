
export interface WeatherData {
  current: {
    temp: number;
    humidity: number;
    wind_speed: number;
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
  };
  daily: Array<{
    dt: number;
    temp: {
      min: number;
      max: number;
    };
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
  }>;
  location: {
    name: string;
    admin1: string;
    country: string;
    country_code: string;
    timezone: string;
    population?: number;
    latitude: number;
    longitude: number;
  };
}

export async function fetchWeatherData(
  city: string = "Tamalameque"
): Promise<WeatherData> {
  try {
    // First, get coordinates using geocoding API
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`
    );
    const geoData = await geoResponse.json();

    if (!geoData.results?.length) {
      throw new Error('Ciudad no encontrada');
    }

    const { latitude: lat, longitude: lon, name, admin1, country, country_code, timezone, population } = geoData.results[0];

    // Then get weather data from Open-Meteo
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
    );
    
    if (!weatherResponse.ok) {
      throw new Error('Error al obtener datos del clima');
    }

    const rawData = await weatherResponse.json();

    // Transform Open-Meteo data to match our interface
    const weatherCodeToIcon: { [key: number]: string } = {
      0: "01d", // Clear sky
      1: "02d", // Mainly clear
      2: "03d", // Partly cloudy
      3: "04d", // Overcast
      45: "50d", // Foggy
      48: "50d", // Depositing rime fog
      51: "09d", // Light drizzle
      53: "09d", // Moderate drizzle
      55: "09d", // Dense drizzle
      61: "10d", // Slight rain
      63: "10d", // Moderate rain
      65: "10d", // Heavy rain
      71: "13d", // Slight snow
      73: "13d", // Moderate snow
      75: "13d", // Heavy snow
      95: "11d", // Thunderstorm
    };

    const weatherCodeToDescription: { [key: number]: { main: string, description: string } } = {
      0: { main: "Despejado", description: "cielo despejado" },
      1: { main: "Despejado", description: "mayormente despejado" },
      2: { main: "Parcialmente nublado", description: "parcialmente nublado" },
      3: { main: "Nublado", description: "nublado" },
      45: { main: "Niebla", description: "niebla" },
      48: { main: "Niebla", description: "niebla helada" },
      51: { main: "Llovizna", description: "llovizna ligera" },
      53: { main: "Llovizna", description: "llovizna moderada" },
      55: { main: "Llovizna", description: "llovizna densa" },
      61: { main: "Lluvia", description: "lluvia ligera" },
      63: { main: "Lluvia", description: "lluvia moderada" },
      65: { main: "Lluvia", description: "lluvia fuerte" },
      71: { main: "Nieve", description: "nevada ligera" },
      73: { main: "Nieve", description: "nevada moderada" },
      75: { main: "Nieve", description: "nevada fuerte" },
      95: { main: "Tormenta", description: "tormenta eléctrica" },
    };

    const currentWeatherCode = rawData.current.weather_code;
    const weatherInfo = weatherCodeToDescription[currentWeatherCode] || { main: "Desconocido", description: "clima desconocido" };

    return {
      current: {
        temp: rawData.current.temperature_2m,
        humidity: rawData.current.relative_humidity_2m,
        wind_speed: rawData.current.wind_speed_10m,
        weather: [{
          main: weatherInfo.main,
          description: weatherInfo.description,
          icon: weatherCodeToIcon[currentWeatherCode] || "01d"
        }]
      },
      daily: rawData.daily.time.map((time: string, index: number) => ({
        dt: new Date(time).getTime() / 1000,
        temp: {
          min: rawData.daily.temperature_2m_min[index],
          max: rawData.daily.temperature_2m_max[index]
        },
        weather: [{
          main: weatherCodeToDescription[rawData.daily.weather_code[index]]?.main || "Desconocido",
          description: weatherCodeToDescription[rawData.daily.weather_code[index]]?.description || "clima desconocido",
          icon: weatherCodeToIcon[rawData.daily.weather_code[index]] || "01d"
        }]
      })),
      location: {
        name,
        admin1,
        country,
        country_code,
        timezone,
        population,
        latitude: lat,
        longitude: lon
      }
    };
  } catch (error) {
    console.error('Error al obtener datos del clima:', error);
    throw error;
  }
}
