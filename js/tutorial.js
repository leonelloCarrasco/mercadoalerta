/**
 * Tour guiado de bienvenida — se dispara solo la primera vez que el usuario
 * entra al dashboard (ver verificarTutorialOnboarding, enganchado desde
 * cargarUsuario() en dashboard.js) y también se puede volver a ver a mano
 * desde Ayuda (#verTourDeNuevoBtn).
 *
 * Motor: Driver.js v1 (CDN, cargado antes que este script en dashboard.html).
 * Reglas acordadas para este tour:
 *  - 7 pasos, uno por sección del sidebar: Inicio, Alertas, Notificaciones,
 *    Búsquedas, Oportunidades, Análisis de Precios, Análisis de Procesos.
 *  - Cada paso ENTRA a la sección real (mostrarSeccion, ya existe en
 *    dashboard.js) y muestra un overlay de ejemplo NO interactivo sobre el
 *    contenedor real — no se insertan datos falsos en las listas/tablas
 *    reales, así no hay nada que "limpiar" del lado de los datos.
 *  - El paso de Alertas resalta puntualmente el botón "+ Crear Alerta"
 *    (abrirNuevaAlertaBtn) en vez de la sección genérica.
 *  - Cualquier cierre del tour (terminarlo, la X, click afuera, Esc) cuenta
 *    como "visto" — no se vuelve a mostrar solo. Eso se maneja en un único
 *    lugar: el callback onDestroyed a nivel de instancia.
 */

const TUTORIAL_SECCIONES_MOBILE_EN_MAS = ['oportunidades', 'analisis', 'ia'];

/** Sección → contenedor real donde va el overlay mockeado. */
const TUTORIAL_CONTENEDOR_MOCK = {
  inicio: 'inicioStats',
  alertas: 'configsCard',
  notificaciones: 'historyCard',
  busquedas: 'busquedasCard',
  oportunidades: 'oportunidadesCard',
  analisis: 'analisisCard',
  ia: 'analisisMisAnalisisCard',
};

function tutorialFilaMock(titulo, subtitulo, monto) {
  return `
    <div style="display:flex; justify-content:space-between; gap:12px; padding:10px 0; border-bottom:1px solid var(--border); font-size:13px;">
      <div>
        <div style="font-weight:500;">${titulo}</div>
        <div style="color:var(--text-muted); font-size:12px; margin-top:2px;">${subtitulo}</div>
      </div>
      ${monto ? `<div style="color:var(--gold); font-family:var(--font-mono); white-space:nowrap;">${monto}</div>` : ''}
    </div>`;
}

/** Contenido de ejemplo por sección — todo con datos inventados, jamás tocan datos reales del usuario. */
function tutorialHtmlMock(nombreSeccion) {
  const filas = {
    inicio: [
      tutorialFilaMock('3 licitaciones nuevas hoy', 'Coinciden con tus alertas activas'),
      tutorialFilaMock('1 recordatorio de cierre próximo', 'Compra ágil — cierra en 18 horas'),
    ],
    notificaciones: [
      tutorialFilaMock('Suministro de notebooks', 'Nueva Licitación · Municipalidad de Ñuñoa', '$18.500.000'),
      tutorialFilaMock('Insumos de aseo institucional', 'Cambio de estado → Adjudicada'),
    ],
    busquedas: [
      tutorialFilaMock('Servicios de mantención eléctrica', 'Búsqueda guardada · 4 resultados'),
    ],
    oportunidades: [
      tutorialFilaMock('Compra de equipos de laboratorio', 'En pipeline · Preparando oferta', '$4.200.000'),
    ],
    analisis: [
      tutorialFilaMock('Notebook 15" i5 16GB', 'Precio promedio adjudicado', '$620.000'),
    ],
    ia: [
      tutorialFilaMock('1234-5-LE24', 'Análisis listo · 6 documentos exigidos'),
    ],
  };

  const lista = (filas[nombreSeccion] || []).join('');
  return `
    <div class="tutorial-mock-overlay" style="position:relative; margin-top:14px; border:1px dashed var(--gold); border-radius:8px; padding:14px; background:var(--surface-2);">
      <div style="font-size:11px; color:var(--gold); text-transform:uppercase; letter-spacing:0.06em; font-family:var(--font-mono); margin-bottom:6px;">Así se va a ver cuando tengas datos</div>
      ${lista}
    </div>`;
}

function tutorialMostrarOverlayMock(nombreSeccion) {
  const idContenedor = TUTORIAL_CONTENEDOR_MOCK[nombreSeccion];
  if (!idContenedor) return;
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;
  // Si ya hay uno puesto (ej. volvió a este paso con "Atrás"), no duplicar.
  if (contenedor.querySelector('.tutorial-mock-overlay')) return;
  contenedor.insertAdjacentHTML('beforeend', tutorialHtmlMock(nombreSeccion));
}

/** Se llama al dejar CUALQUIER paso (onDeselected) y también al destruir el tour, por las dudas. */
function tutorialLimpiarOverlaysMock() {
  document.querySelectorAll('.tutorial-mock-overlay').forEach((el) => el.remove());
}

/** En mobile, Oportunidades/Análisis de Precios/Análisis de Procesos viven bajo el botón "Más" del bottombar — hay que abrirlo antes de resaltar, si no el contenido está oculto y Driver.js no encuentra dónde anclar el popover. */
function tutorialAbrirMasMenuSiCorresponde(nombreSeccion) {
  const bottombarMasBtn = document.getElementById('bottombarMasBtn');
  const bottombarMasMenu = document.getElementById('bottombarMasMenu');
  if (!bottombarMasBtn || !bottombarMasMenu) return; // no existe en desktop
  const estaVisibleMobile = bottombarMasBtn.offsetParent !== null;
  if (estaVisibleMobile && TUTORIAL_SECCIONES_MOBILE_EN_MAS.includes(nombreSeccion)) {
    bottombarMasMenu.classList.add('open');
  } else {
    bottombarMasMenu.classList.remove('open');
  }
}

async function tutorialMarcarCompletadoEnBackend() {
  try {
    await apiFetch('/api/auth/me/tutorial-completado', { method: 'POST' });
    if (window.usuarioActual) window.usuarioActual.tutorial_completado_at = new Date().toISOString();
  } catch (err) {
    // No bloquear la experiencia del usuario por esto — en el peor caso el
    // tour se vuelve a ofrecer en el próximo login, no es grave.
    console.error('[tutorial] No se pudo marcar el tour como completado:', err.message);
  }
}

function tutorialPasoBase(nombreSeccion, elementoIdOverride, popover) {
  return {
    element: `#${elementoIdOverride || TUTORIAL_CONTENEDOR_MOCK[nombreSeccion]}`,
    popover: { ...popover, showButtons: ['next', 'previous', 'close'] },
    onHighlightStarted: () => {
      mostrarSeccion(nombreSeccion);
      tutorialAbrirMasMenuSiCorresponde(nombreSeccion);
    },
    onHighlighted: () => {
      // El overlay se agrega después de mostrarSeccion (que puede reordenar/mostrar
      // el contenedor recién ahora) y después de que Driver.js ya calculó la
      // posición inicial, para no pisarle la medición del recuadro.
      tutorialMostrarOverlayMock(nombreSeccion);
    },
    onDeselected: () => tutorialLimpiarOverlaysMock(),
  };
}

async function tutorialConstruirPasos() {
  const tieneAnalisisPrecios = await tieneAcceso('accesoAnalisisPrecios');
  const notaUpgradeAnalisis = tieneAnalisisPrecios
    ? ''
    : '<br><br><span style="color:var(--gold);">Esto se desbloquea en el plan Full.</span>';

  return [
    tutorialPasoBase('inicio', 'inicioStats', {
      title: 'Tu panel de Inicio',
      description: 'Acá ves de un vistazo cuántas alertas tienes activas, cuántas notificaciones te han llegado, y un resumen de lo último que pasó.',
      side: 'bottom',
    }),
    {
      element: '#abrirNuevaAlertaBtn',
      popover: {
        title: 'Crea tu primera alerta',
        description: 'Todo empieza acá: eliges un rubro o producto y MercadoAlerta revisa Mercado Público por ti, día y noche, avisándote apenas se publique algo que calce con tus preferencias.',
        side: 'bottom',
        showButtons: ['next', 'previous', 'close'],
      },
      onHighlightStarted: () => mostrarSeccion('alertas'),
      onDeselected: () => tutorialLimpiarOverlaysMock(),
    },
    tutorialPasoBase('notificaciones', 'historyCard', {
      title: 'Notificaciones',
      description: 'Cada vez que una Licitación o Compra Ágil nueva calza con tus alertas — o cambia de estado — queda registrada acá, además de llegarte por correo (y Telegram o WhatsApp si los configuras).',
      side: 'bottom',
    }),
    tutorialPasoBase('busquedas', 'busquedasCard', {
      title: 'Búsquedas',
      description: 'A diferencia de una alerta, una búsqueda es puntual: consulta en el momento contra Mercado Público y te muestra los resultados ahí mismo, sin quedar monitoreando hacia adelante.',
      side: 'bottom',
    }),
    tutorialPasoBase('oportunidades', 'oportunidadesCard', {
      title: 'Oportunidades',
      description: 'Acá viven tus Recordatorios de cierre, el Seguimiento de estado, y tu Portafolio, para ir moviendo cada oportunidad por las etapas de tu propio proceso de venta.',
      side: 'bottom',
    }),
    tutorialPasoBase('analisis', 'analisisCard', {
      title: 'Análisis de Precios',
      description: `Busca un producto o rubro y revisa el historial de precios en los que se ha adjudicado antes — útil para calibrar tu oferta económica.${notaUpgradeAnalisis}`,
      side: 'bottom',
    }),
    tutorialPasoBase('ia', 'analisisMisAnalisisCard', {
      title: 'Análisis de Procesos con IA',
      description: 'Ingresa el código de una Licitación o Compra Ágil, y sube las bases (o indica que no las tienes) — la IA te devuelve un resumen simple y un checklist de lo que exige, como apoyo para decidir más rápido.',
      side: 'bottom',
    }),
  ];
}

let tutorialDriverInstance = null;

async function iniciarTourOnboarding() {
  const driverFactory = window.driver && window.driver.js && window.driver.js.driver;
  if (!driverFactory) {
    console.error('[tutorial] Driver.js no cargó — se omite el tour.');
    return;
  }

  const steps = await tutorialConstruirPasos();

  tutorialDriverInstance = driverFactory({
    steps,
    showProgress: true,
    progressText: 'Paso {{current}} de {{total}}',
    nextBtnText: 'Siguiente',
    prevBtnText: 'Atrás',
    doneBtnText: 'Listo',
    overlayOpacity: 0.6,
    smoothScroll: true,
    onDestroyed: () => {
      tutorialLimpiarOverlaysMock();
      tutorialMarcarCompletadoEnBackend();
    },
  });

  tutorialDriverInstance.drive();
}

/** Se llama desde cargarUsuario() en dashboard.js, una vez por carga del dashboard. */
function verificarTutorialOnboarding(usuario) {
  if (usuario.tutorial_completado_at) return;
  document.getElementById('tutorialBienvenidaModal').classList.add('open');
}

document.getElementById('tutorialBienvenidaEmpezarBtn').addEventListener('click', () => {
  document.getElementById('tutorialBienvenidaModal').classList.remove('open');
  iniciarTourOnboarding();
});

document.getElementById('tutorialBienvenidaSaltarBtn').addEventListener('click', () => {
  document.getElementById('tutorialBienvenidaModal').classList.remove('open');
  tutorialMarcarCompletadoEnBackend();
});

// Desde Ayuda: se relanza directo, sin pasar por el modal de bienvenida ni
// por tutorialMarcarCompletadoEnBackend acá — igual se vuelve a llamar solo
// al cerrar ESTE tour (onDestroyed), pero como ya estaba completado antes no
// cambia nada de comportamiento, solo actualiza la fecha.
document.getElementById('verTourDeNuevoBtn').addEventListener('click', () => {
  iniciarTourOnboarding();
});

window.verificarTutorialOnboarding = verificarTutorialOnboarding;
