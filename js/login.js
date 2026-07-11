// Detecta automáticamente si estamos en desarrollo local o en producción
const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:3000'
  : 'https://api.mercadoalerta.cl';

const form = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');
const noticeMsg = document.getElementById('noticeMsg');
const submitBtn = document.getElementById('submitBtn');

// Si venimos recién confirmando el correo (ver confirmar-cuenta.js), mostramos
// un aviso de bienvenida.
if (new URLSearchParams(window.location.search).get('verificado') === '1') {
  noticeMsg.textContent = 'Tu cuenta fue confirmada correctamente. Ya puedes iniciar sesión.';
  noticeMsg.style.display = 'block';
}

const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
const iconEye = togglePassword.querySelector('.icon-eye');
const iconEyeOff = togglePassword.querySelector('.icon-eye-off');

togglePassword.addEventListener('click', () => {
  const isHidden = passwordInput.type === 'password';
  passwordInput.type = isHidden ? 'text' : 'password';
  iconEye.style.display = isHidden ? 'none' : '';
  iconEyeOff.style.display = isHidden ? '' : 'none';
  togglePassword.setAttribute('aria-pressed', String(isHidden));
  togglePassword.setAttribute('aria-label', isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.style.display = 'none';
  noticeMsg.style.display = 'none';

  // window.turnstile lo inyecta el script de Cloudflare cargado en el <head>.
  const captchaToken = window.turnstile ? window.turnstile.getResponse() : '';
  if (!captchaToken) {
    errorMsg.textContent = 'Completa la verificación "soy humano" para continuar';
    errorMsg.style.display = 'block';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Ingresando...';

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, captchaToken }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    // Guardamos el token en memoria de sesión del navegador (no localStorage,
    // por seguridad frente a XSS; para persistencia entre pestañas se puede
    // evaluar sessionStorage más adelante según necesidad real).
    sessionStorage.setItem('token', data.token);
    window.location.href = 'dashboard.html';
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Iniciar sesión';
    if (window.turnstile) window.turnstile.reset();
  }
});
