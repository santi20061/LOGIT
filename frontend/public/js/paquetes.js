// ============================================
// PAQUETES.JS - Lógica para módulo de paquetes
// ============================================

async function inicializarPaquetes() {
  cargarListaPaquetes();
  configurarFormularioPaquetes();
}

async function cargarListaPaquetes() {
  const resultado = await obtenerPaquetes();
  
  if (!resultado.success) {
    mostrarAlerta('Error al cargar paquetes', 'danger');
    return;
  }

  const contenedor = document.getElementById('tablaPaquetes');
  if (!contenedor) return;

  const acciones = [
    (fila) => `<button class="btn btn-small btn-info" onclick="cambiarEstadoPaquete(${fila.ID})">📊 Estado</button>`,
    (fila) => `<button class="btn btn-small btn-warning" onclick="editarPaquete(${fila.ID})">✏️ Editar</button>`,
    (fila) => `<button class="btn btn-small btn-danger" onclick="eliminarPaqueteConfirm(${fila.ID})">🗑️ Eliminar</button>`
  ];

  contenedor.innerHTML = `
    <div class="tabla-contenedor">
      ${crearTabla(
        resultado.data.map(p => ({
          ID: p.id,
          'Seguimiento': p.numeroSeguimiento,
          'Cliente': p.clienteNombre,
          'Origen': p.origen,
          'Destino': p.destino,
          'Peso': p.peso + ' kg',
          'Valor': '$' + p.valor.toLocaleString(),
          'Estado': obtenerBadgeEstado(p.estado)
        })),
        ['ID', 'Seguimiento', 'Cliente', 'Origen', 'Destino', 'Peso', 'Valor', 'Estado'],
        acciones
      )}
    </div>
  `;
}

function configurarFormularioPaquetes() {
  const contenedor = document.getElementById('formularioPaquetes');
  if (!contenedor) return;

  const form = document.createElement('form');
  form.className = 'card';
  form.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Nuevo Paquete</h3>
    </div>
    <div class="card-body">
      <div class="form-row">
        <div class="form-group">
          <label for="clienteId">Cliente *</label>
          <select id="clienteId" name="clienteId" required></select>
        </div>
        <div class="form-group">
          <label for="peso">Peso (kg) *</label>
          <input type="number" id="peso" name="peso" step="0.1" required placeholder="2.5">
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="origen">Origen *</label>
          <input type="text" id="origen" name="origen" required placeholder="Calle 5 #10-20">
        </div>
        <div class="form-group">
          <label for="destino">Destino *</label>
          <input type="text" id="destino" name="destino" required placeholder="Carrera 10 #20-40">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="valor">Valor ($) *</label>
          <input type="number" id="valor" name="valor" required placeholder="50000">
        </div>
        <div class="form-group">
          <label for="contenido">Contenido</label>
          <input type="text" id="contenido" name="contenido" placeholder="Descripción del contenido">
        </div>
      </div>

      <div class="form-group form-row full">
        <label for="observaciones">Observaciones</label>
        <textarea id="observaciones" name="observaciones" placeholder="Notas adicionales"></textarea>
      </div>

      <div class="btn-group">
        <button type="submit" class="btn btn-primary">➕ Crear Paquete</button>
        <button type="reset" class="btn btn-secondary">Limpiar</button>
      </div>
    </div>
  `;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const datos = {
      clienteId: parseInt(document.getElementById('clienteId').value),
      peso: parseFloat(document.getElementById('peso').value),
      origen: document.getElementById('origen').value,
      destino: document.getElementById('destino').value,
      valor: parseInt(document.getElementById('valor').value),
      contenido: document.getElementById('contenido').value,
      observaciones: document.getElementById('observaciones').value
    };

    const resultado = await crearPaquete(datos);
    
    if (resultado.success) {
      mostrarAlerta('✅ Paquete creado correctamente', 'success');
      form.reset();
      cargarListaPaquetes();
      cargarClientesEnSelect();
    } else {
      mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
    }
  });

  contenedor.appendChild(form);
  cargarClientesEnSelect();
}

async function cargarClientesEnSelect() {
  const resultado = await obtenerClientes();
  const select = document.getElementById('clienteId');
  
  if (select && resultado.success) {
    select.innerHTML = '<option value="">-- Seleccionar cliente --</option>';
    resultado.data.forEach(cliente => {
      const option = document.createElement('option');
      option.value = cliente.id;
      option.textContent = cliente.nombre;
      select.appendChild(option);
    });
  }
}

async function cambiarEstadoPaquete(id) {
  const estados = ['Registrado', 'Asignado', 'En tránsito', 'Entregado'];
  
  let html = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Cambiar Estado - Paquete #${id}</h3>
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
          <button class="btn btn-success" onclick="guardarEstadoPaquete(${id})">💾 Guardar</button>
          <button class="btn btn-secondary" onclick="cargarListaPaquetes()">❌ Cancelar</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('formularioPaquetes').innerHTML = html;
}

async function guardarEstadoPaquete(id) {
  const nuevoEstado = document.getElementById('nuevoEstado').value;
  
  if (!nuevoEstado) {
    mostrarAlerta('Seleccione un estado', 'warning');
    return;
  }

  const resultado = await actualizarEstadoPaquete(id, nuevoEstado);
  
  if (resultado.success) {
    mostrarAlerta('✅ Estado actualizado correctamente', 'success');
    cargarListaPaquetes();
    configurarFormularioPaquetes();
  } else {
    mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
  }
}

async function editarPaquete(id) {
  const resultado = await obtenerPaquete(id);
  
  if (!resultado.success) {
    mostrarAlerta('Error al cargar paquete', 'danger');
    return;
  }

  mostrarModal('Edición', 'La funcionalidad de edición completa está en desarrollo');
}

async function eliminarPaqueteConfirm(id) {
  if (!confirmar('¿Está seguro de que desea eliminar este paquete?')) {
    return;
  }

  const resultado = await eliminarPaquete(id);
  
  if (resultado.success) {
    mostrarAlerta('✅ Paquete eliminado correctamente', 'success');
    cargarListaPaquetes();
  } else {
    mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
  }
}