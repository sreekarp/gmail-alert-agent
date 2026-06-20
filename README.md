# 📧➡️📱 Gmail-WA — Free AI Gmail Watcher with WhatsApp Alerts & Summaries

A personal AI agent that watches your Gmail and:

- 🔔 **Alerts you on WhatsApp** the moment an **important** mail arrives (checked every 5 minutes).
- 🗞️ **Sends a twice-daily summary** of what you received, grouped and one-lined by AI.
- 🧠 **Auto-decides what's important** using a Google Gemini model tuned to *your* context
  (default: actively job-hunting — recruiter mail, interviews, assessments, offers, OTPs, bills…).

**Cost: ₹0.** No server, no laptop left on. It runs entirely inside **Google Apps Script**
(Google's free cloud), which has native Gmail access and free scheduled triggers.

---

## How it works

```
Google Apps Script (free, runs in your Google account)
  ├─ every 5 min  → checkImportantMail()  → Gemini classifies → WhatsApp alert (CallMeBot)
  └─ 09:00 & 19:00 → sendDailySummary()   → Gemini summarizes → WhatsApp digest (CallMeBot)
```

- **WhatsApp delivery:** free [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/) service.
- **AI:** free-tier [Google Gemini](https://aistudio.google.com) (one API key).
- **Importance:** AI by default; you can also add must-alert senders/keywords as a fast-path.
- **No duplicate alerts:** each message is alerted at most once (tracked internally + a `wa-alerted` Gmail label).

> ⏱️ Alerts are **near-real-time (~5 min)**, not instant. True instant push would need a paid/always-on
> server, which defeats the "free, no server" goal.

---

## Repo layout

```
gmail-wa/
├─ src/
│  ├─ Config.gs        # reads settings from Script properties — NO secrets in code
│  ├─ Notify.gs        # sendWhatsApp() — the one place to swap to Telegram
│  ├─ AI.gs            # Gemini classify + summarize
│  ├─ Importance.gs    # checkImportantMail() — the instant-alert path
│  ├─ Summary.gs       # sendDailySummary() — the digest path
│  └─ Triggers.gs      # setup() installs the schedule
├─ appsscript.json     # manifest (timezone + OAuth scopes)
├─ Config.example.gs   # documents every Script property to set (no real values)
├─ .gitignore
├─ LICENSE
└─ README.md
```

---

## Setup (one time, ~15 min)

You'll do three things: get a WhatsApp key, get a Gemini key, then paste the code into Apps Script.

### 1. Get your free WhatsApp key (CallMeBot)
1. On your phone, add **+34 644 84 71 89** to contacts (e.g. as "CallMeBot").
2. From **the WhatsApp number you want alerts on**, send this message to that contact:
   `I allow callmebot to send me messages`
3. You'll get a reply with your **API key**. Note it, plus your phone number in the form
   `<countrycode><number>` digits only, no `+` (e.g. `919876543210`).

### 2. Get your free Gemini API key
1. Go to **https://aistudio.google.com** → **Get API key** → create a key.
2. Copy the key (looks like `AIzaSy...`).

### 3. Create the Apps Script project
> ⚠️ **Sign in as `sreekar0664@gmail.com`** (the mailbox you want watched). Apps Script reads the
> mailbox of the account that authorizes it.

**Option A — copy/paste (simplest):**
1. Go to **https://script.google.com** → **New project**.
2. For each file in `src/`, create a matching script file (`+` → *Script*) and paste its contents.
   Also open the project manifest (Project Settings → *Show "appsscript.json"*) and paste
   `appsscript.json`.
3. **Project Settings (⚙) → Script properties → Add** the values from `Config.example.gs`
   (at minimum `WHATSAPP_PHONE`, `CALLMEBOT_APIKEY`, `GEMINI_APIKEY`).

**Option B — clasp (keeps GitHub ↔ Apps Script in sync):**
```bash
npm install -g @google/clasp
clasp login                      # sign in as sreekar0664@gmail.com
clasp create --title "Gmail-WA" --type standalone --rootDir ./src
clasp push
```
Then add the Script properties in the editor as in Option A, step 3.

### 4. Authorize & turn it on
1. In the editor, select **`testAlert`** → **Run**. Approve the permission prompts.
   ✅ You should get a WhatsApp test message within a few seconds.
2. Select **`setup`** → **Run**. This installs the triggers (5-min check + summaries).
3. Done — it now runs on its own. Check **Triggers (⏰)** to confirm two/three triggers exist.

---

## Tuning

Everything is a Script property — change it in **Project Settings → Script properties**, no code edits:

| Property | What it does |
|---|---|
| `USER_CONTEXT` | Plain-English description of what's important to you. Edit anytime to retune the AI. |
| `IMPORTANT_SENDERS` | Comma-separated must-alert senders/domains (fast-path, skips AI). |
| `IMPORTANT_KEYWORDS` | Comma-separated must-alert keywords. |
| `SUMMARY_HOURS` | 24h clock, comma-separated, e.g. `9,19`. |
| `GEMINI_MODEL` | e.g. `gemini-2.5-flash`. |
| `USE_AI` | `false` = rule-only mode (you maintain the lists). |

To **pause** the agent: run `removeAllTriggers`. To resume: run `setup`.

---

## Verifying it works

- **Important:** email yourself a job-style message (subject *"Interview invitation — please pick a slot"*).
  Within ~5 min you get a WhatsApp alert; the mail gets the `wa-alerted` label; it won't re-alert.
- **Not important:** email yourself an obvious newsletter → no alert.
- **Summary:** run `sendDailySummary` manually → a grouped digest arrives on WhatsApp.

---

## Switching WhatsApp → Telegram (optional, also free & more reliable)

Only `sendWhatsApp()` in `src/Notify.gs` needs to change: create a Telegram bot via **@BotFather**,
get your chat id, store `TELEGRAM_TOKEN` / `TELEGRAM_CHAT_ID` as Script properties, and call
`https://api.telegram.org/bot<token>/sendMessage`. Nothing else in the project changes.

---

## Costs & limits (all comfortably within free tiers)

- **Apps Script:** ~90 min/day trigger runtime + 20k `UrlFetch`/day — far above what this needs.
- **Gemini free tier:** called only on 5-min runs that actually have new mail (most have none), one
  batched call per run. A few dozen calls/day typically. If you get huge volume, raise the poll interval.
- **CallMeBot:** free, lightly rate-limited (the code throttles multi-alert bursts).

## Privacy

Your mail never leaves Google except the subject/short preview of *new* messages sent to Google's own
Gemini API for classification/summary. No third party stores your inbox. Secrets live only in your
Apps Script project's Script properties, never in this repo.

## License

MIT — see [LICENSE](LICENSE).
