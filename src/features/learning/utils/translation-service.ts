import { AIService } from '@/core/utils/ai-service';

export interface TranslationResult {
  sourceText: string;
  translatedText: string;
  sourceLang: 'en' | 'ta';
  targetLang: 'en' | 'ta';
  beVerbNote?: string;
  wordsBreakdown?: { en: string; ta: string }[];
}

// Common offline dictionary for instant response when network is weak
const OFFLINE_DICTIONARY: Record<string, string> = {
  // English to Tamil
  'hello': 'வணக்கம்',
  'hi': 'வணக்கம்',
  'thank you': 'நன்றி',
  'thanks': 'நன்றி',
  'welcome': 'வரவேற்கிறோம்',
  'good morning': 'காலை வணக்கம்',
  'good evening': 'மாலை வணக்கம்',
  'good night': 'இரவு வணக்கம்',
  'how are you': 'நீங்கள் எப்படி இருக்கிறீர்கள்?',
  'how are you?': 'நீங்கள் எப்படி இருக்கிறீர்கள்?',
  'i am fine': 'நான் நலமாக இருக்கிறேன்',
  'i am learning english': 'நான் ஆங்கிலம் கற்றுக்கொண்டிருக்கிறேன்',
  'i am working': 'நான் வேலை செய்கிறேன்',
  'i am happy': 'நான் மகிழ்ச்சியாக இருக்கிறேன்',
  'she is a doctor': 'அவள் ஒரு மருத்துவர்',
  'he is busy': 'அவன் பிசியாக இருக்கிறான்',
  'they are ready': 'அவர்கள் தயாராக இருக்கிறார்கள்',
  'i was tired yesterday': 'நான் நேற்று சோர்வாக இருந்தேன்',
  'we were in meeting': 'நாங்கள் கூட்டத்தில் இருந்தோம்',
  'what is your name': 'உங்கள் பெயர் என்ன?',
  'what is your name?': 'உங்கள் பெயர் என்ன?',
  'where are you going': 'நீங்கள் எங்கே செல்கிறீர்கள்?',
  'where are you going?': 'நீங்கள் எங்கே செல்கிறீர்கள்?',
  'see you later': 'பிறகு சந்திப்போம்',
  'congratulations': 'வாழ்த்துக்கள்',
  'sorry': 'மன்னிக்கவும்',
  'excuse me': 'மன்னிக்கவும்',

  // Tamil to English
  'வணக்கம்': 'Hello / Welcome',
  'நன்றி': 'Thank you',
  'காலை வணக்கம்': 'Good morning',
  'இரவு வணக்கம்': 'Good night',
  'நீங்கள் எப்படி இருக்கிறீர்கள்?': 'How are you?',
  'நீங்கள் எப்படி இருக்கிறீர்கள்': 'How are you?',
  'நான் நலமாக இருக்கிறேன்': 'I am fine',
  'உங்கள் பெயர் என்ன?': 'What is your name?',
  'உங்கள் பெயர் என்ன': 'What is your name?',
  'நான் வருகிறேன்': 'I am coming',
  'நான் வேலை செய்கிறேன்': 'I am working',
  'அவன் பிசியாக இருக்கிறான்': 'He is busy',
  'நாளை சந்திப்போம்': 'See you tomorrow',
};

export class TranslationService {
  /**
   * Detects Be Verbs in English text and provides Tamil grammar context
   */
  static detectGrammarNote(text: string): string | undefined {
    const lower = text.toLowerCase();
    const tokens = lower.split(/[\s,.;!?]+/);

    if (tokens.includes('am')) {
      return '⚡ Be Verb: "am" (நிகழ்கால இருப்பு - "நான் இருக்கிறேன்" என்று I-க்கு மட்டுமே வரும்)';
    }
    if (tokens.includes('is')) {
      return '⚡ Be Verb: "is" (நிகழ்கால ஒருமை இருப்பு - He/She/It-க்கு "இருக்கிறான்/இருக்கிறாள்/இருக்கிறது")';
    }
    if (tokens.includes('are')) {
      return '⚡ Be Verb: "are" (நிகழ்கால பன்மை இருப்பு - You/We/They-க்கு "இருக்கிறோம்/இருக்கிறார்கள்")';
    }
    if (tokens.includes('was')) {
      return '⚡ Be Verb: "was" (இறந்தகால ஒருமை நிலை - "இருந்தேன்/இருந்தது")';
    }
    if (tokens.includes('were')) {
      return '⚡ Be Verb: "were" (இறந்தகால பன்மை நிலை - "இருந்தோம்/இருந்தார்கள்")';
    }
    if (tokens.includes('been')) {
      return '⚡ Be Verb: "been" (Perfect Tense முற்றுப்பெற்ற தொடர் நிலை - Have/Has/Had been)';
    }
    if (tokens.includes('being')) {
      return '⚡ Be Verb: "being" (Continuous நிலை அல்லது Passive Voice)';
    }
    if (tokens.includes('will') && tokens.includes('be')) {
      return '⚡ Be Verb: "will be" (எதிர்கால நிலை - "இருப்பேன்/இருப்பார்கள்")';
    }
    if (tokens.includes('have') || tokens.includes('has')) {
      return '💡 Have Verb: உடைமை அல்லது Perfect Tense-ஐக் குறிக்கிறது ("கொண்டிருக்கிறேன்")';
    }
    if (tokens.includes('had')) {
      return '💡 Past Have Verb: கடந்த கால உடைமை ("வைத்திருந்தேன்")';
    }
    if (tokens.includes('do') || tokens.includes('does') || tokens.includes('did')) {
      return '💡 Do Verb: கேள்வி வாக்கியம் அல்லது எதிர்மறை வாக்கியத்திற்குப் பயன்படுகிறது';
    }
    return undefined;
  }

  /**
   * Translates text between English and Tamil
   */
  static async translate(
    text: string,
    direction: 'en-to-ta' | 'ta-to-en'
  ): Promise<TranslationResult> {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        sourceText: text,
        translatedText: '',
        sourceLang: direction === 'en-to-ta' ? 'en' : 'ta',
        targetLang: direction === 'en-to-ta' ? 'ta' : 'en',
      };
    }

    const sourceLang = direction === 'en-to-ta' ? 'en' : 'ta';
    const targetLang = direction === 'en-to-ta' ? 'ta' : 'en';

    // 1. Check Offline Quick Dictionary first for instant answer
    const lower = trimmed.toLowerCase();
    if (OFFLINE_DICTIONARY[lower]) {
      return {
        sourceText: trimmed,
        translatedText: OFFLINE_DICTIONARY[lower],
        sourceLang,
        targetLang,
        beVerbNote: direction === 'en-to-ta' ? this.detectGrammarNote(trimmed) : undefined,
      };
    }

    // 2. High-speed Google Translate endpoint
    try {
      const sl = sourceLang;
      const tl = targetLang;
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(
        trimmed
      )}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (Array.isArray(json) && Array.isArray(json[0])) {
          const translatedChunks: string[] = [];
          for (const item of json[0]) {
            if (item && item[0]) {
              translatedChunks.push(item[0]);
            }
          }
          const translatedText = translatedChunks.join('').trim();
          if (translatedText) {
            return {
              sourceText: trimmed,
              translatedText,
              sourceLang,
              targetLang,
              beVerbNote:
                direction === 'en-to-ta' ? this.detectGrammarNote(trimmed) : undefined,
            };
          }
        }
      }
    } catch {}

    // 3. Fallback to AI Service
    try {
      const aiRes = await AIService.translateText(trimmed, direction);
      if (aiRes && aiRes.trim()) {
        const clean = aiRes.replace(/^["']|["']$/g, '').trim();
        return {
          sourceText: trimmed,
          translatedText: clean,
          sourceLang,
          targetLang,
          beVerbNote: direction === 'en-to-ta' ? this.detectGrammarNote(trimmed) : undefined,
        };
      }
    } catch {}

    // 4. Default fallback if all fail
    return {
      sourceText: trimmed,
      translatedText: direction === 'en-to-ta' ? 'மொழிபெயர்ப்பு தோல்வியடைந்தது (இணைப்பை சரிபார்க்கவும்)' : 'Translation failed (check internet connection)',
      sourceLang,
      targetLang,
      beVerbNote: direction === 'en-to-ta' ? this.detectGrammarNote(trimmed) : undefined,
    };
  }
}
