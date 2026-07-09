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
const filtroMontoConfigInput = registrarInputMonto('filtroMontoConfig');
const filtroMontoHistInput = registrarInputMonto('filtroMontoHist');

const regionSelect = document.getElementById('region');
const filtroRegionConfigSelect = document.getElementById('filtroRegionConfig');

async function cargarRegiones() {
  try {
    const data = await apiFetch('/api/alerts/regiones');
    const opciones = data.regiones.map(r => `<option value="${r}">${r}</option>`).join('');
    regionSelect.innerHTML = '<option value="">Todas las regiones</option>' + opciones;
    filtroRegionConfigSelect.innerHTML = '<option value="">Todas las regiones</option>' + opciones;
  } catch (err) {
    console.warn('No se pudieron cargar las regiones:', err.message);
  }
}

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
    const nombreCompleto = data.usuario.nombre
      ? `${data.usuario.nombre} ${data.usuario.apellido || ''}`.trim()
      : data.usuario.email;
    document.getElementById('userInfo').textContent =
      `${nombreCompleto} · ${data.usuario.nombre_empresa || data.usuario.rut_empresa}`;

    mostrarBannerPlan(data.usuario);
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
        <p>Tu período de prueba de 7 días terminó. Elige un plan para seguir recibiendo alertas.</p>
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

const CONFIGS_POR_PAGINA = 10;
let configsData = [];
let configsPaginaActual = 1;

async function cargarConfigs() {
  const card = document.getElementById('configsCard');
  try {
    const data = await apiFetch('/api/alerts/config');
    configsData = data.configs;
    configsPaginaActual = 1;
    renderConfigs();
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
    if (region && c.region !== region) return false;
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

  const filasHtml = pagina.map(c => `
    <div class="row">
      <div class="row-info">
        <div class="row-title">${c.categorias && c.categorias.length ? 'Categorías: ' + c.categorias.join(', ') : 'Todas las categorías'}</div>
        <div class="row-meta">
          ${c.monto_minimo ? `<span>Monto mín: ${formatMoney(c.monto_minimo)}</span>` : ''}
          ${c.region ? `<span>Región: ${c.region}</span>` : ''}
          <span>${c.activo ? '🟢 Activa' : '⚪ Pausada'}</span>
        </div>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-ghost" data-toggle="${c.id}" data-activo="${c.activo}">${c.activo ? '❚❚ Pausar' : '▶ Reactivar'}</button>
        <button class="btn btn-danger" data-delete="${c.id}">✖ Eliminar</button>
      </div>
    </div>
  `).join('');

  const mostrarPaginador = configsFiltrados.length > CONFIGS_POR_PAGINA;
  const paginadorHtml = mostrarPaginador ? `
    <div class="paginador">
      <button type="button" class="btn btn-ghost" id="configsPrev" ${configsPaginaActual === 1 ? 'disabled' : ''}>‹ Anterior</button>
      <span class="paginador-info">Página ${configsPaginaActual} de ${totalPaginas}</span>
      <button type="button" class="btn btn-ghost" id="configsNext" ${configsPaginaActual === totalPaginas ? 'disabled' : ''}>Siguiente ›</button>
    </div>
  ` : '';

  card.innerHTML = filasHtml + paginadorHtml;

  card.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const confirmado = await confirmDialog('¿Eliminar esta alerta?');
      if (!confirmado) return;
      try {
        await apiFetch(`/api/alerts/config/${btn.dataset.delete}`, { method: 'DELETE' });
        cargarConfigs();
      } catch (err) { showError(err.message); }
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
  const region = document.getElementById('region').value.trim();
  const categoriasRaw = document.getElementById('categorias').value.trim();
  const categorias = categoriasRaw ? categoriasRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  if (!montoMinimo && !region && categorias.length === 0) {
    showError('Especifica al menos un criterio: monto mínimo, región o categorías.');
    btn.disabled = false;
    btn.textContent = 'Crear alerta';
    return;
  }

  try {
    await apiFetch('/api/alerts/config', {
      method: 'POST',
      body: JSON.stringify({
        montoMinimo: montoMinimo ? Number(montoMinimo) : null,
        region: region || null,
        categorias,
      }),
    });
    document.getElementById('newAlertForm').reset();
    cargarConfigs();
  } catch (err) {
    showError(err.message);
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
  } catch (err) {
    card.innerHTML = `<div class="empty-state">Error al cargar: ${err.message}</div>`;
  }
}

function obtenerHistorialFiltrado() {
  const tipo = document.getElementById('filtroTipoHist').value;
  const montoDesde = Number(soloDigitos(filtroMontoHistInput.value)) || 0;
  const fechaDesde = document.getElementById('filtroFechaHist').value;
  const fechaEnvio = document.getElementById('filtroFechaEnvioHist').value;

  return historialData.filter(h => {
    if (tipo && h.tipo_proceso !== tipo) return false;
    if (montoDesde && (h.monto == null || h.monto < montoDesde)) return false;
    if (fechaDesde && (!h.fecha_cierre || h.fecha_cierre.slice(0, 10) < fechaDesde)) return false;
    if (fechaEnvio && (!h.sent_at || h.sent_at.slice(0, 10) !== fechaEnvio)) return false;
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
          <span>Monto: ${formatMontoConTramo(h)}</span>
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

document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('token');
  window.location.href = 'login.html';
});

cargarUsuario();
cargarRegiones();
cargarConfigs();
cargarHistorial();
