import re

# Read HTML file
with open(r'F:\Mobile app mess\mobile_app\mobile.html', 'r', encoding='utf-8') as f:
    html = f.read()

# New Bill Generation section with custom date range
new_bill_section = '''<!-- View: Bill Generation -->
            <div id="view-bill" class="view-section">
                <div class="section-title">BILL GENERATION</div>

                <div style="padding: 16px 0;">
                    <!-- Filter Type Selection -->
                    <div class="input-group" style="background: var(--md-sys-color-surface-container); border-radius: 8px; margin-bottom: 12px;">
                        <label style="font-size: 12px; font-weight: 500; color: var(--md-sys-color-primary); padding: 8px 12px 0;">Select Period</label>
                        <select class="m3-input" id="bill-filter-type" style="padding-top: 8px;" onchange="toggleBillDateInputs()">
                            <option value="month">By Month</option>
                            <option value="custom">Custom Date Range</option>
                        </select>
                    </div>
                    
                    <!-- Month Dropdown (default) -->
                    <div id="bill-month-container" class="input-group" style="background: var(--md-sys-color-surface-container); border-radius: 8px;">
                        <select class="m3-input" id="bill-month-select" style="padding-top: 16px;">
                            <!-- Options populated by JS -->
                        </select>
                    </div>
                    
                    <!-- Custom Date Range (hidden by default) -->
                    <div id="bill-custom-container" style="display: none;">
                        <div class="input-group" style="background: var(--md-sys-color-surface-container); border-radius: 8px; margin-bottom: 12px;">
                            <label class="floating-label" style="transform: translateY(-12px) scale(0.75); color: var(--md-sys-color-primary);">Start Date</label>
                            <input type="date" class="m3-input" id="bill-start-date" style="padding-top: 16px;">
                        </div>
                        <div class="input-group" style="background: var(--md-sys-color-surface-container); border-radius: 8px;">
                            <label class="floating-label" style="transform: translateY(-12px) scale(0.75); color: var(--md-sys-color-primary);">End Date</label>
                            <input type="date" class="m3-input" id="bill-end-date" style="padding-top: 16px;">
                        </div>
                    </div>

                    <button class="btn-filled" style="margin-top: 16px;" onclick="generateBillPreview()">
                        <span class="material-symbols-outlined">receipt</span>
                        Generate Bill
                    </button>
                </div>'''

# Old Bill section pattern
old_bill_section = '''<!-- View: Bill Generation -->
            <div id="view-bill" class="view-section">
                <div class="section-title">BILL GENERATION</div>

                <div style="padding: 16px 0;">
                    <div class="input-group"
                        style="background: var(--md-sys-color-surface-container); border-radius: 8px;">
                        <select class="m3-input" id="bill-month-select" style="padding-top: 16px;">
                            <!-- Options populated by JS -->
                        </select>
                    </div>

                    <button class="btn-filled" style="margin-top: 16px;" onclick="generateBillPreview()">
                        <span class="material-symbols-outlined">receipt</span>
                        Generate Bill
                    </button>
                </div>'''

html = html.replace(old_bill_section, new_bill_section)

# Write back
with open(r'F:\Mobile app mess\mobile_app\mobile.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('✅ Added custom date range picker to Bill section!')
