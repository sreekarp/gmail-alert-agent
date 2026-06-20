/**
 * AI.gs — Google Gemini (free tier) calls for importance classification
 * and digest summarization. All network calls are best-effort: on any
 * error they return null and the caller fails *quiet* (no false alerts).
 */

/**
 * Low-level Gemini call.
 * @param {string} prompt
 * @param {boolean} asJson  request JSON output (responseMimeType).
 * @return {string|null} the model's text output, or null on error.
 */
function geminiGenerate_(prompt, asJson) {
  var cfg = getConfig();
  if (!cfg.GEMINI_APIKEY) throw new Error('GEMINI_APIKEY not set in Script properties.');

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/'
    + encodeURIComponent(cfg.GEMINI_MODEL)
    + ':generateContent?key=' + encodeURIComponent(cfg.GEMINI_APIKEY);

  var payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2 }
  };
  // Gemma models don't support forced-JSON mode; rely on the prompt + parseJsonArray_ salvage instead.
  var isGemma = /^gemma/i.test(cfg.GEMINI_MODEL);
  if (asJson && !isGemma) payload.generationConfig.responseMimeType = 'application/json';

  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var code = res.getResponseCode();
  var body = res.getContentText();
  if (code < 200 || code >= 300) {
    Logger.log('Gemini HTTP %s: %s', code, body);
    return null;
  }
  try {
    var data = JSON.parse(body);
    return data.candidates[0].content.parts[0].text;
  } catch (e) {
    Logger.log('Gemini parse error: %s | body=%s', e, body);
    return null;
  }
}

/**
 * Classify a batch of messages as important / not, given the user's context.
 * @param {Array<{id:string, from:string, subject:string, snippet:string}>} batch
 * @param {string} userContext
 * @return {Object} map of id -> {important:boolean, category:string}
 */
function geminiClassify(batch, userContext) {
  if (!batch || !batch.length) return {};

  var items = batch.map(function (m, i) {
    return (i + 1) + '. id=' + m.id
      + ' | from: ' + m.from
      + ' | subject: ' + m.subject
      + ' | preview: ' + String(m.snippet || '').slice(0, 300);
  }).join('\n');

  var prompt =
    'You are an email triage assistant. The user\'s context is:\n"' + userContext + '"\n\n' +
    'For each email below, decide if it is IMPORTANT enough to alert the user immediately ' +
    'on their phone. Be selective: only flag mail that truly needs prompt attention given the ' +
    'context. Return ONLY raw JSON (no markdown, no code fences) — a JSON array, one object per email, exactly like:\n' +
    '[{"id":"<id>","important":true,"category":"interview","summary":"Recruiter from Acme invites you to a technical interview; pick a slot by Friday."}]\n' +
    'The "category" is one short word (e.g. interview, recruiter, assessment, offer, ' +
    'rejection, otp, payment, personal, other).\n' +
    'The "summary" is a concise 1-2 sentence plain-text summary of what the email is about and ' +
    'any action or deadline. Keep it under ~240 characters. (You may give a summary even when ' +
    'important is false; it is only used for important ones.)\n\n' +
    'Emails:\n' + items;

  var out = geminiGenerate_(prompt, true);
  if (!out) return {};

  var arr = parseJsonArray_(out);
  if (!arr) { Logger.log('geminiClassify: could not parse: %s', out); return {}; }

  var result = {};
  arr.forEach(function (o) {
    if (o && o.id != null) {
      result[String(o.id)] = {
        important: !!o.important,
        category: o.category || 'other',
        summary: o.summary || ''
      };
    }
  });
  return result;
}

/**
 * Summarize recent mail into grouped one-liners for the digest.
 * @param {string} text  newline-separated "From / Subject / preview" lines.
 * @return {string|null}
 */
function geminiSummarize(text) {
  var prompt =
    'Summarize the following emails as a quick phone digest. ' +
    'Group them by category (e.g. Jobs, Finance, Personal, Other). ' +
    'Under each group, give one short line per email: sender - what it is / what action is needed. ' +
    'Be tight and skimmable. Plain text only, no markdown headings.\n\n' + text;
  return geminiGenerate_(prompt, false);
}

/** Parse a JSON array, salvaging it from surrounding text if needed. */
function parseJsonArray_(s) {
  try { return JSON.parse(s); } catch (e) { /* fall through */ }
  var m = String(s).match(/\[[\s\S]*\]/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch (e2) { return null; }
}
