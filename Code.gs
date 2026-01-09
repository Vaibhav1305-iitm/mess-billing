// ========================================
// MESS BILLING - GOOGLE APPS SCRIPT BACKEND
// ========================================
// 🔧 YOUR SPREADSHEET ID - ALREADY CONFIGURED!
const SPREADSHEET_ID = '1XM2Q1gQTPg9yp7N5Vv4aMbcvHViGkD7EN7Urwu-uw7Q';
// Sheet names (will be created automatically)
const ENTRIES_SHEET_NAME = 'Entries';
const PRICING_SHEET_NAME = 'Pricing';

// ========================================
// MAIN HTTP HANDLER
// ========================================
function doGet(e) {
  try {
    const path = e.parameter.path || '';
    const action = e.parameter.action || 'get';
    
    if (path === 'entries') {
      return getEntries();
    } else if (path === 'pricing') {
      return getPricingRules();
    } else if (path === 'status') {
      return createJsonResponse({ status: 'ok', message: 'Server running!' });
    }
    
    return createJsonResponse({ error: 'Invalid path' });
  } catch (error) {
    return createJsonResponse({ error: error.toString() });
  }
}

function doPost(e) {
  try {
    const path = e.parameter.path || '';
    const action = e.parameter.action || '';
    const data = JSON.parse(e.postData.contents);
    
    if (path === 'entries') {
      if (action === 'add') return addEntry(data);
      if (action === 'delete') return deleteEntry(data);
    } else if (path === 'pricing') {
      if (action === 'add') return addPricingRule(data);
      if (action === 'update') return updatePricingRule(data);
      if (action === 'delete') return deletePricingRule(data);
    }
    
    return createJsonResponse({ error: 'Invalid path or action' });
  } catch (error) {
    return createJsonResponse({ error: error.toString() });
  }
}

// ========================================
// HELPER: Format Date to YYYY-MM-DD string
// ========================================
function formatDateToString(value) {
  if (!value) return '';
  
  // If it's already a string in correct format
  if (typeof value === 'string') {
    // Check if it's YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    // Try to parse it
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }
    return value;
  }
  
  // If it's a Date object
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  
  return String(value);
}

// ========================================
// ENTRIES FUNCTIONS
// ========================================
function getEntries() {
  const sheet = getSheet(ENTRIES_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return createJsonResponse([]);
  
  const headers = data[0];
  const entries = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Skip empty rows
    if (!row[0]) continue;
    
    const entry = {};
    for (let j = 0; j < headers.length; j++) {
      let value = row[j];
      const header = String(headers[j]).toLowerCase();
      
      // Format dates properly
      if (header === 'date' || header === 'start_date' || header === 'end_date') {
        value = formatDateToString(value);
      }
      // Ensure month is string format YYYY-MM
      else if (header === 'month') {
        if (value instanceof Date) {
          value = Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM');
        } else if (value) {
          value = String(value);
        }
      }
      // Ensure numbers for numeric fields
      else if (header === 'morning' || header === 'evening' || header === 'total' || header === 'year' || header === 'amount') {
        value = Number(value) || 0;
      }
      
      entry[headers[j]] = value;
    }
    entries.push(entry);
  }
  
  return createJsonResponse(entries);
}

function addEntry(data) {
  const sheet = getSheet(ENTRIES_SHEET_NAME);
  const existingData = sheet.getDataRange().getValues();
  
  // Format incoming date
  const dateStr = formatDateToString(data.date);
  
  // Update if date exists
  for (let i = 1; i < existingData.length; i++) {
    const rowDate = formatDateToString(existingData[i][0]);
    if (rowDate === dateStr) {
      sheet.getRange(i + 1, 1, 1, 8).setValues([[
        dateStr, data.day || '', data.morning || 0, data.evening || 0,
        data.total || 0, data.month || '', data.year || '', data.amount || 0
      ]]);
      return createJsonResponse({ success: true, message: 'Entry updated' });
    }
  }
  
  // Add new entry
  sheet.appendRow([
    dateStr, data.day || '', data.morning || 0, data.evening || 0,
    data.total || 0, data.month || '', data.year || '', data.amount || 0
  ]);
  
  return createJsonResponse({ success: true, message: 'Entry added' });
}

function deleteEntry(data) {
  const sheet = getSheet(ENTRIES_SHEET_NAME);
  const dataRange = sheet.getDataRange().getValues();
  const targetDate = formatDateToString(data.date);
  
  for (let i = 1; i < dataRange.length; i++) {
    const rowDate = formatDateToString(dataRange[i][0]);
    if (rowDate === targetDate) {
      sheet.deleteRow(i + 1);
      return createJsonResponse({ success: true, message: 'Entry deleted' });
    }
  }
  
  return createJsonResponse({ error: 'Entry not found' });
}

// ========================================
// PRICING RULES FUNCTIONS
// ========================================
function getPricingRules() {
  const sheet = getSheet(PRICING_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return createJsonResponse([]);
  
  const headers = data[0];
  const rules = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0] && row[0] !== 0) continue; // Skip empty rows
    
    const rule = {};
    for (let j = 0; j < headers.length; j++) {
      let value = row[j];
      const header = String(headers[j]).toLowerCase();
      
      // Format dates properly
      if (header === 'start_date' || header === 'end_date') {
        value = formatDateToString(value);
      }
      
      rule[headers[j]] = value;
    }
    rules.push(rule);
  }
  
  return createJsonResponse(rules);
}

function addPricingRule(data) {
  const sheet = getSheet(PRICING_SHEET_NAME);
  const lastRow = sheet.getLastRow();
  const newId = lastRow > 1 ? parseInt(sheet.getRange(lastRow, 1).getValue()) + 1 : 1;
  
  sheet.appendRow([
    newId, 
    formatDateToString(data.start_date), 
    formatDateToString(data.end_date) || '',
    data.morning_rate || 46, 
    data.evening_rate || 46
  ]);
  
  return createJsonResponse({ success: true, id: newId });
}

function updatePricingRule(data) {
  const sheet = getSheet(PRICING_SHEET_NAME);
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] == data.id) {
      sheet.getRange(i + 1, 1, 1, 5).setValues([[
        data.id, 
        formatDateToString(data.start_date), 
        formatDateToString(data.end_date) || '',
        data.morning_rate || 46, 
        data.evening_rate || 46
      ]]);
      return createJsonResponse({ success: true });
    }
  }
  
  return createJsonResponse({ error: 'Rule not found' });
}

function deletePricingRule(data) {
  const sheet = getSheet(PRICING_SHEET_NAME);
  const dataRange = sheet.getDataRange().getValues();
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] == data.id) {
      sheet.deleteRow(i + 1);
      return createJsonResponse({ success: true });
    }
  }
  
  return createJsonResponse({ error: 'Rule not found' });
}

// ========================================
// HELPER FUNCTIONS
// ========================================
function getSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  // AUTO CREATE SHEET if it doesn't exist!
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    
    // Add headers automatically
    if (sheetName === ENTRIES_SHEET_NAME) {
      sheet.appendRow(['date', 'day', 'morning', 'evening', 'total', 'month', 'year', 'amount']);
    } else if (sheetName === PRICING_SHEET_NAME) {
      sheet.appendRow(['id', 'start_date', 'end_date', 'morning_rate', 'evening_rate']);
      // Add default pricing rule
      sheet.appendRow([1, '2024-01-01', '', 46, 46]);
    }
    
    // Format header row (blue background, white text, bold)
    const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285f4');
    headerRange.setFontColor('#ffffff');
  }
  
  return sheet;
}

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
