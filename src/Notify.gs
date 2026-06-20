/**
 * Notify.gs — the single message-delivery seam (Telegram).
 *
 * Everything that pushes a notification to your phone goes through
 * sendNotification(). It posts to the Telegram Bot API — free, reliable, and
 * rate-limited per-bot (not per-IP), so it avoids the shared-IP problem that
 * made ntfy unreliable from Apps Script. To switch channels again, change
 * ONLY this function.
 */

/**
 * Send a message to yourself via your Telegram bot.
 * @param {string} message  the message body.
 * @param {Object} [opts]    { title, click }  (priority/tags are ignored on Telegram).
 * @return {number} HTTP status code from the Telegram API.
 */
function sendNotification(message, opts) {
  opts = opts || {};
  var cfg = getConfig();
  if (!cfg.TELEGRAM_TOKEN || !cfg.TELEGRAM_CHAT_ID) {
    throw new Error('TELEGRAM_TOKEN / TELEGRAM_CHAT_ID not set in Script properties.');
  }

  // Title in bold, then the body. HTML parse mode, so escape dynamic content.
  var text = (opts.title ? '<b>' + htmlEscape_(opts.title) + '</b>\n\n' : '') + htmlEscape_(message);

  var payload = {
    chat_id: cfg.TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };
  // A tappable "Open in Gmail" button when a link is provided.
  if (opts.click) {
    payload.reply_markup = { inline_keyboard: [[{ text: '📨 Open in Gmail', url: opts.click }]] };
  }

  var url = 'https://api.telegram.org/bot' + cfg.TELEGRAM_TOKEN + '/sendMessage';
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    Logger.log('Telegram failed (%s): %s', code, res.getContentText());
  }
  return code;
}

/** Escape the characters Telegram's HTML parse mode treats specially. */
function htmlEscape_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Manual test — run this once from the editor to confirm a message actually
 * lands in your Telegram before wiring up the triggers.
 */
function testAlert() {
  var code = sendNotification(
    'Your alert pipeline works! (' + new Date() + ')',
    { title: '✅ Gmail-WA test' }
  );
  Logger.log('testAlert sent, status: %s', code);
}
