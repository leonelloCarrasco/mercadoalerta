// Detecta automáticamente si estamos en desarrollo local o en producción
const DASHBOARD_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:5500'
  : 'https://mercadoalerta.cl';

// Mismo patrón que dashboard.js — el backend vive en un subdominio propio en producción.
const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:3000'
  : 'https://api.mercadoalerta.cl';

document.querySelectorAll('.dashboard-link').forEach(a => {
  a.href = DASHBOARD_BASE + a.dataset.path;
});

// Decisiones de diseño/marketing (qué plan destacar, qué botones arrancan
// deshabilitados) — esto no es "información del plan" en el sentido de
// cuotas/precios, así que se queda acá. Los NÚMEROS del plan (cuántas
// alertas, cuánto cuesta, etc.) SÍ vienen del backend vía /api/planes, para
// no tener que volver a tocar este archivo cada vez que cambie un precio.
//
// Estrategia de un solo plan pago (ver conversación de agosto 2026): ya no
// se itera sobre todas las claves que devuelve /api/planes (antes eran
// trial/basico/full, una tarjeta cada una) — /api/planes ya excluye
// 'basico' del todo (ver planes.routes.js), así que acá directamente se
// arma UNA sola tarjeta con los datos de 'full' (precio y funciones) más
// 'trial'.diasTrial (para el mensaje de "empezá gratis"). El registro
// siempre arranca en Trial — no hay más botón de "pagar directo".

function formatCLP(numero) {
  return '$' + numero.toLocaleString('es-CL');
}

function armarFeaturesPlan(plan) {
  const items = [
    `Hasta <strong>${plan.limiteAlertas} alertas</strong> activas`,
    `Hasta <strong>${plan.limiteBusquedas} búsquedas</strong> preconfiguradas`,
    `Hasta <strong>${plan.limiteRecordatorios} recordatorios</strong> de cierre`,
    `Hasta <strong>${plan.limiteSeguimientos} seguimientos</strong> de procesos`,
    `Alertas por <strong>${plan.mensajeria}</strong>`,
  ];
  // El cupo es 10x limiteAlertas (ver spec: tope WhatsApp) — se calcula acá
  // en vez de venir del backend porque es una regla derivada, no un campo
  // propio de PLANES; si el múltiplo cambia después de calibrar con datos
  // reales, este archivo también hay que actualizarlo.
  if (plan.mensajeria?.includes('WhatsApp')) {
    items.push(`Hasta <strong>${plan.limiteAlertas * 10} notificaciones por WhatsApp</strong> al mes`);
  }
  // Análisis de Precios queda afuera del listado a propósito — el menú está
  // deshabilitado por ahora (no se promociona todavía), aunque
  // plan.accesoAnalisisPrecios/detalleAnalisisPrecios sigan existiendo en
  // planes.js para cuando se vuelva a activar.
  if (plan.limitePortafolio) items.push(`Portafolio (hasta <strong>${plan.limitePortafolio} ítems</strong>, para probar)`);
  else if (plan.portafolio) items.push('Portafolio <strong>Ilimitado</strong>');
  items.push(`<strong>${plan.limiteAnalisisIA} análisis</strong> de procesos con IA al mes`);
  if (plan.accesoPalabrasClave) items.push(`<strong>Palabras clave con IA</strong> — hasta ${plan.limitePalabrasClave} por alerta`);
  return items.map((texto) => `<li>${texto}</li>`).join('');
}

function armarTarjetaPlanUnico(planFull, diasTrial) {
  const precioHtml = `<div class="price-now"><span class="price-amount">${formatCLP(planFull.monto)}</span><span class="price-period"> CLP / mes</span></div>
       <div class="price-later">${planFull.montoRegular && planFull.montoRegular !== planFull.monto ? `Precio normal ${formatCLP(planFull.montoRegular)} CLP/mes · IVA incluido` : 'IVA incluido'}</div>`;

  const stampHtml = planFull.montoRegular && planFull.montoRegular !== planFull.monto
    ? '<div class="price-stamp">OFERTA DE LANZAMIENTO</div>'
    : '';

  return `
    <div class="price-card destacado">
      ${stampHtml}
      <div class="price-plan-name">Plan ${planFull.nombreDisplay}</div>
      <div class="price-plan-desc">${planFull.descripcion}</div>
      ${precioHtml}
      <div class="price-trial-note">Incluye ${diasTrial} días de prueba gratis.</div>
      <a href="https://mercadoalerta.cl/register.html?plan=trial" class="btn btn-primary dashboard-link cta-registro-trial" data-path="/register.html?plan=trial">⚡ Comenzar ${diasTrial} Días Gratis →</a>
      <div class="price-trial-caption">${diasTrial} días gratis · Cancela cuando quieras</div>
      <ul class="price-features">${armarFeaturesPlan(planFull)}</ul>
    </div>
  `;
}

// Se llena en cargarPlanes() y la reusa el modal de comparación Trial vs
// Full (ver más abajo) — evita un segundo fetch a /api/planes.
let planesCargados = null;

async function cargarPlanes() {
  const contenedor = document.getElementById('pricingGrid');
  try {
    const res = await fetch(`${API_BASE}/api/planes`);
    if (!res.ok) throw new Error('No se pudo cargar la información del plan.');
    const { planes } = await res.json();

    if (!planes.full) throw new Error('No se encontró el plan Full en la respuesta.');

    planesCargados = planes;
    contenedor.innerHTML = armarTarjetaPlanUnico(planes.full, planes.trial?.diasTrial ?? 14);

    // Los links recién armados también necesitan el dashboard_base correcto.
    contenedor.querySelectorAll('.dashboard-link').forEach((a) => {
      a.href = DASHBOARD_BASE + a.dataset.path;
    });
  } catch (err) {
    contenedor.innerHTML = '<div class="price-card"><div class="price-plan-desc">No pudimos cargar los planes en este momento. Actualiza la página o vuelve a intentar más tarde.</div></div>';
  }
}
cargarPlanes();

// --- Modal: qué incluye el Trial vs. Full (ver landing-la6f3c.html) ---
// Se muestra al hacer click en cualquier CTA de "Empezar gratis" (hay 3 en
// la página: hero, tarjeta de precio, footer — todos comparten la clase
// .cta-registro-trial) ANTES de navegar a register.html. La tarjeta de
// arriba describe el plan FULL — sin este modal, alguien podría asumir que
// esas mismas cuotas aplican desde el primer día de la prueba gratis,
// cuando en realidad el Trial tiene cuotas más chicas (ver planes.js,
// backend).
const CAMPOS_COMPARACION = [
  { campo: 'limiteAlertas', etiqueta: 'Alertas activas' },
  { campo: 'limiteCategorias', etiqueta: 'Productos/rubros por alerta' },
  { campo: 'limiteBusquedas', etiqueta: 'Búsquedas guardadas' },
  { campo: 'limiteRecordatorios', etiqueta: 'Recordatorios de cierre' },
  { campo: 'limiteSeguimientos', etiqueta: 'Seguimientos de procesos' },
  { campo: 'limiteAnalisisIA', etiqueta: 'Análisis de Procesos con IA / mes' },
  { campo: 'limitePalabrasClave', etiqueta: 'Palabras clave por alerta' },
];

function armarFilaComparacion(etiqueta, valorTrial, valorFull) {
  return `
    <div class="trial-modal-fila">
      <span>${etiqueta}</span>
      <span class="trial-modal-valor-trial">${valorTrial}</span>
      <span class="trial-modal-valor-full">${valorFull}</span>
    </div>
  `;
}

function armarComparacionTrialFull(planes) {
  const trial = planes.trial;
  const full = planes.full;
  if (!trial || !full) return '<div class="trial-modal-cargando">No se pudo cargar la comparación — igual podés continuar.</div>';

  const filas = CAMPOS_COMPARACION
    .filter((c) => trial[c.campo] != null && full[c.campo] != null)
    .map((c) => armarFilaComparacion(c.etiqueta, trial[c.campo], full[c.campo]));

  // WhatsApp es sí/no, no un número — se arma aparte del resto de los campos numéricos.
  const trialTieneWhatsapp = trial.mensajeria?.includes('WhatsApp');
  const fullTieneWhatsapp = full.mensajeria?.includes('WhatsApp');
  filas.push(armarFilaComparacion('Alertas por WhatsApp', trialTieneWhatsapp ? 'Sí' : 'No', fullTieneWhatsapp ? 'Sí' : 'No'));

  const header = `
    <div class="trial-modal-fila trial-modal-fila-header">
      <span></span>
      <span class="trial-modal-valor-trial">Trial (${trial.diasTrial} días)</span>
      <span class="trial-modal-valor-full">Full</span>
    </div>
  `;

  return header + filas.join('');
}

const trialModalOverlay = document.getElementById('trialModalOverlay');
const trialModalComparacion = document.getElementById('trialModalComparacion');
const trialModalContinuar = document.getElementById('trialModalContinuar');

function abrirTrialModal(hrefDestino) {
  trialModalContinuar.href = hrefDestino;
  trialModalComparacion.innerHTML = planesCargados
    ? armarComparacionTrialFull(planesCargados)
    : '<div class="trial-modal-cargando">No se pudo cargar la comparación — igual podés continuar.</div>';
  trialModalOverlay.classList.add('open');
}

function cerrarTrialModal() {
  trialModalOverlay.classList.remove('open');
}

// Delegado en document (no en cada link individual) porque el CTA de la
// tarjeta de precio se arma recién en cargarPlanes(), después de que este
// script ya corrió — un listener puesto directo sobre ese link en el
// momento en que se declara este bloque todavía no lo encontraría en el DOM.
document.addEventListener('click', (e) => {
  const cta = e.target.closest('.cta-registro-trial');
  if (cta) {
    e.preventDefault();
    abrirTrialModal(cta.href);
  }
});

document.getElementById('trialModalCerrar').addEventListener('click', cerrarTrialModal);
document.getElementById('trialModalVolver').addEventListener('click', cerrarTrialModal);
trialModalOverlay.addEventListener('click', (e) => {
  if (e.target === trialModalOverlay) cerrarTrialModal(); // click en el fondo, no en la tarjeta
});

const tickerData = [
  { codigo: '1002772-59-LR26', nombre: 'Suministro de mobiliario escolar', extra: 'Municipalidad de Talca' },
  { codigo: 'CA-3390-2026', nombre: 'Insumos de aseo y limpieza', extra: 'Hospital Regional de Rancagua' },
  { codigo: '588809-165-COT26', nombre: 'Insumos computacionales', extra: 'Corp. Municipal de Talagante' },
  { codigo: '5542-78-COT26', nombre: 'Servicio de traducción español-inglés', extra: 'Universidad de Chile' },
  { codigo: 'CA-4471-2026', nombre: 'Arriendo de equipos audiovisuales', extra: 'Municipalidad de Providencia' },
  { codigo: '2322-433-COT26', nombre: 'Islas de reciclaje', extra: 'Municipalidad de Vallenar' },
];
const track = document.getElementById('tickerTrack');
const buildTicker = () => tickerData.map(i =>
  `<div class="ticker-item"><span class="codigo">${i.codigo}</span> · <span class="nombre">${i.nombre}</span> · ${i.extra}</div>`
).join('');
track.innerHTML = buildTicker() + buildTicker();

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
  navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
});
navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Abrir menú');
}));
document.addEventListener('click', (e) => {
  if (!navLinks.contains(e.target) && e.target !== navToggle && !navToggle.contains(e.target)) {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menú');
  }
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
