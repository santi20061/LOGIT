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
    (fila) => `<button class="btn btn-small btn-success" onclick="iniciarRutaBtn(${fila.ID})">▶️ Iniciar</button>`,
    (fila) => `<button class="btn btn-small btn-info" onclick="asignarPaqueteRutaBtn(${fila.ID})">📦 Asignar</button>`,
    (fila) => `<button class="btn btn-small btn-warning" onclick="cambiarEstadoRuta(${fila.ID})">📊 Estado</button>`,
    (fila) => `<button class="btn btn-small btn-danger" onclick="eliminarRutaConfirm(${fila.ID})">🗑️ Eliminar</button>`
  ];

  contenedor.innerHTML = `
    <div class="tabla-contenedor">
      ${crearTabla(
        resultado.data.map(r => ({
          ID: r.id,
          'Nombre': r.nombre,
          'Conductor': r.conductorNombre,
          'Vehículo': r.vehiculoPlaca,
          'Paquetes': r.paquetesAsignados.length,
          'Inicio': r.horaInicio,
          'Estado': obtenerBadgeEstado(r.estado)
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

  const form = document.createElement('form');
  form.className = 'card';
  form.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Nueva Ruta</h3>
    </div>
    <div class="card-body">
      <div class="form-row">
        <div class="form-group">
          <label for="nombre">Nombre *</label>
          <input type="text" id="nombre" name="nombre" required placeholder="Ruta Centro-Este">
        </div>
        <div class="form-group">
          <label for="conductorId">Conductor *</label>
          <select id="conductorId" name="conductorId" required></select>
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="vehiculoId">Vehículo *</label>
          <select id="vehiculoId" name="vehiculoId" required></select>
        </div>
        <div class="form-group">
          <label for="horaInicio">Hora Inicio</label>
          <input type="time" id="horaInicio" name="horaInicio" value="08:00">
        </div>
      </div>

      <div class="form-group form-row full">
        <label for="descripcion">Descripción</label>
        <textarea id="descripcion" name="descripcion" placeholder="Detalles de la ruta"></textarea>
      </div>

      <div class="btn-group">
        <button type="submit" class="btn btn-primary">➕ Crear Ruta</button>
        <button type="reset" class="btn btn-secondary">Limpiar</button>
      </div>
    </div>
  `;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const datos = {
      nombre: document.getElementById('nombre').value,
      conductorId: parseInt(document.getElementById('conductorId').value),
      vehiculoId: parseInt(document.getElementById('vehiculoId').value),
      horaInicio: document.getElementById('horaInicio').value,
      descripcion: document.getElementById('descripcion').value
    };

    const resultado = await crearRuta(datos);
    
    if (resultado.success) {
      mostrarAlerta('✅ Ruta creada correctamente', 'success');
      form.reset();
      cargarListaRutas();
      cargarSelectsConductoresVehiculos();
    } else {
      mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
    }
  });

  contenedor.appendChild(form);
  cargarSelectsConductoresVehiculos();
}

async function cargarSelectsConductoresVehiculos() {
  const resultadoConductores = await obtenerConductores();
  const resultadoVehiculos = await obtenerVehiculos();
  
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
  
  if (resultadoVehiculos.success) {
    const selectVehiculo = document.getElementById('vehiculoId');
    if (selectVehiculo) {
      selectVehiculo.innerHTML = '<option value="">-- Seleccionar vehículo --</option>';
      resultadoVehiculos.data.forEach(v => {
        const option = document.createElement('option');
        option.value = v.id;
        option.textContent = `${v.placa} - ${v.marca} ${v.modelo}`;
        selectVehiculo.appendChild(option);
      });
    }
  }
}

async function iniciarRutaBtn(id) {
  if (!confirmar('¿Desea iniciar esta ruta?')) {
    return;
  }

  const resultado = await iniciarRuta(id);
  
  if (resultado.success) {
    mostrarAlerta('✅ Ruta iniciada correctamente', 'success');
    cargarListaRutas();
  } else {
    mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
  }
}

async function asignarPaqueteRutaBtn(id) {
  const resultadoPaquetes = await obtenerPaquetes();
  
  if (!resultadoPaquetes.success) {
    mostrarAlerta('Error al cargar paquetes', 'danger');
    return;
  }

  let html = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Asignar Paquete - Ruta #${id}</h3>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label for="paqueteId">Seleccionar Paquete *</label>
          <select id="paqueteId" required>
            <option value="">-- Seleccionar --</option>
  `;
  
  resultadoPaquetes.data.forEach(p => {
    html += `<option value="${p.id}">${p.numeroSeguimiento} - ${p.clienteNombre}</option>`;
  });
  
  html += `
          </select>
        </div>
        <div class="btn-group">
          <button class="btn btn-success" onclick="guardarPaqueteRuta(${id})">💾 Asignar</button>
          <button class="btn btn-secondary" onclick="cargarListaRutas()">❌ Cancelar</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('formularioRutas').innerHTML = html;
}

async function guardarPaqueteRuta(id) {
  const paqueteId = document.getElementById('paqueteId').value;
  
  if (!paqueteId) {
    mostrarAlerta('Seleccione un paquete', 'warning');
    return;
  }

  const resultado = await asignarPaqueteRuta(id, paqueteId);
  
  if (resultado.success) {
    mostrarAlerta('✅ Paquete asignado correctamente', 'success');
    cargarListaRutas();
    configurarFormularioRutas();
  } else {
    mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
  }
}

async function cambiarEstadoRuta(id) {
  const estados = ['Planificada', 'En progreso', 'Completada', 'Cancelada'];
  
  let html = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Cambiar Estado - Ruta #${id}</h3>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label for="nuevoEstado">Nuevo Estado *</label>
          <select id="nuevoEstado" required>
            <option value="">-- Seleccionar --</option>
  `;
  
  estados.forEach(estado => {
    html += `<option value="${estado}">${estado}</option>`;
  });
  
  html += `
          </select>
        </div>
        <div class="btn-group">
          <button class="btn btn-success" onclick="guardarEstadoRuta(${id})">💾 Guardar</button>
          <button class="btn btn-secondary" onclick="cargarListaRutas()">❌ Cancelar</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('formularioRutas').innerHTML = html;
}

async function guardarEstadoRuta(id) {
  const nuevoEstado = document.getElementById('nuevoEstado').value;
  
  if (!nuevoEstado) {
    mostrarAlerta('Seleccione un estado', 'warning');
    return;
  }

  const resultado = await actualizarEstadoRuta(id, nuevoEstado);
  
  if (resultado.success) {
    mostrarAlerta('✅ Estado actualizado correctamente', 'success');
    cargarListaRutas();
    configurarFormularioRutas();
  } else {
    mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
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