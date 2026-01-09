import re

# Read file
with open(r'F:\Mobile app mess\mobile_app\mobile.js', 'r', encoding='utf-8') as f:
    content = f.read()

# New DOMContentLoaded with cache-first loading
new_code = '''window.addEventListener('DOMContentLoaded', () => {
    // ⚡ INSTANT CACHE LOADING - Load from localStorage first (< 1ms)
    const CACHE_ENTRIES = 'mess_entries_v2';
    const CACHE_PRICING = 'mess_pricing_v2';
    
    try {
        const cachedE = localStorage.getItem(CACHE_ENTRIES);
        const cachedP = localStorage.getItem(CACHE_PRICING);
        if (cachedE) {
            state.entries = JSON.parse(cachedE);
            renderEntries(state.entries);
            populateReportMonths();
            populateBillMonths();
            console.log('⚡ INSTANT:', state.entries.length, 'entries from cache!');
        }
        if (cachedP) {
            state.pricingRules = JSON.parse(cachedP);
        }
    } catch(e) { console.warn('Cache error:', e); }
    
    // Background sync with Google Sheets (non-blocking)
    setTimeout(() => {
        fetchEntries().then(() => {
            localStorage.setItem(CACHE_ENTRIES, JSON.stringify(state.entries));
            console.log('✅ Synced with Google Sheets');
        }).catch(() => {});
        fetchPricingRules(true).then(() => {
            localStorage.setItem(CACHE_PRICING, JSON.stringify(state.pricingRules));
        }).catch(() => {});
    }, 50);
});'''

# Pattern to find DOMContentLoaded
pattern = r"window\.addEventListener\('DOMContentLoaded'.*?\}\);"

# Replace
content = re.sub(pattern, new_code.strip(), content, flags=re.DOTALL)

# Write back
with open(r'F:\Mobile app mess\mobile_app\mobile.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Cache-first loading added successfully!')
