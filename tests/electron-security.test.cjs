const test = require('node:test');
const assert = require('node:assert/strict');
const { isApprovedExternalUrl } = require('../electron-security.cjs');

test('permite abrir el enlace publicado de Google Maps', () => {
    assert.equal(isApprovedExternalUrl('https://maps.app.goo.gl/2XmTqzVXpgpDR26Y8?'), true);
    assert.equal(isApprovedExternalUrl('https://www.google.com/maps/place/Ibague'), true);
});

test('permite confirmaciones de WhatsApp con un número válido', () => {
    assert.equal(isApprovedExternalUrl('https://api.whatsapp.com/send?phone=573180685024&text=hola'), true);
    assert.equal(isApprovedExternalUrl('https://wa.me/573180685024'), true);
});

test('bloquea sitios, esquemas y destinos de WhatsApp no permitidos', () => {
    for (const value of [
        'http://maps.app.goo.gl/example',
        'https://example.com/',
        'https://google.com/search?q=maps',
        'https://api.whatsapp.com/send?phone=abc',
        'https://api.whatsapp.com/profile',
        'javascript:alert(1)',
        'file:///etc/passwd'
    ]) {
        assert.equal(isApprovedExternalUrl(value), false, value);
    }
});
