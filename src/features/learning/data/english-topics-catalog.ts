export interface EnglishTopicItem {
  id: string;
  category: 'grammar' | 'spoken' | 'vocabulary' | 'pronunciation';
  titleEn: string;
  titleTa: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  summaryTa: string;
  formulaOrRule?: string;
  details: {
    heading: string;
    descriptionTa: string;
    rules?: string[];
    examples: {
      en: string;
      ta: string;
      breakdown?: string;
    }[];
  }[];
  commonMistakes?: {
    wrong: string;
    right: string;
    why: string;
  }[];
}

export const ALL_ENGLISH_TOPICS: EnglishTopicItem[] = [
  // =========================================================================
  // 1. BE VERBS (இருத்தலைக் குறிக்கும் வினைகள் - AM, IS, ARE, WAS, WERE, BE, BEEN, BEING)
  // =========================================================================
  {
    id: 'be-verbs',
    category: 'grammar',
    titleEn: 'Be Verbs (am, is, are, was, were, be, been, being)',
    titleTa: 'Be வினைகள் (இருத்தல் / நிலை குறிக்கும் சொற்கள்)',
    level: 'Beginner',
    summaryTa: 'ஒருவர் அல்லது ஒரு பொருள் "எப்படி இருக்கிறது", "யாராக இருக்கிறது", "எங்கே இருக்கிறது" என்று நிலையை (State of Being) குறிக்க Be Verbs பயன்படுகின்றன. ஆங்கிலத்தில் மிக முக்கியமான அடித்தளம் இதுவே.',
    formulaOrRule: 'Subject + Be Verb (am / is / are / was / were) + Noun / Adjective / Place',
    details: [
      {
        heading: '1. Present Tense Be Verbs (நிகழ்காலம்: am, is, are)',
        descriptionTa: 'தற்போதைய நிலையை குறிக்க பயன்படுகின்றன. I-க்கு "am", ஒருமைக்கு (He, She, It, Singular) "is", பன்மைக்கு (We, You, They, Plural) "are" வரும்.',
        rules: [
          'I + am ("நான் இருக்கிறேன்")',
          'He / She / It / Name + is ("அவன் / அவள் / அது இருக்கிறது")',
          'We / You / They + are ("நாங்கள் / நீங்கள் / அவர்கள் இருக்கிறார்கள்")',
        ],
        examples: [
          {
            en: 'I am a software engineer.',
            ta: 'நான் ஒரு மென்பொருள் பொறியாளராக இருக்கிறேன்.',
            breakdown: 'I (எழுவாய்) + am (இருக்கிறேன்) + a software engineer (பணி)',
          },
          {
            en: 'She is very happy today.',
            ta: 'அவள் இன்று மிகவும் மகிழ்ச்சியாக இருக்கிறாள்.',
            breakdown: 'She (அவள்) + is (இருக்கிறாள்) + very happy (மகிழ்ச்சி)',
          },
          {
            en: 'They are in the meeting room.',
            ta: 'அவர்கள் கூட்ட அறையில் இருக்கிறார்கள்.',
            breakdown: 'They (அவர்கள்) + are (இருக்கிறார்கள்) + in the meeting room (இடம்)',
          },
          {
            en: 'It is a sunny morning.',
            ta: 'இது ஒரு வெயில் நிறைந்த காலைப் பொழுது.',
          },
        ],
      },
      {
        heading: '2. Past Tense Be Verbs (இறந்தகாலம்: was, were)',
        descriptionTa: 'கடந்த காலத்தில் ஒருவர் அல்லது ஒரு பொருள் "எப்படி/எங்கே இருந்தது" என்று குறிக்க பயன்படுகின்றன. ஒருமைக்கு (I, He, She, It) "was", பன்மைக்கு (We, You, They) "were" வரும்.',
        rules: [
          'I / He / She / It + was ("இருந்தேன் / இருந்தான் / இருந்தது")',
          'We / You / They + were ("இருந்தோம் / இருந்தீர்கள் / இருந்தார்கள்")',
        ],
        examples: [
          {
            en: 'I was tired yesterday.',
            ta: 'நேற்று நான் சோர்வாக இருந்தேன்.',
            breakdown: 'I + was (இருந்தேன்) + tired (சோர்வாக)',
          },
          {
            en: 'He was in Chennai last week.',
            ta: 'அவர் கடந்த வாரம் சென்னையில் இருந்தார்.',
          },
          {
            en: 'We were at the client office.',
            ta: 'நாங்கள் வாடிக்கையாளர் அலுவலகத்தில் இருந்தோம்.',
          },
          {
            en: 'They were late to the class.',
            ta: 'அவர்கள் வகுப்பிற்கு தாமதமாக வந்திருந்தார்கள்.',
          },
        ],
      },
      {
        heading: '3. Future Tense Be Verbs (எதிர்காலம்: will be)',
        descriptionTa: 'எதிர்காலத்தில் ஒருவர் எப்படி அல்லது எங்கே "இருப்பார்/இருக்கும்" என்பதை குறிக்க "will be" பயன்படுகிறது.',
        rules: ['All Subjects (I / We / You / They / He / She / It) + will be'],
        examples: [
          {
            en: 'I will be at home tomorrow.',
            ta: 'நான் நாளை வீட்டில் இருப்பேன்.',
          },
          {
            en: 'She will be ready in 10 minutes.',
            ta: 'அவள் இன்னும் 10 நிமிடங்களில் தயாராகிவிடுவாள்.',
          },
          {
            en: 'The project will be successful.',
            ta: 'இந்த திட்டம் வெற்றிகரமாக இருக்கும்.',
          },
        ],
      },
      {
        heading: '4. Continuous & Perfect Be Verbs (being, been)',
        descriptionTa: '"Being" என்பது நிகழும் செயலின் போது இருப்பதையும், "Been" என்பது முடிவடைந்த அல்லது தொடர்ந்து வரும் செயலின் நிலையையும் குறிக்கும்.',
        rules: [
          'Being = am/is/are/was/were + being + Adjective (தற்காலிக நடத்தை)',
          'Been = have / has / had + been (நீண்ட காலமாக இருக்கும் நிலை)',
        ],
        examples: [
          {
            en: 'Why are you being so quiet?',
            ta: 'நீங்கள் ஏன் இப்போது இவ்வளவு அமைதியாக இருக்கிறீர்கள்?',
          },
          {
            en: 'I have been here for two hours.',
            ta: 'நான் இரண்டு மணி நேரமாக இங்கு இருக்கிறேன்.',
          },
        ],
      },
    ],
    commonMistakes: [
      {
        wrong: 'I am agree with you.',
        right: 'I agree with you.',
        why: '"Agree" என்பது ஒரு வினைச்சொல் (Verb). அங்கு "am" சேர்க்கத் தேவையில்லை.',
      },
      {
        wrong: 'He was present yesterday, but he is absent yesterday.',
        right: 'He was present yesterday, but he was absent.',
        why: 'நேற்று (Yesterday) நடந்த நிகழ்வுக்கு "was" மட்டுமே வர வேண்டும், "is" வரக்கூடாது.',
      },
    ],
  },

  // =========================================================================
  // 2. HAVE VERBS (உடைமை குறிக்கும் வினைகள் - HAVE, HAS, HAD)
  // =========================================================================
  {
    id: 'have-verbs',
    category: 'grammar',
    titleEn: 'Have Verbs (has, have, had)',
    titleTa: 'Have வினைகள் (உடைமை & அனுபவம் குறிக்கும் சொற்கள்)',
    level: 'Beginner',
    summaryTa: '"என்னிடம் ஒன்று இருக்கிறது", "அவரிடம் ஒரு பொருள் இருக்கிறது" அல்லது ஒரு செயல் முடிந்துவிட்டது (Perfect Tense) என்று குறிக்க Have Verbs பயன்படுகின்றன.',
    formulaOrRule: 'Present: I/We/You/They + have | He/She/It + has || Past: All + had',
    details: [
      {
        heading: 'Present Ownership (கையில் உள்ள உடைமை)',
        descriptionTa: 'I, We, You, They வந்தால் "have" வரும். He, She, It அல்லது ஒரு நபரின் பெயர் வந்தால் "has" வரும்.',
        examples: [
          {
            en: 'I have a laptop and two phones.',
            ta: 'என்னிடம் ஒரு மடிக்கணினியும் இரண்டு தொலைபேசிகளும் உள்ளன.',
          },
          {
            en: 'She has five years of experience.',
            ta: 'அவளுக்கு ஐந்து வருட அனுபவம் இருக்கிறது.',
          },
          {
            en: 'We have a meeting at 4 PM.',
            ta: 'எங்களுக்கு மாலை 4 மணிக்கு ஒரு கூட்டம் இருக்கிறது.',
          },
        ],
      },
      {
        heading: 'Past Ownership (கடந்த காலத்தில் இருந்தது: had)',
        descriptionTa: 'கடந்த காலத்தில் என்னிடம் இருந்தது அல்லது அவரிடம் இருந்தது என்று கூற "had" பயன்படுத்த வேண்டும்.',
        examples: [
          {
            en: 'I had a car last year.',
            ta: 'கடந்த வருடம் என்னிடம் ஒரு கார் இருந்தது.',
          },
          {
            en: 'They had an interview yesterday.',
            ta: 'நேற்று அவர்களுக்கு ஒரு நேர்காணல் இருந்தது.',
          },
        ],
      },
    ],
    commonMistakes: [
      {
        wrong: 'She have a new phone.',
        right: 'She has a new phone.',
        why: 'He, She, It வரும்போது எப்போதும் "has" மட்டுமே வர வேண்டும்.',
      },
    ],
  },

  // =========================================================================
  // 3. DO VERBS (செயல் & கேள்வி அமைக்கும் வினைகள் - DO, DOES, DID)
  // =========================================================================
  {
    id: 'do-verbs',
    category: 'grammar',
    titleEn: 'Do Verbs (do, does, did)',
    titleTa: 'Do வினைகள் (கேள்வி கேட்டல் & மறுத்தல்)',
    level: 'Beginner',
    summaryTa: 'ஆங்கிலத்தில் கேள்விகள் கேட்கவும் (Do you like coffee?), "இல்லை" என்று எதிர்மறையாகக் கூறவும் (I do not know) Do Verbs இன்றியமையாதவை.',
    formulaOrRule: 'Present: I/We/You/They + do | He/She/It + does || Past: All + did',
    details: [
      {
        heading: 'Present Questions & Negations (Do / Does)',
        descriptionTa: 'He/She/It-க்கு "does", மற்றவர்களுக்கு "do" வரும்.',
        examples: [
          {
            en: 'Do you speak English?',
            ta: 'நீங்கள் ஆங்கிலம் பேசுகிறீர்களா?',
          },
          {
            en: 'Does he work from home?',
            ta: 'அவர் வீட்டிலிருந்தே வேலை செய்கிறாரா?',
          },
          {
            en: 'I do not (don’t) understand this.',
            ta: 'எனக்கு இது புரியவில்லை.',
          },
          {
            en: 'She does not (doesn’t) like tea.',
            ta: 'அவளுக்கு தேநீர் பிடிக்காது.',
          },
        ],
      },
      {
        heading: 'Past Questions & Negations (Did)',
        descriptionTa: 'கடந்த காலத்தில் நடந்ததா என்று கேள்வி கேட்க "Did" பயன்படுகிறது.',
        examples: [
          {
            en: 'Did you finish your breakfast?',
            ta: 'நீங்கள் காலை உணவை முடித்துவிட்டீர்களா?',
          },
          {
            en: 'I did not receive your email.',
            ta: 'எனக்கு உங்கள் மின்னஞ்சல் வரவில்லை.',
          },
        ],
      },
    ],
    commonMistakes: [
      {
        wrong: 'Did you went there?',
        right: 'Did you go there?',
        why: '"Did" வந்த பிறகு முதன்மை வினைச்சொல் Present Form-ல் (go) தான் இருக்க வேண்டும்.',
      },
    ],
  },

  // =========================================================================
  // 4. 12 ENGLISH TENSES (முழுமையான 12 காலங்கள்)
  // =========================================================================
  {
    id: 'english-tenses',
    category: 'grammar',
    titleEn: '12 English Tenses (Present, Past, Future Masterclass)',
    titleTa: '12 ஆங்கிலக் காலங்கள் (நிகழ்காலம், இறந்தகாலம், எதிர்காலம்)',
    level: 'Intermediate',
    summaryTa: 'ஆங்கிலத்தில் காலம் அறிந்து பேசுவதே சரளத்திற்கான திறவுகோல். Simple, Continuous, Perfect, மற்றும் Perfect Continuous என 3x4 = 12 காலங்களின் தமிழ் விளக்கம்.',
    details: [
      {
        heading: 'Simple Present Tense (சாதாரண நிகழ்காலம்)',
        descriptionTa: 'தினசரி பழக்கங்கள், மாறாத உண்மைகள், பொதுவான விஷயங்களை கூற பயன்படுகிறது.',
        examples: [
          {
            en: 'I code in React Native every day.',
            ta: 'நான் தினமும் ரியாக்ட் நேட்டிவில் நிரல் எழுதுகிறேன்.',
          },
          {
            en: 'The sun rises in the east.',
            ta: 'சூரியன் கிழக்கில் உதிக்கிறது.',
          },
        ],
      },
      {
        heading: 'Present Continuous Tense (தொடர் நிகழ்காலம்)',
        descriptionTa: 'இப்போது உங்கள் கண் முன்னால் நடந்து கொண்டிருக்கும் செயல் (am/is/are + verb-ing).',
        examples: [
          {
            en: 'I am learning spoken English right now.',
            ta: 'நான் இப்போது ஆங்கிலம் படித்துக் கொண்டிருக்கிறேன்.',
          },
        ],
      },
      {
        heading: 'Present Perfect Tense (முற்றுப்பெற்ற நிகழ்காலம்)',
        descriptionTa: 'சற்று முன் அல்லது அண்மையில் முடிவடைந்த செயல் (have/has + V3).',
        examples: [
          {
            en: 'I have submitted my job application.',
            ta: 'நான் எனது வேலை விண்ணப்பத்தை சமர்ப்பித்துவிட்டேன்.',
          },
        ],
      },
      {
        heading: 'Simple Past Tense (இறந்தகாலம்)',
        descriptionTa: 'கடந்த காலத்தில் குறிப்பிட்ட நேரத்தில் நடந்து முடிந்த செயல் (V2 verb).',
        examples: [
          {
            en: 'I attended the interview yesterday.',
            ta: 'நான் நேற்று நேர்காணலில் கலந்துகொண்டேன்.',
          },
        ],
      },
      {
        heading: 'Simple Future Tense (எதிர்காலம்)',
        descriptionTa: 'இனிமேல் நடக்கவிருக்கும் ஒரு செயல் (will + base verb).',
        examples: [
          {
            en: 'I will get the job offer next week.',
            ta: 'அடுத்த வாரம் எனக்கு வேலை ஆஃபர் கிடைக்கும்.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 5. MODAL AUXILIARIES (CAN, COULD, SHOULD, WOULD, MAY, MUST)
  // =========================================================================
  {
    id: 'modal-verbs',
    category: 'grammar',
    titleEn: 'Modal Auxiliaries (Can, Could, Should, Would, May, Must)',
    titleTa: 'துணை வினைகள் (திறமை, அனுமதி, வேண்டுகோள், கடமை)',
    level: 'Intermediate',
    summaryTa: 'கண்ணியமாக வேண்டுகோள் விடுக்கவும் (Could you...), திறமையைச் சொல்லவும் (I can...), ஆலோசனைகள் கூறவும் (You should...) இவை பயன்படுகின்றன.',
    details: [
      {
        heading: 'Can vs Could (திறமை vs பணிவான வேண்டுகோள்)',
        descriptionTa: '"Can" என்பது நிகழ்கால திறமை. "Could" என்பது பணிவான கேள்வி கேட்க பயன்படுகிறது.',
        examples: [
          {
            en: 'I can build mobile applications.',
            ta: 'என்னால் மொபைல் ஆப்களை உருவாக்க முடியும்.',
          },
          {
            en: 'Could you please help me with this error?',
            ta: 'தயவுசெய்து இந்த பிழையை சரிசெய்ய உதவ முடியுமா?',
          },
        ],
      },
      {
        heading: 'Should (அறிவுரை / கடமை)',
        descriptionTa: '"நீங்கள் இதைச் செய்ய வேண்டும்" என்று நல்ல ஆலோசனை கூற "should" பயன்படும்.',
        examples: [
          {
            en: 'You should practice speaking English every day.',
            ta: 'நீங்கள் தினமும் ஆங்கிலம் பேச பயிற்சி செய்ய வேண்டும்.',
          },
        ],
      },
      {
        heading: 'Would (விருப்பம் & மரியாதை)',
        descriptionTa: 'விருப்பத்தை தெரிவிக்க "Would like to..." பயன்படும்.',
        examples: [
          {
            en: 'I would like to apply for the React Native developer role.',
            ta: 'நான் ரியாக்ட் நேட்டிவ் டெவலப்பர் பதவிக்கு விண்ணப்பிக்க விரும்புகிறேன்.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 6. SPOKEN ENGLISH: SELF-INTRODUCTION & INTERVIEWS
  // =========================================================================
  {
    id: 'spoken-self-intro',
    category: 'spoken',
    titleEn: 'Self-Introduction & Interview Elevator Pitch',
    titleTa: 'சுய அறிமுகம் & நேர்காணல் அறிமுகப் பேச்சு',
    level: 'Beginner',
    summaryTa: '"Tell me about yourself" என்ற கேள்விக்கு தயக்கமின்றி, 60 நொடிகளில் அருமையாகப் பேசும் சூத்திரம்.',
    details: [
      {
        heading: 'The 4-Step Self Introduction Formula',
        descriptionTa: '1. Greeting & Name -> 2. Native & Education -> 3. Current Role & Skills -> 4. Goal',
        examples: [
          {
            en: 'Good morning! My name is Bharathi. I am from Chennai.',
            ta: 'காலை வணக்கம்! என் பெயர் பாரதி. நான் சென்னையில் இருந்து வருகிறேன்.',
          },
          {
            en: 'I have over 2 years of experience as a Frontend Developer, specializing in React Native and TypeScript.',
            ta: 'ரியாக்ட் நேட்டிவ் மற்றும் டைப்ஸ்கிரிப்ட்டில் நிபுணத்துவம் பெற்று 2 ஆண்டுகளுக்கு மேலான அனுபவம் எனக்கு உள்ளது.',
          },
          {
            en: 'I have built real-world apps with clean architecture, offline storage, and modern UI.',
            ta: 'நான் நேரடி ஆப்ஸ்களை நேர்த்தியான வடிவமைப்புடன் உருவாக்கியுள்ளேன்.',
          },
          {
            en: 'I am excited about this opportunity to contribute to your engineering team.',
            ta: 'உங்கள் பொறியியல் குழுவிற்கு பங்காற்ற இந்த வாய்ப்பை எண்ணி நான் உற்சாகமடைகிறேன்.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 7. SPOKEN ENGLISH: OFFICE MEETINGS & DAILY STANDUP
  // =========================================================================
  {
    id: 'spoken-office-standup',
    category: 'spoken',
    titleEn: 'Agile Standup & Office Communication Phrases',
    titleTa: 'தினசரி ஸ்டாண்டப் & அலுவலகக் கூட்ட ஆங்கிலம்',
    level: 'Intermediate',
    summaryTa: 'சாப்ட்வேர் கம்பெனி மற்றும் அலுவலகக் கூட்டங்களில் தயங்காமல் பேச உதவும் நடைமுறை ஆங்கில வாக்கியங்கள்.',
    details: [
      {
        heading: 'Daily Standup Update (3 Main Questions)',
        descriptionTa: 'நேற்று என்ன செய்தீர்கள், இன்று என்ன செய்யப்போகிறீர்கள், ஏதேனும் தடைகள் உள்ளதா?',
        examples: [
          {
            en: 'Yesterday, I worked on the authentication flow and fixed the login bug.',
            ta: 'நேற்று நான் லாகின் பிழையை சரிசெய்து, அங்கீகாரப் பணிகளில் ஈடுபட்டேன்.',
          },
          {
            en: 'Today, my focus is on integrating the payments API and writing unit tests.',
            ta: 'இன்று கட்டண API-யை இணைத்து, சோதனைக் குறியீடுகளை எழுதுவதே என் நோக்கம்.',
          },
          {
            en: 'I do not have any blockers at the moment. Everything is on track.',
            ta: 'தற்போது எனக்கு எந்தத் தடைகளும் இல்லை. அனைத்தும் திட்டமிட்டபடி செல்கிறது.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 8. VOCABULARY: 25 MUST-KNOW PHRASAL VERBS
  // =========================================================================
  {
    id: 'phrasal-verbs',
    category: 'vocabulary',
    titleEn: 'High-Impact Phrasal Verbs in Daily Life',
    titleTa: 'தினசரி பயன்படும் முக்கிய கூட்டு வினைகள்',
    level: 'Intermediate',
    summaryTa: 'ஆங்கிலத்தில் ஒரு வினைச்சொல்லுடன் ஒரு Preposition சேரும்போது புதிய அர்த்தம் தரும் (எ.கா: give up = கைவிடுதல்). நேட்டிவ் ஸ்பீக்கர்கள் போல பேச இவை மிகவும் உதவும்.',
    details: [
      {
        heading: 'Top Essential Phrasal Verbs',
        descriptionTa: 'அடிக்கடி பயன்படுத்தப்படும் கூட்டுச் சொற்களும் அவற்றின் தமிழ் விளக்கமும்.',
        examples: [
          {
            en: 'Give up: Never give up on your dreams.',
            ta: 'Give up (கைவிடுதல்): உங்கள் கனவுகளை ஒருபோதும் கைவிடாதீர்கள்.',
          },
          {
            en: 'Look forward to: I look forward to meeting you.',
            ta: 'Look forward to (ஆவலுடன் எதிர்பார்த்தல்): உங்களைச் சந்திக்க ஆவலுடன் காத்திருக்கிறேன்.',
          },
          {
            en: 'Carry on: Please carry on with your good work.',
            ta: 'Carry on (தொடர்ந்து செய்தல்): உங்கள் நல்ல பணியைத் தொடருங்கள்.',
          },
          {
            en: 'Figure out: We will figure out a solution soon.',
            ta: 'Figure out (புரிந்துகொள்ளுதல் / தீர்வு காணுதல்): விரைவில் ஒரு தீர்வைக் கண்டுபிடிப்போம்.',
          },
          {
            en: 'Call off: The meeting was called off due to heavy rain.',
            ta: 'Call off (ரத்து செய்தல்): கனமழை காரணமாக கூட்டம் ரத்து செய்யப்பட்டது.',
          },
        ],
      },
    ],
  },

  // =========================================================================
  // 9. PRONUNCIATION: SILENT LETTERS IN ENGLISH
  // =========================================================================
  {
    id: 'silent-letters',
    category: 'pronunciation',
    titleEn: 'Silent Letters Guide (K, B, W, L, P, G)',
    titleTa: 'ஒலி இல்லாத எழுத்துக்கள் (Silent Letters உச்சரிப்பு)',
    level: 'Beginner',
    summaryTa: 'ஆங்கிலத்தில் எழுத்து இருக்கும் ஆனால் உச்சரிக்கக் கூடாது (எ.கா: Knife-ல் "K" சத்தம் வரக்கூடாது). தவறான உச்சரிப்பைத் தவிர்க்கும் எளிய வழிகாட்டி.',
    details: [
      {
        heading: 'Common Silent Letters',
        descriptionTa: 'எழுத்துக்களின் அமைப்பும் சரியான உச்சரிப்பும்.',
        examples: [
          {
            en: 'Silent K: Knife (நைப்), Knee (நீ), Know (நோ), Knowledge (நாலேஜ்)',
            ta: 'K-க்கு அடுத்து N வந்தால் K உச்சரிக்கப்படாது.',
          },
          {
            en: 'Silent B: Doubt (டவுட்), Debt (டெட்), Comb (கோம்), Thumb (தம்)',
            ta: 'M-க்கு அடுத்து B வந்தால் B உச்சரிக்கப்படாது.',
          },
          {
            en: 'Silent W: Write (ரைட்), Wrong (ராங்), Wrap (ராப்)',
            ta: 'W-க்கு அடுத்து R வந்தால் W உச்சரிக்கப்படாது.',
          },
          {
            en: 'Silent L: Walk (வாக்), Talk (டாக்), Calm (காம்), Half (ஹாஃப்)',
            ta: 'L-க்கு பிறகு K, M, F வந்தால் L அமைதியாக இருக்கும்.',
          },
        ],
      },
    ],
  },
];
