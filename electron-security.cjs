function isApprovedExternalUrl(value) {
    let url;
    try {
        url = new URL(value);
    } catch {
        return false;
    }

    if (url.protocol !== 'https:') return false;

    const host = url.hostname.toLowerCase();
    if (host === 'maps.app.goo.gl') return true;
    if (host === 'maps.google.com') return url.pathname === '/maps' || url.pathname.startsWith('/maps/');
    if (host === 'www.google.com' || host === 'google.com') {
        return url.pathname === '/maps' || url.pathname.startsWith('/maps/');
    }

    if (host === 'api.whatsapp.com' && url.pathname === '/send') {
        return /^\d{7,15}$/.test(url.searchParams.get('phone') || '');
    }
    if (host === 'wa.me') return /^\/\d{7,15}$/.test(url.pathname);
    return false;
}

module.exports = { isApprovedExternalUrl };
