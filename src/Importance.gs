/**
 * Importance.gs — the "instant alert" path.
 *
 * checkImportantMail() runs every CHECK_MINUTES minutes (default 10; see Triggers.gs).
 * It finds new unread mail, decides what's important (optional rule fast-path, then
 * ONE batched Gemini call), and sends a push alert for each important message.
 *
 * De-duplication is per-message via a small map of processed message ids kept
 * in Script properties (PROCESSED_IDS), pruned to the last 2 days. This is more
 * precise than labels alone: a new reply in an old thread is still seen.
 */

function checkImportantMail() {
  var cfg = getConfig();
  var processed = loadProcessed_();          // { messageId: epochMillis }
  var now = Date.now();

  // Search covers Promotions/Updates/Social too (job mail often lands there).
  var threads = GmailApp.search('is:unread newer_than:' + cfg.LOOKBACK, 0, 50);

  // Collect new, unread, not-yet-processed messages.
  var candidates = [];
  threads.forEach(function (th) {
    th.getMessages().forEach(function (msg) {
      var id = msg.getId();
      if (msg.isUnread() && !processed[id]) {
        candidates.push({
          thread:  th,
          id:      id,
          from:    msg.getFrom(),
          subject: msg.getSubject() || '(no subject)',
          snippet: safeBody_(msg)
        });
      }
    });
  });

  if (candidates.length) {
    var important = [];   // [{ item, category }]
    var handled = {};     // ids we made a decision about this run

    // 1) Optional rule fast-path.
    var remaining = [];
    candidates.forEach(function (c) {
      var hit = ruleMatch_(c, cfg);
      if (hit) { important.push({ item: c, category: hit, summary: '' }); handled[c.id] = true; }
      else { remaining.push(c); }
    });

    // 2) AI batch (capped at MAX_BATCH; overflow waits for the next run).
    if (cfg.USE_AI && remaining.length) {
      var batch = remaining.slice(0, cfg.MAX_BATCH);
      var verdicts = geminiClassify(batch.map(toBatchItem_), cfg.USER_CONTEXT);
      batch.forEach(function (c) {
        var v = verdicts[c.id];
        if (v) {                                   // got a verdict -> decided
          handled[c.id] = true;
          if (v.important) important.push({ item: c, category: v.category, summary: v.summary });
        }
        // no verdict -> leave unhandled, retry next run
      });
    } else if (!cfg.USE_AI) {
      // Rule-only mode: anything not matched by a rule is treated as not important.
      remaining.forEach(function (c) { handled[c.id] = true; });
    }

    // 3) Alert + label important ones.
    var alertLabel = getOrCreateLabel_(cfg.ALERT_LABEL);
    important.forEach(function (h, idx) {
      var c = h.item;
      var title = 'Important mail' + (h.category ? ' [' + h.category + ']' : '');
      // Prefer the AI's clean 1-2 line summary; fall back to a short snippet.
      var gist = (h.summary && h.summary.trim())
        ? h.summary.trim()
        : (c.snippet ? c.snippet.slice(0, 180) + '…' : '');
      var body = gist + '\n\nFrom: ' + cleanFrom_(c.from) + '\nSubject: ' + c.subject;
      sendNotification(body, { title: title, priority: 5, tags: 'email', click: gmailMsgLink_(c.id) });
      try { c.thread.addLabel(alertLabel); } catch (e) { /* visibility only */ }
      if (idx < important.length - 1) Utilities.sleep(1000);
    });

    // 4) Record everything we decided so we never reprocess it.
    Object.keys(handled).forEach(function (id) { processed[id] = now; });
  }

  saveProcessed_(prune_(processed, now));
}

/* ---------------- helpers ---------------- */

function toBatchItem_(c) {
  return { id: c.id, from: c.from, subject: c.subject, snippet: c.snippet };
}

/** Returns a category string if a rule matches, else null. */
function ruleMatch_(c, cfg) {
  var from = (c.from || '').toLowerCase();
  for (var i = 0; i < cfg.IMPORTANT_SENDERS.length; i++) {
    if (from.indexOf(cfg.IMPORTANT_SENDERS[i]) !== -1) return 'sender';
  }
  var hay = (c.subject + ' ' + c.snippet).toLowerCase();
  for (var j = 0; j < cfg.IMPORTANT_KEYWORDS.length; j++) {
    if (hay.indexOf(cfg.IMPORTANT_KEYWORDS[j]) !== -1) return 'keyword';
  }
  return null;
}

function safeBody_(msg) {
  try { return (msg.getPlainBody() || '').replace(/\s+/g, ' ').slice(0, 400); }
  catch (e) { return ''; }
}

function getOrCreateLabel_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

/* ---- Gmail deep links (tap the notification to open the mail) ---- */

/** The account segment for Gmail URLs (the email of the account running the script). */
function gmailAccount_() {
  try { return Session.getActiveUser().getEmail() || '0'; } catch (e) { return '0'; }
}

/** Direct link to a specific message (#all works wherever it lives: inbox/promotions/etc). */
function gmailMsgLink_(id) {
  return 'https://mail.google.com/mail/u/' + gmailAccount_() + '/#all/' + id;
}

/** Link to the inbox (used by the digest). */
function gmailInboxLink_() {
  return 'https://mail.google.com/mail/u/' + gmailAccount_() + '/#inbox';
}

/* ---- processed-id store (per-message dedupe) ---- */

function loadProcessed_() {
  var raw = PropertiesService.getScriptProperties().getProperty('PROCESSED_IDS');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (e) { return {}; }
}

function saveProcessed_(map) {
  PropertiesService.getScriptProperties().setProperty('PROCESSED_IDS', JSON.stringify(map));
}

function prune_(map, now) {
  var cutoff = now - 2 * 24 * 60 * 60 * 1000; // keep last 2 days
  var out = {};
  Object.keys(map).forEach(function (k) { if (map[k] >= cutoff) out[k] = map[k]; });
  return out;
}
