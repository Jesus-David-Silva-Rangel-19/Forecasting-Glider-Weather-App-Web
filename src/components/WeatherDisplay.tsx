
import { useEffect, useState, useCallback } from 'react';
import { WeatherData, fetchWeatherData } from '@/services/weatherService';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Wind, Droplets, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import debounce from 'lodash/debounce';

export const WeatherDisplay = () => {
  const [city, setCity] = useState('Tamalameque');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{
    name: string;
    admin1: string;
    country: string;
  }>>([]);

  const searchCities = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=es&format=json`
      );
      const data = await response.json();
      if (data.results) {
        setSearchResults(data.results.map((result: any) => ({
          name: result.name,
          admin1: result.admin1,
          country: result.country,
        })));
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching cities:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      searchCities(query);
    }, 500),
    [searchCities]
  );

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
    setOpen(false);
    fetchWeather();
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Intelligent Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Input
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    debouncedSearch(e.target.value);
                  }}
                  onClick={() => setOpen(true)}
                  placeholder="Ingresa el nombre de la ciudad"
                  className="w-full"
                />
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Buscar ciudad..."
                    value={city}
                    onValueChange={(value) => {
                      setCity(value);
                      debouncedSearch(value);
                    }}
                  />
                  <CommandEmpty>
                    {searchLoading ? 'Buscando...' : 'No se encontraron resultados.'}
                  </CommandEmpty>
                  <CommandGroup>
                    {searchResults.map((result, index) => (
                      <CommandItem
                        key={index}
                        onSelect={() => {
                          setCity(result.name);
                          setOpen(false);
                          fetchWeather(result.name);
                        }}
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        {result.name}, {result.admin1}, {result.country}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <Button type="submit" disabled={loading}>
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

            {/* Weather Map */}
            <div className="p-6 backdrop-blur-lg bg-white/30 rounded-lg shadow-lg">
              <h3 className="font-labrada text-xl font-semibold mb-4">Mapa Meteorológico</h3>
              <div className="relative w-full h-[300px] rounded-lg overflow-hidden">
                <iframe
                  className="absolute inset-0 w-full h-full border-0"
                  src={`https://www.rainviewer.com/map.html?loc=${weatherData.location.latitude},${weatherData.location.longitude},8&oFa=0&oC=1&oU=0&oCS=1&oF=0&oAP=1&c=1&o=83&lm=1&th=0&sm=1&sn=1`}
                  allowFullScreen
                />
              </div>
            </div>

            {/* 5-Day Forecast */}
            <div className="md:col-span-2 p-6 backdrop-blur-lg bg-white/30 rounded-lg shadow-lg">
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
