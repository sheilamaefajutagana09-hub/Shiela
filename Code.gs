function submitConsultation(data) {
  return upsertLead_(data);
}

/**
 * Sheila Mae Fajutagana | The Financially Savvy Realtor
 * Leads + consultation capture + 30-day email sequence
 *
 * SETUP:
 * 1) Create/open a Google Sheet and run setupLeadsSystem() once.
 * 2) Deploy this script as a Web App: Execute as Me; Who has access: Anyone.
 * 3) Put the deployment URL in CONFIG.CONSULTATION_URL only if needed.
 * 4) In the website's consultation form, POST JSON to the Web App URL.
 */

const CONFIG = {
  SHEET_NAME: 'Leads',
  EVENTS_SHEET_NAME: 'Email Events',
  OWNER_NAME: 'Sheila Mae Fajutagana',
  FROM_NAME: 'Sheila Mae Fajutagana | The Financially Savvy Realtor',
  REPLY_TO: 'sheilamaefajutagana09@gmail.com', // optional: e.g. sheila@example.com
  OWNER_NOTIFY_EMAIL: 'sheilamaefajutagana09@gmail.com', // where new-lead alerts go
  CONSULTATION_URL: 'https://script.google.com/macros/s/AKfycbz7wc20cP7R0kQq4Xwy_oQqSnavEviZvBA2IcPsgRYXDcRfA7FB1AM_WWN69dUFbA3DqQ/exec',
  FACEBOOK_URL: 'https://www.facebook.com/profile.php?id=61577472729033',
  LOGO_URL: 'https://lh3.googleusercontent.com/d/1CJ1DAYKk0Bx9atBF38CwiLeVZZRc4OVX=w2000',
  TIMEZONE: Session.getScriptTimeZone() || 'Asia/Manila',
  DAILY_SEND_LIMIT: 80
};

const LEAD_HEADERS = [
  'Lead ID', 'Created At', 'First Name', 'Last Name', 'Email', 'Phone',
  'Lead Source', 'Property Interest', 'Budget', 'Preferred Area',
  'Consultation Date', 'Notes', 'Consent', 'Status', 'Sequence Start',
  'Next Send Date', 'Last Sent Date', 'Last Email Step', 'Unsubscribed At',
  'Last Error', 'Updated At'
];
const EVENT_HEADERS = ['Timestamp', 'Lead ID', 'Email', 'Step', 'Subject', 'Result', 'Details'];

function setupLeadsSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Bind this script to the new Leads Google Sheet first.');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ss.getId());
  const leads = getOrCreateSheet_(ss, CONFIG.SHEET_NAME, LEAD_HEADERS);
  const events = getOrCreateSheet_(ss, CONFIG.EVENTS_SHEET_NAME, EVENT_HEADERS);
  [leads, events].forEach(s => {
    s.setFrozenRows(1);
    s.getRange(1, 1, 1, s.getLastColumn()).setFontWeight('bold').setBackground('#1f4e5f').setFontColor('#ffffff');
    s.autoResizeColumns(1, s.getLastColumn());
  });
  if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'sendDueSequenceEmails')) {
    ScriptApp.newTrigger('sendDueSequenceEmails').timeBased().everyDays(1).atHour(9).create();
  }
  return { spreadsheetId: ss.getId(), spreadsheetUrl: ss.getUrl(), message: 'Setup complete.' };
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Sheila Mae Fajutagana | The Financially Savvy Realtor')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Accepts JSON or form-encoded consultation submissions. */
function doPost(e) {
  try {
    const data = parseRequest_(e);
    if (data.action === 'unsubscribe') return json_({ ok: unsubscribeLead_(data.email) });
    if (!data.email) return json_({ ok: false, error: 'Email is required.' });

    const lead = upsertLead_(data);

    if (lead.isNew) {
      try { notifyOwnerOfNewLead_(data); } catch (notifyErr) { console.error('Owner notification failed: ' + (notifyErr.message || notifyErr)); }
    }

    try { sendDueSequenceEmails(); } catch (sendErr) { console.error('Immediate send failed: ' + (sendErr.message || sendErr)); }

    return json_({ ok: true, leadId: lead.id, message: 'Thank you. Your consultation request was received.' });
  } catch (err) {
    console.error(err.stack || err);
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function parseRequest_(e) {
  const raw = e && e.postData && e.postData.contents;
  if (raw) {
    try { return Object.assign({}, JSON.parse(raw)); } catch (_) {}
  }
  return (e && e.parameter) || {};
}

function upsertLead_(data) {
  const sheet = getSheet_(CONFIG.SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  const email = String(data.email).trim().toLowerCase();
  let row = -1;
  for (let i = 1; i < values.length; i++) if (String(values[i][4]).toLowerCase() === email) { row = i + 1; break; }
  const isNew = row === -1;
  const now = new Date();
  const id = row > 0 ? sheet.getRange(row, 1).getValue() : Utilities.getUuid();
  const existing = row > 0 ? sheet.getRange(row, 1, 1, LEAD_HEADERS.length).getValues()[0] : [];
  const start = row > 0 && existing[14] ? existing[14] : now;
  const next = row > 0 && existing[15] ? existing[15] : now;
  const record = [
    id, row > 0 ? existing[1] : now, data.firstName || data.first_name || '', data.lastName || data.last_name || '',
    email, data.phone || '', data.source || 'Website consultation', data.propertyInterest || data.property_interest || '',
    data.budget || '', data.preferredArea || data.preferred_area || '', data.consultationDate || data.consultation_date || '',
    data.notes || '', data.consent === false || String(data.consent).toLowerCase() === 'false' ? false : true,
    row > 0 ? (existing[13] || 'Active') : 'Active', start, next, row > 0 ? existing[16] : '',
    row > 0 ? existing[17] : '', row > 0 ? existing[18] : '', row > 0 ? existing[19] : '', now
  ];
  if (row > 0) sheet.getRange(row, 1, 1, record.length).setValues([record]);
  else sheet.appendRow(record);
  return { id, email, isNew };
}

/** Sends Sheila a heads-up email whenever a brand-new lead comes in. */
function notifyOwnerOfNewLead_(data) {
  const to = CONFIG.OWNER_NOTIFY_EMAIL;
  if (!to) return;
  const fullName = (data.firstName || data.first_name || '') + ' ' + (data.lastName || data.last_name || '');
  const subject = 'New consultation lead: ' + fullName.trim();
  const lines = [
    'Name: ' + fullName.trim(),
    'Email: ' + (data.email || ''),
    'Phone: ' + (data.phone || ''),
    'Property interest: ' + (data.propertyInterest || data.property_interest || ''),
    'Budget: ' + (data.budget || ''),
    'Preferred area: ' + (data.preferredArea || data.preferred_area || ''),
    'Notes: ' + (data.notes || ''),
    'Source: ' + (data.source || '')
  ];
  if (data.surveyAnswers && data.surveyAnswers.length) {
    lines.push('');
    lines.push('Survey answers:');
    data.surveyAnswers.forEach(function (item, i) {
      lines.push((i + 1) + '. ' + item.question + ' -> ' + (item.answer || 'No answer'));
    });
  }
  GmailApp.sendEmail(to, subject, lines.join('\n'));
}

function sendDueSequenceEmails() {
  const sheet = getSheet_(CONFIG.SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  const today = startOfDay_(new Date());
  let sent = 0;
  for (let i = 1; i < rows.length && sent < CONFIG.DAILY_SEND_LIMIT; i++) {
    const r = rows[i], row = i + 1;
    const email = String(r[4] || '').trim();
    if (!email || r[13] !== 'Active' || r[18] || r[12] === false) continue;
    const start = startOfDay_(new Date(r[14] || r[1]));
    const days = Math.floor((today - start) / 86400000);
    const step = nextSequenceStep_(days, r[17] === '' ? -1 : Number(r[17]));
    if (!step || (r[15] && startOfDay_(new Date(r[15])) > today)) continue;
    try {
      const firstName = r[2] || 'there';
      const rendered = renderEmail_(step, firstName, email);
      const options = { name: CONFIG.FROM_NAME, htmlBody: rendered.html, replyTo: CONFIG.REPLY_TO || undefined };
      GmailApp.sendEmail(email, rendered.subject, rendered.text, options);
      const next = new Date(today.getTime() + 86400000);
      sheet.getRange(row, 16).setValue(next);
      sheet.getRange(row, 17).setValue(now_());
      sheet.getRange(row, 18).setValue(step.day);
      sheet.getRange(row, 20).setValue('');
      sheet.getRange(row, 21).setValue(now_());
      logEvent_(r[0], email, step.day, rendered.subject, 'sent', ''); sent++;
    } catch (err) {
      sheet.getRange(row, 20, 1, 2).setValues([[String(err.message || err), now_()]]);
      logEvent_(r[0], email, step.day, step.subject, 'error', String(err.message || err));
    }
  }
  return { sent };
}

function nextSequenceStep_(days, lastStep) {
  const due = SEQUENCE.filter(s => days >= s.day && s.day > lastStep);
  return due.length ? due[0] : null;
}

const SEQUENCE = [
  { day: 0, subject: 'Thank you for reaching out, {{firstName}}', title: 'Let’s clarify your next real estate move', body: 'Thank you for requesting a consultation. I’ll help you understand your options, numbers, and next best step—without pressure.' },
  { day: 2, subject: '3 questions to make your property search easier', title: 'Start with clarity, not guesswork', body: 'Before viewing properties, clarify your purpose, comfortable budget, and preferred timeline. These three answers make every next step more focused.' },
  { day: 5, subject: 'How to set a realistic property budget', title: 'Your budget should support your life', body: 'A good property decision considers cash flow, financing, fees, and future flexibility—not just the listing price.' },
  { day: 8, subject: 'Buying or selling? Here is what to prepare', title: 'A simple preparation checklist', body: 'Gather your target area, budget range, timeline, and must-haves. I can help you turn these into a practical plan.' },
  { day: 12, subject: 'The mistake I want you to avoid', title: 'Do not rush because of pressure', body: 'The right property should make sense financially and personally. A consultation gives you a calm space to compare choices.' },
  { day: 16, subject: 'What happens during a consultation?', title: 'A clear, no-pressure conversation', body: 'We discuss your goals, answer your questions, review possible next steps, and identify what information you still need.' },
  { day: 20, subject: 'A smarter way to compare properties', title: 'Compare the whole picture', body: 'Look beyond photos and price: location, total ownership cost, condition, resale potential, and fit with your plans all matter.' },
  { day: 24, subject: 'Still exploring your options?', title: 'You do not have to decide today', body: 'If you are still researching, that is okay. I can help you organize the information so you can move when the decision is right.' },
  { day: 27, subject: 'Would a quick consultation help?', title: 'Let’s make your next step clearer', body: 'A short conversation can help you identify your priorities and avoid expensive assumptions.' },
  { day: 30, subject: 'I’ll leave the door open, {{firstName}}', title: 'Here whenever you are ready', body: 'I’ll stop the regular sequence after today. If you would like personalized guidance, you can still book a consultation anytime.' }
];

function renderEmail_(step, firstName, email) {
  const consultation = CONFIG.CONSULTATION_URL;
  const facebook = CONFIG.FACEBOOK_URL;
  const unsubUrl = `${consultation}?action=unsubscribe&email=${encodeURIComponent(email)}`;
  const subject = step.subject.replace(/{{firstName}}/g, firstName);
  const body = step.body.replace(/{{firstName}}/g, firstName);
  const safeName = escape_(firstName);
  const safeTitle = escape_(step.title);
  const safeBody = escape_(body);

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#efe7d6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#efe7d6; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#f7f2e7; border-radius:14px; overflow:hidden; border:1px solid #e6dcc4;">

          <tr>
            <td style="background-color:#081222; padding:26px 32px; text-align:center;">
              <img src="${CONFIG.LOGO_URL}" alt="Financially Savvy Realtor" width="150" style="display:block; margin:0 auto 10px; max-width:150px; height:auto;">
              <div style="font-family:'Work Sans', Arial, sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#f2dfa8;">Financially Savvy Realtor</div>
            </td>
          </tr>

          <tr>
            <td style="padding:38px 36px 8px;">
              <p style="margin:0 0 18px; font-family:'Work Sans', Arial, sans-serif; font-size:15px; color:#141414;">Hi ${safeName},</p>
              <h1 style="margin:0 0 16px; font-family:Georgia, 'Playfair Display', serif; font-weight:700; font-size:22px; line-height:1.3; color:#081222;">${safeTitle}</h1>
              <p style="margin:0 0 26px; font-family:'Work Sans', Arial, sans-serif; font-size:15px; line-height:1.7; color:#3d372c;">${safeBody}</p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:999px; background-color:#c99a3a;">
                    <a href="${facebook}" target="_blank" style="display:inline-block; padding:14px 30px; font-family:'Work Sans', Arial, sans-serif; font-weight:700; font-size:14px; color:#081222; text-decoration:none; border-radius:999px;">Visit our Facebook Page</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:30px 36px 10px;">
              <div style="border-top:1px solid #e6dcc4; padding-top:22px; font-family:'Work Sans', Arial, sans-serif; font-size:14px; color:#3d372c;">
                <div style="font-style:italic; font-family:Georgia, 'Playfair Display', serif; font-size:17px; color:#c99a3a; margin-bottom:4px;">${escape_(CONFIG.OWNER_NAME)}</div>
                <div style="font-size:12px; letter-spacing:0.5px; text-transform:uppercase; color:#8a8272;">The Financially Savvy Realtor</div>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background-color:#081222; padding:20px 36px; text-align:center;">
              <p style="margin:0 0 6px; font-family:'Work Sans', Arial, sans-serif; font-size:11px; color:rgba(247,242,231,0.55);">You received this because you requested information from The Financially Savvy Realtor.</p>
              <a href="${unsubUrl}" style="font-family:'Work Sans', Arial, sans-serif; font-size:11px; color:#e6c25f; text-decoration:underline;">Unsubscribe</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hi ${firstName},\n\n${step.title}\n\n${body}\n\nVisit our Facebook Page: ${facebook}\n\nWarmly,\n${CONFIG.OWNER_NAME}\nThe Financially Savvy Realtor\n\nUnsubscribe: ${unsubUrl}`;

  return { subject, html, text };
}

function unsubscribeLead_(email) {
  const sheet = getSheet_(CONFIG.SHEET_NAME), values = sheet.getDataRange().getValues();
  email = String(email || '').toLowerCase().trim();
  for (let i = 1; i < values.length; i++) if (String(values[i][4]).toLowerCase() === email) {
    sheet.getRange(i + 1, 14).setValue('Unsubscribed'); sheet.getRange(i + 1, 19).setValue(now_()); sheet.getRange(i + 1, 21).setValue(now_()); return true;
  }
  return false;
}

function logEvent_(id, email, step, subject, result, details) { getSheet_(CONFIG.EVENTS_SHEET_NAME).appendRow([now_(), id, email, step, subject, result, details]); }
function getSheet_(name) { const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'); const ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet(); if (!ss) throw new Error('Spreadsheet not configured. Run setupLeadsSystem().'); return ss.getSheetByName(name) || getOrCreateSheet_(ss, name, name === CONFIG.SHEET_NAME ? LEAD_HEADERS : EVENT_HEADERS); }
function getOrCreateSheet_(ss, name, headers) { let s = ss.getSheetByName(name); if (!s) s = ss.insertSheet(name); if (s.getLastRow() === 0) s.getRange(1, 1, 1, headers.length).setValues([headers]); return s; }
function now_() { return new Date(); }
function startOfDay_(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function escape_(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function testSendDueSequenceEmails() { return sendDueSequenceEmails(); }

function debugSendForOneEmail(targetEmail) {
  const sheet = getSheet_(CONFIG.SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  const today = startOfDay_(new Date());
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[4]).toLowerCase() !== targetEmail.toLowerCase()) continue;
    const start = startOfDay_(new Date(r[14] || r[1]));
    const days = Math.floor((today - start) / 86400000);
    const lastStep = r[17] === '' ? -1 : Number(r[17]);
    const step = nextSequenceStep_(days, lastStep);
    return {
      row: i + 1,
      status: r[13],
      unsubscribed: r[18],
      consent: r[12],
      sequenceStart: r[14],
      nextSendDate: r[15],
      lastSentDate: r[16],
      lastEmailStep: r[17],
      daysSinceStart: days,
      wouldSendStep: step,
      lastError: r[19]
    };
  }
  return 'Lead not found for that email';
}
