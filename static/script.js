// --- Metro Live Tracker ---
const metroMap = L.map('metro-map').setView([28.6139, 77.2090], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(metroMap);

async function getMetroStatus() {
    const resultsDiv = document.getElementById('metro-results');
    try {
        const response = await fetch('/api/metro-status');
        const data = await response.json();

        if (data.status && data.data.length > 0) {
            let html = '';
            data.data.forEach(line => {
                const statusColor = line.status === 'Normal' ? 'text-green-600' : 'text-yellow-600';
                html += `
                    <div class="metro-card">
                        <div class="font-bold text-lg" style="color:${line.line.toLowerCase()}">${line.line} Line</div>
                        <div class="text-sm ${statusColor}">${line.status}</div>
                        <p class="text-xs text-gray-500">${line.details}</p>
                    </div>
                `;
            });
            resultsDiv.innerHTML = html;
        } else {
            resultsDiv.innerHTML = '<p class="text-red-500">Could not fetch metro data.</p>';
        }
    } catch (error) {
        console.error('Error fetching metro status:', error);
        resultsDiv.innerHTML = '<p class="text-red-500">An error occurred.</p>';
    }
}

// --- Feedback Form ---
document.getElementById('feedback-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const responseDiv = document.getElementById('feedback-response');
    const feedbackData = {
        name: document.getElementById('feedback-name').value,
        issue_type: document.getElementById('feedback-issue-type').value,
        description: document.getElementById('feedback-description').value,
    };

    try {
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedbackData),
        });
        const result = await response.json();
        if (response.ok) {
            responseDiv.innerHTML = `<p class="text-green-500">${result.message}</p>`;
            this.reset();
        } else {
            responseDiv.innerHTML = `<p class="text-red-500">${result.error}</p>`;
        }
    } catch (error) {
        console.error('Feedback submission error:', error);
        responseDiv.innerHTML = '<p class="text-red-500">An error occurred while submitting feedback.</p>';
    }
});


// --- Initializations ---
document.addEventListener('DOMContentLoaded', () => {
    getMetroStatus();
    // other init functions
});