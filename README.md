# MercadoAlerta

Frontend estático de MercadoAlerta, una aplicación para monitorear procesos
de Mercado Público y recibir notificaciones sobre oportunidades relevantes.
El usuario puede configurar alertas por tipo de proceso, monto, región,
categoría, organismo y palabras clave.

Este repositorio contiene únicamente el frontend. La autenticación, los datos
de usuarios, las alertas, las búsquedas, las notificaciones, los pagos y los
análisis se resuelven mediante la API de MercadoAlerta.

## Funcionalidades

- Landing pública con información del servicio, planes, preguntas frecuentes
  y llamados a registro.
- Registro de usuarios y empresas, confirmación de cuenta y recuperación de
  contraseña.
- Dashboard autenticado con:
  - alertas configurables;
  - búsquedas guardadas y ejecución de búsquedas;
  - notificaciones e historial;
  - recordatorios, seguimiento y portafolio de oportunidades;
  - análisis de procesos con IA;
  - análisis de precios, proveedores, organismos y razones de rechazo;
  - configuración de cuenta, suscripción y canales de notificación;
  - tutorial guiado y sección de ayuda.
- Panel administrativo en [`admin.html`](admin.html).
- Páginas de pago, confirmación, vencimiento de prueba, términos y
  privacidad.
- Tema claro/oscuro y diseño responsive para escritorio y dispositivos
  móviles.

## Requisitos

El proyecto no requiere un proceso de compilación ni dependencias de Node.js.
Para trabajar localmente solo se necesita:

- un navegador moderno;
- un servidor HTTP estático;
- acceso a la API configurada para el entorno.

No se recomienda abrir las páginas directamente con `file://`, porque el
navegador puede bloquear solicitudes `fetch` y algunos recursos por las
políticas de origen.

## Ejecución local

Desde la raíz del repositorio, inicia cualquier servidor HTTP estático. Por
ejemplo, con Python:

```bash
python -m http.server 8000
```

Luego abre:

```text
http://localhost:8000/
```

El frontend detecta automáticamente el hostname para elegir la API:

- `localhost` o `127.0.0.1`: `http://localhost:3000`;
- cualquier otro hostname: `https://api.mercadoalerta.cl`.

Por lo tanto, durante el desarrollo local la API debe estar disponible en el
puerto `3000`, o se debe ajustar `API_BASE` en los scripts que realizan
solicitudes HTTP.

## Estructura del repositorio

### Páginas HTML

- [`index.html`](index.html): landing pública principal.
- [`dashboard.html`](dashboard.html): panel principal para usuarios
  autenticados.
- [`login.html`](login.html): inicio de sesión.
- [`register.html`](register.html): registro.
- [`confirmar-cuenta.html`](confirmar-cuenta.html): confirmación de cuenta.
- [`forgot-password.html`](forgot-password.html): solicitud de recuperación.
- [`reset-password.html`](reset-password.html): cambio de contraseña.
- [`pago-confirmado.html`](pago-confirmado.html): confirmación del pago.
- [`simular-pago.html`](simular-pago.html): flujo de pago simulado para
  pruebas.
- [`trial-vencido.html`](trial-vencido.html): estado de prueba vencida.
- [`admin.html`](admin.html): panel administrativo.
- [`terminos.html`](terminos.html): términos del servicio.
- [`politica-privacidad.html`](politica-privacidad.html): política de
  privacidad.

### JavaScript

Los scripts específicos de cada página se encuentran en [`js/`](js/):

- [`dashboard.js`](js/dashboard.js): navegación, formularios, alertas,
  búsquedas, notificaciones, análisis y configuración del dashboard.
- [`login.js`](js/login.js), [`register.js`](js/register.js),
  [`confirmar-cuenta.js`](js/confirmar-cuenta.js),
  [`forgot-password.js`](js/forgot-password.js) y
  [`reset-password.js`](js/reset-password.js): autenticación y recuperación
  de cuenta.
- [`admin.js`](js/admin.js): funcionalidades del panel administrativo.
- Los scripts auxiliares de la carpeta: tutorial, cierre por inactividad,
  copyright, limpieza de URLs y los flujos de pago implementados dentro de
  sus páginas HTML.

### Estilos y recursos

- [`css/`](css/): hojas de estilo para landing, login, dashboard y panel
  administrativo.
- [`assets/`](assets/): logotipo, íconos e imágenes.
- [`CNAME`](CNAME): dominio utilizado por la publicación estática.
- [`robots.txt`](robots.txt) y [`sitemap.xml`](sitemap.xml): configuración
  para rastreadores y sitemap público.

## Autenticación y almacenamiento local

Las páginas protegidas verifican la existencia del token de autenticación antes
de cargar el contenido. El frontend utiliza `localStorage` para conservar el
token entre páginas y pestañas, y redirige a [`login.html`](login.html) cuando
el token no existe.

El tema visual también se guarda localmente. No se deben incorporar secretos,
tokens de API ni credenciales al repositorio: la comunicación con el backend
debe realizarse mediante la API y sus mecanismos de autenticación.

## Configuración de la API

La URL base se define en los scripts que consumen el backend. En
[`js/dashboard.js`](js/dashboard.js) se establece:

```javascript
const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:3000'
  : 'https://api.mercadoalerta.cl';
```

Si se agrega una nueva página que consuma la API, debe mantener la misma
separación entre el entorno local y producción y enviar el token mediante los
encabezados de autenticación establecidos por el frontend.

## Compra Ágil

La visibilidad de Compra Ágil en el dashboard se controla con
`COMPRA_AGIL_HABILITADA`, definida en
[`js/dashboard.js`](js/dashboard.js).

Con el valor actual `false`, el frontend:

- oculta las opciones de Compra Ágil en alertas, búsquedas y análisis;
- oculta los filtros de tipo de proceso que incluirían Compra Ágil;
- oculta las referencias textuales visibles para el usuario;
- mantiene el comportamiento también en contenido generado dinámicamente,
  como resultados, historial y tutorial;
- fuerza la creación y edición de alertas al tipo Licitación.

Para volver a mostrar y habilitar Compra Ágil en el frontend, cambia la
constante a `true`. Esta bandera solo controla la interfaz. La disponibilidad
real de los datos depende también de la configuración correspondiente en el
backend.

## Desarrollo y validación

El proyecto es JavaScript sin compilación. Antes de publicar cambios en un
script, se puede comprobar su sintaxis con:

```bash
node --check js/dashboard.js
```

Para validar manualmente una modificación:

1. inicia el servidor HTTP local;
2. abre la página afectada en el navegador;
3. revisa la consola del navegador;
4. prueba el flujo autenticado contra la API local;
5. verifica el comportamiento en escritorio y móvil.

## Publicación

El sitio se publica como archivos estáticos. El dominio configurado en
[`CNAME`](CNAME) es `mercadoalerta.cl`.

Antes de publicar:

1. confirma que las URLs de la API apunten al entorno correcto;
2. comprueba que no haya credenciales o tokens en los archivos;
3. valida la sintaxis de los scripts modificados;
4. prueba login, navegación del dashboard y los flujos afectados;
5. revisa que los recursos usen rutas compatibles con el dominio publicado.

La API debe desplegarse y configurarse por separado del frontend.
