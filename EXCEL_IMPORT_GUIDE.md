# CSV Import & Update Guide

## Features

### 1. Import New Alumni (Bulk Creation)
- Create multiple alumni accounts from a CSV file
- **URL:** `http://localhost:5173/admin/import-alumni`

### 2. Update Existing Alumni (Profile Updates)
- Update company, domain, expertise when alumni switch jobs
- Match by email automatically
- **URL:** `http://localhost:5173/admin/update-alumni`

---

## Admin Login

The admin panel is **password protected**. Only users with valid credentials can access import/update features.

### Access Admin Panel

1. **Click ⚙️ Admin** in the navbar, OR
2. **Go to:** `http://localhost:5173/admin/login`

### Default Admin Credentials

```
Username: admin
Password: Admin@123
```

⚠️ **CHANGE THESE IMMEDIATELY** in `frontend/src/pages/AdminLogin.jsx` for production!

### How to Change Admin Credentials

Edit [AdminLogin.jsx](frontend/src/pages/AdminLogin.jsx), lines 11-12:

```javascript
const ADMIN_USERNAME = "admin";        // Change this
const ADMIN_PASSWORD = "Admin@123";    // And this
```

### Session Management

- Admin token stored in localStorage
- Valid until browser session ends
- Click **Logout** on admin panel to end session
- Session automatically cleared when browser is closed

---

## Feature 1: Import New Alumni

### CSV File Format

Create a CSV file with the following columns:

| Name | Email | Domain | Company | Expertise |
|------|-------|--------|---------|-----------|
| John Doe | john@example.com | Software Engineering | Google | Full Stack Development |
| Jane Smith | jane@example.com | Product Management | Meta | AI/ML Strategy |

### Column Details:

- **Name**: Alumni's full name (required)
- **Email**: Alumni's email address (required, must be unique)
- **Domain**: Area of expertise (e.g., "Software Engineering", "Data Science")
- **Company**: Current/previous company
- **Expertise**: Specific skills/expertise

### After Import

1. Upload the CSV file
2. System validates and creates accounts
3. **Credentials are displayed** with emails and default password
4. Download as CSV or copy to clipboard
5. Share credentials with alumni

---

## Feature 2: Update Existing Alumni

### When to Use

- Alumni switched companies
- Alumni wants to update their domain/expertise
- Bulk update multiple alumni at once
- **No manual form filling needed!**

### CSV File Format

Create a `.csv` file with columns: `Email`, `Domain`, `Company`, `Expertise`

```csv
Email,Domain,Company,Expertise
john@example.com,Product Management,Meta,Strategy & Leadership
jane@example.com,,Netflix,Senior Leadership
```

### Column Details:

- **Email** (required): Must match existing alumni email
- **Domain** (optional): Leave blank to keep current value
- **Company** (optional): Leave blank to keep current value
- **Expertise** (optional): Leave blank to keep current value

### Example: Only Update Company

```
Email,Domain,Company,Expertise
john@example.com,,Google,
jane@example.com,,Microsoft,
```

Only the **Company** field will be updated; other fields remain unchanged.

### After Update

1. Upload the Excel file
2. System matches by email
3. **Update summary displayed** showing what was changed
4. Only non-empty fields are updated
5. Existing values preserved if not specified

---

## Default Credentials

All imported alumni get:
- **Email**: From the Excel file
- **Password**: `Welcome@123` (Same for all)
- **Role**: Alumni

They should change this password after first login.

---

## Example Scenarios

### Scenario 1: Company Switch
**Before:** John works at Google
**Excel:** `john@example.com,,Meta,` (only company field)
**After:** John's company updated to Meta, other fields unchanged

### Scenario 2: New Job & Skills
**Before:** Jane at Microsoft with "Backend Dev" expertise
**Excel:** `jane@example.com,Data Science,Amazon,ML Engineering`
**After:** All three fields updated

### Scenario 3: Multiple Updates
Upload a file with 50 alumni who changed companies:
```
Email,Company
john@ex.com,Google
jane@ex.com,Meta
...
```
All 50 get updated in one upload!

---

## Error Handling

### During Import:
- ❌ Duplicate emails → Skipped
- ❌ Missing Name/Email → Skipped
- ✅ Invalid data → Logged with row number

### During Update:
- ❌ Email not found → Logged with row number
- ❌ No fields to update → Logged
- ✅ Partial update → Only filled fields updated

---

## Notes

- Emails are **case-insensitive** for matching
- Leave cells **blank (not NULL)** to skip updating that field
- Supports `.csv` format only
- Maximum file size: 5MB (configurable)

