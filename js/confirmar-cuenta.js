// Detecta automáticamente si estamos en desarrollo local o en producción
const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:3000'
  : 'https://api.mercadoalerta.cl';

const mensajeEl = document.getElementById('mensaje');
const errorMsg = document.getElementById('errorMsg');
const noticeMsg = document.getElementById('noticeMsg');
const footerLink = document.getElementById('footerLink');

const token = new URLSearchParams(window.location.search).get('token');

async function confirmarCuenta() {
  if (!token) {
    mensajeEl.textContent = 'Falta el token de confirmación.';
    errorMsg.textContent = 'Este link no es válido. Revisa que copiaste la URL completa desde tu correo.';
    errorMsg.style.display = 'block';
    footerLink.style.display = 'block';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/confirmar-cuenta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'No pudimos confirmar tu cuenta');
    }

    // Plan pago (basic/full): el correo confirmó, pero falta el pago —
    // seguimos directo al checkout de MercadoPago.
    if (data.checkoutUrl) {
      mensajeEl.textContent = 'Tu correo fue confirmado. Te llevamos a completar el pago...';
      noticeMsg.textContent = data.mensaje;
      noticeMsg.style.display = 'block';
      setTimeout(() => {
        window.location.href = data.checkoutUrl;
      }, 5000);
      return;
    }

    // Plan trial: cuenta activada de inmediato, se manda al login.
    mensajeEl.textContent = '¡Listo!';
    noticeMsg.replaceChildren(
      document.createTextNode(data.mensaje),
      document.createElement('br'),
      document.createTextNode('Te llevamos a iniciar sesión...'),
      document.createElement('br'),
      document.createElement('br'),
      document.createTextNode('Si no te redirige automáticamente, haz click en el link de abajo.'),
    );
    noticeMsg.style.display = 'block';
    footerLink.style.display = 'block';
    setTimeout(() => {
      window.location.href = 'login.html?verificado=1';
    }, 5000);
  } catch (err) {
    mensajeEl.textContent = 'No pudimos confirmar tu cuenta.';
    errorMsg.textContent = err.message;
    errorMsg.style.display = 'block';
    footerLink.style.display = 'block';
  }
}

confirmarCuenta();
