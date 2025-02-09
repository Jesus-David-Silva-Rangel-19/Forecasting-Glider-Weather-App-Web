
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
}

export async function fetchWeatherData(
  city: string = "Tamalameque",
  apiKey: string
): Promise<WeatherData> {
  try {
    // First, get coordinates
    const geoResponse = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`
    );
    const geoData = await geoResponse.json();

    if (!geoData.length) {
      throw new Error('City not found');
    }

    const { lat, lon } = geoData[0];

    // Then get weather data
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=${apiKey}`
    );
    
    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    return weatherResponse.json();
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}
