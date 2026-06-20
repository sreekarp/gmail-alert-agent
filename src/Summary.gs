/**
 * Summary.gs — the twice-daily digest path.
 *
 * sendDailySummary() runs at the configured SUMMARY_HOURS (see Triggers.gs).
 * It gathers mail received since the last summary and sends ONE WhatsApp digest
 * (AI-grouped one-liners, with a plain rule-based fallback if AI is off/unavailable).
 */

function sendDailySummary() {
  var cfg = getConfig();
  var props = PropertiesService.getScriptProperties();

  var lastTs = parseInt(props.getProperty('LAST_SUMMARY_TS') || '0', 10);
  var sinceMs = lastTs || (Date.now() - 12 * 60 * 60 * 1000); // default window: last 12h
  var afterSecs = Math.floor(sinceMs / 1000);

  // Gmail 'after:' is whole-day granular, so we also filter by exact timestamp below.
  var threads = GmailApp.search('newer_than:2d after:' + afterSecs, 0, 60);
  var msgs = [];
  threads.forEach(function (th) {
    th.getMessages().forEach(function (m) {
      if (m.getDate().getTime() >= sinceMs) {
        msgs.push({ from: m.getFrom(), subject: m.getSubject() || '(no subject)', snippet: safeBody_(m) });
      }
    });
  });

  if (!msgs.length) {
    sendNotification('No new mail since the last summary.',
      { title: 'Mail digest', priority: 2, tags: 'newspaper' });
    props.setProperty('LAST_SUMMARY_TS', String(Date.now()));
    return;
  }

  var body = null;
  if (cfg.USE_AI) {
    var listText = msgs.slice(0, 40).map(function (m) {
      return '- From: ' + m.from + ' | Subject: ' + m.subject + ' | ' + m.snippet.slice(0, 200);
    }).join('\n');
    body = geminiSummarize(listText);
  }
  if (!body) {
    // Fallback: plain list of sender - subject.
    body = msgs.slice(0, 25).map(function (m) {
      return '• ' + cleanFrom_(m.from) + ' - ' + m.subject;
    }).join('\n');
  }

  sendNotification(body,
    { title: 'Mail digest (' + msgs.length + ' new)', priority: 3, tags: 'newspaper',
      click: gmailInboxLink_() });
  props.setProperty('LAST_SUMMARY_TS', String(Date.now()));
}

/** "Acme HR <hr@acme.com>" -> "Acme HR" (falls back to the raw value). */
function cleanFrom_(from) {
  var m = (from || '').match(/^(.*?)</);
  var name = (m ? m[1].trim() : from).replace(/"/g, '');
  return name || from;
}
