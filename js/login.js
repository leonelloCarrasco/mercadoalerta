// Detecta automáticamente si estamos en desarrollo local o en producción
const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:3000'
  : 'https://api.mercadoalerta.cl';

const form = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Ingresando...';

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
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
  }
});
