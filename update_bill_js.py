import re

# Read JS file
with open(r'F:\Mobile app mess\mobile_app\mobile.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add toggle function for bill date inputs
toggle_function = '''
// --- Toggle Bill Date Inputs (Month vs Custom Range) ---
window.toggleBillDateInputs = function() {
    const filterType = document.getElementById('bill-filter-type').value;
    const monthContainer = document.getElementById('bill-month-container');
    const customContainer = document.getElementById('bill-custom-container');
    
    if (filterType === 'month') {
        monthContainer.style.display = 'block';
        customContainer.style.display = 'none';
    } else {
        monthContainer.style.display = 'none';
        customContainer.style.display = 'block';
        // Set default dates (current month)
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        document.getElementById('bill-start-date').valueAsDate = startOfMonth;
        document.getElementById('bill-end-date').valueAsDate = today;
    }
};

'''

# Find a good place to insert - after generateBillPreview
insert_marker = "window.generateBillPreview = async function () {"

# Insert toggle function before generateBillPreview
content = content.replace(insert_marker, toggle_function + insert_marker)

# Now update generateBillPreview to handle custom date range
old_generate = '''window.generateBillPreview = async function () {
    const month = document.getElementById('bill-month-select').value;
    if (!month || month.includes('No Data')) return alert('Select a month with data');

    showLoader('Calculating Bill...');

    try {
        // Filter local entries logic
        // Use map to create a shallow copy so we don't mutate state.entries amounts permanently
        // This ensures if we change Pricing Rules, we can click "Generate" again to see updated values.
        const monthEntries = state.entries
            .filter(e => e.date.startsWith(month))
            .map(e => ({ ...e }));'''

new_generate = '''window.generateBillPreview = async function () {
    const filterType = document.getElementById('bill-filter-type')?.value || 'month';
    let filteredEntries = [];
    let periodLabel = '';
    
    if (filterType === 'month') {
        const month = document.getElementById('bill-month-select').value;
        if (!month || month.includes('No Data')) return alert('Select a month with data');
        
        filteredEntries = state.entries
            .filter(e => e.date && e.date.startsWith(month))
            .map(e => ({ ...e }));
        
        const [y, mo] = month.split('-');
        periodLabel = new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
        // Custom date range
        const startDate = document.getElementById('bill-start-date').value;
        const endDate = document.getElementById('bill-end-date').value;
        
        if (!startDate || !endDate) return alert('Please select both start and end dates');
        if (startDate > endDate) return alert('Start date must be before end date');
        
        filteredEntries = state.entries
            .filter(e => e.date && e.date >= startDate && e.date <= endDate)
            .map(e => ({ ...e }));
        
        const startD = new Date(startDate);
        const endD = new Date(endDate);
        periodLabel = startD.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + 
                      ' to ' + endD.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    
    if (filteredEntries.length === 0) {
        return alert('No entries found for selected period');
    }

    showLoader('Calculating Bill...');

    try {
        // Use map to create a shallow copy so we don't mutate state.entries amounts permanently
        const monthEntries = filteredEntries;'''

content = content.replace(old_generate, new_generate)

# Update period display section
old_period_display = '''const [y, mo] = month.split('-');
        const name = new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        document.getElementById('bill-period-display').textContent = name;'''

new_period_display = '''document.getElementById('bill-period-display').textContent = periodLabel;'''

content = content.replace(old_period_display, new_period_display)

# Write back
with open(r'F:\Mobile app mess\mobile_app\mobile.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Added custom date range bill generation!')
