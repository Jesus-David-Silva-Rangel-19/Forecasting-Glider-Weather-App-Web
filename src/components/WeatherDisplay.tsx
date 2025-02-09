
import { useEffect, useState } from 'react';
import { WeatherData, fetchWeatherData } from '@/services/weatherService';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Wind, Droplets, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const WeatherDisplay = () => {
  const [city, setCity] = useState('Tamalameque');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchWeather = async (searchCity = city) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchWeatherData(searchCity);
      setWeatherData(data);
      setCity(searchCity);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener datos del clima');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  useEffect(() => {
    if (weatherData?.location.timezone) {
      const updateTime = () => {
        setCurrentTime(new Date());
      };
      const timer = setInterval(updateTime, 1000);
      return () => clearInterval(timer);
    }
  }, [weatherData?.location.timezone]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWeather();
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ingresa el nombre de la ciudad"
            className="flex-1"
          />
          <Button type="submit">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Cargando...</div>
        ) : weatherData && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Current Weather */}
            <div className="p-6 backdrop-blur-lg bg-white/30 rounded-lg shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <h2 className="font-labrada text-2xl font-semibold">
                      {weatherData.location.name}
                    </h2>
                  </div>
                  <p className="text-gray-600 mt-1">
                    {weatherData.location.admin1}, {weatherData.location.country}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    {currentTime.toLocaleTimeString('es-ES', {
                      timeZone: weatherData.location.timezone,
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  {weatherData.location.population && (
                    <p className="text-sm text-gray-500 mt-1">
                      Población: {weatherData.location.population.toLocaleString()} habitantes
                    </p>
                  )}
                </div>
                <img
                  src={`https://openweathermap.org/img/wn/${weatherData.current.weather[0].icon}@2x.png`}
                  alt={weatherData.current.weather[0].description}
                  className="w-20 h-20"
                />
              </div>
              <div className="mt-4">
                <div className="font-alegreya text-6xl font-bold">
                  {Math.round(weatherData.current.temp)}°C
                </div>
                <p className="text-lg capitalize mt-2">
                  {weatherData.current.weather[0].description}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center gap-2">
                    <Wind className="h-5 w-5 text-gray-600" />
                    <span>{weatherData.current.wind_speed} m/s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-gray-600" />
                    <span>{weatherData.current.humidity}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Day Forecast */}
            <div className="p-6 backdrop-blur-lg bg-white/30 rounded-lg shadow-lg">
              <h3 className="font-labrada text-xl font-semibold mb-4">Pronóstico de 5 días</h3>
              <div className="space-y-4">
                {weatherData.daily.slice(1, 6).map((day) => (
                  <div
                    key={day.dt}
                    className="flex items-center justify-between p-3 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
                        alt={day.weather[0].description}
                        className="w-10 h-10"
                      />
                      <span className="font-medium">
                        {format(new Date(day.dt * 1000), 'EEEE', { locale: es })}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <span className="font-semibold">{Math.round(day.temp.max)}°</span>
                      <span className="text-gray-600">{Math.round(day.temp.min)}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
