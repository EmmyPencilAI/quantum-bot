async function testAPIConnection() {
    console.log('Testing API connection...');

    const api = new QuantumAPI();

    try {
        // Test health endpoint
        const health = await api.get('/health');
        console.log('Health check:', health);

        if (health && health.status === 'healthy') {
            console.log('✅ API connection successful!');
            document.getElementById('connection-status').innerHTML =
                '<span class="badge bg-success">Connected</span>';
        } else {
            console.warn('⚠️ API responded but with unexpected data');
            document.getElementById('connection-status').innerHTML =
                '<span class="badge bg-warning">Partial Connection</span>';
        }
    } catch (error) {
        console.error('❌ API connection failed:', error);
        document.getElementById('connection-status').innerHTML =
            '<span class="badge bg-danger">Disconnected</span>';

        // Show error message to user
        showConnectionError();
    }
}

function showConnectionError() {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-warning alert-dismissible fade show mt-3';
    errorDiv.innerHTML = `
        <strong>Connection Issue:</strong> Cannot connect to Quantum Bot API.
        <br>
        <small>Please check if the backend server is running.</small>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.querySelector('.container').prepend(errorDiv);
}

// Run test on page load
document.addEventListener('DOMContentLoaded', testAPIConnection);