export interface WeatherData {
  city: string;
  tempCelsius: number;
  description: string;
  iconCode: string;
}

export class WeatherService {
  private static apiKey = process.env.EXPO_PUBLIC_WEATHER_API_KEY || '';

  private static mapWmoCodeToDescription(code: number): { description: string; iconCode: string } {
    if (code === 0) return { description: 'Clear sky', iconCode: '01d' };
    if (code === 1 || code === 2) return { description: 'Partly cloudy', iconCode: '02d' };
    if (code === 3) return { description: 'Overcast', iconCode: '03d' };
    if (code >= 45 && code <= 48) return { description: 'Foggy', iconCode: '50d' };
    if (code >= 51 && code <= 55) return { description: 'Drizzle', iconCode: '09d' };
    if (code >= 61 && code <= 65) return { description: 'Rain showers', iconCode: '10d' };
    if (code >= 71 && code <= 77) return { description: 'Snow', iconCode: '13d' };
    if (code >= 80 && code <= 82) return { description: 'Heavy rain', iconCode: '09d' };
    if (code >= 95) return { description: 'Thunderstorm', iconCode: '11d' };
    return { description: 'Scattered clouds', iconCode: '02d' };
  }

  static async getCurrentWeather(city: string = 'Chennai'): Promise<WeatherData | null> {
    const key = this.apiKey;

    // 1. Try OpenWeatherMap if key is configured
    if (key && !key.includes('your_weather_api_key_here')) {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric`
        );
        if (response.ok) {
          const data = await response.json();
          return {
            city: data.name || city,
            tempCelsius: Math.round(data.main?.temp || 0),
            description: data.weather?.[0]?.description || 'Clear sky',
            iconCode: data.weather?.[0]?.icon || '01d',
          };
        }
      } catch {
        // Fallback to Open-Meteo
      }
    }

    // 2. 100% Free Zero-Key Fallback via Open-Meteo
    try {
      let lat = 13.0827;
      let lon = 80.2707;
      let resolvedCity = city;

      try {
        const geoResp = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
        );
        if (geoResp.ok) {
          const geoData = await geoResp.json();
          if (geoData.results && geoData.results.length > 0) {
            lat = geoData.results[0].latitude;
            lon = geoData.results[0].longitude;
            resolvedCity = geoData.results[0].name || city;
          }
        }
      } catch {
        // Use default coords
      }

      const weatherResp = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
      );
      if (weatherResp.ok) {
        const wData = await weatherResp.json();
        const current = wData.current;
        const temp = Math.round(current?.temperature_2m ?? 28);
        const code = current?.weather_code ?? 0;
        const { description, iconCode } = this.mapWmoCodeToDescription(code);

        return {
          city: resolvedCity,
          tempCelsius: temp,
          description,
          iconCode,
        };
      }
    } catch (e) {
      console.warn('[WeatherService] Free weather fetch failed:', e);
    }

    return null;
  }
}
