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
  var cfg = getConfig();

  // Important-mail check. everyMinutes() only accepts 1, 5, 10, 15, 30 — guard the value.
  var mins = ([1, 5, 10, 15, 30].indexOf(cfg.CHECK_MINUTES) !== -1) ? cfg.CHECK_MINUTES : 10;
  ScriptApp.newTrigger('checkImportantMail').timeBased().everyMinutes(mins).create();

  // Twice-daily (or however many hours you configured) summary.
  cfg.SUMMARY_HOURS.forEach(function (h) {
    ScriptApp.newTrigger('sendDailySummary').timeBased().atHour(h).everyDays(1).create();
  });

  Logger.log('Setup complete: ' + mins + '-min check + summaries at hour(s) '
    + cfg.SUMMARY_HOURS.join(', ') + ' (timezone from appsscript.json).');
}

/** Remove all of this project's triggers (use to pause the agent). */
function removeAllTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  Logger.log('All triggers removed.');
}
