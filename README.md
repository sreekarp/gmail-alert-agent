# 📧➡️📱 Gmail Alert Agent — Free AI Gmail Watcher with Phone Alerts & Summaries

A personal AI agent that watches your Gmail and:

- 🔔 **Pushes an instant alert to your phone** the moment an **important** mail arrives (checked every 10 minutes, configurable).
- 🗞️ **Sends a twice-daily summary** of what you received, grouped and one-lined by AI.
- 🧠 **Auto-decides what's important** using a Google Gemini model tuned to *your* context
  (default: actively job-hunting — recruiter mail, interviews, assessments, offers, OTPs, bills…).

**Cost: ₹0.** No server, no laptop left on. It runs entirely inside **Google Apps Script**
(Google's free cloud), which has native Gmail access and free scheduled triggers. Alerts are delivered
through **[ntfy](https://ntfy.sh)** — a free, no-account push service with a Play Store app.

---

## How it works

```
Google Apps Script (free, runs in your Google account)
  ├─ every 10 min  → checkImportantMail()  → Gemini classifies → ntfy push (📱 your phone)
  └─ 09:00 & 19:00 → sendDailySummary()    → Gemini summarizes → ntfy push (📱 your phone)
```

- **Delivery:** free [ntfy](https://ntfy.sh) — install the app, pick a secret topic, done. No account/keys.
- **AI:** free-tier [Google Gemini](https://aistudio.google.com) (one API key).
- **Importance:** AI by default; you can also add must-alert senders/keywords as a fast-path.
- **No duplicate alerts:** each message is alerted at most once (tracked internally + a `wa-alerted` Gmail label).

> ⏱️ Alerts are **near-real-time (~10 min, configurable via `CHECK_MINUTES`)**, not instant. True instant
> push would need a paid/always-on server, which defeats the "free, no server" goal.

> 📲 **Why ntfy and not WhatsApp?** A free, server-less WhatsApp bridge (CallMeBot) exists but is an
> unreliable third party that goes down often. ntfy is free, reliable, and just as instant. You can still
> switch to Telegram/Discord/WhatsApp later by editing one function — see [below](#switching-channels).

---

## Repo layout

```
gmail-alert-agent/
├─ src/                 # clasp rootDir — everything here is pushed to Apps Script
│  ├─ Config.gs        # reads settings from Script properties — NO secrets in code
│  ├─ Notify.gs        # sendNotification() — the one place to swap channels
│  ├─ AI.gs            # Gemini classify + summarize
│  ├─ Importance.gs    # checkImportantMail() — the instant-alert path
│  ├─ Summary.gs       # sendDailySummary() — the digest path
│  ├─ Triggers.gs      # setup() installs the schedule
│  └─ appsscript.json  # manifest (timezone + OAuth scopes)
├─ Config.example.gs   # documents every Script property to set (no real values)
├─ .clasp.json         # (gitignored) links local ↔ your Apps Script project id
├─ .gitignore
├─ LICENSE
└─ README.md
```

---

## Setup (one time, ~15 min)

You'll do three things: set up ntfy on your phone, get a Gemini key, then paste the code into Apps Script.

### 1. Set up ntfy on your phone
1. Install the **ntfy** app from the Play Store (Samsung/Android).
2. Pick a **secret topic name** — treat it like a password, make it long and random,
   e.g. `sreekar-mail-9f3kx2qz`. (Anyone who knows the topic can read your alerts.)
3. In the app: **＋ → Subscribe to topic** → enter that exact topic name.
   That's it — no account, no key.

### 2. Get your free Gemini API key
1. Go to **https://aistudio.google.com** → **Get API key** → create a key.
2. Copy the key (looks like `AIzaSy...`).

### 3. Create the Apps Script project
> ⚠️ **Sign in as `sreekar0664@gmail.com`** (the mailbox you want watched). Apps Script reads the
> mailbox of the account that authorizes it.

**Option A — copy/paste (simplest):**
1. Go to **https://script.google.com** → **New project**.
2. For each file in `src/`, create a matching script file (`+` → *Script*) and paste its contents.
   Also open the manifest (Project Settings → *Show "appsscript.json"*) and paste `appsscript.json`.
3. **Project Settings (⚙) → Script properties → Add** the values from `Config.example.gs`
   (at minimum `NTFY_TOPIC` and `GEMINI_APIKEY`).

**Option B — clasp (push code from this repo instead of copy-pasting):**
```bash
# one-time
npm install -g @google/clasp
clasp login                      # sign in as sreekar0664@gmail.com
# enable the Apps Script API once: https://script.google.com/home/usersettings

# if you DON'T have a project yet:
clasp create --title "Gmail Alert Agent" --type standalone --rootDir ./src

# if you ALREADY have a project: put its Script ID in .clasp.json
#   { "scriptId": "<from Project Settings → IDs>", "rootDir": "src" }

# thereafter, every update is just:
clasp push --force
```
Then add the Script properties in the editor as in Option A, step 3. (`.clasp.json`
holds your private script id and is gitignored, so it's never committed.)

### 4. Authorize & turn it on
1. In the editor, select **`testAlert`** → **Run**. Approve the permission prompts.
   ✅ You should get an ntfy push on your phone within a few seconds.
2. Select **`setup`** → **Run**. This installs the triggers (10-min check + summaries).
3. Done — it now runs on its own. Check **Triggers (⏰)** to confirm the triggers exist.

---

## Tuning

Everything is a Script property — change it in **Project Settings → Script properties**, no code edits:

| Property | What it does |
|---|---|
| `USER_CONTEXT` | Plain-English description of what's important to you. Edit anytime to retune the AI. |
| `IMPORTANT_SENDERS` | Comma-separated must-alert senders/domains (fast-path, skips AI). |
| `IMPORTANT_KEYWORDS` | Comma-separated must-alert keywords. |
| `SUMMARY_HOURS` | 24h clock, comma-separated, e.g. `9,19`. **Re-run `setup` after changing.** |
| `CHECK_MINUTES` | Important-mail poll interval. Allowed: 1, 5, 10, 15, 30. **Re-run `setup` after changing.** |
| `GEMINI_MODEL` | e.g. `gemini-2.5-flash`. |
| `USE_AI` | `false` = rule-only mode (you maintain the lists). |
| `NTFY_TOKEN` | Free ntfy account token → per-account rate limits (avoids shared-IP `429`s). |

To **pause** the agent: run `removeAllTriggers`. To resume: run `setup`.

---

## Verifying it works

- **Important:** email yourself a job-style message (subject *"Interview invitation — please pick a slot"*).
  Within ~10 min you get a push; the mail gets the `wa-alerted` label; it won't re-alert.
- **Not important:** email yourself an obvious newsletter → no alert.
- **Summary:** run `sendDailySummary` manually → a grouped digest push arrives.

---

## Switching channels

All delivery lives in one function — `sendNotification()` in [src/Notify.gs](src/Notify.gs). To change
channels, edit only that function:

- **Telegram** (free, very reliable): create a bot via **@BotFather**, get a token + your chat id,
  store them as Script properties, and call `https://api.telegram.org/bot<token>/sendMessage`.
- **Discord** (free): create a channel webhook and POST `{ "content": message }` to the webhook URL.
- **WhatsApp** (free but flaky): use [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/)
  — `https://api.callmebot.com/whatsapp.php?phone=<num>&text=<msg>&apikey=<key>`.

Nothing else in the project changes.

---

## Costs & limits (all comfortably within free tiers)

- **Apps Script:** ~90 min/day trigger runtime + 20k `UrlFetch`/day — far above what this needs.
- **Gemini free tier:** called only on poll runs that actually have new mail (most have none), one
  batched call per run. A few dozen calls/day typically. If you get huge volume, raise the poll interval.
- **ntfy:** free public server, rate-limited **per IP**. Since Apps Script shares Google egress IPs with
  other users, heavy bursts (or rapid manual testing) can hit a `429 too many requests`. Normal volume is
  fine. To make it robust, create a **free ntfy.sh account**, generate an **access token**, and set it as
  the `NTFY_TOKEN` Script property — your messages then count against your account (per-user limit) instead
  of the shared IP.

## Privacy

Your mail never leaves Google except the subject/short preview of *new* messages sent to Google's own
Gemini API for classification/summary, and the alert text pushed to ntfy. No third party stores your
inbox. Secrets live only in your Apps Script project's Script properties, never in this repo.

## License

MIT — see [LICENSE](LICENSE).
