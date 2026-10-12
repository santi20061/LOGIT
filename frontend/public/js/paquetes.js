// ============================================
// PAQUETES.JS - Lógica para módulo de paquetes
// ============================================

function escaparTextoTabla(valor) {
  return String(valor).replace(/[&<>"']/g, caracter => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[caracter]);
}

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
    (fila) => fila.estadoOriginal === 'incidencia'
      ? `<button class="btn btn-small btn-warning" onclick="coordinarDevolucion(${fila.ID})">↩️ Coordinar devolución</button>`
      : '',
    (fila) => fila.estadoOriginal === 'pendiente'
      ? `<button class="btn btn-small btn-warning" onclick="editarPaquete(${fila.ID})">✏️ Editar</button>`
      : '',
    (fila) => `<button class="btn btn-small btn-danger" onclick="eliminarPaqueteConfirm(${fila.ID})">🗑️ Eliminar</button>`
  ];

  contenedor.innerHTML = `
    <div class="tabla-contenedor">
      ${crearTabla(
        resultado.data.map(p => ({
          ID: p.id,
          'Seguimiento': p.numeroSeguimiento,
          'Cliente': p.Cliente ? p.Cliente.nombre : '-',
          'Origen': p.origen,
          'Destino': p.destino,
          'Peso': p.peso + ' kg',
          'Valor': '$' + p.valor.toLocaleString(),
          'Estado': obtenerBadgeEstado(p.estado),
          'Reporte del cliente': p.incidenciaCliente ? escaparTextoTabla(p.incidenciaCliente) : '',
          estadoOriginal: p.estado,
        })),
        ['ID', 'Seguimiento', 'Cliente', 'Origen', 'Destino', 'Peso', 'Valor', 'Estado', 'Reporte del cliente'],
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
          <label for="origen">Municipio de origen *</label>
          <select id="origen" name="origen" required></select>
        </div>
        <div class="form-group">
          <label for="destino">Municipio de destino *</label>
          <select id="destino" name="destino" required></select>
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
      mostrarAlerta('❌ Error: ' + (resultado.error || resultado.message), 'danger');
    }
  });

  contenedor.appendChild(form);
  cargarClientesEnSelect();
  cargarMunicipiosEnPaquete();
}

async function cargarMunicipiosEnPaquete() {
  const resultado = await obtenerMunicipiosMeta();
  const origen = document.getElementById('origen');
  const destino = document.getElementById('destino');
  if (!origen || !destino) return;
  if (!resultado.success) {
    mostrarAlerta(resultado.error, 'danger');
    return;
  }

  [origen, destino].forEach(select => {
    select.replaceChildren(new Option('-- Seleccionar municipio --', ''));
    resultado.data.forEach(municipio => select.add(new Option(municipio, municipio)));
  });
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

async function coordinarDevolucion(id) {
  if (!confirm('Confirma que LOGIT ya coordinó la devolución de este paquete.')) return;
  const resultado = await coordinarDevolucionPaquete(id);
  if (!resultado.success) {
    mostrarAlerta(resultado.error || 'No se pudo registrar la devolución.', 'danger');
    return;
  }
  mostrarAlerta(resultado.message || 'Devolución coordinada.', 'success');
  await cargarListaPaquetes();
}

async function editarPaquete(id) {
  const resultado = await obtenerPaquete(id);
  if (!resultado.success || !resultado.data) {
    mostrarAlerta(resultado.error || 'No se pudo cargar el paquete para editar.', 'danger');
    return;
  }

  const paquete = resultado.data;
  if (paquete.estado !== 'pendiente') {
    mostrarAlerta('Solo se pueden editar paquetes pendientes.', 'warning');
    return;
  }

  const contenedor = document.getElementById('formularioPaquetes');
  const anterior = document.getElementById('editarPaqueteForm');
  if (anterior) anterior.remove();

  const tarjeta = document.createElement('section');
  tarjeta.id = 'editarPaqueteForm';
  tarjeta.className = 'card';
  tarjeta.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Editar paquete #${Number(paquete.id)}</h3>
    </div>
    <div class="card-body">
      <form>
        <div class="form-row">
          <div class="form-group">
            <label for="editPaquetePeso">Peso (kg) *</label>
            <input type="number" id="editPaquetePeso" min="0.01" step="0.1" required>
          </div>
          <div class="form-group">
            <label for="editPaqueteValor">Valor ($) *</label>
            <input type="number" id="editPaqueteValor" min="0.01" step="1" required>
          </div>
        </div>
        <div class="form-group">
          <label for="editPaqueteContenido">Contenido</label>
          <input type="text" id="editPaqueteContenido" maxlength="255">
        </div>
        <div class="btn-group">
          <button type="submit" class="btn btn-primary">💾 Guardar cambios</button>
          <button type="button" class="btn btn-secondary" data-cancelar-edicion>Cancelar</button>
        </div>
      </form>
    </div>
  `;
  tarjeta.querySelector('#editPaquetePeso').value = paquete.peso;
  tarjeta.querySelector('#editPaqueteValor').value = paquete.valor;
  tarjeta.querySelector('#editPaqueteContenido').value = paquete.contenido || '';
  tarjeta.querySelector('[data-cancelar-edicion]').addEventListener('click', () => tarjeta.remove());
  tarjeta.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault();
    const guardar = tarjeta.querySelector('button[type="submit"]');
    guardar.disabled = true;
    const actualizacion = await actualizarPaquete(id, {
      peso: Number(tarjeta.querySelector('#editPaquetePeso').value),
      valor: Number(tarjeta.querySelector('#editPaqueteValor').value),
      contenido: tarjeta.querySelector('#editPaqueteContenido').value.trim(),
    });
    if (!actualizacion.success) {
      mostrarAlerta(actualizacion.error || 'No se pudieron guardar los cambios.', 'danger');
      guardar.disabled = false;
      return;
    }
    mostrarAlerta(actualizacion.message || 'Paquete actualizado correctamente.', 'success');
    tarjeta.remove();
    await cargarListaPaquetes();
  });
  contenedor.prepend(tarjeta);
  tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' });
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