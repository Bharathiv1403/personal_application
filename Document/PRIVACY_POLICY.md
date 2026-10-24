# Privacy Policy for AAYON

**Last Updated:** October 24, 2026

Welcome to **AAYON** ("we", "our", or "the App"). Your privacy is our highest priority. This Privacy Policy explains our commitment to data transparency, data security, and how your information is handled.

---

### 1. Zero Cloud Data Harvesting (100% Local-First Architecture)

- **On-Device Storage:** All your financial records (loans, interest tracking, gold holdings), career notes (job applications, ATS analysis), daily priorities, and health summaries are stored **exclusively on your personal device hardware** using sandboxed local storage (`AsyncStorage`).
- **No Account Required:** You do not need to create an account, register your email, or provide personal credentials to use AAYON.
- **No Third-Party Analytics or Trackers:** We do NOT include third-party advertising SDKs, tracking pixels, or data brokering libraries.

---

### 2. Device Permissions & How They Are Used

AAYON requests only the minimum hardware permissions necessary to provide its core features:

| Permission | Purpose | Data Handling |
|---|---|---|
| **Activity Recognition (`ACTIVITY_RECOGNITION`)** | Reads daily step count and active move minutes using the device pedometer sensor. | Stored strictly locally on your device. Never transmitted to third parties. |
| **Notifications (`POST_NOTIFICATIONS`)** | Sends local reminders for financial due dates, water intake, and scheduled focus tasks. | Generated locally on your device by the operating system. |
| **Biometric Authentication (`USE_BIOMETRIC`)** | Allows unlocking confidential financial records with fingerprint or face recognition. | Authenticated entirely by Android's hardware Secure Enclave. Biometric data never leaves hardware. |

---

### 3. AI Copilot (Google Gemini API)

- When you interact with the Nova AI Assistant, your query is sent securely over encrypted HTTPS directly to the **Google Gemini API** to generate responses.
- Queries are stateless and are NOT shared with advertising or commercial third parties.

---

### 4. Data Retention and Deletion

- Because all data is stored locally on your device, you have complete control over your data.
- **Immediate Deletion:** You can delete individual records (loans, gold assets, tasks, job applications) at any time directly within the app.
- **Complete Wipe:** Uninstalling the app or clearing the app storage in Android Settings immediately and permanently deletes all stored data.

---

### 5. Children’s Privacy

Nova Life OS is not directed to individuals under the age of 13. We do not knowingly collect personal identifiable information from children.

---

### 6. Contact Us

If you have questions about this Privacy Policy or data security practices, please contact us at:  
**Email:** `bharathiragav@gmail.com`
