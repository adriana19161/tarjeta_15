const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const mobileRoot = path.join(projectRoot, 'dist', 'mobile-web');
const invitationRoot = path.join(mobileRoot, 'invitaciones_autonomas');
const outputRoot = path.join(projectRoot, 'INVITACIONES_POR_INVITADO');
const sharedFiles = [
    'styles.css',
    'app.js',
    'sw.js',
    'assets/vendor',
    'assets/icon-180.png',
    'assets/icon-192.png',
    'assets/icon-512.png',
    'assets/hero_block_ref.jpg',
    'assets/pistachio_bg.png',
    'assets/princesa_y_el_sapo_espanol.mp3',
    'assets/vaiolet_portrait.jpg',
    'assets/wax_seal.png'
];
const packageReadme = [
    'INVITACION PERSONAL',
    '===================',
    '',
    'Este paquete contiene una sola invitacion personalizada y los recursos',
    'necesarios para mostrarla. No reenvies este ZIP junto con paquetes de',
    'otras personas ni compartas la carpeta que los contiene.',
    '',
    'Extrae el ZIP y abre index.html. En iPhone, la vista previa de Archivos',
    'puede restringir JavaScript, musica o recursos locales. Para una',
    'experiencia interactiva fiable en Safari se requiere servir el paquete',
    'desde HTTPS; este paquete no esta publicado en Internet.',
    '',
    'Los botones de ubicacion y confirmacion conservan sus destinos actuales.',
    'WhatsApp prepara el mensaje, que el invitado debe revisar y enviar.'
].join('\n') + '\n';

function replaceOnce(text, search, replacement, description) {
    const firstIndex = text.indexOf(search);
    if (firstIndex === -1 || text.indexOf(search, firstIndex + search.length) !== -1) {
        throw new Error(`Se esperaba una sola coincidencia para ${description}.`);
    }
    return text.replace(search, replacement);
}

function copyFileOrDirectory(sourceRoot, destinationRoot, relativePath) {
    const source = path.join(sourceRoot, relativePath);
    const destination = path.join(destinationRoot, relativePath);
    if (!fs.existsSync(source)) throw new Error(`Falta el recurso ${relativePath}.`);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.cpSync(source, destination, { recursive: true });
}

const invitationFiles = fs.readdirSync(invitationRoot)
    .filter(file => file.endsWith('.html'))
    .sort((a, b) => a.localeCompare(b, 'en'));

if (invitationFiles.length !== 42) {
    throw new Error(`Se esperaban 42 tarjetas; se encontraron ${invitationFiles.length}.`);
}

fs.mkdirSync(outputRoot, { recursive: true });
const stagingRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'invitacion-privada-'));

try {
    for (const [index, filename] of invitationFiles.entries()) {
        const packageRoot = path.join(stagingRoot, 'paquete');
        fs.mkdirSync(packageRoot);

        let html = fs.readFileSync(path.join(invitationRoot, filename), 'utf8');
        html = replaceOnce(html, `href="${filename}.webmanifest"`, 'href="manifest.json"', 'el manifiesto HTML');
        html = replaceOnce(html, 'href="../styles.css"', 'href="styles.css"', 'la hoja CSS');
        html = replaceOnce(
            html,
            "navigator.serviceWorker.register('../sw.js', { scope: '../' })",
            "navigator.serviceWorker.register('./sw.js', { scope: './' })",
            'el registro del service worker'
        );
        html = html.replaceAll('../assets/', 'assets/');
        fs.writeFileSync(path.join(packageRoot, 'index.html'), html);
        fs.writeFileSync(path.join(packageRoot, 'README.txt'), packageReadme);

        const manifestPath = path.join(invitationRoot, `${filename}.webmanifest`);
        if (!fs.existsSync(manifestPath)) {
            throw new Error(`Falta el manifiesto de ${filename}.`);
        }
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        manifest.id = './index.html';
        manifest.start_url = './index.html';
        manifest.scope = './';
        manifest.icons = manifest.icons.map(icon => ({
            ...icon,
            src: icon.src.replace('../assets/', 'assets/')
        }));
        fs.writeFileSync(
            path.join(packageRoot, 'manifest.json'),
            `${JSON.stringify(manifest, null, 2)}\n`
        );

        for (const sharedFile of sharedFiles) {
            copyFileOrDirectory(mobileRoot, packageRoot, sharedFile);
        }

        const serviceWorkerPath = path.join(packageRoot, 'sw.js');
        const serviceWorker = fs.readFileSync(serviceWorkerPath, 'utf8')
            .replace(
                "const CACHE_NAME = 'vaiolet-15-v9';",
                `const CACHE_NAME = 'vaiolet-15-private-${String(index + 1).padStart(2, '0')}-v1';`
            );
        if (serviceWorker === fs.readFileSync(serviceWorkerPath, 'utf8')) {
            throw new Error('No se pudo asignar un nombre de caché PWA único.');
        }
        fs.writeFileSync(serviceWorkerPath, serviceWorker);

        for (const asset of serviceWorker.match(/'\.\/([^']+)'/g) ?? []) {
            const relativePath = asset.slice(3, -1);
            if (!fs.existsSync(path.join(packageRoot, relativePath))) {
                throw new Error(`El paquete de ${filename} no contiene ${relativePath}.`);
            }
        }

        const archivePath = path.join(outputRoot, `${path.basename(filename, '.html')}.zip`);
        fs.rmSync(archivePath, { force: true });
        const zip = spawnSync('zip', ['-q', '-r', '-X', archivePath, '.'], {
            cwd: packageRoot,
            encoding: 'utf8'
        });
        if (zip.error) throw zip.error;
        if (zip.status !== 0) throw new Error(`No se pudo crear ${archivePath}: ${zip.stderr}`);

        const listing = spawnSync('unzip', ['-Z1', archivePath], { encoding: 'utf8' });
        if (listing.status !== 0) throw new Error(`No se pudo verificar ${archivePath}.`);
        const entries = listing.stdout.trim().split('\n');
        if (entries.some(entry => entry.includes('invitaciones_autonomas/'))) {
            throw new Error(`El paquete ${filename} contiene otras invitaciones.`);
        }
        if (!entries.includes('index.html') || !entries.includes('manifest.json')) {
            throw new Error(`El paquete ${filename} está incompleto.`);
        }
        fs.rmSync(packageRoot, { recursive: true, force: true });
    }
} finally {
    fs.rmSync(stagingRoot, { recursive: true, force: true });
}

console.log(`Paquetes privados creados y verificados: ${invitationFiles.length}`);
console.log(`Salida: ${path.relative(projectRoot, outputRoot)}`);
