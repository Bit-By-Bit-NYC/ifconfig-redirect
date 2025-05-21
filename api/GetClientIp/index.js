function sanitizeIp(ipString) {
    if (!ipString) return null;

    let address = ipString;

    // 1. Handle IPv6-mapped IPv4 addresses (e.g., ::ffff:127.0.0.1 -> 127.0.0.1)
    if (address.startsWith('::ffff:')) {
        address = address.substring(7);
    }

    // 2. Remove port
    // Check for IPv6 with brackets and port: [address]:port
    // e.g., "[::1]:8080" -> "[::1]"
    const ipv6WithPortMatch = address.match(/^(\[.*\]):(\d+)$/);
    if (ipv6WithPortMatch) {
        address = ipv6WithPortMatch[1]; // The part in brackets, e.g., "[::1]"
    } else {
        // Check for IPv4 or hostname with port: address:port
        // e.g., "127.0.0.1:8080" -> "127.0.0.1"
        // This should not affect IPv6 addresses without brackets and without port, e.g., "2001:db8::1"
        const lastColonIndex = address.lastIndexOf(':');
        if (lastColonIndex > -1) {
            const potentialHost = address.substring(0, lastColonIndex);
            const potentialPort = address.substring(lastColonIndex + 1);

            // Only strip if potentialPort is numeric and it's not a segment of an IPv6 address.
            if (/^\d+$/.test(potentialPort)) {
                // If potentialHost contains '.' (is IPv4 or fqdn.with.port)
                // OR if potentialHost does not contain ':' (is a simple hostname like 'localhost')
                // then it's safe to assume 'potentialPort' is a port.
                if (potentialHost.includes('.') || !potentialHost.includes(':')) {
                    address = potentialHost;
                }
                // Otherwise, it's likely an unbracketed IPv6 address (e.g., "2001:db8::1"),
                // and the part after the last colon is a segment of the address, not a port.
            }
        }
    }
    return address;
}

module.exports = async function (context, req) {
    context.log('HTTP trigger function processed a request for GetClientIp.');

    let rawClientIp = null;
    const headers = req.headers || {};

    // Standard header for identifying the originating IP address of a client connecting to a web server through an HTTP proxy or a load balancer.
    if (headers['x-forwarded-for']) {
        // X-Forwarded-For can be a comma-separated list of IPs. The client's IP is typically the first one.
        const forwardedFor = headers['x-forwarded-for'];
        rawClientIp = forwardedFor.split(',')[0].trim();
    } else if (headers['x-ms-client-ip']) {
        // Fallback for some Azure services, though X-Forwarded-For is more common
        rawClientIp = headers['x-ms-client-ip'];
    } else if (req.connection && req.connection.remoteAddress) {
        // Fallback for direct connections (less common in cloud environments like Azure SWA)
        rawClientIp = req.connection.remoteAddress;
    } else if (req.socket && req.socket.remoteAddress) { // Alternative for req.connection
        rawClientIp = req.socket.remoteAddress;
    }

    const clientIp = sanitizeIp(rawClientIp);

    context.res = {
        status: clientIp ? 200 : 500,
        body: clientIp ? clientIp : "Could not determine client IP address.",
        headers: { 'Content-Type': 'text/plain' }
    };
};