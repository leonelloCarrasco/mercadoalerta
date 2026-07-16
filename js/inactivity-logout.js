// Cierre de sesión automático por inactividad.
//
// A los 5 minutos sin actividad del usuario (mouse, teclado, scroll, touch),
// se muestra un aviso con una cuenta regresiva de 10 segundos; si el usuario
// no hace clic en "Seguir conectado" antes de que llegue a 0, se cierra la
// sesión (mismo criterio que el botón "Cerrar sesión": se borra el token y
// se manda a login.html).
//
// Este archivo asume que la página que lo carga ya validó que hay un token
// en sessionStorage (dashboard.js / admin.js redirigen a login.html si no lo
// hay, ANTES de que este script llegue a ejecutarse) — no vuelve a chequear
// sesión por su cuenta, solo reacciona a inactividad.
//
// Reutiliza las clases .modal-overlay/.modal/.modal-message/.modal-actions
// que ya existen en css/dashboard.css (mismas que usa confirmModal) — no
// hace falta CSS nuevo, y el modal se inyecta solo, así que basta con
// agregar <script src="js/inactivity-logout.js"></script> a cualquier
// página autenticada para tener el comportamiento, sin tocar su HTML.
(function () {
  const INACTIVIDAD_MS = 5 * 60 * 1000; // 5 minutos
  const CUENTA_REGRESIVA_S = 10; // 10 segundos para cancelar el cierre

  // Umbral mínimo entre reinicios del timer de inactividad — evita llamar
  // clearTimeout/setTimeout en cada pixel de un mousemove continuo; no
  // afecta la precisión real (5 minutos igual se cumplen con margen de <1s).
  const THROTTLE_MS = 1000;

  const EVENTOS_ACTIVIDAD = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

  let timerInactividad = null;
  let timerCuentaRegresiva = null;
  let segundosRestantes = CUENTA_REGRESIVA_S;
  let ultimoReinicio = 0;
  let modalEl = null;

  function crearModal() {
    if (modalEl) return modalEl;

    modalEl = document.createElement('div');
    modalEl.className = 'modal-overlay';
    modalEl.id = 'inactividadModal';
    modalEl.innerHTML = `
      <div class="modal">
        <p class="modal-message">
          Tu sesión está por cerrarse por inactividad.<br>
          Se cerrará en <strong id="inactividadSegundos">${CUENTA_REGRESIVA_S}</strong> segundos.
        </p>
        <div class="modal-actions">
          <button type="button" class="btn" id="inactividadSeguirBtn">Seguir conectado</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);
    document.getElementById('inactividadSeguirBtn').addEventListener('click', cancelarCierreSesion);
    return modalEl;
  }

  function cerrarSesionPorInactividad() {
    sessionStorage.removeItem('token');
    window.location.href = 'login.html?sesion_expirada=1';
  }

  function mostrarAviso() {
    crearModal();
    segundosRestantes = CUENTA_REGRESIVA_S;
    document.getElementById('inactividadSegundos').textContent = segundosRestantes;
    modalEl.classList.add('open');

    clearInterval(timerCuentaRegresiva);
    timerCuentaRegresiva = setInterval(() => {
      segundosRestantes -= 1;
      const span = document.getElementById('inactividadSegundos');
      if (span) span.textContent = segundosRestantes;
      if (segundosRestantes <= 0) {
        clearInterval(timerCuentaRegresiva);
        cerrarSesionPorInactividad();
      }
    }, 1000);
  }

  // Cancela el cierre de sesión — requiere una acción explícita del usuario
  // ("Seguir conectado"), no cualquier movimiento de mouse mientras el aviso
  // ya está en pantalla, para que un roce accidental no reinicie el reloj
  // sin que el usuario realmente haya vuelto a la página.
  function cancelarCierreSesion() {
    clearInterval(timerCuentaRegresiva);
    if (modalEl) modalEl.classList.remove('open');
    reiniciarTimerInactividad();
  }

  function reiniciarTimerInactividad() {
    clearTimeout(timerInactividad);
    timerInactividad = setTimeout(mostrarAviso, INACTIVIDAD_MS);
  }

  EVENTOS_ACTIVIDAD.forEach((evento) => {
    document.addEventListener(evento, () => {
      // Mientras el aviso ya está abierto, la actividad "de fondo" no lo
      // cancela sola — ver cancelarCierreSesion.
      if (modalEl && modalEl.classList.contains('open')) return;

      const ahora = Date.now();
      if (ahora - ultimoReinicio < THROTTLE_MS) return;
      ultimoReinicio = ahora;
      reiniciarTimerInactividad();
    }, { passive: true });
  });

  reiniciarTimerInactividad();
})();
