const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:5501'
  : 'https://mercadoalerta.cl';

const solicitarCard = document.getElementById('solicitarCard');
const verificandoCard = document.getElementById('verificandoCard');
const panelCard = document.getElementById('panelCard');

const urlToken = new URLSearchParams(window.location.search).get('token');

const rutInput = document.getElementById('rut');
const rutHint = document.getElementById('rutHint');

// Formatea a medida que se escribe: "761234285" -> "76.123.428-5"
function formatearRut(valor) {
  const limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase();
  if (!limpio) return '';

  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dv = limpio.slice(-1);
  return cuerpo ? `${cuerpo}-${dv}` : dv;
}

// Mismo algoritmo (módulo 11) que src/utils/rut.js en el backend.
function calcularDigitoVerificador(cuerpo) {
  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

function validarRutFormato(rutCrudo) {
  const limpio = String(rutCrudo || '').replace(/[.\s]/g, '').toUpperCase();
  const match = limpio.match(/^(\d{7,8})-?([\dK])$/);
  if (!match) return false;

  const [, cuerpo, dv] = match;
  return calcularDigitoVerificador(cuerpo) === dv;
}

function mostrarErrorRut(mostrar) {
  rutInput.classList.toggle('invalid', mostrar);
  rutHint.classList.toggle('visible', mostrar);
  rutHint.textContent = mostrar
    ? 'El RUT ingresado no es válido. Verifica el formato (ej. 12.345.678-9).'
    : '';
}

rutInput.addEventListener('input', (e) => {
  const cursorAlFinal = e.target.selectionStart === e.target.value.length;
  e.target.value = formatearRut(e.target.value);
  if (cursorAlFinal) {
    e.target.setSelectionRange(e.target.value.length, e.target.value.length);
  }
  mostrarErrorRut(false);
});

rutInput.addEventListener('blur', () => {
  const valor = rutInput.value.trim();
  mostrarErrorRut(valor.length > 0 && !validarRutFormato(valor));
});

function mostrarSoloCard(card) {
  [solicitarCard, verificandoCard, panelCard].forEach((c) => { c.style.display = 'none'; });
  card.style.display = 'block';
}

// --- Paso 1: formulario de solicitud de acceso ---
const solicitarForm = document.getElementById('solicitarForm');
const solicitarError = document.getElementById('solicitarError');
const solicitarNotice = document.getElementById('solicitarNotice');
const solicitarBtn = document.getElementById('solicitarBtn');

solicitarForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  solicitarError.style.display = 'none';
  solicitarNotice.style.display = 'none';

  const rut = document.getElementById('rut').value;
  const email = document.getElementById('email').value;

  if (!validarRutFormato(rut)) {
    mostrarErrorRut(true);
    rutInput.focus();
    return;
  }

  solicitarBtn.disabled = true;
  solicitarBtn.textContent = 'Enviando...';

  try {
    const res = await fetch(`${API_BASE}/api/empresas/solicitar-acceso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rut, email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al solicitar el acceso');

    solicitarNotice.textContent = data.mensaje;
    solicitarNotice.style.display = 'block';
    solicitarForm.reset();
  } catch (err) {
    solicitarError.textContent = err.message;
    solicitarError.style.display = 'block';
  } finally {
    solicitarBtn.disabled = false;
    solicitarBtn.textContent = 'Enviar link de acceso';
  }
});

// --- Helper de fetch autenticado con el JWT de sesión de empresa ---
// (guardado bajo una clave DISTINTA a 'token', que es la del login de usuarios
// — ambas sesiones son independientes y pueden convivir en el mismo navegador).
async function empresaFetch(path, options = {}) {
  const empresaToken = sessionStorage.getItem('empresaToken');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${empresaToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    sessionStorage.removeItem('empresaToken');
    throw new Error('Tu sesión de gestión expiró. Solicita un nuevo link de acceso.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

// --- Paso 2: si hay token en la URL, canjearlo por una sesión ---
async function verificarYCargarPanel() {
  mostrarSoloCard(verificandoCard);
  const verificarError = document.getElementById('verificarError');
  verificarError.style.display = 'none';

  try {
    const res = await fetch(`${API_BASE}/api/empresas/verificar-acceso`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: urlToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo verificar el acceso');

    sessionStorage.setItem('empresaToken', data.token);
    // Sacamos el token de la URL para que no quede visible/copiable en el historial del navegador.
    window.history.replaceState({}, document.title, window.location.pathname);

    await cargarPanel();
  } catch (err) {
    verificarError.textContent = err.message;
    verificarError.style.display = 'block';
  }
}

// --- Paso 3: cargar y mostrar el panel ---
async function cargarPanel() {
  try {
    const data = await empresaFetch('/api/empresas/gestion/me');
    const e = data.empresa;

    document.getElementById('panelNombreEmpresa').textContent = e.nombre_empresa || '—';
    document.getElementById('panelRut').textContent = e.rut;
    const nombrePlan = e.plan.charAt(0).toUpperCase() + e.plan.slice(1);
    document.getElementById('panelPlan').textContent =
      e.estado_pago !== 'activo' ? `${nombrePlan} (pago pendiente)` : nombrePlan;

    document.getElementById('responsableNombre').value = e.responsable_nombre || '';
    document.getElementById('responsableApellido').value = e.responsable_apellido || '';
    document.getElementById('emailContacto').value = e.email_contacto || '';
    document.getElementById('telefonoContacto').value = e.telefono_contacto || '';

    mostrarSoloCard(panelCard);
  } catch (err) {
    mostrarSoloCard(verificandoCard);
    const verificarError = document.getElementById('verificarError');
    verificarError.textContent = err.message;
    verificarError.style.display = 'block';
  }
}

const contactoForm = document.getElementById('contactoForm');
contactoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const contactoError = document.getElementById('contactoError');
  const contactoNotice = document.getElementById('contactoNotice');
  contactoError.style.display = 'none';
  contactoNotice.style.display = 'none';

  const body = {
    responsableNombre: document.getElementById('responsableNombre').value,
    responsableApellido: document.getElementById('responsableApellido').value,
    emailContacto: document.getElementById('emailContacto').value,
    telefonoContacto: document.getElementById('telefonoContacto').value,
  };

  try {
    await empresaFetch('/api/empresas/gestion/contacto', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    contactoNotice.textContent = 'Datos de contacto actualizados correctamente.';
    contactoNotice.style.display = 'block';
  } catch (err) {
    contactoError.textContent = err.message;
    contactoError.style.display = 'block';
  }
});

// --- Arranque ---
if (urlToken) {
  verificarYCargarPanel();
} else {
  const empresaTokenGuardado = sessionStorage.getItem('empresaToken');
  if (empresaTokenGuardado) {
    cargarPanel();
    mostrarSoloCard(panelCard);
  } else {
    mostrarSoloCard(solicitarCard);
  }
}
