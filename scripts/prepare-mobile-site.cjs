const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const outputRoot = path.join(projectRoot, 'dist', 'mobile-web');

const rootFiles = [
    'index.html',
    'styles.css',
    'app.js',
    'manifest.json',
    'sw.js'
];

const appleTouchIcon = 'assets/icon-180.png';

function copyFile(relativePath) {
    const source = path.join(projectRoot, relativePath);
    const destination = path.join(outputRoot, relativePath);
    if (!fs.existsSync(source)) {
        throw new Error(`Falta un archivo necesario para publicar la PWA: ${relativePath}`);
    }
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
}

function replaceRequired(html, search, replacement, description) {
    if (search instanceof RegExp ? !search.test(html) : !html.includes(search)) {
        throw new Error(`No se pudo optimizar ${description} para la versión móvil.`);
    }
    return html.replace(search, replacement);
}

for (const file of rootFiles) copyFile(file);

const assetsRoot = path.join(projectRoot, 'assets');
if (!fs.existsSync(assetsRoot)) {
    throw new Error('Falta la carpeta assets necesaria para publicar la PWA.');
}
fs.cpSync(assetsRoot, path.join(outputRoot, 'assets'), { recursive: true });

const invitationsRoot = path.join(projectRoot, 'invitaciones_autonomas');
const invitationFiles = fs.readdirSync(invitationsRoot)
    .filter(file => file.endsWith('.html') || file.endsWith('.html.webmanifest'));
const invitations = invitationFiles.filter(file => file.endsWith('.html'));

if (invitations.length !== 42) {
    throw new Error(`Se esperaban 42 invitaciones; se encontraron ${invitations.length}.`);
}

for (const file of invitationFiles) {
    const sourcePath = path.join(invitationsRoot, file);
    const destinationPath = path.join(outputRoot, 'invitaciones_autonomas', file);
    if (!file.endsWith('.html')) {
        fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
        fs.copyFileSync(sourcePath, destinationPath);
        continue;
    }

    let html = fs.readFileSync(sourcePath, 'utf8');
    html = replaceRequired(
        html,
        /<style>\s*[\s\S]*?<\/style>/,
        '<link rel="stylesheet" href="../styles.css">',
        `la hoja de estilos de ${file}`
    );

    for (const [filename, mimeType] of [
        ['wax_seal.png', 'image/png'],
        ['hero_block_ref.jpg', 'image/jpeg']
    ]) {
        const asset = fs.readFileSync(path.join(assetsRoot, filename)).toString('base64');
        const dataUri = `data:${mimeType};base64,${asset}`;
        if (!html.includes(dataUri)) {
            throw new Error(`No se encontró la imagen ${filename} dentro de ${file}.`);
        }
        html = html.replaceAll(dataUri, `../assets/${filename}`);
    }

    if (!html.includes('worker-src ')) {
        html = replaceRequired(
            html,
            "script-src 'self' 'unsafe-inline' file:; style-src",
            "script-src 'self' 'unsafe-inline' file:; worker-src 'self' blob:; style-src",
            `la política de workers de ${file}`
        );
    }

    for (const filename of [
        'qrcode.min.js',
        'confetti.browser.js',
        'html2canvas.min.js'
    ]) {
        const script = fs.readFileSync(path.join(assetsRoot, 'vendor', filename), 'utf8');
        html = replaceRequired(
            html,
            `<script>\n${script}\n</script>`,
            `<script src="../assets/vendor/${filename}"></script>`,
            `${filename} de ${file}`
        );
    }

    const appScript = fs.readFileSync(path.join(projectRoot, 'app.js'), 'utf8');
    const embeddedAppScript = [...html.matchAll(/<script>\s*[\s\S]*?<\/script>/g)]
        .find(([scriptTag]) => scriptTag.includes('Lógica JavaScript'))?.[0];
    if (!embeddedAppScript) {
        throw new Error(`No se encontró el código de la invitación dentro de ${file}.`);
    }
    html = replaceRequired(
        html,
        embeddedAppScript,
        '<script src="../app.js"></script>',
        `app.js de ${file}`
    );

    html = html.replaceAll('"assets/', '"../assets/').replaceAll("'assets/", "'../assets/");
    if (!html.includes("navigator.serviceWorker.register('../sw.js', { scope: '../' })")) {
        throw new Error(`No se encontró el service worker de ${file}.`);
    }

    if (/data:(?:image|text|font)\/[^;]+;base64,[A-Za-z0-9+/=]{100000,}/.test(html)) {
        throw new Error(`La tarjeta ${file} aún duplica recursos grandes y no es apta para móvil.`);
    }

    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.writeFileSync(destinationPath, html);
}

for (const filename of invitations) {
    const manifestPath = path.join(
        outputRoot,
        'invitaciones_autonomas',
        `${filename}.webmanifest`
    );
    if (!fs.existsSync(manifestPath)) {
        throw new Error(`Falta el manifiesto PWA de ${filename}.`);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.start_url !== `./${filename}` || manifest.display !== 'standalone') {
        throw new Error(`El manifiesto PWA de ${filename} no está configurado para esa tarjeta.`);
    }
    if (!manifest.icons.some(icon => icon.sizes === '180x180' && icon.src === '../assets/icon-180.png')) {
        throw new Error(`El manifiesto PWA de ${filename} no tiene el icono de inicio para iPhone.`);
    }
}

const serviceWorker = fs.readFileSync(path.join(outputRoot, 'sw.js'), 'utf8');
const appShell = serviceWorker.match(/const APP_SHELL = \[([\s\S]*?)\];/);
if (!appShell) throw new Error('No se pudo validar la lista de recursos PWA.');

for (const [, asset] of appShell[1].matchAll(/'\.\/([^']+)'/g)) {
    if (!fs.existsSync(path.join(outputRoot, asset))) {
        throw new Error(`Falta un recurso de la caché sin conexión: ${asset}`);
    }
}

fs.writeFileSync(path.join(outputRoot, '_headers'), [
    '/*.webmanifest',
    '  Content-Type: application/manifest+json; charset=utf-8',
    '',
    '/sw.js',
    '  Cache-Control: no-cache',
    '  Service-Worker-Allowed: /',
    '',
    '/*',
    '  X-Content-Type-Options: nosniff',
    ''
].join('\n'));

if (!fs.existsSync(path.join(outputRoot, appleTouchIcon))) {
    throw new Error('Falta el icono de 180x180 requerido para añadir la invitación a la pantalla de inicio del iPhone.');
}

console.log(`Sitio PWA listo: ${path.relative(projectRoot, outputRoot)}`);
console.log(`Invitaciones verificadas: ${invitations.length}`);
