import re

# Read file
with open(r'F:\Mobile app mess\mobile_app\mobile.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the fetchEntries function and add sorting
old_code = "state.entries = Array.isArray(data) ? data : [];"
new_code = """state.entries = Array.isArray(data) ? data : [];
        
        // Sort entries by date (newest first)
        state.entries.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA; // Descending order (newest first)
        });"""

content = content.replace(old_code, new_code)

# Write back
with open(r'F:\Mobile app mess\mobile_app\mobile.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Added date-wise sorting to entries!')
