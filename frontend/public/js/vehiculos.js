// ============================================
// VEHICULOS.JS - Lógica para módulo de vehículos
// ============================================

async function inicializarVehiculos() {
  cargarListaVehiculos();
  configurarFormularioVehiculos();
}

async function cargarListaVehiculos() {
  const resultado = await obtenerVehiculos();
  
  if (!resultado.success) {
    mostrarAlerta('Error al cargar vehículos', 'danger');
    return;
  }

  const contenedor = document.getElementById('tablaVehiculos');
  if (!contenedor) return;

  const acciones = [
    (fila) => `<button class="btn btn-small btn-info" onclick="cambiarEstadoVehiculo(${fila.ID})">📊 Estado</button>`,
    (fila) => `<button class="btn btn-small btn-danger" onclick="eliminarVehiculoConfirm(${fila.ID})">🗑️ Eliminar</button>`
  ];

  contenedor.innerHTML = `
    <div class="tabla-contenedor">
      ${crearTabla(
        resultado.data.map(v => ({
          ID: v.id,
          'Placa': v.placa,
          'Marca': v.marca,
          'Modelo': v.modelo,
          'Año': v.año,
          'Capacidad': v.capacidad,
          'Estado': obtenerBadgeEstado(v.disponibilidad || v.estado),
          'Registro': formatearFecha(v.fechaRegistro)
        })),
        ['ID', 'Placa', 'Marca', 'Modelo', 'Año', 'Capacidad', 'Estado', 'Registro'],
        acciones
      )}
    </div>
  `;
}

function configurarFormularioVehiculos() {
  const contenedor = document.getElementById('formularioVehiculos');
  if (!contenedor) return;

  const form = document.createElement('form');
  form.className = 'card';
  form.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Nuevo Vehículo</h3>
    </div>
    <div class="card-body">
      <div class="form-row">
        <div class="form-group">
          <label for="placa">Placa *</label>
          <input type="text" id="placa" name="placa" required placeholder="VHC-001">
        </div>
        <div class="form-group">
          <label for="marca">Marca *</label>
          <input type="text" id="marca" name="marca" required placeholder="Chevrolet">
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="modelo">Modelo *</label>
          <input type="text" id="modelo" name="modelo" required placeholder="N300">
        </div>
        <div class="form-group">
          <label for="año">Año *</label>
          <input type="number" id="año" name="año" required placeholder="2022" min="1990" max="2100">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="capacidad">Capacidad *</label>
          <input type="text" id="capacidad" name="capacidad" required placeholder="500kg">
        </div>
        <div class="form-group">
          <label for="observaciones">Observaciones</label>
          <input type="text" id="observaciones" name="observaciones" placeholder="Notas adicionales">
        </div>
      </div>

      <div class="btn-group">
        <button type="submit" class="btn btn-primary">➕ Crear Vehículo</button>
        <button type="reset" class="btn btn-secondary">Limpiar</button>
      </div>
    </div>
  `;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const datos = {
      placa: document.getElementById('placa').value,
      marca: document.getElementById('marca').value,
      modelo: document.getElementById('modelo').value,
      año: parseInt(document.getElementById('año').value),
      capacidad: document.getElementById('capacidad').value,
      observaciones: document.getElementById('observaciones').value
    };

    const resultado = await crearVehiculo(datos);
    
    if (resultado.success) {
      mostrarAlerta('✅ Vehículo creado correctamente', 'success');
      form.reset();
      cargarListaVehiculos();
    } else {
      mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
    }
  });

  contenedor.appendChild(form);
}

async function cambiarEstadoVehiculo(id) {
  const estados = ['Disponible', 'En ruta', 'En mantenimiento'];
  
  let html = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Cambiar Estado - Vehículo #${id}</h3>
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
          <button class="btn btn-success" onclick="guardarEstadoVehiculo(${id})">💾 Guardar</button>
          <button class="btn btn-secondary" onclick="cargarListaVehiculos()">❌ Cancelar</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('formularioVehiculos').innerHTML = html;
}

async function guardarEstadoVehiculo(id) {
  const nuevoEstado = document.getElementById('nuevoEstado').value;
  
  if (!nuevoEstado) {
    mostrarAlerta('Seleccione un estado', 'warning');
    return;
  }

  const resultado = await actualizarEstadoVehiculo(id, nuevoEstado);
  
  if (resultado.success) {
    mostrarAlerta('✅ Estado actualizado correctamente', 'success');
    cargarListaVehiculos();
    configurarFormularioVehiculos();
  } else {
    mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
  }
}

async function eliminarVehiculoConfirm(id) {
  if (!confirmar('¿Está seguro de que desea eliminar este vehículo?')) {
    return;
  }

  const resultado = await eliminarVehiculo(id);
  
  if (resultado.success) {
    mostrarAlerta('✅ Vehículo eliminado correctamente', 'success');
    cargarListaVehiculos();
  } else {
    mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
  }
}