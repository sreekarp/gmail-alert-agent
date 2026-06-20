/**
 * Notify.gs — the single message-delivery seam.
 *
 * Everything that sends a message to your phone goes through sendWhatsApp().
 * To switch to Telegram later, change ONLY this function (call the Telegram
 * Bot API sendMessage instead) and nothing else in the project needs to change.
 */

/**
 * Send a WhatsApp message to yourself via the free CallMeBot service.
 * @param {string} text
 * @return {number} HTTP status code returned by CallMeBot.
 */
function sendWhatsApp(text) {
  var cfg = getConfig();
  if (!cfg.WHATSAPP_PHONE || !cfg.CALLMEBOT_APIKEY) {
    throw new Error('WHATSAPP_PHONE / CALLMEBOT_APIKEY not set in Script properties.');
  }

  var url = 'https://api.callmebot.com/whatsapp.php'
    + '?phone='  + encodeURIComponent(cfg.WHATSAPP_PHONE)
    + '&text='   + encodeURIComponent(text)
    + '&apikey=' + encodeURIComponent(cfg.CALLMEBOT_APIKEY);

  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    Logger.log('CallMeBot failed (%s): %s', code, res.getContentText());
  }
  return code;
}

/**
 * Manual test — run this once from the editor to confirm a WhatsApp
 * message actually lands on your phone before wiring up the triggers.
 */
function testAlert() {
  var code = sendWhatsApp('✅ Gmail-WA test: your alert pipeline works! (' + new Date() + ')');
  Logger.log('testAlert sent, status: %s', code);
}
