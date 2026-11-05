/**
 * Autonomous Action AI Agent Engine for AAYON
 * Executes real user commands directly across Wealth, Health, Todos, Career,
 * Notes, Habits, and Tamil Panchangam with instant local NLP & LLM Tool Calling.
 */

import { useWealthStore } from '@/features/wealth/state/wealth-store';
import { useHealthStore } from '@/features/health/state/health-store';
import { useTodoStore } from '@/features/todo/state/todo-store';
import { useJobStore } from '@/features/career/state/job-store';
import { useNoteStore } from '@/features/notes/state/note-store';
import { useHabitStore } from '@/features/today/state/habit-store';
import { TamilCalendarService } from '@/features/calendar/services/tamil-calendar-service';
import { AIService, ChatMessage } from '@/core/utils/ai-service';

export interface AgentActionResult {
  handled: boolean;
  actionType?:
    | 'expense'
    | 'income'
    | 'water'
    | 'steps'
    | 'todo'
    | 'todo_list'
    | 'job'
    | 'job_search'
    | 'panchang'
    | 'note'
    | 'habit'
    | 'summary'
    | 'chat';
  actionTitle?: string;
  actionBadge?: string;
  replyText: string;
}

export class ActionAgentEngine {
  /**
   * Main entrypoint to process user input.
   * Runs local deterministic action parser first (zero latency & works 100% offline).
   * Falls back to LLM with tool calling if not matched by standard patterns.
   */
  public static async processMessage(
    userMessage: string,
    history: ChatMessage[] = []
  ): Promise<AgentActionResult> {
    const raw = userMessage.trim();
    const lower = raw.toLowerCase();

    // -------------------------------------------------------------
    // 1. EXPENSE / INCOME LOGGING (Wealth Store)
    // Examples: "₹150 tea", "250 rs biryani add pannu", "500 petrol expense", "salary 45000"
    // -------------------------------------------------------------
    const wealthResult = this.tryParseWealthAction(raw, lower);
    if (wealthResult) return wealthResult;

    // -------------------------------------------------------------
    // 2. HYDRATION / WATER LOGGING (Health Store)
    // Examples: "500ml water குடிச்சேன்", "drank 2 glasses of water", "log water 250"
    // -------------------------------------------------------------
    const waterResult = this.tryParseWaterAction(raw, lower);
    if (waterResult) return waterResult;

    // -------------------------------------------------------------
    // 3. STEP COUNT & WALKING (Health Store)
    // Examples: "how many steps today?", "1000 steps walked", "steps ethana"
    // -------------------------------------------------------------
    const stepsResult = this.tryParseStepsAction(raw, lower);
    if (stepsResult) return stepsResult;

    // -------------------------------------------------------------
    // 4. TODO / TASK ACTIONS (Todo Store)
    // Examples: "add task: Call HR", "remind me to pay EB bill", "my pending tasks"
    // -------------------------------------------------------------
    const todoResult = this.tryParseTodoAction(raw, lower);
    if (todoResult) return todoResult;

    // -------------------------------------------------------------
    // 5. TAMIL CALENDAR & PANCHANGAM (Calendar Service)
    // Examples: "today nalla neram", "rahu kalam enna", "tamil date enna", "thirukkural sollu"
    // -------------------------------------------------------------
    const panchangResult = this.tryParsePanchangAction(raw, lower);
    if (panchangResult) return panchangResult;

    // -------------------------------------------------------------
    // 6. CAREER & JOB SEARCH (Job Store)
    // Examples: "React jobs in Chennai", "Remote developer jobs", "apply to Lemon.io"
    // -------------------------------------------------------------
    const jobResult = this.tryParseJobAction(raw, lower);
    if (jobResult) return jobResult;

    // -------------------------------------------------------------
    // 7. NOTES & SECOND BRAIN (Note Store)
    // Examples: "take a note: ...", "save snippet: ..."
    // -------------------------------------------------------------
    const noteResult = this.tryParseNoteAction(raw, lower);
    if (noteResult) return noteResult;

    // -------------------------------------------------------------
    // 8. HABITS (Habit Store)
    // Examples: "add habit: Drink green tea", "checked workout habit"
    // -------------------------------------------------------------
    const habitResult = this.tryParseHabitAction(raw, lower);
    if (habitResult) return habitResult;

    // -------------------------------------------------------------
    // 9. COMPLETE EXECUTIVE BRIEFING / SUMMARY
    // Examples: "summary sollu", "daily overview", "status briefing", "இன்றைய நிலைமை"
    // -------------------------------------------------------------
    if (
      lower.includes('summary') ||
      lower.includes('overview') ||
      lower.includes('briefing') ||
      lower.includes('status') ||
      lower.includes('நிலைமை') ||
      lower.includes('சம்மரி')
    ) {
      return this.generateFullExecutiveSummary();
    }

    // -------------------------------------------------------------
    // 10. AI LLM CONVERSATIONAL FALLBACK (Gemini, Groq, Pollinations)
    // -------------------------------------------------------------
    return this.executeLLMConversationalFallback(raw, history);
  }

  // ===============================================================
  // ACTION PARSERS
  // ===============================================================

  private static tryParseWealthAction(raw: string, lower: string): AgentActionResult | null {
    // Detect income intent
    const isIncome =
      lower.includes('income') ||
      lower.includes('salary') ||
      lower.includes('credited') ||
      lower.includes('varavu') ||
      lower.includes('சம்பளம்') ||
      lower.includes('வருமானம்');

    // Detect expense intent or money mention
    const hasMoneyMention =
      raw.includes('₹') ||
      lower.includes('rs') ||
      lower.includes('rupees') ||
      lower.includes('rubai') ||
      lower.includes('ரூபாய்') ||
      lower.includes('expense') ||
      lower.includes('selavu') ||
      lower.includes('செலவு') ||
      lower.includes('spend') ||
      lower.includes('spent') ||
      lower.includes('paid');

    if (!hasMoneyMention && !isIncome) return null;

    // Extract amount
    const amountMatch = raw.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs|rupees|rubai|ரூபாய்)?/i);
    if (!amountMatch) return null;

    const cleanAmountStr = amountMatch[1].replace(/,/g, '');
    const amount = parseFloat(cleanAmountStr);
    if (isNaN(amount) || amount <= 0) return null;

    // Determine category and title
    let categoryId = 'misc';
    let title = isIncome ? 'Income' : 'Expense';
    const type: 'expense' | 'income' = isIncome ? 'income' : 'expense';

    if (isIncome) {
      if (lower.includes('freelance')) {
        categoryId = 'freelance';
        title = 'Freelance Payment';
      } else if (lower.includes('bonus')) {
        categoryId = 'salary';
        title = 'Bonus Income';
      } else {
        categoryId = 'salary';
        title = 'Salary Credit';
      }
    } else {
      // Categorize expenses by keywords
      if (/(?:tea|chai|coffee|snacks|biscuit|samosa|டீ|காபி)/i.test(lower)) {
        categoryId = 'food';
        title = 'Tea & Snacks';
      } else if (/(?:biryani|lunch|dinner|breakfast|hotel|restaurant|swiggy|zomato|burger|pizza|food|சாப்பாடு|உணவு)/i.test(lower)) {
        categoryId = 'food';
        title = 'Food & Dining';
      } else if (/(?:petrol|fuel|diesel|cab|uber|ola|auto|bus|train|flight|fare|பெட்ரோல்|டீசல்)/i.test(lower)) {
        categoryId = 'transport';
        title = 'Travel & Fuel';
      } else if (/(?:milk|vegetable|grocer|provisions|egg|fruits|காய்கறி|பால்)/i.test(lower)) {
        categoryId = 'groceries';
        title = 'Groceries';
      } else if (/(?:recharge|eb|wifi|electricity|bill|current|wifi|கரண்ட்|ரீசார்ஜ்)/i.test(lower)) {
        categoryId = 'utilities';
        title = 'Bills & Utilities';
      } else if (/(?:amazon|flipkart|dress|shirt|pant|shoes|shopping|துணி)/i.test(lower)) {
        categoryId = 'shopping';
        title = 'Shopping';
      } else if (/(?:medicine|tablet|doctor|hospital|pharmacy|மருந்து)/i.test(lower)) {
        categoryId = 'health';
        title = 'Health & Medical';
      } else if (/(?:movie|cinema|netflix|theatre|ott|படம்)/i.test(lower)) {
        categoryId = 'entertainment';
        title = 'Entertainment';
      } else if (/(?:emi|loan|vatti|interest|வட்டி|கடன்)/i.test(lower)) {
        categoryId = 'emi_loans';
        title = 'EMI / Loan Payment';
      } else {
        // Extract remaining words as title
        const cleanedTitle = raw
          .replace(/(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs|rupees|rubai|ரூபாய்)?/gi, '')
          .replace(/(?:add|log|pannu|podu|செலவு|selavu|expense|income|paid|spend|spent)/gi, '')
          .trim();
        if (cleanedTitle.length > 2) {
          title = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);
        }
      }
    }

    const wealthStore = useWealthStore.getState();
    const primaryAccount = wealthStore.accounts[0];
    const accountId = primaryAccount?.id || 'acc-cash';
    const todayStr = new Date().toISOString().split('T')[0];

    // Atomically log transaction in Wealth Store
    wealthStore.addTransaction({
      type,
      title,
      amount,
      categoryId,
      accountId,
      date: todayStr,
      paymentMethod: 'UPI',
      description: `Logged automatically via AAYON AI Agent on ${todayStr}`,
    });

    const isExp = type === 'expense';
    return {
      handled: true,
      actionType: type,
      actionTitle: isExp ? 'Expense Logged 💳' : 'Income Credited 💰',
      actionBadge: `₹${amount.toLocaleString('en-IN')} • ${title}`,
      replyText: isExp
        ? `✅ Recorded expense of ₹${amount.toLocaleString('en-IN')} for "${title}" under ${categoryId.toUpperCase()} via UPI.\nYour account balance and daily budget have been updated.`
        : `🎉 Great! Added ₹${amount.toLocaleString('en-IN')} income for "${title}" into your primary account.`,
    };
  }

  private static tryParseWaterAction(raw: string, lower: string): AgentActionResult | null {
    if (!lower.includes('water') && !lower.includes('தண்ணீர்') && !lower.includes('thanni') && !lower.includes('hydration')) {
      return null;
    }

    let ml = 250; // default 1 glass

    // Match numbers with ml / glasses
    const mlMatch = lower.match(/(\d+)\s*(?:ml|milliliter)/i);
    const glassMatch = lower.match(/(\d+)\s*(?:glass|glasses|டம்ளர்)/i);
    const numMatch = lower.match(/(?:add|log|drank|drink|குடிச்சேன்)\s*(\d+)/i);

    if (mlMatch) {
      ml = parseInt(mlMatch[1], 10);
    } else if (glassMatch) {
      ml = parseInt(glassMatch[1], 10) * 250;
    } else if (numMatch) {
      ml = parseInt(numMatch[1], 10);
      if (ml <= 10) ml = ml * 250; // treat small single digit numbers as glasses
    }

    if (ml > 0 && ml <= 3000) {
      const healthStore = useHealthStore.getState();
      healthStore.addWater(ml);
      const updated = useHealthStore.getState();
      const percent = Math.min(100, Math.round((updated.waterIntakeMl / (updated.waterGoalMl || 3000)) * 100));

      return {
        handled: true,
        actionType: 'water',
        actionTitle: 'Hydration Logged 💧',
        actionBadge: `+${ml}ml (Total: ${updated.waterIntakeMl}ml)`,
        replyText: `💧 Logged +${ml}ml of water! Your daily hydration is now ${updated.waterIntakeMl.toLocaleString()} / ${(updated.waterGoalMl || 3000).toLocaleString()} ml (${percent}% of goal). Keep it up!`,
      };
    }

    return null;
  }

  private static tryParseStepsAction(raw: string, lower: string): AgentActionResult | null {
    const isStepQuery =
      lower.includes('steps') ||
      lower.includes('நடந்திருக்கேன்') ||
      lower.includes('வாக்கிங்') ||
      lower.includes('walking');

    if (!isStepQuery) return null;

    // Check if user is reporting steps walked
    const addMatch = lower.match(/(\d+)\s*(?:steps|படிகள்)/i);
    if (addMatch && (lower.includes('add') || lower.includes('walked') || lower.includes('walk') || lower.includes('நடந்தேன்'))) {
      const steps = parseInt(addMatch[1], 10);
      if (steps > 0 && steps <= 30000) {
        useHealthStore.getState().addLiveSteps(steps);
        const cur = useHealthStore.getState();
        return {
          handled: true,
          actionType: 'steps',
          actionTitle: 'Steps Updated 🚶‍♂️',
          actionBadge: `+${steps.toLocaleString()} Steps`,
          replyText: `🚶‍♂️ Added +${steps.toLocaleString()} steps! You have walked a total of ${cur.todaySteps.toLocaleString()} steps today (${Math.min(100, Math.round((cur.todaySteps / cur.stepGoal) * 100))}% of your ${cur.stepGoal.toLocaleString()} goal).`,
        };
      }
    }

    // Query current steps
    const health = useHealthStore.getState();
    const percent = Math.min(100, Math.round((health.todaySteps / (health.stepGoal || 10000)) * 100));
    return {
      handled: true,
      actionType: 'steps',
      actionTitle: 'Live Step Tracker 🚶‍♂️',
      actionBadge: `${health.todaySteps.toLocaleString()} / ${health.stepGoal.toLocaleString()} Steps`,
      replyText: `🚶‍♂️ You have walked ${health.todaySteps.toLocaleString('en-IN')} steps today (${percent}% of your ${health.stepGoal.toLocaleString('en-IN')} step goal). Burned approximately ${health.caloriesBurnedKcal} kcal!`,
    };
  }

  private static tryParseTodoAction(raw: string, lower: string): AgentActionResult | null {
    // List active tasks
    if (
      lower === 'my tasks' ||
      lower === 'pending tasks' ||
      lower === 'tasks' ||
      lower.includes('tasks enna') ||
      lower.includes('டாஸ்க் என்ன') ||
      lower.includes('list tasks') ||
      lower.includes('what are my tasks')
    ) {
      const todos = useTodoStore.getState().todos.filter((t) => !t.completed);
      if (todos.length === 0) {
        return {
          handled: true,
          actionType: 'todo_list',
          actionTitle: 'Tasks Clear ✨',
          actionBadge: '0 Pending Tasks',
          replyText: '🎉 You have no pending tasks! Your daily priority list is 100% completed.',
        };
      }

      const listText = todos
        .slice(0, 5)
        .map((t, i) => `${i + 1}. [${t.priority.toUpperCase()}] ${t.title}`)
        .join('\n');

      return {
        handled: true,
        actionType: 'todo_list',
        actionTitle: 'Pending Priorities 🎯',
        actionBadge: `${todos.length} Active Tasks`,
        replyText: `Here are your pending tasks:\n\n${listText}\n\n${todos.length > 5 ? `...and ${todos.length - 5} more in your Todo list.` : ''}`,
      };
    }

    // Add new task
    const taskMatch =
      raw.match(/(?:add|create|new)\s*task:?\s*(.+)/i) ||
      raw.match(/(?:remind me to|todo:?)\s*(.+)/i) ||
      raw.match(/(.+)\s*(?:task add pannu|task podu|டாஸ்க்)/i);

    if (taskMatch) {
      const title = taskMatch[1].trim();
      if (title.length > 2) {
        let priority: 'high' | 'medium' | 'low' = 'medium';
        if (lower.includes('urgent') || lower.includes('high priority') || lower.includes('important')) {
          priority = 'high';
        }

        useTodoStore.getState().addTodo({
          title,
          category: 'Work',
          priority,
        });

        return {
          handled: true,
          actionType: 'todo',
          actionTitle: 'Task Scheduled 🎯',
          actionBadge: `[${priority.toUpperCase()}] ${title}`,
          replyText: `✅ Created new priority task: "${title}". It has been added to your Daily Command Center agenda.`,
        };
      }
    }

    return null;
  }

  private static tryParsePanchangAction(raw: string, lower: string): AgentActionResult | null {
    const isPanchang =
      lower.includes('nalla neram') ||
      lower.includes('நல்ல நேரம்') ||
      lower.includes('rahu') ||
      lower.includes('ராகு') ||
      lower.includes('yamagandam') ||
      lower.includes('எமகண்டம்') ||
      lower.includes('panchang') ||
      lower.includes('பஞ்சாங்கம்') ||
      lower.includes('thirukkural') ||
      lower.includes('திருக்குறள்') ||
      lower.includes('tamil date') ||
      lower.includes('தமிழ் தேதி') ||
      lower.includes('chandrashtamam') ||
      lower.includes('சந்திராஷ்டமம்') ||
      lower.includes('soolam') ||
      lower.includes('சூலம்');

    if (!isPanchang) return null;

    const data = TamilCalendarService.getDailyCalendar(new Date());

    if (lower.includes('thirukkural') || lower.includes('திருக்குறள்') || lower.includes('kural') || lower.includes('குறள்')) {
      const k = data.thirukkural;
      return {
        handled: true,
        actionType: 'panchang',
        actionTitle: 'இன்றைய திருக்குறள் 📜',
        actionBadge: `குறள் ${k.number} • ${k.adhigaram}`,
        replyText: `📜 குறள் ${k.number} (${k.adhigaram}):\n\n"${k.line1}\n${k.line2}"\n\n💡 விளக்கம்: ${k.meaningTamil}\n\nEnglish: ${k.meaningEnglish}`,
      };
    }

    if (lower.includes('nalla neram') || lower.includes('நல்ல நேரம்')) {
      return {
        handled: true,
        actionType: 'panchang',
        actionTitle: 'இன்றைய சுப நேரங்கள் ✨',
        actionBadge: `${data.tamilDate.tamilMonth} ${data.tamilDate.tamilDay}`,
        replyText: `✨ நல்ல நேரம்:\n• காலை: ${data.auspiciousTimes.nallaNeramMorning.start} - ${data.auspiciousTimes.nallaNeramMorning.end}\n• மாலை: ${data.auspiciousTimes.nallaNeramEvening.start} - ${data.auspiciousTimes.nallaNeramEvening.end}\n\n🌟 கௌரி நல்ல நேரம்:\n• காலை: ${data.auspiciousTimes.gowriNallaNeramMorning.start} - ${data.auspiciousTimes.gowriNallaNeramMorning.end}\n• மாலை: ${data.auspiciousTimes.gowriNallaNeramEvening.start} - ${data.auspiciousTimes.gowriNallaNeramEvening.end}`,
      };
    }

    if (lower.includes('rahu') || lower.includes('ராகு') || lower.includes('எமகண்டம்') || lower.includes('yamagandam')) {
      return {
        handled: true,
        actionType: 'panchang',
        actionTitle: 'இன்றைய அசுப நேரங்கள் ⚠️',
        actionBadge: data.tamilDate.weekdayTamil,
        replyText: `⚠️ அசுப நேரங்கள் (${data.tamilDate.weekdayTamil}):\n• ராகு காலம்: ${data.inauspiciousTimes.rahuKaalam.start} - ${data.inauspiciousTimes.rahuKaalam.end}\n• எமகண்டம்: ${data.inauspiciousTimes.yamagandam.start} - ${data.inauspiciousTimes.yamagandam.end}\n• குளிகை: ${data.inauspiciousTimes.kuligai.start} - ${data.inauspiciousTimes.kuligai.end}`,
      };
    }

    // Default: full panchang overview
    return {
      handled: true,
      actionType: 'panchang',
      actionTitle: 'இன்றைய தமிழ் நாள்காட்டி 🕉️',
      actionBadge: `${data.tamilDate.tamilMonth} ${data.tamilDate.tamilDay} • ${data.panchangam.paksham}`,
      replyText: `🕉️ ${data.tamilDate.tamilYear} வருடம், ${data.tamilDate.tamilMonth} ${data.tamilDate.tamilDay} (${data.tamilDate.weekdayTamil})\n\n• திதி: ${data.panchangam.thithi}\n• நட்சத்திரம்: ${data.panchangam.nakshatram}\n• யோகம்: ${data.panchangam.auspiciousYogam}\n• நல்ல நேரம்: ${data.auspiciousTimes.nallaNeramMorning.start} - ${data.auspiciousTimes.nallaNeramMorning.end}\n• ராகு காலம்: ${data.inauspiciousTimes.rahuKaalam.start} - ${data.inauspiciousTimes.rahuKaalam.end}\n• சந்திராஷ்டம ராசி: ${data.panchangam.chandrashtamaRasi.split(' ')[0]}`,
    };
  }

  private static tryParseJobAction(raw: string, lower: string): AgentActionResult | null {
    // Search jobs by location or skill
    if (
      lower.includes('job') ||
      lower.includes('career') ||
      lower.includes('வேலை') ||
      lower.includes('opening') ||
      lower.includes('roles')
    ) {
      const allJobs = useJobStore.getState().jobs;

      // Extract city or tech
      let query = '';
      if (lower.includes('chennai')) query = 'chennai';
      else if (lower.includes('bangalore')) query = 'bangalore';
      else if (lower.includes('remote')) query = 'remote';
      else if (lower.includes('react')) query = 'react';
      else if (lower.includes('vue')) query = 'vue';
      else if (lower.includes('mobile')) query = 'mobile';

      if (query) {
        const matches = allJobs.filter((j) =>
          j.location.toLowerCase().includes(query) ||
          j.role.toLowerCase().includes(query) ||
          (j.tags && j.tags.some((t) => t.toLowerCase().includes(query)))
        );

        if (matches.length > 0) {
          const list = matches
            .slice(0, 3)
            .map((j) => `• ${j.role} at ${j.companyName} (${j.location}) — ₹${j.ctcMin}-${j.ctcMax} LPA [${j.matchScore ?? 85}% ATS Match]`)
            .join('\n');

          return {
            handled: true,
            actionType: 'job_search',
            actionTitle: `Found ${matches.length} Jobs 💼`,
            actionBadge: `Filter: ${query.toUpperCase()}`,
            replyText: `💼 Here are matching roles for "${query}":\n\n${list}\n\nOpen CareerPilot OS to review and 1-Click Auto-Apply!`,
          };
        }
      }

      const total = allJobs.length;
      const applied = allJobs.filter((j) => j.stage === 'applied' || j.stage === 'interview').length;
      return {
        handled: true,
        actionType: 'job',
        actionTitle: 'Career Pipeline Status 🚀',
        actionBadge: `${total} Live Opportunities`,
        replyText: `🚀 Career Pipeline: You have ${total} verified job roles loaded and ${applied} active applications in your pipeline.`,
      };
    }

    return null;
  }

  private static tryParseNoteAction(raw: string, lower: string): AgentActionResult | null {
    const noteMatch =
      raw.match(/(?:take a note|note this|save note|new note|write note|குறிப்பு):?\s*(.+)/i) ||
      raw.match(/(?:create note):?\s*(.+)/i);

    if (noteMatch) {
      const content = noteMatch[1].trim();
      if (content.length > 2) {
        const titleWords = content.split(' ').slice(0, 5).join(' ');
        const title = titleWords.length > 3 ? `${titleWords}...` : 'Quick AI Note';

        useNoteStore.getState().addNote({
          title,
          content,
          type: 'note',
          tags: ['AI-Agent', 'QuickNote'],
          isPinned: false,
        });

        return {
          handled: true,
          actionType: 'note',
          actionTitle: 'Note Saved 📝',
          actionBadge: title,
          replyText: `📝 Saved to your Second Brain Vault:\n"${content}"`,
        };
      }
    }

    return null;
  }

  private static tryParseHabitAction(raw: string, lower: string): AgentActionResult | null {
    if (lower.startsWith('add habit:') || lower.startsWith('new habit:')) {
      const title = raw.split(':')[1]?.trim();
      if (title) {
        useHabitStore.getState().addHabit(title, 'flame');
        return {
          handled: true,
          actionType: 'habit',
          actionTitle: 'New Habit Created 🔥',
          actionBadge: title,
          replyText: `🔥 Added "${title}" to your Daily Habit tracker! Keep the streak alive!`,
        };
      }
    }
    return null;
  }

  private static generateFullExecutiveSummary(): AgentActionResult {
    const health = useHealthStore.getState();
    const wealth = useWealthStore.getState();
    const jobs = useJobStore.getState().jobs;
    const todos = useTodoStore.getState().todos.filter((t) => !t.completed);
    const panchang = TamilCalendarService.getDailyCalendar(new Date());

    const activeLoans = wealth.loans.filter((l) => l.status === 'active');
    const appliedJobs = jobs.filter((j) => j.stage === 'applied' || j.stage === 'interview');

    return {
      handled: true,
      actionType: 'summary',
      actionTitle: 'Daily Executive Briefing 📊',
      actionBadge: `${panchang.tamilDate.tamilMonth} ${panchang.tamilDate.tamilDay}`,
      replyText: `📊 **AAYON Executive Morning Briefing:**

🕉️ **Day & Timing:**
• ${panchang.tamilDate.tamilYear} வருடம், ${panchang.tamilDate.tamilMonth} ${panchang.tamilDate.tamilDay} (${panchang.tamilDate.weekdayTamil})
• நல்ல நேரம்: ${panchang.auspiciousTimes.nallaNeramMorning.start} - ${panchang.auspiciousTimes.nallaNeramMorning.end}
• ராகு காலம்: ${panchang.inauspiciousTimes.rahuKaalam.start} - ${panchang.inauspiciousTimes.rahuKaalam.end}

🚶‍♂️ **Health & Wellness:**
• Steps: ${health.todaySteps.toLocaleString()} / ${health.stepGoal.toLocaleString()}
• Water: ${health.waterIntakeMl}ml / ${health.waterGoalMl || 3000}ml

💼 **Career & Goals:**
• ${appliedJobs.length} active job applications in pipeline
• ${todos.length} pending priority tasks for today

💳 **Financial Health:**
• Active Loans/Debts: ${activeLoans.length}
• Total Accounts Tracked: ${wealth.accounts.length}`,
    };
  }

  private static async executeLLMConversationalFallback(
    raw: string,
    history: ChatMessage[]
  ): Promise<AgentActionResult> {
    try {
      const health = useHealthStore.getState();
      const wealth = useWealthStore.getState();
      const jobs = useJobStore.getState().jobs;

      const reply = await AIService.generateReply(raw, history, {
        steps: health.todaySteps,
        pendingLoansCount: wealth.loans.filter((l) => l.status === 'active').length,
        upcomingInterviewsCount: jobs.filter((j) => j.interviews && j.interviews.length > 0).length,
      });

      return {
        handled: true,
        actionType: 'chat',
        replyText: reply,
      };
    } catch {
      return {
        handled: false,
        actionType: 'chat',
        replyText: 'I could not connect to AI services right now. Please check your internet connection or verify your API key in Settings.',
      };
    }
  }
}
