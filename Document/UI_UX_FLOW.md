# 📱 Personal App: UI/UX Screen Architecture & Wireframe Flow

**Platform:** React Native (Android / iOS)  
**Theme:** Obsidian Dark Mode (`#090A0F`), Translucent Glass Panels (`rgba(255, 255, 255, 0.05)`), Vibrant Neon Badges  

---

## 1. Overall App Navigation Structure

The app utilizes a standard **5-Tab Bottom Navigation Bar** with high-clarity iconography, backed by a **Native Stack Navigator** for detail screens and modal overlays.

```
[Bottom Tabs]
├── 🏠 TODAY (Screen 1: Command Center)
├── 💼 CAREER (Screen 2: Job Search & ATS Pipeline)
├── 🏃 HEALTH (Screen 3: Google Fit Style Activity Hub)
├── 📝 VAULT (Screen 4: Notes, Wealth, Trips, Groceries, Gold, Loans)
└── 🤖 AGENT (Screen 5: AI Copilot, Sunday Reset & Biometrics)
```

---

## 2. Screen-by-Screen UX & Wireframe Breakdown

---

### Tab 1: 🏠 TODAY (Daily Command Center)

#### Visual Layout:
```
+-------------------------------------------------------------+
|  Good morning, Bharathi! 👋               [🔔 Notifications] |
|  Thursday, October 23, 2026               [⚙️ Settings]      |
+-------------------------------------------------------------+
|  [⚡ Executive Daily Briefing Card]                          |
|  "Today you have an interview with Swiggy at 3 PM.          |
|   Don't forget to review React Native JSI concepts."        |
+-------------------------------------------------------------+
|  TODAY'S RINGS SUMMARY                                      |
|  [ 🟢 6,420 / 10k Steps ]   [ 💧 1,750 / 3L Water ]         |
|  [ 🔥 310 kcal burned   ]   [ ⏱️ 2h 15m Focus     ]         |
+-------------------------------------------------------------+
|  TOP 3 FOCUS PRIORITIES (Rule of 3)                         |
|  [x] 1. Practice System Design mock interview               |
|  [ ] 2. Apply to 3 Senior Frontend roles on LinkedIn         |
|  [ ] 3. Pay monthly vatti for Kumar Anna (Due in 2 days)     |
+-------------------------------------------------------------+
|  NEXT UPCOMING EVENT                                        |
|  💼 Swiggy - Tech Round 1  (Starts in 2h 45m)   [Join Call] |
+-------------------------------------------------------------+
|  HABIT STREAKS 🔥                                           |
|  [💻 DSA 5d]  [📬 Applied 12d]  [🏃 8k Steps 4d]            |
+-------------------------------------------------------------+
```

#### Key Interactions:
- Tap on any Priority task to toggle completion (with haptic vibration `expo-haptics`).
- Tap `Join Call` on upcoming interview to open Google Meet/Zoom directly.
- Floating `+` button in bottom corner for 1-tap quick action (Add Task, Quick Note, Log Water, Log Expense).

---

### Tab 2: 💼 CAREER (Job Search & ATS Pipeline)

#### Visual Layout:
```
+-------------------------------------------------------------+
|  CAREER PIPELINE                        [+ Add Application]  |
|  Filter: [All (18)]  [Active (7)]  [Interviews (3)] [Offer (1)]|
+-------------------------------------------------------------+
|  STAGE TABS (Swipeable horizontal Kanban / Segmented bar):  |
|  [ Wishlist ] [ Applied ] [ Assessment ] [ Interview ] [ Offer ] |
+-------------------------------------------------------------+
|  APPLICATION CARDS:                                         |
|  +-------------------------------------------------------+  |
|  | 🏢 Swiggy                      [Interview: Round 1]   |  |
|  | Role: Senior React Native Developer                   |  |
|  | CTC: 24 - 28 LPA | Remote | Applied: Oct 18           |  |
|  | ⏰ Interview in 2 days (Google Meet Link attached)    |  |
|  | [Recruiter CRM]  [JD Match: 84%]  [Prep Notes]        |  |
|  +-------------------------------------------------------+  |
|  +-------------------------------------------------------+  |
|  | 🏢 Google India                         [Applied]     |  |
|  | Role: Software Engineer - Mobile                      |  |
|  | Applied 6 days ago ⚠️ (Follow-up due!)                 |  |
|  | [1-Click Follow-Up Mail]  [View Details]              |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
|  CAREER TOOLS QUICK DOCK:                                   |
|  [ 📄 ATS JD Matcher ] [ 💰 CTC In-Hand Calc ] [ 📇 CRM ]    |
+-------------------------------------------------------------+
```

#### Modals & Sub-Screens:
- **Add Application Modal:** Clean form with company name, designation, package, stage, and interview details.
- **Recruiter CRM Modal:** 1-tap WhatsApp and LinkedIn outreach with auto-populated template.
- **CTC Calculator:** Instant monthly in-hand net salary computation.

---

### Tab 3: 🏃 HEALTH (Google Fit Style Activity Hub)

#### Visual Layout:
```
+-------------------------------------------------------------+
|  HEALTH & VITALITY                       [Target: 10,000 st] |
+-------------------------------------------------------------+
|  CIRCULAR METRIC RING                                       |
|                  .---------.                                |
|               .-'    🟢     '-.                             |
|              /   7,840 Steps   \                            |
|             |    78% of Goal    |                           |
|              \   380 kcal | 5.4km/                          |
|               '-.           .-'                             |
|                  '---------'                                |
+-------------------------------------------------------------+
|  TIME VIEW SELECTOR:                                        |
|  [ 📅 Day (Today) ]  [ 📊 Week (7 Days) ]  [ 📈 Month (30d) ] |
+-------------------------------------------------------------+
|  INTERACTIVE ACTIVITY GRAPH                                 |
|  (Hourly bars in Day view / 7 Day comparative in Week view)  |
|  ||   ||   ||||   ||   ||||||   ||                          |
|  8am 10am  12pm  2pm   4pm     6pm  8pm                     |
+-------------------------------------------------------------+
|  HYDRATION BOTTLE TRACKER 💧                                |
|  Level: [=========>      ] 2,000 / 3,000 ml (66%)           |
|  [ +250ml Glass ]   [ +500ml Bottle ]                       |
+-------------------------------------------------------------+
|  SLEEP & RECOVERY 🌙                                        |
|  Last Night: 7h 20m  (11:45 PM - 7:05 AM) | Rating: Restful  |
+-------------------------------------------------------------+
|  DESK ERGONOMICS SHIELD 💻                                  |
|  Next 20-20-20 Posture Alert: in 18 minutes                 |
+-------------------------------------------------------------+
```

---

### Tab 4: 📝 VAULT (Second Brain, Money & Household Hub)

#### Sub-Navigation Header:
`[ 📝 Notes & Snippets ] | [ 💰 Wealth & Loans ] | [ 🏖️ Trips ] | [ 🛒 Groceries ]`

#### View A: 💰 Wealth, Gold & Loans (Vatti Engine):
```
+-------------------------------------------------------------+
|  MONTHLY CASH FLOW & SAVINGS                                |
|  Income: ₹1,20,000  | Expenses: ₹72,000 | Net Saved: ₹48,000 |
+-------------------------------------------------------------+
|  GOLD ASSET INVENTORY 🪙                                    |
|  Total Gold: 24.0 grams (3.0 Savaran / Sovereign)           |
|  Estimated Value: ₹1,80,000 (Based on ₹7,500/g)             |
|  [+ Add Gold Item (Chain, Ring, Coin)]                      |
+-------------------------------------------------------------+
|  LOANS & VATTI (INTEREST) ENGINE 📊                         |
|  +-------------------------------------------------------+  |
|  | 👤 Kumar Anna                             [Active]    |  |
|  | Principal: ₹2,00,000 | Rate: 2% monthly (2 rooba)     |  |
|  | Monthly Vatti: ₹4,00,0 / month                        |  |
|  | ⏰ Due on: 5th of every month (Due in 3 days!)        |  |
|  | [Pay Vatti ₹4,000] [Pay Principal] [Send Receipt]     |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

#### View B: 🏖️ Trips & Vacation Expenses:
```
+-------------------------------------------------------------+
|  TRIP: OOTY WEEKEND GETAWAY 🚗               [+ Add Expense] |
|  Budget: ₹15,000 | Spent: ₹10,800 | Remaining: ₹4,200       |
+-------------------------------------------------------------+
|  [🚗 Travel ₹3,200] [🏨 Resort ₹4,500] [🍽️ Food ₹3,100]    |
|  Group Split: Bharathi paid ₹7,000 | Dinesh paid ₹3,800     |
|  Status: Dinesh owes Bharathi ₹1,600                        |
+-------------------------------------------------------------+
```

#### View C: 🛒 Family & Grocery Shopping Checklist:
```
+-------------------------------------------------------------+
|  MONTHLY GROCERY CHECKLIST (14/18 Items)      [+ Add Item]  |
|  Estimated Checkout: ₹3,450                                 |
+-------------------------------------------------------------+
|  [x] Basmati Rice 5kg (₹450)                                |
|  [x] Cold Pressed Cooking Oil 2L (₹380)                     |
|  [ ] Fresh Vegetables Market (₹500)                         |
|  [ ] Daily Milk & Curd Card (₹1,200)                        |
|  [ ] Dishwasher & Detergent (₹320)                          |
+-------------------------------------------------------------+
```

---

### Tab 5: 🤖 AGENT (AI Copilot, Sunday Reset & Vault)

#### Visual Layout:
```
+-------------------------------------------------------------+
|  NOVA - AI EXECUTIVE COPILOT               [🎙️ Voice Mode]   |
+-------------------------------------------------------------+
|  CHAT STREAM:                                               |
|  🤖 Nova: Good morning Bharathi! You have an interview      |
|           scheduled today at 3 PM with Swiggy.              |
|           Shall I run a 10-minute technical flashcard test? |
|                                                             |
|  👤 You: Add application: Senior Frontend Engineer at       |
|          PhonePe, 30 LPA, applied today.                    |
|                                                             |
|  🤖 Nova: ✅ Done! Added PhonePe to your Career Pipeline   |
|           under 'Applied'. Follow-up scheduled for Oct 29.  |
+-------------------------------------------------------------+
|  [ Type a command or say "Brief me today"...       ] [ 🚀 ] |
+-------------------------------------------------------------+
|  QUICK AGENT LAUNCHERS:                                     |
|  [ 🕯️ Sunday Reset ] [ ⚡ Flashcard Test ] [ 🔐 Secure Vault] |
+-------------------------------------------------------------+
```
