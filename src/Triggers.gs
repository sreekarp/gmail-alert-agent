/**
 * Triggers.gs — install / remove the time-based triggers.
 *
 * Run setup() ONCE from the editor after entering your Script properties.
 * On the first run Apps Script will ask you to authorize Gmail access — approve it.
 */

/**
 * Install all triggers. Safe to re-run: it clears this project's existing
 * triggers first so you never end up with duplicates.
 */
function setup() {
  removeAllTriggers();

  // Instant-ish important-mail check, every 5 minutes.
  ScriptApp.newTrigger('checkImportantMail').timeBased().everyMinutes(5).create();

  // Twice-daily (or however many hours you configured) summary.
  var cfg = getConfig();
  cfg.SUMMARY_HOURS.forEach(function (h) {
    ScriptApp.newTrigger('sendDailySummary').timeBased().atHour(h).everyDays(1).create();
  });

  Logger.log('Setup complete: 5-min check + summaries at hour(s) ' + cfg.SUMMARY_HOURS.join(', ')
    + ' (timezone from appsscript.json).');
}

/** Remove all of this project's triggers (use to pause the agent). */
function removeAllTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  Logger.log('All triggers removed.');
}
