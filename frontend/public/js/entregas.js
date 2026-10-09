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
    (fila) => `<button class="btn btn-small btn-info" onclick="actualizarUbicacion(${fila.ID})">📍 Ubicación</button>`,
    (fila) => `<button class="btn btn-small btn-success" onclick="completarEntregaBtn(${fila.ID})">✅ Completar</button>`,
    (fila) => `<button class="btn btn-small btn-danger" onclick="eliminarEntregaConfirm(${fila.ID})">🗑️ Eliminar</button>`
  ];

  contenedor.innerHTML = `
    <div class="tabla-contenedor">
      ${crearTabla(
        resultado.data.map(e => ({
          ID: e.id,
          'Seguimiento': e.numeroSeguimiento,
          'Conductor': e.conductorNombre,
          'Ubicación': e.ubicacionActual,
          'Estado': obtenerBadgeEstado(e.estado),
          'Fecha': formatearFecha(e.fechaCreacion)
        })),
        ['ID', 'Seguimiento', 'Conductor', 'Ubicación', 'Estado', 'Fecha'],
        acciones
      )}
    </div>
  `;
}

function configurarFormularioEntregas() {
  const contenedor = document.getElementById('formularioEntregas');
  if (!contenedor) return;

  const form = document.createElement('form');
  form.className = 'card';
  form.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Nueva Entrega</h3>
    </div>
    <div class="card-body">
      <div class="form-row">
        <div class="form-group">
          <label for="paqueteId">Paquete *</label>
          <select id="paqueteId" name="paqueteId" required></select>
        </div>
        <div class="form-group">
          <label for="rutaId">Ruta *</label>
          <select id="rutaId" name="rutaId" required></select>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="conductorId">Conductor *</label>
          <select id="conductorId" name="conductorId" required></select>
        </div>
        <div class="form-group">
          <label for="ubicacionActual">Ubicación Actual</label>
          <input type="text" id="ubicacionActual" name="ubicacionActual" placeholder="Calle 5, Villavicencio">
        </div>
      </div>

      <div class="form-group form-row full">
        <label for="observaciones">Observaciones</label>
        <textarea id="observaciones" name="observaciones" placeholder="Notas de la entrega"></textarea>
      </div>

      <div class="btn-group">
        <button type="submit" class="btn btn-primary">➕ Registrar Entrega</button>
        <button type="reset" class="btn btn-secondary">Limpiar</button>
      </div>
    </div>
  `;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const datos = {
      paqueteId: parseInt(document.getElementById('paqueteId').value),
      rutaId: parseInt(document.getElementById('rutaId').value),
      conductorId: parseInt(document.getElementById('conductorId').value),
      ubicacionActual: document.getElementById('ubicacionActual').value,
      observaciones: document.getElementById('observaciones').value
    };

    const resultado = await crearEntrega(datos);
    
    if (resultado.success) {
      mostrarAlerta('✅ Entrega registrada correctamente', 'success');
      form.reset();
      cargarListaEntregas();
      cargarSelectsEntregas();
    } else {
      mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
    }
  });

  contenedor.appendChild(form);
  cargarSelectsEntregas();
}

async function cargarSelectsEntregas() {
  const resultadoPaquetes = await obtenerPaquetes();
  const resultadoRutas = await obtenerRutas();
  const resultadoConductores = await obtenerConductores();
  
  if (resultadoPaquetes.success) {
    const selectPaquete = document.getElementById('paqueteId');
    if (selectPaquete) {
      selectPaquete.innerHTML = '<option value="">-- Seleccionar paquete --</option>';
      resultadoPaquetes.data.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.numeroSeguimiento} - ${p.clienteNombre}`;
        selectPaquete.appendChild(option);
      });
    }
  }
  
  if (resultadoRutas.success) {
    const selectRuta = document.getElementById('rutaId');
    if (selectRuta) {
      selectRuta.innerHTML = '<option value="">-- Seleccionar ruta --</option>';
      resultadoRutas.data.forEach(r => {
        const option = document.createElement('option');
        option.value = r.id;
        option.textContent = r.nombre;
        selectRuta.appendChild(option);
      });
    }
  }
  
  if (resultadoConductores.success) {
    const selectConductor = document.getElementById('conductorId');
    if (selectConductor) {
      selectConductor.innerHTML = '<option value="">-- Seleccionar conductor --</option>';
      resultadoConductores.data.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.nombre;
        selectConductor.appendChild(option);
      });
    }
  }
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
  const ubicacion = document.getElementById('ubicacion').value;
  
  if (!ubicacion) {
    mostrarAlerta('Ingrese la ubicación', 'warning');
    return;
  }

  const resultado = await actualizarUbicacionEntrega(id, ubicacion);
  
  if (resultado.success) {
    mostrarAlerta('✅ Ubicación actualizada correctamente', 'success');
    cargarListaEntregas();
    configurarFormularioEntregas();
  } else {
    mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
  }
}

async function completarEntregaBtn(id) {
  let html = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Completar Entrega #${id}</h3>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label for="firma">Firma Recibido (Nombre)</label>
          <input type="text" id="firma" placeholder="Nombre de quien recibió">
        </div>
        <div class="form-group">
          <label for="observacionesEntrega">Observaciones</label>
          <textarea id="observacionesEntrega" placeholder="Notas de la entrega"></textarea>
        </div>
        <div class="btn-group">
          <button class="btn btn-success" onclick="guardarCompletarEntrega(${id})">✅ Completar</button>
          <button class="btn btn-secondary" onclick="cargarListaEntregas()">❌ Cancelar</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('formularioEntregas').innerHTML = html;
}

async function guardarCompletarEntrega(id) {
  const firma = document.getElementById('firma').value || 'Sin firma digital';
  const observaciones = document.getElementById('observacionesEntrega').value;

  const resultado = await completarEntrega(id, firma, observaciones);
  
  if (resultado.success) {
    mostrarAlerta('✅ Entrega completada correctamente', 'success');
    cargarListaEntregas();
    configurarFormularioEntregas();
  } else {
    mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
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