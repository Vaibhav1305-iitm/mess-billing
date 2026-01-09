import re

# Read JS file
with open(r'F:\Mobile app mess\mobile_app\mobile.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find fetchEntries and add property normalization
old_fetch = "state.entries = Array.isArray(data) ? data : [];"

new_fetch = '''state.entries = Array.isArray(data) ? data.map(e => {
            // Normalize property names to lowercase (Google Sheets returns with Capital letters)
            const normalized = {};
            for (const key in e) {
                normalized[key.toLowerCase()] = e[key];
            }
            return normalized;
        }) : [];'''

content = content.replace(old_fetch, new_fetch)

# Write back
with open(r'F:\Mobile app mess\mobile_app\mobile.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Fixed case mismatch - entry properties now normalized to lowercase!')
