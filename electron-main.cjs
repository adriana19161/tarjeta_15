const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { isApprovedExternalUrl } = require('./electron-security.cjs');

const ENTRY_FILE = path.join(__dirname, 'index.html');
const ENTRY_URL = pathToFileURL(ENTRY_FILE).href;

function openExternalUrl(value) {
    if (!isApprovedExternalUrl(value)) {
        console.warn('Se bloqueó un enlace externo no permitido.');
        return;
    }

    shell.openExternal(value).catch(error => {
        console.error('No se pudo abrir el enlace externo:', error);
    });
}

function createWindow() {
    const window = new BrowserWindow({
        width: 900,
        height: 960,
        minWidth: 320,
        minHeight: 560,
        show: false,
        autoHideMenuBar: true,
        backgroundColor: '#EDF5E0',
        icon: path.join(__dirname, 'assets', 'icon-512.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false
        }
    });

    window.webContents.setWindowOpenHandler(({ url }) => {
        openExternalUrl(url);
        return { action: 'deny' };
    });

    window.webContents.on('will-navigate', (event, target) => {
        if (target !== ENTRY_URL) event.preventDefault();
    });

    window.webContents.on('will-redirect', (event, target) => {
        if (target !== ENTRY_URL) event.preventDefault();
    });

    window.webContents.on('will-attach-webview', event => event.preventDefault());
    window.webContents.on('will-download', (_event, item) => {
        item.setSaveDialogOptions({
            title: 'Guardar pase digital',
            defaultPath: item.getFilename()
        });
    });

    window.once('ready-to-show', () => window.show());
    window.loadFile(ENTRY_FILE).catch(error => {
        console.error('No se pudo abrir la invitación:', error);
        app.quit();
    });
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
