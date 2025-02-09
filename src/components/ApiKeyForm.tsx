
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink } from 'lucide-react';

export const ApiKeyForm = ({ onApiKeySubmit }: { onApiKeySubmit: (key: string) => void }) => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('weather_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      onApiKeySubmit(storedKey);
    }
  }, [onApiKeySubmit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('weather_api_key', apiKey);
    onApiKeySubmit(apiKey);
  };

  return (
    <div className="p-6 backdrop-blur-lg bg-white/30 rounded-lg shadow-lg animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="apiKey" className="block font-alegreya text-lg">
            OpenWeatherMap API Key
          </label>
          <Input
            id="apiKey"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            className="w-full"
          />
        </div>
        <div className="flex justify-between items-center">
          <a
            href="https://home.openweathermap.org/api_keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Get API Key <ExternalLink size={14} />
          </a>
          <Button type="submit">Save Key</Button>
        </div>
      </form>
    </div>
  );
};
