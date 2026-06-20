/**
 * Notify.gs — delivery seam.
 *
 * Delegates to the shared `Notifier` library (add it via Editor → Libraries,
 * identifier `Notifier`). The channel + webhook live in THIS agent's own Script
 * properties and are passed to the library as config — so the same library can
 * serve many agents, each on its own Slack channel.
 *
 * To change channel for ALL agents at once, edit the library, not this file.
 */

/**
 * Push a notification to your phone via the shared Notifier library.
 * @param {string} message  the body text.
 * @param {Object} [opts]   { title, click, category }.
 * @return {number} HTTP status code from the channel API.
 */
function sendNotification(message, opts) {
  var cfg = getConfig();
  if (!cfg.SLACK_WEBHOOK_URL) {
    throw new Error('SLACK_WEBHOOK_URL not set in Script properties.');
  }
  return Notifier.send(
    { channel: 'slack', webhookUrl: cfg.SLACK_WEBHOOK_URL, username: 'Gmail Agent' },
    message, opts || {}
  );
}

/**
 * Manual test — run this once from the editor to confirm a message reaches your
 * Slack channel before wiring up the triggers. (Requires the Notifier library
 * to be added to this project, and SLACK_WEBHOOK_URL set.)
 */
function testAlert() {
  var code = sendNotification(
    'Your alert pipeline works! (' + new Date() + ')',
    { title: '✅ Gmail-WA test', category: 'other' }
  );
  Logger.log('testAlert sent, status: %s', code);
}
