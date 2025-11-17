# Google Apps Script Sync Setup Guide

This script syncs data from Google Sheets directly to Supabase using the normalized database schema.

## 📋 Prerequisites

1. Google Sheet with your candidate data
2. Supabase project with the normalized schema set up
3. Supabase Service Role Key

## 🚀 Setup Instructions

### Step 1: Open Google Apps Script

1. Open your Google Sheet
2. Go to **Extensions → Apps Script**
3. Delete any existing code
4. Copy and paste the code from `google-apps-script-sync.js`

### Step 2: Configure Script Properties

1. In Apps Script editor, go to **Project Settings** (gear icon ⚙️)
2. Scroll down to **Script Properties**
3. Click **Add script property** and add:

   **Property 1:**
   - Name: `SUPABASE_URL`
   - Value: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)

   **Property 2:**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Your Supabase Service Role Key (from Supabase Dashboard → Settings → API)

4. Click **Save script properties**

### Step 3: Configure Sheet Name

In the script, update the `SHEET_NAME` if your sheet tab has a different name:

```javascript
const CFG = {
  SHEET_NAME: 'Shortlisted Candidates',   // <-- Change this if needed
  HEADER_ROW: 1,
  // ...
};
```

### Step 4: Set Up Column Headers

Make sure your Google Sheet has these column headers (exact names):

#### Required Columns:
- `full_name` - Student's full name
- `college_name` - College name
- `college_degree` - Degree (e.g., "B.Tech")
- `branch` - Branch name

#### Student Columns:
- `email` - Email address (required for upsert)
- `phone` - Phone number
- `gender` - Gender
- `resume_url` - Resume URL
- `graduation_year` - Graduation year
- `cgpa` - CGPA (0-10 scale)
- `Nxtwave User ID` or `nxtwave_user_id` - UUID (optional, auto-generated if not provided)

#### College Columns:
- `college_city` or `city` - City
- `college_state` or `state` - State
- `college_country` or `country` - Country (defaults to "India")
- `nirf_ranking` - NIRF ranking

#### Assessment Columns:
- `taken_at` or `assessment_date` - Assessment date
- `report_url` - Report URL
- `total_student_score` - Total student score
- `total_assessment_score` - Total assessment score
- `percent` - Percentage
- `coding_score`, `coding_max` - Coding scores
- `dsa_score`, `dsa_max` - DSA scores
- `cs_fund_score`, `cs_fund_max` - CS Fundamentals scores
- `quant_score`, `quant_max` - Quantitative scores
- `verbal_score`, `verbal_max` - Verbal scores
- `logical_score`, `logical_max` - Logical reasoning scores

#### Interview Columns:
- `interview_date` - Interview date
- `recording_url` or `recoding_url` - Recording URL (handles typo)
- `self_intro_rating` - Self introduction rating (0-10)
- `problem_solving_rating` - Problem solving rating (0-10)
- `communication_rating` - Communication rating (0-10)
- `conceptual_rating` - Conceptual rating (0-10)
- `overall_interview_rating` - Overall rating (0-10)
- `overall_label` - Verdict: "Strong Hire", "Medium Fit", or "Consider"
- `interview_notes` or `notes` - Interview notes

### Step 5: Set Up Trigger (Optional)

To automatically sync when you edit a row:

1. In Apps Script editor, click **Triggers** (clock icon ⏰)
2. Click **+ Add Trigger**
3. Configure:
   - **Function to run**: `onEditSync`
   - **Event source**: **From spreadsheet**
   - **Event type**: **On edit**
4. Click **Save**

### Step 6: Test the Script

1. **Save the script** (Ctrl+S or Cmd+S)
2. **Authorize the script**:
   - Click **Run** → Select `SyncActiveRowOnce`
   - Click **Run** again
   - Authorize permissions when prompted
3. **Test with one row**:
   - Select a row with data
   - Run `SyncActiveRowOnce` function
   - Check Supabase to verify data was synced

### Step 7: Sync All Data

1. In your Google Sheet, go to **Supabase Sync** menu (should appear automatically)
2. Click **Sync All Rows**
3. Or run `SyncAll()` function from Apps Script editor

## 🔄 How It Works

The script follows this flow:

1. **College** → Upserts college (creates if doesn't exist) → Gets `college_id`
2. **Student** → Upserts student (creates if doesn't exist) → Gets `nxtwave_user_id`
   - Uses email or nxtwave_user_id to check for existing student
   - Auto-generates UUID if not provided
3. **Assessment** → Upserts assessment → Gets `assessment_id`
4. **Assessment Scores** → Upserts individual scores (coding, DSA, etc.)
   - Links to `score_types` table automatically
5. **Interview** → Upserts interview with ratings

## 📝 Features

- ✅ **Auto-sync on edit**: Automatically syncs when you edit a row (if trigger is set up)
- ✅ **Manual sync**: Use menu or functions to sync specific rows or all rows
- ✅ **Duplicate handling**: Checks for existing records before inserting
- ✅ **Auto UUID generation**: Generates `nxtwave_user_id` if not provided
- ✅ **Normalized schema**: Properly handles colleges, students, assessments, scores, and interviews
- ✅ **Error handling**: Logs errors to console for debugging

## 🐛 Troubleshooting

### Script doesn't run
- Check that Script Properties are set correctly
- Verify Supabase URL and Service Role Key are correct
- Check Apps Script execution logs (View → Execution log)

### Data not syncing
- Verify column headers match exactly (case-sensitive)
- Check that required fields are filled (email for students)
- Look at execution logs for specific errors

### "Permission denied" errors
- Make sure Service Role Key has write permissions
- Verify RLS policies allow inserts/updates

### Rate limiting
- The script includes small delays for bulk operations
- If you hit rate limits, reduce batch size or add more delays

## 🔒 Security Notes

- ⚠️ **Never share** your Service Role Key publicly
- ✅ Script Properties are encrypted and only accessible to you
- ✅ Service Role Key has full database access - keep it secure

## 📚 Functions Reference

- `onEditSync(e)` - Automatically called when a cell is edited
- `SyncActiveRowOnce()` - Syncs the currently selected row
- `SyncAll()` - Syncs all rows in the sheet
- `onOpen()` - Creates the custom menu (runs automatically)

## 💡 Tips

1. **Test with one row first** before syncing all data
2. **Check execution logs** if something goes wrong
3. **Use manual sync** for initial data load, then enable auto-sync
4. **Backup your data** before running bulk syncs
5. **Monitor Supabase** to verify data is being synced correctly

