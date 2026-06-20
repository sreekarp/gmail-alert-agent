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
 * TELEGRAM_TOKEN      |   yes    | 8123456:AAE1xxxxxxxx    (from @BotFather)
 * TELEGRAM_CHAT_ID    |   yes    | 123456789               (your chat id, from getUpdates)
 * GEMINI_APIKEY       |   yes*   | AIzaSy...               (* required when USE_AI=true)
 *
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
 * Minimum to get running: TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, GEMINI_APIKEY.
 * Everything else can stay default.
 *
 * NOTE: keep TELEGRAM_TOKEN secret — anyone with it can post as your bot.
 */
