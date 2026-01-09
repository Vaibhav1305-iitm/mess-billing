import re

# Read file
with open(r'F:\Mobile app mess\mobile_app\mobile.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and remove the duplicate generateBillPreview function that starts around line 1516
# Pattern to match the function from the second occurrence
pattern = r'''window\.generateBillPreview = async function \(\) \{
    const month = document\.getElementById\('bill-month-select'\)\.value;
    if \(!month \|\| month\.includes\('No Data'\)\) return alert\('Select a month with data'\);

    showLoader\('Calculating Bill\.\.\.'\);

    try \{
        // \.\.\. \(Existing logic but wrapped\) \.\.\..*?hideLoader\(\);
    \}
\};'''

# Find all occurrences of generateBillPreview
count_before = content.count("window.generateBillPreview")
print(f"Before: {count_before} generateBillPreview functions")

# Remove the duplicate (the one that starts with just "const month")
old_pattern = '''window.generateBillPreview = async function () {
    const month = document.getElementById('bill-month-select').value;
    if (!month || month.includes('No Data')) return alert('Select a month with data');

    showLoader('Calculating Bill...');

    try {
        // ... (Existing logic but wrapped) ...
        // Actually the existing function was doing calculations client side which is fast.
        // But if we wait for pricing rates, it might take a bit.

        // Filter local entries logic
        const monthEntries = state.entries.filter(e => e.date.startsWith(month));
        let mTotal = 0, eTotal = 0, gTotal = 0;
        monthEntries.sort((a, b) => a.date.localeCompare(b.date));

        for (const e of monthEntries) {
            mTotal += (e.morning || 0);
            eTotal += (e.evening || 0);

            if (!e.amount || e.amount === 0) {
                const rates = await getPricingRate(e.date);
                e.amount = (e.morning * rates.morning) + (e.evening * rates.evening);
            }
            gTotal += (e.amount || 0);
        }

        // Update UI
        document.getElementById('bill-morning-count').textContent = mTotal;
        document.getElementById('bill-evening-count').textContent = eTotal;
        document.getElementById('bill-total-amount').textContent = `₹${gTotal}`;

        document.getElementById('bill-period-display').textContent = periodLabel;

        document.getElementById('bill-card').style.display = 'block';

        const billHTML = getBillHTML(periodLabel, monthEntries, mTotal, eTotal, gTotal);
        document.getElementById('printable-bill-container').innerHTML = billHTML;

    } catch (e) {
        console.error(e);
        alert('Error generating bill');
    } finally {
        hideLoader();
    }
};'''

content = content.replace(old_pattern, '// REMOVED DUPLICATE generateBillPreview - using the correct version above')

count_after = content.count("window.generateBillPreview")
print(f"After: {count_after} generateBillPreview functions")

# Write back
with open(r'F:\Mobile app mess\mobile_app\mobile.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Removed duplicate generateBillPreview function!')
