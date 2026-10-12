// ============================================
// RUTAS.JS - Lógica para módulo de rutas
// ============================================

async function inicializarRutas() {
  cargarListaRutas();
  configurarFormularioRutas();
}

async function cargarListaRutas() {
  const resultado = await obtenerRutas();
  
  if (!resultado.success) {
    mostrarAlerta('Error al cargar rutas', 'danger');
    return;
  }

  const contenedor = document.getElementById('tablaRutas');
  if (!contenedor) return;

  const acciones = [
    fila => ['planeada', 'en_curso'].includes(fila.estadoOriginal)
      ? `<button class="btn btn-small btn-warning" onclick="cambiarEstadoRuta(${fila.ID})">Cancelar ruta</button>`
      : '',
    fila => fila.estadoOriginal === 'planeada'
      ? `<button class="btn btn-small btn-danger" onclick="eliminarRutaConfirm(${fila.ID})">🗑️ Eliminar</button>`
      : ''
  ];

  contenedor.innerHTML = `
    <div class="tabla-contenedor">
      ${crearTabla(
        resultado.data.map(r => ({
          ID: r.id,
          'Nombre': r.nombre,
          'Conductor': r.Conductor ? r.Conductor.nombre : '-',
          'Vehículo': r.Vehiculo ? r.Vehiculo.placa : '-',
          'Paquetes': Array.isArray(r.Paquetes) ? r.Paquetes.length : 0,
          'Inicio': r.horaInicio || (r.estado === 'planeada' ? 'Pendiente: inicia el conductor' : '-'),
          'Estado': obtenerBadgeEstado(r.estado),
          estadoOriginal: r.estado
        })),
        ['ID', 'Nombre', 'Conductor', 'Vehículo', 'Paquetes', 'Inicio', 'Estado'],
        acciones
      )}
    </div>
  `;
}

function configurarFormularioRutas() {
  const contenedor = document.getElementById('formularioRutas');
  if (!contenedor) return;
  contenedor.innerHTML = `
    <div class="dispatch-route-note">
      <div>
        <strong>Las rutas se preparan desde Despacho diario</strong>
        <p>Selecciona paquetes de un municipio y asigna conductor y vehículo. El conductor inicia el viaje desde su portal cuando esté listo para salir.</p>
      </div>
      <button class="btn btn-primary" type="button" data-modulo="despacho">Ir a Despacho</button>
    </div>
  `;
}

async function cambiarEstadoRuta(id) {
  const resultadoRutas = await obtenerRutas();
  const ruta = resultadoRutas.data?.find(item => item.id === id);
  if (!resultadoRutas.success || !ruta) {
    mostrarAlerta('No se pudo cargar la ruta para cancelarla.', 'danger');
    return;
  }
  if (!['planeada', 'en_curso'].includes(ruta.estado)) return;
  if (!confirm('¿Confirmas cancelar esta ruta? Los paquetes no visitados volverán a estar pendientes.')) {
    return;
  }

  const resultado = await actualizarEstadoRuta(id, 'cancelada');
  if (resultado.success) {
    mostrarAlerta('Ruta cancelada.', 'success');
    await cargarListaRutas();
  } else {
    mostrarAlerta('No se pudo cancelar la ruta: ' + (resultado.error || resultado.message), 'danger');
  }
}

async function eliminarRutaConfirm(id) {
  if (!confirmar('¿Está seguro de que desea eliminar esta ruta?')) {
    return;
  }

  const resultado = await eliminarRuta(id);
  
  if (resultado.success) {
    mostrarAlerta('✅ Ruta eliminada correctamente', 'success');
    cargarListaRutas();
  } else {
    mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
  }
}