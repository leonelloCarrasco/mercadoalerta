// Detecta automáticamente si estamos en desarrollo local o en producción
const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:3000'
  : 'https://api.mercadoalerta.cl';

const form = document.getElementById('preRegistroForm');
const errorMsg = document.getElementById('errorMsg');
const noticeMsg = document.getElementById('noticeMsg');
const submitBtn = document.getElementById('submitBtn');
const rutInput = document.getElementById('rut');
const rutHint = document.getElementById('rutHint');

// El plan viene de la landing como ?plan=trial|basico|full — si no viene
// nada (ej. alguien entra directo a esta URL), se asume trial por defecto.
const plan = new URLSearchParams(window.location.search).get('plan') || 'trial';
const planLabelEl = document.getElementById('planSeleccionado');
if (planLabelEl) {
  const nombres = { trial: 'Trial (gratis)', basico: 'Basic', full: 'Full' };
  planLabelEl.textContent = nombres[plan] || plan;
}

// El ícono vive dentro del <label for="declaraEmt">, así que un click ahí
// re-dispararía un click sintético sobre el checkbox (toggle no intencional)
// si no se frena el comportamiento por defecto del label.
document.querySelector('.info-icon').addEventListener('click', (e) => {
  e.preventDefault();
});

// Formatea a medida que se escribe: "761234285" -> "76.123.428-5"
function formatearRut(valor) {
  const limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase();
  if (!limpio) return '';

  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dv = limpio.slice(-1);
  return cuerpo ? `${cuerpo}-${dv}` : dv;
}

// Mismo algoritmo (módulo 11) que src/utils/rut.js en el backend — feedback
// inmediato sin esperar el roundtrip al servidor.
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

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.style.display = 'none';
  noticeMsg.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Validando con Mercado Público...';

  const rut = document.getElementById('rut').value;
  const declaraEmt = document.getElementById('declaraEmt').checked;
  const responsableNombre = document.getElementById('responsableNombre').value;
  const responsableApellido = document.getElementById('responsableApellido').value;
  const emailContacto = document.getElementById('emailContacto').value;
  const telefonoContacto = document.getElementById('telefonoContacto').value;

  if (!validarRutFormato(rut)) {
    mostrarErrorRut(true);
    rutInput.focus();
    submitBtn.disabled = false;
    submitBtn.textContent = 'Registrar empresa';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/empresas/pre-registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rut, plan, declaraEmt, responsableNombre, responsableApellido, emailContacto, telefonoContacto }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error al registrar la empresa');
    }

    if (data.checkoutUrl) {
      // Plan pago: hay que completar el pago antes de poder crear usuarios.
      noticeMsg.textContent = 'Empresa pre-registrada. Redirigiendo al pago para activarla...';
      noticeMsg.style.display = 'block';
      form.reset();
      setTimeout(() => { window.location.href = data.checkoutUrl; }, 1500);
    } else {
      // Plan trial: queda activa de inmediato.
      noticeMsg.textContent = `Empresa "${data.empresa.nombre_empresa || data.empresa.rut}" registrada correctamente. Ahora puedes crear tu cuenta de usuario.`;
      noticeMsg.style.display = 'block';
      form.reset();
      submitBtn.textContent = 'Empresa registrada ✓';
      setTimeout(() => { window.location.href = 'register.html'; }, 2000);
    }
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Registrar empresa';
  }
});
