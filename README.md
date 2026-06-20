# 📧➡️📱 Gmail Alert Agent — Free AI Gmail Watcher with Phone Alerts & Summaries

A personal AI agent that watches your Gmail and:

- 🔔 **Pushes an instant alert to your phone** the moment an **important** mail arrives (checked every 10 minutes, configurable).
- 🗞️ **Sends a twice-daily summary** of what you received, grouped and one-lined by AI.
- 🧠 **Auto-decides what's important** using a Google Gemini model tuned to *your* context
  (default: actively job-hunting — recruiter mail, interviews, assessments, offers, OTPs, bills…).

**Cost: ₹0.** No server, no laptop left on. It runs entirely inside **Google Apps Script**
(Google's free cloud), which has native Gmail access and free scheduled triggers. Alerts are delivered
through **Slack** (via the shared [`Notifier`](https://github.com/sreekarp/gas-notifier) library) — free,
works in India, and rate-limited per-webhook (not per-IP).

---

## How it works

```
Google Apps Script (free, runs in your Google account)
  ├─ every 10 min  → checkImportantMail()  → Gemini classifies → Notifier → Slack (📱 phone)
  └─ 09:00 & 19:00 → sendDailySummary()    → Gemini summarizes → Notifier → Slack (📱 phone)
```

- **Delivery:** free **Slack Incoming Webhook**, sent through the shared
  [`Notifier`](https://github.com/sreekarp/gas-notifier) library (so future agents reuse one channel layer).
- **AI:** free-tier [Google Gemini](https://aistudio.google.com) (one API key).
- **Importance:** AI by default; you can also add must-alert senders/keywords as a fast-path.
- **No duplicate alerts:** each message is alerted at most once (tracked internally + a `wa-alerted` Gmail label).

> ⏱️ Alerts are **near-real-time (~10 min, configurable via `CHECK_MINUTES`)**, not instant. True instant
> push would need a paid/always-on server, which defeats the "free, no server" goal.

> 📲 **Why Slack?** WhatsApp bridges (CallMeBot) are unreliable; ntfy *and* Discord rate-limit **per IP**
> (Discord via Cloudflare `1015`) and fail intermittently from Apps Script's shared Google IPs; Telegram is
> currently blocked in India. Slack is free, works in India, and its webhooks are limited **per-webhook**,
> so the shared-IP problem doesn't apply. Delivery goes through the shared `Notifier` library, so switching
> channels later is a one-library change — see [below](#switching-channels).

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

You'll do these things: set up the Slack channel + Notifier library, get a Gemini key, then load the
code into Apps Script.

### 1. Create your Slack Incoming Webhook
1. Install **Slack** on your phone and create a free workspace (or reuse one) → a channel, e.g.
   `#gmail-alerts`. Set the channel's notifications to **All** so pushes arrive.
2. Create an **Incoming Webhook**: https://api.slack.com/messaging/webhooks (or workspace → Apps →
   "Incoming Webhooks" → Add to Slack → pick the channel) → **Copy Webhook URL**
   (`https://hooks.slack.com/services/...`). That's your `SLACK_WEBHOOK_URL`. Keep it secret.

### 1b. Add the shared Notifier library
This agent sends through the [`Notifier`](https://github.com/sreekarp/gas-notifier) library. In the Apps
Script editor → **Libraries (＋)** → paste the library's **Script ID** → pick the latest version → set the
identifier to **`Notifier`** → Add. (See the gas-notifier README for deploying it.)

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
   (at minimum `SLACK_WEBHOOK_URL` and `GEMINI_APIKEY`).

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
   ✅ You should get a message in your Slack channel within a few seconds.
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
| `GEMINI_MODEL` | e.g. `gemini-2.0-flash` (generous free daily quota; `gemini-2.5-flash` free tier is only ~20/day). |
| `USE_AI` | `false` = rule-only mode (you maintain the lists). |
| `SLACK_WEBHOOK_URL` | Your Slack Incoming Webhook (delivery). |

To **pause** the agent: run `removeAllTriggers`. To resume: run `setup`.

---

## Verifying it works

- **Important:** email yourself a job-style message (subject *"Interview invitation — please pick a slot"*).
  Within ~10 min you get a Slack alert; the mail gets the `wa-alerted` label; it won't re-alert.
- **Not important:** email yourself an obvious newsletter → no alert.
- **Summary:** run `sendDailySummary` manually → a grouped digest message arrives.

---

## Switching channels

This project uses **Slack** by default, and all delivery goes through the shared
[`Notifier`](https://github.com/sreekarp/gas-notifier) library. `Notify.gs` here is just a 6-line wrapper.

- **To switch channel for THIS agent only:** change the `channel` (and config) passed to `Notifier.send`
  in [src/Notify.gs](src/Notify.gs). `Notifier` already ships a `telegram` channel as a fallback.
- **To switch channel for ALL your agents at once:** edit the `Notifier` library (add/adjust a channel in
  its `send()`), and every agent picks it up. That's the whole point of the shared library.

Nothing else in this project changes.

---

## Costs & limits (all comfortably within free tiers)

- **Apps Script:** ~90 min/day trigger runtime + 20k `UrlFetch`/day — far above what this needs.
- **Gemini free tier:** called only on poll runs that actually have new mail (most have none), one
  batched call per run. A few dozen calls/day typically. If you get huge volume, raise the poll interval.
- **Slack:** free; Incoming Webhooks are rate-limited **per webhook** (~1/sec, short bursts ok) — far
  beyond this project's needs, and not affected by Apps Script's shared IPs (why we moved off ntfy/Discord).
  Works in India, no VPN.

## Privacy

Your mail never leaves Google except the subject/short preview of *new* messages sent to Google's own
Gemini API for classification/summary, and the alert text sent to Slack. No third party stores your
inbox. Secrets live only in your Apps Script project's Script properties, never in this repo.

## License

MIT — see [LICENSE](LICENSE).
