# Invitación digital de Vaiolet

La página original, sus 42 invitaciones personalizadas y sus generadores se conservan. El proyecto incluye ahora una PWA, una app de escritorio Electron para Linux y una exportación HTML autocontenida.

## Invitaciones personalizadas

La colección oficial está en [`invitaciones_autonomas/`](./invitaciones_autonomas/). Para volver a generarla se usa `python3 generar_autonomas.py`; los generadores de compatibilidad escriben en la misma carpeta.

## Escritorio Linux

Los paquetes AppImage y `.deb` están en `dist/desktop/` después de empaquetar el proyecto. AppImage se abre con doble clic si el sistema permite ejecutar archivos descargados; alternativamente, se puede instalar el `.deb` en Ubuntu con el instalador gráfico. La app abre la invitación principal del proyecto e incluye Electron, fuentes, iconos, audio, scripts e imágenes locales. Solo Google Maps y WhatsApp necesitan Internet.

Para generar ambos paquetes en Linux, instalar Node.js LTS y ejecutar `npm ci` y `npm run dist:linux`. En algunas distribuciones AppImage requiere FUSE 2; el paquete `.deb` es la alternativa de Ubuntu. El instalador crea el acceso de escritorio correspondiente.

Las órdenes `npm run dist:windows` y `npm run dist:macos` configuran instaladores NSIS y DMG, respectivamente. Cada paquete debe compilarse en el sistema operativo destino; un AppImage no es un ejecutable de Windows o macOS.

## Android y iPhone/iPad

Para mostrar las tarjetas con animaciones, JavaScript y sonido en iPhone es necesario abrirlas en Safari desde una dirección HTTPS. La previsualización de WhatsApp/Archivos y los HTML abiertos como archivos locales no ejecutan de forma fiable estas funciones en iOS. No envíes el `.html` como adjunto para abrirlo en iPhone.

Ejecutar `npm run prepare:mobile` prepara todas las tarjetas en `dist/mobile-web/`, con icono iOS de 180x180, manifiestos, fuentes, música y service worker. Este comando solo prepara los archivos localmente; **no publica ni sube nada**. Para usarlas en iPhone, alguien debe alojar esa carpeta en un servidor HTTPS y compartir el enlace de la tarjeta. En Safari se toca **Compartir → Añadir a pantalla de inicio**. Si no se publica ni instala una app iOS firmada, no es posible mostrar una PWA interactiva desde un archivo local en iPhone.

Android: abrir la tarjeta en Chrome; se puede añadir a la pantalla de inicio desde el menú. La caché sin conexión funciona después de la primera visita con HTTPS. Maps y WhatsApp requieren Internet.

## Invitación como archivo local

Ejecutar `npm run export:html` genera los archivos dentro de `dist/entrega_local/`:

- `Invitacion.html`: invitación autocontenida, sin imágenes, fuentes, scripts ni audio externos.
- `Invitacion_Completa.zip`: copia de seguridad que incluye el HTML y `README.txt`.
- `README.txt`: instrucciones para computador, Android e iOS.

La exportación predeterminada conserva la tarjeta de Jorge Quina; se puede elegir otra con `npm run export:html -- --guest=nombre-del-archivo.html`, donde el nombre corresponde a un HTML de `invitaciones_autonomas/`.

Para computador, abrir el HTML con doble clic en un navegador actualizado. Android puede abrir el HTML guardado desde Archivos con Chrome, aunque algunos visores o previsualizadores bloquean JavaScript local. iPhone/iPad puede impedir ejecutar HTML local como página interactiva; ese caso depende de iOS y de la aplicación usada, y no se soluciona con un ZIP ni implica publicar el archivo en Internet.

El contenido visual, el QR, las animaciones y la música no necesitan conexión. Solo los botones pulsados expresamente para Google Maps y WhatsApp salen a Internet. El HTML elimina las funciones PWA y de instalación, que los navegadores no ofrecen a archivos `file://`.

## Plataformas de escritorio

Electron está configurado para AppImage y `.deb` en Linux, NSIS en Windows y DMG en macOS. Este entorno genera los paquetes Linux; los de Windows y macOS requieren compilarse en sus respectivos sistemas operativos.
