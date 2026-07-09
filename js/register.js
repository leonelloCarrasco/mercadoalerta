// Detecta automáticamente si estamos en desarrollo local o en producción
const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:3000'
  : 'https://api.mercadoalerta.cl';

const form = document.getElementById('registerForm');
const errorMsg = document.getElementById('errorMsg');
const noticeMsg = document.getElementById('noticeMsg');
const submitBtn = document.getElementById('submitBtn');
const rutEmpresaInput = document.getElementById('rutEmpresa');

// Formatea a medida que se escribe: "761234285" -> "76.123.428-5"
function formatearRut(valor) {
  const limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase();
  if (!limpio) return '';

  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dv = limpio.slice(-1);
  return cuerpo ? `${cuerpo}-${dv}` : dv;
}

// Mismo algoritmo (módulo 11) que src/utils/rut.js en el backend — se valida
// acá también para dar feedback inmediato sin esperar el roundtrip al servidor.
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

function validarRut(rutCrudo) {
  const limpio = String(rutCrudo || '').replace(/[.\s]/g, '').toUpperCase();
  const match = limpio.match(/^(\d{7,8})-?([\dK])$/);
  if (!match) return false;

  const [, cuerpo, dv] = match;
  return calcularDigitoVerificador(cuerpo) === dv;
}

const rutEmpresaHint = document.getElementById('rutEmpresaHint');

function mostrarErrorRut(mostrar) {
  rutEmpresaInput.classList.toggle('invalid', mostrar);
  rutEmpresaHint.classList.toggle('visible', mostrar);
  rutEmpresaHint.textContent = mostrar
    ? 'El RUT ingresado no es válido. Verifica el formato (ej. 12.345.678-9).'
    : '';
}

rutEmpresaInput.addEventListener('input', (e) => {
  const cursorAlFinal = e.target.selectionStart === e.target.value.length;
  e.target.value = formatearRut(e.target.value);
  if (cursorAlFinal) {
    e.target.setSelectionRange(e.target.value.length, e.target.value.length);
  }
  // Mientras se sigue escribiendo no interrumpimos con el error; se valida al salir del campo.
  mostrarErrorRut(false);
});

rutEmpresaInput.addEventListener('blur', () => {
  const valor = rutEmpresaInput.value.trim();
  mostrarErrorRut(valor.length > 0 && !validarRut(valor));
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.style.display = 'none';
  noticeMsg.style.display = 'none';

  const nombre = document.getElementById('nombre').value;
  const apellido = document.getElementById('apellido').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('passwordConfirm').value;
  const rutEmpresa = document.getElementById('rutEmpresa').value;

  if (password !== passwordConfirm) {
    errorMsg.textContent = 'Las contraseñas no coinciden';
    errorMsg.style.display = 'block';
    return;
  }

  if (!validarRut(rutEmpresa)) {
    mostrarErrorRut(true);
    rutEmpresaInput.focus();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creando cuenta...';

  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nombre, apellido, rutEmpresa }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error al crear la cuenta');
    }

    // Igual que en login: el token se guarda en sessionStorage, no localStorage,
    // por seguridad frente a XSS.
    sessionStorage.setItem('token', data.token);
    window.location.href = 'dashboard.html';
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Crear cuenta';
  }
});
