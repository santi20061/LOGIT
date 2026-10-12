// ============================================
// ENTREGAS.JS - Lógica para módulo de entregas
// ============================================

async function inicializarEntregas() {
  cargarListaEntregas();
  configurarFormularioEntregas();
}

async function cargarListaEntregas() {
  const resultado = await obtenerEntregas();
  
  if (!resultado.success) {
    mostrarAlerta('Error al cargar entregas', 'danger');
    return;
  }

  const contenedor = document.getElementById('tablaEntregas');
  if (!contenedor) return;

  const acciones = [
    (fila) => fila.estadoOriginal === 'en_transito'
      ? `<button class="btn btn-small btn-info" onclick="actualizarUbicacion(${fila.ID})">📍 Ubicación</button>`
      : '',
    (fila) => fila.estadoOriginal === 'en_transito'
      ? `<button class="btn btn-small btn-success" onclick="marcarLlegadaBtn(${fila.ID})">📦 Marcar en domicilio</button>`
      : '',
  ];

  contenedor.innerHTML = `
    <div class="tabla-contenedor">
      ${crearTabla(
        resultado.data.map(e => ({
          ID: e.id,
          'Seguimiento': e.numeroSeguimiento,
          'Conductor': e.Conductor ? e.Conductor.nombre : '-',
          'Ubicación': e.ubicacionActual,
          'Estado': obtenerBadgeEstado(e.estado),
          estadoOriginal: e.estado,
          'Novedad': e.motivoNovedad || '',
          'Fecha': formatearFecha(e.fechaCreacion)
        })),
        ['ID', 'Seguimiento', 'Conductor', 'Ubicación', 'Estado', 'Novedad', 'Fecha'],
        acciones
      )}
    </div>
  `;
}

function configurarFormularioEntregas() {
  const contenedor = document.getElementById('formularioEntregas');
  if (!contenedor) return;
  contenedor.innerHTML = `
    <div class="dispatch-route-note">
      <div>
        <strong>Las entregas se crean al iniciar la ruta</strong>
        <p>Prepara las asignaciones desde Despacho diario. Las visitas fallidas se conservan en este historial.</p>
      </div>
      <button class="btn btn-primary" type="button" data-modulo="despacho">Ir a Despacho</button>
    </div>
  `;
}
async function actualizarUbicacion(id) {
  let html = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Actualizar Ubicación - Entrega #${id}</h3>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label for="ubicacion">Nueva Ubicación *</label>
          <input type="text" id="ubicacion" placeholder="Ej: Calle 10, Villavicencio" required>
        </div>
        <div class="btn-group">
          <button class="btn btn-success" onclick="guardarUbicacionEntrega(${id})">💾 Guardar</button>
          <button class="btn btn-secondary" onclick="cargarListaEntregas()">❌ Cancelar</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('formularioEntregas').innerHTML = html;
}

async function guardarUbicacionEntrega(id) {
  const ubicacion = document.getElementById('ubicacion').value.trim();
  
  if (!ubicacion) {
    mostrarAlerta('Ingrese la ubicación', 'warning');
    return;
  }

  try {
    const response = await fetch(`/api/entregas/${id}/ubicacion`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ubicacionActual: ubicacion }),
    });
    const resultado = await response.json();

    if (!response.ok || !resultado.success) {
      mostrarAlerta('❌ Error: ' + (resultado.error || resultado.message || 'No se pudo actualizar la ubicación.'), 'danger');
      return;
    }

    mostrarAlerta('✅ Ubicación actualizada correctamente', 'success');
    cargarListaEntregas();
    configurarFormularioEntregas();
  } catch (error) {
    console.error('Error actualizando ubicación de entrega:', error);
    mostrarAlerta('❌ No se pudo conectar para actualizar la ubicación.', 'danger');
  }
}

async function marcarLlegadaBtn(id) {
  if (!confirm('Al marcar la llegada, el cliente podrá confirmar la recepción desde su perfil. ¿Continuar?')) {
    return;
  }
  const resultado = await marcarLlegadaEntrega(id);
  if (resultado.success) {
    mostrarAlerta(resultado.message, 'success');
    cargarListaEntregas();
  } else {
    mostrarAlerta('Error: ' + (resultado.error || resultado.message), 'danger');
  }
}

async function eliminarEntregaConfirm(id) {
  if (!confirmar('¿Está seguro de que desea eliminar esta entrega?')) {
    return;
  }

  const resultado = await eliminarEntrega(id);
  
  if (resultado.success) {
    mostrarAlerta('✅ Entrega eliminada correctamente', 'success');
    cargarListaEntregas();
  } else {
    mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
  }
}