module.exports = async function (context, req) {
    context.log('HTTP trigger function processed a request for GetClientIp.');

    let clientIp = null;

    // Standard header for identifying the originating IP address of a client connecting to a web server through an HTTP proxy or a load balancer.
    if (req.headers && req.headers['x-forwarded-for']) {
        // X-Forwarded-For can be a comma-separated list of IPs. The client's IP is typically the first one.
        const forwardedFor = req.headers['x-forwarded-for'];
        clientIp = forwardedFor.split(',')[0].trim();
    } else if (req.headers && req.headers['x-ms-client-ip']) {
        // Fallback for some Azure services, though X-Forwarded-For is more common
        clientIp = req.headers['x-ms-client-ip'];
    } else if (req.connection && req.connection.remoteAddress) {
        // Fallback for direct connections (less common in cloud environments like Azure SWA)
        clientIp = req.connection.remoteAddress;
         // Handle IPv6-mapped IPv4 addresses like ::ffff:127.0.0.1
        if (clientIp && clientIp.startsWith('::ffff:')) {
            clientIp = clientIp.substring(7);
        }
    } else if (req.socket && req.socket.remoteAddress) { // Alternative for req.connection
        clientIp = req.socket.remoteAddress;
        if (clientIp && clientIp.startsWith('::ffff:')) {
            clientIp = clientIp.substring(7);
        }
    }

    context.res = {
        status: clientIp ? 200 : 500,
        body: clientIp ? clientIp : "Could not determine client IP address.",
        headers: { 'Content-Type': 'text/plain' }
    };
};