/**
 * Tamil Calendar & Panchangam Offline Engine
 * 100% Pure TypeScript with Zero External Dependencies
 * Calculations for Tamil Date, Month, Year, Thithi, Nakshatra, Yoga, Karanam,
 * Rahu Kalam, Yamagandam, Kuligai, Gowri Nalla Neram, Chandrashtamam,
 * Viratham & Festivals, and Daily Thirukkural.
 */

export interface TamilDateInfo {
  tamilYear: string;
  tamilYearEnglish: string;
  tamilMonth: string;
  tamilMonthEnglish: string;
  tamilDay: number;
  weekdayTamil: string;
  weekdayEnglish: string;
  ayanaTamil: string; // உத்தராயணம் / தட்சிணாயணம்
  ruthuTamil: string; // வசந்த, கிரீஷ்ம, வர்ஷ, சரத், ஹேமந்த, சிசிர ருது
}

export interface PanchangamInfo {
  thithi: string;
  paksham: 'வளர்பிறை' | 'தேய்பிறை';
  thithiEnglish: string;
  nakshatram: string;
  nakshatramEnglish: string;
  nithyaYogam: string;
  auspiciousYogam: 'சித்த யோகம்' | 'அமிர்த யோகம்' | 'மரண யோகம்';
  karanam: string;
  moonRasi: string;
  chandrashtamaRasi: string;
  soolamDirection: string;
  soolamParigaram: string;
  sunrise: string;
  sunset: string;
}

export interface TimeInterval {
  start: string;
  end: string;
}

export interface AuspiciousTimes {
  nallaNeramMorning: TimeInterval;
  nallaNeramEvening: TimeInterval;
  gowriNallaNeramMorning: TimeInterval;
  gowriNallaNeramEvening: TimeInterval;
}

export interface InauspiciousTimes {
  rahuKaalam: TimeInterval;
  yamagandam: TimeInterval;
  kuligai: TimeInterval;
}

export interface ThirukkuralData {
  number: number;
  adhigaram: string;
  adhigaramEnglish: string;
  line1: string;
  line2: string;
  meaningTamil: string;
  meaningEnglish: string;
}

export interface DailyCalendarData {
  gregorianDate: Date;
  dateKey: string; // YYYY-MM-DD
  tamilDate: TamilDateInfo;
  panchangam: PanchangamInfo;
  auspiciousTimes: AuspiciousTimes;
  inauspiciousTimes: InauspiciousTimes;
  virathams: string[];
  festivals: string[];
  isSubhaMuhurtham: boolean;
  thirukkural: ThirukkuralData;
}

export interface MonthDayItem {
  date: Date;
  dayNumber: number; // 1-31
  isCurrentMonth: boolean;
  isToday: boolean;
  dailyData: DailyCalendarData;
}

export interface MonthEventItem {
  day: number;
  date: Date;
  name: string;
  type: 'festival' | 'viratham' | 'muhurtham';
}

export interface MonthCalendarData {
  year: number;
  month: number; // 0-11
  englishMonthName: string; // "November 2026"
  tamilMonthNames: string; // e.g. "ஐப்பசி – கார்த்திகை"
  days: MonthDayItem[];
  subhaMuhurthamDays: MonthDayItem[];
  festivalsAndVirathams: MonthEventItem[];
}

// 60 Tamil Years (Jovian Cycle)
const TAMIL_YEARS = [
  { tamil: 'பிரபவ', english: 'Prabhava' },
  { tamil: 'விபவ', english: 'Vibhava' },
  { tamil: 'சுக்ல', english: 'Sukla' },
  { tamil: 'பிரமோதூத', english: 'Pramodhuta' },
  { tamil: 'பிரசோற்பத்தி', english: 'Prajotpatti' },
  { tamil: 'ஆங்கீரச', english: 'Aangirasa' },
  { tamil: 'ஸ்ரீமுக', english: 'Srimukha' },
  { tamil: 'பவ', english: 'Bhava' },
  { tamil: 'யுவ', english: 'Yuva' },
  { tamil: 'தாது', english: 'Dhatru' },
  { tamil: 'ஈஸ்வர', english: 'Easwara' },
  { tamil: 'வெகுதானிய', english: 'Bahudhanya' },
  { tamil: 'பிரமாதி', english: 'Pramadhi' },
  { tamil: 'விக்ரம', english: 'Vikrama' },
  { tamil: 'விஷு', english: 'Vishu' },
  { tamil: 'சித்திரபானு', english: 'Chitrabhanu' },
  { tamil: 'சுபானு', english: 'Subhanu' },
  { tamil: 'தாரண', english: 'Dharana' },
  { tamil: 'பார்த்திப', english: 'Parthiba' },
  { tamil: 'விய', english: 'Viya' },
  { tamil: 'சர்வசித்து', english: 'Sarvajith' },
  { tamil: 'சர்வதாரி', english: 'Sarvadhari' },
  { tamil: 'விரோதி', english: 'Virodhi' },
  { tamil: 'விகிருதி', english: 'Vikruthi' },
  { tamil: 'கர', english: 'Kara' },
  { tamil: 'நந்தன', english: 'Nandhana' },
  { tamil: 'விஜய', english: 'Vijaya' },
  { tamil: 'ஜய', english: 'Jaya' },
  { tamil: 'மன்மத', english: 'Manmatha' },
  { tamil: 'துன்முகி', english: 'Dunmukhi' },
  { tamil: 'ஹேவிளம்பி', english: 'Hevilambi' },
  { tamil: 'விளம்பி', english: 'Vilambi' },
  { tamil: 'விகாரி', english: 'Vikari' },
  { tamil: 'சார்வரி', english: 'Sarvari' },
  { tamil: 'பிலவ', english: 'Plava' },
  { tamil: 'சுபகிருது', english: 'Subhakrithu' },
  { tamil: 'சோபகிருது', english: 'Sobhakrithu' },
  { tamil: 'குரோதி', english: 'Krodhi' },
  { tamil: 'விசுவாசு', english: 'Visuvasu' },
  { tamil: 'பராபவ', english: 'Parabhava' },
  { tamil: 'பிலவங்க', english: 'Plavanga' },
  { tamil: 'கீலக', english: 'Keelaka' },
  { tamil: 'சௌமிய', english: 'Saumya' },
  { tamil: 'சாதாரண', english: 'Sadharana' },
  { tamil: 'விரோதிகிருது', english: 'Virodhikrithu' },
  { tamil: 'பரிதாபி', english: 'Paridhabi' },
  { tamil: 'பிரமாதீச', english: 'Pramadheesa' },
  { tamil: 'ஆனந்த', english: 'Aanandha' },
  { tamil: 'ராட்சச', english: 'Rakshasa' },
  { tamil: 'நள', english: 'Nala' },
  { tamil: 'பிங்கள', english: 'Pingala' },
  { tamil: 'காளயுக்தி', english: 'Kalayukthi' },
  { tamil: 'சித்தார்த்தி', english: 'Siddharthi' },
  { tamil: 'ரௌத்திரி', english: 'Raudhri' },
  { tamil: 'துன்மதி', english: 'Dunmathi' },
  { tamil: 'துந்துபி', english: 'Dhundhubhi' },
  { tamil: 'ருத்ரோத்காரி', english: 'Rudhrothkari' },
  { tamil: 'ரக்தாட்சி', english: 'Raktakshi' },
  { tamil: 'குரோதன', english: 'Krodhana' },
  { tamil: 'அட்சய', english: 'Akshaya' },
];

// 12 Tamil Solar Months
const TAMIL_MONTHS = [
  { tamil: 'சித்திரை', english: 'Chithirai' },
  { tamil: 'வைகாசி', english: 'Vaikasi' },
  { tamil: 'ஆனி', english: 'Aani' },
  { tamil: 'ஆடி', english: 'Aadi' },
  { tamil: 'ஆவணி', english: 'Aavani' },
  { tamil: 'புரட்டாசி', english: 'Purattasi' },
  { tamil: 'ஐப்பசி', english: 'Aippasi' },
  { tamil: 'கார்த்திகை', english: 'Karthigai' },
  { tamil: 'மார்கழி', english: 'Margazhi' },
  { tamil: 'தை', english: 'Thai' },
  { tamil: 'மாசி', english: 'Masi' },
  { tamil: 'பங்குனி', english: 'Panguni' },
];

const WEEKDAYS = [
  { tamil: 'ஞாயிற்றுக்கிழமை', english: 'Sunday' },
  { tamil: 'திங்கட்கிழமை', english: 'Monday' },
  { tamil: 'செவ்வாய்க்கிழமை', english: 'Tuesday' },
  { tamil: 'புதன்கிழமை', english: 'Wednesday' },
  { tamil: 'வியாழக்கிழமை', english: 'Thursday' },
  { tamil: 'வெள்ளிக்கிழமை', english: 'Friday' },
  { tamil: 'சனிக்கிழமை', english: 'Saturday' },
];

const NAKSHATRAS = [
  { tamil: 'அஸ்வினி', english: 'Ashwini' },
  { tamil: 'பரணி', english: 'Bharani' },
  { tamil: 'கார்த்திகை', english: 'Karthigai' },
  { tamil: 'ரோகிணி', english: 'Rohini' },
  { tamil: 'மிருகசீரிஷம்', english: 'Mrigashirsha' },
  { tamil: 'திருவாதிரை', english: 'Thiruvathirai' },
  { tamil: 'புனர்பூசம்', english: 'Punarpoosam' },
  { tamil: 'பூசம்', english: 'Poosam' },
  { tamil: 'ஆயில்யம்', english: 'Aayilyam' },
  { tamil: 'மகம்', english: 'Magam' },
  { tamil: 'பூரம்', english: 'Pooram' },
  { tamil: 'உத்திரம்', english: 'Uthiram' },
  { tamil: 'ஹஸ்தம்', english: 'Hastham' },
  { tamil: 'சித்திரை', english: 'Chithirai' },
  { tamil: 'சுவாதி', english: 'Swathi' },
  { tamil: 'விசாகம்', english: 'Visakam' },
  { tamil: 'அனுஷம்', english: 'Anusham' },
  { tamil: 'கேட்டை', english: 'Kettai' },
  { tamil: 'மூலம்', english: 'Moolam' },
  { tamil: 'பூராடம்', english: 'Pooradam' },
  { tamil: 'உத்திராடம்', english: 'Uthiradam' },
  { tamil: 'திருவோணம்', english: 'Thiruvonam' },
  { tamil: 'அவிட்டம்', english: 'Avittam' },
  { tamil: 'சதயம்', english: 'Sathayam' },
  { tamil: 'பூரட்டாதி', english: 'Poorattathi' },
  { tamil: 'உத்திரட்டாதி', english: 'Uthirattathi' },
  { tamil: 'ரேவதி', english: 'Revathi' },
];

const RASIS = [
  'மேஷம் (Aries)',
  'ரிஷபம் (Taurus)',
  'மிதுனம் (Gemini)',
  'கடகம் (Cancer)',
  'சிம்மம் (Leo)',
  'கன்னி (Virgo)',
  'துலாம் (Libra)',
  'விருச்சிகம் (Scorpio)',
  'தனுசு (Sagittarius)',
  'மகரம் (Capricorn)',
  'கும்பம் (Aquarius)',
  'மீனம் (Pisces)',
];

const THITHI_NAMES = [
  { tamil: 'பிரதமை', english: 'Prathamai' },
  { tamil: 'துவிதியை', english: 'Dvitiya' },
  { tamil: 'திருதியை', english: 'Tritiya' },
  { tamil: 'சதுர்த்தி', english: 'Chaturthi' },
  { tamil: 'பஞ்சமி', english: 'Panchami' },
  { tamil: 'சஷ்டி', english: 'Sashti' },
  { tamil: 'சப்தமி', english: 'Saptami' },
  { tamil: 'அஷ்டமி', english: 'Ashtami' },
  { tamil: 'நவமி', english: 'Navami' },
  { tamil: 'தசமி', english: 'Dashami' },
  { tamil: 'ஏகாதசி', english: 'Ekadasi' },
  { tamil: 'துவாதசி', english: 'Dwadasi' },
  { tamil: 'திரயோதசி', english: 'Trayodasi' },
  { tamil: 'சதுர்த்தசி', english: 'Chaturdasi' },
  { tamil: 'பௌர்ணமி', english: 'Pournami' },
];

const NITHYA_YOGAS = [
  'விஷ்கம்பம்', 'ப்ரீதி', 'ஆயுஷ்மான்', 'சௌபாக்யம்', 'சோபனம்', 'அதிகண்டம்', 'சுகர்மம்', 'த்ருதி',
  'சூலம்', 'கண்டம்', 'வ்ருத்தி', 'த்ருவம்', 'வ்யாகாதம்', 'ஹர்ஷணம்', 'வஜ்ரம்', 'சித்தி',
  'வ்யதீபாதம்', 'வரீயான்', 'பரிகம்', 'சிவம்', 'சித்தம்', 'சாத்தியம்', 'சுபம்', 'சுப்ரம்',
  'பிராமியம்', 'ஐந்திரம்', 'வைத்ருதி'
];

const KARANAS = [
  'பவம்', 'பாலவம்', 'கௌலவம்', 'தைதுலை', 'கரசை', 'வணிசை', 'பத்திரை (விஷ்டி)',
  'சகுனி', 'சதுஷ்பாதம்', 'நாகவம்', 'கிம்ஸ்துக்னம்'
];

// Auspicious Yoga (அமிர்த யோகம், சித்த யோகம், மரண யோகம்) lookup table
// Key: `${weekdayIndex}_${nakshatraIndex}`
// 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
function getAuspiciousYoga(weekday: number, nakshatra: number): 'சித்த யோகம்' | 'அமிர்த யோகம்' | 'மரண யோகம்' {
  // Sunday
  if (weekday === 0) {
    if (nakshatra === 22 || nakshatra === 23) return 'அமிர்த யோகம்';
    if ([0, 3, 4, 5, 6, 10].includes(nakshatra)) return 'மரண யோகம்';
    return 'சித்த யோகம்';
  }
  // Monday
  if (weekday === 1) {
    if ([3, 6, 10, 14, 20].includes(nakshatra)) return 'அமிர்த யோகம்';
    if ([7, 8, 17, 21].includes(nakshatra)) return 'மரண யோகம்';
    return 'சித்த யோகம்';
  }
  // Tuesday
  if (weekday === 2) {
    if ([0, 2, 7, 11, 15, 19, 24].includes(nakshatra)) return 'அமிர்த யோகம்';
    if ([8, 9, 13, 17, 22].includes(nakshatra)) return 'மரண யோகம்';
    return 'சித்த யோகம்';
  }
  // Wednesday
  if (weekday === 3) {
    if ([1, 4, 8, 12, 16, 21, 25].includes(nakshatra)) return 'அமிர்த யோகம்';
    if ([2, 6, 10, 15, 19, 23].includes(nakshatra)) return 'மரண யோகம்';
    return 'சித்த யோகம்';
  }
  // Thursday
  if (weekday === 4) {
    if ([7, 12, 16, 20, 26].includes(nakshatra)) return 'அமிர்த யோகம்';
    if ([0, 4, 8, 13, 17, 22].includes(nakshatra)) return 'மரண யோகம்';
    return 'சித்த யோகம்';
  }
  // Friday
  if (weekday === 5) {
    if ([0, 3, 9, 14, 18, 22].includes(nakshatra)) return 'அமிர்த யோகம்';
    if ([1, 5, 10, 15, 19, 24].includes(nakshatra)) return 'மரண யோகம்';
    return 'சித்த யோகம்';
  }
  // Saturday
  if (weekday === 6) {
    if ([2, 6, 11, 15, 20, 24].includes(nakshatra)) return 'அமிர்த யோகம்';
    if ([3, 7, 12, 16, 21, 25].includes(nakshatra)) return 'மரண யோகம்';
    return 'சித்த யோகம்';
  }
  return 'சித்த யோகம்';
}

// Inauspicious & Auspicious Times per Weekday
const WEEKDAY_TIMES: Record<number, {
  rahu: TimeInterval;
  yama: TimeInterval;
  kuli: TimeInterval;
  nallaMorning: TimeInterval;
  nallaEvening: TimeInterval;
  gowriMorning: TimeInterval;
  gowriEvening: TimeInterval;
  soolam: { direction: string; parigaram: string };
}> = {
  0: { // Sunday
    rahu: { start: '16:30', end: '18:00' },
    yama: { start: '12:00', end: '13:30' },
    kuli: { start: '15:00', end: '16:30' },
    nallaMorning: { start: '07:30', end: '08:30' },
    nallaEvening: { start: '15:30', end: '16:30' },
    gowriMorning: { start: '10:30', end: '11:30' },
    gowriEvening: { start: '21:30', end: '22:30' },
    soolam: { direction: 'மேற்கு (West)', parigaram: 'வெல்லம் (Jaggery)' },
  },
  1: { // Monday
    rahu: { start: '07:30', end: '09:00' },
    yama: { start: '10:30', end: '12:00' },
    kuli: { start: '13:30', end: '15:00' },
    nallaMorning: { start: '06:30', end: '07:30' },
    nallaEvening: { start: '16:30', end: '17:30' },
    gowriMorning: { start: '09:30', end: '10:30' },
    gowriEvening: { start: '19:30', end: '20:30' },
    soolam: { direction: 'கிழக்கு (East)', parigaram: 'தயிர் (Curd)' },
  },
  2: { // Tuesday
    rahu: { start: '15:00', end: '16:30' },
    yama: { start: '09:00', end: '10:30' },
    kuli: { start: '12:00', end: '13:30' },
    nallaMorning: { start: '07:30', end: '08:30' },
    nallaEvening: { start: '16:30', end: '17:30' },
    gowriMorning: { start: '10:30', end: '11:30' },
    gowriEvening: { start: '19:30', end: '20:30' },
    soolam: { direction: 'வடக்கு (North)', parigaram: 'பால் (Milk)' },
  },
  3: { // Wednesday
    rahu: { start: '12:00', end: '13:30' },
    yama: { start: '07:30', end: '09:00' },
    kuli: { start: '10:30', end: '12:00' },
    nallaMorning: { start: '09:30', end: '10:30' },
    nallaEvening: { start: '16:30', end: '17:30' },
    gowriMorning: { start: '13:30', end: '14:30' },
    gowriEvening: { start: '21:30', end: '22:30' },
    soolam: { direction: 'வடக்கு (North)', parigaram: 'பால் (Milk)' },
  },
  4: { // Thursday
    rahu: { start: '13:30', end: '15:00' },
    yama: { start: '06:00', end: '07:30' },
    kuli: { start: '09:00', end: '10:30' },
    nallaMorning: { start: '09:30', end: '10:30' },
    nallaEvening: { start: '14:30', end: '15:30' },
    gowriMorning: { start: '12:30', end: '13:30' },
    gowriEvening: { start: '18:30', end: '19:30' },
    soolam: { direction: 'தெற்கு (South)', parigaram: 'தைலம் / எண்ணெய் (Oil)' },
  },
  5: { // Friday
    rahu: { start: '10:30', end: '12:00' },
    yama: { start: '15:00', end: '16:30' },
    kuli: { start: '07:30', end: '09:00' },
    nallaMorning: { start: '09:30', end: '10:30' },
    nallaEvening: { start: '16:30', end: '17:30' },
    gowriMorning: { start: '13:30', end: '14:30' },
    gowriEvening: { start: '18:30', end: '19:30' },
    soolam: { direction: 'மேற்கு (West)', parigaram: 'வெல்லம் (Jaggery)' },
  },
  6: { // Saturday
    rahu: { start: '09:00', end: '10:30' },
    yama: { start: '13:30', end: '15:00' },
    kuli: { start: '06:00', end: '07:30' },
    nallaMorning: { start: '07:30', end: '08:30' },
    nallaEvening: { start: '16:30', end: '17:30' },
    gowriMorning: { start: '10:30', end: '11:30' },
    gowriEvening: { start: '19:30', end: '20:30' },
    soolam: { direction: 'கிழக்கு (East)', parigaram: 'தயிர் (Curd)' },
  },
};

// Rich daily Thirukkural dataset
const THIRUKKURAL_COLLECTION: ThirukkuralData[] = [
  {
    number: 1,
    adhigaram: 'கடவுள் வாழ்த்து',
    adhigaramEnglish: 'The Praise of God',
    line1: 'அகர முதல எழுத்தெல்லாம் ஆதி',
    line2: 'பகவன் முதற்றே உலகு.',
    meaningTamil: 'எழுத்துக்களுக்கு முதலாவது ‘அ’கரம்; அதுபோல உலகிலுள்ள உயிர்களுக்கு முதன்மையானவர் ஆதிபகவன்.',
    meaningEnglish: 'As the letter A is the first of all letters, so the eternal God is the first in the world.',
  },
  {
    number: 31,
    adhigaram: 'அறன் வலியுறுத்தல்',
    adhigaramEnglish: 'Assertion of the Strength of Virtue',
    line1: 'சிறப்பீனும் செல்வமும் ஈனும் அறத்தினூங்கு',
    line2: 'ஆக்கம் எவனோ உயிர்க்கு.',
    meaningTamil: 'ஒருவருக்குப் புகழையும் நற்செல்வத்தையும் தரும் அறத்தைவிட மேலான நன்மை வாழ்க்கையில் வேறில்லை.',
    meaningEnglish: 'Virtue yields honor and boundless wealth; what greater fortune can life bring?',
  },
  {
    number: 61,
    adhigaram: 'அன்புடைமை',
    adhigaramEnglish: 'The Possession of Love',
    line1: 'அன்பிற்கும் உண்டோ அடைக்குந்தாழ் ஆர்வலர்',
    line2: 'புன்கணீர் பூசல் தரும்.',
    meaningTamil: 'அன்பை அடைத்து வைக்க தாழ்ப்பாள் இல்லை; அன்புடையவரின் துன்பக் கண்ணீரே அதை வெளிப்படுத்திவிடும்.',
    meaningEnglish: 'Can love be bolted down? The glistening tear of affectionate eyes proclaims it to all.',
  },
  {
    number: 102,
    adhigaram: 'செய்ந்நன்றி அறிதல்',
    adhigaramEnglish: 'Gratitude',
    line1: 'காலத்தினாற் செய்த நன்றி சிறிதெனினும்',
    line2: 'ஞாலத்தின் மாணப் பெரிது.',
    meaningTamil: 'தேவையான தக்க காலத்தில் செய்த உதவி சிறிதே ஆனாலும், அது உலகத்தை விட மிகப்பெரியதாகும்.',
    meaningEnglish: 'A timely assistance, though tiny, is immensely larger than the world itself.',
  },
  {
    number: 151,
    adhigaram: 'பொறையுடைமை',
    adhigaramEnglish: 'Forgiveness and Patience',
    line1: 'அகழ்வாரைத் தாங்கும் நிலம்போலத் தம்மை',
    line2: 'இகழ்வார்ப் பொறுத்தல் தலை.',
    meaningTamil: 'தன்னைத் தோண்டுபவரையும் தாங்கும் பூமியைப்போல, தன்னை இகழ்பவரையும் பொறுத்துக் கொள்வதே உயர்ந்த பண்பு.',
    meaningEnglish: 'To bear with those who revile us, just as the earth bears up those who dig into it, is supreme.',
  },
  {
    number: 291,
    adhigaram: 'வாய்மை',
    adhigaramEnglish: 'Truthfulness',
    line1: 'வாய்மை எனப்படுவது யாதெனின் யாதொன்றும்',
    line2: 'தீமை இலாத சொலல்.',
    meaningTamil: 'வாய்மை என்பது யாருக்கும் எவ்வகையிலும் சிறிதும் தீமை தராத நற்சொற்களைக் கூறுவதே ஆகும்.',
    meaningEnglish: 'Truthfulness is speaking words that do not cause harm to any living soul.',
  },
  {
    number: 391,
    adhigaram: 'கல்வி',
    adhigaramEnglish: 'Learning',
    line1: 'கற்க கசடறக் கற்பவை கற்றபின்',
    line2: 'நிற்க அதற்குத் தக.',
    meaningTamil: 'கற்க வேண்டிய நூல்களைப் பிழையறக் கற்க வேண்டும்; கற்ற பிறகு அதன்படி வாழ்க்கையில் நடக்க வேண்டும்.',
    meaningEnglish: 'Learn thoroughly whatever you learn, and thereafter walk strictly in accordance with what you learned.',
  },
  {
    number: 400,
    adhigaram: 'கல்வி',
    adhigaramEnglish: 'Learning',
    line1: 'கேடில் விழுச்செல்வம் கல்வி ஒருவற்கு',
    line2: 'மாடல்ல மற்றை யவை.',
    meaningTamil: 'ஒருவனுக்கு அழிவில்லாத சிறந்த செல்வம் கல்வியே; மற்ற பொருட்கள் எல்லாம் உண்மையான செல்வம் ஆகாது.',
    meaningEnglish: 'Learning is the true imperishable wealth for anyone; other earthly possessions are not real riches.',
  },
  {
    number: 595,
    adhigaram: 'ஊக்கமுடைமை',
    adhigaramEnglish: 'Energy and Determination',
    line1: 'வெள்ளத் தனைய மலர்நீட்டம் மாந்தர்தம்',
    line2: 'உள்ளத் தனைய துயர்வு.',
    meaningTamil: 'நீரின் அளவுக்கு ஏற்ப மலர்கள் உயர்ந்து மலரும்; அதுபோல மனிதரின் ஊக்கத்தின் அளவுக்கு ஏற்ப வாழ்க்கை உயரும்.',
    meaningEnglish: 'The lotus stem stretches to water level; so does man’s greatness match the depth of his determination.',
  },
  {
    number: 619,
    adhigaram: 'ஆள்வினையுடைமை',
    adhigaramEnglish: 'Manly Effort',
    line1: 'தெய்வத்தான் ஆகா தெனினும் முயற்சிதன்',
    line2: 'மெய்வருத்தக் கூலி தரும்.',
    meaningTamil: 'விதியால் ஒரு செயல் நடக்காவிட்டாலும், கடினமான உடல் உழைப்பும் முயற்சியும் அதற்குரிய பலனைத் தவறாமல் தரும்.',
    meaningEnglish: 'Even if divine fate denies success, honest persevering labor unfailingly yields its reward.',
  },
  {
    number: 620,
    adhigaram: 'ஆள்வினையுடைமை',
    adhigaramEnglish: 'Manly Effort',
    line1: 'ஊழையும் உப்பக்கம் காண்பர் உலைவின்றித்',
    line2: 'தாழாது உஞற்று பவர்.',
    meaningTamil: 'மனம் தளராமல் விடாமுயற்சியோடு உழைப்பவர்கள், எதிர்கொள்ளும் விதியையும் புறமுதுகிட்டு ஓடச் செய்வர்.',
    meaningEnglish: 'Those who strive relentlessly without drooping will surely triumph over adverse fate.',
  },
  {
    number: 666,
    adhigaram: 'வினைத்திட்பம்',
    adhigaramEnglish: 'Resolution and Focus',
    line1: 'எண்ணிய எண்ணியாங்கு எய்துப எண்ணியார்',
    line2: 'திண்ணியர் ஆகப் பெறின்.',
    meaningTamil: 'எண்ணிய காரியத்தில் ஒருவர் உறுதியோடு செயல்பட்டால், நினைத்ததை நினைத்தபடியே நிச்சயம் சாதிக்கலாம்.',
    meaningEnglish: 'Men achieve exactly what they intended if their will remains unflinchingly firm.',
  },
];

/**
 * Astronomical Ephemeris Offline Helper
 */
function getJulianDate(date: Date): number {
  let y = date.getFullYear();
  let m = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours() + date.getMinutes() / 60;

  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5 + hour / 24;
}

export class TamilCalendarService {
  /**
   * Calculates complete Daily Tamil Calendar and Panchangam for any Gregorian Date.
   */
  public static getDailyCalendar(inputDate: Date = new Date()): DailyCalendarData {
    // Clone date and anchor to 06:00 AM local time for standard Sunrise panchang reference
    const anchorDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate(), 6, 0, 0);

    const jd = getJulianDate(anchorDate);
    const d = jd - 2451545.0; // days since J2000.0
    const T = d / 36525; // Julian centuries

    // Lahiri Ayanamsa calculation
    const ayanamsa = 23.8580556 + 1.3969713 * T;

    // Sun Tropical Longitude
    const L0 = 280.46646 + 0.98564736 * d;
    const M_sun = ((357.52911 + 0.98560028 * d) % 360) * (Math.PI / 180);
    const C = 1.914602 * Math.sin(M_sun) + 0.019993 * Math.sin(2 * M_sun);
    const sunTrue = (L0 + C) % 360;

    // Nirayana Sun Longitude (Sidereal)
    const siderealSun = (sunTrue - ayanamsa + 360) % 360;

    // Moon Tropical Longitude (Jean Meeus solar-lunar terms)
    const rad = Math.PI / 180;
    const L_moon = (218.3164477 + 13.17639648 * d) % 360;
    const M_m = ((134.9633964 + 13.06499295 * d) % 360) * rad;
    const D = ((297.8501921 + 12.19074912 * d) % 360) * rad;

    const pert =
      6.289 * Math.sin(M_m) +
      1.274 * Math.sin(2 * D - M_m) +
      0.658 * Math.sin(2 * D) -
      0.186 * Math.sin(M_sun) -
      0.059 * Math.sin(2 * M_m - 2 * D) -
      0.057 * Math.sin(M_m - 2 * D + M_sun) +
      0.053 * Math.sin(2 * D + M_m) +
      0.046 * Math.sin(2 * D - M_sun) +
      0.041 * Math.sin(M_m - M_sun) -
      0.035 * Math.sin(D) -
      0.031 * Math.sin(M_m + M_sun);

    const moonTrue = (L_moon + pert + 3600) % 360;
    const siderealMoon = (moonTrue - ayanamsa + 360) % 360;

    // --- 1. Tamil Month & Day ---
    const monthIndex = Math.floor(siderealSun / 30);
    const tamilMonthObj = TAMIL_MONTHS[monthIndex];
    const degInSign = siderealSun % 30;
    const tamilDay = Math.floor(degInSign) + 1;

    // --- 2. Tamil Year (60 Year Jovian Cycle) ---
    // Tamil New Year starts at Chithirai 1 (approx Apr 14)
    const gregYear = anchorDate.getFullYear();
    const isBeforeChithirai =
      anchorDate.getMonth() < 3 || (anchorDate.getMonth() === 3 && anchorDate.getDate() < 14);
    const effectiveYear = isBeforeChithirai ? gregYear - 1 : gregYear;
    // 1987 is Prabhava (index 0). 2024 is Krodhi (index 37).
    let yearIndex = (effectiveYear - 1987) % 60;
    if (yearIndex < 0) yearIndex += 60;
    const tamilYearObj = TAMIL_YEARS[yearIndex];

    // --- 3. Ayana & Ruthu ---
    // Uttarayanam: Thai to Aani (months 9, 10, 11, 0, 1, 2)
    // Dakshinayanam: Aadi to Margazhi (months 3, 4, 5, 6, 7, 8)
    const isUttarayanam = [9, 10, 11, 0, 1, 2].includes(monthIndex);
    const ayanaTamil = isUttarayanam ? 'உத்தராயணம் (Uttarayanam)' : 'தட்சிணாயணம் (Dakshinayanam)';

    const ruthuList = [
      'வசந்த ருது (இளவேனில்)', // Chithirai, Vaikasi
      'வசந்த ருது (இளவேனில்)',
      'கிரீஷ்ம ருது (முதுவேனில்)', // Aani, Aadi
      'கிரீஷ்ம ருது (முதுவேனில்)',
      'வர்ஷ ருது (கார் காலம்)', // Aavani, Purattasi
      'வர்ஷ ருது (கார் காலம்)',
      'சரத் ருது (கூதிர் காலம்)', // Aippasi, Karthigai
      'சரத் ருது (கூதிர் காலம்)',
      'ஹேமந்த ருது (முன்பனி)', // Margazhi, Thai
      'ஹேமந்த ருது (முன்பனி)',
      'சிசிர ருது (பின்பனி)', // Masi, Panguni
      'சிசிர ருது (பின்பனி)',
    ];
    const ruthuTamil = ruthuList[monthIndex];

    // Weekday info
    const dayOfWeek = anchorDate.getDay();
    const weekdayObj = WEEKDAYS[dayOfWeek];

    // --- 4. Thithi & Paksham ---
    const diff = (moonTrue - sunTrue + 360) % 360;
    const thithiIndex = Math.floor(diff / 12); // 0 to 29
    const isValarpirai = thithiIndex < 15;
    const paksham: 'வளர்பிறை' | 'தேய்பிறை' = isValarpirai ? 'வளர்பிறை' : 'தேய்பிறை';

    let thithiName = '';
    let thithiEnglish = '';
    if (thithiIndex === 14) {
      thithiName = 'பௌர்ணமி (முழு நிலவு)';
      thithiEnglish = 'Pournami (Full Moon)';
    } else if (thithiIndex === 29) {
      thithiName = 'அமாவாசை';
      thithiEnglish = 'Amavasai (New Moon)';
    } else {
      const tObj = THITHI_NAMES[thithiIndex % 15];
      thithiName = `${paksham} ${tObj.tamil}`;
      thithiEnglish = `${isValarpirai ? 'Shukla' : 'Krishna'} ${tObj.english}`;
    }

    // --- 5. Nakshatram ---
    const nakshatraIndex = Math.floor(siderealMoon / (360 / 27)); // 0 to 26
    const nakshatraObj = NAKSHATRAS[nakshatraIndex % 27];

    // --- 6. Yogams & Karanam ---
    // Nithya Yoga
    const yogaSum = (siderealSun + siderealMoon) % 360;
    const nithyaYogaIndex = Math.floor(yogaSum / (360 / 27));
    const nithyaYogam = NITHYA_YOGAS[nithyaYogaIndex % 27];

    // Auspicious Yoga (சித்த / அமிர்த / மரண யோகம்)
    const auspiciousYogam = getAuspiciousYoga(dayOfWeek, nakshatraIndex % 27);

    // Karanam
    const karanaIndex = Math.floor(diff / 6);
    let karanamName = '';
    if (karanaIndex === 0) {
      karanamName = KARANAS[10]; // Kimstughna
    } else if (karanaIndex >= 57) {
      karanamName = KARANAS[karanaIndex - 50]; // Shakuni, Chatushpada, Naga
    } else {
      karanamName = KARANAS[(karanaIndex - 1) % 7];
    }

    // --- 7. Moon Rasi & Chandrashtamam ---
    const moonRasiIndex = Math.floor(siderealMoon / 30);
    const moonRasi = RASIS[moonRasiIndex % 12];
    // Chandrashtamam is for the Rasi whose 8th house contains current Moon
    const chandrashtamaRasiIndex = (moonRasiIndex - 7 + 12) % 12;
    const chandrashtamaRasi = RASIS[chandrashtamaRasiIndex];

    // --- 8. Times (Auspicious & Inauspicious) ---
    const dayTimes = WEEKDAY_TIMES[dayOfWeek];

    // --- 9. Virathams & Festivals detection ---
    const virathams: string[] = [];
    const festivals: string[] = [];

    // Core Virathams by Thithi
    if (thithiIndex === 14) {
      virathams.push('பௌர்ணமி விரதம் (கிரிவலம்)');
    }
    if (thithiIndex === 29) {
      virathams.push('அமாவாசை தர்ப்பணம் / விரதம்');
    }
    if (thithiIndex === 12 || thithiIndex === 27) {
      virathams.push('பிரதோஷ விரதம் (சிவ வழிபாடு)');
    }
    if (thithiIndex === 5) {
      virathams.push('சஷ்டி விரதம் (முருகன் வழிபாடு)');
    }
    if (thithiIndex === 18) {
      virathams.push('சங்கடஹர சதுர்த்தி விரதம்');
    }
    if (thithiIndex === 10 || thithiIndex === 25) {
      virathams.push('ஏகாதசி விரதம் (பெருமாள் வழிபாடு)');
    }
    if (thithiIndex === 28) {
      virathams.push('மாத சிவராத்திரி விரதம்');
    }

    // Nakshatra Virathams
    if (nakshatraIndex === 2) {
      virathams.push('கார்த்திகை விரதம்');
    }
    if (nakshatraIndex === 21) {
      virathams.push('திருவோண விரதம்');
    }

    // Specific Solar Tamil Festivals
    if (monthIndex === 0 && tamilDay === 1) {
      festivals.push('தமிழ்ப் புத்தாண்டு (Tamil New Year)');
    }
    if (monthIndex === 0 && thithiIndex === 14) {
      festivals.push('சித்ரா பௌர்ணமி');
    }
    if (monthIndex === 1 && nakshatraIndex === 15) {
      festivals.push('வைகாசி விசாகம்');
    }
    if (monthIndex === 2 && nakshatraIndex === 11) {
      festivals.push('ஆனி திருமஞ்சனம்');
    }
    if (monthIndex === 3 && tamilDay === 18) {
      festivals.push('ஆடிப் பெருக்கு (18-ஆம் பெருக்கு)');
    }
    if (monthIndex === 3 && thithiIndex === 29) {
      festivals.push('ஆடி அமாவாசை');
    }
    if (monthIndex === 4 && thithiIndex === 3) {
      festivals.push('விநாயகர் சதுர்த்தி');
    }
    if (monthIndex === 4 && (thithiIndex === 22 || nakshatraIndex === 3)) {
      festivals.push('ஸ்ரீ கிருஷ்ண ஜெயந்தி (கோகுலாஷ்டமி)');
    }
    if (monthIndex === 5 && dayOfWeek === 6) {
      virathams.push('புரட்டாசி சனிக்கிழமை விரதம்');
    }
    if (monthIndex === 5 && thithiIndex >= 0 && thithiIndex <= 9) {
      festivals.push('நவராத்திரி விழா');
    }
    if (monthIndex === 5 && thithiIndex === 9) {
      festivals.push('சரஸ்வதி பூஜை / ஆயுத பூஜை');
    }
    if (monthIndex === 5 && thithiIndex === 10) {
      festivals.push('விஜயதசமி');
    }
    if (monthIndex === 6 && (thithiIndex === 28 || thithiIndex === 29)) {
      festivals.push('தீபாவளித் திருநாள் (Deepavali)');
    }
    if (monthIndex === 6 && thithiIndex === 5) {
      festivals.push('கந்த சஷ்டி சூரசம்ஹாரம்');
    }
    if (monthIndex === 7 && nakshatraIndex === 2) {
      festivals.push('திருக்கார்த்திகை தீபத் திருவிழா');
    }
    if (monthIndex === 8 && thithiIndex === 10) {
      festivals.push('வைகுண்ட ஏகாதசி');
    }
    if (monthIndex === 8 && nakshatraIndex === 5) {
      festivals.push('ஆருத்ரா தரிசனம்');
    }
    if (monthIndex === 9 && tamilDay === 1) {
      festivals.push('தைப்பொங்கல் நன்னாள் (Thai Pongal)');
    }
    if (monthIndex === 9 && tamilDay === 2) {
      festivals.push('மாட்டுப் பொங்கல்');
    }
    if (monthIndex === 9 && tamilDay === 3) {
      festivals.push('காணும் பொங்கல்');
    }
    if (monthIndex === 9 && nakshatraIndex === 7) {
      festivals.push('தைப்பூச நன்னாள்');
    }
    if (monthIndex === 10 && nakshatraIndex === 9) {
      festivals.push('மாசி மகம்');
    }
    if (monthIndex === 10 && thithiIndex === 28) {
      festivals.push('மகா சிவராத்திரி');
    }
    if (monthIndex === 11 && nakshatraIndex === 11) {
      festivals.push('பங்குனி உத்திரம்');
    }

    // Subha Muhurtham day calculation heuristic
    // (Valarpirai + good yoga + not in inauspicious months/days)
    const isSubhaMuhurtham =
      isValarpirai &&
      auspiciousYogam !== 'மரண யோகம்' &&
      thithiIndex !== 7 && // Ashtami
      thithiIndex !== 8 && // Navami
      [1, 3, 4, 5].includes(dayOfWeek); // Mon, Wed, Thu, Fri

    // --- 10. Daily Thirukkural ---
    // Deterministic rotation based on day of the year
    const startOfYear = new Date(anchorDate.getFullYear(), 0, 0);
    const diffTime = anchorDate.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const kuralIndex = Math.abs(dayOfYear) % THIRUKKURAL_COLLECTION.length;
    const thirukkural = THIRUKKURAL_COLLECTION[kuralIndex];

    const dateKey = `${anchorDate.getFullYear()}-${String(anchorDate.getMonth() + 1).padStart(2, '0')}-${String(anchorDate.getDate()).padStart(2, '0')}`;

    return {
      gregorianDate: anchorDate,
      dateKey,
      tamilDate: {
        tamilYear: tamilYearObj.tamil,
        tamilYearEnglish: tamilYearObj.english,
        tamilMonth: tamilMonthObj.tamil,
        tamilMonthEnglish: tamilMonthObj.english,
        tamilDay,
        weekdayTamil: weekdayObj.tamil,
        weekdayEnglish: weekdayObj.english,
        ayanaTamil,
        ruthuTamil,
      },
      panchangam: {
        thithi: thithiName,
        paksham,
        thithiEnglish,
        nakshatram: nakshatraObj.tamil,
        nakshatramEnglish: nakshatraObj.english,
        nithyaYogam,
        auspiciousYogam,
        karanam: karanamName,
        moonRasi,
        chandrashtamaRasi,
        soolamDirection: dayTimes.soolam.direction,
        soolamParigaram: dayTimes.soolam.parigaram,
        sunrise: '06:05 AM',
        sunset: '05:58 PM',
      },
      auspiciousTimes: {
        nallaNeramMorning: dayTimes.nallaMorning,
        nallaNeramEvening: dayTimes.nallaEvening,
        gowriNallaNeramMorning: dayTimes.gowriMorning,
        gowriNallaNeramEvening: dayTimes.gowriEvening,
      },
      inauspiciousTimes: {
        rahuKaalam: dayTimes.rahu,
        yamagandam: dayTimes.yama,
        kuligai: dayTimes.kuli,
      },
      virathams,
      festivals,
      isSubhaMuhurtham,
      thirukkural,
    };
  }

  /**
   * Generates complete Month Grid and Tamil panchangam highlights for any year and month (0-indexed).
   */
  public static getMonthCalendar(year: number, month: number): MonthCalendarData {
    const today = new Date();
    const isCurrentYearMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDaysInMonth = lastDay.getDate();

    const firstDayWeekIndex = firstDay.getDay(); // 0 = Sun, ..., 6 = Sat

    const days: MonthDayItem[] = [];
    const tamilMonthsSet = new Set<string>();
    const subhaMuhurthamDays: MonthDayItem[] = [];
    const festivalsAndVirathams: MonthEventItem[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayWeekIndex - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthLastDay - i);
      const data = this.getDailyCalendar(prevDate);
      days.push({
        date: prevDate,
        dayNumber: prevDate.getDate(),
        isCurrentMonth: false,
        isToday: false,
        dailyData: data,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const data = this.getDailyCalendar(curDate);
      const isToday = isCurrentYearMonth && d === todayDate;

      tamilMonthsSet.add(data.tamilDate.tamilMonth);

      const dayItem: MonthDayItem = {
        date: curDate,
        dayNumber: d,
        isCurrentMonth: true,
        isToday,
        dailyData: data,
      };

      days.push(dayItem);

      if (data.isSubhaMuhurtham) {
        subhaMuhurthamDays.push(dayItem);
      }

      data.festivals.forEach((f) => {
        festivalsAndVirathams.push({
          day: d,
          date: curDate,
          name: f,
          type: 'festival',
        });
      });

      data.virathams.forEach((v) => {
        festivalsAndVirathams.push({
          day: d,
          date: curDate,
          name: v,
          type: 'viratham',
        });
      });
    }

    // Next month padding to fill grid to multiple of 7
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remainingDays; n++) {
      const nextDate = new Date(year, month + 1, n);
      const data = this.getDailyCalendar(nextDate);
      days.push({
        date: nextDate,
        dayNumber: n,
        isCurrentMonth: false,
        isToday: false,
        dailyData: data,
      });
    }

    const monthNamesEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const englishMonthName = `${monthNamesEn[month]} ${year}`;
    const tamilMonthNames = Array.from(tamilMonthsSet).join(' – ');

    return {
      year,
      month,
      englishMonthName,
      tamilMonthNames,
      days,
      subhaMuhurthamDays,
      festivalsAndVirathams,
    };
  }
}

