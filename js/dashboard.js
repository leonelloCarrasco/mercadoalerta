const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:3000'
  : 'https://api.mercadoalerta.cl';

const token = sessionStorage.getItem('token');
if (!token) window.location.href = 'login.html';

const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

function showError(msg) {
  const el = document.getElementById('errorBanner');
  el.textContent = "❌ " + msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 6000);
}

function showErrorAlertas(msg) {
  const el = document.getElementById('errorBannerAlertas');
  el.textContent = "❌ " + msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 6000);
}

function showErrorModal(msg) {
  const el = document.getElementById('errorBannerModal');
  el.textContent = "❌ " + msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 6000);
}

function showErrorBubble(target, msg) {
  const bubble = document.createElement('div');
  bubble.className = 'error-bubble';
  bubble.textContent = "❌ " + msg;
  document.body.appendChild(bubble);

  const rect = target.getBoundingClientRect();
  bubble.style.left = `${rect.left + rect.width / 2}px`;
  bubble.style.top = `${rect.top - 10}px`;

  setTimeout(() => bubble.remove(), 4000);
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...authHeaders, ...(options.headers || {}) } });
  if (res.status === 401) {
    sessionStorage.removeItem('token');
    window.location.href = 'login.html';
    throw new Error('Sesión inválida');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Error ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

function formatMoney(n) {
  if (n === null || n === undefined) return 'No especificado';
  return '$' + Number(n).toLocaleString('es-CL');
}

// Formatea a "xx.xxx.xxx-x": "761234285" -> "76.123.428-5"
function formatearRut(valor) {
  const limpio = String(valor || '').replace(/[^0-9kK]/g, '').toUpperCase();
  if (!limpio) return '';

  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dv = limpio.slice(-1);
  return cuerpo ? `${cuerpo}-${dv}` : dv;
}

function etiquetaNivel(nivel) {
  if (nivel === 'categoria') return 'Rubro';
  if (nivel === 'obra') return 'Obra';
  return 'Producto';
}

// Con pocas regiones las lista todas; con muchas resume en un contador que
// se puede tocar/clickear para expandir el detalle completo — evita que el
// texto se desborde en el .row-meta, y a diferencia de un tooltip nativo
// (title) sí funciona en mobile, donde no hay hover.
// Criterio exclusivo de Compra Ágil (migración 029) — muestra el rango como
// corresponda según qué extremos estén definidos.
function formatearMontoTag(montoMinimo, montoMaximo) {
  if (!montoMinimo && !montoMaximo) return '';
  if (montoMinimo && montoMaximo) return `<br><span>Monto C.A.: ${formatMoney(montoMinimo)} – ${formatMoney(montoMaximo)}</span>`;
  if (montoMinimo) return `<br><span>Monto mín: ${formatMoney(montoMinimo)}</span>`;
  return `<br><span>Monto máx: ${formatMoney(montoMaximo)}</span>`;
}

function formatearRegionesTag(regiones) {
  if (!regiones || regiones.length === 0) return '<br><span>Todas las regiones</span>';
  if (regiones.length <= 2) return `<br><span>Regiones: ${regiones.join(', ')}</span>`;

  const resumen = `Regiones: ${regiones.length} seleccionadas`;
  const completo = `Regiones: ${regiones.join(', ')}`.replace(/"/g, '&quot;');
  return `<br><span class="regiones-toggle" data-resumen="${resumen}" data-completo="${completo}" style="border-bottom: 1px dotted var(--text-muted); cursor: pointer;">${resumen}</span>`;
}

// Solo se muestra si NO son ambos (ambos = el caso por defecto, no aporta info extra).
function formatearTipoProcesoTag(tiposProceso) {
  if (!tiposProceso || tiposProceso.length === 0 || tiposProceso.length === 2) return '';
  const etiquetas = { licitacion: 'Solo Licitaciones', compra_agil: 'Solo Compras Ágiles' };
  return `<br><span>${etiquetas[tiposProceso[0]] || tiposProceso[0]}</span>`;
}

function formatearTramosTag(tramos) {
  if (!tramos || tramos.length === 0) return '';
  if (tramos.length <= 3) return `<br><span>Tramos Lic.: ${tramos.join(', ')}</span>`;

  const resumen = `Tramos: ${tramos.length} seleccionados`;
  const completo = `Tramos: ${tramos.join(', ')}`.replace(/"/g, '&quot;');
  return `<br><span class="regiones-toggle" data-resumen="${resumen}" data-completo="${completo}" style="border-bottom: 1px dotted var(--text-muted); cursor: pointer;">${resumen}</span>`;
}

function formatearOrganismosTag(organismos) {
  if (!organismos || organismos.length === 0) return '';
  if (organismos.length === 1) return `<br><span>Organismo: ${organismos[0]}</span>`;

  const resumen = `Organismos: ${organismos.length} seleccionados`;
  const completo = `Organismos: ${organismos.join(', ')}`.replace(/"/g, '&quot;');
  return `<br><span class="regiones-toggle" data-resumen="${resumen}" data-completo="${completo}" style="border-bottom: 1px dotted var(--text-muted); cursor: pointer;">${resumen}</span>`;
}

function formatMontoConTramo(h) {
  if (h.monto !== null && h.monto !== undefined) return formatMoney(h.monto);
  if (h.monto_utm_min) {
    return h.monto_utm_max
      ? `Entre ${h.monto_utm_min} y ${h.monto_utm_max} UTM`
      : `Desde ${h.monto_utm_min} UTM`;
  }
  return 'No especificado';
}

function formatDate(iso) {
  if (!iso) return 'No especificada';
  try {
    return new Date(iso).toLocaleString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

// Extrae "YYYY-MM-DD" en hora LOCAL (no UTC) — hace falta para que los filtros
// de fecha comparen contra el mismo día que el usuario ve en pantalla (formatDate
// de arriba también usa hora local). Comparar contra iso.slice(0,10) directo
// compara en UTC, que puede ser un día distinto al que se muestra en Chile.
function fechaLocalISO(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function soloDigitos(valor) {
  return valor.replace(/\D/g, '');
}

function formatearMiles(valor) {
  const digitos = soloDigitos(valor);
  if (!digitos) return '';
  return '$' + Number(digitos).toLocaleString('es-CL');
}

function registrarInputMonto(id) {
  const input = document.getElementById(id);
  input.addEventListener('input', () => {
    input.value = formatearMiles(input.value);
  });
  return input;
}

const montoMinimoInput = registrarInputMonto('montoMinimo');
const montoMaximoInput = registrarInputMonto('montoMaximo');
const filtroMontoConfigInput = registrarInputMonto('filtroMontoConfig');
const filtroMontoHistInput = registrarInputMonto('filtroMontoHist');

const regionDropdownBtn = document.getElementById('regionDropdownBtn');
const regionDropdownPanel = document.getElementById('regionDropdownPanel');
const filtroRegionConfigSelect = document.getElementById('filtroRegionConfig');
const tramoDropdownBtn = document.getElementById('tramoDropdownBtn');
const tramoDropdownPanel = document.getElementById('tramoDropdownPanel');
const tipoProcesoLicitacionChk = document.getElementById('tipoProcesoLicitacion');
const tipoProcesoCompraAgilChk = document.getElementById('tipoProcesoCompraAgil');

// --- Buscador de categorías (chips) ---
let categoriasSeleccionadas = []; // [{ codigo, titulo }]
const categoriaBuscarInput = document.getElementById('categoriaBuscar');
const categoriaResultadosEl = document.getElementById('categoriaResultados');
const categoriasChipsEl = document.getElementById('categoriasChips');
let categoriaBuscarTimeout = null;

function renderCategoriasChips() {
  categoriasChipsEl.innerHTML = categoriasSeleccionadas.map((c) => `
    <span class="categoria-chip" data-codigo="${c.codigo}">
      ${c.titulo} <span class="nivel-badge ${c.nivel}">${c.nivel === 'categoria' ? 'Rub.' : 'Prod.'}</span> <span class="cod">(${c.codigo})</span>
      <span class="quitar" data-quitar="${c.codigo}">✕</span>
    </span>
  `).join('');

  categoriasChipsEl.querySelectorAll('[data-quitar]').forEach((el) => {
    el.addEventListener('click', () => {
      categoriasSeleccionadas = categoriasSeleccionadas.filter((c) => c.codigo !== el.dataset.quitar);
      renderCategoriasChips();
    });
  });
}

// El máximo es 1 categoría/producto por alerta para todos los planes — elegir
// una nueva reemplaza la anterior en vez de acumularse en la lista.
function agregarCategoria(codigo, titulo, nivel) {
  categoriasSeleccionadas = [{ codigo, titulo, nivel }];
  renderCategoriasChips();
}

categoriaBuscarInput.addEventListener('input', () => {
  clearTimeout(categoriaBuscarTimeout);
  const texto = categoriaBuscarInput.value.trim();

  if (texto.length < 2) {
    categoriaResultadosEl.classList.remove('open');
    return;
  }

  categoriaBuscarTimeout = setTimeout(async () => {
    try {
      // nivel=producto: en este modo del buscador solo interesan productos
      // puntuales — para elegir un rubro completo está la pestaña "Explorar por rubro".
      const data = await apiFetch(`/api/alerts/categorias/buscar?q=${encodeURIComponent(texto)}&nivel=producto`);
      if (data.resultados.length === 0) {
        categoriaResultadosEl.innerHTML = '<div class="categoria-resultado-vacio">Sin resultados</div>';
      } else {
        categoriaResultadosEl.innerHTML = data.resultados.map((r) => `
          <div class="categoria-resultado-item" data-codigo="${r.codigo}" data-titulo="${r.titulo.replace(/"/g, '&quot;')}" data-nivel="${r.nivel}">
            <span>${r.titulo} <span class="nivel-badge ${r.nivel}">${r.nivel === 'categoria' ? 'Categoría' : r.nivel === 'obra' ? 'Obra' : 'Producto'}</span></span>
            <span class="cod">${r.codigo}</span>
          </div>
        `).join('');

        categoriaResultadosEl.querySelectorAll('[data-codigo]').forEach((el) => {
          el.addEventListener('click', () => {
            agregarCategoria(el.dataset.codigo, el.dataset.titulo, el.dataset.nivel);
            categoriaBuscarInput.value = '';
            categoriaResultadosEl.classList.remove('open');
          });
        });
      }
      categoriaResultadosEl.classList.add('open');
    } catch (err) {
      console.warn('Error buscando categorías o productos:', err.message);
    }
  }, 300);
});

document.addEventListener('click', (e) => {
  if (!categoriaBuscarInput.contains(e.target) && !categoriaResultadosEl.contains(e.target)) {
    categoriaResultadosEl.classList.remove('open');
  }
});

// --- Tabs "Buscar producto" / "Explorar por rubro" ---
const categoriaModoTabs = document.getElementById('categoriaModoTabs');
const categoriaModoProducto = document.getElementById('categoriaModoProducto');
const categoriaModoRubro = document.getElementById('categoriaModoRubro');

categoriaModoTabs.addEventListener('click', (e) => {
  const tab = e.target.closest('.categoria-modo-tab');
  if (!tab) return;

  categoriaModoTabs.querySelectorAll('.categoria-modo-tab').forEach((t) => t.classList.remove('active'));
  tab.classList.add('active');

  const esRubro = tab.dataset.modo === 'rubro';
  categoriaModoProducto.style.display = esRubro ? 'none' : '';
  categoriaModoRubro.style.display = esRubro ? '' : 'none';
  categoriaResultadosEl.classList.remove('open');
  rubroArbolPanel.classList.remove('open');

  if (esRubro) cargarArbolRubros(); // lazy: solo se pide la primera vez que se abre esta pestaña
});

// --- Árbol de rubros (Segmento > Familia > Rubro), modo "Explorar por rubro" ---
// El usuario conoce el concepto "Rubro" (nivel 3 de UNSPSC) mejor que "Categoría":
// al elegir un rubro, la alerta aplica a TODOS los productos de ese rubro (el
// backend ya matchea por prefijo de código, ver matching.service.js).
const rubroArbolBtn = document.getElementById('rubroArbolBtn');
const rubroArbolPanel = document.getElementById('rubroArbolPanel');
let arbolRubrosData = null; // cacheado en memoria mientras dura la sesión del dashboard

function renderArbolRubros(filtro = '') {
  const filtroNorm = filtro.trim().toLowerCase();

  const html = arbolRubrosData.map((segmento) => {
    const familiasHtml = segmento.familias.map((familia) => {
      const rubrosFiltrados = filtroNorm
        ? familia.rubros.filter((r) => r.titulo.toLowerCase().includes(filtroNorm))
        : familia.rubros;
      if (rubrosFiltrados.length === 0) return '';

      const hojasHtml = rubrosFiltrados.map((r) => `
        <div class="rubro-hoja" data-codigo="${r.codigo}" data-titulo="${r.titulo.replace(/"/g, '&quot;')}">${r.titulo}</div>
      `).join('');

      // Con filtro activo, se abren automáticamente las ramas que tienen resultados.
      return `
        <details class="rubro-familia" ${filtroNorm ? 'open' : ''}>
          <summary>${familia.familia}</summary>
          ${hojasHtml}
        </details>
      `;
    }).join('');

    if (!familiasHtml.trim()) return '';

    return `
      <details class="rubro-segmento" ${filtroNorm ? 'open' : ''}>
        <summary>${segmento.segmento}</summary>
        ${familiasHtml}
      </details>
    `;
  }).join('');

  rubroArbolPanel.innerHTML = `
    <input type="text" id="rubroArbolBuscar" class="rubro-arbol-buscar" placeholder="Filtrar rubros..." value="${filtro.replace(/"/g, '&quot;')}">
    <div id="rubroArbolContenido">${html.trim() ? html : '<div class="rubro-arbol-vacio">Sin rubros que coincidan</div>'}</div>
  `;

  rubroArbolPanel.querySelectorAll('.rubro-hoja').forEach((el) => {
    el.addEventListener('click', () => {
      agregarCategoria(el.dataset.codigo, el.dataset.titulo, 'categoria');
      rubroArbolPanel.classList.remove('open');
    });
  });

  const buscarInput = document.getElementById('rubroArbolBuscar');
  buscarInput.addEventListener('click', (e) => e.stopPropagation());
  buscarInput.addEventListener('input', () => renderArbolRubros(buscarInput.value));
  // Mantiene el foco en el campo de filtro entre renders (se pierde al reemplazar innerHTML).
  buscarInput.focus();
  buscarInput.setSelectionRange(buscarInput.value.length, buscarInput.value.length);
}

async function cargarArbolRubros() {
  if (!arbolRubrosData) {
    rubroArbolPanel.innerHTML = '<div class="rubro-arbol-vacio">Cargando rubros...</div>';
    rubroArbolPanel.classList.add('open');
    try {
      const data = await apiFetch('/api/alerts/categorias/arbol');
      arbolRubrosData = data.arbol;
    } catch (err) {
      rubroArbolPanel.innerHTML = `<div class="rubro-arbol-vacio">Error al cargar los rubros: ${err.message}</div>`;
      return;
    }
  }
  renderArbolRubros();
}

rubroArbolBtn.addEventListener('click', () => {
  const abrir = !rubroArbolPanel.classList.contains('open');
  if (abrir) cargarArbolRubros();
  rubroArbolPanel.classList.toggle('open', abrir);
});

document.addEventListener('click', (e) => {
  if (!rubroArbolBtn.contains(e.target) && !rubroArbolPanel.contains(e.target)) {
    rubroArbolPanel.classList.remove('open');
  }
});

// Vuelve el selector de categoría a su estado inicial (pestaña "Buscar producto")
// al abrir/cerrar el modal de nueva alerta.
function resetCategoriaSelector() {
  categoriaModoTabs.querySelectorAll('.categoria-modo-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  categoriaModoProducto.style.display = '';
  categoriaModoRubro.style.display = 'none';
  categoriaBuscarInput.value = '';
  categoriaResultadosEl.classList.remove('open');
  rubroArbolPanel.classList.remove('open');
}

// --- Selector múltiple de regiones (checkboxes dentro de un desplegable) ---
// Vacío/ninguna marcada = "todas las regiones" (así lo interpreta el backend).
let regionesDisponibles = [];
let regionesSeleccionadas = new Set();

function actualizarTextoRegionDropdown() {
  if (regionesSeleccionadas.size === 0) {
    regionDropdownBtn.innerHTML = '<span class="placeholder">Todas las regiones</span>';
  } else if (regionesSeleccionadas.size <= 2) {
    regionDropdownBtn.textContent = [...regionesSeleccionadas].join(', ');
  } else {
    regionDropdownBtn.textContent = `${regionesSeleccionadas.size} regiones seleccionadas`;
  }
}

function renderRegionDropdownPanel() {
  const opciones = regionesDisponibles.map((r) => `
    <label class="region-checkbox-item">
      <input type="checkbox" value="${r}" ${regionesSeleccionadas.has(r) ? 'checked' : ''}>
      <span>${r}</span>
    </label>
  `).join('');

  regionDropdownPanel.innerHTML = `
    <div class="region-dropdown-actions">
      <button type="button" id="regionSeleccionarTodas">Seleccionar todas</button>
      <button type="button" id="regionLimpiarSeleccion">Limpiar</button>
    </div>
    ${opciones}
  `;

  regionDropdownPanel.querySelectorAll('input[type="checkbox"]').forEach((chk) => {
    chk.addEventListener('change', () => {
      if (chk.checked) regionesSeleccionadas.add(chk.value);
      else regionesSeleccionadas.delete(chk.value);
      actualizarTextoRegionDropdown();
    });
  });

  document.getElementById('regionSeleccionarTodas').addEventListener('click', () => {
    regionesSeleccionadas = new Set(regionesDisponibles);
    renderRegionDropdownPanel();
    actualizarTextoRegionDropdown();
  });
  document.getElementById('regionLimpiarSeleccion').addEventListener('click', () => {
    regionesSeleccionadas = new Set();
    renderRegionDropdownPanel();
    actualizarTextoRegionDropdown();
  });
}

function resetRegionDropdown() {
  regionesSeleccionadas = new Set();
  actualizarTextoRegionDropdown();
  renderRegionDropdownPanel();
}

regionDropdownBtn.addEventListener('click', () => {
  const abrir = !regionDropdownPanel.classList.contains('open');
  regionDropdownPanel.classList.toggle('open', abrir);
  regionDropdownBtn.classList.toggle('open', abrir);
});

document.addEventListener('click', (e) => {
  if (!regionDropdownBtn.contains(e.target) && !regionDropdownPanel.contains(e.target)) {
    regionDropdownPanel.classList.remove('open');
    regionDropdownBtn.classList.remove('open');
  }
});

async function cargarRegiones() {
  try {
    const data = await apiFetch('/api/alerts/regiones');
    regionesDisponibles = data.regiones;
    renderRegionDropdownPanel();
    actualizarTextoRegionDropdown();

    const opciones = data.regiones.map(r => `<option value="${r}">${r}</option>`).join('');
    filtroRegionConfigSelect.innerHTML = '<option value="">Todas las regiones</option>' + opciones;
  } catch (err) {
    console.warn('No se pudieron cargar las regiones:', err.message);
  }
}

// --- Tipo de licitación (tramo UTM) — mismo patrón de checkboxes que regiones,
// pero cada opción tiene un código (L1, LE, LP...) distinto de su etiqueta visible. ---
let tramosDisponibles = []; // [{codigo, descripcion}]
let tramosSeleccionados = new Set(); // set de códigos

function actualizarTextoTramoDropdown() {
  if (tramosSeleccionados.size === 0) {
    tramoDropdownBtn.innerHTML = '<span class="placeholder">Todos los tramos</span>';
  } else if (tramosSeleccionados.size <= 3) {
    tramoDropdownBtn.textContent = [...tramosSeleccionados].join(', ');
  } else {
    tramoDropdownBtn.textContent = `${tramosSeleccionados.size} tramos seleccionados`;
  }
}

function renderTramoDropdownPanel() {
  const opciones = tramosDisponibles.map((t) => `
    <label class="region-checkbox-item">
      <input type="checkbox" value="${t.codigo}" ${tramosSeleccionados.has(t.codigo) ? 'checked' : ''}>
      <span>${t.codigo} — ${t.descripcion}</span>
    </label>
  `).join('');

  tramoDropdownPanel.innerHTML = `
    <div class="region-dropdown-actions">
      <button type="button" id="tramoSeleccionarTodos">Seleccionar todos</button>
      <button type="button" id="tramoLimpiarSeleccion">Limpiar</button>
    </div>
    ${opciones}
  `;

  tramoDropdownPanel.querySelectorAll('input[type="checkbox"]').forEach((chk) => {
    chk.addEventListener('change', () => {
      if (chk.checked) tramosSeleccionados.add(chk.value);
      else tramosSeleccionados.delete(chk.value);
      actualizarTextoTramoDropdown();
    });
  });

  document.getElementById('tramoSeleccionarTodos').addEventListener('click', () => {
    tramosSeleccionados = new Set(tramosDisponibles.map((t) => t.codigo));
    renderTramoDropdownPanel();
    actualizarTextoTramoDropdown();
  });
  document.getElementById('tramoLimpiarSeleccion').addEventListener('click', () => {
    tramosSeleccionados = new Set();
    renderTramoDropdownPanel();
    actualizarTextoTramoDropdown();
  });
}

function resetTramoDropdown() {
  tramosSeleccionados = new Set();
  actualizarTextoTramoDropdown();
  renderTramoDropdownPanel();
}

tramoDropdownBtn.addEventListener('click', () => {
  const abrir = !tramoDropdownPanel.classList.contains('open');
  tramoDropdownPanel.classList.toggle('open', abrir);
  tramoDropdownBtn.classList.toggle('open', abrir);
});

document.addEventListener('click', (e) => {
  if (!tramoDropdownBtn.contains(e.target) && !tramoDropdownPanel.contains(e.target)) {
    tramoDropdownPanel.classList.remove('open');
    tramoDropdownBtn.classList.remove('open');
  }
});

async function cargarTramos() {
  try {
    const data = await apiFetch('/api/alerts/tramos');
    tramosDisponibles = data.tramos;
    renderTramoDropdownPanel();
    actualizarTextoTramoDropdown();
  } catch (err) {
    console.warn('No se pudieron cargar los tramos de licitación:', err.message);
  }
}

// --- Tipo de proceso (Licitaciones / Compras Ágiles) — al menos uno debe
// quedar marcado; si el usuario intenta destildar el último, se revierte.
// El tramo UTM solo tiene sentido para Licitaciones, y el rango de monto
// mínimo/máximo solo para Compras Ágiles (un tramo YA define un rango de
// monto para licitaciones) — cada campo se muestra u oculta según corresponda.
const tramoFieldEl = document.getElementById('tramoField');
const montoFieldEl = document.getElementById('montoField');

function actualizarCamposSegunTipoProceso() {
  const licitacionesActivas = tipoProcesoLicitacionChk.checked;
  const compraAgilActiva = tipoProcesoCompraAgilChk.checked;

  tramoFieldEl.style.display = licitacionesActivas ? '' : 'none';
  montoFieldEl.style.display = compraAgilActiva ? '' : 'none';

  // Si se oculta un campo, se limpia su valor — no debe quedar guardado un
  // criterio que el usuario ya no puede ver ni editar en el formulario.
  if (!licitacionesActivas) resetTramoDropdown();
  if (!compraAgilActiva) {
    montoMinimoInput.value = '';
    montoMaximoInput.value = '';
  }
}

[tipoProcesoLicitacionChk, tipoProcesoCompraAgilChk].forEach((chk) => {
  chk.addEventListener('change', () => {
    if (!tipoProcesoLicitacionChk.checked && !tipoProcesoCompraAgilChk.checked) {
      chk.checked = true; // no se puede dejar los dos destildados
    }
    actualizarCamposSegunTipoProceso();
  });
});

function resetTipoProceso() {
  tipoProcesoLicitacionChk.checked = true;
  tipoProcesoCompraAgilChk.checked = true;
  actualizarCamposSegunTipoProceso();
}

// --- Organismo comprador — buscador con autocompletado + selección múltiple
// (chips), mismo patrón visual que las categorías pero sin límite de 1. ---
const organismoBuscarInput = document.getElementById('organismoBuscar');
const organismoResultadosEl = document.getElementById('organismoResultados');
const organismosChipsEl = document.getElementById('organismosChips');
let organismoBuscarTimeout = null;
let organismosSeleccionados = [];

function renderOrganismosChips() {
  organismosChipsEl.innerHTML = organismosSeleccionados.map((o) => `
    <span class="categoria-chip" data-organismo="${o.replace(/"/g, '&quot;')}">
      ${o}
      <span class="quitar" data-quitar-organismo="${o.replace(/"/g, '&quot;')}">✕</span>
    </span>
  `).join('');

  organismosChipsEl.querySelectorAll('[data-quitar-organismo]').forEach((el) => {
    el.addEventListener('click', () => {
      organismosSeleccionados = organismosSeleccionados.filter((o) => o !== el.dataset.quitarOrganismo);
      renderOrganismosChips();
    });
  });
}

function resetOrganismos() {
  organismosSeleccionados = [];
  renderOrganismosChips();
}

organismoBuscarInput.addEventListener('input', () => {
  clearTimeout(organismoBuscarTimeout);
  const texto = organismoBuscarInput.value.trim();

  if (texto.length < 2) {
    organismoResultadosEl.classList.remove('open');
    return;
  }

  organismoBuscarTimeout = setTimeout(async () => {
    try {
      const data = await apiFetch(`/api/alerts/organismos/buscar?q=${encodeURIComponent(texto)}`);
      const disponibles = data.resultados.filter((o) => !organismosSeleccionados.includes(o));

      organismoResultadosEl.innerHTML = disponibles.length === 0
        ? '<div class="categoria-resultado-vacio">Sin resultados</div>'
        : disponibles.map((o) => `
            <div class="categoria-resultado-item" data-organismo="${o.replace(/"/g, '&quot;')}">
              <span>${o}</span>
            </div>
          `).join('');

      organismoResultadosEl.querySelectorAll('[data-organismo]').forEach((el) => {
        el.addEventListener('click', () => {
          organismosSeleccionados.push(el.dataset.organismo);
          renderOrganismosChips();
          organismoBuscarInput.value = '';
          organismoResultadosEl.classList.remove('open');
        });
      });
      organismoResultadosEl.classList.add('open');
    } catch (err) {
      console.warn('Error buscando organismos:', err.message);
    }
  }, 300);
});

document.addEventListener('click', (e) => {
  if (!organismoBuscarInput.contains(e.target) && !organismoResultadosEl.contains(e.target)) {
    organismoResultadosEl.classList.remove('open');
  }
});

const confirmModal = document.getElementById('confirmModal');
const confirmModalMessage = document.getElementById('confirmModalMessage');
const confirmModalCancel = document.getElementById('confirmModalCancel');
const confirmModalAccept = document.getElementById('confirmModalAccept');

function confirmDialog(mensaje) {
  return new Promise((resolve) => {
    confirmModalMessage.textContent = mensaje;
    confirmModal.classList.add('open');

    function cerrar(resultado) {
      confirmModal.classList.remove('open');
      confirmModalAccept.removeEventListener('click', onAceptar);
      confirmModalCancel.removeEventListener('click', onCancelar);
      confirmModal.removeEventListener('click', onOverlay);
      resolve(resultado);
    }
    function onAceptar() { cerrar(true); }
    function onCancelar() { cerrar(false); }
    function onOverlay(e) { if (e.target === confirmModal) cerrar(false); }

    confirmModalAccept.addEventListener('click', onAceptar);
    confirmModalCancel.addEventListener('click', onCancelar);
    confirmModal.addEventListener('click', onOverlay);
  });
}

async function cargarUsuario() {
  try {
    const data = await apiFetch('/api/auth/me');
    window.usuarioActual = data.usuario;

    const nombreCompleto = data.usuario.nombre
      ? `${data.usuario.nombre} ${data.usuario.apellido || ''}`.trim()
      : data.usuario.email;
    //document.getElementById('userInfo').textContent =
    //  `${nombreCompleto} · ${data.usuario.nombre_empresa || data.usuario.rut_empresa}`;

    const iniciales = data.usuario.nombre
      ? `${data.usuario.nombre[0]}${(data.usuario.apellido || '')[0] || ''}`.toUpperCase()
      : data.usuario.email[0].toUpperCase();
    document.getElementById('topbarMenuBtn').textContent = iniciales;
    document.getElementById('topbarMenuName').textContent = nombreCompleto;
    document.getElementById('topbarMenuEmail').textContent = data.usuario.email;

    mostrarBannerPlan(data.usuario);
    renderAnalisis(data.usuario);

    // Solo visible para el usuario admin (users.es_admin, migración 028) —
    // se inyecta por JS en vez de dejarlo fijo en el HTML para que no
    // "parpadee" visible antes de saber si el usuario es admin o no.
    if (data.usuario.es_admin) {
      const linkAdmin = document.createElement('a');
      linkAdmin.href = 'admin.html';
      linkAdmin.className = 'sidebar-link';
      linkAdmin.innerHTML = '<div class="icon"><img src="/assets/icons/alt-administrador.svg" class="icon-desc"></img></div> Panel Admin';
      document.querySelector('.sidebar-nav').appendChild(linkAdmin);
    }
  } catch (err) {
    showError('No se pudo cargar tu sesión: ' + err.message);
  }
}

function mostrarBannerPlan(usuario) {
  const banner = document.getElementById('planBanner');

  if (usuario.estado_pago === 'pendiente') {
    banner.className = 'plan-banner bloqueo';
    banner.innerHTML = `
      <p>Tu pago está pendiente de confirmación. Completa el pago para poder usar MercadoAlerta.</p>
      <div class="btn-group">
        <button class="btn" onclick="iniciarUpgrade('${usuario.empresa_id}', '${usuario.plan}')">Completar pago</button>
      </div>
    `;
    banner.style.display = 'flex';
    return;
  }

  if (usuario.plan === 'trial' && usuario.fecha_expiracion_trial) {
    const msRestantes = new Date(usuario.fecha_expiracion_trial) - new Date();
    const diasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60 * 24));

    if (diasRestantes <= 0) {
      banner.className = 'plan-banner bloqueo';
      banner.innerHTML = `
        <p>Tu período de prueba de 14 días terminó. Elige un plan para seguir recibiendo alertas.</p>
        <div class="btn-group">
          <button class="btn btn-ghost" onclick="iniciarUpgrade('${usuario.empresa_id}', 'basico')">Elegir Basic</button>
          <button class="btn" onclick="iniciarUpgrade('${usuario.empresa_id}', 'full')">Elegir Full</button>
        </div>
      `;
      banner.style.display = 'flex';
    } else if (diasRestantes <= 2) {
      banner.className = 'plan-banner aviso';
      banner.innerHTML = `
        <p>Tu período de prueba termina en ${diasRestantes} día${diasRestantes === 1 ? '' : 's'}. Elige un plan para no perder tus alertas.</p>
        <div class="btn-group">
          <button class="btn btn-ghost" onclick="iniciarUpgrade('${usuario.empresa_id}', 'basico')">Elegir Basic</button>
          <button class="btn" onclick="iniciarUpgrade('${usuario.empresa_id}', 'full')">Elegir Full</button>
        </div>
      `;
      banner.style.display = 'flex';
    }
  }
}

async function iniciarUpgrade(empresaId, plan) {
  try {
    const data = await apiFetch(`/api/empresas/${empresaId}/upgrade`, {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    }
  } catch (err) {
    showError('No se pudo iniciar el pago: ' + err.message);
  }
}

// Espejo de src/utils/planes.js (backend) — solo para dar feedback inmediato
// en el cliente antes de abrir el modal. El backend es la fuente de verdad real
// y vuelve a validar esto en POST /api/alerts/config de todas formas.
const LIMITES_ALERTAS_POR_PLAN = { trial: 1, basico: 5, full: 10 };

function obtenerLimitesPlanActual() {
  const plan = window.usuarioActual?.plan;
  if (!plan || !(plan in LIMITES_ALERTAS_POR_PLAN)) return null;
  return { limiteAlertas: LIMITES_ALERTAS_POR_PLAN[plan] };
}

const CONFIGS_POR_PAGINA = 10;
let configsData = [];
let configsPaginaActual = 1;
let mapaCategorias = {}; // codigo -> { titulo, nivel }, para mostrar descripciones en vez de códigos

async function cargarConfigs() {
  const card = document.getElementById('configsCard');
  try {
    const data = await apiFetch('/api/alerts/config');
    configsData = data.configs;
    configsPaginaActual = 1;

    // Resolvemos en un solo request todos los códigos únicos que aparezcan
    // en cualquier config, para mostrar la descripción en vez del código crudo.
    const codigosUnicos = [...new Set(configsData.flatMap((c) => c.categorias || []))];
    if (codigosUnicos.length > 0) {
      try {
        const detalle = await apiFetch(`/api/alerts/categorias/detalle?codigos=${codigosUnicos.join(',')}`);
        mapaCategorias = Object.fromEntries(detalle.categorias.map((c) => [c.codigo, { titulo: c.titulo, nivel: c.nivel }]));
      } catch (err) {
        console.warn('No se pudieron resolver las descripciones de categorías o productos:', err.message);
        mapaCategorias = {};
      }
    }

    renderConfigs();
    renderInicio();
  } catch (err) {
    card.innerHTML = `<div class="empty-state">Error al cargar: ${err.message}</div>`;
  }
}

function obtenerConfigsFiltrados() {
  const estado = document.getElementById('filtroEstado').value;
  const montoDesde = Number(soloDigitos(filtroMontoConfigInput.value)) || 0;
  const region = filtroRegionConfigSelect.value;
  const categoria = document.getElementById('filtroCategoriaConfig').value.trim();

  return configsData.filter(c => {
    if (estado && String(c.activo) !== estado) return false;
    if (montoDesde && (c.monto_minimo == null || c.monto_minimo < montoDesde)) return false;
    // Una alerta sin regiones (null/[]) monitorea TODAS las regiones, así que
    // también debe aparecer al filtrar por cualquier región específica.
    if (region && c.regiones && c.regiones.length > 0 && !c.regiones.includes(region)) return false;
    if (categoria && !(c.categorias || []).some(cat => cat.includes(categoria))) return false;
    return true;
  });
}

function renderConfigs() {
  const card = document.getElementById('configsCard');
  if (configsData.length === 0) {
    card.innerHTML = '<div class="empty-state">Todavía no tienes alertas configuradas. Crea una arriba.</div>';
    return;
  }

  const configsFiltrados = obtenerConfigsFiltrados();
  if (configsFiltrados.length === 0) {
    card.innerHTML = '<div class="empty-state">Ningún resultado con los filtros seleccionados.</div>';
    return;
  }

  const totalPaginas = Math.ceil(configsFiltrados.length / CONFIGS_POR_PAGINA);
  if (configsPaginaActual > totalPaginas) configsPaginaActual = totalPaginas;
  const inicio = (configsPaginaActual - 1) * CONFIGS_POR_PAGINA;
  const pagina = configsFiltrados.slice(inicio, inicio + CONFIGS_POR_PAGINA);

  const filasHtml = pagina.map(c => {
    const categoriasInfo = (c.categorias || []).map((cod) => {
      const info = mapaCategorias[cod];
      return { codigo: cod, titulo: info ? info.titulo : cod, nivel: info ? info.nivel : 'categoria' };
    });
    const nombresCategorias = categoriasInfo.map((cat) => `${cat.titulo} <span class="nivel-badge ${cat.nivel}">${etiquetaNivel(cat.nivel)}</span> <span class="cod">(${cat.codigo})</span>`);
    return `
    <div class="row">
      <div class="row-info">
        <div class="row-title">${nombresCategorias.length ?  nombresCategorias.join(', ') : 'Todas las categorías y productos'}</div>
        <div class="row-meta">
          <span style="font-size: 14px;">${c.activo ? '🟢 Activa' : '⚪ Pausada'}</span>
          ${formatearTipoProcesoTag(c.tipos_proceso)}
          ${formatearTramosTag(c.tramos_licitacion)}
          ${formatearMontoTag(c.monto_minimo, c.monto_maximo)}
          ${formatearRegionesTag(c.regiones)}
          ${formatearOrganismosTag(c.organismos)}
        </div>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-ghost" data-toggle="${c.id}" data-activo="${c.activo}">${c.activo ? '❚❚ Pausar' : '▶ Reactivar'}</button>
        <button class="btn btn-danger" data-delete="${c.id}">✖ Eliminar</button>
      </div>
    </div>
  `;
  }).join('');

  const mostrarPaginador = configsFiltrados.length > CONFIGS_POR_PAGINA;
  const paginadorHtml = mostrarPaginador ? `
    <div class="paginador">
      <button type="button" class="btn btn-ghost" id="configsPrev" ${configsPaginaActual === 1 ? 'disabled' : ''}>‹ Anterior</button>
      <span class="paginador-info">Página ${configsPaginaActual} de ${totalPaginas}</span>
      <button type="button" class="btn btn-ghost" id="configsNext" ${configsPaginaActual === totalPaginas ? 'disabled' : ''}>Siguiente ›</button>
    </div>
  ` : '';

  card.innerHTML = filasHtml + paginadorHtml;

  card.querySelectorAll('.regiones-toggle').forEach((el) => {
    el.addEventListener('click', () => {
      const expandido = el.classList.toggle('expandido');
      el.innerHTML = expandido ? el.dataset.completo : el.dataset.resumen;
    });
  });

  card.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const confirmado = await confirmDialog('¿Eliminar esta alerta?');
      if (!confirmado) return;
      try {
        await apiFetch(`/api/alerts/config/${btn.dataset.delete}`, { method: 'DELETE' });
        cargarConfigs();
      } catch (err) { showErrorAlertas(err.message); }
    });
  });

  card.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const nuevoEstado = btn.dataset.activo !== 'true';
      try {
        await apiFetch(`/api/alerts/config/${btn.dataset.toggle}`, {
          method: 'PUT',
          body: JSON.stringify({ activo: nuevoEstado }),
        });
        cargarConfigs();
      } catch (err) { showErrorBubble(btn, err.message); }
    });
  });

  if (mostrarPaginador) {
    document.getElementById('configsPrev').addEventListener('click', () => {
      configsPaginaActual--;
      renderConfigs();
    });
    document.getElementById('configsNext').addEventListener('click', () => {
      configsPaginaActual++;
      renderConfigs();
    });
  }
}

document.getElementById('newAlertForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('createBtn');
  btn.disabled = true;
  btn.textContent = 'Creando...';

  const montoMinimo = soloDigitos(montoMinimoInput.value);
  const montoMaximo = soloDigitos(montoMaximoInput.value);
  const regiones = [...regionesSeleccionadas];
  const categorias = categoriasSeleccionadas.map((c) => c.codigo);
  const tramosLicitacion = [...tramosSeleccionados];
  const organismos = [...organismosSeleccionados];

  const tiposProceso = [];
  if (tipoProcesoLicitacionChk.checked) tiposProceso.push('licitacion');
  if (tipoProcesoCompraAgilChk.checked) tiposProceso.push('compra_agil');

  if (categorias.length === 0) {
    showErrorModal('Debes elegir un producto o rubro para la alerta.');
    btn.disabled = false;
    btn.textContent = 'Crear alerta';
    return;
  }

  if (tiposProceso.length === 0) {
    showErrorModal('Debes dejar marcado al menos "Licitaciones" o "Compras Ágiles".');
    btn.disabled = false;
    btn.textContent = 'Crear alerta';
    return;
  }

  if (montoMinimo && montoMaximo && Number(montoMaximo) < Number(montoMinimo)) {
    showErrorModal('El monto máximo no puede ser menor que el monto mínimo.');
    btn.disabled = false;
    btn.textContent = 'Crear alerta';
    return;
  }

  try {
    await apiFetch('/api/alerts/config', {
      method: 'POST',
      body: JSON.stringify({
        montoMinimo: montoMinimo ? Number(montoMinimo) : null,
        montoMaximo: montoMaximo ? Number(montoMaximo) : null,
        regiones,
        categorias,
        tiposProceso,
        tramosLicitacion,
        organismos,
      }),
    });
    document.getElementById('newAlertForm').reset();
    categoriasSeleccionadas = [];
    renderCategoriasChips();
    resetRegionDropdown();
    resetCategoriaSelector();
    resetTramoDropdown();
    resetTipoProceso();
    resetOrganismos();
    newAlertModal.classList.remove('open');
    cargarConfigs();
  } catch (err) {
    showErrorModal(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Crear alerta';
  }
});

const HISTORIAL_POR_PAGINA = 10;
let historialData = [];
let historialPaginaActual = 1;

async function cargarHistorial() {
  const card = document.getElementById('historyCard');
  try {
    const data = await apiFetch('/api/alerts/history');
    historialData = data.historial;
    historialPaginaActual = 1;
    renderHistorial();
    renderInicio();
  } catch (err) {
    card.innerHTML = `<div class="empty-state">Error al cargar: ${err.message}</div>`;
  }
}

// --- Inicio: resumen ---
function renderInicio() {
  const activas = configsData.filter((c) => c.activo).length;
  const pausadas = configsData.filter((c) => !c.activo).length;
  const hace7dias = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const notif7d = historialData.filter((h) => h.sent_at && new Date(h.sent_at).getTime() >= hace7dias).length;

  document.getElementById('statAlertasActivas').textContent = activas;
  document.getElementById('statAlertasPausadas').textContent = pausadas;
  document.getElementById('statNotifTotal').textContent = historialData.length;
  document.getElementById('statNotif7d').textContent = notif7d;

  const reporteCard = document.getElementById('inicioReporteCard');
  if (historialData.length === 0) {
    reporteCard.innerHTML = '<div class="empty-state">Aún no se te ha enviado ninguna notificación.</div>';
    return;
  }

  const porTipo = { licitacion: 0, compra_agil: 0 };
  const porCanal = {};
  historialData.forEach((h) => {
    if (h.tipo_proceso in porTipo) porTipo[h.tipo_proceso]++;
    porCanal[h.canal] = (porCanal[h.canal] || 0) + 1;
  });

  reporteCard.innerHTML = `
    <div class="inicio-reporte-grupo">
      <h4>Por tipo de proceso</h4>
      <div class="inicio-reporte-fila"><span>📋 Licitación</span><strong>${porTipo.licitacion}</strong></div>
      <div class="inicio-reporte-fila"><span>⚡ Compra Ágil</span><strong>${porTipo.compra_agil}</strong></div>
    </div>
    <div class="inicio-reporte-grupo">
      <h4>Por canal de envío</h4>
      ${Object.entries(porCanal).map(([canal, cantidad]) => `
        <div class="inicio-reporte-fila"><span>${canal === 'telegram' ? '✈️ Telegram' : '✉️ Email'}</span><strong>${cantidad}</strong></div>
      `).join('')}
    </div>
  `;
}

function obtenerHistorialFiltrado() {
  const tipo = document.getElementById('filtroTipoHist').value;
  const montoDesde = Number(soloDigitos(filtroMontoHistInput.value)) || 0;
  const fechaDesde = document.getElementById('filtroFechaHist').value;
  const fechaEnvio = document.getElementById('filtroFechaEnvioHist').value;

  return historialData.filter(h => {
    if (tipo && h.tipo_proceso !== tipo) return false;
    if (montoDesde && (h.monto == null || h.monto < montoDesde)) return false;
    if (fechaDesde && (!h.fecha_cierre || fechaLocalISO(h.fecha_cierre) < fechaDesde)) return false;
    if (fechaEnvio && (!h.sent_at || fechaLocalISO(h.sent_at) !== fechaEnvio)) return false;
    return true;
  });
}

function renderHistorial() {
  const card = document.getElementById('historyCard');
  if (historialData.length === 0) {
    card.innerHTML = '<div class="empty-state">Todavía no se te ha enviado ninguna alerta.</div>';
    return;
  }

  const historialFiltrado = obtenerHistorialFiltrado();
  if (historialFiltrado.length === 0) {
    card.innerHTML = '<div class="empty-state">Ningún resultado con los filtros seleccionados.</div>';
    return;
  }

  const totalPaginas = Math.ceil(historialFiltrado.length / HISTORIAL_POR_PAGINA);
  if (historialPaginaActual > totalPaginas) historialPaginaActual = totalPaginas;
  const inicio = (historialPaginaActual - 1) * HISTORIAL_POR_PAGINA;
  const pagina = historialFiltrado.slice(inicio, inicio + HISTORIAL_POR_PAGINA);

  const filasHtml = pagina.map(h => `
    <div class="row">
      <div class="row-info">
        <div class="row-title">${h.tipo_proceso === 'compra_agil'
          ? `<a href="https://buscador.mercadopublico.cl/ficha?code=${encodeURIComponent(h.codigo_externo)}" target="_blank" rel="noopener noreferrer">${h.nombre || h.codigo_externo}</a>`
          : `<a href="http://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${encodeURIComponent(h.codigo_externo)}" target="_blank" rel="noopener noreferrer">${h.nombre || h.codigo_externo}</a>`
        }</div>
        <div class="row-meta">
          <span>${h.tipo_proceso === 'compra_agil' ? '⚡ Compra Ágil' : '📋 Licitación'}</span>
          <br>
          <span>Monto: ${formatMontoConTramo(h)}</span>
          <br>
          <span>Región: ${h.region}</span>
          <br>
          <span>Organismo: ${h.organismo}</span>
          <br>
          <span>Cierra: ${formatDate(h.fecha_cierre)}</span>
        </div>
      </div>
      <span class="tag ${h.canal === 'telegram' ? 'telegram' : ''}">${h.canal} · ${formatDate(h.sent_at)}</span>
    </div>
  `).join('');

  const mostrarPaginador = historialFiltrado.length > HISTORIAL_POR_PAGINA;
  const paginadorHtml = mostrarPaginador ? `
    <div class="paginador">
      <button type="button" class="btn btn-ghost" id="historialPrev" ${historialPaginaActual === 1 ? 'disabled' : ''}>‹ Anterior</button>
      <span class="paginador-info">Página ${historialPaginaActual} de ${totalPaginas}</span>
      <button type="button" class="btn btn-ghost" id="historialNext" ${historialPaginaActual === totalPaginas ? 'disabled' : ''}>Siguiente ›</button>
    </div>
  ` : '';

  card.innerHTML = filasHtml + paginadorHtml;

  if (mostrarPaginador) {
    document.getElementById('historialPrev').addEventListener('click', () => {
      historialPaginaActual--;
      renderHistorial();
    });
    document.getElementById('historialNext').addEventListener('click', () => {
      historialPaginaActual++;
      renderHistorial();
    });
  }
}

['filtroEstado', 'filtroMontoConfig', 'filtroRegionConfig', 'filtroCategoriaConfig'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    configsPaginaActual = 1;
    renderConfigs();
  });
});

['filtroTipoHist', 'filtroMontoHist', 'filtroFechaHist', 'filtroFechaEnvioHist'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    historialPaginaActual = 1;
    renderHistorial();
  });
});

document.getElementById('limpiarFiltroConfigBtn').addEventListener('click', () => {
  document.getElementById('filtroEstado').value = '';
  filtroMontoConfigInput.value = '';
  filtroRegionConfigSelect.value = '';
  document.getElementById('filtroCategoriaConfig').value = '';
  configsPaginaActual = 1;
  renderConfigs();
});

document.getElementById('limpiarFiltroHistBtn').addEventListener('click', () => {
  document.getElementById('filtroTipoHist').value = '';
  filtroMontoHistInput.value = '';
  document.getElementById('filtroFechaHist').value = '';
  document.getElementById('filtroFechaEnvioHist').value = '';
  historialPaginaActual = 1;
  renderHistorial();
});

document.querySelectorAll('.logout-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    sessionStorage.removeItem('token');
    window.location.href = 'login.html';
  });
});

// --- Navegación (sidebar desktop + bottom bar y menú superior en mobile) ---
const sectionLinks = document.querySelectorAll('[data-section]');
const secciones = {
  inicio: document.getElementById('secInicio'),
  alertas: document.getElementById('tabAlertas'),
  busquedas: document.getElementById('secBusquedas'),
  notificaciones: document.getElementById('tabNotificaciones'),
  analisis: document.getElementById('tabAnalisis'),
  ia: document.getElementById('secIA'),
  cuenta: document.getElementById('secCuenta'),
};

const bottombarMasBtn = document.getElementById('bottombarMasBtn');

function mostrarSeccion(nombre) {
  sectionLinks.forEach((l) => l.classList.toggle('active', l.dataset.section === nombre));
  Object.entries(secciones).forEach(([key, el]) => el.classList.toggle('active', key === nombre));
  bottombarMasBtn.classList.toggle('active', nombre === 'analisis' || nombre === 'ia');
}

sectionLinks.forEach((link) => {
  link.addEventListener('click', () => {
    mostrarSeccion(link.dataset.section);
    if (link.dataset.section === 'cuenta') poblarSeccionCuenta();
    topbarMenu.classList.remove('open');
    bottombarMasMenu.classList.remove('open');
  });
});

// --- Menú de identidad del top bar (mobile) ---
const topbarMenuBtn = document.getElementById('topbarMenuBtn');
const topbarMenu = document.getElementById('topbarMenu');

topbarMenuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  topbarMenu.classList.toggle('open');
});

// --- Hoja "Más" del bottom bar (mobile) ---
const bottombarMasMenu = document.getElementById('bottombarMasMenu');

bottombarMasBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  bottombarMasMenu.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (!topbarMenu.contains(e.target) && e.target !== topbarMenuBtn) {
    topbarMenu.classList.remove('open');
  }
  if (!bottombarMasMenu.contains(e.target) && e.target !== bottombarMasBtn) {
    bottombarMasMenu.classList.remove('open');
  }
});

// --- Modal de nueva alerta ---
const newAlertModal = document.getElementById('newAlertModal');

document.getElementById('abrirNuevaAlertaBtn').addEventListener('click', () => {
  // Chequeo previo en el cliente (el backend igual lo valida) para no dejar
  // abrir el formulario si ya no hay cupo — mejor feedback inmediato.
  const limites = obtenerLimitesPlanActual();
  const activasActuales = configsData.filter((c) => c.activo).length;
  if (limites && activasActuales >= limites.limiteAlertas) {
    showErrorAlertas(`Tu plan (${window.usuarioActual?.plan}) permite hasta ${limites.limiteAlertas} alerta${limites.limiteAlertas === 1 ? '' : 's'} activa${limites.limiteAlertas === 1 ? '' : 's'}. Pausa o elimina alguna antes de crear una nueva.`);
    return;
  }

  categoriasSeleccionadas = [];
  renderCategoriasChips();
  resetRegionDropdown();
  resetCategoriaSelector();
  document.getElementById('newAlertForm').reset();
  resetTramoDropdown();
  resetTipoProceso();
  resetOrganismos();
  newAlertModal.classList.add('open');
});
document.getElementById('cerrarNuevaAlertaBtn').addEventListener('click', () => {
  newAlertModal.classList.remove('open');
});
newAlertModal.addEventListener('click', (e) => {
  if (e.target === newAlertModal) newAlertModal.classList.remove('open');
});

// --- Análisis de datos ---
// Plan Full únicamente. TEMPORAL: se incluye 'trial' acá solo para poder probarlo
// durante desarrollo — sacar 'trial' de este array antes de lanzar a producción
// (el backend tiene el mismo criterio temporal en analisis.routes.js, hay que
// sacarlo de los dos lados a la vez).
const PLANES_CON_ANALISIS = ['full'];

function renderAnalisis(usuario) {
  const card = document.getElementById('analisisCard');
  const buscador = document.getElementById('analisisBuscar').closest('.field');

  if (!PLANES_CON_ANALISIS.includes(usuario.plan)) {
    buscador.style.display = 'none';
    card.innerHTML = `
      <div class="analisis-locked">
        <div class="lock-icon">🔒</div>
        <p><strong>Disponible en el plan Full</strong></p>
        <p style="font-size:13px; margin-top:6px;">Actualiza tu plan para acceder al análisis de datos de Mercado Público.</p>
      </div>
    `;
  }
}

// --- Buscador de categoría/producto para el análisis ---
const analisisBuscarInput = document.getElementById('analisisBuscar');
const analisisResultadosEl = document.getElementById('analisisResultados');
let analisisBuscarTimeout = null;

if (analisisBuscarInput) {
  analisisBuscarInput.addEventListener('input', () => {
    clearTimeout(analisisBuscarTimeout);
    const texto = analisisBuscarInput.value.trim();

    if (texto.length < 2) {
      analisisResultadosEl.classList.remove('open');
      return;
    }

    analisisBuscarTimeout = setTimeout(async () => {
      try {
        const data = await apiFetch(`/api/alerts/categorias/buscar?q=${encodeURIComponent(texto)}`);
        if (data.resultados.length === 0) {
          analisisResultadosEl.innerHTML = '<div class="categoria-resultado-vacio">Sin resultados</div>';
        } else {
          analisisResultadosEl.innerHTML = data.resultados.map((r) => `
            <div class="categoria-resultado-item" data-codigo="${r.codigo}" data-titulo="${r.titulo.replace(/"/g, '&quot;')}">
              <span>${r.titulo} <span class="nivel-badge ${r.nivel}">${r.nivel === 'categoria' ? 'Categoría' : r.nivel === 'obra' ? 'Obra' : 'Producto'}</span></span>
              <span class="cod">${r.codigo}</span>
            </div>
          `).join('');

          analisisResultadosEl.querySelectorAll('[data-codigo]').forEach((el) => {
            el.addEventListener('click', () => {
              analisisBuscarInput.value = el.dataset.titulo;
              analisisResultadosEl.classList.remove('open');
              codigoSeleccionadoAnalisis = el.dataset.codigo;
              tituloSeleccionadoAnalisis = el.dataset.titulo;
              renderSubTabAnalisisActiva();
            });
          });
        }
        analisisResultadosEl.classList.add('open');
      } catch (err) {
        console.warn('Error buscando categorías:', err.message);
      }
    }, 300);
  });

  document.addEventListener('click', (e) => {
    if (!analisisBuscarInput.contains(e.target) && !analisisResultadosEl.contains(e.target)) {
      analisisResultadosEl.classList.remove('open');
    }
  });
}

// --- Sub-pestañas de Análisis (Precios / Proveedores / Razones de rechazo) ---
let codigoSeleccionadoAnalisis = null;
let tituloSeleccionadoAnalisis = null;
let subTabAnalisisActiva = 'precios';

document.querySelectorAll('#analisisSubTabs .tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#analisisSubTabs .tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    subTabAnalisisActiva = btn.dataset.subtab;
    renderSubTabAnalisisActiva();
  });
});

function renderSubTabAnalisisActiva() {
  if (!codigoSeleccionadoAnalisis) return;
  if (subTabAnalisisActiva === 'precios') buscarPrecios(codigoSeleccionadoAnalisis, tituloSeleccionadoAnalisis);
  else if (subTabAnalisisActiva === 'proveedores') buscarProveedores(codigoSeleccionadoAnalisis, tituloSeleccionadoAnalisis);
  else if (subTabAnalisisActiva === 'organismos') buscarOrganismos(codigoSeleccionadoAnalisis, tituloSeleccionadoAnalisis);
  else if (subTabAnalisisActiva === 'rechazos') buscarRechazos(codigoSeleccionadoAnalisis, tituloSeleccionadoAnalisis);
}

let datosPreciosActuales = null; // { resumen, registros } sin filtrar, tal como llegó del backend

async function buscarPrecios(codigo, titulo) {
  const card = document.getElementById('analisisCard');
  card.innerHTML = '<div class="loading">Buscando...</div>';

  try {
    const data = await apiFetch(`/api/analisis/precios?codigo=${codigo}`);
    datosPreciosActuales = data;

    if (!data.resumen) {
      card.innerHTML = `<div class="empty-state">Todavía no hay historial de precios para "${titulo}". A medida que se resuelvan licitaciones y Compras Ágiles de esta categoría, van a ir apareciendo acá.</div>`;
      return;
    }

    construirVistaPrecios();
  } catch (err) {
    card.innerHTML = `<div class="empty-state">Error al buscar: ${err.message}</div>`;
  }
}

function aplicarFiltrosPrecios(registros) {
  const fuente = document.getElementById('filtroPrecioFuente')?.value || '';
  const resultado = document.getElementById('filtroPrecioResultado')?.value || '';
  const producto = (document.getElementById('filtroPrecioProducto')?.value || '').trim().toLowerCase();
  const organismo = (document.getElementById('filtroPrecioOrganismo')?.value || '').trim().toLowerCase();
  const proveedor = (document.getElementById('filtroPrecioProveedor')?.value || '').trim().toLowerCase();
  const fechaDesde = document.getElementById('filtroPrecioFechaDesde')?.value || '';
  const fechaHasta = document.getElementById('filtroPrecioFechaHasta')?.value || '';

  return registros.filter((r) => {
    if (fuente && r.fuente !== fuente) return false;
    // Las licitaciones siempre son "ganadas" por definición (no exponen perdedores).
    const gano = r.fuente === 'licitacion' ? true : !!r.gano;
    if (resultado === 'gano' && !gano) return false;
    if (resultado === 'nogano' && gano) return false;
    if (producto && !(r.nombre_producto || '').toLowerCase().includes(producto)) return false;
    if (organismo && !(r.organismo || '').toLowerCase().includes(organismo)) return false;
    if (proveedor && !(r.proveedor || '').toLowerCase().includes(proveedor)) return false;
    if (fechaDesde && (!r.fecha_adjudicacion || fechaLocalISO(r.fecha_adjudicacion) < fechaDesde)) return false;
    if (fechaHasta && (!r.fecha_adjudicacion || fechaLocalISO(r.fecha_adjudicacion) > fechaHasta)) return false;
    return true;
  });
}

// Se llama UNA vez por búsqueda: arma la barra de filtros + el contenedor de
// resultados, y engancha los listeners. Los inputs de filtro NUNCA se vuelven
// a reconstruir después de esto — si se reconstruyeran en cada tecla, perderían
// lo que el usuario ya escribió (justo el bug que estábamos viendo).
function construirVistaPrecios() {
  const card = document.getElementById('analisisCard');

  card.innerHTML = `
    <details class="analisis-filtros-toggle">
      <summary>Filtros</summary>
      <div class="analisis-filtros">
        <div class="field">
          <label for="filtroPrecioFuente">Fuente</label>
          <select id="filtroPrecioFuente">
            <option value="">Todas</option>
            <option value="licitacion">Licitación</option>
            <option value="compra_agil">Compra Ágil</option>
          </select>
        </div>
        <div class="field">
          <label for="filtroPrecioResultado">Resultado</label>
          <select id="filtroPrecioResultado">
            <option value="">Todos</option>
            <option value="gano">Ganó</option>
            <option value="nogano">No ganó</option>
          </select>
        </div>
        <div class="field">
          <label for="filtroPrecioProducto">Producto</label>
          <input type="text" id="filtroPrecioProducto" placeholder="Buscar...">
        </div>
        <div class="field">
          <label for="filtroPrecioOrganismo">Organismo</label>
          <input type="text" id="filtroPrecioOrganismo" placeholder="Buscar...">
        </div>
        <div class="field">
          <label for="filtroPrecioProveedor">Proveedor</label>
          <input type="text" id="filtroPrecioProveedor" placeholder="Buscar...">
        </div>
        <div class="field">
          <label for="filtroPrecioFechaDesde">Fecha desde</label>
          <input type="date" id="filtroPrecioFechaDesde">
        </div>
        <div class="field">
          <label for="filtroPrecioFechaHasta">Fecha hasta</label>
          <input type="date" id="filtroPrecioFechaHasta">
        </div>
        <div class="field field-btn">
          <button type="button" class="btn btn-ghost" id="limpiarFiltroPrecioBtn">✖ Limpiar filtros</button>
        </div>
      </div>
    </details>
    <div id="preciosResultados"></div>
  `;

  ['filtroPrecioFuente', 'filtroPrecioResultado', 'filtroPrecioProducto', 'filtroPrecioOrganismo', 'filtroPrecioProveedor', 'filtroPrecioFechaDesde', 'filtroPrecioFechaHasta'].forEach((id) => {
    document.getElementById(id).addEventListener('input', actualizarResultadosPrecios);
  });

  document.getElementById('limpiarFiltroPrecioBtn').addEventListener('click', () => {
    ['filtroPrecioFuente', 'filtroPrecioResultado', 'filtroPrecioProducto', 'filtroPrecioOrganismo', 'filtroPrecioProveedor', 'filtroPrecioFechaDesde', 'filtroPrecioFechaHasta'].forEach((id) => {
      document.getElementById(id).value = '';
    });
    actualizarResultadosPrecios();
  });

  actualizarResultadosPrecios();
}

// Esta sí se llama en cada cambio de filtro — solo toca #preciosResultados,
// nunca la barra de filtros, así que los inputs conservan el foco y lo escrito.
function actualizarResultadosPrecios() {
  const contenedor = document.getElementById('preciosResultados');
  const registrosFiltrados = aplicarFiltrosPrecios(datosPreciosActuales.registros);

  const precios = registrosFiltrados
    .map((r) => r.precio_unitario)
    .filter((p) => p !== null && p !== undefined)
    .map((p) => Number(p))
    .filter((p) => !Number.isNaN(p));
  const resumen = precios.length > 0 ? {
    cantidadRegistros: precios.length,
    precioMinimo: Math.min(...precios),
    precioMaximo: Math.max(...precios),
    precioPromedio: Math.round(precios.reduce((a, b) => a + b, 0) / precios.length),
  } : null;

  const filasHtml = registrosFiltrados.map((r) => {
    const resultadoHtml = r.fuente === 'licitacion'
      ? `🏆 Adjudicado${r.numero_oferentes ? ` <span class="row-meta">(${r.numero_oferentes} oferentes)</span>` : ''}`
      : r.gano
        ? '🟢 Ganó'
        // title = tooltip nativo del navegador — a diferencia de uno hecho con
        // CSS, no lo recorta el overflow-x:auto de la tabla ni depende de z-index.
        : `<span title="${(r.motivo_rechazo || 'Sin especificar').replace(/"/g, '&quot;')}" style="border-bottom: 1px dotted var(--text-muted); cursor: help;">⚪ No ganó</span>`;

    return `
      <tr>
        <td>${r.fuente === 'licitacion'
          ? (r.url_acta ? `<a href="${r.url_acta}" target="_blank" rel="noopener">📋 Licitación</a>` : '📋 Licitación')
          : '⚡ Compra Ágil'}</td>
        <td>${r.nombre_producto || '—'}</td>
        <td>${r.organismo || '—'}</td>
        <td>${r.proveedor || '—'}</td>
        <td>${formatMoney(r.precio_unitario)}</td>
        <td>${resultadoHtml}</td>
        <td>${r.fecha_adjudicacion ? new Date(r.fecha_adjudicacion).toLocaleDateString('es-CL') : '—'}</td>
      </tr>
    `;
  }).join('');

  contenedor.innerHTML = `
    <div style="padding: 20px; display: flex; gap: 24px; flex-wrap: wrap; border-bottom: 1px solid var(--border);">
      <div><div class="row-meta">Registros</div><strong style="font-size: 20px;">${resumen ? resumen.cantidadRegistros : 0}</strong></div>
      <div><div class="row-meta">Precio mínimo</div><strong style="font-size: 20px; color: var(--down);">${resumen ? formatMoney(resumen.precioMinimo) : '—'}</strong></div>
      <div><div class="row-meta">Precio promedio</div><strong style="font-size: 20px;">${resumen ? formatMoney(resumen.precioPromedio) : '—'}</strong></div>
      <div><div class="row-meta">Precio máximo</div><strong style="font-size: 20px; color: var(--danger);">${resumen ? formatMoney(resumen.precioMaximo) : '—'}</strong></div>
    </div>
    <div class="analisis-table-wrap">
      <table class="analisis-table">
        <thead>
          <tr>
            <th>Fuente</th>
            <th>Producto</th>
            <th>Organismo</th>
            <th>Proveedor</th>
            <th>Precio unit.</th>
            <th>Resultado</th>
            <th>Fecha Adjudicación</th>
          </tr>
        </thead>
        <tbody>${filasHtml || '<tr><td colspan="7" class="empty-state">Sin resultados para estos filtros.</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

let datosProveedoresActuales = null;

async function buscarProveedores(codigo, titulo) {
  const card = document.getElementById('analisisCard');
  card.innerHTML = '<div class="loading">Buscando...</div>';

  try {
    const data = await apiFetch(`/api/analisis/proveedores?codigo=${codigo}`);
    datosProveedoresActuales = data;

    if (data.ranking.length === 0) {
      card.innerHTML = `<div class="empty-state">Todavía no hay ganadores registrados para "${titulo}".</div>`;
      return;
    }

    construirVistaProveedores();
  } catch (err) {
    card.innerHTML = `<div class="empty-state">Error al buscar: ${err.message}</div>`;
  }
}

function construirVistaProveedores() {
  const card = document.getElementById('analisisCard');

  card.innerHTML = `
    <details class="analisis-filtros-toggle">
      <summary>Filtros</summary>
      <div class="analisis-filtros">
        <div class="field">
          <label for="filtroProveedorBuscar">Proveedor (nombre o RUT)</label>
          <input type="text" id="filtroProveedorBuscar" placeholder="Buscar...">
        </div>
        <div class="field">
          <label for="filtroProveedorMinVeces">Mínimo veces ganadas</label>
          <input type="number" id="filtroProveedorMinVeces" min="0" placeholder="0">
        </div>
        <div class="field field-btn">
          <button type="button" class="btn btn-ghost" id="limpiarFiltroProveedorBtn">✖ Limpiar filtros</button>
        </div>
      </div>
    </details>
    <div id="proveedoresResultados"></div>
  `;

  ['filtroProveedorBuscar', 'filtroProveedorMinVeces'].forEach((id) => {
    document.getElementById(id).addEventListener('input', actualizarResultadosProveedores);
  });

  document.getElementById('limpiarFiltroProveedorBtn').addEventListener('click', () => {
    ['filtroProveedorBuscar', 'filtroProveedorMinVeces'].forEach((id) => {
      document.getElementById(id).value = '';
    });
    actualizarResultadosProveedores();
  });

  actualizarResultadosProveedores();
}

function actualizarResultadosProveedores() {
  const contenedor = document.getElementById('proveedoresResultados');
  const buscar = (document.getElementById('filtroProveedorBuscar')?.value || '').trim().toLowerCase();
  const minVeces = Number(document.getElementById('filtroProveedorMinVeces')?.value || 0);

  const filtrados = datosProveedoresActuales.ranking.filter((p) => {
    if (buscar && !((p.nombreProveedor || '').toLowerCase().includes(buscar) || (p.rutProveedor || '').toLowerCase().includes(buscar))) return false;
    if (minVeces && p.vecesGanadas < minVeces) return false;
    return true;
  });

  const filasHtml = filtrados.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${p.nombreProveedor || '—'} <span class="row-meta">(${p.rutProveedor || '—'})</span></td>
      <td>${p.vecesGanadas}</td>
      <td>${p.licitaciones} licitación${p.licitaciones === 1 ? '' : 'es'} · ${p.compraAgil} Compra${p.compraAgil === 1 ? '' : 's'} Ágil</td>
      <td>${formatMoney(p.precioPromedio)}</td>
    </tr>
  `).join('');

  contenedor.innerHTML = `
    <div class="analisis-table-wrap">
      <table class="analisis-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Proveedor</th>
            <th>Veces ganadas</th>
            <th>Detalle</th>
            <th>Precio promedio</th>
          </tr>
        </thead>
        <tbody>${filasHtml || '<tr><td colspan="5" class="empty-state">Sin resultados para estos filtros.</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

let datosOrganismosActuales = null;

async function buscarOrganismos(codigo, titulo) {
  const card = document.getElementById('analisisCard');
  card.innerHTML = '<div class="loading">Buscando...</div>';

  try {
    const data = await apiFetch(`/api/analisis/organismos?codigo=${codigo}`);
    datosOrganismosActuales = data;

    if (data.ranking.length === 0) {
      card.innerHTML = `<div class="empty-state">Todavía no hay compras resueltas registradas para "${titulo}".</div>`;
      return;
    }

    construirVistaOrganismos();
  } catch (err) {
    card.innerHTML = `<div class="empty-state">Error al buscar: ${err.message}</div>`;
  }
}

function construirVistaOrganismos() {
  const card = document.getElementById('analisisCard');

  card.innerHTML = `
    <details class="analisis-filtros-toggle">
      <summary>Filtros</summary>
      <div class="analisis-filtros">
        <div class="field">
          <label for="filtroOrganismoBuscar">Organismo</label>
          <input type="text" id="filtroOrganismoBuscar" placeholder="Buscar...">
        </div>
        <div class="field">
          <label for="filtroOrganismoMinVeces">Mínimo veces comprado</label>
          <input type="number" id="filtroOrganismoMinVeces" min="0" placeholder="0">
        </div>
        <div class="field field-btn">
          <button type="button" class="btn btn-ghost" id="limpiarFiltroOrganismoBtn">✖ Limpiar filtros</button>
        </div>
      </div>
    </details>
    <div id="organismosResultados"></div>
  `;

  ['filtroOrganismoBuscar', 'filtroOrganismoMinVeces'].forEach((id) => {
    document.getElementById(id).addEventListener('input', actualizarResultadosOrganismos);
  });

  document.getElementById('limpiarFiltroOrganismoBtn').addEventListener('click', () => {
    ['filtroOrganismoBuscar', 'filtroOrganismoMinVeces'].forEach((id) => {
      document.getElementById(id).value = '';
    });
    actualizarResultadosOrganismos();
  });

  actualizarResultadosOrganismos();
}

function actualizarResultadosOrganismos() {
  const contenedor = document.getElementById('organismosResultados');
  const buscar = (document.getElementById('filtroOrganismoBuscar')?.value || '').trim().toLowerCase();
  const minVeces = Number(document.getElementById('filtroOrganismoMinVeces')?.value || 0);

  const filtrados = datosOrganismosActuales.ranking.filter((o) => {
    if (buscar && !(o.organismo || '').toLowerCase().includes(buscar)) return false;
    if (minVeces && o.vecesComprado < minVeces) return false;
    return true;
  });

  const filasHtml = filtrados.map((o, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${o.organismo}</td>
      <td>${o.vecesComprado}</td>
      <td>${o.licitaciones} licitación${o.licitaciones === 1 ? '' : 'es'} · ${o.compraAgil} Compra${o.compraAgil === 1 ? '' : 's'} Ágil</td>
      <td>${formatMoney(o.montoPromedio)}</td>
    </tr>
  `).join('');

  contenedor.innerHTML = `
    <div class="analisis-table-wrap">
      <table class="analisis-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Organismo</th>
            <th>Veces comprado</th>
            <th>Detalle</th>
            <th>Monto promedio</th>
          </tr>
        </thead>
        <tbody>${filasHtml || '<tr><td colspan="5" class="empty-state">Sin resultados para estos filtros.</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

let datosRechazosActuales = null;

async function buscarRechazos(codigo, titulo) {
  const card = document.getElementById('analisisCard');
  card.innerHTML = '<div class="loading">Buscando...</div>';

  try {
    const data = await apiFetch(`/api/analisis/rechazos?codigo=${codigo}`);
    datosRechazosActuales = data;

    if (data.totalRechazadas === 0) {
      card.innerHTML = `<div class="empty-state">Todavía no hay cotizaciones rechazadas registradas para "${titulo}".</div>`;
      return;
    }

    construirVistaRechazos();
  } catch (err) {
    card.innerHTML = `<div class="empty-state">Error al buscar: ${err.message}</div>`;
  }
}

function construirVistaRechazos() {
  const card = document.getElementById('analisisCard');

  card.innerHTML = `
    <details class="analisis-filtros-toggle">
      <summary>Filtros</summary>
      <div class="analisis-filtros">
        <div class="field">
          <label for="filtroRechazoBuscar">Buscar en la razón</label>
          <input type="text" id="filtroRechazoBuscar" placeholder="Ej. monto, plazo...">
        </div>
        <div class="field field-btn">
          <button type="button" class="btn btn-ghost" id="limpiarFiltroRechazoBtn">✖ Limpiar filtros</button>
        </div>
      </div>
    </details>
    <div id="rechazosResultados"></div>
  `;

  document.getElementById('filtroRechazoBuscar').addEventListener('input', actualizarResultadosRechazos);

  document.getElementById('limpiarFiltroRechazoBtn').addEventListener('click', () => {
    document.getElementById('filtroRechazoBuscar').value = '';
    actualizarResultadosRechazos();
  });

  actualizarResultadosRechazos();
}

function actualizarResultadosRechazos() {
  const contenedor = document.getElementById('rechazosResultados');
  const buscar = (document.getElementById('filtroRechazoBuscar')?.value || '').trim().toLowerCase();

  const razonesFiltradas = datosRechazosActuales.razones.filter((r) => !buscar || r.razon.toLowerCase().includes(buscar));

  const filasHtml = razonesFiltradas.map((r) => {
    const porcentaje = Math.round((r.cantidad / datosRechazosActuales.totalRechazadas) * 100);
    return `
      <tr>
        <td>${r.razon}</td>
        <td>${r.cantidad} <span class="row-meta">(${porcentaje}%)</span></td>
      </tr>
    `;
  }).join('');

  const mostrarSinRazon = !buscar && datosRechazosActuales.sinRazonEspecificada > 0;
  const filaSinRazon = mostrarSinRazon
    ? `<tr><td>Sin razón especificada</td><td>${datosRechazosActuales.sinRazonEspecificada}</td></tr>`
    : '';

  contenedor.innerHTML = `
    <div style="padding: 20px; border-bottom: 1px solid var(--border);">
      <div class="row-meta">Total de cotizaciones rechazadas (solo Compra Ágil — licitaciones no exponen a quienes pierden)</div>
      <strong style="font-size: 20px;">${datosRechazosActuales.totalRechazadas}</strong>
    </div>
    <div class="analisis-table-wrap">
      <table class="analisis-table">
        <thead>
          <tr>
            <th>Razón</th>
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>${filasHtml}${filaSinRazon || (filasHtml ? '' : '<tr><td colspan="2" class="empty-state">Sin resultados para este filtro.</td></tr>')}</tbody>
      </table>
    </div>
  `;
}

// --- Sección: Mi cuenta ---
const profileForm = document.getElementById('profileForm');
const passwordForm = document.getElementById('passwordForm');
const profileInfoMsg = document.getElementById('profileInfoMsg');
const passwordInfoMsg = document.getElementById('passwordInfoMsg');

function mostrarMensajeForm(el, mensaje, esExito) {
  el.textContent = mensaje;
  el.className = esExito ? 'form-note success' : 'form-note';
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

document.querySelectorAll('.toggle-password').forEach((toggleBtn) => {
  const targetInput = document.getElementById(toggleBtn.dataset.target);
  const iconEye = toggleBtn.querySelector('.icon-eye');
  const iconEyeOff = toggleBtn.querySelector('.icon-eye-off');

  toggleBtn.addEventListener('click', () => {
    const isHidden = targetInput.type === 'password';
    targetInput.type = isHidden ? 'text' : 'password';
    iconEye.style.display = isHidden ? 'none' : '';
    iconEyeOff.style.display = isHidden ? '' : 'none';
    toggleBtn.setAttribute('aria-pressed', String(isHidden));
    toggleBtn.setAttribute('aria-label', isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });
});

function poblarSeccionCuenta() {
  const u = window.usuarioActual;
  if (!u) return;
  document.getElementById('profileEmail').value = u.email || '';
  document.getElementById('profileNombre').value = u.nombre || '';
  document.getElementById('profileApellido').value = u.apellido || '';
  document.getElementById('profileTelefono').value = u.telefono || '';
  document.getElementById('profileNombreEmpresa').value = u.nombre_empresa || '';
  document.getElementById('profileRutEmpresa').value = formatearRut(u.rut_empresa);
  profileInfoMsg.style.display = 'none';
  passwordInfoMsg.style.display = 'none';
  passwordForm.reset();
}

// Celular chileno: +56 9 seguido de 8 dígitos (el "56" es opcional para
// aceptar también el número sin código de país, ej. "912345678").
const TELEFONO_REGEX = /^\+?56?9\d{8}$/;

function validarTelefono(telefonoCrudo) {
  const limpio = String(telefonoCrudo || '').replace(/[\s-]/g, '');
  return TELEFONO_REGEX.test(limpio);
}

profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('profileNombre').value.trim();
  const apellido = document.getElementById('profileApellido').value.trim();
  const telefonoInput = document.getElementById('profileTelefono');
  const telefono = telefonoInput.value.trim();

  if (telefono && !validarTelefono(telefono)) {
    mostrarMensajeForm(profileInfoMsg, 'El teléfono ingresado no es válido. Verifica el formato (ej. +56 9 1234 5678).', false);
    telefonoInput.focus();
    return;
  }

  try {
    const data = await apiFetch('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify({ nombre, apellido, telefono }),
    });
    window.usuarioActual = { ...window.usuarioActual, ...data.usuario };
    //document.getElementById('userInfo').textContent =
    //  `${nombre} ${apellido} · ${window.usuarioActual.nombre_empresa || window.usuarioActual.rut_empresa}`;
    mostrarMensajeForm(profileInfoMsg, 'Perfil actualizado correctamente.', true);
  } catch (err) {
    mostrarMensajeForm(profileInfoMsg, err.message, false);
  }
});

passwordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const passwordActual = document.getElementById('passwordActual').value;
  const passwordNueva = document.getElementById('passwordNueva').value;
  const passwordNuevaConfirmar = document.getElementById('passwordNuevaConfirmar').value;

  if (passwordNueva !== passwordNuevaConfirmar) {
    mostrarMensajeForm(passwordInfoMsg, 'Las contraseñas nuevas no coinciden.', false);
    return;
  }

  try {
    await apiFetch('/api/auth/me/password', {
      method: 'PUT',
      body: JSON.stringify({ passwordActual, passwordNueva }),
    });
    mostrarMensajeForm(passwordInfoMsg, 'Contraseña actualizada correctamente.', true);
    passwordForm.reset();
  } catch (err) {
    mostrarMensajeForm(passwordInfoMsg, err.message, false);
  }
});

cargarUsuario();
cargarRegiones();
cargarTramos();
cargarConfigs();
cargarHistorial();
