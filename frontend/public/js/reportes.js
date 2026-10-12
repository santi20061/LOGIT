async function inicializarReportes() {
  await Promise.all([
    cargarResumenEstado(obtenerPaquetes, 'reportePaquetesEstado', 'paquetes'),
    cargarResumenEstado(obtenerVehiculos, 'reporteVehiculosEstado', 'vehículos'),
    cargarResumenEstado(obtenerConductores, 'reporteConductoresEstado', 'conductores'),
    cargarResumenEstado(obtenerRutas, 'reporteRutasEstado', 'rutas')
  ]);
}

async function cargarResumenEstado(obtenerDatos, contenedorId, recurso) {
  const resultado = await obtenerDatos();
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  if (!resultado.success) {
    contenedor.innerHTML = '<p class="empty-state">No se pudo cargar este informe.</p>';
    mostrarAlerta(`Error al cargar el informe de ${recurso}.`, 'danger');
    return;
  }

  const totales = resultado.data.reduce((conteo, registro) => {
    conteo[registro.estado] = (conteo[registro.estado] || 0) + 1;
    return conteo;
  }, {});
  const estados = Object.entries(totales);

  if (estados.length === 0) {
    contenedor.innerHTML = '<p class="empty-state">No hay registros disponibles.</p>';
    return;
  }

  contenedor.innerHTML = `
    <ul class="status-summary">
      ${estados.map(([estado, total]) => `
        <li class="status-summary-item">
          ${obtenerBadgeEstado(estado)}
          <strong>${total.toLocaleString('es-CO')}</strong>
        </li>
      `).join('')}
    </ul>
  `;
}

async function exportarClientesCSV() {
  await exportarRecursoCSV(obtenerClientes, 'clientes.csv');
}

async function exportarPaquetesCSV() {
  await exportarRecursoCSV(obtenerPaquetes, 'paquetes.csv');
}

async function exportarVehiculosCSV() {
  await exportarRecursoCSV(obtenerVehiculos, 'vehiculos.csv');
}

async function exportarConductoresCSV() {
  await exportarRecursoCSV(obtenerConductores, 'conductores.csv');
}

async function exportarRutasCSV() {
  await exportarRecursoCSV(obtenerRutas, 'rutas.csv');
}

async function exportarEntregasCSV() {
  await exportarRecursoCSV(obtenerEntregas, 'entregas.csv');
}

async function exportarRecursoCSV(obtenerDatos, nombreArchivo) {
  const resultado = await obtenerDatos();
  if (!resultado.success) {
    mostrarAlerta(`No se pudo preparar ${nombreArchivo}.`, 'danger');
    return;
  }

  if (resultado.data.length === 0) {
    mostrarAlerta('No hay registros para exportar.', 'warning');
    return;
  }

  const columnas = [...new Set(resultado.data.flatMap(registro => Object.keys(registro)))];
  const escaparCelda = valor => {
    const texto = valor && typeof valor === 'object' ? JSON.stringify(valor) : String(valor ?? '');
    return `"${texto.replace(/"/g, '""')}"`;
  };
  const filas = [
    columnas,
    ...resultado.data.map(registro => columnas.map(columna => registro[columna]))
  ];
  const contenido = `\uFEFF${filas.map(fila => fila.map(escaparCelda).join(',')).join('\r\n')}`;
  const archivo = new Blob([contenido], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
