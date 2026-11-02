export interface MessageTemplateItem {
  id: string;
  category: 'leave' | 'wfh' | 'salary' | 'referral' | 'standup' | 'apology';
  titleEn: string;
  titleTa: string;
  badge: string;
  subject: string;
  body: string;
  tamilMeaning: string;
  tone: 'Formal' | 'Direct' | 'Polite' | 'Urgent';
}

export const WORKPLACE_MESSAGE_TEMPLATES: MessageTemplateItem[] = [
  // ==========================================
  // LEAVE & ABSENCE
  // ==========================================
  {
    id: 'sick-leave-today',
    category: 'leave',
    titleEn: 'Sick Leave (Same Day)',
    titleTa: 'திடீர் உடல்நலக் குறைவு விடுப்பு',
    badge: 'Leave 🤒',
    tone: 'Polite',
    subject: 'Sick Leave Request - [Your Name] - [Today Date]',
    body: `Hi [Manager Name],

I am writing to let you know that I am unwell today and will not be able to attend work. 

I will keep an eye on urgent messages if needed and will update you regarding my recovery by evening. My tasks are tracked on the sprint board, and I have informed [Colleague Name] for critical support.

Thank you for your understanding.

Best regards,
[Your Name]`,
    tamilMeaning: 'இன்று எனக்கு உடல்நலம் சரியில்லாததால் வேலைக்கு வர இயலாது. அவசர மெசேஜ்களை கவனிப்பேன், மாலையில் என் உடல்நிலை குறித்து தகவல் தெரிவிப்பேன் என்று கண்ணியமாக விடுப்பு கேட்கும் மெயில்.',
  },
  {
    id: 'planned-vacation',
    category: 'leave',
    titleEn: 'Planned Vacation / Personal Leave',
    titleTa: 'முன்கூட்டியே திட்டமிட்ட விடுப்பு',
    badge: 'Leave ✈️',
    tone: 'Formal',
    subject: 'Planned Leave Application: [Your Name] ([Start Date] to [End Date])',
    body: `Dear [Manager Name],

I would like to request personal leave from [Start Date] to [End Date]. I will resume work on [Return Date].

Before taking leave, I will make sure all my pending sprint deliverables and pull requests are reviewed and handed over to [Colleague Name].

Please let me know if this timeframe works or if we need to adjust sprint planning.

Sincerely,
[Your Name]`,
    tamilMeaning: 'முன்கூட்டியே திட்டமிட்ட விடுப்பை மேனேஜரிடம் அனுமதி கேட்டு, எனது பணிகளை சக ஊழியரிடம் ஒப்படைத்துவிட்டேன் என்று உறுதிப்படுத்தும் தொழில்முறை மெயில்.',
  },

  // ==========================================
  // WORK FROM HOME (WFH)
  // ==========================================
  {
    id: 'urgent-wfh-today',
    category: 'wfh',
    titleEn: 'Work From Home (WFH) Request',
    titleTa: 'வீட்டிலிருந்து வேலை செய்ய (WFH) அனுமதி',
    badge: 'WFH 🏠',
    tone: 'Direct',
    subject: 'Request to Work From Home Today - [Your Name]',
    body: `Hi [Manager Name],

Due to an urgent personal circumstance at home, I will be working from home today, [Date].

I have high-speed internet and power backup, so my working hours and availability on Slack/Teams for all scheduled meetings will remain completely uninterrupted.

Thank you for the flexibility.

Regards,
[Your Name]`,
    tamilMeaning: 'வீட்டு சூழ்நிலை காரணமாக இன்று வீட்டிலிருந்து வேலை செய்கிறேன், மீட்டிங்குகள் மற்றும் பணிகளில் எந்த தாமதமும் இருக்காது என்று தெரிவிக்கும் மெசேஜ்.',
  },

  // ==========================================
  // SALARY & APPRAISAL
  // ==========================================
  {
    id: 'salary-appraisal-1on1',
    category: 'salary',
    titleEn: 'Salary Review & Appraisal 1:1 Request',
    titleTa: 'சம்பள உயர்வு மற்றும் செயல்திறன் மறுஆய்வு கோரிக்கை',
    badge: 'Salary 💰',
    tone: 'Formal',
    subject: 'Request for 1:1 Discussion: Role Performance & Compensation Review',
    body: `Dear [Manager Name],

Over the past year, I have taken ownership of key initiatives including [Project 1] and [Achievement/Metric], which have contributed significantly to our team's goals.

Given my expanded responsibilities and recent deliverables, I would appreciate a brief 1:1 meeting with you to discuss my performance and review my current compensation.

Could you let me know a convenient time for a 30-minute conversation this week?

Thank you for your continuous support and guidance.

Best regards,
[Your Name]`,
    tamilMeaning: 'கடந்த ஆண்டில் நான் ஆற்றிய சாதனைகளை சுட்டிக்காட்டி, எனது பொறுப்புகள் அதிகரித்துள்ளதால் சம்பள உயர்வு குறித்து 30 நிமிட 1:1 பேச நேரம் கேட்கும் கம்பீரமான மெயில்.',
  },

  // ==========================================
  // JOB REFERRAL & HR OUTREACH
  // ==========================================
  {
    id: 'linkedin-alumni-referral',
    category: 'referral',
    titleEn: 'LinkedIn Job Referral Request',
    titleTa: 'லிங்க்ட்இனில் ரெபரல் (Referral) கேட்கும் மெசேஜ்',
    badge: 'Referral 🤝',
    tone: 'Polite',
    subject: 'Job Referral Request for [Role Name] (Job ID: [12345])',
    body: `Hi [Name],

I came across your profile and noticed you are working at [Company Name]. I have been following the impressive engineering work your team is doing.

I noticed an open position for [Target Role] (Job ID: [ID]). With [X] years of experience in [Skill 1], [Skill 2], and [Skill 3], I believe I would be a strong fit for this team.

If you are open to it, could you please review my profile and refer me for this opening? My resume is attached for your quick reference.

Thank you very much for your time!

Best regards,
[Your Name]
LinkedIn: [Your Profile Link]`,
    tamilMeaning: 'LinkedIn-ல் பணிபுரியும் ஒருவரிடம் நிறுவனத்தின் சாதனைகளைப் பாராட்டி, எனது திறன்கள் பொருத்தமாக இருப்பதால் ரெபரல் செய்ய முடியுமா என்று கண்ணியமாக கேட்கும் மெசேஜ்.',
  },
  {
    id: 'interview-status-followup',
    category: 'referral',
    titleEn: 'Post-Interview Status Follow-Up',
    titleTa: 'நேர்காணல் முடிவை அறிய ஃபாலோ-அப் மெயில்',
    badge: 'Follow-up 🕒',
    tone: 'Formal',
    subject: 'Following up on [Role Name] Interview - [Your Name]',
    body: `Dear [HR Name],

I hope you are having a productive week.

I am writing to follow up on the status of my recent interview for the [Role Name] position, which took place on [Date]. I really enjoyed speaking with the team and learning more about [Project/Topic discussed].

I remain very enthusiastic about the opportunity to contribute to [Company Name]. Please let me know if there are any updates or if you need any additional information from my side.

Thank you again for your time and consideration.

Warm regards,
[Your Name]`,
    tamilMeaning: 'நேர்காணல் முடிந்து சில நாட்களுக்குப் பிறகு, முடிவுகளைப் பற்றி தெரிந்துகொள்ள HR-க்கு அனுப்பும் தொழில்முறை ஃபாலோ-அப் மெயில்.',
  },

  // ==========================================
  // DAILY STANDUP & WORK
  // ==========================================
  {
    id: 'daily-slack-standup',
    category: 'standup',
    titleEn: 'Daily Agile Standup Slack Update',
    titleTa: 'தினசரி ஸ்டாண்டப் ஸ்லாக்/டீம்ஸ் மெசேஜ்',
    badge: 'Standup 💻',
    tone: 'Direct',
    subject: 'Daily Standup Update - [Today Date]',
    body: `*Daily Standup Update - [Date]*

*Yesterday:*
- Completed implementation and unit tests for [Feature Name]
- Reviewed and approved PR #[Number]

*Today:*
- Integrating the backend APIs with frontend UI
- Conducting sanity tests on staging environment

*Blockers:*
- None. Waiting for API swagger schema review from backend team.`,
    tamilMeaning: 'அலுவலக ஸ்லாக் அல்லது டீம்ஸ் குழுவில் நேற்று செய்தவை, இன்று செய்ய உள்ளவை, தடைகள் உள்ளதா என்பதை வரிசையாக பகிரும் கச்சிதமான வடிவம்.',
  },

  // ==========================================
  // APOLOGY & ESCALATION
  // ==========================================
  {
    id: 'incident-bug-apology',
    category: 'apology',
    titleEn: 'Production Issue / Delay Escalation',
    titleTa: 'தாமதம் அல்லது பிழை ஏற்பட்டதற்கான விளக்கம்',
    badge: 'Incident 🚨',
    tone: 'Formal',
    subject: 'Update & Mitigation: [Issue Name / Sprint Delay]',
    body: `Hi Team,

I wanted to provide a quick transparency update regarding [Issue / Delay].

We encountered an unexpected edge case during the [Release/Build] phase. I have identified the root cause and am currently deploying a hotfix to rectify this.

We anticipate having this resolved by [Estimated Time]. I apologize for any inconvenience caused and will keep you posted once verification is complete.

Thank you for your patience.

Best regards,
[Your Name]`,
    tamilMeaning: 'வேலையில் எதிர்பாராத தாமதம் அல்லது சர்வர் பிழை ஏற்பட்டால், பதற்றப்படாமல் காரணத்தை விளக்கி தீர்வு காணப்பட்டு வருகிறது என நம்பிக்கையூட்டும் மெயில்.',
  },
];
