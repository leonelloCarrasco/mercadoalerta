// Ticker con ejemplos de licitaciones
  const tickerData = [
    { codigo: '1488587-15-LE26', nombre: 'Mantenimiento salas de aprendizaje', extra: 'Universidad de La Serena' },
    { codigo: '1057489-138-LE26', nombre: 'Suministro dispositivos médicos', extra: 'Hospital del Salvador' },
    { codigo: '2201034-9-L126', nombre: 'Servicio de aseo y mantención', extra: 'Municipalidad de Ñuñoa' },
    { codigo: '0873321-4-LP26', nombre: 'Equipamiento informático', extra: 'SENCE Región Metropolitana' },
    { codigo: '1502290-2-LE26', nombre: 'Insumos de laboratorio', extra: 'Hospital Regional de Rancagua' },
    { codigo: '0619944-7-L126', nombre: 'Reparación de infraestructura vial', extra: 'Dirección de Vialidad' },
  ];
  const track = document.getElementById('tickerTrack');
  const buildTicker = () => tickerData.map(i =>
    `<div class="ticker-item"><span class="codigo">${i.codigo}</span> · <span class="nombre">${i.nombre}</span> · ${i.extra}</div>`
  ).join('');
  track.innerHTML = buildTicker() + buildTicker();

  // Reveal on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Formspree: reemplaza por tu endpoint real (crea uno nuevo en formspree.io, distinto al de MiVigía)
  const FORMSPREE_ENDPOINT = 'TU_ENDPOINT_AQUI';

  async function notifyFormspree(email) {
    if (!FORMSPREE_ENDPOINT || FORMSPREE_ENDPOINT === 'TU_ENDPOINT_AQUI') return;
    try {
      await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, message: 'Nuevo signup en la waitlist de MercadoAlerta' })
      });
    } catch { /* si falla el aviso por email, el signup ya quedó guardado en storage igual */ }
  }

  async function joinWaitlist(email, noteEl, btnEl) {
    if (!email) return;
    btnEl.disabled = true;
    const originalText = btnEl.textContent;
    btnEl.textContent = 'Guardando...';
    try {
      const key = 'waitlist-mercadoalerta:' + email.toLowerCase().trim();
      await window.storage.set(key, JSON.stringify({ email, joined_at: new Date().toISOString() }), true);
      notifyFormspree(email);
      noteEl.textContent = '¡Listo! Te escribimos apenas abramos la beta.';
      noteEl.classList.add('success');
      btnEl.textContent = 'Anotado ✓';
    } catch (err) {
      noteEl.textContent = 'Algo falló guardando tu correo. Intenta de nuevo.';
      btnEl.disabled = false;
      btnEl.textContent = originalText;
    }
  }

  document.getElementById('waitlistForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('emailInput').value;
    joinWaitlist(email, document.getElementById('formNote'), document.getElementById('submitBtn'));
  });

  document.getElementById('waitlistForm2').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('emailInput2').value;
    joinWaitlist(email, document.getElementById('formNote2'), document.getElementById('submitBtn2'));
  });

  // Admin panel: visita la landing agregando #admin al final de la URL para verla
  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  }

  async function loadWaitlist() {
    const countEl = document.getElementById('adminCount');
    const listEl = document.getElementById('adminList');
    countEl.textContent = 'CARGANDO…';
    listEl.innerHTML = '';
    try {
      const listing = await window.storage.list('waitlist-mercadoalerta:', true);
      const keys = (listing && listing.keys) ? listing.keys : [];
      if (keys.length === 0) {
        countEl.textContent = '0 PERSONAS EN LA LISTA';
        listEl.innerHTML = '<div class="admin-empty">Todavía nadie se ha anotado.</div>';
        return;
      }
      const entries = [];
      for (const k of keys) {
        try {
          const res = await window.storage.get(k, true);
          if (res && res.value) entries.push(JSON.parse(res.value));
        } catch { /* ignore unreadable entries */ }
      }
      entries.sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at));
      countEl.textContent = entries.length + (entries.length === 1 ? ' PERSONA EN LA LISTA' : ' PERSONAS EN LA LISTA');
      listEl.innerHTML = entries.map(e =>
        `<div class="admin-row"><span class="email">${e.email}</span><span class="date">${formatDate(e.joined_at)}</span></div>`
      ).join('');
      window.__waitlistEmails = entries.map(e => e.email);
    } catch (err) {
      countEl.textContent = 'ERROR AL CARGAR';
      listEl.innerHTML = '<div class="admin-empty">No se pudo leer el storage. Intenta actualizar.</div>';
    }
  }

  function initAdminPanel() {
    if (window.location.hash !== '#admin') return;
    document.getElementById('adminPanel').style.display = 'block';
    loadWaitlist();
    document.getElementById('refreshWaitlistBtn').addEventListener('click', loadWaitlist);
    document.getElementById('copyWaitlistBtn').addEventListener('click', async () => {
      const emails = (window.__waitlistEmails || []).join(', ');
      try {
        await navigator.clipboard.writeText(emails);
        const btn = document.getElementById('copyWaitlistBtn');
        const original = btn.textContent;
        btn.textContent = 'Copiado ✓';
        setTimeout(() => { btn.textContent = original; }, 1500);
      } catch { /* clipboard not available */ }
    });
  }

  initAdminPanel();
  window.addEventListener('hashchange', initAdminPanel);
