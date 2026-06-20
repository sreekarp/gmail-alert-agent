/**
 * Config.example.gs — DOCUMENTATION ONLY (not loaded by the app).
 *
 * This file lists every Script property the agent reads, with example
 * values, so you (and anyone cloning the repo) know what to set.
 *
 * DO NOT put real keys in any committed .gs file. Instead set them in:
 *   Apps Script editor -> Project Settings (gear) -> Script properties -> Add
 *
 * --------------------------------------------------------------------------
 * Property            | Required | Example value
 * --------------------------------------------------------------------------
 * NTFY_TOPIC          |   yes    | sreekar-mail-9f3kx2qz   (SECRET: pick a long random string)
 * GEMINI_APIKEY       |   yes*   | AIzaSy...               (* required when USE_AI=true)
 *
 * NTFY_SERVER         |   no     | https://ntfy.sh         (only change if you self-host ntfy)
 * NTFY_TOKEN          |   no     | tk_xxxxxxxx             (free ntfy account token; avoids shared-IP 429s)
 * GEMINI_MODEL        |   no     | gemini-2.5-flash        (any current free Flash model)
 * USE_AI              |   no     | true                    ("false" = rule-only, you maintain lists)
 * USER_CONTEXT        |   no     | I am actively applying for jobs. Treat as important: ...
 * IMPORTANT_SENDERS   |   no     | hr@company.com, naukri.com, linkedin.com
 * IMPORTANT_KEYWORDS  |   no     | otp, interview, offer, assessment, payment
 * SUMMARY_HOURS       |   no     | 9,19                    (24h clock, comma-separated)
 * CHECK_MINUTES       |   no     | 10                      (important-mail poll; allowed: 1,5,10,15,30)
 * ALERT_LABEL         |   no     | wa-alerted              (Gmail label put on alerted mail)
 * LOOKBACK            |   no     | 1d                      (Gmail search window for the 5-min check)
 * MAX_BATCH           |   no     | 25                      (max mails sent to AI per run)
 * --------------------------------------------------------------------------
 *
 * Minimum to get running: NTFY_TOPIC, GEMINI_APIKEY.
 * Everything else can stay default.
 *
 * NOTE on NTFY_TOPIC: anyone who knows your topic name can read your alerts
 * (and send to it). Treat it like a password — make it long and random.
 */
