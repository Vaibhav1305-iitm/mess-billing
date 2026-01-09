// --- Delete Entry Function (ADD THIS TO mobile.js after saveEntry function) ---

window.deleteEntry = async function () {
    // Get entry date from detail modal or entry modal
    let date = document.getElementById('detail-id')?.value;
    if (!date) {
        date = document.getElementById('new-date')?.value;
    }

    if (!date) {
        return alert('No entry selected');
    }

    const entry = state.entries.find(e => e.date === date);
    if (!entry) {
        return alert('Entry not found');
    }

    if (!confirm('Delete this entry permanently?  ')) {
        return;
    }

    showLoader('Deleting Entry...');
    try {
        const payload = {
            date: entry.date
        };
        if (entry.id) {
            payload.id = entry.id;
        }

        const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?path=entries&action=delete`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Delete failed');
        }

        closeModal();
        await fetchEntries(); // Refresh the entries list
    } catch (e) {
        console.error('Delete entry error:', e);
        alert('Error: ' + e.message);
    } finally {
        hideLoader();
    }
};
