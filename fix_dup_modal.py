import re

# Read JS file
with open(r'F:\Mobile app mess\mobile_app\mobile.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Count openPricingModal before
count_before = content.count("window.openPricingModal")
print(f"Before: {count_before} openPricingModal functions")

# Remove the FIRST duplicate (simpler one at ~line 256) 
# Keep the second one which has more complete logic
old_simple = '''window.openPricingModal = function () {
    // Reset pricing form
    document.getElementById('price-start').value = new Date().toISOString().split('T')[0];
    document.getElementById('price-end').value = '';
    document.getElementById('price-morning').value = '46';
    document.getElementById('price-evening').value = '46';

    document.getElementById('pricing-modal').classList.add('open');
};'''

content = content.replace(old_simple, '// openPricingModal defined later with more complete logic')

# Count after
count_after = content.count("window.openPricingModal")
print(f"After: {count_after} openPricingModal functions")

# Write back
with open(r'F:\Mobile app mess\mobile_app\mobile.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Removed duplicate openPricingModal!')
