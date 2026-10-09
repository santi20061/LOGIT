// ============================================
// MAIN.JS - Lógica Principal y Navegación
// ============================================

const rutas = {
  dashboard: 'pages/dashboard.html',
  clientes: 'pages/clientes.html',
  paquetes: 'pages/paquetes.html',
  vehiculos: 'pages/vehiculos.html',
  conductores: 'pages/conductores.html',
  rutas: 'pages/rutas.html',
  entregas: 'pages/entregas.html',
  reportes: 'pages/reportes.html'
};

document.addEventListener('DOMContentLoaded', () => {
  inicializarApp();
  actualizarFechaHora();
  setInterval(actualizarFechaHora, 1000);
});

function inicializarApp() {
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modulo = btn.dataset.modulo;
      cargarPagina(modulo);
    });
  });

  document.querySelector('.modal-close').addEventListener('click', cerrarModal);
  document.querySelector('.btn-modal-cerrar').addEventListener('click', cerrarModal);
  
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') {
      cerrarModal();
    }
  });

  cargarPagina('dashboard');
}

async function cargarPagina(modulo) {
  try {
    document.querySelectorAll('.menu-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-modulo="${modulo}"]`).classList.add('active');

    const contenedor = document.getElementById('contenido');
    contenedor.innerHTML = '<div class="loading"><p>Cargando...</p></div>';

    const ruta = rutas[modulo];
    if (!ruta) {
      contenedor.innerHTML = '<p class="text-center">Página no encontrada</p>';
      return;
    }

    const response = await fetch(ruta);
    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }
    const html = await response.text();
    contenedor.innerHTML = html;

    if (window[`inicializar${modulo.charAt(0).toUpperCase()}${modulo.slice(1)}`]) {
      window[`inicializar${modulo.charAt(0).toUpperCase()}${modulo.slice(1)}`]();
    }
  } catch (error) {
    console.error('Error cargando página:', error);
    document.getElementById('contenido').innerHTML = `
      <div class="alert alert-danger">
        Error cargando la página: ${error.message}
      </div>
    `;
  }
}

function actualizarFechaHora() {
  const fechaHoraDiv = document.getElementById('fecha-hora');
  const ahora = new Date();
  
  const opciones = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  
  const fechaFormato = ahora.toLocaleDateString('es-CO', opciones);
  fechaHoraDiv.textContent = fechaFormato;
}

function crearTabla(datos, columnas, acciones = null) {
  if (datos.length === 0) {
    return '<p class="text-center">No hay datos registrados</p>';
  }

  let html = '<table><thead><tr>';
  
  columnas.forEach(col => {
    html += `<th>${col}</th>`;
  });
  
  if (acciones) {
    html += '<th>Acciones</th>';
  }
  
  html += '</tr></thead><tbody>';

  datos.forEach((fila, index) => {
    html += '<tr>';
    
    Object.values(fila).forEach(valor => {
      html += `<td>${valor || '-'}</td>`;
    });
    
    if (acciones) {
      html += '<td>';
      acciones.forEach(accion => {
        html += accion(fila, index);
      });
      html += '</td>';
    }
    
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
}

function validarFormulario(form) {
  const datos = new FormData(form);
  const objeto = Object.fromEntries(datos);
  
  for (let [clave, valor] of Object.entries(objeto)) {
    if (!valor || valor.trim() === '') {
      mostrarAlerta(`El campo ${clave} es obligatorio`, 'danger');
      return null;
    }
  }
  
  return objeto;
}

function formatearFecha(fecha) {
  if (!fecha) return '-';
  const date = new Date(fecha);
  return date.toLocaleDateString('es-CO');
}

function obtenerBadgeEstado(estado) {
  const badges = {
    'Disponible': 'badge-success',
    'En tránsito': 'badge-warning',
    'En ruta': 'badge-info',
    'Entregado': 'badge-success',
    'Registrado': 'badge-info',
    'Asignado': 'badge-info',
    'Planificada': 'badge-secondary',
    'En progreso': 'badge-warning',
    'Completada': 'badge-success'
  };
  
  const clase = badges[estado] || 'badge-secondary';
  return `<span class="badge ${clase}">${estado}</span>`;
}

function confirmar(mensaje) {
  return confirm(mensaje);
}

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function exportarCSV(datos, nombre = 'datos.csv') {
  if (datos.length === 0) return;
  
  const headers = Object.keys(datos[0]);
  let csv = headers.join(',') + '\n';
  
  datos.forEach(fila => {
    const valores = headers.map(h => {
      const valor = fila[h];
      return typeof valor === 'string' && valor.includes(',') ? `"${valor}"` : valor;
    });
    csv += valores.join(',') + '\n';
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  window.URL.revokeObjectURL(url);
}