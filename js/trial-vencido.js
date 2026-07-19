const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:3000'
  : 'https://api.mercadoalerta.cl';

const token = sessionStorage.getItem('token');
if (!token) window.location.href = 'login.html';

const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

const errorEl = document.getElementById('errorTrialVencido');
function mostrarError(mensaje) {
  errorEl.textContent = mensaje;
  errorEl.style.display = 'block';
}

let empresaId = null;

async function cargarUsuario() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, { headers: authHeaders });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo cargar tu cuenta');

    empresaId = data.usuario.empresa_id;

    const trialVencido = data.usuario.plan === 'trial'
      && data.usuario.fecha_expiracion_trial
      && new Date(data.usuario.fecha_expiracion_trial) < new Date();

    // Mismo mecanismo que el trial, otro motivo: canceló su suscripción y ya
    // pasó el período que había pagado (ver migración 039).
    const accesoCanceladoTerminado = data.usuario.suscripcion_cancelada_en
      && data.usuario.acceso_hasta
      && new Date(data.usuario.acceso_hasta) < new Date();

    // Si alguien llega acá con el link guardado pero en realidad ninguno de
    // los dos motivos aplica (su trial sigue vigente, o no canceló nada), no
    // tiene sentido mostrarle esta pantalla — lo mandamos al dashboard.
    if (!trialVencido && !accesoCanceladoTerminado && data.usuario.estado_pago !== 'pendiente') {
      window.location.href = 'dashboard.html';
      return;
    }

    if (accesoCanceladoTerminado && !trialVencido) {
      document.title = 'Tu acceso terminó — MercadoAlerta';
      document.getElementById('trialVencidoTitulo').textContent = 'Tu acceso a MercadoAlerta terminó.';
      document.getElementById('trialVencidoTexto').textContent =
        'El período que ya habías pagado antes de cancelar tu suscripción llegó a su fin. ' +
        'Toda tu configuración — alertas, búsquedas guardadas, recordatorios, pipeline — sigue guardada ' +
        'tal cual la dejaste; al reactivar un plan, vuelves a tener acceso a todo, sin perder nada.';
    }
  } catch (err) {
    mostrarError(err.message);
  }
}

async function elegirPlan(plan, btn) {
  const textoOriginal = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Redirigiendo a MercadoPago...';
  errorEl.style.display = 'none';

  try {
    if (!empresaId) throw new Error('No se pudo identificar tu empresa. Recarga la página e intenta de nuevo.');

    const res = await fetch(`${API_BASE}/api/empresas/${empresaId}/upgrade`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo iniciar el pago');

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
      throw new Error('MercadoPago no devolvió un link de pago. Intenta de nuevo.');
    }
  } catch (err) {
    mostrarError(err.message);
    btn.disabled = false;
    btn.textContent = textoOriginal;
  }
}

document.getElementById('btnElegirBasico').addEventListener('click', (e) => elegirPlan('basico', e.target));
document.getElementById('btnElegirFull').addEventListener('click', (e) => elegirPlan('full', e.target));

document.getElementById('cerrarSesionTrialVencido').addEventListener('click', (e) => {
  e.preventDefault();
  sessionStorage.removeItem('token');
  window.location.href = 'login.html';
});

cargarUsuario();
