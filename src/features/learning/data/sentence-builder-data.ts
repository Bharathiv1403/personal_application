export interface SentenceChallenge {
  id: string;
  category: 'be-verbs' | 'tenses' | 'daily-office' | 'questions';
  tamilSentence: string;
  englishSentence: string;
  scrambledWords: string[]; // includes distractors
  explanationTa: string;
  beVerbNote?: string;
}

export interface BeVerbDrill {
  id: string;
  sentenceWithBlank: string;
  options: string[];
  correctAnswer: string;
  tamilMeaning: string;
  ruleExplanationTa: string;
}

export const SENTENCE_BUILDER_CHALLENGES: SentenceChallenge[] = [
  {
    id: 'sb-1',
    category: 'be-verbs',
    tamilSentence: 'நான் ஒரு மென்பொருள் பொறியாளராக இருக்கிறேன்.',
    englishSentence: 'I am a software engineer',
    scrambledWords: ['software', 'am', 'I', 'engineer', 'a', 'is', 'was'],
    explanationTa: 'I வரும்போது நிகழ்காலத்தில் "am" என்ற Be Verb மட்டுமே பயன்படுத்த வேண்டும்.',
    beVerbNote: 'I + am (நான் இருக்கிறேன்)',
  },
  {
    id: 'sb-2',
    category: 'be-verbs',
    tamilSentence: 'அவள் நேற்று மிகவும் பிஸியாக இருந்தாள்.',
    englishSentence: 'She was very busy yesterday',
    scrambledWords: ['yesterday', 'was', 'She', 'busy', 'very', 'were', 'is'],
    explanationTa: 'இறந்தகாலத்தில் ஒருமை எழுவாய்க்கு (She) "was" பயன்படுத்த வேண்டும்.',
    beVerbNote: 'She + was (அவள் இருந்தாள்)',
  },
  {
    id: 'sb-3',
    category: 'be-verbs',
    tamilSentence: 'அவர்கள் கூட்ட அறையில் இருக்கிறார்கள்.',
    englishSentence: 'They are in the meeting room',
    scrambledWords: ['They', 'are', 'in', 'meeting', 'the', 'room', 'is', 'was'],
    explanationTa: 'பன்மை எழுவாய்க்கு (They) நிகழ்காலத்தில் "are" வரும்.',
    beVerbNote: 'They + are (அவர்கள் இருக்கிறார்கள்)',
  },
  {
    id: 'sb-4',
    category: 'be-verbs',
    tamilSentence: 'நாங்கள் நேற்று அலுவலகத்தில் இருந்தோம்.',
    englishSentence: 'We were at the office yesterday',
    scrambledWords: ['We', 'were', 'at', 'the', 'office', 'yesterday', 'was', 'are'],
    explanationTa: 'பன்மை எழுவாய்க்கு (We) இறந்தகாலத்தில் "were" பயன்படுத்த வேண்டும்.',
    beVerbNote: 'We + were (நாங்கள் இருந்தோம்)',
  },
  {
    id: 'sb-5',
    category: 'daily-office',
    tamilSentence: 'இன்று எனக்கு ஒரு முக்கியமான நேர்காணல் இருக்கிறது.',
    englishSentence: 'I have an important interview today',
    scrambledWords: ['I', 'have', 'an', 'important', 'interview', 'today', 'has', 'had'],
    explanationTa: 'உடைமை மற்றும் நிகழ்கால நிகழ்வைக் குறிக்க "have" பயன்படுகிறது.',
    beVerbNote: 'I + have (என்னிடம் உள்ளது / எனக்கு இருக்கிறது)',
  },
  {
    id: 'sb-6',
    category: 'be-verbs',
    tamilSentence: 'நான் மாலை 5 மணிக்கு ஃப்ரீயாக இருப்பேன்.',
    englishSentence: 'I will be free at 5 PM',
    scrambledWords: ['I', 'will', 'be', 'free', 'at', '5 PM', 'am', 'was'],
    explanationTa: 'எதிர்கால நிலையை (Future State) குறிக்க "will be" வரும்.',
    beVerbNote: 'will be (இருப்பேன்)',
  },
  {
    id: 'sb-7',
    category: 'questions',
    tamilSentence: 'நீங்கள் இப்போது எங்கே செல்கிறீர்கள்?',
    englishSentence: 'Where are you going now',
    scrambledWords: ['Where', 'are', 'you', 'going', 'now', 'is', 'do'],
    explanationTa: 'தொடர் நிகழ்காலக் கேள்வியில் Where + are + you + verb-ing வரும்.',
  },
  {
    id: 'sb-8',
    category: 'daily-office',
    tamilSentence: 'நாம் இந்த மீட்டிங்கை விரைவாக முடிக்கலாம்.',
    englishSentence: 'Let us wrap up this meeting',
    scrambledWords: ['Let', 'us', 'wrap', 'up', 'this', 'meeting', 'call', 'off'],
    explanationTa: '"Wrap up" என்பது ஒரு பணியை அல்லது மீட்டிங்கை முடிப்பதைக் குறிக்கும் Phrasal Verb ஆகும்.',
  },
  {
    id: 'sb-9',
    category: 'tenses',
    tamilSentence: 'அவன் அந்த கோப்பை அனுப்பிவிட்டான்.',
    englishSentence: 'He has sent the file',
    scrambledWords: ['He', 'has', 'sent', 'the', 'file', 'have', 'is'],
    explanationTa: 'Present Perfect: He/She/It-க்கு "has" + வினைச்சொல்லின் 3-ஆம் வடிவம் (sent) வரும்.',
  },
  {
    id: 'sb-10',
    category: 'questions',
    tamilSentence: 'உங்களுக்கு இதில் உதவ முடியுமா?',
    englishSentence: 'Can you help me with this',
    scrambledWords: ['Can', 'you', 'help', 'me', 'with', 'this', 'Could', 'Do'],
    explanationTa: 'மரியாதையுடன் அல்லது பொதுவாக உதவி கேட்க "Can you help..." பயன்படுகிறது.',
  },
];

export const BE_VERB_DRILLS: BeVerbDrill[] = [
  {
    id: 'bvd-1',
    sentenceWithBlank: 'I _____ very happy to join this team.',
    options: ['am', 'is', 'are', 'was'],
    correctAnswer: 'am',
    tamilMeaning: 'நான் இந்த அணியில் இணைந்ததில் மிகவும் மகிழ்ச்சியாக இருக்கிறேன்.',
    ruleExplanationTa: 'எழுவாய் "I" ஆக இருப்பதால் நிகழ்காலத்தில் "am" மட்டுமே வரும்.',
  },
  {
    id: 'bvd-2',
    sentenceWithBlank: 'The server _____ down for 2 hours yesterday.',
    options: ['was', 'were', 'is', 'are'],
    correctAnswer: 'was',
    tamilMeaning: 'சர்வர் நேற்று 2 மணி நேரம் முடங்கி இருந்தது.',
    ruleExplanationTa: 'Yesterday (நேற்று) என்பது கடந்த காலம்; Server என்பது ஒருமை, எனவே "was" வரும்.',
  },
  {
    id: 'bvd-3',
    sentenceWithBlank: 'They _____ discussing the project architecture right now.',
    options: ['are', 'is', 'am', 'was'],
    correctAnswer: 'are',
    tamilMeaning: 'அவர்கள் இப்போது திட்ட கட்டமைப்பைப் பற்றி விவாதிக்கிறார்கள்.',
    ruleExplanationTa: 'Right now (நிகழ்காலம்) + They (பன்மை) = "are".',
  },
  {
    id: 'bvd-4',
    sentenceWithBlank: 'We _____ waiting for the client feedback yesterday.',
    options: ['were', 'was', 'are', 'is'],
    correctAnswer: 'were',
    tamilMeaning: 'நாங்கள் நேற்று வாடிக்கையாளர் கருத்துக்காக காத்திருந்தோம்.',
    ruleExplanationTa: 'Yesterday (கடந்த காலம்) + We (பன்மை) = "were".',
  },
  {
    id: 'bvd-5',
    sentenceWithBlank: 'She _____ the best frontend developer in our company.',
    options: ['is', 'are', 'am', 'were'],
    correctAnswer: 'is',
    tamilMeaning: 'அவள் எங்கள் நிறுவனத்தின் சிறந்த முன்பக்க டெவலப்பராக இருக்கிறாள்.',
    ruleExplanationTa: 'She என்பது ஒருமை எழுவாய், நிகழ்காலத்தில் "is" வரும்.',
  },
  {
    id: 'bvd-6',
    sentenceWithBlank: 'Don\'t worry, the build _____ ready in 10 minutes.',
    options: ['will be', 'was', 'am', 'were'],
    correctAnswer: 'will be',
    tamilMeaning: 'கவலைப்படாதீர்கள், பில்ட் 10 நிமிடங்களில் தயாராகிவிடும்.',
    ruleExplanationTa: 'In 10 minutes (எதிர்காலம்) என்பதால் "will be" வர வேண்டும்.',
  },
  {
    id: 'bvd-7',
    sentenceWithBlank: 'He _____ an urgent doctor appointment this morning.',
    options: ['had', 'has', 'have', 'is'],
    correctAnswer: 'had',
    tamilMeaning: 'அவருக்கு இன்று காலை அவசர மருத்துவ சந்திப்பு இருந்தது.',
    ruleExplanationTa: 'கடந்த கால உடைமை / நிகழ்வைக் குறிக்க "had" பயன்படுகிறது.',
  },
  {
    id: 'bvd-8',
    sentenceWithBlank: '_____ you have any blockers today?',
    options: ['Do', 'Does', 'Are', 'Is'],
    correctAnswer: 'Do',
    tamilMeaning: 'இன்று உங்களுக்கு ஏதேனும் தடைகள் உள்ளதா?',
    ruleExplanationTa: 'You என்ற எழுவாய்க்கு கேள்வி கேட்க "Do" பயன்படுகிறது (Do you have...).',
  },
];
