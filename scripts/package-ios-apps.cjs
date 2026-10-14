const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const mobileRoot = path.join(projectRoot, 'dist', 'mobile-web');
const invitationRoot = path.join(mobileRoot, 'invitaciones_autonomas');
const outputRoot = path.join(projectRoot, 'INVITACION_IOS');
const sharedFiles = [
    'styles.css',
    'app.js',
    'sw.js',
    'assets'
];

const projectTemplate = ({ projectName, bundleIdentifier }) => {
    const id = suffix => crypto.createHash('sha1')
        .update(`${bundleIdentifier}:${suffix}`)
        .digest('hex')
        .slice(0, 24)
        .toUpperCase();
    const refs = Object.fromEntries([
        'project',
        'target',
        'rootGroup',
        'appGroup',
        'productsGroup',
        'appFile',
        'infoFile',
        'invitationFolder',
        'product',
        'sourcesPhase',
        'frameworksPhase',
        'resourcesPhase',
        'appBuildFile',
        'invitationBuildFile',
        'projectDebug',
        'projectRelease',
        'targetDebug',
        'targetRelease',
        'configurationListProject',
        'configurationListTarget'
    ].map(name => [name, id(name)]));

    return `// !$*UTF8*$!
{
\tarchiveVersion = 1;
\tclasses = {
\t};
\tobjectVersion = 56;
\tobjects = {

\t\t${refs.appBuildFile} /* InvitationApp.swift in Sources */ = {isa = PBXBuildFile; fileRef = ${refs.appFile} /* InvitationApp.swift */; };
\t\t${refs.invitationBuildFile} /* Invitation in Resources */ = {isa = PBXBuildFile; fileRef = ${refs.invitationFolder} /* Invitation */; };

\t\t${refs.appFile} /* InvitationApp.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = InvitationApp.swift; sourceTree = "<group>"; };
\t\t${refs.infoFile} /* Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; };
\t\t${refs.invitationFolder} /* Invitation */ = {isa = PBXFileReference; lastKnownFileType = folder; path = Invitation; sourceTree = "<group>"; };
\t\t${refs.product} /* ${projectName}.app */ = {isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = ${projectName}.app; sourceTree = BUILT_PRODUCTS_DIR; };

\t\t${refs.appGroup} /* ${projectName} */ = {
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
\t\t\t\t${refs.appFile} /* InvitationApp.swift */,
\t\t\t\t${refs.infoFile} /* Info.plist */,
\t\t\t\t${refs.invitationFolder} /* Invitation */,
\t\t\t);
\t\t\tpath = ${projectName};
\t\t\tsourceTree = "<group>";
\t\t};
\t\t${refs.productsGroup} /* Products */ = {
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
\t\t\t\t${refs.product} /* ${projectName}.app */,
\t\t\t);
\t\t\tname = Products;
\t\t\tsourceTree = "<group>";
\t\t};
\t\t${refs.rootGroup} = {
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
\t\t\t\t${refs.appGroup} /* ${projectName} */,
\t\t\t\t${refs.productsGroup} /* Products */,
\t\t\t);
\t\t\tsourceTree = "<group>";
\t\t};

\t\t${refs.project} /* Project object */ = {
\t\t\tisa = PBXProject;
\t\t\tattributes = {
\t\t\t\tBuildIndependentTargetsInParallel = 1;
\t\t\t\tLastUpgradeCheck = 1600;
\t\t\t\tTargetAttributes = {
\t\t\t\t\t${refs.target} = {CreatedOnToolsVersion = 16.0; };
\t\t\t\t};
\t\t\t};
\t\t\tbuildConfigurationList = ${refs.configurationListProject};
\t\t\tcompatibilityVersion = "Xcode 14.0";
\t\t\tdevelopmentRegion = es;
\t\t\thasScannedForEncodings = 0;
\t\t\tknownRegions = (
\t\t\t\ten,
\t\t\t\tBase,
\t\t\t);
\t\t\tmainGroup = ${refs.rootGroup};
\t\t\tproductRefGroup = ${refs.productsGroup};
\t\t\tprojectDirPath = "";
\t\t\tprojectRoot = "";
\t\t\ttargets = (
\t\t\t\t${refs.target} /* ${projectName} */,
\t\t\t);
\t\t};
\t\t${refs.target} /* ${projectName} */ = {
\t\t\tisa = PBXNativeTarget;
\t\t\tbuildConfigurationList = ${refs.configurationListTarget};
\t\t\tbuildPhases = (
\t\t\t\t${refs.sourcesPhase} /* Sources */,
\t\t\t\t${refs.frameworksPhase} /* Frameworks */,
\t\t\t\t${refs.resourcesPhase} /* Resources */,
\t\t\t);
\t\t\tbuildRules = (
\t\t\t);
\t\t\tdependencies = (
\t\t\t);
\t\t\tname = ${projectName};
\t\t\tproductName = ${projectName};
\t\t\tproductReference = ${refs.product} /* ${projectName}.app */;
\t\t\tproductType = "com.apple.product-type.application";
\t\t};

\t\t${refs.sourcesPhase} /* Sources */ = {
\t\t\tisa = PBXSourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t\t${refs.appBuildFile} /* InvitationApp.swift in Sources */,
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t};
\t\t${refs.frameworksPhase} /* Frameworks */ = {
\t\t\tisa = PBXFrameworksBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t};
\t\t${refs.resourcesPhase} /* Resources */ = {
\t\t\tisa = PBXResourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t\t${refs.invitationBuildFile} /* Invitation in Resources */,
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t};

\t\t${refs.projectDebug} /* Debug */ = {isa = XCBuildConfiguration; buildSettings = {CLANG_ENABLE_MODULES = YES; IPHONEOS_DEPLOYMENT_TARGET = 16.0; SDKROOT = iphoneos; SWIFT_VERSION = 5.0; }; name = Debug; };
\t\t${refs.projectRelease} /* Release */ = {isa = XCBuildConfiguration; buildSettings = {CLANG_ENABLE_MODULES = YES; IPHONEOS_DEPLOYMENT_TARGET = 16.0; SDKROOT = iphoneos; SWIFT_VERSION = 5.0; }; name = Release; };
\t\t${refs.targetDebug} /* Debug */ = {
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {
\t\t\t\tCODE_SIGN_STYLE = Automatic;
\t\t\t\tGENERATE_INFOPLIST_FILE = NO;
\t\t\t\tINFOPLIST_FILE = ${projectName}/Info.plist;
\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 16.0;
\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = ${bundleIdentifier};
\t\t\t\tPRODUCT_NAME = "$(TARGET_NAME)";
\t\t\t\tSWIFT_EMIT_LOC_STRINGS = YES;
\t\t\t\tSWIFT_VERSION = 5.0;
\t\t\t\tTARGETED_DEVICE_FAMILY = "1,2";
\t\t\t};
\t\t\tname = Debug;
\t\t};
\t\t${refs.targetRelease} /* Release */ = {
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {
\t\t\t\tCODE_SIGN_STYLE = Automatic;
\t\t\t\tGENERATE_INFOPLIST_FILE = NO;
\t\t\t\tINFOPLIST_FILE = ${projectName}/Info.plist;
\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 16.0;
\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = ${bundleIdentifier};
\t\t\t\tPRODUCT_NAME = "$(TARGET_NAME)";
\t\t\t\tSWIFT_EMIT_LOC_STRINGS = YES;
\t\t\t\tSWIFT_VERSION = 5.0;
\t\t\t\tTARGETED_DEVICE_FAMILY = "1,2";
\t\t\t};
\t\t\tname = Release;
\t\t};
\t\t${refs.configurationListProject} /* Build configuration list for PBXProject "${projectName}" */ = {
\t\t\tisa = XCConfigurationList;
\t\t\tbuildConfigurations = (
\t\t\t\t${refs.projectDebug} /* Debug */,
\t\t\t\t${refs.projectRelease} /* Release */,
\t\t\t);
\t\t\tdefaultConfigurationIsVisible = 0;
\t\t\tdefaultConfigurationName = Release;
\t\t};
\t\t${refs.configurationListTarget} /* Build configuration list for PBXNativeTarget "${projectName}" */ = {
\t\t\tisa = XCConfigurationList;
\t\t\tbuildConfigurations = (
\t\t\t\t${refs.targetDebug} /* Debug */,
\t\t\t\t${refs.targetRelease} /* Release */,
\t\t\t);
\t\t\tdefaultConfigurationIsVisible = 0;
\t\t\tdefaultConfigurationName = Release;
\t\t};
\t};
\trootObject = ${refs.project} /* Project object */;
}
`;
};

const swiftSource = `import SwiftUI
import UIKit
import WebKit

@main
struct InvitationApp: App {
    var body: some Scene {
        WindowGroup {
            InvitationView()
                .ignoresSafeArea()
                .preferredColorScheme(.light)
        }
    }
}

private struct InvitationView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let contentController = WKUserContentController()
        contentController.add(WeakScriptMessageHandler(delegate: context.coordinator), name: "openExternal")
        contentController.add(WeakScriptMessageHandler(delegate: context.coordinator), name: "saveImage")
        contentController.addUserScript(WKUserScript(
            source: """
            window.IS_NATIVE_INVITATION_APP = true;
            const nativeOpen = window.webkit.messageHandlers.openExternal;
            const nativeSave = window.webkit.messageHandlers.saveImage;
            let lastTrustedClick = 0;
            let saveRequestedUntil = 0;
            window.addEventListener('click', function (event) {
                if (!event.isTrusted || !(event.target instanceof Element)) return;
                lastTrustedClick = Date.now();
                if (event.target.closest('#downloadPassBtn')) saveRequestedUntil = Date.now() + 30000;
            }, true);
            window.open = function (url) {
                if (Date.now() - lastTrustedClick > 1200) return null;
                nativeOpen.postMessage(String(url));
                return null;
            };
            document.addEventListener('click', function (event) {
                if (!(event.target instanceof Element)) return;
                const link = event.target.closest('a[download]');
                if (Date.now() > saveRequestedUntil || !link
                    || !link.href.startsWith('data:image/png;base64,')) return;
                event.preventDefault();
                saveRequestedUntil = 0;
                nativeSave.postMessage(link.href.slice('data:image/png;base64,'.length));
            }, true);
            """,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))

        let configuration = WKWebViewConfiguration()
        configuration.userContentController = contentController
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 205.0 / 255.0, green: 232.0 / 255.0, blue: 175.0 / 255.0, alpha: 1)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = true
        webView.scrollView.alwaysBounceHorizontal = false

        if let invitationDirectory = Bundle.main.resourceURL?.appendingPathComponent("Invitation", isDirectory: true) {
            let entry = invitationDirectory.appendingPathComponent("index.html")
            webView.loadFileURL(entry, allowingReadAccessTo: invitationDirectory)
        }

        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        private let allowedHosts: Set<String> = ["maps.app.goo.gl", "api.whatsapp.com"]

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let value = message.body as? String else { return }
            if message.name == "openExternal", let url = URL(string: value) {
                openExternal(url)
            } else if message.name == "saveImage",
                      let data = Data(base64Encoded: value),
                      let image = UIImage(data: data) {
                presentShareSheet(with: image)
            }
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }
            if isLocalInvitationURL(url) {
                decisionHandler(.allow)
                return
            }

            if navigationAction.navigationType == .linkActivated {
                openExternal(url)
            }
            decisionHandler(.cancel)
        }

        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            guard navigationAction.navigationType == .linkActivated,
                  let url = navigationAction.request.url else { return nil }
            openExternal(url)
            return nil
        }

        private func isLocalInvitationURL(_ url: URL) -> Bool {
            guard url.isFileURL,
                  let root = Bundle.main.resourceURL?.appendingPathComponent("Invitation", isDirectory: true) else { return false }
            let rootPath = root.standardizedFileURL.path
            let directoryPrefix = rootPath.hasSuffix("/") ? rootPath : rootPath + "/"
            let candidatePath = url.standardizedFileURL.path
            return candidatePath == rootPath || candidatePath.hasPrefix(directoryPrefix)
        }

        private func openExternal(_ url: URL) {
            guard url.scheme?.lowercased() == "https",
                  let host = url.host?.lowercased(),
                  allowedHosts.contains(host) else { return }
            UIApplication.shared.open(url)
        }

        private func presentShareSheet(with image: UIImage) {
            guard let scene = UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .first(where: { $0.activationState == .foregroundActive }),
                  let rootViewController = scene.windows.first(where: \\.isKeyWindow)?.rootViewController else { return }

            let activityController = UIActivityViewController(
                activityItems: [image],
                applicationActivities: nil
            )
            if let popover = activityController.popoverPresentationController {
                popover.sourceView = rootViewController.view
                popover.sourceRect = CGRect(
                    x: rootViewController.view.bounds.midX,
                    y: rootViewController.view.bounds.midY,
                    width: 0,
                    height: 0
                )
            }
            rootViewController.present(activityController, animated: true)
        }
    }
}

private final class WeakScriptMessageHandler: NSObject, WKScriptMessageHandler {
    weak var delegate: WKScriptMessageHandler?

    init(delegate: WKScriptMessageHandler) {
        self.delegate = delegate
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        delegate?.userContentController(userContentController, didReceive: message)
    }
}
`;

const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>Invitación</string>
    <key>CFBundleName</key>
    <string>Invitación</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UILaunchScreen</key>
    <dict/>
    <key>UIApplicationSupportsIndirectInputEvents</key>
    <true/>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
    </array>
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
</dict>
</plist>
`;

const packageReadme = projectName => `INVITACION PARA IPHONE - CODIGO FUENTE
=======================================

Esta app contiene una sola invitacion personalizada y todos sus recursos
locales. No contiene tarjetas de otros invitados. No necesita Internet para
mostrar el diseno, las imagenes, las animaciones ni la musica.

REQUISITOS Y APERTURA
---------------------

- Se necesita un Mac con Xcode 15 o posterior para compilar la app.
- La app se configura para iOS/iPadOS 16 o posterior.
- Abre el archivo ${projectName}.xcodeproj en Xcode.
- Conecta el iPhone/iPad y selecciona el dispositivo como destino.
- En Signing & Capabilities, selecciona un equipo de desarrollo tuyo.
- Pulsa Run. Xcode firma e instala la app para pruebas en tu dispositivo.

Este ZIP contiene codigo fuente; no es una app ya compilada ni firmada. Para
instalarla en los iPhone de los invitados se requiere distribuir una app iOS
firmada mediante un metodo autorizado por Apple (por ejemplo TestFlight o
distribucion empresarial/ad hoc). Esos pasos requieren cuenta, firma y
dispositivos registrados segun corresponda. No se publica ni distribuye
ninguna app desde este paquete.

INTERACCIONES
-------------

- La invitacion se carga desde archivos incluidos en la app. La vista no tiene
  barra de direcciones ni carga paginas web al iniciar.
- Google Maps solo se solicita al tocar el boton de ubicacion.
- WhatsApp solo se solicita al confirmar asistencia. El invitado revisa y
  envia el mensaje desde WhatsApp.
- Se limita la apertura externa a los destinos existentes del proyecto.
- La musica comienza mediante la accion de abrir y puede estar sujeta a las
  restricciones de audio de iOS.

No se ha compilado ni probado esta app en un iPhone fisico en este entorno.
`;

function replaceOnce(text, search, replacement, description) {
    const firstIndex = text.indexOf(search);
    if (firstIndex === -1 || text.indexOf(search, firstIndex + search.length) !== -1) {
        throw new Error(`Se esperaba una sola coincidencia para ${description}.`);
    }
    return text.replace(search, replacement);
}

const invitationFiles = fs.readdirSync(invitationRoot)
    .filter(file => file.endsWith('.html'))
    .sort((a, b) => a.localeCompare(b, 'en'));

if (invitationFiles.length !== 42) {
    throw new Error(`Se esperaban 42 invitaciones; se encontraron ${invitationFiles.length}.`);
}

fs.mkdirSync(outputRoot, { recursive: true });
const stagingRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'invitacion-ios-'));

try {
    for (const [index, filename] of invitationFiles.entries()) {
        const packageRoot = path.join(stagingRoot, 'paquete');
        const appName = path.basename(filename, '.html');
        const projectName = `Invitacion${appName.replace(/(^|_)([a-z])/g, (_, __, letter) => letter.toUpperCase()).replace(/[^A-Za-z0-9]/g, '')}`;
        const bundleSuffix = appName.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
        const bundleIdentifier = `com.vaiolet.invitacion.${bundleSuffix}`;
        fs.mkdirSync(packageRoot);
        const appRoot = path.join(packageRoot, projectName);
        const invitationResourceRoot = path.join(appRoot, 'Invitation');
        fs.mkdirSync(invitationResourceRoot, { recursive: true });

        let html = fs.readFileSync(path.join(invitationRoot, filename), 'utf8');
        html = replaceOnce(html, `href="${filename}.webmanifest"`, 'href="manifest.json"', 'el manifiesto HTML');
        html = replaceOnce(html, 'href="../styles.css"', 'href="styles.css"', 'la hoja CSS');
        html = html.replaceAll('../assets/', 'assets/');
        html = replaceOnce(
            html,
            'if (!isStandalone && !isDesktopApp) {',
            'if (!isStandalone && !isDesktopApp && !window.IS_NATIVE_INVITATION_APP) {',
            'el banner de instalacion web'
        );
        html = replaceOnce(
            html,
            "navigator.serviceWorker.register('../sw.js', { scope: '../' })",
            "navigator.serviceWorker.register('./sw.js', { scope: './' })",
            'el registro del service worker'
        );
        fs.writeFileSync(path.join(invitationResourceRoot, 'index.html'), html);

        const manifest = JSON.parse(fs.readFileSync(path.join(invitationRoot, `${filename}.webmanifest`), 'utf8'));
        manifest.id = './index.html';
        manifest.start_url = './index.html';
        manifest.scope = './';
        manifest.icons = manifest.icons.map(icon => ({
            ...icon,
            src: icon.src.replace('../assets/', 'assets/')
        }));
        fs.writeFileSync(
            path.join(invitationResourceRoot, 'manifest.json'),
            `${JSON.stringify(manifest, null, 2)}\n`
        );

        for (const resource of sharedFiles) {
            const source = path.join(mobileRoot, resource);
            if (!fs.existsSync(source)) throw new Error(`Falta el recurso compartido ${resource}.`);
            fs.cpSync(source, path.join(invitationResourceRoot, resource), { recursive: true });
        }

        fs.writeFileSync(path.join(appRoot, 'InvitationApp.swift'), swiftSource);
        fs.writeFileSync(
            path.join(appRoot, 'Info.plist'),
            infoPlist
                .replace('$(EXECUTABLE_NAME)', projectName)
                .replace('$(PRODUCT_BUNDLE_IDENTIFIER)', bundleIdentifier)
        );
        fs.mkdirSync(path.join(packageRoot, `${projectName}.xcodeproj`), { recursive: true });
        fs.writeFileSync(
            path.join(packageRoot, `${projectName}.xcodeproj`, 'project.pbxproj'),
            projectTemplate({ projectName, bundleIdentifier })
        );
        fs.writeFileSync(path.join(packageRoot, 'README.txt'), packageReadme(projectName));

        const archivePath = path.join(outputRoot, `${appName}.ios.zip`);
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
        if (!entries.includes(path.join(projectName, 'Invitation', 'index.html'))
            || !entries.includes(path.join(`${projectName}.xcodeproj`, 'project.pbxproj'))) {
            throw new Error(`El paquete ${filename} esta incompleto.`);
        }
        fs.rmSync(packageRoot, { recursive: true, force: true });
        console.log(`Paquete iOS ${index + 1}/42 listo: ${path.basename(archivePath)}`);
    }
} finally {
    fs.rmSync(stagingRoot, { recursive: true, force: true });
}

fs.writeFileSync(path.join(outputRoot, 'README.txt'), `APPS IOS INDIVIDUALES PARA INVITADOS
=====================================

Esta carpeta contiene 42 ZIP independientes. Cada paquete incluye un proyecto
Xcode y una sola invitacion privada con sus recursos locales.

PRIVACIDAD
----------

Envia a cada persona solamente su ZIP individual. No compartas esta carpeta
completa ni crees un ZIP de la carpeta entera: contiene todos los paquetes.

COMPILACION E INSTALACION
-------------------------

Los ZIP incluyen codigo fuente, no aplicaciones instalables ya firmadas. Se
necesita un Mac con Xcode para abrir el proyecto, elegir un equipo de firma y
compilar/instalar. Para distribuir a otros iPhone se requiere una modalidad
de firma y distribucion admitida por Apple. No se ha publicado nada.

La interfaz es local y funciona sin conexion para mostrar la tarjeta. Maps y
WhatsApp solo se abren cuando se pulsa el boton correspondiente.

No se compilo ni probo en un dispositivo Apple fisico en este entorno.
`);

console.log(`Paquetes Xcode privados creados: ${invitationFiles.length}`);
console.log(`Salida: ${path.relative(projectRoot, outputRoot)}`);
