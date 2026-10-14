const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const GUESTS_DIR = path.join(ROOT, 'invitaciones_autonomas');
const DEFAULT_GUEST = '01_sr_jorge_quina_sra_eneida_sandoval.html';
const OUTPUT_DIR = path.join(ROOT, 'dist', 'entrega_local');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'Invitacion.html');
const README_FILE = path.join(OUTPUT_DIR, 'README.txt');
const ZIP_FILE = path.join(OUTPUT_DIR, 'Invitacion_Completa.zip');

function dataUri(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    const mediaTypes = {
        '.css': 'text/css',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.mp3': 'audio/mpeg',
        '.png': 'image/png',
        '.woff2': 'font/woff2'
    };
    const mediaType = mediaTypes[extension];
    if (!mediaType) throw new Error(`Tipo de recurso no permitido: ${extension}`);
    return `data:${mediaType};base64,${fsSync.readFileSync(filePath).toString('base64')}`;
}

async function embedStylesheet(html, href, filePath, assetDirectory) {
    const css = await fs.readFile(filePath, 'utf8');
    const embedded = css.replace(/url\((['"]?)([^'")]+)\1\)/g, (_match, _quote, resource) => {
        const resourcePath = path.resolve(assetDirectory, resource);
        if (!resourcePath.startsWith(`${ROOT}${path.sep}`)) {
            throw new Error(`Fuente fuera de la carpeta de recursos: ${resource}`);
        }
        return `url("${dataUri(resourcePath)}")`;
    });

    const link = new RegExp(`<link\\b[^>]*href=["']${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'i');
    return html.replace(link, `<style>\n${embedded}\n</style>`);
}

async function main() {
    const argument = process.argv.find(value => value.startsWith('--guest='));
    const guestFile = argument ? argument.slice('--guest='.length) : DEFAULT_GUEST;
    if (path.basename(guestFile) !== guestFile || !guestFile.endsWith('.html')) {
        throw new Error('El invitado debe ser el nombre de un archivo HTML de la carpeta oficial.');
    }

    const guestPath = path.join(GUESTS_DIR, guestFile);
    const guestRealPath = await fs.realpath(guestPath);
    if (path.dirname(guestRealPath) !== GUESTS_DIR) {
        throw new Error('El archivo solicitado no pertenece a la carpeta oficial de invitaciones.');
    }

    let html = await fs.readFile(guestRealPath, 'utf8');
    html = await embedStylesheet(
        html,
        '../assets/vendor/fonts.css',
        path.join(ROOT, 'assets', 'vendor', 'fonts.css'),
        path.join(ROOT, 'assets', 'vendor')
    );
    html = await embedStylesheet(
        html,
        '../assets/vendor/fontawesome.min.css',
        path.join(ROOT, 'assets', 'vendor', 'fontawesome.min.css'),
        path.join(ROOT, 'assets', 'vendor')
    );

    const appScript = await fs.readFile(path.join(ROOT, 'app.js'), 'utf8');
    const embeddedAppScript = [...html.matchAll(/<script>\s*[\s\S]*?<\/script>/g)]
        .find(([scriptTag]) => scriptTag.includes('Lógica JavaScript'));
    if (!embeddedAppScript) {
        throw new Error('No se encontró el código original de la invitación en la tarjeta seleccionada.');
    }
    html = html.replace(
        embeddedAppScript[0],
        `<script>\n${appScript}\n</script>`
    );

    html = html.replace(
        /<source\b[^>]*src=["']\.\.\/assets\/princesa_y_el_sapo_espanol\.mp3["'][^>]*>/i,
        `<source src="${dataUri(path.join(ROOT, 'assets', 'princesa_y_el_sapo_espanol.mp3'))}" type="audio/mpeg">`
    );

    const iconPath = path.join(ROOT, 'assets', 'icon-192.png');
    html = html.replace(/<link\b[^>]*rel=["']manifest["'][^>]*>/i, '');
    html = html.replace(
        /<link\b[^>]*rel=["']apple-touch-icon["'][^>]*>/i,
        `<link rel="apple-touch-icon" href="${dataUri(iconPath)}">`
    );
    html = html.replace(
        /<meta\b[^>]*property=["']og:image["'][^>]*>/i,
        `<meta property="og:image" content="${dataUri(iconPath)}">`
    );
    html = html.replace(
        /<meta\b[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/i,
        '<meta http-equiv="Content-Security-Policy" content="default-src data: blob: file:; script-src \'unsafe-inline\' data: file:; worker-src blob:; style-src \'unsafe-inline\' data: file:; img-src data: blob: file:; media-src data: blob: file:; font-src data: file:; connect-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\';">'
    );
    html = html.replace(/<!-- ====== BANNER INSTALACIÓN PWA[\s\S]*?<\/body>/i, '</body>');

    const documentMarkup = html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
    const remainingResources = [...documentMarkup.matchAll(/<(?:script|img|source|link)\b[^>]*?\b(?:src|href)=["']([^"']+)["'][^>]*>/gi)]
        .map(([, url]) => url)
        .filter(url => !url.startsWith('data:'));
    if (remainingResources.length > 0) {
        throw new Error(`La invitación aún depende de rutas externas o relativas: ${remainingResources.join(', ')}`);
    }
    if (/<(?:script|img|source|link)\b[^>]*\b(?:src|href)=["'](?:https?:|\/\/)/i.test(html)) {
        throw new Error('La invitación contiene recursos cargados desde Internet.');
    }
    if (/navigator\.serviceWorker|api\.qrserver\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|archive\.org/i.test(html)) {
        throw new Error('La invitación contiene una dependencia de Internet o del servidor.');
    }

    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(OUTPUT_FILE, html);
    await fs.writeFile(README_FILE, [
        'INVITACIÓN DIGITAL - VAIOLET NIKOL JAELIN',
        '',
        'ARCHIVOS',
        '- Invitacion.html: tarjeta completa e independiente, con imágenes, fuentes, música, animaciones y QR incorporados.',
        '- Invitacion_Completa.zip: copia de seguridad del HTML y estas instrucciones.',
        '',
        'ABRIR EN COMPUTADOR',
        'Haz doble clic en Invitacion.html. El contenido visual funciona sin Internet y sin iniciar un servidor.',
        'Abre el archivo con Chrome, Edge, Firefox o Safari actualizado si el sistema pregunta qué aplicación usar.',
        '',
        'ABRIR EN ANDROID',
        'Guarda Invitacion.html en el teléfono y ábrelo desde Archivos con Chrome. Algunos visores de archivos o previsualizadores de WhatsApp no ejecutan HTML local; si no funciona, usa “Abrir con Chrome”.',
        '',
        'ABRIR EN IPHONE O IPAD',
        'iOS puede impedir que un adjunto HTML local se ejecute como una página web completa. Guarda el archivo en Archivos e intenta abrirlo en Safari. Si iOS lo muestra como texto o bloquea funciones, extrae el ZIP en un computador o usa la aplicación de escritorio disponible; no se ha publicado el archivo en Internet.',
        '',
        'BOTONES Y CONEXIÓN',
        'La invitación no abre sitios al mostrarse. Solo el botón de ubicación abre el Google Maps ya configurado y el botón de confirmación abre WhatsApp con el número y los datos existentes. Esos dos botones necesitan Internet.',
        'La música empieza al tocar “Abrir invitación”. Si el navegador del dispositivo bloquea la reproducción, usa el botón de música.',
        '',
        'COMPARTIR',
        'Comparte Invitacion.html como documento/archivo. Si el servicio de mensajería bloquea o previsualiza HTML, comparte el ZIP y pide abrir el HTML con el navegador compatible. No cambies la extensión del archivo.'
    ].join('\n') + '\n', 'utf8');

    execFileSync('zip', ['-q', '-j', ZIP_FILE, OUTPUT_FILE, README_FILE], { stdio: 'inherit' });
    console.log(`Invitación autocontenida: ${path.relative(ROOT, OUTPUT_FILE)}`);
    console.log(`Copia ZIP: ${path.relative(ROOT, ZIP_FILE)}`);
    console.log(`Instrucciones: ${path.relative(ROOT, README_FILE)}`);
    console.log(`Invitado incluido: ${guestFile}`);
}

main().catch(error => {
    console.error('No se pudo exportar la invitación:', error);
    process.exitCode = 1;
});
