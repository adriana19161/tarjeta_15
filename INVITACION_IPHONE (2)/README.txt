INVITACION IPHONE - PAQUETE LOCAL
================================

Esta carpeta contiene una copia independiente de la invitacion interactiva,
preparada a partir del proyecto existente. Incluye 42 invitaciones
personalizadas, sus archivos CSS y JavaScript, imagenes, fuentes, musica,
iconos y recursos PWA. El proyecto original permanece en su ubicacion.

IMPORTANTE: NO COMPARTIR UNICAMENTE EL ARCHIVO HTML
--------------------------------------------------

Cada tarjeta carga estilos, scripts e imagenes desde carpetas vecinas. Si se
envia solamente el archivo .html por WhatsApp, iOS puede mostrar exactamente
una pagina sin formato y con imagenes faltantes, porque esos recursos no se
incluyeron. Para conservar la estructura, comparte el archivo
INVITACION_IPHONE.zip, extraelo en Archivos y abre la tarjeta desde la carpeta
extraida.

La vista previa de Archivos/WhatsApp de iOS puede seguir restringiendo la
ejecucion de JavaScript, audio o recursos locales. Extraer el paquete corrige
la falta de archivos, pero no elimina esas limitaciones del visor.

COMO IDENTIFICAR UNA TARJETA
----------------------------

Las invitaciones personalizadas estan en:
  invitaciones_autonomas/

Cada archivo HTML de esa carpeta corresponde a un destinatario. Al distribuir
la version en un servidor HTTPS, se debe compartir la URL del archivo HTML
correspondiente, no una ruta de archivo local del computador.

APERTURA EN IPHONE Y IPAD
-------------------------

Safari para iOS restringe los archivos HTML locales abiertos desde Archivos o
WhatsApp. En particular, service workers, instalacion PWA y acceso coordinado
a los recursos locales no funcionan de forma fiable mediante file://. Por eso
este paquete no puede garantizar una apertura interactiva identica en todos
los iPhone si se envia como adjunto HTML.

Para compartir la invitacion interactiva de forma fiable entre dispositivos,
los archivos deben servirse desde una direccion HTTPS. Esto no se ha hecho en
este trabajo: no se publico ni subio ningun archivo. Cuando una persona
responsable decida servirlo por HTTPS, puede alojar esta carpeta completa en
un dominio o servidor HTTPS y compartir la URL de la tarjeta deseada. La
instalacion en la pantalla de inicio se realiza desde Safari y depende de que
el sitio este disponible por HTTPS.

Si no se desea usar Internet, se puede intentar abrir el HTML local con una
aplicacion de iOS que permita mostrar sitios locales completos; el resultado
depende de esa aplicacion y no habilita necesariamente una PWA instalable ni
el almacenamiento offline de Safari. Una app nativa requeriria desarrollo,
firma y distribucion por separado, y no forma parte de este paquete.

CONTROLES Y FUNCIONES
---------------------

- Toca "Abrir Invitacion" para abrir el sobre. La musica se solicita durante
  ese gesto y puede pausarse o reanudarse con el boton de musica. iOS puede
  aplicar sus propias restricciones de audio.
- El confeti se activa al abrir la tarjeta.
- El boton de ubicacion conserva el enlace de Google Maps existente.
- La confirmacion conserva el numero de WhatsApp existente y el mensaje se
  prepara al confirmar; el invitado debe revisar y enviar el mensaje desde
  WhatsApp.
- Solo los botones de enlaces externos abren destinos fuera de la tarjeta.

FUNCIONAMIENTO OFFLINE
----------------------

Imagenes, estilos, fuentes, JavaScript y musica estan incluidos localmente;
la presentacion no solicita recursos externos. Los enlaces de Maps y
WhatsApp necesitan conectividad cuando se pulsan. El modo PWA offline de
Safari solo puede prepararse despues de visitar la version servida por HTTPS
y permitir que el service worker almacene los recursos.

PRUEBAS Y LIMITACIONES
----------------------

- Se regenero el paquete movil y el generador verifico las 42 tarjetas y sus
  42 manifiestos PWA.
- Las tres pruebas automatizadas existentes pasaron (npm test).
- Se verificaron la validez del JSON, la sintaxis de JavaScript/Python y los
  cambios de formato del repositorio.
- En navegador de escritorio se abrio una tarjeta del paquete, se comprobo
  apertura/cierre, confeti, recursos, enlace de Maps y ausencia de desborde
  horizontal a 390 px y 360 px.
- En una prueba temporal por HTTP local se confirmo la reproduccion de la
  musica al abrir. En la prueba file:// del navegador de escritorio la
  solicitud de audio fue abortada por el entorno de prueba; por ello no se
  afirma que la musica funcione en todos los visores locales.
- Estas pruebas no equivalen a una prueba en un iPhone fisico.
- No se probo un iPhone/iPad fisico ni se publico el paquete en Internet.

RESPALDO
--------

Antes de esta adaptacion se creo un respaldo completo del proyecto original:
  /home/jhonespinosa/INVITACION_IPHONE_BACKUP_20261013.tar.gz

El respaldo no esta dentro de esta carpeta de entrega.
