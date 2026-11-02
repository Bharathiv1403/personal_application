export interface VisualVocabularyItem {
  id: string;
  english: string;
  tamil: string;
  phonetic: string;
  partOfSpeech: string;
  imageUrl: string;
  englishSentence: string;
  tamilSentence: string;
}

export interface DayLesson {
  dayNumber: number;
  titleEnglish: string;
  titleTamil: string;
  description: string;
  grammarFocus: string;
  vocabulary: {
    english: string;
    tamil: string;
    pronunciation: string;
    example: string;
    exampleTamil: string;
  }[];
  conversationDialogue: {
    speaker: string;
    english: string;
    tamil: string;
  }[];
  practiceExercise: {
    question: string;
    tamilQuestion: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export const VISUAL_OBJECT_CARDS: VisualVocabularyItem[] = [
  {
    id: 'coffee_cup',
    english: 'Coffee Cup',
    tamil: 'காபி கோப்பை',
    phonetic: 'KAA-fee kuhp',
    partOfSpeech: 'Noun (பெயர்ச்சொல்)',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    englishSentence: 'I drink a hot cup of coffee every morning.',
    tamilSentence: 'நான் தினமும் காலையில் ஒரு சூடான காபி குடிக்கிறேன்.',
  },
  {
    id: 'laptop_work',
    english: 'Laptop',
    tamil: 'மடிக்கணினி',
    phonetic: 'LAP-top',
    partOfSpeech: 'Noun (பெயர்ச்சொல்)',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80',
    englishSentence: 'He is working on his laptop in the office.',
    tamilSentence: 'அவர் அலுவலகத்தில் தனது மடிக்கணினியில் வேலை செய்கிறார்.',
  },
  {
    id: 'book_reading',
    english: 'Book',
    tamil: 'புத்தகம்',
    phonetic: 'buuk',
    partOfSpeech: 'Noun (பெயர்ச்சொல்)',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    englishSentence: 'Reading books improves your English vocabulary.',
    tamilSentence: 'புத்தகங்கள் படிப்பது உங்கள் ஆங்கில சொல்லகராதியை மேம்படுத்தும்.',
  },
  {
    id: 'wrist_watch',
    english: 'Wristwatch',
    tamil: 'கைக்கடிகாரம்',
    phonetic: 'RIST-wahch',
    partOfSpeech: 'Noun (பெயர்ச்சொல்)',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    englishSentence: 'Always check the time on your wristwatch to be punctual.',
    tamilSentence: 'நேரத்தை சரியாகக் கடைப்பிடிக்க எப்போதும் உங்கள் கைக்கடிகாரத்தைப் பாருங்கள்.',
  },
  {
    id: 'headphones',
    english: 'Headphones',
    tamil: 'தலையணி ஒலிபெருக்கி (ஹெட்போன்)',
    phonetic: 'HED-fohnz',
    partOfSpeech: 'Noun (பெயர்ச்சொல்)',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    englishSentence: 'Put on your headphones to listen to English podcasts.',
    tamilSentence: 'ஆங்கில பாட்காஸ்ட்களைக் கேட்க உங்கள் ஹெட்போனை அணியுங்கள்.',
  },
  {
    id: 'water_bottle',
    english: 'Water Bottle',
    tamil: 'தண்ணீர் பாட்டில்',
    phonetic: 'WAH-ter BAH-tuhl',
    partOfSpeech: 'Noun (பெயர்ச்சொல்)',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
    englishSentence: 'Drink clean water from your water bottle throughout the day.',
    tamilSentence: 'நாள் முழுவதும் உங்கள் தண்ணீர் பாட்டிலில் இருந்து சுத்தமான தண்ணீரைக் குடியுங்கள்.',
  },
  {
    id: 'bicycle',
    english: 'Bicycle',
    tamil: 'மிதிவண்டி (சைக்கிள்)',
    phonetic: 'BY-sih-kuhl',
    partOfSpeech: 'Noun (பெயர்ச்சொல்)',
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80',
    englishSentence: 'Riding a bicycle is great exercise for healthy lungs.',
    tamilSentence: 'சைக்கிள் ஓட்டுவது ஆரோக்கியமான உடலுக்கு ஒரு சிறந்த உடற்பயிற்சி.',
  },
  {
    id: 'indoor_plant',
    english: 'Indoor Plant',
    tamil: 'உட்புற அலங்காரச் செடி',
    phonetic: 'IN-dor plant',
    partOfSpeech: 'Noun (பெயர்ச்சொல்)',
    imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80',
    englishSentence: 'This indoor plant purifies the room air.',
    tamilSentence: 'இந்த உட்புற செடி அறையின் காற்றை சுத்தப்படுத்துகிறது.',
  },
];

export const DAILY_PRACTICE_CURRICULUM: DayLesson[] = [
  {
    dayNumber: 1,
    titleEnglish: 'Day 1: Greetings & Self-Introduction',
    titleTamil: 'நாள் 1: வணக்கம் & சுய அறிமுகம்',
    description: 'Learn how to greet someone confidently and introduce your name, hometown, and career in clear English.',
    grammarFocus: 'Simple Present Tense ("I am...", "My name is...", "I live in...")',
    vocabulary: [
      {
        english: 'Greeting',
        tamil: 'வணக்கம் / வாழ்த்து',
        pronunciation: 'GREE-ting',
        example: 'A warm greeting makes people smile.',
        exampleTamil: 'ஒரு அன்பான வாழ்த்து மக்களை சிரிக்க வைக்கிறது.',
      },
      {
        english: 'Self-Introduction',
        tamil: 'சுய அறிமுகம்',
        pronunciation: 'self in-truh-DUHK-shuhn',
        example: 'Give a brief self-introduction in the interview.',
        exampleTamil: 'நேர்காணலில் உங்களைப் பற்றிய சிறிய சுய அறிமுகம் கொடுங்கள்.',
      },
      {
        english: 'Confidence',
        tamil: 'நம்பிக்கை / தைரியம்',
        pronunciation: 'KAHN-fih-duhns',
        example: 'Speak English with high confidence.',
        exampleTamil: 'முழு நம்பிக்கையுடன் ஆங்கிலத்தில் பேசுங்கள்.',
      },
      {
        english: 'Profession',
        tamil: 'தொழில் / பணி',
        pronunciation: 'pruh-FESH-uhn',
        example: 'My profession is software development.',
        exampleTamil: 'எனது தொழில் மென்பொருள் உருவாக்கம்.',
      },
      {
        english: 'Hometown',
        tamil: 'சொந்த ஊர்',
        pronunciation: 'HOHM-town',
        example: 'Chennai is my hometown.',
        exampleTamil: 'சென்னை எனது சொந்த ஊர்.',
      },
    ],
    conversationDialogue: [
      {
        speaker: 'A (Arun)',
        english: 'Hello! Good morning. My name is Arun. Nice to meet you.',
        tamil: 'வணக்கம்! காலை வணக்கம். என் பெயர் அருண். உங்களை சந்தித்ததில் மகிழ்ச்சி.',
      },
      {
        speaker: 'B (Priya)',
        english: 'Good morning Arun! I am Priya. Nice to meet you too. Where are you from?',
        tamil: 'காலை வணக்கம் அருண்! நான் பிரியா. உங்களை சந்தித்ததிலும் மகிழ்ச்சி. நீங்கள் எங்கிருந்து வருகிறீர்கள்?',
      },
      {
        speaker: 'A (Arun)',
        english: 'I am from Chennai, and I work as an engineer. What about you?',
        tamil: 'நான் சென்னையில் வசிக்கிறேன், பொறியாளராக வேலை செய்கிறேன். நீங்கள் என்ன செய்கிறீர்கள்?',
      },
      {
        speaker: 'B (Priya)',
        english: 'I live in Bangalore. I am learning English to grow in my career!',
        tamil: 'நான் பெங்களூரில் வசிக்கிறேன். என் பணியில் முன்னேற நான் ஆங்கிலம் கற்கிறேன்!',
      },
    ],
    practiceExercise: [
      {
        question: 'Choose the correct greeting for 9:00 AM:',
        tamilQuestion: 'காலை 9:00 மணிக்கு சரியான வாழ்த்தைத் தேர்ந்தெடுக்கவும்:',
        options: ['Good evening', 'Good morning', 'Good night', 'Goodbye'],
        correctIndex: 1,
        explanation: '"Good morning" is used before 12:00 PM (noon).',
      },
      {
        question: 'How do you say "நான் சென்னையில் வசிக்கிறேன்" in English?',
        tamilQuestion: '"நான் சென்னையில் வசிக்கிறேன்" என்பதை ஆங்கிலத்தில் எப்படிச் சொல்வது?',
        options: ['I live in Chennai', 'I was Chennai', 'I go Chennai', 'Chennai is mine'],
        correctIndex: 0,
        explanation: 'We use "I live in [City]" to describe our residence.',
      },
      {
        question: 'When introducing yourself, the best phrase is:',
        tamilQuestion: 'உங்களை அறிமுகப்படுத்தும்போது சிறந்த வாக்கியம் எது?',
        options: ['Myself is Arun', 'My name is Arun', 'Me Arun', 'I am name Arun'],
        correctIndex: 1,
        explanation: '"My name is..." or "I am..." is standard and grammatically polite.',
      },
    ],
  },
  {
    dayNumber: 2,
    titleEnglish: 'Day 2: Morning Routine & Daily Habits',
    titleTamil: 'நாள் 2: காலை பழக்கவழக்கங்கள் & அன்றாட பணிகள்',
    description: 'Learn everyday verbs and sentences to describe your morning habits and schedules.',
    grammarFocus: 'Habitual Actions & Adverbs of Frequency (always, usually, every day)',
    vocabulary: [
      {
        english: 'Wake up',
        tamil: 'விழித்தெழுதல்',
        pronunciation: 'wayk uhp',
        example: 'I wake up at 6:00 AM every day.',
        exampleTamil: 'நான் தினமும் காலை 6:00 மணிக்கு விழித்தெழுகிறேன்.',
      },
      {
        english: 'Breakfast',
        tamil: 'காலை உணவு',
        pronunciation: 'BREK-fuhst',
        example: 'Never skip your healthy breakfast.',
        exampleTamil: 'உங்கள் ஆரோக்கியமான காலை உணவை ஒருபோதும் தவிர்க்காதீர்கள்.',
      },
      {
        english: 'Exercise',
        tamil: 'உடற்பயிற்சி',
        pronunciation: 'EK-ser-syz',
        example: 'Morning exercise keeps the body energetic.',
        exampleTamil: 'காலை உடற்பயிற்சி உடலை உற்சாகமாக வைத்திருக்கும்.',
      },
      {
        english: 'Commute',
        tamil: 'பயணம் செய்தல் (வேலைக்கு)',
        pronunciation: 'kuh-MYOOT',
        example: 'I commute to work by metro train.',
        exampleTamil: 'நான் மெட்ரோ ரயில் மூலம் வேலைக்கு பயணம் செய்கிறேன்.',
      },
    ],
    conversationDialogue: [
      {
        speaker: 'John',
        english: 'What time do you usually wake up?',
        tamil: 'வழக்கமாக நீங்கள் எத்தனை மணிக்கு எழுந்திருப்பீர்கள்?',
      },
      {
        speaker: 'Karthik',
        english: 'I usually wake up at 6:30 AM, drink warm water, and do yoga.',
        tamil: 'நான் வழக்கமாக காலை 6:30 மணிக்கு எழுந்து, வெந்நீர் குடித்து யோகா செய்வேன்.',
      },
      {
        speaker: 'John',
        english: 'That is great! What do you have for breakfast?',
        tamil: 'மிக நன்று! காலை உணவாக என்ன சாப்பிடுவீர்கள்?',
      },
      {
        speaker: 'Karthik',
        english: 'I love having idli or dosa with coconut chutney.',
        tamil: 'எனக்கு தேங்காய் சட்னியுடன் இட்லி அல்லது தோசை சாப்பிட பிடிக்கும்.',
      },
    ],
    practiceExercise: [
      {
        question: 'Which word means "காலை உணவு"?',
        tamilQuestion: '"காலை உணவு" என்பதன் ஆங்கில சொல் எது?',
        options: ['Dinner', 'Breakfast', 'Lunch', 'Snack'],
        correctIndex: 1,
        explanation: 'Breakfast is the first meal eaten in the morning.',
      },
      {
        question: '"I ____ up at 6 AM every day."',
        tamilQuestion: 'சரியான சொல்லை நிரப்புக: "I ____ up at 6 AM every day."',
        options: ['wake', 'waking', 'woke', 'woken'],
        correctIndex: 0,
        explanation: 'For daily routines with "I", use base verb "wake".',
      },
    ],
  },
  {
    dayNumber: 3,
    titleEnglish: 'Day 3: Office & Workplace Communication',
    titleTamil: 'நாள் 3: அலுவலக உரையாடல்கள் & பணிகள்',
    description: 'Master professional vocabulary, asking questions in meetings, and emailing colleagues.',
    grammarFocus: 'Modal Verbs for Politeness ("Could you please...", "Would you mind...", "May I...")',
    vocabulary: [
      {
        english: 'Colleague',
        tamil: 'சக ஊழியர் (உடன் பணிபுரிபவர்)',
        pronunciation: 'KAH-leeg',
        example: 'My colleagues are very supportive.',
        exampleTamil: 'எனது சக ஊழியர்கள் மிகவும் உதவிபுரிகிறார்கள்.',
      },
      {
        english: 'Deadline',
        tamil: 'இறுதி நாள் / கெடு',
        pronunciation: 'DED-lyn',
        example: 'We must submit the project before the deadline.',
        exampleTamil: 'கெடு முடிவதற்குள் நாம் இந்த திட்டத்தை சமர்ப்பிக்க வேண்டும்.',
      },
      {
        english: 'Meeting',
        tamil: 'கூட்டம் / ஆலோசனைக் கூட்டம்',
        pronunciation: 'MEE-ting',
        example: 'Our team meeting starts at 11:00 AM.',
        exampleTamil: 'எங்கள் குழு கூட்டம் காலை 11:00 மணிக்கு தொடங்குகிறது.',
      },
      {
        english: 'Presentation',
        tamil: 'விளக்கக்காட்சி',
        pronunciation: 'preh-zuhn-TAY-shuhn',
        example: 'She delivered an excellent presentation.',
        exampleTamil: 'அவர் ஒரு சிறந்த விளக்கக்காட்சியை வழங்கினார்.',
      },
    ],
    conversationDialogue: [
      {
        speaker: 'Manager',
        english: 'Could you please update me on today’s project progress?',
        tamil: 'இன்றைய திட்டத்தின் முன்னேற்றம் பற்றி எனக்கு தெரிவிக்க முடியுமா?',
      },
      {
        speaker: 'Developer',
        english: 'Yes, sure! I have completed the login feature and pushed the code.',
        tamil: 'கண்டிப்பாக! நான் லாகின் அம்சத்தை முடித்து கோடை அனுப்பிவிட்டேன்.',
      },
      {
        speaker: 'Manager',
        english: 'Great job! Let us review it in the afternoon meeting.',
        tamil: 'அற்புதம்! மதியக் கூட்டத்தில் அதை நாம் மதிப்பாய்வு செய்வோம்.',
      },
    ],
    practiceExercise: [
      {
        question: 'Which is the most polite way to ask for help?',
        tamilQuestion: 'உதவி கேட்க மிகவும் கண்ணியமான வழி எது?',
        options: ['Do this now!', 'Could you please help me with this?', 'Help me quick!', 'Give me this.'],
        correctIndex: 1,
        explanation: '"Could you please..." is professional and polite in office settings.',
      },
    ],
  },
  {
    dayNumber: 4,
    titleEnglish: 'Day 4: Asking for Directions & Travel',
    titleTamil: 'நாள் 4: வழிகள் கேட்டல் & பயண உரையாடல்',
    description: 'Learn how to ask for locations, distance, and tickets while traveling.',
    grammarFocus: 'Prepositions of Place (near, next to, opposite, across, between)',
    vocabulary: [
      {
        english: 'Direction',
        tamil: 'திசை / வழி',
        pronunciation: 'dih-REK-shuhn',
        example: 'Could you tell me the direction to the railway station?',
        exampleTamil: 'ரயில் நிலையத்திற்கு செல்லும் வழியைச் சொல்ல முடியுமா?',
      },
      {
        english: 'Nearby',
        tamil: 'அருகில்',
        pronunciation: 'NEER-by',
        example: 'Is there any pharmacy nearby?',
        exampleTamil: 'அருகில் ஏதேனும் மருந்தகம் உள்ளதா?',
      },
      {
        english: 'Straight ahead',
        tamil: 'நேராக முன்னால்',
        pronunciation: 'strayt uh-HED',
        example: 'Go straight ahead and turn left at the signal.',
        exampleTamil: 'நேராகச் சென்று சிக்னலில் இடதுபுறம் திரும்புங்கள்.',
      },
    ],
    conversationDialogue: [
      {
        speaker: 'Traveler',
        english: 'Excuse me, where is the nearest metro station?',
        tamil: 'மன்னிக்கவும், மிக அருகில் உள்ள மெட்ரோ நிலையம் எங்கே இருக்கிறது?',
      },
      {
        speaker: 'Local',
        english: 'Walk straight for 200 meters. It is right opposite the supermarket.',
        tamil: 'நேராக 200 மீட்டர் நடங்கள். அது பல்பொருள் அங்காடிக்கு நேர் எதிரே உள்ளது.',
      },
    ],
    practiceExercise: [
      {
        question: 'What does "Right opposite" mean in Tamil?',
        tamilQuestion: '"Right opposite" என்பதன் தமிழ் அர்த்தம் என்ன?',
        options: ['பின்புறம்', 'நேர் எதிரே', 'அருகில்', 'மேலே'],
        correctIndex: 1,
        explanation: '"Opposite" means directly facing on the other side.',
      },
    ],
  },
  {
    dayNumber: 5,
    titleEnglish: 'Day 5: Shopping, Supermarket & Ordering Food',
    titleTamil: 'நாள் 5: ஷாப்பிங் & உணவக உரையாடல்கள்',
    description: 'Expressing preferences, inquiring about prices, and ordering at restaurants.',
    grammarFocus: 'Quantifiers (How much, How many, Some, Any)',
    vocabulary: [
      {
        english: 'Discount',
        tamil: 'தள்ளுபடி',
        pronunciation: 'DIS-kownt',
        example: 'Is there any festive discount on this item?',
        exampleTamil: 'இந்த பொருளுக்கு ஏதேனும் பண்டிகை தள்ளுபடி உள்ளதா?',
      },
      {
        english: 'Delicious',
        tamil: 'மிகவும் சுவையான',
        pronunciation: 'dih-LISH-uhs',
        example: 'This South Indian thali is delicious.',
        exampleTamil: 'இந்த தென்னிந்திய சாப்பாடு மிகவும் சுவையாக உள்ளது.',
      },
      {
        english: 'Bill / Check',
        tamil: 'கட்டண ரசீது',
        pronunciation: 'bil',
        example: 'Could we get the bill, please?',
        exampleTamil: 'கட்டண ரசீதை கொடுக்க முடியுமா?',
      },
    ],
    conversationDialogue: [
      {
        speaker: 'Waiter',
        english: 'Good evening! What would you like to order today?',
        tamil: 'மாலை வணக்கம்! இன்று என்ன ஆர்டர் செய்ய விரும்புகிறீர்கள்?',
      },
      {
        speaker: 'Customer',
        english: 'I would like a plate of veg fried rice and fresh lime juice.',
        tamil: 'எனக்கு ஒரு தட்டு வெஜ் ஃப்ரைட் ரைஸ் மற்றும் எலுமிச்சை சாறு வேண்டும்.',
      },
    ],
    practiceExercise: [
      {
        question: 'How do you ask the price of a shirt?',
        tamilQuestion: 'ஒரு சட்டையின் விலையை எப்படிக் கேட்பது?',
        options: ['How much is this shirt?', 'How many is shirt?', 'What price is it clothes?', 'Give shirt.'],
        correctIndex: 0,
        explanation: 'We use "How much is this..." for price.',
      },
    ],
  },
  {
    dayNumber: 6,
    titleEnglish: 'Day 6: Phone Calls & Digital Messaging',
    titleTamil: 'நாள் 6: தொலைபேசி & வாட்ஸ்அப் மெசேஜ்கள்',
    description: 'Speaking politely on phone calls, handling bad connections, and voice notes.',
    grammarFocus: 'Phone etiquette ("May I speak to...", "Hold on a second...", "Can you hear me?")',
    vocabulary: [
      {
        english: 'Available',
        tamil: 'கிடைக்கக்கூடிய / பேச இயலும் நிலை',
        pronunciation: 'uh-VAY-luh-buhl',
        example: 'Are you available for a quick 5-minute call?',
        exampleTamil: 'ஒரு சிறிய 5 நிமிட அழைப்பிற்கு நீங்கள் பேச இயலுமா?',
      },
      {
        english: 'Audible',
        tamil: 'கேட்கக்கூடியதாக',
        pronunciation: 'AW-dih-buhl',
        example: 'Your voice is not clearly audible.',
        exampleTamil: 'உங்கள் குரல் தெளிவாக கேட்கவில்லை.',
      },
    ],
    conversationDialogue: [
      {
        speaker: 'Caller',
        english: 'Hi Suresh, am I audible to you?',
        tamil: 'வணக்கம் சுரேஷ், என் குரல் உங்களுக்கு கேட்கிறதா?',
      },
      {
        speaker: 'Receiver',
        english: 'Yes, your voice is crystal clear now. How can I help you?',
        tamil: 'ஆம், உங்கள் குரல் இப்போது மிகத் தெளிவாக கேட்கிறது. நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?',
      },
    ],
    practiceExercise: [
      {
        question: 'When the line breaks up, what should you say?',
        tamilQuestion: 'போன் இணைப்பு சரியாக இல்லாத போது என்ன சொல்ல வேண்டும்?',
        options: ['You are breaking up, could you repeat?', 'Stop talking!', 'You wrong.', 'Go away.'],
        correctIndex: 0,
        explanation: '"You are breaking up" is the natural phrase for intermittent audio.',
      },
    ],
  },
  {
    dayNumber: 7,
    titleEnglish: 'Day 7: Weekly Speaking & Rapid Fluency Challenge',
    titleTamil: 'நாள் 7: வாராந்திர மறுபார்வை & சரளப் பேச்சு சவால்',
    description: 'Review everything from Days 1 to 6 and test your speaking speed and accuracy.',
    grammarFocus: 'Fluency, sentence connectors (because, so, however, moreover)',
    vocabulary: [
      {
        english: 'Fluency',
        tamil: 'தடையில்லா சரளத்தன்மை',
        pronunciation: 'FLOO-uhn-see',
        example: 'Daily practice builds English fluency.',
        exampleTamil: 'தினசரி பயிற்சி ஆங்கிலத்தில் சரளமாகப் பேச உதவும்.',
      },
      {
        english: 'Opportunity',
        tamil: 'வாய்ப்பு',
        pronunciation: 'ah-per-TOO-nih-tee',
        example: 'English opens up global career opportunities.',
        exampleTamil: 'ஆங்கிலம் சர்வதேச வேலை வாய்ப்புகளைத் திறந்து விடுகிறது.',
      },
    ],
    conversationDialogue: [
      {
        speaker: 'Mentor',
        english: 'Congratulations on completing Week 1 of your English practice!',
        tamil: 'உங்கள் முதல் வார ஆங்கிலப் பயிற்சியை முடித்ததற்கு வாழ்த்துகள்!',
      },
      {
        speaker: 'Learner',
        english: 'Thank you! I feel much more confident speaking in English now.',
        tamil: 'நன்றி! இப்போது ஆங்கிலத்தில் பேசும்போது எனக்கு அதிக நம்பிக்கை இருக்கிறது.',
      },
    ],
    practiceExercise: [
      {
        question: 'What is the secret to English fluency?',
        tamilQuestion: 'ஆங்கிலத்தில் சரளமாக பேசுவதற்கான ரகசியம் என்ன?',
        options: ['Daily speaking practice', 'Never talking', 'Only memorizing words', 'Speaking once a year'],
        correctIndex: 0,
        explanation: 'Consistent daily speaking practice builds confidence and automatic recall.',
      },
    ],
  },
];
