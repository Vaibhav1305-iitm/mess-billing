// ===========================================
// ADD THIS CODE TO YOUR EXISTING Code.gs FILE
// ===========================================

// Handle Users (Profile) data - Add this case in your doGet/doPost function
// Look for the existing switch statement or if-else block that handles 'path' parameter
// and add this case:

/*
  case 'users':
    if (action === 'save') {
      return saveUser(data);
    } else if (action === 'get') {
      return getUser(e.parameter.deviceId);
    }
    break;
*/

// ===========================================
// ADD THESE FUNCTIONS AT THE END OF YOUR FILE
// ===========================================

/**
 * Save user profile to "Users" sheet
 * Creates the sheet if it doesn't exist
 */
function saveUser(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Users');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('Users');
      // Add headers
      sheet.getRange(1, 1, 1, 8).setValues([[
        'Device ID', 'Name', 'Phone', 'City', 'Pincode', 'Email', 'Registered At', 'Updated At'
      ]]);
      // Freeze header row
      sheet.setFrozenRows(1);
    }
    
    const deviceId = data.deviceId || '';
    const now = new Date().toISOString();
    
    // Check if user already exists (by deviceId)
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    let existingRow = -1;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === deviceId) {
        existingRow = i + 1; // 1-indexed
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
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'User saved' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get user profile by deviceId
 */
function getUser(deviceId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Users');
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'Users sheet not found' }))
        .setMimeType(ContentService.MimeType.JSON);
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
        return ContentService
          .createTextOutput(JSON.stringify(user))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'User not found' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


// ===========================================
// UPDATE YOUR doPost FUNCTION
// ===========================================
// Find your doPost function and add this case in the switch/if-else block:

/*
function doPost(e) {
  const path = e.parameter.path;
  const action = e.parameter.action;
  const data = JSON.parse(e.postData.contents);
  
  // ... existing code ...
  
  // ADD THIS:
  if (path === 'users') {
    if (action === 'save') {
      return saveUser(data);
    }
  }
  
  // ... rest of existing code ...
}
*/
