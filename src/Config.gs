/**
 * Config.gs — central configuration.
 *
 * SECRETS ARE NOT STORED HERE. They are read at runtime from
 * Apps Script "Script properties" (Project Settings -> Script properties),
 * so this file is safe to commit to a public repo.
 *
 * Required Script properties:
 *   WHATSAPP_PHONE      e.g. 919876543210   (country code, digits only, no +)
 *   CALLMEBOT_APIKEY    your CallMeBot api key
 *   GEMINI_APIKEY       your Google AI Studio (Gemini) api key
 *
 * Optional Script properties (have sensible defaults below):
 *   GEMINI_MODEL, USE_AI, USER_CONTEXT,
 *   IMPORTANT_SENDERS, IMPORTANT_KEYWORDS, SUMMARY_HOURS,
 *   ALERT_LABEL, LOOKBACK, MAX_BATCH
 */

function getConfig() {
  var props = PropertiesService.getScriptProperties();
  function get(key, def) {
    var v = props.getProperty(key);
    return (v === null || v === undefined || v === '') ? def : v;
  }

  return {
    // ---- Secrets (set in Script properties) ----
    WHATSAPP_PHONE:   get('WHATSAPP_PHONE', ''),
    CALLMEBOT_APIKEY: get('CALLMEBOT_APIKEY', ''),
    GEMINI_APIKEY:    get('GEMINI_APIKEY', ''),

    // ---- AI behaviour ----
    GEMINI_MODEL: get('GEMINI_MODEL', 'gemini-2.5-flash'),
    USE_AI:       get('USE_AI', 'true') === 'true',

    // What matters to you, in plain English. Edit this one line anytime to retune.
    USER_CONTEXT: get('USER_CONTEXT',
      'I am actively applying for jobs. Treat as important: recruiter/HR outreach, ' +
      'interview invitations, online assessments/coding tests, application status updates, ' +
      'offers, and rejections - and anything time-sensitive. Also flag OTPs, ' +
      'bank/payment/bills, and personal or urgent messages. Ignore newsletters, marketing, ' +
      'and promotions unless clearly job-related.'),

    // ---- Optional fast-path boosters (empty by default; the AI does the work) ----
    IMPORTANT_SENDERS:  splitList_(get('IMPORTANT_SENDERS', '')),   // comma-separated emails/domains
    IMPORTANT_KEYWORDS: splitList_(get('IMPORTANT_KEYWORDS', '')),  // comma-separated words

    // ---- Scheduling / housekeeping ----
    SUMMARY_HOURS: get('SUMMARY_HOURS', '9,19')
      .split(',').map(function (s) { return parseInt(s.trim(), 10); })
      .filter(function (n) { return !isNaN(n); }),

    ALERT_LABEL: get('ALERT_LABEL', 'wa-alerted'),  // Gmail label applied to alerted mail (visibility)
    LOOKBACK:    get('LOOKBACK', '1d'),             // Gmail search window for the 5-min check
    MAX_BATCH:   parseInt(get('MAX_BATCH', '25'), 10) // max messages sent to AI per run
  };
}

/** "a@x.com, foo.com" -> ["a@x.com","foo.com"] (lowercased, trimmed, no blanks). */
function splitList_(s) {
  return (s || '').split(',')
    .map(function (x) { return x.trim().toLowerCase(); })
    .filter(function (x) { return x.length > 0; });
}
