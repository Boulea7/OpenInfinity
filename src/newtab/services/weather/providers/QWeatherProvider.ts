/**
 * QWeather provider (JWT authentication)
 * Uses JWT (EdDSA) to access QWeather DevAPI.
 */

import { SignJWT, importPKCS8 } from 'jose';
import { getWeatherCondition } from '../../weather';
import type { IWeatherProvider, WeatherData } from '../types';

const QWEATHER_BASE_URL = 'https://devapi.qweather.com';
const QWEATHER_TIMEOUT_MS = 8000;
const JWT_TTL_SEC = 30 * 60;

function getPrivateKeyPem(): string {
  const raw = String(import.meta.env.VITE_QWEATHER_PRIVATE_KEY || '').trim();

  if (!raw) {
    throw new Error('Missing VITE_QWEATHER_PRIVATE_KEY');
  }

  // Allow providing a full PEM for local development
  if (raw.includes('BEGIN PRIVATE KEY')) {
    return raw;
  }

  const base64 = raw.replace(/\s+/g, '');
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
}

function toNumber(value: unknown, fieldName: string): number {
  const num =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : NaN;

  if (!Number.isFinite(num)) {
    throw new Error(`Invalid ${fieldName} value`);
  }

  return num;
}

function getDayOfWeek(dateString: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const date = new Date(`${dateString}T00:00:00`);
  return days[date.getDay()];
}

/**
 * Maps QWeather icon codes to a best-effort WMO weather code for UI compatibility.
 * This keeps existing icon/condition mapping logic unchanged.
 */
function mapQWeatherIconToWmoCode(iconCode: string): number {
  const code = Number(iconCode);

  if (!Number.isFinite(code)) return 999;

  // Clear sky (day/night)
  if (code === 100 || code === 150) return 0;

  // Mainly clear / partly cloudy
  if (
    code === 101 ||
    code === 102 ||
    code === 103 ||
    code === 151 ||
    code === 152 ||
    code === 153
  ) {
    return 2;
  }

  // Overcast
  if (code === 104) return 3;

  // Fog / haze / dust / sand
  if (code >= 500 && code < 600) return 45;

  // Rain / thunderstorm group
  if (code >= 300 && code < 400) {
    // Thunderstorm
    if (code === 302 || code === 303) return 95;
    if (code === 304) return 99;

    // Freezing rain
    if (code === 313) return 66;

    // Drizzle
    if (code === 309) return 53;

    // Showers
    if (code === 300 || code === 301 || code === 350 || code === 351) return 80;
    if (code === 310 || code === 311 || code === 312) return 65;

    // Rain intensity
    if (code === 305) return 61;
    if (code === 306) return 63;
    if (code === 307 || code === 308) return 65;

    return 63;
  }

  // Snow group
  if (code >= 400 && code < 500) {
    if (code === 400) return 71;
    if (code === 401) return 73;
    if (code === 402 || code === 403) return 75;

    // Sleet / rain and snow
    if (code === 404 || code === 405) return 86;

    // Snow showers
    if (code === 406 || code === 407) return 85;

    return 73;
  }

  return 999;
}

interface QWeatherNow {
  temp?: string;
  feelsLike?: string;
  icon?: string;
  humidity?: string;
  windSpeed?: string;
  text?: string;
}

interface QWeatherNowResponse {
  code: string;
  now?: QWeatherNow;
}

interface QWeatherDaily {
  fxDate: string;
  tempMax: string;
  tempMin: string;
  iconDay: string;
  textDay?: string;
}

interface QWeather7dResponse {
  code: string;
  daily?: QWeatherDaily[];
}

export class QWeatherProvider implements IWeatherProvider {
  readonly name = 'qweather';

  private jwtCache: { token: string; exp: number } | null = null;
  private privateKeyPromise: Promise<CryptoKey> | null = null;

  private async getPrivateKey(): Promise<CryptoKey> {
    if (!this.privateKeyPromise) {
      const pem = getPrivateKeyPem();
      this.privateKeyPromise = importPKCS8(pem, 'EdDSA');
    }
    return this.privateKeyPromise;
  }

  private async getJwtToken(): Promise<string> {
    const projectId = import.meta.env.VITE_QWEATHER_PROJECT_ID;
    const credentialId = import.meta.env.VITE_QWEATHER_CREDENTIAL_ID;

    if (!projectId) {
      throw new Error('Missing VITE_QWEATHER_PROJECT_ID');
    }

    if (!credentialId) {
      throw new Error('Missing VITE_QWEATHER_CREDENTIAL_ID');
    }

    const now = Math.floor(Date.now() / 1000);

    if (this.jwtCache && this.jwtCache.exp - now > 30) {
      return this.jwtCache.token;
    }

    const privateKey = await this.getPrivateKey();
    const exp = now + JWT_TTL_SEC;

    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'EdDSA', kid: credentialId })
      .setSubject(projectId)
      .setIssuedAt(now)
      .setExpirationTime(exp)
      .sign(privateKey);

    this.jwtCache = { token, exp };
    return token;
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(QWEATHER_TIMEOUT_MS),
      referrerPolicy: 'no-referrer',
      credentials: 'omit',
    });

    if (!response.ok) {
      throw new Error(`QWeather API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async fetchWeather(
    latitude: number,
    longitude: number,
    unit: 'celsius' | 'fahrenheit'
  ): Promise<WeatherData> {
    const fetchedAt = Date.now();

    try {
      const token = await this.getJwtToken();
      const unitParam = unit === 'fahrenheit' ? 'i' : 'm';

      const baseParams = new URLSearchParams({
        location: `${longitude},${latitude}`,
        unit: unitParam,
        lang: 'en',
        key: token,
      });

      const nowUrl = `${QWEATHER_BASE_URL}/v7/weather/now?${baseParams}`;
      const dailyUrl = `${QWEATHER_BASE_URL}/v7/weather/7d?${baseParams}`;

      const [nowData, dailyData] = await Promise.all([
        this.fetchJson<QWeatherNowResponse>(nowUrl),
        this.fetchJson<QWeather7dResponse>(dailyUrl),
      ]);

      if (nowData.code !== '200' || !nowData.now) {
        throw new Error(`QWeather now response error: code ${nowData.code}`);
      }

      if (dailyData.code !== '200' || !dailyData.daily || dailyData.daily.length === 0) {
        throw new Error(`QWeather 7d response error: code ${dailyData.code}`);
      }

      const now = nowData.now;
      const currentWmoCode = mapQWeatherIconToWmoCode(now.icon ?? '');

      const temp = Math.round(toNumber(now.temp, 'temperature'));
      const feelsLike = Math.round(toNumber(now.feelsLike, 'feelsLike'));
      const humidity = Math.round(toNumber(now.humidity, 'humidity'));

      const wind = toNumber(now.windSpeed, 'windSpeed');
      const windKmh = unit === 'fahrenheit' ? wind * 1.60934 : wind;

      const current = {
        temperature: temp,
        condition: getWeatherCondition(currentWmoCode),
        conditionCode: currentWmoCode,
        humidity,
        windSpeed: Math.round(windKmh),
        feelsLike,
      };

      const forecast = dailyData.daily.map((day) => {
        const wmoCode = mapQWeatherIconToWmoCode(day.iconDay);
        const dayDate = new Date(`${day.fxDate}T00:00:00`);
        return {
          date: day.fxDate,
          dayOfWeek: getDayOfWeek(day.fxDate),
          dayIndex: dayDate.getDay(), // 0-6 for i18n
          high: Math.round(toNumber(day.tempMax, 'tempMax')),
          low: Math.round(toNumber(day.tempMin, 'tempMin')),
          condition: getWeatherCondition(wmoCode),
          conditionCode: wmoCode,
        };
      });

      return {
        location: {
          name: '', // Will be updated by WeatherManager with geocoded name
          latitude,
          longitude,
        },
        current,
        forecast,
        provider: this.name,
        fetchedAt,
      };
    } catch (error) {
      console.error('[QWeatherProvider] Failed to fetch weather data:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch weather data');
    }
  }
}
