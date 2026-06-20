/**
 * Notify.gs — the single message-delivery seam.
 *
 * Everything that pushes a notification to your phone goes through
 * sendNotification(). It uses ntfy (https://ntfy.sh) — a free, no-account
 * push service. To switch channels later (Telegram, Discord, WhatsApp...),
 * change ONLY this function; nothing else in the project needs to change.
 */

/**
 * Push a notification to your phone via ntfy.
 * @param {string} message  the notification body.
 * @param {Object} [opts]    { title, priority (1-5), tags }.
 * @return {number} HTTP status code from ntfy.
 */
function sendNotification(message, opts) {
  opts = opts || {};
  var cfg = getConfig();
  if (!cfg.NTFY_TOPIC) {
    throw new Error('NTFY_TOPIC not set in Script properties.');
  }

  var url = cfg.NTFY_SERVER.replace(/\/+$/, '') + '/' + encodeURIComponent(cfg.NTFY_TOPIC);

  var headers = {};
  if (opts.title)    headers['Title'] = asciiHeader_(opts.title);   // ntfy headers must be ASCII
  if (opts.priority) headers['Priority'] = String(opts.priority);   // 1=min .. 5=urgent
  if (opts.tags)     headers['Tags'] = opts.tags;                   // e.g. "email" (emoji shortcodes)
  if (opts.click)    headers['Click'] = opts.click;                 // tap the notification -> open this URL

  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'text/plain; charset=utf-8',
    payload: message,
    headers: headers,
    muteHttpExceptions: true
  });

  var code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    Logger.log('ntfy failed (%s): %s', code, res.getContentText());
  }
  return code;
}

/** ntfy headers must be ASCII — strip anything else (e.g. emoji in titles). */
function asciiHeader_(s) {
  return String(s).replace(/[^\x20-\x7E]/g, '').trim() || 'Notification';
}

/**
 * Manual test — run this once from the editor to confirm a push actually
 * lands on your phone before wiring up the triggers.
 */
function testAlert() {
  var code = sendNotification(
    'Your alert pipeline works! (' + new Date() + ')',
    { title: 'Gmail-WA test', priority: 4, tags: 'white_check_mark' }
  );
  Logger.log('testAlert sent, status: %s', code);
}
