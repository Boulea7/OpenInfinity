/**
 * Common Timezones for Clock Widget
 * IANA timezone identifiers with user-friendly labels
 */

export interface TimezoneOption {
  value: string; // IANA timezone (e.g., 'Asia/Shanghai')
  label: string; // Display name
  region: string; // Region category
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  // Auto-detect
  { value: 'auto', label: '自动检测 / Auto Detect', region: 'auto' },

  // Asia - East
  { value: 'Asia/Shanghai', label: '中国（北京时间）/ China (Beijing)', region: 'asia' },
  { value: 'Asia/Hong_Kong', label: '中国香港 / Hong Kong', region: 'asia' },
  { value: 'Asia/Taipei', label: '中国台湾 / Taiwan', region: 'asia' },
  { value: 'Asia/Tokyo', label: '日本（东京）/ Japan (Tokyo)', region: 'asia' },
  { value: 'Asia/Seoul', label: '韩国（首尔）/ South Korea (Seoul)', region: 'asia' },

  // Asia - Southeast
  { value: 'Asia/Singapore', label: '新加坡 / Singapore', region: 'asia' },
  { value: 'Asia/Bangkok', label: '泰国（曼谷）/ Thailand (Bangkok)', region: 'asia' },
  { value: 'Asia/Jakarta', label: '印度尼西亚（雅加达）/ Indonesia (Jakarta)', region: 'asia' },
  { value: 'Asia/Manila', label: '菲律宾（马尼拉）/ Philippines (Manila)', region: 'asia' },
  { value: 'Asia/Kuala_Lumpur', label: '马来西亚（吉隆坡）/ Malaysia (Kuala Lumpur)', region: 'asia' },

  // Asia - South
  { value: 'Asia/Kolkata', label: '印度（加尔各答）/ India (Kolkata)', region: 'asia' },
  { value: 'Asia/Karachi', label: '巴基斯坦（卡拉奇）/ Pakistan (Karachi)', region: 'asia' },
  { value: 'Asia/Dhaka', label: '孟加拉国（达卡）/ Bangladesh (Dhaka)', region: 'asia' },

  // Asia - Middle East
  { value: 'Asia/Dubai', label: '阿联酋（迪拜）/ UAE (Dubai)', region: 'asia' },
  { value: 'Asia/Riyadh', label: '沙特阿拉伯（利雅得）/ Saudi Arabia (Riyadh)', region: 'asia' },
  { value: 'Asia/Jerusalem', label: '以色列（耶路撒冷）/ Israel (Jerusalem)', region: 'asia' },

  // Europe
  { value: 'Europe/London', label: '英国（伦敦）/ UK (London)', region: 'europe' },
  { value: 'Europe/Paris', label: '法国（巴黎）/ France (Paris)', region: 'europe' },
  { value: 'Europe/Berlin', label: '德国（柏林）/ Germany (Berlin)', region: 'europe' },
  { value: 'Europe/Rome', label: '意大利（罗马）/ Italy (Rome)', region: 'europe' },
  { value: 'Europe/Madrid', label: '西班牙（马德里）/ Spain (Madrid)', region: 'europe' },
  { value: 'Europe/Amsterdam', label: '荷兰（阿姆斯特丹）/ Netherlands (Amsterdam)', region: 'europe' },
  { value: 'Europe/Moscow', label: '俄罗斯（莫斯科）/ Russia (Moscow)', region: 'europe' },
  { value: 'Europe/Istanbul', label: '土耳其（伊斯坦布尔）/ Turkey (Istanbul)', region: 'europe' },

  // Americas - North
  { value: 'America/New_York', label: '美国（纽约，EST）/ USA (New York, EST)', region: 'americas' },
  { value: 'America/Chicago', label: '美国（芝加哥，CST）/ USA (Chicago, CST)', region: 'americas' },
  { value: 'America/Denver', label: '美国（丹佛，MST）/ USA (Denver, MST)', region: 'americas' },
  { value: 'America/Los_Angeles', label: '美国（洛杉矶，PST）/ USA (Los Angeles, PST)', region: 'americas' },
  { value: 'America/Toronto', label: '加拿大（多伦多）/ Canada (Toronto)', region: 'americas' },
  { value: 'America/Vancouver', label: '加拿大（温哥华）/ Canada (Vancouver)', region: 'americas' },
  { value: 'America/Mexico_City', label: '墨西哥（墨西哥城）/ Mexico (Mexico City)', region: 'americas' },

  // Americas - South
  { value: 'America/Sao_Paulo', label: '巴西（圣保罗）/ Brazil (São Paulo)', region: 'americas' },
  { value: 'America/Buenos_Aires', label: '阿根廷（布宜诺斯艾利斯）/ Argentina (Buenos Aires)', region: 'americas' },

  // Oceania
  { value: 'Australia/Sydney', label: '澳大利亚（悉尼）/ Australia (Sydney)', region: 'oceania' },
  { value: 'Australia/Melbourne', label: '澳大利亚（墨尔本）/ Australia (Melbourne)', region: 'oceania' },
  { value: 'Pacific/Auckland', label: '新西兰（奥克兰）/ New Zealand (Auckland)', region: 'oceania' },

  // Africa
  { value: 'Africa/Cairo', label: '埃及（开罗）/ Egypt (Cairo)', region: 'africa' },
  { value: 'Africa/Johannesburg', label: '南非（约翰内斯堡）/ South Africa (Johannesburg)', region: 'africa' },
];

/**
 * Get user's current timezone using Intl API
 */
export function getAutoTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    // Fallback to UTC if detection fails
    return 'UTC';
  }
}

/**
 * Get timezone label by value
 */
export function getTimezoneLabel(timezone: string): string {
  const found = COMMON_TIMEZONES.find(tz => tz.value === timezone);
  return found ? found.label : timezone;
}
