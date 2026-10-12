// ============================================
// MAIN.JS - Controlador principal LOGIT
// ============================================

let verificandoSesion = true;
let usuarioActual = null;

// ==================== FUNCIONES GLOBALES ====================

function cerrarModal() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.style.display = 'none';
    const extra = document.getElementById('modal-extra');
    if (extra) {
      extra.replaceChildren();
      extra.hidden = true;
    }
  }
}

function abrirModal() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.style.display = 'block';
  }
}

async function cargarModulo(nombreModulo) {
  const mainContent = document.getElementById('contenido');

  if (!mainContent) {
    console.error('Elemento #contenido no encontrado');
    return;
  }

  try {
    // Cargar HTML del módulo
    const response = await fetch(`pages/${nombreModulo}.html`);
    if (!response.ok) throw new Error(`Error 404: ${nombreModulo}.html no encontrado`);

    const html = await response.text();
    mainContent.innerHTML = html;

    // Cargar y ejecutar JS del módulo
    const scriptTag = document.createElement('script');
    scriptTag.src = `js/${nombreModulo}.js`;

    scriptTag.onload = async () => {
      // Buscar función de inicialización
      const nombresInicializadores = {
        'portal-cliente': 'inicializarPortalCliente',
        'perfil-cliente': 'inicializarPerfilCliente',
        'portal-conductor': 'inicializarPortalConductor',
        despacho: 'inicializarDespacho',
      };
      const funcName = nombresInicializadores[nombreModulo]
        || `inicializar${nombreModulo.charAt(0).toUpperCase() + nombreModulo.slice(1)}`;
      const funcInit = window[funcName];

      if (funcInit && typeof funcInit === 'function') {
        await funcInit();
      }
    };

    scriptTag.onerror = () => {
      console.error(`Error cargando ${nombreModulo}.js`);
    };

    document.body.appendChild(scriptTag);
  } catch (error) {
    console.error('Error cargando módulo:', error);
    mainContent.innerHTML = `<div class="card"><div class="card-body"><p style="color: red;">Error al cargar ${nombreModulo}</p><p>${error.message}</p></div></div>`;
  }
}

function actualizarFechaHora() {
  const fecha = new Date();
  const opciones = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  const fechaFormato = fecha.toLocaleDateString('es-CO', opciones);
  const elemento = document.getElementById('fecha-hora');
  if (elemento) {
    elemento.textContent = fechaFormato;
  }
}

function mostrarLogin(mensaje = '') {
  usuarioActual = null;
  document.getElementById('app-shell').hidden = true;
  document.getElementById('login-screen').hidden = false;
  document.getElementById('login-form').hidden = false;
  document.getElementById('change-password-form').hidden = true;
  const error = document.getElementById('login-error');
  error.textContent = mensaje;
  error.hidden = !mensaje;
  document.getElementById('login-password').value = '';
}

function mostrarCambioPassword(mensaje = '') {
  document.getElementById('app-shell').hidden = true;
  document.getElementById('login-screen').hidden = false;
  document.getElementById('login-form').hidden = true;
  document.getElementById('change-password-form').hidden = false;
  const error = document.getElementById('change-password-error');
  error.textContent = mensaje;
  error.hidden = !mensaje;
  document.getElementById('new-password').value = '';
  document.getElementById('confirm-password').value = '';
}

function mostrarAplicacion(usuario) {
  usuarioActual = usuario;
  document.getElementById('login-screen').hidden = true;
  document.getElementById('app-shell').hidden = false;
  const navegacion = document.querySelector('.sidebar nav');
  const notaLateral = document.querySelector('.sidebar-note');
  const titulo = document.getElementById('topbar-title');
  document.getElementById('topbar-user').textContent = usuario.nombre;

  if (usuario.rol === 'admin') {
    document.querySelector('.brand-caption').textContent = 'Operaciones logísticas';
    navegacion.innerHTML = `
      <button class="menu-btn active" type="button" data-modulo="dashboard" aria-current="page"><span class="nav-icon" aria-hidden="true">⌂</span>Panel general</button>
      <button class="menu-btn" type="button" data-modulo="clientes"><span class="nav-icon" aria-hidden="true">◎</span>Clientes</button>
      <button class="menu-btn" type="button" data-modulo="paquetes"><span class="nav-icon" aria-hidden="true">▣</span>Paquetes</button>
      <button class="menu-btn" type="button" data-modulo="despacho"><span class="nav-icon" aria-hidden="true">↗</span>Despacho diario</button>
      <button class="menu-btn" type="button" data-modulo="vehiculos"><span class="nav-icon" aria-hidden="true">▰</span>Vehículos</button>
      <button class="menu-btn" type="button" data-modulo="conductores"><span class="nav-icon" aria-hidden="true">♧</span>Conductores</button>
      <button class="menu-btn" type="button" data-modulo="rutas"><span class="nav-icon" aria-hidden="true">⌁</span>Rutas</button>
      <button class="menu-btn" type="button" data-modulo="entregas"><span class="nav-icon" aria-hidden="true">↗</span>Entregas</button>
      <button class="menu-btn" type="button" data-modulo="reportes"><span class="nav-icon" aria-hidden="true">▥</span>Informes</button>
    `;
    notaLateral.textContent = 'Gestión centralizada · Paquetes, rutas y entregas';
    titulo.textContent = 'Centro de operaciones';
    cargarModulo('dashboard');
    return;
  }

  if (usuario.rol === 'conductor') {
    document.querySelector('.brand-caption').textContent = 'Portal del conductor';
    navegacion.innerHTML = `
      <button class="menu-btn active" type="button" data-modulo="portal-conductor" aria-current="page"><span class="nav-icon" aria-hidden="true">⌁</span>Mi ruta</button>
    `;
    notaLateral.textContent = 'Consulta tus paradas y registra su resultado.';
    titulo.textContent = 'Mi ruta de entregas';
    cargarModulo('portal-conductor');
    return;
  }

  document.querySelector('.brand-caption').textContent = 'Portal de clientes';
  navegacion.innerHTML = `
    <button class="menu-btn active" type="button" data-modulo="portal-cliente" aria-current="page"><span class="nav-icon" aria-hidden="true">▣</span>Mis pedidos</button>
    <button class="menu-btn" type="button" data-modulo="perfil-cliente"><span class="nav-icon" aria-hidden="true">◎</span>Mi perfil</button>
  `;
  notaLateral.textContent = 'Consulta tus pedidos y actualiza tus datos.';
  titulo.textContent = 'Portal de clientes';
  cargarModulo('portal-cliente');
}

async function verificarSesion() {
  try {
    const response = await fetch('/api/auth/session');
    if (response.status === 401) {
      mostrarLogin();
      return;
    }
    if (!response.ok) {
      throw new Error(`No se pudo validar la sesión (HTTP ${response.status}).`);
    }

    const resultado = await response.json();
    if (resultado.data.debeCambiarPassword) {
      usuarioActual = resultado.data;
      mostrarCambioPassword();
      return;
    }
    mostrarAplicacion(resultado.data);
    actualizarFechaHora();
  } catch (error) {
    console.error('Error verificando sesión:', error);
    mostrarLogin('No se pudo conectar con el servidor. Comprueba que LOGIT esté iniciado e inténtalo de nuevo.');
  } finally {
    verificandoSesion = false;
    document.getElementById('login-submit').disabled = false;
  }
}

async function iniciarSesion(event) {
  event.preventDefault();
  if (verificandoSesion) return;
  const formulario = event.currentTarget;
  const boton = document.getElementById('login-submit');
  const mensaje = document.getElementById('login-error');
  boton.disabled = true;
  boton.textContent = 'Verificando...';
  mensaje.hidden = true;

  try {
    const datos = new FormData(formulario);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: datos.get('email'),
        password: datos.get('password')
      })
    });
    const resultado = await response.json();
    if (!response.ok || !resultado.success) {
      throw new Error(resultado.error || 'No se pudo iniciar sesión.');
    }

    formulario.reset();
    if (resultado.data.debeCambiarPassword) {
      usuarioActual = resultado.data;
      mostrarCambioPassword();
    } else {
      mostrarAplicacion(resultado.data);
      actualizarFechaHora();
    }
  } catch (error) {
    console.error('Error iniciando sesión:', error);
    mensaje.textContent = error.message || 'Ocurrió un error al iniciar sesión.';
    mensaje.hidden = false;
  } finally {
    boton.disabled = false;
    boton.textContent = 'Entrar al sistema';
  }
}

async function cambiarPasswordInicial(event) {
  event.preventDefault();
  const formulario = event.currentTarget;
  const boton = document.getElementById('change-password-submit');
  const mensaje = document.getElementById('change-password-error');
  const datos = new FormData(formulario);
  boton.disabled = true;
  boton.textContent = 'Guardando...';
  mensaje.hidden = true;

  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: datos.get('password'),
        confirmarPassword: datos.get('confirmarPassword'),
      }),
    });
    const resultado = await response.json();
    if (!response.ok || !resultado.success) {
      throw new Error(resultado.error || 'No se pudo cambiar la contraseña.');
    }

    formulario.reset();
    mostrarAplicacion(resultado.data);
    actualizarFechaHora();
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    mensaje.textContent = error.message || 'Ocurrió un error al cambiar la contraseña.';
    mensaje.hidden = false;
  } finally {
    boton.disabled = false;
    boton.textContent = 'Guardar contraseña';
  }
}

async function cerrarSesionUsuario() {
  const boton = document.getElementById('logout-btn');
  boton.disabled = true;
  try {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (!response.ok) {
      throw new Error(`No se pudo cerrar la sesión (HTTP ${response.status}).`);
    }
    mostrarLogin();
  } catch (error) {
    console.error('Error cerrando sesión:', error);
    mostrarAlerta('No se pudo cerrar la sesión. Inténtalo nuevamente.', 'danger');
  } finally {
    boton.disabled = false;
  }
}

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', () => {
  setInterval(actualizarFechaHora, 60000);

  document.getElementById('login-submit').disabled = true;
  document.getElementById('login-form').addEventListener('submit', iniciarSesion);
  document.getElementById('change-password-form').addEventListener('submit', cambiarPasswordInicial);
  document.getElementById('logout-btn').addEventListener('click', cerrarSesionUsuario);
  document.querySelectorAll('.modal-close, .btn-modal-cerrar').forEach(boton => {
    boton.addEventListener('click', cerrarModal);
  });
  document.getElementById('modal').addEventListener('click', event => {
    if (event.target.id === 'modal') cerrarModal();
  });

  document.addEventListener('click', (event) => {
    const boton = event.target.closest('[data-modulo]');
    if (!boton) return;

    const modulo = boton.dataset.modulo;
    if (!modulo) return;

    document.querySelectorAll('.menu-btn').forEach(menuBtn => {
      const activo = menuBtn.dataset.modulo === modulo;
      menuBtn.classList.toggle('active', activo);
      if (activo) {
        menuBtn.setAttribute('aria-current', 'page');
      } else {
        menuBtn.removeAttribute('aria-current');
      }
    });

    cargarModulo(modulo);
  });

  verificarSesion();
});