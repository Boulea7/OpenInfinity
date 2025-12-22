/**
 * Preset cities data for manual weather location selection
 * Includes Chinese provinces/major cities and major international cities
 */

export interface City {
  id: string;
  name: string;        // Chinese name
  nameEn: string;      // English name
  country: string;     // Country Chinese
  countryEn: string;   // Country English
  latitude: number;
  longitude: number;
  region: 'cn' | 'intl';
}

export const PRESET_CITIES: City[] = [
  // ========== China - Direct-controlled Municipalities ==========
  { id: 'beijing', name: '北京', nameEn: 'Beijing', country: '中国', countryEn: 'China', latitude: 39.9042, longitude: 116.4074, region: 'cn' },
  { id: 'shanghai', name: '上海', nameEn: 'Shanghai', country: '中国', countryEn: 'China', latitude: 31.2304, longitude: 121.4737, region: 'cn' },
  { id: 'tianjin', name: '天津', nameEn: 'Tianjin', country: '中国', countryEn: 'China', latitude: 39.3434, longitude: 117.3616, region: 'cn' },
  { id: 'chongqing', name: '重庆', nameEn: 'Chongqing', country: '中国', countryEn: 'China', latitude: 29.4316, longitude: 106.9123, region: 'cn' },

  // ========== China - Provincial Capitals & Major Cities ==========
  // North China
  { id: 'shijiazhuang', name: '石家庄', nameEn: 'Shijiazhuang', country: '中国', countryEn: 'China', latitude: 38.0428, longitude: 114.5149, region: 'cn' },
  { id: 'taiyuan', name: '太原', nameEn: 'Taiyuan', country: '中国', countryEn: 'China', latitude: 37.8706, longitude: 112.5489, region: 'cn' },
  { id: 'hohhot', name: '呼和浩特', nameEn: 'Hohhot', country: '中国', countryEn: 'China', latitude: 40.8424, longitude: 111.7490, region: 'cn' },

  // Northeast China
  { id: 'shenyang', name: '沈阳', nameEn: 'Shenyang', country: '中国', countryEn: 'China', latitude: 41.8057, longitude: 123.4315, region: 'cn' },
  { id: 'changchun', name: '长春', nameEn: 'Changchun', country: '中国', countryEn: 'China', latitude: 43.8171, longitude: 125.3235, region: 'cn' },
  { id: 'harbin', name: '哈尔滨', nameEn: 'Harbin', country: '中国', countryEn: 'China', latitude: 45.8038, longitude: 126.5350, region: 'cn' },
  { id: 'dalian', name: '大连', nameEn: 'Dalian', country: '中国', countryEn: 'China', latitude: 38.9140, longitude: 121.6147, region: 'cn' },

  // East China
  { id: 'nanjing', name: '南京', nameEn: 'Nanjing', country: '中国', countryEn: 'China', latitude: 32.0603, longitude: 118.7969, region: 'cn' },
  { id: 'hangzhou', name: '杭州', nameEn: 'Hangzhou', country: '中国', countryEn: 'China', latitude: 30.2741, longitude: 120.1551, region: 'cn' },
  { id: 'hefei', name: '合肥', nameEn: 'Hefei', country: '中国', countryEn: 'China', latitude: 31.8206, longitude: 117.2272, region: 'cn' },
  { id: 'fuzhou', name: '福州', nameEn: 'Fuzhou', country: '中国', countryEn: 'China', latitude: 26.0745, longitude: 119.2965, region: 'cn' },
  { id: 'nanchang', name: '南昌', nameEn: 'Nanchang', country: '中国', countryEn: 'China', latitude: 28.6829, longitude: 115.8581, region: 'cn' },
  { id: 'jinan', name: '济南', nameEn: 'Jinan', country: '中国', countryEn: 'China', latitude: 36.6512, longitude: 117.1201, region: 'cn' },
  { id: 'qingdao', name: '青岛', nameEn: 'Qingdao', country: '中国', countryEn: 'China', latitude: 36.0671, longitude: 120.3826, region: 'cn' },
  { id: 'suzhou', name: '苏州', nameEn: 'Suzhou', country: '中国', countryEn: 'China', latitude: 31.2990, longitude: 120.5853, region: 'cn' },
  { id: 'wuxi', name: '无锡', nameEn: 'Wuxi', country: '中国', countryEn: 'China', latitude: 31.4912, longitude: 120.3119, region: 'cn' },
  { id: 'ningbo', name: '宁波', nameEn: 'Ningbo', country: '中国', countryEn: 'China', latitude: 29.8683, longitude: 121.5440, region: 'cn' },
  { id: 'xiamen', name: '厦门', nameEn: 'Xiamen', country: '中国', countryEn: 'China', latitude: 24.4798, longitude: 118.0894, region: 'cn' },

  // Central China
  { id: 'zhengzhou', name: '郑州', nameEn: 'Zhengzhou', country: '中国', countryEn: 'China', latitude: 34.7466, longitude: 113.6253, region: 'cn' },
  { id: 'wuhan', name: '武汉', nameEn: 'Wuhan', country: '中国', countryEn: 'China', latitude: 30.5928, longitude: 114.3055, region: 'cn' },
  { id: 'changsha', name: '长沙', nameEn: 'Changsha', country: '中国', countryEn: 'China', latitude: 28.2282, longitude: 112.9388, region: 'cn' },

  // South China
  { id: 'guangzhou', name: '广州', nameEn: 'Guangzhou', country: '中国', countryEn: 'China', latitude: 23.1291, longitude: 113.2644, region: 'cn' },
  { id: 'shenzhen', name: '深圳', nameEn: 'Shenzhen', country: '中国', countryEn: 'China', latitude: 22.5431, longitude: 114.0579, region: 'cn' },
  { id: 'nanning', name: '南宁', nameEn: 'Nanning', country: '中国', countryEn: 'China', latitude: 22.8170, longitude: 108.3665, region: 'cn' },
  { id: 'haikou', name: '海口', nameEn: 'Haikou', country: '中国', countryEn: 'China', latitude: 20.0440, longitude: 110.1999, region: 'cn' },
  { id: 'sanya', name: '三亚', nameEn: 'Sanya', country: '中国', countryEn: 'China', latitude: 18.2528, longitude: 109.5119, region: 'cn' },
  { id: 'dongguan', name: '东莞', nameEn: 'Dongguan', country: '中国', countryEn: 'China', latitude: 23.0430, longitude: 113.7633, region: 'cn' },
  { id: 'foshan', name: '佛山', nameEn: 'Foshan', country: '中国', countryEn: 'China', latitude: 23.0218, longitude: 113.1219, region: 'cn' },
  { id: 'zhuhai', name: '珠海', nameEn: 'Zhuhai', country: '中国', countryEn: 'China', latitude: 22.2710, longitude: 113.5767, region: 'cn' },

  // Southwest China
  { id: 'chengdu', name: '成都', nameEn: 'Chengdu', country: '中国', countryEn: 'China', latitude: 30.5728, longitude: 104.0668, region: 'cn' },
  { id: 'guiyang', name: '贵阳', nameEn: 'Guiyang', country: '中国', countryEn: 'China', latitude: 26.6470, longitude: 106.6302, region: 'cn' },
  { id: 'kunming', name: '昆明', nameEn: 'Kunming', country: '中国', countryEn: 'China', latitude: 24.8801, longitude: 102.8329, region: 'cn' },
  { id: 'lhasa', name: '拉萨', nameEn: 'Lhasa', country: '中国', countryEn: 'China', latitude: 29.6500, longitude: 91.1000, region: 'cn' },

  // Northwest China
  { id: 'xian', name: '西安', nameEn: "Xi'an", country: '中国', countryEn: 'China', latitude: 34.3416, longitude: 108.9398, region: 'cn' },
  { id: 'lanzhou', name: '兰州', nameEn: 'Lanzhou', country: '中国', countryEn: 'China', latitude: 36.0611, longitude: 103.8343, region: 'cn' },
  { id: 'xining', name: '西宁', nameEn: 'Xining', country: '中国', countryEn: 'China', latitude: 36.6171, longitude: 101.7782, region: 'cn' },
  { id: 'yinchuan', name: '银川', nameEn: 'Yinchuan', country: '中国', countryEn: 'China', latitude: 38.4872, longitude: 106.2309, region: 'cn' },
  { id: 'urumqi', name: '乌鲁木齐', nameEn: 'Urumqi', country: '中国', countryEn: 'China', latitude: 43.8256, longitude: 87.6168, region: 'cn' },

  // Special Administrative Regions
  { id: 'hongkong', name: '香港', nameEn: 'Hong Kong', country: '中国', countryEn: 'China', latitude: 22.3193, longitude: 114.1694, region: 'cn' },
  { id: 'macau', name: '澳门', nameEn: 'Macau', country: '中国', countryEn: 'China', latitude: 22.1987, longitude: 113.5439, region: 'cn' },
  { id: 'taipei', name: '台北', nameEn: 'Taipei', country: '中国台湾', countryEn: 'Taiwan, China', latitude: 25.0330, longitude: 121.5654, region: 'cn' },

  // ========== International - Asia ==========
  { id: 'tokyo', name: '东京', nameEn: 'Tokyo', country: '日本', countryEn: 'Japan', latitude: 35.6762, longitude: 139.6503, region: 'intl' },
  { id: 'osaka', name: '大阪', nameEn: 'Osaka', country: '日本', countryEn: 'Japan', latitude: 34.6937, longitude: 135.5023, region: 'intl' },
  { id: 'kyoto', name: '京都', nameEn: 'Kyoto', country: '日本', countryEn: 'Japan', latitude: 35.0116, longitude: 135.7681, region: 'intl' },
  { id: 'seoul', name: '首尔', nameEn: 'Seoul', country: '韩国', countryEn: 'South Korea', latitude: 37.5665, longitude: 126.9780, region: 'intl' },
  { id: 'busan', name: '釜山', nameEn: 'Busan', country: '韩国', countryEn: 'South Korea', latitude: 35.1796, longitude: 129.0756, region: 'intl' },
  { id: 'singapore', name: '新加坡', nameEn: 'Singapore', country: '新加坡', countryEn: 'Singapore', latitude: 1.3521, longitude: 103.8198, region: 'intl' },
  { id: 'bangkok', name: '曼谷', nameEn: 'Bangkok', country: '泰国', countryEn: 'Thailand', latitude: 13.7563, longitude: 100.5018, region: 'intl' },
  { id: 'kualalumpur', name: '吉隆坡', nameEn: 'Kuala Lumpur', country: '马来西亚', countryEn: 'Malaysia', latitude: 3.1390, longitude: 101.6869, region: 'intl' },
  { id: 'jakarta', name: '雅加达', nameEn: 'Jakarta', country: '印度尼西亚', countryEn: 'Indonesia', latitude: -6.2088, longitude: 106.8456, region: 'intl' },
  { id: 'manila', name: '马尼拉', nameEn: 'Manila', country: '菲律宾', countryEn: 'Philippines', latitude: 14.5995, longitude: 120.9842, region: 'intl' },
  { id: 'hanoi', name: '河内', nameEn: 'Hanoi', country: '越南', countryEn: 'Vietnam', latitude: 21.0285, longitude: 105.8542, region: 'intl' },
  { id: 'mumbai', name: '孟买', nameEn: 'Mumbai', country: '印度', countryEn: 'India', latitude: 19.0760, longitude: 72.8777, region: 'intl' },
  { id: 'newdelhi', name: '新德里', nameEn: 'New Delhi', country: '印度', countryEn: 'India', latitude: 28.6139, longitude: 77.2090, region: 'intl' },
  { id: 'dubai', name: '迪拜', nameEn: 'Dubai', country: '阿联酋', countryEn: 'UAE', latitude: 25.2048, longitude: 55.2708, region: 'intl' },
  { id: 'telaviv', name: '特拉维夫', nameEn: 'Tel Aviv', country: '以色列', countryEn: 'Israel', latitude: 32.0853, longitude: 34.7818, region: 'intl' },

  // ========== International - Europe ==========
  { id: 'london', name: '伦敦', nameEn: 'London', country: '英国', countryEn: 'UK', latitude: 51.5074, longitude: -0.1278, region: 'intl' },
  { id: 'paris', name: '巴黎', nameEn: 'Paris', country: '法国', countryEn: 'France', latitude: 48.8566, longitude: 2.3522, region: 'intl' },
  { id: 'berlin', name: '柏林', nameEn: 'Berlin', country: '德国', countryEn: 'Germany', latitude: 52.5200, longitude: 13.4050, region: 'intl' },
  { id: 'munich', name: '慕尼黑', nameEn: 'Munich', country: '德国', countryEn: 'Germany', latitude: 48.1351, longitude: 11.5820, region: 'intl' },
  { id: 'frankfurt', name: '法兰克福', nameEn: 'Frankfurt', country: '德国', countryEn: 'Germany', latitude: 50.1109, longitude: 8.6821, region: 'intl' },
  { id: 'rome', name: '罗马', nameEn: 'Rome', country: '意大利', countryEn: 'Italy', latitude: 41.9028, longitude: 12.4964, region: 'intl' },
  { id: 'milan', name: '米兰', nameEn: 'Milan', country: '意大利', countryEn: 'Italy', latitude: 45.4642, longitude: 9.1900, region: 'intl' },
  { id: 'madrid', name: '马德里', nameEn: 'Madrid', country: '西班牙', countryEn: 'Spain', latitude: 40.4168, longitude: -3.7038, region: 'intl' },
  { id: 'barcelona', name: '巴塞罗那', nameEn: 'Barcelona', country: '西班牙', countryEn: 'Spain', latitude: 41.3851, longitude: 2.1734, region: 'intl' },
  { id: 'amsterdam', name: '阿姆斯特丹', nameEn: 'Amsterdam', country: '荷兰', countryEn: 'Netherlands', latitude: 52.3676, longitude: 4.9041, region: 'intl' },
  { id: 'brussels', name: '布鲁塞尔', nameEn: 'Brussels', country: '比利时', countryEn: 'Belgium', latitude: 50.8503, longitude: 4.3517, region: 'intl' },
  { id: 'vienna', name: '维也纳', nameEn: 'Vienna', country: '奥地利', countryEn: 'Austria', latitude: 48.2082, longitude: 16.3738, region: 'intl' },
  { id: 'zurich', name: '苏黎世', nameEn: 'Zurich', country: '瑞士', countryEn: 'Switzerland', latitude: 47.3769, longitude: 8.5417, region: 'intl' },
  { id: 'stockholm', name: '斯德哥尔摩', nameEn: 'Stockholm', country: '瑞典', countryEn: 'Sweden', latitude: 59.3293, longitude: 18.0686, region: 'intl' },
  { id: 'oslo', name: '奥斯陆', nameEn: 'Oslo', country: '挪威', countryEn: 'Norway', latitude: 59.9139, longitude: 10.7522, region: 'intl' },
  { id: 'copenhagen', name: '哥本哈根', nameEn: 'Copenhagen', country: '丹麦', countryEn: 'Denmark', latitude: 55.6761, longitude: 12.5683, region: 'intl' },
  { id: 'helsinki', name: '赫尔辛基', nameEn: 'Helsinki', country: '芬兰', countryEn: 'Finland', latitude: 60.1699, longitude: 24.9384, region: 'intl' },
  { id: 'moscow', name: '莫斯科', nameEn: 'Moscow', country: '俄罗斯', countryEn: 'Russia', latitude: 55.7558, longitude: 37.6173, region: 'intl' },
  { id: 'dublin', name: '都柏林', nameEn: 'Dublin', country: '爱尔兰', countryEn: 'Ireland', latitude: 53.3498, longitude: -6.2603, region: 'intl' },
  { id: 'lisbon', name: '里斯本', nameEn: 'Lisbon', country: '葡萄牙', countryEn: 'Portugal', latitude: 38.7223, longitude: -9.1393, region: 'intl' },
  { id: 'athens', name: '雅典', nameEn: 'Athens', country: '希腊', countryEn: 'Greece', latitude: 37.9838, longitude: 23.7275, region: 'intl' },
  { id: 'prague', name: '布拉格', nameEn: 'Prague', country: '捷克', countryEn: 'Czech Republic', latitude: 50.0755, longitude: 14.4378, region: 'intl' },
  { id: 'warsaw', name: '华沙', nameEn: 'Warsaw', country: '波兰', countryEn: 'Poland', latitude: 52.2297, longitude: 21.0122, region: 'intl' },
  { id: 'budapest', name: '布达佩斯', nameEn: 'Budapest', country: '匈牙利', countryEn: 'Hungary', latitude: 47.4979, longitude: 19.0402, region: 'intl' },

  // ========== International - North America ==========
  { id: 'newyork', name: '纽约', nameEn: 'New York', country: '美国', countryEn: 'USA', latitude: 40.7128, longitude: -74.0060, region: 'intl' },
  { id: 'losangeles', name: '洛杉矶', nameEn: 'Los Angeles', country: '美国', countryEn: 'USA', latitude: 34.0522, longitude: -118.2437, region: 'intl' },
  { id: 'chicago', name: '芝加哥', nameEn: 'Chicago', country: '美国', countryEn: 'USA', latitude: 41.8781, longitude: -87.6298, region: 'intl' },
  { id: 'sanfrancisco', name: '旧金山', nameEn: 'San Francisco', country: '美国', countryEn: 'USA', latitude: 37.7749, longitude: -122.4194, region: 'intl' },
  { id: 'seattle', name: '西雅图', nameEn: 'Seattle', country: '美国', countryEn: 'USA', latitude: 47.6062, longitude: -122.3321, region: 'intl' },
  { id: 'boston', name: '波士顿', nameEn: 'Boston', country: '美国', countryEn: 'USA', latitude: 42.3601, longitude: -71.0589, region: 'intl' },
  { id: 'washington', name: '华盛顿', nameEn: 'Washington D.C.', country: '美国', countryEn: 'USA', latitude: 38.9072, longitude: -77.0369, region: 'intl' },
  { id: 'miami', name: '迈阿密', nameEn: 'Miami', country: '美国', countryEn: 'USA', latitude: 25.7617, longitude: -80.1918, region: 'intl' },
  { id: 'houston', name: '休斯顿', nameEn: 'Houston', country: '美国', countryEn: 'USA', latitude: 29.7604, longitude: -95.3698, region: 'intl' },
  { id: 'dallas', name: '达拉斯', nameEn: 'Dallas', country: '美国', countryEn: 'USA', latitude: 32.7767, longitude: -96.7970, region: 'intl' },
  { id: 'lasvegas', name: '拉斯维加斯', nameEn: 'Las Vegas', country: '美国', countryEn: 'USA', latitude: 36.1699, longitude: -115.1398, region: 'intl' },
  { id: 'toronto', name: '多伦多', nameEn: 'Toronto', country: '加拿大', countryEn: 'Canada', latitude: 43.6532, longitude: -79.3832, region: 'intl' },
  { id: 'vancouver', name: '温哥华', nameEn: 'Vancouver', country: '加拿大', countryEn: 'Canada', latitude: 49.2827, longitude: -123.1207, region: 'intl' },
  { id: 'montreal', name: '蒙特利尔', nameEn: 'Montreal', country: '加拿大', countryEn: 'Canada', latitude: 45.5017, longitude: -73.5673, region: 'intl' },
  { id: 'mexicocity', name: '墨西哥城', nameEn: 'Mexico City', country: '墨西哥', countryEn: 'Mexico', latitude: 19.4326, longitude: -99.1332, region: 'intl' },

  // ========== International - South America ==========
  { id: 'saopaulo', name: '圣保罗', nameEn: 'Sao Paulo', country: '巴西', countryEn: 'Brazil', latitude: -23.5505, longitude: -46.6333, region: 'intl' },
  { id: 'riodejaneiro', name: '里约热内卢', nameEn: 'Rio de Janeiro', country: '巴西', countryEn: 'Brazil', latitude: -22.9068, longitude: -43.1729, region: 'intl' },
  { id: 'buenosaires', name: '布宜诺斯艾利斯', nameEn: 'Buenos Aires', country: '阿根廷', countryEn: 'Argentina', latitude: -34.6037, longitude: -58.3816, region: 'intl' },
  { id: 'santiago', name: '圣地亚哥', nameEn: 'Santiago', country: '智利', countryEn: 'Chile', latitude: -33.4489, longitude: -70.6693, region: 'intl' },
  { id: 'lima', name: '利马', nameEn: 'Lima', country: '秘鲁', countryEn: 'Peru', latitude: -12.0464, longitude: -77.0428, region: 'intl' },

  // ========== International - Oceania ==========
  { id: 'sydney', name: '悉尼', nameEn: 'Sydney', country: '澳大利亚', countryEn: 'Australia', latitude: -33.8688, longitude: 151.2093, region: 'intl' },
  { id: 'melbourne', name: '墨尔本', nameEn: 'Melbourne', country: '澳大利亚', countryEn: 'Australia', latitude: -37.8136, longitude: 144.9631, region: 'intl' },
  { id: 'brisbane', name: '布里斯班', nameEn: 'Brisbane', country: '澳大利亚', countryEn: 'Australia', latitude: -27.4698, longitude: 153.0251, region: 'intl' },
  { id: 'auckland', name: '奥克兰', nameEn: 'Auckland', country: '新西兰', countryEn: 'New Zealand', latitude: -36.8509, longitude: 174.7645, region: 'intl' },

  // ========== International - Africa ==========
  { id: 'cairo', name: '开罗', nameEn: 'Cairo', country: '埃及', countryEn: 'Egypt', latitude: 30.0444, longitude: 31.2357, region: 'intl' },
  { id: 'johannesburg', name: '约翰内斯堡', nameEn: 'Johannesburg', country: '南非', countryEn: 'South Africa', latitude: -26.2041, longitude: 28.0473, region: 'intl' },
  { id: 'capetown', name: '开普敦', nameEn: 'Cape Town', country: '南非', countryEn: 'South Africa', latitude: -33.9249, longitude: 18.4241, region: 'intl' },
  { id: 'nairobi', name: '内罗毕', nameEn: 'Nairobi', country: '肯尼亚', countryEn: 'Kenya', latitude: -1.2921, longitude: 36.8219, region: 'intl' },
  { id: 'lagos', name: '拉各斯', nameEn: 'Lagos', country: '尼日利亚', countryEn: 'Nigeria', latitude: 6.5244, longitude: 3.3792, region: 'intl' },
];

/**
 * Search cities by name (supports Chinese, English, and pinyin partial match)
 */
export function searchCities(query: string, limit = 20): City[] {
  if (!query.trim()) {
    // Return popular cities when no query
    return PRESET_CITIES.slice(0, limit);
  }

  const q = query.toLowerCase().trim();

  return PRESET_CITIES.filter(city =>
    city.name.toLowerCase().includes(q) ||
    city.nameEn.toLowerCase().includes(q) ||
    city.country.toLowerCase().includes(q) ||
    city.countryEn.toLowerCase().includes(q)
  ).slice(0, limit);
}

/**
 * Get city by ID
 */
export function getCityById(id: string): City | undefined {
  return PRESET_CITIES.find(city => city.id === id);
}
