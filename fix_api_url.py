import re

# Read file
with open(r'F:\Mobile app mess\mobile_app\mobile.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Count API_BASE_URL occurrences
count = content.count('API_BASE_URL')
print(f'Found {count} occurrences of API_BASE_URL')

# Replace API_BASE_URL with GOOGLE_APPS_SCRIPT_URL in fetch calls
# The fetch pattern is different for Google Apps Script (uses query params, not path)

# Fix all API_BASE_URL references
content = content.replace('${API_BASE_URL}', '${GOOGLE_APPS_SCRIPT_URL}')
content = content.replace('API_BASE_URL', 'GOOGLE_APPS_SCRIPT_URL')

# Write back
with open(r'F:\Mobile app mess\mobile_app\mobile.js', 'w', encoding='utf-8') as f:
    f.write(content)

# Count again
count_after = content.count('API_BASE_URL')
print(f'After fix: {count_after} occurrences remaining')
print('✅ Fixed API_BASE_URL references!')
