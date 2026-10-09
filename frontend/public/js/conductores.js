// ============================================
// CONDUCTORES.JS - Lógica para módulo de conductores
// ============================================

async function inicializarConductores() {
  cargarListaConductores();
  configurarFormularioConductores();
}

async function cargarListaConductores() {
  const resultado = await obtenerConductores();
  
  if (!resultado.success) {
    mostrarAlerta('Error al cargar conductores', 'danger');
    return;
  }

  const contenedor = document.getElementById('tablaConductores');
  if (!contenedor) return;

  const acciones = [
    (fila) => `<button class="btn btn-small btn-info" onclick="asignarVehiculoA(${fila.ID})">🚚 Asignar</button>`,
    (fila) => `<button class="btn btn-small btn-warning" onclick="cambiarEstadoConductor(${fila.ID})">📊 Estado</button>`,
    (fila) => `<button class="btn btn-small btn-danger" onclick="eliminarConductorConfirm(${fila.ID})">🗑️ Eliminar</button>`
  ];

  contenedor.innerHTML = `
    <div class="tabla-contenedor">
      ${crearTabla(
        resultado.data.map(c => ({
          ID: c.id,
          'Nombre': c.nombre,
          'Cédula': c.cedula,
          'Teléfono': c.telefono,
          'Licencia': c.licencia,
          'Vehículo': c.vehiculoPlaca,
          'Estado': obtenerBadgeEstado(c.estado)
        })),
        ['ID', 'Nombre', 'Cédula', 'Teléfono', 'Licencia', 'Vehículo', 'Estado'],
        acciones
      )}
    </div>
  `;
}

function configurarFormularioConductores() {
  const contenedor = document.getElementById('formularioConductores');
  if (!contenedor) return;

  const form = document.createElement('form');
  form.className = 'card';
  form.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Nuevo Conductor</h3>
    </div>
    <div class="card-body">
      <div class="form-row">
        <div class="form-group">
          <label for="nombre">Nombre *</label>
          <input type="text" id="nombre" name="nombre" required placeholder="Nombre completo">
        </div>
        <div class="form-group">
          <label for="cedula">Cédula *</label>
          <input type="text" id="cedula" name="cedula" required placeholder="1023456789">
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="telefono">Teléfono *</label>
          <input type="tel" id="telefono" name="telefono" required placeholder="3101234567">
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" placeholder="conductor@email.com">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="licencia">Número de Licencia *</label>
          <input type="text" id="licencia" name="licencia" required placeholder="CC-123456">
        </div>
        <div class="form-group">
          <label for="categorialicencia">Categoría Licencia</label>
          <select id="categorialicencia" name="categorialicencia">
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C" selected>C</option>
          </select>
        </div>
      </div>

      <div class="form-group form-row full">
        <label for="observaciones">Observaciones</label>
        <textarea id="observaciones" name="observaciones" placeholder="Notas adicionales"></textarea>
      </div>

      <div class="btn-group">
        <button type="submit" class="btn btn-primary">➕ Crear Conductor</button>
        <button type="reset" class="btn btn-secondary">Limpiar</button>
      </div>
    </div>
  `;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const datos = {
      nombre: document.getElementById('nombre').value,
      cedula: document.getElementById('cedula').value,
      telefono: document.getElementById('telefono').value,
      email: document.getElementById('email').value,
      licencia: document.getElementById('licencia').value,
      categorialicencia: document.getElementById('categorialicencia').value,
      observaciones: document.getElementById('observaciones').value
    };

    const resultado = await crearConductor(datos);
    
    if (resultado.success) {
      mostrarAlerta('✅ Conductor creado correctamente', 'success');
      form.reset();
      cargarListaConductores();
    } else {
      mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
    }
  });

  contenedor.appendChild(form);
}

async function asignarVehiculoA(id) {
  const resultadoVehiculos = await obtenerVehiculos();
  
  if (!resultadoVehiculos.success) {
    mostrarAlerta('Error al cargar vehículos', 'danger');
    return;
  }

  let html = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Asignar Vehículo - Conductor #${id}</h3>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label for="vehiculoId">Seleccionar Vehículo *</label>
          <select id="vehiculoId" required>
            <option value="">-- Seleccionar --</option>
  `;
  
  resultadoVehiculos.data.forEach(v => {
    html += `<option value="${v.id}">${v.placa} - ${v.marca} ${v.modelo}</option>`;
  });
  
  html += `
          </select>
        </div>
        <div class="btn-group">
          <button class="btn btn-success" onclick="guardarVehiculoConductor(${id})">💾 Asignar</button>
          <button class="btn btn-secondary" onclick="cargarListaConductores()">❌ Cancelar</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('formularioConductores').innerHTML = html;
}

async function guardarVehiculoConductor(id) {
  const vehiculoId = document.getElementById('vehiculoId').value;
  
  if (!vehiculoId) {
    mostrarAlerta('Seleccione un vehículo', 'warning');
    return;
  }

  const resultado = await asignarVehiculo(id, vehiculoId);
  
  if (resultado.success) {
    mostrarAlerta('✅ Vehículo asignado correctamente', 'success');
    cargarListaConductores();
    configurarFormularioConductores();
  } else {
    mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
  }
}

async function cambiarEstadoConductor(id) {
  const estados = ['Disponible', 'En ruta', 'Descansando'];
  
  let html = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Cambiar Estado - Conductor #${id}</h3>
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
          <button class="btn btn-success" onclick="guardarEstadoConductor(${id})">💾 Guardar</button>
          <button class="btn btn-secondary" onclick="cargarListaConductores()">❌ Cancelar</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('formularioConductores').innerHTML = html;
}

async function guardarEstadoConductor(id) {
  const nuevoEstado = document.getElementById('nuevoEstado').value;
  
  if (!nuevoEstado) {
    mostrarAlerta('Seleccione un estado', 'warning');
    return;
  }

  const resultado = await actualizarEstadoConductor(id, nuevoEstado);
  
  if (resultado.success) {
    mostrarAlerta('✅ Estado actualizado correctamente', 'success');
    cargarListaConductores();
    configurarFormularioConductores();
  } else {
    mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
  }
}

async function eliminarConductorConfirm(id) {
  if (!confirmar('¿Está seguro de que desea eliminar este conductor?')) {
    return;
  }

  const resultado = await eliminarConductor(id);
  
  if (resultado.success) {
    mostrarAlerta('✅ Conductor eliminado correctamente', 'success');
    cargarListaConductores();
  } else {
    mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
  }
}