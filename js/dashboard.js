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

function showErrorNotificaciones(msg) {
  const el = document.getElementById('errorBannerNotificaciones');
  el.textContent = "❌ " + msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 6000);
}

function showErrorBusquedas(msg) {
  const el = document.getElementById('errorBannerBusquedas');
  el.textContent = "❌ " + msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 6000);
}

function showErrorBusquedasOp(msg) {
  const el = document.getElementById('errorBannerBusquedasOp');
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

const regionDropdownBtn = document.getElementById('regionDropdownBtn');
const regionDropdownPanel = document.getElementById('regionDropdownPanel');
const filtroRegionConfigSelect = document.getElementById('filtroRegionConfig');
const filtroRegionHistSelect = document.getElementById('filtroRegionHist');
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
            <span>${r.titulo} <span class="nivel-badge ${r.nivel}">${r.nivel === 'categoria' ? 'Rubro' : r.nivel === 'obra' ? 'Obra' : 'Producto'}</span></span>
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
      console.warn('Error buscando productos o rubros:', err.message);
    }
  }, 300);
});

document.addEventListener('click', (e) => {
  if (!categoriaBuscarInput.contains(e.target) && !categoriaResultadosEl.contains(e.target)) {
    categoriaResultadosEl.classList.remove('open');
  }
});

// --- Buscador de rubro/producto de SELECCIÓN ÚNICA, para los filtros de las
// tablas de Alertas y Notificaciones (misma lógica de búsqueda del modal de
// nueva alerta — /api/alerts/categorias/buscar — pero sin restringir a
// "producto": acá interesa poder filtrar tanto por rubro como por producto
// puntual, y sin chips: al elegir un resultado, el input se llena con el
// título elegido, listo para usarse en el filtro). Se instancia una vez por
// cada campo (Alertas y Notificaciones) más abajo.
function crearBuscadorCategoriaUnico(inputId, resultadosId, alCambiar) {
  const input = document.getElementById(inputId);
  const resultadosEl = document.getElementById(resultadosId);
  let seleccion = null; // { codigo, nivel } o null si no hay selección/no calza con el catálogo
  let timeout = null;

  input.addEventListener('input', () => {
    clearTimeout(timeout);
    seleccion = null;
    alCambiar(seleccion);
    const texto = input.value.trim();

    if (texto.length < 2) {
      resultadosEl.classList.remove('open');
      return;
    }

    timeout = setTimeout(async () => {
      try {
        const data = await apiFetch(`/api/alerts/categorias/buscar?q=${encodeURIComponent(texto)}`);
        resultadosEl.innerHTML = data.resultados.length === 0
          ? '<div class="categoria-resultado-vacio">Sin resultados</div>'
          : data.resultados.map((r) => `
              <div class="categoria-resultado-item" data-codigo="${r.codigo}" data-titulo="${r.titulo.replace(/"/g, '&quot;')}" data-nivel="${r.nivel}">
                <span>${r.titulo} <span class="nivel-badge ${r.nivel}">${r.nivel === 'categoria' ? 'Rubro' : r.nivel === 'obra' ? 'Obra' : 'Producto'}</span></span>
                <span class="cod">${r.codigo}</span>
              </div>
            `).join('');

        resultadosEl.querySelectorAll('[data-codigo]').forEach((el) => {
          el.addEventListener('click', () => {
            seleccion = { codigo: el.dataset.codigo, nivel: el.dataset.nivel };
            input.value = el.dataset.titulo;
            resultadosEl.classList.remove('open');
            alCambiar(seleccion);
          });
        });
        resultadosEl.classList.add('open');
      } catch (err) {
        console.warn('Error buscando rubro o producto:', err.message);
      }
    }, 300);
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !resultadosEl.contains(e.target)) {
      resultadosEl.classList.remove('open');
    }
  });

  return {
    limpiar() {
      seleccion = null;
      input.value = '';
      resultadosEl.classList.remove('open');
    },
  };
}

// Compara el código elegido en el filtro contra un código guardado (de una
// alerta o de una notificación): si el filtro es un PRODUCTO puntual, exige
// coincidencia exacta; si es un RUBRO, compara solo los primeros 6 dígitos
// (nivel de categoría UNSPSC), para que capture cualquier producto de ese
// rubro además del propio rubro. Simplificación: no expande la jerarquía
// completa vía el árbol de rubros (como sí hace el backend en matching.service.js),
// alcanza para un filtro rápido en pantalla.
function coincideConFiltroCategoria(codigoGuardado, filtroSeleccion) {
  if (!filtroSeleccion || !codigoGuardado) return true;
  if (filtroSeleccion.nivel === 'producto') return String(codigoGuardado) === filtroSeleccion.codigo;
  return String(codigoGuardado).slice(0, 6) === filtroSeleccion.codigo.slice(0, 6);
}

let filtroCategoriaConfigSeleccion = null;
const buscadorCategoriaConfig = crearBuscadorCategoriaUnico('filtroCategoriaConfig', 'filtroCategoriaConfigResultados', (sel) => {
  filtroCategoriaConfigSeleccion = sel;
  configsPaginaActual = 1;
  renderConfigs();
});

let filtroCategoriaHistSeleccion = null;
const buscadorCategoriaHist = crearBuscadorCategoriaUnico('filtroCategoriaHist', 'filtroCategoriaHistResultados', (sel) => {
  filtroCategoriaHistSeleccion = sel;
  historialPaginaActual = 1;
  renderHistorial();
});

// --- Factory genérico para el modal de "Nueva Búsqueda" ---
// El modal de "Nueva Alerta" ya tiene su propio selector de organismo hecho a
// mano (organismoBuscar...) — para no duplicar exactamente esa misma lógica
// una tercera vez, este factory generaliza el mismo patrón visual (buscador
// con autocompletado + chips) para poder instanciarlo también en el modal de
// búsquedas sin repetir código.

// Buscador con autocompletado + selección MÚLTIPLE en chips (mismo patrón que
// el organismoBuscar del modal de alertas, generalizado para reusarlo acá).
function crearBuscadorMultiple(inputId, resultadosId, chipsId, apiPath, { soloUno = false } = {}) {
  const input = document.getElementById(inputId);
  const resultadosEl = document.getElementById(resultadosId);
  const chipsEl = document.getElementById(chipsId);
  let seleccionados = [];
  let timeout = null;

  function renderChips() {
    chipsEl.innerHTML = seleccionados.map((o) => `
      <span class="categoria-chip" data-organismo="${o.replace(/"/g, '&quot;')}">
        ${o}
        <span class="quitar" data-quitar="${o.replace(/"/g, '&quot;')}">✕</span>
      </span>
    `).join('');
    chipsEl.querySelectorAll('[data-quitar]').forEach((el) => {
      el.addEventListener('click', () => {
        seleccionados = seleccionados.filter((o) => o !== el.dataset.quitar);
        renderChips();
      });
    });
  }

  input.addEventListener('input', () => {
    clearTimeout(timeout);
    const texto = input.value.trim();
    if (texto.length < 2) {
      resultadosEl.classList.remove('open');
      return;
    }
    timeout = setTimeout(async () => {
      try {
        const data = await apiFetch(`${apiPath}?q=${encodeURIComponent(texto)}`);
        const disponibles = data.resultados.filter((o) => !seleccionados.includes(o));
        resultadosEl.innerHTML = disponibles.length === 0
          ? '<div class="categoria-resultado-vacio">Sin resultados</div>'
          : disponibles.map((o) => `<div class="categoria-resultado-item" data-organismo="${o.replace(/"/g, '&quot;')}"><span>${o}</span></div>`).join('');

        resultadosEl.querySelectorAll('[data-organismo]').forEach((el) => {
          el.addEventListener('click', () => {
            seleccionados = soloUno ? [el.dataset.organismo] : [...seleccionados, el.dataset.organismo];
            renderChips();
            input.value = '';
            resultadosEl.classList.remove('open');
          });
        });
        resultadosEl.classList.add('open');
      } catch (err) {
        console.warn('Error buscando:', err.message);
      }
    }, 300);
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !resultadosEl.contains(e.target)) {
      resultadosEl.classList.remove('open');
    }
  });

  return {
    get: () => [...seleccionados],
    reset: () => { seleccionados = []; renderChips(); input.value = ''; },
  };
}

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
    filtroRegionHistSelect.innerHTML = '<option value="">Todas las regiones</option>' + opciones;
    busquedaRegionSelect.innerHTML = '<option value="">Todas las regiones</option>' + opciones;
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

// Combobox equivalente para vista mobile — .tipo-proceso-row se oculta y este
// <select> queda como único control visible, pero los checkboxes de arriba
// siguen siendo la fuente de verdad (toda la lógica de campos depende de ellos).
const tipoProcesoSelectEl = document.getElementById('tipoProcesoSelect');

function syncTipoProcesoSelectDesdeCheckboxes() {
  const lic = tipoProcesoLicitacionChk.checked;
  const agil = tipoProcesoCompraAgilChk.checked;
  tipoProcesoSelectEl.value = lic && agil ? 'ambas' : (agil ? 'compra_agil' : 'licitacion');
}

tipoProcesoSelectEl.addEventListener('change', () => {
  const val = tipoProcesoSelectEl.value;
  tipoProcesoLicitacionChk.checked = val !== 'compra_agil';
  tipoProcesoCompraAgilChk.checked = val !== 'licitacion';
  actualizarCamposSegunTipoProceso();
});

[tipoProcesoLicitacionChk, tipoProcesoCompraAgilChk].forEach((chk) => {
  chk.addEventListener('change', () => {
    if (!tipoProcesoLicitacionChk.checked && !tipoProcesoCompraAgilChk.checked) {
      chk.checked = true; // no se puede dejar los dos destildados
    }
    syncTipoProcesoSelectDesdeCheckboxes();
    actualizarCamposSegunTipoProceso();
  });
});

function resetTipoProceso() {
  tipoProcesoLicitacionChk.checked = true;
  tipoProcesoCompraAgilChk.checked = true;
  tipoProcesoSelectEl.value = 'ambas';
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
        console.warn('No se pudieron resolver las descripciones de rubros o productos:', err.message);
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
  const tipoProceso = document.getElementById('filtroTipoProcesoConfig').value;
  const region = filtroRegionConfigSelect.value;

  return configsData.filter(c => {
    if (estado && String(c.activo) !== estado) return false;
    // Una config sin tipos_proceso (o con ambos) monitorea licitaciones Y compras
    // ágiles — mismo criterio que formatearTipoProcesoTag: solo restringe si el
    // array tiene largo 1.
    if (tipoProceso && c.tipos_proceso && c.tipos_proceso.length === 1 && c.tipos_proceso[0] !== tipoProceso) return false;
    // Una alerta sin regiones (null/[]) monitorea TODAS las regiones, así que
    // también debe aparecer al filtrar por cualquier región específica.
    if (region && c.regiones && c.regiones.length > 0 && !c.regiones.includes(region)) return false;
    if (filtroCategoriaConfigSeleccion) {
      const coincide = (c.categorias || []).some(cod => coincideConFiltroCategoria(cod, filtroCategoriaConfigSeleccion));
      if (!coincide) return false;
    }
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
        <div class="row-title">${nombresCategorias.length ?  nombresCategorias.join(', ') : 'Todos los  rubros y productos'}</div>
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

// ============================================================
// --- Sección: Búsquedas ---
// ============================================================

const newBusquedaModal = document.getElementById('newBusquedaModal');
const busquedaRegionSelect = document.getElementById('busquedaRegionSelect');
const busquedaRutProveedorInput = document.getElementById('busquedaRutProveedor');
const busquedaTextoLibreInput = document.getElementById('busquedaTextoLibre');
const busquedaHorasRecientesInput = document.getElementById('busquedaHorasRecientes');
const busquedaCodigoLabelEl = document.getElementById('busquedaCodigoLabel');
const busquedaEstadosCACheckboxes = document.querySelectorAll('input[name="busquedaEstadoCA"]');

// Mismo formateo de RUT que ya usa la sección "Mi cuenta" (formatearRut, ver
// más arriba en este archivo), aplicado en vivo mientras el usuario escribe.
busquedaRutProveedorInput.addEventListener('input', () => {
  const cursorAlFinal = busquedaRutProveedorInput.selectionStart === busquedaRutProveedorInput.value.length;
  busquedaRutProveedorInput.value = formatearRut(busquedaRutProveedorInput.value);
  if (cursorAlFinal) busquedaRutProveedorInput.setSelectionRange(busquedaRutProveedorInput.value.length, busquedaRutProveedorInput.value.length);
});

const buscadorOrganismosBusqueda = crearBuscadorMultiple(
  'busquedaOrganismoBuscar', 'busquedaOrganismoResultados', 'busquedaOrganismosChips',
  '/api/alerts/organismos/buscar',
  { soloUno: true }
);

const busquedaTipoLicitacionRadio = document.getElementById('busquedaTipoLicitacion');
const busquedaTipoCompraAgilRadio = document.getElementById('busquedaTipoCompraAgil');
const busquedaModoRadios = document.querySelectorAll('input[name="busquedaModo"]');
const busquedaModoCompraAgilRadios = document.querySelectorAll('input[name="busquedaModoCompraAgil"]');
const busquedaModoFieldEl = document.getElementById('busquedaModoField');
const busquedaModoCompraAgilFieldEl = document.getElementById('busquedaModoCompraAgilField');
const busquedaCodigoFieldEl = document.getElementById('busquedaCodigoField');
const busquedaEstadoFieldEl = document.getElementById('busquedaEstadoField');
const busquedaRutProveedorFieldEl = document.getElementById('busquedaRutProveedorField');
//const busquedaFechaFieldEl = document.getElementById('busquedaFechaField');
const busquedaOrganismoFieldEl = document.getElementById('busquedaOrganismoField');
const busquedaOrganismoSmallEl = document.getElementById('busquedaOrganismoSmall');
const busquedaTextoLibreFieldEl = document.getElementById('busquedaTextoLibreField');
const busquedaRegionFieldEl = document.getElementById('busquedaRegionField');
const busquedaEstadosCompraAgilFieldEl = document.getElementById('busquedaEstadosCompraAgilField');
const busquedaHorasRecientesFieldEl = document.getElementById('busquedaHorasRecientesField');
const busquedaAvisoLimitacionEl = document.getElementById('busquedaAvisoLimitacion');

const AVISOS_LIMITACION = {
  codigo: 'Busca una licitación puntual.',
  estado_fecha: 'Busca licitaciones por estado.',
  proveedor: 'Busca licitaciones por proveedor (RUT).',
  organismo: 'Busca licitaciones por organismo comprador (nombre).',
};

function modoLicitacionSeleccionado() {
  return document.querySelector('input[name="busquedaModo"]:checked')?.value || 'codigo';
}
function modoCompraAgilSeleccionado() {
  return document.querySelector('input[name="busquedaModoCompraAgil"]:checked')?.value || 'codigo';
}

function actualizarCamposBusquedaSegunTipo() {
  const esCompraAgil = busquedaTipoCompraAgilRadio.checked;
  const modo = modoLicitacionSeleccionado();
  const modoCA = modoCompraAgilSeleccionado();

  // Grupo de "modo" según tipo — Licitaciones tiene 4 opciones excluyentes,
  // Compra Ágil solo 2 (su API sí combina texto/región/estado libremente).
  busquedaModoFieldEl.style.display = esCompraAgil ? 'none' : '';
  busquedaModoCompraAgilFieldEl.style.display = esCompraAgil ? '' : 'none';

  const modoActivo = esCompraAgil ? modoCA : modo;

  // 'codigo' es compartido entre los dos tipos (mismo campo, label distinto).
  busquedaCodigoFieldEl.style.display = (modoActivo === 'codigo') ? '' : 'none';
  busquedaCodigoLabelEl.innerHTML = esCompraAgil ? '<strong>Código de la Compra Ágil *</strong>' : '<strong>Código de la licitación *</strong>';
  document.getElementById('busquedaCodigoExterno').placeholder = esCompraAgil ? 'Ej: 1195-39-COT26' : 'Ej: 1509-5-L114';

  // Exclusivo de Licitaciones:
  busquedaEstadoFieldEl.style.display = (!esCompraAgil && modo === 'estado_fecha') ? '' : 'none';
  busquedaRutProveedorFieldEl.style.display = (!esCompraAgil && modo === 'proveedor') ? '' : 'none';
  //busquedaFechaFieldEl.style.display = (!esCompraAgil && modo !== 'codigo') ? '' : 'none';
  busquedaOrganismoFieldEl.style.display = (!esCompraAgil && modo === 'organismo') ? '' : 'none';
  busquedaOrganismoSmallEl.textContent = 'Elige una institución compradora.';

  // Exclusivo de Compra Ágil (modo 'listado'):
  const listadoCA = esCompraAgil && modoCA === 'listado';
  busquedaTextoLibreFieldEl.style.display = listadoCA ? '' : 'none';
  busquedaRegionFieldEl.style.display = listadoCA ? '' : 'none';
  busquedaEstadosCompraAgilFieldEl.style.display = listadoCA ? '' : 'none';
  busquedaHorasRecientesFieldEl.style.display = listadoCA ? '' : 'none';

  busquedaAvisoLimitacionEl.textContent = esCompraAgil ? '' : AVISOS_LIMITACION[modo];

  // Limpia lo que quede oculto, para no guardar un criterio que el usuario ya no ve.
  if (esCompraAgil) {
    busquedaRutProveedorInput.value = '';
    //busquedaFechaInput.value = '';
    if (modoCA !== 'organismo') buscadorOrganismosBusqueda.reset();
  } else {
    buscadorOrganismosBusqueda.reset();
  }
  if (!listadoCA) {
    busquedaTextoLibreInput.value = '';
    busquedaRegionSelect.value = '';
    busquedaHorasRecientesInput.value = '';
    busquedaEstadosCACheckboxes.forEach((chk) => { chk.checked = false; });
    [...busquedaEstadosCompraAgilSelectEl.options].forEach((opt) => { opt.selected = false; });
  }
}

const busquedaCodigoExternoInput = document.getElementById('busquedaCodigoExterno');
//const busquedaFechaInput = document.getElementById('busquedaFecha');

[busquedaTipoLicitacionRadio, busquedaTipoCompraAgilRadio, ...busquedaModoRadios, ...busquedaModoCompraAgilRadios].forEach((radio) => {
  radio.addEventListener('change', actualizarCamposBusquedaSegunTipo);
});

// Combobox equivalente para vista mobile — mismo patrón que tipoProcesoSelect:
// los radios de arriba siguen siendo la fuente de verdad, el <select> solo
// refleja y escribe su estado.
function vincularRadiosConSelect(radios, selectEl) {
  selectEl.addEventListener('change', () => {
    radios.forEach((r) => { r.checked = (r.value === selectEl.value); });
    actualizarCamposBusquedaSegunTipo();
  });
  radios.forEach((r) => {
    r.addEventListener('change', () => { if (r.checked) selectEl.value = r.value; });
  });
}

const busquedaTipoSelectEl = document.getElementById('busquedaTipoSelect');
const busquedaModoSelectEl = document.getElementById('busquedaModoSelect');
const busquedaModoCompraAgilSelectEl = document.getElementById('busquedaModoCompraAgilSelect');
vincularRadiosConSelect([busquedaTipoLicitacionRadio, busquedaTipoCompraAgilRadio], busquedaTipoSelectEl);
vincularRadiosConSelect([...busquedaModoRadios], busquedaModoSelectEl);
vincularRadiosConSelect([...busquedaModoCompraAgilRadios], busquedaModoCompraAgilSelectEl);

// Igual que vincularRadiosConSelect, pero para un grupo de checkboxes
// independientes (0 o más marcados) — el equivalente mobile es un <select multiple>.
function vincularCheckboxesConSelectMultiple(checkboxes, selectEl) {
  selectEl.addEventListener('change', () => {
    const seleccionados = new Set([...selectEl.selectedOptions].map((opt) => opt.value));
    checkboxes.forEach((c) => { c.checked = seleccionados.has(c.value); });
  });
  checkboxes.forEach((c) => {
    c.addEventListener('change', () => {
      [...selectEl.options].forEach((opt) => {
        opt.selected = [...checkboxes].some((chk) => chk.value === opt.value && chk.checked);
      });
    });
  });
}

const busquedaEstadosCompraAgilSelectEl = document.getElementById('busquedaEstadosCompraAgilSelect');
vincularCheckboxesConSelectMultiple([...busquedaEstadosCACheckboxes], busquedaEstadosCompraAgilSelectEl);

function resetFormularioBusqueda() {
  document.getElementById('newBusquedaForm').reset();
  buscadorOrganismosBusqueda.reset();
  busquedaTipoLicitacionRadio.checked = true;
  document.getElementById('busquedaModoCodigo').checked = true;
  document.getElementById('busquedaModoCACodigo').checked = true;
  busquedaTipoSelectEl.value = 'licitacion';
  busquedaModoSelectEl.value = 'codigo';
  busquedaModoCompraAgilSelectEl.value = 'codigo';
  actualizarCamposBusquedaSegunTipo();
  document.getElementById('errorBannerBusquedaModal').style.display = 'none';
}

// Espejo de src/utils/planes.js (backend) — igual que LIMITES_ALERTAS_POR_PLAN,
// solo para dar feedback inmediato antes de abrir el modal. El backend vuelve
// a validar esto en POST /api/busquedas de todas formas.
const LIMITES_BUSQUEDAS_POR_PLAN = { trial: 5, basico: 10, full: 20 };

document.getElementById('abrirNuevaBusquedaBtn').addEventListener('click', () => {
  const limite = LIMITES_BUSQUEDAS_POR_PLAN[window.usuarioActual?.plan];
  if (limite !== undefined && busquedasData.length >= limite) {
    showErrorBusquedas(`Tu plan (${window.usuarioActual?.plan}) permite guardar hasta ${limite} búsqueda${limite === 1 ? '' : 's'}. Elimina alguna antes de crear una nueva.`);
    return;
  }
  resetFormularioBusqueda();
  newBusquedaModal.classList.add('open');
});
document.getElementById('cerrarNuevaBusquedaBtn').addEventListener('click', () => {
  newBusquedaModal.classList.remove('open');
});
newBusquedaModal.addEventListener('click', (e) => {
  if (e.target === newBusquedaModal) newBusquedaModal.classList.remove('open');
});

document.getElementById('newBusquedaForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('crearBusquedaBtn');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  const nombre = document.getElementById('busquedaNombre').value.trim();
  const tipo = busquedaTipoCompraAgilRadio.checked ? 'compra_agil' : 'licitacion';
  const modo = tipo === 'compra_agil' ? modoCompraAgilSeleccionado() : modoLicitacionSeleccionado();
  const organismos = buscadorOrganismosBusqueda.get();

  const payload = { nombre, tipo, modo };

  if (tipo === 'licitacion') {
    //payload.fecha = busquedaFechaInput.value || null;
    if (modo === 'codigo') {
      payload.codigoExterno = busquedaCodigoExternoInput.value.trim();
    } else if (modo === 'estado_fecha') {
      payload.estado = document.getElementById('busquedaEstadoSelect').value;
    } else if (modo === 'proveedor') {
      payload.rutProveedor = busquedaRutProveedorInput.value.trim();
    } else if (modo === 'organismo') {
      if (organismos.length === 0) {
        mostrarErrorModalBusqueda('Elige un organismo para este modo de búsqueda.');
        btn.disabled = false;
        btn.textContent = '+ Guardar búsqueda';
        return;
      }
      payload.organismos = organismos;
    }
  } else if (modo === 'codigo') {
    payload.codigoExterno = busquedaCodigoExternoInput.value.trim();
  } else {
    payload.textoLibre = busquedaTextoLibreInput.value.trim() || null;
    payload.regiones = busquedaRegionSelect.value ? [busquedaRegionSelect.value] : [];
    payload.estados = [...busquedaEstadosCACheckboxes].filter((c) => c.checked).map((c) => c.value);
    payload.horasRecientes = busquedaHorasRecientesInput.value ? Number(busquedaHorasRecientesInput.value) : null;
  }

  if (!nombre) {
    mostrarErrorModalBusqueda('Debes ponerle un nombre a la búsqueda.');
    btn.disabled = false;
    btn.textContent = '+ Guardar búsqueda';
    return;
  }
  if ((tipo === 'licitacion' && modo === 'codigo' || tipo === 'compra_agil' && modo === 'codigo') && !payload.codigoExterno) {
    mostrarErrorModalBusqueda('Debes ingresar el código.');
    btn.disabled = false;
    btn.textContent = '+ Guardar búsqueda';
    return;
  }

  try {
    await apiFetch('/api/busquedas', { method: 'POST', body: JSON.stringify(payload) });
    newBusquedaModal.classList.remove('open');
    cargarBusquedas();
  } catch (err) {
    mostrarErrorModalBusqueda(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '+ Guardar búsqueda';
  }
});

function mostrarErrorModalBusqueda(mensaje) {
  const el = document.getElementById('errorBannerBusquedaModal');
  el.textContent = '❌ ' + mensaje;
  el.style.display = 'block';
}

let busquedasData = [];

const BUSQUEDAS_POR_PAGINA = 10;
let busquedasPaginaActual = 1;

async function cargarBusquedas() {
  const card = document.getElementById('busquedasCard');
  try {
    const data = await apiFetch('/api/busquedas');
    busquedasData = data.busquedas;
    busquedasPaginaActual = 1;
    renderBusquedas();
  } catch (err) {
    card.innerHTML = `<div class="empty-state">Error al cargar: ${err.message}</div>`;
  }
}

function etiquetaTipoBusqueda(tipo) {
  return tipo === 'compra_agil' ? '⚡ Compra Ágil' : '📋 Licitación';
}

const ETIQUETAS_MODO = {
  codigo: 'Por código',
  estado_fecha: 'Por estado',
  proveedor: 'Por proveedor',
  organismo: 'Por organismo',
  listado: 'Por texto/región/estado',
};

const ETIQUETAS_ESTADO_BUSQUEDA = {
  todos: 'Todos los estados', publicada: 'Publicada', cerrada: 'Cerrada',
  desierta: 'Desierta', adjudicada: 'Adjudicada', revocada: 'Revocada', suspendida: 'Suspendida',
  cancelada: 'Cancelada',
};

// Arma la línea de detalle de una búsqueda guardada según su tipo/modo — cada
// combinación tiene un conjunto de campos totalmente distinto (ver migraciones 033/034).
function describirBusquedaEnFila(b) {
  const fechaTexto = b.fecha ? formatDate(b.fecha).split(',')[0] : 'Hoy (al ejecutar)';

  if (b.tipo === 'compra_agil') {
    if (b.modo === 'codigo') return `<br><span>Código: ${b.codigo_externo}</span>`;
    const partes = [];
    if (b.texto_libre) partes.push(`<br><span>Texto: "${b.texto_libre}"</span>`);
    partes.push(formatearRegionesTag(b.regiones));
    if (b.estados && b.estados.length > 0) {
      partes.push(`<br><span>Estado: ${b.estados.map((e) => ETIQUETAS_ESTADO_BUSQUEDA[e] || e).join(', ')}</span>`);
    }
    if (b.horas_recientes) partes.push(`<br><span>Últimas ${b.horas_recientes}h</span>`);
    return partes.join('');
  }

  if (b.modo === 'codigo') return `<br><span>Código: ${b.codigo_externo}</span>`;
  if (b.modo === 'estado_fecha') return `<br><span>Estado: ${ETIQUETAS_ESTADO_BUSQUEDA[b.estado] || b.estado}</span><br><span>Fecha: ${fechaTexto}</span>`;
  if (b.modo === 'proveedor') return `<br><span>Proveedor RUT: ${b.rut_proveedor}</span><br><span>Fecha: ${fechaTexto}</span>`;
  if (b.modo === 'organismo') return `${formatearOrganismosTag(b.organismos)}<br><span>Fecha: ${fechaTexto}</span>`;
  return '';
}

function renderBusquedas() {
  const card = document.getElementById('busquedasCard');
  if (busquedasData.length === 0) {
    card.innerHTML = '<div class="empty-state">Todavía no tienes búsquedas guardadas. Crea una arriba.</div>';
    return;
  }

  const totalPaginas = Math.ceil(busquedasData.length / BUSQUEDAS_POR_PAGINA);
  if (busquedasPaginaActual > totalPaginas) busquedasPaginaActual = totalPaginas;
  const inicio = (busquedasPaginaActual - 1) * BUSQUEDAS_POR_PAGINA;
  const pagina = busquedasData.slice(inicio, inicio + BUSQUEDAS_POR_PAGINA);

  const filasHtml = pagina.map((b) => `
    <div class="row" data-busqueda-id="${b.id}">
      <div class="row-info">
        <div class="row-title">${b.nombre}</div>
        <div class="row-meta">
          <span>${etiquetaTipoBusqueda(b.tipo)}</span>
          <span>${ETIQUETAS_MODO[b.modo] || b.modo}</span>
          ${describirBusquedaEnFila(b)}
        </div>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-ghost" data-ejecutar="${b.id}">▶ Ejecutar</button>
        <button class="btn btn-danger" data-eliminar-busqueda="${b.id}">✖ Eliminar</button>
      </div>
    </div>
  `).join('');

  const mostrarPaginador = busquedasData.length > BUSQUEDAS_POR_PAGINA;
  const paginadorHtml = mostrarPaginador ? `
    <div class="paginador">
      <button type="button" class="btn btn-ghost" id="busquedasPrev" ${busquedasPaginaActual === 1 ? 'disabled' : ''}>‹ Anterior</button>
      <span class="paginador-info">Página ${busquedasPaginaActual} de ${totalPaginas}</span>
      <button type="button" class="btn btn-ghost" id="busquedasNext" ${busquedasPaginaActual === totalPaginas ? 'disabled' : ''}>Siguiente ›</button>
    </div>
  ` : '';

  card.innerHTML = filasHtml + paginadorHtml;

  if (mostrarPaginador) {
    document.getElementById('busquedasPrev').addEventListener('click', () => {
      busquedasPaginaActual--;
      renderBusquedas();
    });
    document.getElementById('busquedasNext').addEventListener('click', () => {
      busquedasPaginaActual++;
      renderBusquedas();
    });
  }

  card.querySelectorAll('.regiones-toggle').forEach((el) => {
    el.addEventListener('click', () => {
      const expandido = el.classList.toggle('expandido');
      el.innerHTML = expandido ? el.dataset.completo : el.dataset.resumen;
    });
  });

  card.querySelectorAll('[data-eliminar-busqueda]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const confirmado = await confirmDialog('¿Eliminar esta búsqueda guardada?');
      if (!confirmado) return;
      try {
        await apiFetch(`/api/busquedas/${btn.dataset.eliminarBusqueda}`, { method: 'DELETE' });
        cargarBusquedas();
      } catch (err) { showErrorBusquedas(err.message); }
    });
  });

  card.querySelectorAll('[data-ejecutar]').forEach((btn) => {
    btn.addEventListener('click', () => ejecutarBusquedaGuardada(btn.dataset.ejecutar, btn));
  });
}

let ultimoResultadoBusqueda = null; // { busqueda, tipo, modo, resultados, paginacion? } — para el export a PDF
let ultimaBusquedaIdEjecutada = null; // para poder pedir la página siguiente sin re-clickear "Ejecutar"

const BUSQUEDA_RESULTADOS_POR_PAGINA = 10;
let busquedaResultadosPaginaActual = 1;

// Compra Ágil en modo 'listado' pagina de verdad contra la API (ver
// busqueda-ejecutor.service.js) — acá NO se cortan resultados en el cliente,
// cada "página" ya viene lista desde el backend. Para el resto (Licitaciones,
// y Compra Ágil modo 'codigo', que trae 1 solo resultado) se sigue paginando
// en el cliente como antes, sobre el array completo ya traído.
function esPaginacionServidor(data) {
  return data.tipo === 'compra_agil' && data.modo === 'listado' && data.paginacion;
}

const buscandoModal = document.getElementById('buscandoModal');

async function ejecutarBusquedaGuardada(id, btn, numeroPagina = 1) {
  const textoOriginal = btn ? btn.textContent : null;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Buscando...';
  }
  buscandoModal.classList.add('open');

  const wrap = document.getElementById('busquedaResultadosWrap');

  try {
    const data = await apiFetch(`/api/busquedas/${id}/ejecutar`, {
      method: 'POST',
      body: JSON.stringify({ numeroPagina }),
    });
    ultimoResultadoBusqueda = data;
    ultimaBusquedaIdEjecutada = id;
    busquedaResultadosPaginaActual = 1;

    document.getElementById('busquedaResultadosTitulo').textContent = `Resultados — ${data.busqueda.nombre}`;
    wrap.style.display = '';
    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });

    renderResultadosBusqueda(data);
  } catch (err) {
    showErrorBusquedas(err.message);
  } finally {
    buscandoModal.classList.remove('open');
    if (btn) {
      btn.disabled = false;
      btn.textContent = textoOriginal;
    }
  }
}

function urlFichaLicitacion(codigoExterno) {
  return `http://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${encodeURIComponent(codigoExterno)}`;
}
function urlFichaCompraAgil(codigoExterno) {
  return `https://buscador.mercadopublico.cl/ficha?code=${encodeURIComponent(codigoExterno)}`;
}

function urlFichaProveedor(rutProveedor){
  return `https://proveedor.mercadopublico.cl/ficha/${encodeURIComponent(rutProveedor)}`;
}

function urlFichaComprador(rutComprador){
  return `https://comprador.mercadopublico.cl/ficha/${encodeURIComponent(rutComprador)}`;
}

function filaResultadoHtml(r, tipo) {
  return `
    <div class="row">
      <div class="row-info">
        <div class="row-title">
          <a href="${tipo === 'compra_agil' ? urlFichaCompraAgil(r.codigo_externo) : urlFichaLicitacion(r.codigo_externo)}" target="_blank" rel="noopener noreferrer" style="font-size:13px;">${r.nombre || r.codigo_externo} ↗</a>
        </div>
        <div class="row-meta">
          <span>${etiquetaTipoBusqueda(tipo)}</span>
          <br>
          <span>Código: ${r.codigo_externo}</span>
          <br><span>Estado: ${r.estado || 'Desconocido'}</span>
          <br><span>Cierra: ${formatDate(r.fecha_cierre)}</span>
        </div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          ${botonesOportunidadHtml(tipo, r.codigo_externo, r.nombre, "busqueda")}
        </div>
      </div>
    </div>
  `;
}

function renderResultadosBusqueda(data) {
  const card = document.getElementById('busquedaResultadosCard');
  const { tipo, resultados } = data;

  if (resultados.length === 0) {
    card.innerHTML = '<div class="empty-state">Sin resultados para esta búsqueda en este momento.</div>';
    return;
  }

  if (esPaginacionServidor(data)) {
    // Paginación real: cada página ya viene completa desde el backend — se
    // muestra tal cual, sin recortar de nuevo en el cliente.
    const { numero_pagina, total_paginas, total_resultados } = data.paginacion;
    const filasHtml = resultados.map((r) => filaResultadoHtml(r, tipo)).join('');
    const paginadorHtml = total_paginas > 1 ? `
      <div class="paginador">
        <button type="button" class="btn btn-ghost" id="busquedaResultadosPrev" ${numero_pagina === 1 ? 'disabled' : ''}>‹ Anterior</button>
        <span class="paginador-info">Página ${numero_pagina} de ${total_paginas} (${total_resultados} resultados)</span>
        <button type="button" class="btn btn-ghost" id="busquedaResultadosNext" ${numero_pagina === total_paginas ? 'disabled' : ''}>Siguiente ›</button>
      </div>
    ` : `<div class="paginador-info" style="padding:8px 0;">${total_resultados} resultado${total_resultados === 1 ? '' : 's'}</div>`;

    card.innerHTML = filasHtml + paginadorHtml;

    if (numero_pagina > 1) {
      document.getElementById('busquedaResultadosPrev').addEventListener('click', () => {
        ejecutarBusquedaGuardada(ultimaBusquedaIdEjecutada, null, numero_pagina - 1);
      });
    }
    if (numero_pagina < total_paginas) {
      document.getElementById('busquedaResultadosNext').addEventListener('click', () => {
        // Al llegar al final de lo cargado, se lanza la consulta pidiendo la
        // página siguiente REAL de la API (no hay más que cortar localmente).
        ejecutarBusquedaGuardada(ultimaBusquedaIdEjecutada, null, numero_pagina + 1);
      });
    }
    return;
  }

  // Sin paginación real de la API (Licitaciones, o Compra Ágil modo 'codigo')
  // — se pagina en el cliente sobre el array completo ya traído, como antes.
  const totalPaginas = Math.ceil(resultados.length / BUSQUEDA_RESULTADOS_POR_PAGINA);
  if (busquedaResultadosPaginaActual > totalPaginas) busquedaResultadosPaginaActual = totalPaginas;
  const inicio = (busquedaResultadosPaginaActual - 1) * BUSQUEDA_RESULTADOS_POR_PAGINA;
  const pagina = resultados.slice(inicio, inicio + BUSQUEDA_RESULTADOS_POR_PAGINA);

  const filasHtml = pagina.map((r) => filaResultadoHtml(r, tipo)).join('');

  const mostrarPaginador = resultados.length > BUSQUEDA_RESULTADOS_POR_PAGINA;
  const paginadorHtml = mostrarPaginador ? `
    <div class="paginador">
      <button type="button" class="btn btn-ghost" id="busquedaResultadosPrev" ${busquedaResultadosPaginaActual === 1 ? 'disabled' : ''}>‹ Anterior</button>
      <span class="paginador-info">Página ${busquedaResultadosPaginaActual} de ${totalPaginas}</span>
      <button type="button" class="btn btn-ghost" id="busquedaResultadosNext" ${busquedaResultadosPaginaActual === totalPaginas ? 'disabled' : ''}>Siguiente ›</button>
    </div>
  ` : '';

  card.innerHTML = filasHtml + paginadorHtml;

  if (mostrarPaginador) {
    document.getElementById('busquedaResultadosPrev').addEventListener('click', () => {
      busquedaResultadosPaginaActual--;
      renderResultadosBusqueda(data);
    });
    document.getElementById('busquedaResultadosNext').addEventListener('click', () => {
      busquedaResultadosPaginaActual++;
      renderResultadosBusqueda(data);
    });
  }
}

// --- Exportar PDF (liviano — jsPDF + autotable vía CDN, se genera en el
// navegador, sin pedirle nada al backend). Al comienzo de la página 1 van los
// filtros con los que se armó la búsqueda, y después la tabla de resultados.
// Nota: si la búsqueda tiene más páginas de resultados en el servidor
// (Compra Ágil modo 'listado'), el PDF solo incluye la página actualmente
// cargada en pantalla — no descarga todas las páginas de golpe. ---
function describirCriteriosBusqueda(b) {
  const partes = [];
  partes.push(['Tipo de búsqueda', etiquetaTipoBusqueda(b.tipo)]);
  partes.push(['Modo de búsqueda', ETIQUETAS_MODO[b.modo] || b.modo]);

  if (b.tipo === 'compra_agil') {
    if (b.modo === 'codigo') {
      partes.push(['Código', b.codigo_externo]);
      return partes;
    }
    partes.push(['Texto libre', b.texto_libre || '—']);
    partes.push(['Región', b.regiones && b.regiones.length > 0 ? b.regiones.join(', ') : 'Todas']);
    partes.push(['Estado', b.estados && b.estados.length > 0 ? b.estados.map((e) => ETIQUETAS_ESTADO_BUSQUEDA[e] || e).join(', ') : 'Todos']);
    partes.push(['Nuevas en las últimas', b.horas_recientes ? `${b.horas_recientes} horas` : '—']);
    return partes;
  }

  const fechaTexto = b.fecha ? formatDate(b.fecha).split(',')[0] : 'Hoy (al momento de ejecutar)';
  if (b.modo === 'codigo') partes.push(['Código', b.codigo_externo]);
  if (b.modo === 'estado_fecha') {
    partes.push(['Estado', ETIQUETAS_ESTADO_BUSQUEDA[b.estado] || b.estado]);
    partes.push(['Fecha', fechaTexto]);
  }
  if (b.modo === 'proveedor') {
    partes.push(['RUT proveedor', b.rut_proveedor]);
    partes.push(['Fecha', fechaTexto]);
  }
  if (b.modo === 'organismo') {
    partes.push(['Organismo', b.organismos && b.organismos.length > 0 ? b.organismos.join(', ') : '—']);
    partes.push(['Fecha', fechaTexto]);
  }
  return partes;
}

document.getElementById('descargarPdfBtn').addEventListener('click', () => {
  if (!ultimoResultadoBusqueda) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });
  const { busqueda, resultados } = ultimoResultadoBusqueda;

  doc.setFontSize(14);
  doc.text(`Búsqueda: ${busqueda.nombre}`, 40, 40);
  doc.setFontSize(9);
  doc.text(`Generado el ${new Date().toLocaleString('es-CL')}`, 40, 56);

  doc.autoTable({
    startY: 70,
    head: [['Filtro', 'Valor']],
    body: describirCriteriosBusqueda(busqueda),
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [30, 30, 40] },
    columnStyles: { 0: { cellWidth: 130, fontStyle: 'bold' } },
    margin: { left: 40, right: 40 },
  });

  const siguienteY = doc.lastAutoTable.finalY + 14;

  doc.autoTable({
    startY: siguienteY,
    head: [['Nombre', 'Código', 'Estado', 'Cierre']],
    body: resultados.map((r) => [r.nombre || '', r.codigo_externo || '', r.estado || '—', formatDate(r.fecha_cierre)]),
    theme: 'striped',
    styles: { fontSize: 7.5, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [30, 30, 40] },
    margin: { left: 40, right: 40 },
  });

  const nombreArchivo = `busqueda-${busqueda.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}.pdf`;
  doc.save(nombreArchivo);
});

// ============================================================
// --- Sección: Oportunidades (recordatorios + seguimiento) ---
// ============================================================

// Botones que aparecen en cada fila de Notificaciones y de resultados de
// Búsquedas — "Seguir" solo tiene sentido para Licitaciones (ver diseño:
// Compra Ágil tiene un ciclo de vida demasiado corto para que valga la pena
// avisar en cada cambio de estado intermedio).
function botonesOportunidadHtml(tipoProceso, codigoExterno, nombre, origen) {
  const nombreEscapado = (nombre || codigoExterno || '').replace(/"/g, '&quot;');
  let html = `<button data-from="${origen}" type="button" class="btn btn-ghost" data-recordatorio-tipo="${tipoProceso}" data-recordatorio-codigo="${codigoExterno}" data-recordatorio-nombre="${nombreEscapado}">🔔 Recordarme</button>`;
  if (tipoProceso === 'licitacion') {
    html += ` <button data-from="${origen}" type="button" class="btn btn-ghost" data-seguir-codigo="${codigoExterno}" data-seguir-nombre="${nombreEscapado}">➕ Seguir</button>`;
  }
  return html;
}

const HORAS_RECORDATORIO = {
  licitacion: [
    { horas: 24, etiqueta: '1 día antes del cierre' },
    { horas: 72, etiqueta: '3 días antes del cierre' },
    { horas: 168, etiqueta: '1 semana antes del cierre' },
  ],
  compra_agil: [
    { horas: 2, etiqueta: '2 horas antes del cierre' },
    { horas: 6, etiqueta: '6 horas antes del cierre' },
    { horas: 12, etiqueta: '12 horas antes del cierre' },
  ],
};

const agregarRecordatorioModal = document.getElementById('agregarRecordatorioModal');
let recordatorioPendiente = null; // { tipoProceso, codigoExterno }

function abrirModalRecordatorio(tipoProceso, codigoExterno, nombre) {
  recordatorioPendiente = { tipoProceso, codigoExterno };
  document.getElementById('agregarRecordatorioNombre').textContent = nombre || codigoExterno;

  const select = document.getElementById('agregarRecordatorioHoras');
  select.innerHTML = HORAS_RECORDATORIO[tipoProceso].map((o) => `<option value="${o.horas}">${o.etiqueta}</option>`).join('');

  document.getElementById('errorBannerRecordatorioModal').style.display = 'none';
  agregarRecordatorioModal.classList.add('open');
}

document.getElementById('cerrarAgregarRecordatorioBtn').addEventListener('click', () => {
  agregarRecordatorioModal.classList.remove('open');
});
agregarRecordatorioModal.addEventListener('click', (e) => {
  if (e.target === agregarRecordatorioModal) agregarRecordatorioModal.classList.remove('open');
});

document.getElementById('confirmarAgregarRecordatorioBtn').addEventListener('click', async () => {
  if (!recordatorioPendiente) return;
  const btn = document.getElementById('confirmarAgregarRecordatorioBtn');
  const horasAntes = Number(document.getElementById('agregarRecordatorioHoras').value);

  btn.disabled = true;
  btn.textContent = 'Guardando...';
  try {
    await apiFetch('/api/oportunidades/recordatorios', {
      method: 'POST',
      body: JSON.stringify({ ...recordatorioPendiente, horasAntes }),
    });
    agregarRecordatorioModal.classList.remove('open');
    if (typeof cargarOportunidades === 'function') cargarOportunidades();
  } catch (err) {
    const el = document.getElementById('errorBannerRecordatorioModal');
    el.textContent = '❌ ' + err.message;
    el.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = '🔔 Guardar recordatorio';
  }
});

// Delegación de eventos: los botones "Recordarme"/"Seguir" aparecen en varias
// listas (Notificaciones, resultados de Búsquedas) que se re-renderizan
// seguido — más simple engancharlos una sola vez acá que re-atarlos cada vez.
document.addEventListener('click', async (e) => {
  const btnRecordatorio = e.target.closest('[data-recordatorio-codigo]');
  if (btnRecordatorio) {
    abrirModalRecordatorio(btnRecordatorio.dataset.recordatorioTipo, btnRecordatorio.dataset.recordatorioCodigo, btnRecordatorio.dataset.recordatorioNombre);
    return;
  }

  const btnSeguir = e.target.closest('[data-seguir-codigo]');
  if (btnSeguir) {
    btnSeguir.disabled = true;
    btnSeguir.textContent = 'Agregando...';
    try {
      await apiFetch('/api/oportunidades/seguimientos', {
        method: 'POST',
        body: JSON.stringify({ codigoExterno: btnSeguir.dataset.seguirCodigo }),
      });
      btnSeguir.textContent = '✓ Siguiendo';
      if (typeof cargarOportunidades === 'function') cargarOportunidades();
    } catch (err) {
      btnSeguir.disabled = false;
      btnSeguir.textContent = '➕ Seguir';
      if(btnSeguir.dataset.from === 'notificaciones'){
        showErrorNotificaciones(err.message);
      }else{
        showErrorBusquedasOp(err.message);
      }
    }
  }
});

// --- Listado dentro de "Oportunidades" ---
let recordatoriosData = [];
let seguimientosData = [];
let oportunidadesSubtabActiva = 'recordatorios';

document.querySelectorAll('#oportunidadesSubTabs .tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#oportunidadesSubTabs .tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    oportunidadesSubtabActiva = btn.dataset.subtab;
    renderOportunidadesActiva();
  });
});

async function cargarOportunidades() {
  const card = document.getElementById('oportunidadesCard');
  try {
    const [recordatoriosRes, seguimientosRes] = await Promise.all([
      apiFetch('/api/oportunidades/recordatorios'),
      apiFetch('/api/oportunidades/seguimientos'),
    ]);
    recordatoriosData = recordatoriosRes.recordatorios;
    seguimientosData = seguimientosRes.seguimientos;
    renderOportunidadesActiva();
  } catch (err) {
    card.innerHTML = `<div class="empty-state">Error al cargar: ${err.message}</div>`;
  }
}

function renderOportunidadesActiva() {
  if (oportunidadesSubtabActiva === 'recordatorios') renderRecordatorios();
  else renderSeguimientos();
}

function renderRecordatorios() {
  const card = document.getElementById('oportunidadesCard');
  if (recordatoriosData.length === 0) {
    card.innerHTML = '<div class="empty-state">Todavía no tienes recordatorios de cierre. Agrégalos desde Notificaciones o Búsquedas con el botón "🔔 Recordarme".</div>';
    return;
  }

  card.innerHTML = recordatoriosData.map((r) => `
    <div class="row">
      <div class="row-info">
        <div class="row-title">${r.nombre || r.codigo_externo}</div>
        <div class="row-meta">
          <span>${r.tipo_proceso === 'compra_agil' ? '⚡ Compra Ágil' : '📋 Licitación'}</span>
          <br><span>Código: ${r.codigo_externo}</span>
          <br><span>Organismo: ${r.organismo || 'No especificado'}</span>
          <br><span>Monto: ${r.monto != null ? formatMoney(r.monto) : 'No especificado'}</span>
          <br><span>Cierra: ${formatDate(r.fecha_cierre)}</span>
          <br><span>Avisa: ${r.horas_antes}h antes del cierre</span>
          <br><span>${r.notificado_at ? `✅ Avisado el ${formatDate(r.notificado_at)}` : '⏳ Pendiente de avisar'}</span>
        </div>
      </div>
      <button class="btn btn-danger" data-eliminar-recordatorio="${r.id}">✖ Eliminar</button>
    </div>
  `).join('');

  card.querySelectorAll('[data-eliminar-recordatorio]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const confirmado = await confirmDialog('¿Eliminar este recordatorio de cierre?');
      if (!confirmado) return;
      const id = btn.dataset.eliminarRecordatorio;
      try {
        await apiFetch(`/api/oportunidades/recordatorios/${id}`, { method: 'DELETE' });
        // Actualiza el array local YA (no depende de que el refresh de abajo
        // llegue bien) y vuelve a renderizar esta misma pestaña al toque.
        recordatoriosData = recordatoriosData.filter((r) => String(r.id) !== String(id));
        renderRecordatorios();
        cargarOportunidades();
      } catch (err) {
        document.getElementById('errorBannerOportunidades').textContent = '❌ ' + err.message;
        document.getElementById('errorBannerOportunidades').style.display = 'block';
      }
    });
  });
}

function renderSeguimientos() {
  const card = document.getElementById('oportunidadesCard');
  if (seguimientosData.length === 0) {
    card.innerHTML = '<div class="empty-state">Todavía no estás siguiendo ninguna licitación. Agrégalas desde Notificaciones o Búsquedas con el botón "➕ Seguir".</div>';
    return;
  }

  card.innerHTML = seguimientosData.map((s) => `
    <div class="row">
      <div class="row-info">
        <div class="row-title">
          <a href="http://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${encodeURIComponent(s.codigo_externo)}" target="_blank" rel="noopener noreferrer">${s.nombre || s.codigo_externo} ↗</a>
        </div>
        <div class="row-meta">
          <span>📋 Licitación</span>
          <br><span>Código: ${s.codigo_externo}</span>
          <br><span>Organismo: ${s.organismo || 'No especificado'}</span>
          <br><span>Región: ${s.region || 'No especificada'}</span>
          <br><span>Estado actual: ${s.estado || 'Desconocido'}</span>
          <br><span>Cierra: ${formatDate(s.fecha_cierre)}</span>
          ${s.resuelta ? '<br><span>✅ Proceso resuelto</span>' : ''}
        </div>
      </div>
      <button class="btn btn-danger" data-eliminar-seguimiento="${s.id}">✖ Dejar de seguir</button>
    </div>
  `).join('');

  card.querySelectorAll('[data-eliminar-seguimiento]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const confirmado = await confirmDialog('¿Dejar de seguir esta licitación?');
      if (!confirmado) return;
      const id = btn.dataset.eliminarSeguimiento;
      try {
        await apiFetch(`/api/oportunidades/seguimientos/${id}`, { method: 'DELETE' });
        // Actualiza el array local YA (no depende de que el refresh de abajo
        // llegue bien) y vuelve a renderizar esta misma pestaña al toque.
        seguimientosData = seguimientosData.filter((s) => String(s.id) !== String(id));
        renderSeguimientos();
        cargarOportunidades();
      } catch (err) {
        document.getElementById('errorBannerOportunidades').textContent = '❌ ' + err.message;
        document.getElementById('errorBannerOportunidades').style.display = 'block';
      }
    });
  });
}

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
  const region = filtroRegionHistSelect.value;
  const fechaCierre = document.getElementById('filtroFechaHist').value;
  const fechaEnvio = document.getElementById('filtroFechaEnvioHist').value;

  return historialData.filter(h => {
    if (tipo && h.tipo_proceso !== tipo) return false;
    if (region && h.region !== region) return false;
    if (filtroCategoriaHistSeleccion && !coincideConFiltroCategoria(h.codigo_categoria, filtroCategoriaHistSeleccion)) return false;
    if (fechaCierre && (!h.fecha_cierre || fechaLocalISO(h.fecha_cierre) !== fechaCierre)) return false;
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
          ? `<a href="https://buscador.mercadopublico.cl/ficha?code=${encodeURIComponent(h.codigo_externo)}" target="_blank" rel="noopener noreferrer">${h.nombre || h.codigo_externo} ↗</a>`
          : `<a href="http://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=${encodeURIComponent(h.codigo_externo)}" target="_blank" rel="noopener noreferrer">${h.nombre || h.codigo_externo} ↗</a>`
        }</div>
        <div class="row-meta">
          <span>${h.tipo_proceso === 'compra_agil' ? '⚡ Compra Ágil' : '📋 Licitación'}</span>
          <br>
          <span>Código: ${h.codigo_externo}</span>
          <br>
          <span>Monto: ${formatMontoConTramo(h)}</span>
          <br>
          <span>Región: ${h.region}</span>
          <br>
          <span>Organismo: ${h.organismo}</span>
          <br>
          <span>Cierra: ${formatDate(h.fecha_cierre)}</span>
        </div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          ${botonesOportunidadHtml(h.tipo_proceso, h.codigo_externo, h.nombre, "notificaciones")}
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

['filtroEstado', 'filtroTipoProcesoConfig', 'filtroRegionConfig'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    configsPaginaActual = 1;
    renderConfigs();
  });
});

['filtroTipoHist', 'filtroRegionHist', 'filtroFechaHist', 'filtroFechaEnvioHist'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    historialPaginaActual = 1;
    renderHistorial();
  });
});

document.getElementById('limpiarFiltroConfigBtn').addEventListener('click', () => {
  document.getElementById('filtroEstado').value = '';
  document.getElementById('filtroTipoProcesoConfig').value = '';
  filtroRegionConfigSelect.value = '';
  buscadorCategoriaConfig.limpiar();
  filtroCategoriaConfigSeleccion = null;
  configsPaginaActual = 1;
  renderConfigs();
});

document.getElementById('limpiarFiltroHistBtn').addEventListener('click', () => {
  document.getElementById('filtroTipoHist').value = '';
  filtroRegionHistSelect.value = '';
  buscadorCategoriaHist.limpiar();
  filtroCategoriaHistSeleccion = null;
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
  oportunidades: document.getElementById('tabOportunidades'),
  analisis: document.getElementById('tabAnalisis'),
  ia: document.getElementById('secIA'),
  cuenta: document.getElementById('secCuenta'),
};

const bottombarMasBtn = document.getElementById('bottombarMasBtn');

function mostrarSeccion(nombre) {
  sectionLinks.forEach((l) => l.classList.toggle('active', l.dataset.section === nombre));
  Object.entries(secciones).forEach(([key, el]) => el.classList.toggle('active', key === nombre));
  bottombarMasBtn.classList.toggle('active', nombre === 'analisis' || nombre === 'ia' || nombre === 'oportunidades');
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
const PLANES_CON_ANALISIS = ['full','trial'];

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
              <span>${r.titulo} <span class="nivel-badge ${r.nivel}">${r.nivel === 'categoria' ? 'Rubro' : r.nivel === 'obra' ? 'Obra' : 'Producto'}</span></span>
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
        console.warn('Error buscando rubros:', err.message);
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
        <td>${r.fuente === 'licitacion'
          ? `<a href="${urlFichaLicitacion(r.codigo_externo)}" target="_blank" rel="noopener">${r.codigo_externo || '—'}</a>`
          : `<a href="${urlFichaCompraAgil(r.codigo_externo)}" target="_blank" rel="noopener">${r.codigo_externo || '—'}</a>`}</td>
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
            <th>Código</th>
            <th>Producto</th>
            <th>Organismo</th>
            <th>Proveedor</th>
            <th>Precio unit.</th>
            <th>Resultado</th>
            <th>Fecha Adjudicación</th>
          </tr>
        </thead>
        <tbody>${filasHtml || '<tr><td colspan="8" class="empty-state">Sin resultados para estos filtros.</td></tr>'}</tbody>
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
      <td>
        <a href="${urlFichaProveedor(p.rutProveedor)}" target="_blank" rel="noopener">${p.nombreProveedor || '—'}</a>
        <span class="row-meta">(${p.rutProveedor || '—'})</span>
      </td>
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
cargarBusquedas();
cargarOportunidades();
