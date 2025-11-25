/***** CONFIG *****/

const NXTWAVE_CFG = {
  SHEET_NAME: 'Shortlisted Candidates',
  HEADER_ROW: 1,
  RESPONSE_COLUMN: 'Assessment Stats Response', // Column name to store API response

  API_ENDPOINT: 'https://nxtwave-assessments-backend-topin-prod-apis.ccbp.in/api/nw_integrations/assessment/candidates/attempt/stats/get/v1/',
  API_KEY: 'bUNcWjtg.2Y32iis4JmKr2s5PilEFpUiAguJ9ukqo',

  // Column names in sheet
  ASSESSMENT_ID_COLUMN: 'Org_assess_id',
  CANDIDATE_ID_COLUMN: 'User ID', // Column name for candidate ID (not "Nxtwave User ID")
  MAX_COLUMNS_TO_CHECK: 100, // Maximum columns to check for headers (increased to find columns further right)

  // OPTIONAL: Test override IDs — if set (non-empty), the script will use these instead of attempting to read them from the sheet.
  // You provided these IDs; they are inserted here as defaults. Remove or empty them to restore normal behavior.
  TEST_IDS: {
    USER_ID: '944823cb-e1e2-4d15-8cc4-9a9497b9a5ee',
    ASSESS_ID: '498cc1cb-1a78-4490-8cbe-b1c06c883799'
  }
};

/***** MAIN FUNCTION *****/

/**
 * Fetches assessment stats from Nxtwave API for the currently active row
 * Reads Org_assess_id and User ID from the sheet, calls API, and stores response
 */
function fetchAssessmentStatsForActiveRow() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(NXTWAVE_CFG.SHEET_NAME);

    if (!sheet) {
      SpreadsheetApp.getUi().alert('Error: Sheet "' + NXTWAVE_CFG.SHEET_NAME + '" not found.');
      return;
    }

    const activeRange = sheet.getActiveRange();
    if (!activeRange) {
      SpreadsheetApp.getUi().alert('Error: Please select a row first.');
      return;
    }

    const row = activeRange.getRow();
    if (row === NXTWAVE_CFG.HEADER_ROW) {
      SpreadsheetApp.getUi().alert('Error: Cannot process header row. Please select a data row.');
      return;
    }

    // Read headers directly from the sheet
    const headers = readHeaders_(sheet);
    console.log('Headers read from sheet (first 20):', headers.slice(0, 20));

    // Read row data
    const rowData = readRowObj_(sheet, row, headers);

    if (!rowData || Object.keys(rowData).length === 0) {
      SpreadsheetApp.getUi().alert('Error: No data found in row ' + row);
      return;
    }

    // If TEST_IDS are provided in config, use them and skip the column-finding logic
    if (NXTWAVE_CFG.TEST_IDS && NXTWAVE_CFG.TEST_IDS.USER_ID && NXTWAVE_CFG.TEST_IDS.ASSESS_ID) {
      const testUser = String(NXTWAVE_CFG.TEST_IDS.USER_ID).trim();
      const testAssess = String(NXTWAVE_CFG.TEST_IDS.ASSESS_ID).trim();

      if (testUser && testAssess) {
        console.log('TEST_IDS override detected. Using test IDs instead of reading from sheet.');
        console.log('Test User ID:', testUser);
        console.log('Test Assessment ID:', testAssess);

        // Validate basic UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(testUser) || !uuidRegex.test(testAssess)) {
          SpreadsheetApp.getUi().alert('Error: TEST_IDS provided are not valid UUIDs. Please check them in NXTWAVE_CFG.TEST_IDS.');
          return;
        }

        // Fetch API using the test IDs
        const response = fetchNxtwaveStats_(testAssess, testUser);
        if (!response) {
          SpreadsheetApp.getUi().alert('Error: Failed to fetch assessment stats using TEST_IDS. Check logs for details.');
          return;
        }

        // Write response to sheet (same logic for response column)
        const responseJson = JSON.stringify(response);
        const responseColIndex = getColumnIndex_(sheet, NXTWAVE_CFG.RESPONSE_COLUMN, headers);

        if (responseColIndex === -1) {
          // Column doesn't exist, create it
          const lastCol = sheet.getLastColumn();
          sheet.getRange(NXTWAVE_CFG.HEADER_ROW, lastCol + 1).setValue(NXTWAVE_CFG.RESPONSE_COLUMN);
          sheet.getRange(row, lastCol + 1).setValue(responseJson);
        } else {
          // Column exists, update it
          sheet.getRange(row, responseColIndex + 1).setValue(responseJson);
        }

        SpreadsheetApp.getUi().alert('Success: Assessment stats fetched using TEST_IDS and saved to row ' + row);
        console.log('Response saved (TEST_IDS):', responseJson);
        return;
      }
    }

    // Existing column-finding logic follows (unchanged) -------------------------------------------------------
    // Debug: Log all available column names (including empty ones)
    const allColumns = Object.keys(rowData);
    console.log('All column names in rowData:', allColumns);
    console.log('Looking for:', NXTWAVE_CFG.ASSESSMENT_ID_COLUMN, 'and', NXTWAVE_CFG.CANDIDATE_ID_COLUMN);

    // Search through ALL columns to find "Org_assess_id" header (more flexible matching)
    let orgAssessIdColumnIndex = -1;
    let orgAssessIdHeader = null;
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i] || '').trim().toLowerCase();
      // More flexible matching for Org_assess_id
      if (header === 'org_assess_id' ||
          header === 'org assess id' ||
          header === 'orgassessid' ||
          header.includes('org_assess') ||
          header.includes('org assess') ||
          (header.includes('org') && header.includes('assess') && header.includes('id'))) {
        orgAssessIdColumnIndex = i;
        orgAssessIdHeader = headers[i];
        const colLetter = String.fromCharCode(65 + i);
        console.log('Found Org_assess_id at column ' + colLetter + ' (index ' + i + '), header: "' + headers[i] + '"');
        break;
      }
    }

    // If not found, search through more columns (maybe it's beyond column 50)
    if (orgAssessIdColumnIndex === -1) {
      console.log('Org_assess_id not found in first 50 columns, checking more...');
      for (let i = 50; i < 100; i++) {
        try {
          const header = String(sheet.getRange(NXTWAVE_CFG.HEADER_ROW, i + 1).getValue() || '').trim().toLowerCase();
          if (header === 'org_assess_id' ||
              header === 'org assess id' ||
              header.includes('org_assess') ||
              (header.includes('org') && header.includes('assess') && header.includes('id'))) {
            orgAssessIdColumnIndex = i;
            orgAssessIdHeader = sheet.getRange(NXTWAVE_CFG.HEADER_ROW, i + 1).getValue();
            const colLetter = i < 26 ? String.fromCharCode(65 + i) : 'Column ' + (i + 1);
            console.log('Found Org_assess_id at ' + colLetter + ' (index ' + i + '), header: "' + orgAssessIdHeader + '"');
            break;
          }
        } catch (e) {
          // Column doesn't exist, stop searching
          break;
        }
      }
    }

    // Also search for "User ID" header (exact match, not "Nxtwave User ID")
    let userIdColumnIndex = -1;
    let userIdHeader = null;
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i] || '').trim();
      const headerLower = header.toLowerCase();
      // Match "User ID" exactly, but not "Nxtwave User ID"
      if (headerLower === 'user id' || (header === 'User ID' && !header.includes('Nxtwave'))) {
        userIdColumnIndex = i;
        userIdHeader = headers[i];
        const colLetter = i < 26 ? String.fromCharCode(65 + i) : 'Column ' + (i + 1);
        console.log('Found User ID at column ' + colLetter + ' (index ' + i + '), exact header: "' + header + '"');
        break;
      }
    }

    // If not found, search beyond column 50
    if (userIdColumnIndex === -1) {
      console.log('User ID not found in first 100 columns, checking more...');
      for (let i = 100; i < 150; i++) {
        try {
          const header = String(sheet.getRange(NXTWAVE_CFG.HEADER_ROW, i + 1).getValue() || '').trim();
          const headerLower = header.toLowerCase();
          if (headerLower === 'user id' && !header.toLowerCase().includes('nxtwave')) {
            userIdColumnIndex = i;
            userIdHeader = header;
            console.log('Found User ID at column ' + (i + 1) + ' (index ' + i + '), exact header: "' + header + '"');
            break;
          }
        } catch (e) {
          break;
        }
      }
    }

    // Read values directly from found columns
    let columnAValue = null;
    let orgAssessIdValue = null;

    // Try to get User ID from the found "User ID" column
    if (userIdColumnIndex >= 0) {
      columnAValue = sheet.getRange(row, userIdColumnIndex + 1).getValue();
      const colLetter = userIdColumnIndex < 26 ? String.fromCharCode(65 + userIdColumnIndex) : 'Column ' + (userIdColumnIndex + 1);
      console.log('=== Reading User ID ===');
      console.log('User ID from column ' + colLetter + ' (index ' + userIdColumnIndex + '):', columnAValue);
      console.log('User ID header:', userIdHeader);
    } else {
      console.log('WARNING: "User ID" column not found. This is likely column A.');
      // Check column A specifically
      const columnAHeader = headers[0] || '';
      columnAValue = sheet.getRange(row, 1).getValue();
      console.log('Column A header:', columnAHeader);
      console.log('Column A value:', columnAValue);

      // If column A is "Nxtwave User ID", that's wrong - we need the actual "User ID" column
      if (columnAHeader.toLowerCase().includes('nxtwave')) {
        console.log('ERROR: Column A is "Nxtwave User ID", not "User ID". Searching for "User ID" column...');
        SpreadsheetApp.getUi().alert('Error: Cannot find "User ID" column (different from "Nxtwave User ID").\nPlease ensure your sheet has a "User ID" column.');
        return;
      }
    }

    // Get Org_assess_id from found column
    if (orgAssessIdColumnIndex >= 0) {
      orgAssessIdValue = sheet.getRange(row, orgAssessIdColumnIndex + 1).getValue();
      const colLetter = orgAssessIdColumnIndex < 26 ? String.fromCharCode(65 + orgAssessIdColumnIndex) : 'Column ' + (orgAssessIdColumnIndex + 1);
      console.log('=== Reading Org_assess_id ===');
      console.log('Org_assess_id from column ' + colLetter + ' (index ' + orgAssessIdColumnIndex + '):', orgAssessIdValue);
      console.log('Org_assess_id header:', orgAssessIdHeader);
    } else {
      console.log('WARNING: Org_assess_id column not found! Searching all columns for UUID values...');
      const foundUuids = [];
      // Search through all columns for UUID-like values that might be assessment IDs
      for (let i = 0; i < Math.min(headers.length, 100); i++) {
        try {
          const val = sheet.getRange(row, i + 1).getValue();
          const valStr = String(val || '').trim();
          // Check if it looks like a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
          if (valStr.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            const header = headers[i] || '(no header)';
            const colLetter = i < 26 ? String.fromCharCode(65 + i) : 'Column ' + (i + 1);
            console.log('Found UUID at column ' + colLetter + ' (index ' + i + '), header: "' + header + '", value: ' + valStr);
            foundUuids.push({column: colLetter, index: i, header: header, value: valStr});
          }
        } catch (e) {
          // Skip if column doesn't exist
        }
      }
      console.log('All UUIDs found:', foundUuids);

      // If we found multiple UUIDs and one is the User ID, try to use a different one as assessment ID
      if (foundUuids.length > 1 && columnAValue) {
        const userIdStr = String(columnAValue).trim();
        for (const uuidInfo of foundUuids) {
          if (uuidInfo.value !== userIdStr) {
            orgAssessIdValue = uuidInfo.value;
            orgAssessIdColumnIndex = uuidInfo.index;
            console.log('Using different UUID as Org_assess_id:', uuidInfo.value, 'from column', uuidInfo.column);
            break;
          }
        }
      }
    }

    // Show columns around column M (L, M, N, O) to help identify where Org_assess_id is
    console.log('=== Column M Area Debug ===');
    for (let i = 11; i < Math.min(15, headers.length); i++) { // Columns L, M, N, O (indices 11-14)
      const colLetter = String.fromCharCode(65 + i); // A=65, so L=76, M=77, etc.
      const header = headers[i] || '(empty)';
      const value = rowData[header] !== undefined ? rowData[header] : '(not in rowData)';
      console.log('Column ' + colLetter + ' (index ' + i + '): header="' + header + '", value="' + value + '"');
    }

    // Directly check column M (index 12) by position, regardless of header name
    if (headers.length > 12) {
      const columnMHeader = headers[12];
      const columnMValue = sheet.getRange(row, 13).getValue(); // Column M is column 13 (1-indexed)
      console.log('Column M direct check - Header:', columnMHeader, 'Value:', columnMValue);

      // If column M has a value but no header name, use it
      if (columnMValue && String(columnMValue).trim() && (!columnMHeader || columnMHeader === '')) {
        console.log('Column M has value but no header - using value directly');
      }
    }

    // Search for columns that might match Org_assess_id (fuzzy search)
    const possibleAssessmentColumns = findSimilarColumns_(allColumns, ['org', 'assess', 'assessment', 'id']);
    if (possibleAssessmentColumns.length > 0) {
      console.log('Possible assessment ID columns found:', possibleAssessmentColumns);
    }

    // Find columns with flexible matching (case-insensitive, trim whitespace)
    let assessmentId = findColumnValue_(rowData, NXTWAVE_CFG.ASSESSMENT_ID_COLUMN);
    let candidateId = findColumnValue_(rowData, NXTWAVE_CFG.CANDIDATE_ID_COLUMN);

    // Use the directly found values
    if (orgAssessIdValue && String(orgAssessIdValue).trim()) {
      const valStr = String(orgAssessIdValue).trim();
      // Validate it's a UUID, not a date
      if (valStr.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        assessmentId = valStr;
        console.log('Using Org_assess_id from found column:', assessmentId);
      } else {
        console.log('Org_assess_id value is not a valid UUID:', valStr);
      }
    }

    if (columnAValue && String(columnAValue).trim()) {
      const valStr = String(columnAValue).trim();
      // Validate it's a UUID
      if (valStr.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        candidateId = valStr;
        console.log('Using User ID from found column:', candidateId);
      }
    }

    // If still not found by name, try direct column position reads as fallback
    if (!candidateId && columnAValue && String(columnAValue).trim()) {
      const valStr = String(columnAValue).trim();
      if (valStr.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        candidateId = valStr;
        console.log('Using column A (User ID) value directly (by position):', candidateId);
      }
    }

    // If still not found, try fuzzy search
    if (!assessmentId && possibleAssessmentColumns.length > 0) {
      console.log('Trying fuzzy match columns:', possibleAssessmentColumns);
      for (const colName of possibleAssessmentColumns) {
        const val = rowData[colName];
        if (val && String(val).trim()) {
          const valStr = String(val).trim();
          if (valStr.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            assessmentId = valStr;
            console.log('Using fuzzy match column:', colName, 'value:', val);
            break;
          }
        }
      }
    }

    // Debug: Log what we found
    console.log('Found assessmentId:', assessmentId);
    console.log('Found candidateId:', candidateId);

    // Validate required fields
    if (!assessmentId) {
      const availableCols = Object.keys(rowData).join(', ');
      const similarCols = possibleAssessmentColumns.length > 0 ?
        '\n\nSimilar columns found: ' + possibleAssessmentColumns.join(', ') : '';
      SpreadsheetApp.getUi().alert('Error: "' + NXTWAVE_CFG.ASSESSMENT_ID_COLUMN + '" not found in row ' + row +
        '\n\nAvailable columns: ' + availableCols + similarCols +
        '\n\nCheck Execution Log for column M area details.');
      return;
    }

    if (!candidateId) {
      const availableCols = Object.keys(rowData).join(', ');
      SpreadsheetApp.getUi().alert('Error: "' + NXTWAVE_CFG.CANDIDATE_ID_COLUMN + '" not found in row ' + row +
        '\n\nAvailable columns: ' + availableCols);
      return;
    }

    // Convert to string and trim
    const assessmentIdStr = String(assessmentId || '').trim();
    const candidateIdStr = String(candidateId || '').trim();

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!assessmentIdStr || !candidateIdStr) {
      SpreadsheetApp.getUi().alert('Error: Assessment ID or Candidate ID is empty in row ' + row);
      return;
    }

    if (!uuidRegex.test(assessmentIdStr)) {
      SpreadsheetApp.getUi().alert('Error: Assessment ID is not a valid UUID: ' + assessmentIdStr +
        '\n\nPlease check that Org_assess_id column exists and contains a valid UUID.');
      return;
    }

    if (!uuidRegex.test(candidateIdStr)) {
      SpreadsheetApp.getUi().alert('Error: Candidate ID is not a valid UUID: ' + candidateIdStr);
      return;
    }

    // Ensure they are different
    if (assessmentIdStr === candidateIdStr) {
      SpreadsheetApp.getUi().alert('Error: Assessment ID and Candidate ID are the same: ' + assessmentIdStr +
        '\n\nPlease check that Org_assess_id column exists and contains a different UUID than User ID.');
      return;
    }

    console.log('Fetching stats for Assessment ID:', assessmentIdStr, 'Candidate ID:', candidateIdStr);

    // Call API
    const response = fetchNxtwaveStats_(assessmentIdStr, candidateIdStr);

    if (!response) {
      SpreadsheetApp.getUi().alert('Error: Failed to fetch assessment stats. Check logs for details.');
      return;
    }

    // Write response to sheet
    const responseJson = JSON.stringify(response);
    const responseColIndex = getColumnIndex_(sheet, NXTWAVE_CFG.RESPONSE_COLUMN, headers);

    if (responseColIndex === -1) {
      // Column doesn't exist, create it
      const lastCol = sheet.getLastColumn();
      sheet.getRange(NXTWAVE_CFG.HEADER_ROW, lastCol + 1).setValue(NXTWAVE_CFG.RESPONSE_COLUMN);
      sheet.getRange(row, lastCol + 1).setValue(responseJson);
    } else {
      // Column exists, update it
      sheet.getRange(row, responseColIndex + 1).setValue(responseJson);
    }

    SpreadsheetApp.getUi().alert('Success: Assessment stats fetched and saved to row ' + row);
    console.log('Response saved:', responseJson);

  } catch (error) {
    console.error('fetchAssessmentStatsForActiveRow error:', error);
    SpreadsheetApp.getUi().alert('Error: ' + error.toString());
  }
}

/***** NEW: helper to run fetch with the TEST_IDS directly (menu item) *****/
function fetchAssessmentStatsForTestIds() {
  // This function finds the active row and writes the API response into it using TEST_IDS
  try {
    if (!NXTWAVE_CFG.TEST_IDS || !NXTWAVE_CFG.TEST_IDS.USER_ID || !NXTWAVE_CFG.TEST_IDS.ASSESS_ID) {
      SpreadsheetApp.getUi().alert('No TEST_IDS configured in NXTWAVE_CFG. Please configure TEST_IDS to use this function.');
      return;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(NXTWAVE_CFG.SHEET_NAME);
    if (!sheet) {
      SpreadsheetApp.getUi().alert('Error: Sheet "' + NXTWAVE_CFG.SHEET_NAME + '" not found.');
      return;
    }

    const activeRange = sheet.getActiveRange();
    if (!activeRange) {
      SpreadsheetApp.getUi().alert('Error: Please select a row first.');
      return;
    }
    const row = activeRange.getRow();
    if (row === NXTWAVE_CFG.HEADER_ROW) {
      SpreadsheetApp.getUi().alert('Error: Cannot process header row. Please select a data row.');
      return;
    }

    const testUser = String(NXTWAVE_CFG.TEST_IDS.USER_ID).trim();
    const testAssess = String(NXTWAVE_CFG.TEST_IDS.ASSESS_ID).trim();

    const response = fetchNxtwaveStats_(testAssess, testUser);
    if (!response) {
      SpreadsheetApp.getUi().alert('Error: Failed to fetch assessment stats using TEST_IDS. Check logs for details.');
      return;
    }

    // Read headers so we can find/create response column
    const headers = readHeaders_(sheet);
    const responseJson = JSON.stringify(response);
    const responseColIndex = getColumnIndex_(sheet, NXTWAVE_CFG.RESPONSE_COLUMN, headers);

    if (responseColIndex === -1) {
      // Column doesn't exist, create it
      const lastCol = sheet.getLastColumn();
      sheet.getRange(NXTWAVE_CFG.HEADER_ROW, lastCol + 1).setValue(NXTWAVE_CFG.RESPONSE_COLUMN);
      sheet.getRange(row, lastCol + 1).setValue(responseJson);
    } else {
      // Column exists, update it
      sheet.getRange(row, responseColIndex + 1).setValue(responseJson);
    }

    SpreadsheetApp.getUi().alert('Success: Assessment stats fetched using TEST_IDS and saved to row ' + row);
    console.log('Response saved (TEST_IDS):', responseJson);

  } catch (e) {
    console.error('fetchAssessmentStatsForTestIds error:', e);
    SpreadsheetApp.getUi().alert('Error: ' + e.toString());
  }
}

/***** API HELPER *****/

/**
 * Fetches assessment stats from Nxtwave API
 * @param {string} assessmentId - The assessment ID (UUID)
 * @param {string} candidateId - The candidate ID (UUID)
 * @returns {Object|null} Parsed JSON response or null on error
 */
function fetchNxtwaveStats_(assessmentId, candidateId) {
  try {
    const payload = {
      assessment_id: assessmentId,
      candidate_ids: [candidateId]
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      headers: {
        'x-api-key': NXTWAVE_CFG.API_KEY
      },
      muteHttpExceptions: true
    };

    console.log('Making API request to:', NXTWAVE_CFG.API_ENDPOINT);
    console.log('Payload:', JSON.stringify(payload));

    const response = UrlFetchApp.fetch(NXTWAVE_CFG.API_ENDPOINT, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    console.log('Response code:', responseCode);
    console.log('Response text:', responseText);

    if (responseCode < 200 || responseCode >= 300) {
      console.error('API request failed with status:', responseCode);
      console.error('Response:', responseText);
      return null;
    }

    const parsedResponse = safeJson_(responseText);
    if (!parsedResponse) {
      console.error('Failed to parse JSON response');
      return null;
    }

    return parsedResponse;

  } catch (error) {
    console.error('fetchNxtwaveStats_ error:', error);
    return null;
  }
}

/***** SHEET HELPERS *****/

/**
 * Reads headers from the sheet
 * Checks up to MAX_COLUMNS_TO_CHECK columns to find all headers
 * @param {Sheet} sheet - The sheet object
 * @returns {Array<string>} Array of header names
 */
function readHeaders_(sheet) {
  // Always check MAX_COLUMNS_TO_CHECK columns to ensure we get all headers
  // Even if they're beyond the last column with data
  const colsToCheck = NXTWAVE_CFG.MAX_COLUMNS_TO_CHECK;

  if (colsToCheck === 0) return [];

  const vals = sheet.getRange(NXTWAVE_CFG.HEADER_ROW, 1, 1, colsToCheck).getValues()[0];
  const headers = [];

  // Process all columns, including empty ones
  for (let i = 0; i < vals.length; i++) {
    const header = String(vals[i] || '').trim();
    headers.push(header);
  }

  // Debug: Log all headers found
  console.log('Total headers checked:', headers.length);
  console.log('All headers found (including empty):', headers);

  // Also log specific columns we're looking for
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (header && (header.toLowerCase().includes('org') ||
                   header.toLowerCase().includes('assess') ||
                   header.toLowerCase().includes('user id'))) {
      const colLetter = String.fromCharCode(65 + i);
      console.log('Found relevant header at column ' + colLetter + ' (index ' + i + '): "' + header + '"');
    }
  }

  return headers;
}

/**
 * Reads a row and converts it to an object using headers
 * @param {Sheet} sheet - The sheet object
 * @param {number} row - The row number (1-indexed)
 * @param {Array<string>} headers - Array of header names
 * @returns {Object|null} Object with column names as keys, or null if row is empty
 */
function readRowObj_(sheet, row, headers) {
  // Read values for all headers (up to MAX_COLUMNS_TO_CHECK)
  const colsToRead = Math.min(headers.length, NXTWAVE_CFG.MAX_COLUMNS_TO_CHECK);
  if (colsToRead === 0) return null;

  const vals = sheet.getRange(row, 1, 1, colsToRead).getValues()[0];
  const obj = {};

  // Build object mapping header names to values
  headers.forEach((h, i) => {
    if (i >= vals.length) {
      obj[h] = null;
      return;
    }
    const v = vals[i];
    const val = (v instanceof Date) ? v : (v === '' ? null : v);
    // Always include the header in the object, even if value is null/empty
    // This allows us to find columns by name even if they're empty
    obj[h] = val;
  });

  return obj; // Return object with all headers mapped
}

/**
 * Gets the column index for a given column name
 * @param {Sheet} sheet - The sheet object
 * @param {string} columnName - The column name to find
 * @param {Array<string>} headers - Array of header names
 * @returns {number} Column index (0-indexed) or -1 if not found
 */
function getColumnIndex_(sheet, columnName, headers) {
  const index = headers.indexOf(columnName);
  return index;
}

/***** UTILS *****/

/**
 * Finds a column value with flexible matching (case-insensitive, handles whitespace)
 * @param {Object} rowData - The row data object
 * @param {string} columnName - The column name to find
 * @returns {*} The column value or null if not found
 */
function findColumnValue_(rowData, columnName) {
  // First try exact match
  if (columnName in rowData && rowData[columnName] !== null && rowData[columnName] !== '') {
    return rowData[columnName];
  }

  // Try case-insensitive match
  const normalizedSearch = String(columnName).toLowerCase().trim();
  for (const key in rowData) {
    if (String(key).toLowerCase().trim() === normalizedSearch) {
      const value = rowData[key];
      if (value !== null && value !== '') {
        return value;
      }
    }
  }

  return null;
}

/**
 * Finds columns that might match based on keywords (fuzzy search)
 * @param {Array<string>} columnNames - Array of column names
 * @param {Array<string>} keywords - Keywords to search for
 * @returns {Array<string>} Array of matching column names
 */
function findSimilarColumns_(columnNames, keywords) {
  const matches = [];
  const normalizedKeywords = keywords.map(k => String(k).toLowerCase());

  for (const colName of columnNames) {
    if (!colName) continue;
    const normalizedCol = String(colName).toLowerCase();

    // Check if column contains any of the keywords
    for (const keyword of normalizedKeywords) {
      if (normalizedCol.includes(keyword)) {
        matches.push(colName);
        break; // Found a match, no need to check other keywords for this column
      }
    }
  }

  return matches;
}

/**
 * Safely parses JSON string
 * @param {string} s - JSON string to parse
 * @returns {Object|null} Parsed object or null on error
 */
function safeJson_(s) {
  try {
    return JSON.parse(s);
  } catch (e) {
    console.error('JSON parse error:', e);
    return null;
  }
}

/***** MENU SETUP *****/

/**
 * Creates custom menu when spreadsheet opens
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Nxtwave API')
    .addItem('Fetch Assessment Stats (Active Row)', 'fetchAssessmentStatsForActiveRow')
    .addItem('Fetch Test Assessment Stats', 'fetchAssessmentStatsForTestIds')
    .addToUi();
}
