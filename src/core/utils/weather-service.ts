export interface WeatherData {
  city: string;
  tempCelsius: number;
  description: string;
  iconCode: string;
}

export class WeatherService {
  private static apiKey = process.env.EXPO_PUBLIC_WEATHER_API_KEY || '';

  static async getCurrentWeather(city: string = 'Chennai'): Promise<WeatherData | null> {
    const key = this.apiKey;
    if (!key || key.includes('your_weather_api_key_here')) {
      return null;
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        city: data.name || city,
        tempCelsius: Math.round(data.main?.temp || 0),
        description: data.weather?.[0]?.description || 'Clear sky',
        iconCode: data.weather?.[0]?.icon || '01d',
      };
    } catch {
      return null;
    }
  }
}
