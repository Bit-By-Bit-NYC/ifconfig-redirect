document.addEventListener('DOMContentLoaded', () => {
    const ipAddressElement = document.getElementById('ip-address');

    fetch('/api/GetClientIp') // This path is automatically routed to your Azure Function
        .then(response => {
            if (!response.ok) {
                // Try to get the error message from the server if available
                return response.text().then(text => { throw new Error(`HTTP error! status: ${response.status}, message: ${text}`); });
            }
            return response.text(); // Get response as plain text (the IP address)
        })
        .then(ip => {
            ipAddressElement.textContent = ip;
        })
        .catch(error => {
            console.error('Error fetching IP address:', error);
            ipAddressElement.textContent = `Error: Could not retrieve IP. ${error.message || ''}`;
        });
});