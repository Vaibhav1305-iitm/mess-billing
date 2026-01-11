// ===========================================
// MessFlow - Complete Google Apps Script Backend
// ===========================================

// Your Google Spreadsheet ID (replace with your own)
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// ===========================================
// CORS Headers for all responses
// ===========================================
function createCorsResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===========================================
// Handle GET Requests
// ===========================================
function doGet(e) {
  const path = e.parameter.path;
  const action = e.parameter.action;
  
  try {
    // Handle Entries
    if (path === 'entries' && action === 'get') {
      return getEntries();
    }
    
    // Handle Pricing
    if (path === 'pricing' && action === 'get') {
      return getPricingRules();
    }
    
    // Handle Users
    if (path === 'users' && action === 'get') {
      const deviceId = e.parameter.deviceId;
      return getUser(deviceId);
    }
    
    return createCorsResponse({ error: 'Invalid path or action' });
    
  } catch (error) {
    return createCorsResponse({ error: error.message });
  }
}

// ===========================================
// Handle POST Requests
// ===========================================
function doPost(e) {
  const path = e.parameter.path;
  const action = e.parameter.action;
  
  let data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return createCorsResponse({ error: 'Invalid JSON data' });
  }
  
  try {
    // Handle Entries
    if (path === 'entries') {
      if (action === 'add') {
        return addEntry(data);
      }
      if (action === 'delete') {
        return deleteEntry(data);
      }
    }
    
    // Handle Pricing
    if (path === 'pricing') {
      if (action === 'add' || action === 'update') {
        return savePricingRule(data);
      }
      if (action === 'delete') {
        return deletePricingRule(data);
      }
    }
    
    // Handle Users
    if (path === 'users') {
      if (action === 'save') {
        return saveUser(data);
      }
    }
    
    return createCorsResponse({ error: 'Invalid path or action' });
    
  } catch (error) {
    return createCorsResponse({ error: error.message });
  }
}

// ===========================================
// ENTRIES FUNCTIONS
// ===========================================

function getEntries() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Entries');
  
  if (!sheet) {
    // Create sheet with headers if doesn't exist
    sheet = ss.insertSheet('Entries');
    sheet.getRange(1, 1, 1, 6).setValues([['Date', 'Morning', 'Evening', 'Total', 'Amount', 'ID']]);
    sheet.setFrozenRows(1);
    return createCorsResponse([]);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const entries = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // Has date
      entries.push({
        date: row[0],
        morning: row[1] || 0,
        evening: row[2] || 0,
        total: row[3] || 0,
        amount: row[4] || 0,
        id: row[5] || row[0]
      });
    }
  }
  
  return createCorsResponse(entries);
}

function addEntry(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Entries');
  
  if (!sheet) {
    sheet = ss.insertSheet('Entries');
    sheet.getRange(1, 1, 1, 6).setValues([['Date', 'Morning', 'Evening', 'Total', 'Amount', 'ID']]);
    sheet.setFrozenRows(1);
  }
  
  const date = data.date;
  const morning = data.morning || 0;
  const evening = data.evening || 0;
  const total = morning + evening;
  const amount = data.amount || 0;
  const id = data.id || date;
  
  // Check if entry with same date exists
  const allData = sheet.getDataRange().getValues();
  let existingRow = -1;
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === date) {
      existingRow = i + 1;
      break;
    }
  }
  
  const rowData = [date, morning, evening, total, amount, id];
  
  if (existingRow > 0) {
    // Update existing
    sheet.getRange(existingRow, 1, 1, 6).setValues([rowData]);
  } else {
    // Add new
    sheet.appendRow(rowData);
  }
  
  return createCorsResponse({ success: true, message: 'Entry saved' });
}

function deleteEntry(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Entries');
  
  if (!sheet) {
    return createCorsResponse({ success: false, error: 'Entries sheet not found' });
  }
  
  const date = data.date;
  const allData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === date) {
      sheet.deleteRow(i + 1);
      return createCorsResponse({ success: true, message: 'Entry deleted' });
    }
  }
  
  return createCorsResponse({ success: false, error: 'Entry not found' });
}

// ===========================================
// PRICING FUNCTIONS
// ===========================================

function getPricingRules() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Pricing');
  
  if (!sheet) {
    sheet = ss.insertSheet('Pricing');
    sheet.getRange(1, 1, 1, 5).setValues([['ID', 'Start Date', 'End Date', 'Morning Rate', 'Evening Rate']]);
    sheet.setFrozenRows(1);
    return createCorsResponse([]);
  }
  
  const data = sheet.getDataRange().getValues();
  const rules = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) {
      rules.push({
        id: row[0],
        start_date: row[1],
        end_date: row[2] || null,
        morning_rate: row[3] || 0,
        evening_rate: row[4] || 0
      });
    }
  }
  
  return createCorsResponse(rules);
}

function savePricingRule(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Pricing');
  
  if (!sheet) {
    sheet = ss.insertSheet('Pricing');
    sheet.getRange(1, 1, 1, 5).setValues([['ID', 'Start Date', 'End Date', 'Morning Rate', 'Evening Rate']]);
    sheet.setFrozenRows(1);
  }
  
  const id = data.id || 'RULE-' + Date.now();
  const startDate = data.start_date;
  const endDate = data.end_date || '';
  const morningRate = data.morning_rate || 0;
  const eveningRate = data.evening_rate || 0;
  
  // Check if rule exists
  const allData = sheet.getDataRange().getValues();
  let existingRow = -1;
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] == id) {
      existingRow = i + 1;
      break;
    }
  }
  
  const rowData = [id, startDate, endDate, morningRate, eveningRate];
  
  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, 5).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  return createCorsResponse({ success: true, id: id, message: 'Pricing rule saved' });
}

function deletePricingRule(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Pricing');
  
  if (!sheet) {
    return createCorsResponse({ success: false, error: 'Pricing sheet not found' });
  }
  
  const id = data.id;
  const allData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] == id) {
      sheet.deleteRow(i + 1);
      return createCorsResponse({ success: true, message: 'Pricing rule deleted' });
    }
  }
  
  return createCorsResponse({ success: false, error: 'Rule not found' });
}

// ===========================================
// USERS FUNCTIONS
// ===========================================

function saveUser(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Users');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('Users');
      sheet.getRange(1, 1, 1, 8).setValues([[
        'Device ID', 'Name', 'Phone', 'City', 'Pincode', 'Email', 'Registered At', 'Updated At'
      ]]);
      sheet.setFrozenRows(1);
      // Set column widths
      sheet.setColumnWidth(1, 200);
      sheet.setColumnWidth(2, 150);
      sheet.setColumnWidth(3, 120);
    }
    
    const deviceId = data.deviceId || '';
    const now = new Date().toISOString();
    
    // Check if user already exists (by deviceId)
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    let existingRow = -1;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === deviceId) {
        existingRow = i + 1;
        break;
      }
    }
    
    const rowData = [
      deviceId,
      data.name || '',
      data.phone || '',
      data.city || '',
      data.pincode || '',
      data.email || '',
      data.registeredAt || now,
      now
    ];
    
    if (existingRow > 0) {
      // Update existing user
      sheet.getRange(existingRow, 1, 1, 8).setValues([rowData]);
    } else {
      // Add new user
      sheet.appendRow(rowData);
    }
    
    return createCorsResponse({ success: true, message: 'User saved' });
    
  } catch (error) {
    return createCorsResponse({ success: false, error: error.message });
  }
}

function getUser(deviceId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Users');
    
    if (!sheet) {
      return createCorsResponse({ success: false, error: 'Users sheet not found' });
    }
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === deviceId) {
        const user = {
          deviceId: values[i][0],
          name: values[i][1],
          phone: values[i][2],
          city: values[i][3],
          pincode: values[i][4],
          email: values[i][5],
          registeredAt: values[i][6],
          updatedAt: values[i][7]
        };
        return createCorsResponse(user);
      }
    }
    
    return createCorsResponse({ success: false, error: 'User not found' });
    
  } catch (error) {
    return createCorsResponse({ success: false, error: error.message });
  }
}
