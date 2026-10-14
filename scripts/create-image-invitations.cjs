const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const net = require('node:net');
const { once } = require('node:events');
const WebSocket = require('ws');

const projectRoot = path.resolve(__dirname, '..');
const invitationRoot = path.join(projectRoot, 'invitaciones_autonomas');
const assetsRoot = path.join(projectRoot, 'assets');
const outputRoot = path.join(projectRoot, 'INVITACIONES_IMAGENES_IPHONE');
const imageWidth = 390;
const deviceScaleFactor = 2;
const screenshotChunkHeight = 5000;
const htmlReadme = `INVITACION INTERACTIVA Y TARJETA EN ALTA RESOLUCION
===================================================

- Abre index.html para la invitacion interactiva: sobre, animaciones, musica,
  confirmacion y ubicacion.
- Tarjeta_Alta_Resolucion.png es la imagen completa de la tarjeta, preparada
  a 780 px de ancho para pantallas moviles y ampliacion.
- La imagen PNG es estatica: no puede reproducir musica ni ejecutar botones.
  Para interactuar, abre index.html y pulsa los botones de la invitacion.
- La musica comienza con el toque en "Abrir Invitacion". Si el visor impide el
  audio, toca tambien el control de musica. El modo silencio y las politicas
  de reproduccion de iOS pueden afectar el sonido.
- Maps y WhatsApp solo se abren cuando se pulsan sus respectivos botones.
- El contenido y los recursos visuales estan incluidos para uso local.

LIMITACION DE IOS
-----------------

La vista previa de Archivos o WhatsApp puede tratar el HTML como documento y
bloquear JavaScript, audio o fuentes locales. La carpeta conserva todos los
recursos, pero no puede obligar al visor de iOS a ejecutar HTML local. La
imagen PNG se puede ver sin ejecutar codigo; para la tarjeta interactiva,
abre index.html con un navegador compatible o usa la app iOS compilada.

Este ZIP contiene solamente una invitacion. No compartas el paquete de otra
persona ni la carpeta que contiene todos los paquetes.
`;

const rootReadme = `INVITACIONES EN IMAGEN DE ALTA RESOLUCION PARA IPHONE
======================================================

Esta carpeta contiene 42 ZIP separados, uno por invitado. Cada ZIP incluye
solamente la tarjeta personalizada de ese invitado, una imagen PNG larga a
780 px de ancho y la version HTML interactiva con los recursos locales.

PRIVACIDAD
----------

Envia solo el ZIP correspondiente a cada persona. No compartas esta carpeta
completa: contiene los 42 paquetes.

COMO USAR
---------

Descomprime el ZIP y abre index.html para usar el sobre, la musica, la
confirmacion por WhatsApp y el boton de ubicacion. Tarjeta_Alta_Resolucion.png
es una imagen estatica de alta resolucion; como toda imagen, no tiene botones
ni reproduce sonido. Los botones interactivos estan en index.html.

En iPhone, la vista previa de Archivos puede bloquear scripts o audio de
HTML local. Los recursos estan incluidos, pero esa limitacion depende de
iOS. No se publico nada en Internet. No se probo un iPhone fisico.

PRUEBAS
-------

Las imagenes se renderizan desde las 42 tarjetas existentes a 390 px de
ancho CSS y escala 2x (780 px). Se comprueba que cada ZIP sea valido y tenga
una sola invitacion. La animacion interactiva se conserva en el HTML; el PNG
es solamente una version estatica para ver o ampliar.
`;

function fail(message) {
    throw new Error(message);
}

function copyRequired(source, destination) {
    if (!fs.existsSync(source)) fail(`Falta el recurso requerido: ${source}`);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.cpSync(source, destination, { recursive: true });
}

function reservePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            server.close(error => error ? reject(error) : resolve(port));
        });
    });
}

function waitForProcessReady(child, readyCheck, description, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
        const deadline = Date.now() + timeoutMs;
        let lastResult;
        const poll = async () => {
            if (child.exitCode !== null) {
                reject(new Error(`${description} terminó antes de estar disponible.`));
                return;
            }
            try {
                const value = await readyCheck();
                lastResult = value;
                if (value && value.ready !== false) {
                    resolve(value);
                    return;
                }
            } catch {
                // El proceso puede tardar en abrir el puerto.
            }
            if (Date.now() >= deadline) {
                reject(new Error(`Tiempo agotado esperando ${description}. Estado: ${JSON.stringify(lastResult)}`));
                return;
            }
            setTimeout(poll, 150);
        };
        poll();
    });
}

class DevTools {
    constructor(socket) {
        this.socket = socket;
        this.nextId = 0;
        this.pending = new Map();
        this.events = new Map();
        socket.on('message', data => {
            const message = JSON.parse(data.toString());
            if (message.id) {
                const pending = this.pending.get(message.id);
                if (!pending) return;
                this.pending.delete(message.id);
                if (message.error) {
                    pending.reject(new Error(message.error.message));
                } else {
                    pending.resolve(message.result);
                }
            } else if (message.method) {
                const listeners = this.events.get(message.method) ?? [];
                for (const listener of listeners) listener(message.params);
            }
        });
    }

    command(method, params = {}) {
        const id = ++this.nextId;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.socket.send(JSON.stringify({ id, method, params }));
        });
    }

    waitForEvent(name, timeoutMs = 30000) {
        return new Promise((resolve, reject) => {
            const listeners = this.events.get(name) ?? [];
            const listener = value => {
                clearTimeout(timeout);
                this.events.set(name, listeners.filter(candidate => candidate !== listener));
                resolve(value);
            };
            const timeout = setTimeout(() => {
                this.events.set(name, listeners.filter(candidate => candidate !== listener));
                reject(new Error(`Tiempo agotado esperando ${name}.`));
            }, timeoutMs);
            listeners.push(listener);
            this.events.set(name, listeners);
        });
    }

    async evaluate(expression, awaitPromise = true) {
        const result = await this.command('Runtime.evaluate', {
            expression,
            awaitPromise,
            returnByValue: true
        });
        if (result.exceptionDetails) {
            fail(result.exceptionDetails.text || `Falló la evaluación: ${expression}`);
        }
        return result.result.value;
    }
}

async function makeInvitationHtml(source, fileName) {
    let html = fs.readFileSync(source, 'utf8');
    const manifest = `<link rel="manifest" href="${fileName}.webmanifest">`;
    html = html.replace(manifest, '');
    html = html.replace('href="assets/icon-180.png"', 'href="assets/icon-180.png"');
    html = html.replaceAll('../assets/vendor/', 'assets/vendor/');
    html = html.replaceAll('../assets/', 'assets/');
    if (!html.includes('<link rel="stylesheet" href="assets/vendor/fonts.css">')
        || !html.includes('<link rel="stylesheet" href="assets/vendor/fontawesome.min.css">')) {
        fail(`No se pudieron adaptar las rutas locales de ${fileName}.`);
    }

    const headClose = html.indexOf('</head>');
    if (headClose === -1) fail(`El HTML de ${fileName} no tiene cierre head.`);
    html = `${html.slice(0, headClose)}\n<style>#installBanner{display:none!important}</style>\n${html.slice(headClose)}`;

    const resources = [...html.matchAll(/<(?:script|img|source|link)\b[^>]*?\b(?:src|href)=["']([^"']+)["'][^>]*>/gi)]
        .map(([, url]) => url)
        .filter(url => !url.startsWith('data:') && !url.startsWith('#'));
    for (const resource of resources) {
        if (/^(?:https?:)?\/\//i.test(resource)) {
            fail(`La invitación ${fileName} contiene un recurso remoto: ${resource}`);
        }
    }
    return html;
}

async function main() {
    if (fs.existsSync(outputRoot)) {
        fail(`La carpeta de salida ya existe; no se modificó: ${outputRoot}`);
    }

    const chromiumPath = [
        '/snap/chromium/current/usr/lib/chromium-browser/chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser'
    ]
        .find(candidate => fs.existsSync(candidate));
    if (!chromiumPath) fail('No se encontró Chromium instalado para generar las imágenes.');

    const guestFiles = fs.readdirSync(invitationRoot)
        .filter(file => file.endsWith('.html'))
        .sort((left, right) => left.localeCompare(right, 'en'));
    if (guestFiles.length !== 42) {
        fail(`Se esperaban 42 invitaciones y se encontraron ${guestFiles.length}.`);
    }

    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'invitaciones-imagenes-'));
    const debugPort = await reservePort();
    const userData = path.join(tempRoot, 'chromium-profile');
    const chromium = spawn(chromiumPath, [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-background-networking',
        '--disable-extensions',
        '--no-first-run',
        '--hide-scrollbars',
        `--remote-debugging-port=${debugPort}`,
        `--user-data-dir=${userData}`,
        `--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost`,
        'about:blank'
    ], { stdio: 'ignore' });
    let socket;

    try {
        const target = await waitForProcessReady(
            chromium,
            async () => {
                const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
                const targets = await response.json();
                return targets.find(entry => entry.type === 'page');
            },
            'Chromium'
        );
        socket = new WebSocket(target.webSocketDebuggerUrl);
        await once(socket, 'open');
        const devtools = new DevTools(socket);
        devtools.events.set('Runtime.exceptionThrown', [
            details => console.error(`Error JavaScript: ${details.exceptionDetails.text}`)
        ]);
        devtools.events.set('Log.entryAdded', [
            entry => {
                if (entry.entry.level === 'error') console.error(`Error navegador: ${entry.entry.text}`);
            }
        ]);
        await devtools.command('Page.enable');
        await devtools.command('Runtime.enable');
        await devtools.command('Emulation.setDeviceMetricsOverride', {
            width: imageWidth,
            height: 844,
            deviceScaleFactor,
            mobile: true,
            screenWidth: imageWidth,
            screenHeight: 844
        });

        fs.mkdirSync(outputRoot, { recursive: true });
        fs.writeFileSync(path.join(outputRoot, 'README.txt'), rootReadme);
        const fontResources = [
            'fonts.css',
            'fontawesome.min.css',
            'fonts',
            'webfonts'
        ];

        for (const [index, filename] of guestFiles.entries()) {
            const guestName = path.basename(filename, '.html');
            const guestOutput = path.join(outputRoot, `${guestName}_IMAGEN`);
            const resourceOutput = path.join(guestOutput, 'assets');
            const vendorOutput = path.join(resourceOutput, 'vendor');
            const imagePartsDir = path.join(tempRoot, `parts-${String(index + 1).padStart(2, '0')}`);
            fs.mkdirSync(vendorOutput, { recursive: true });
            fs.mkdirSync(imagePartsDir, { recursive: true });
            for (const resource of fontResources) {
                copyRequired(path.join(assetsRoot, 'vendor', resource), path.join(vendorOutput, resource));
            }
            copyRequired(path.join(assetsRoot, 'icon-180.png'), path.join(resourceOutput, 'icon-180.png'));

            const htmlPath = path.join(guestOutput, 'index.html');
            fs.writeFileSync(htmlPath, await makeInvitationHtml(path.join(invitationRoot, filename), filename));
            fs.writeFileSync(path.join(guestOutput, 'README.txt'), htmlReadme);

            const navigationFinished = devtools.waitForEvent('Page.loadEventFired');
            await devtools.command('Page.navigate', {
                url: `file://${path.join(invitationRoot, filename)}`
            });
            await navigationFinished;
            const ready = await waitForProcessReady(
                chromium,
                async () => devtools.evaluate(`(() => {
                    const images = [...document.images];
                    return {
                        ready: document.readyState === 'complete'
                            && images.every(image => image.complete && image.naturalWidth > 0)
                            && typeof window.openInvitationCard === 'function',
                        state: document.readyState,
                        opener: typeof window.openInvitationCard,
                        images: images.map(image => ({
                            src: image.currentSrc.slice(0, 80),
                            complete: image.complete,
                            width: image.naturalWidth
                        }))
                    };
                })()`),
                `los recursos de ${filename}`,
                30000
            );
            if (!ready) fail(`No se cargaron los recursos de ${filename}.`);
            await devtools.evaluate('window.openInvitationCard()');
            await new Promise(resolve => setTimeout(resolve, 2700));
            await devtools.evaluate(`(() => {
                document.querySelectorAll('.floating-controls, #closeEnvelopeBtn, #installBanner').forEach(el => el.style.setProperty('display', 'none', 'important'));
                return true;
            })()`);
            await devtools.command('Runtime.evaluate', {
                expression: 'document.fonts.ready',
                awaitPromise: true,
                returnByValue: true
            });
            const { contentSize } = await devtools.command('Page.getLayoutMetrics');
            const pageHeight = Math.ceil(contentSize.height);
            if (pageHeight <= 0) fail(`La altura de ${filename} no es válida: ${pageHeight}.`);

            let offset = 0;
            let part = 0;
            while (offset < pageHeight) {
                const chunkHeight = Math.min(screenshotChunkHeight, pageHeight - offset);
                const image = await devtools.command('Page.captureScreenshot', {
                    format: 'png',
                    fromSurface: true,
                    captureBeyondViewport: true,
                    clip: { x: 0, y: offset, width: imageWidth, height: chunkHeight, scale: 1 }
                });
                fs.writeFileSync(
                    path.join(imagePartsDir, `${String(part).padStart(3, '0')}.png`),
                    Buffer.from(image.data, 'base64')
                );
                offset += chunkHeight;
                part += 1;
            }

            const outputImage = path.join(guestOutput, 'Tarjeta_Alta_Resolucion.png');
            const stitch = spawnSync('python3', [
                '-c',
                [
                    'from PIL import Image',
                    'from pathlib import Path',
                    'import sys',
                    'parts = sorted(Path(sys.argv[1]).glob(\"*.png\"))',
                    'images = [Image.open(p).convert(\"RGB\") for p in parts]',
                    'width = images[0].width',
                    'assert all(image.width == width for image in images)',
                    'result = Image.new(\"RGB\", (width, sum(image.height for image in images)), \"white\")',
                    'y = 0',
                    'for image in images:',
                    '    result.paste(image, (0, y))',
                    '    y += image.height',
                    'result.save(sys.argv[2], format=\"PNG\", optimize=True, dpi=(192, 192))',
                    'print(f\"{result.width}x{result.height}\")'
                ].join('\n'),
                imagePartsDir,
                outputImage
            ], { encoding: 'utf8' });
            if (stitch.status !== 0) {
                fail(`No se pudo unir la imagen de ${filename}: ${stitch.stderr}`);
            }
            fs.rmSync(imagePartsDir, { recursive: true, force: true });

            const zipFile = path.join(outputRoot, `${guestName}_IMAGEN.zip`);
            const zip = spawnSync('zip', [
                '-q',
                '-r',
                '-X',
                zipFile,
                'index.html',
                'README.txt',
                'Tarjeta_Alta_Resolucion.png',
                'assets'
            ], { cwd: guestOutput, encoding: 'utf8' });
            if (zip.error) throw zip.error;
            if (zip.status !== 0) fail(`No se pudo crear ${zipFile}: ${zip.stderr}`);

            const verify = spawnSync('unzip', ['-tq', zipFile], { encoding: 'utf8' });
            if (verify.status !== 0) fail(`El ZIP de ${filename} no pasó la prueba de integridad.`);
            const zipEntries = spawnSync('unzip', ['-Z', '-1', zipFile], { encoding: 'utf8' });
            if (zipEntries.status !== 0
                || (zipEntries.stdout.match(/(^|\n)index\.html(\n|$)/g) ?? []).length !== 1
                || (zipEntries.stdout.match(/(^|\n)Tarjeta_Alta_Resolucion\.png(\n|$)/g) ?? []).length !== 1) {
                fail(`El ZIP de ${filename} no contiene exactamente una invitación y una imagen.`);
            }
            fs.rmSync(guestOutput, { recursive: true });
            console.log(`${index + 1}/42 ${guestName}: ${stitch.stdout.trim()} px`);
        }

        console.log(`Invitaciones listas: ${outputRoot}`);
    } finally {
        socket?.close();
        fs.rmSync(tempRoot, { recursive: true, force: true });
        if (chromium.exitCode === null) {
            try {
                chromium.kill('SIGTERM');
            } catch (error) {
                console.error(`No se pudo detener Chromium directamente: ${error.message}`);
            }
        }
    }
}

main().catch(error => {
    console.error('No se pudieron generar las invitaciones en imagen:', error);
    process.exitCode = 1;
});
