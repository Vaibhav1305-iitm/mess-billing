import re

# Read file
with open(r'F:\Mobile app mess\mobile_app\mobile.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Duplicate 'action' variable in savePricingRule
# Change second 'const action' to 'const actionText'
content = content.replace(
    "// Show success message\n        const action = isEdit ? 'updated' : 'added';\n        showToast(`💰 Pricing rule ${action} successfully!`, 'success');",
    "// Show success message\n        showToast(`💰 Pricing rule ${isEdit ? 'updated' : 'added'} successfully!`, 'success');"
)

# Alternative fix if above didn't match (try with \r\n)
content = content.replace(
    "// Show success message\r\n        const action = isEdit ? 'updated' : 'added';\r\n        showToast(`💰 Pricing rule ${action} successfully!`, 'success');",
    "// Show success message\r\n        showToast(`💰 Pricing rule ${isEdit ? 'updated' : 'added'} successfully!`, 'success');"
)

# Write back
with open(r'F:\Mobile app mess\mobile_app\mobile.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Fixed duplicate action variable!')
