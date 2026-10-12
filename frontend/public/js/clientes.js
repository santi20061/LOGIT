// ============================================
// CLIENTES.JS - Lógica para módulo de clientes
// ============================================

async function inicializarClientes() {
  cargarListaClientes();
  configurarFormularioClientes();
}

async function gestionarAccesoCliente(id, restablecer) {
  const confirmacion = restablecer
    ? 'Se cambiará la contraseña temporal y se cerrarán las sesiones activas del cliente. ¿Continuar?'
    : 'Se generará una contraseña temporal de un solo uso para este cliente. ¿Continuar?';
  if (!confirm(confirmacion)) return;

  const resultado = await generarAccesoCliente(id);
  if (!resultado.success) {
    mostrarAlerta(resultado.error || 'No se pudo generar el acceso.', 'danger');
    return;
  }

  mostrarCredencialTemporal(resultado.data, 'cliente');
  cargarListaClientes();
}

function mostrarCredencialTemporal(credencial, tipo = 'cliente') {
  const modal = document.getElementById('modal');
  const extra = document.getElementById('modal-extra');
  document.getElementById('modal-titulo').textContent = `Acceso del ${tipo}`;
  document.getElementById('modal-mensaje').textContent =
    `Entrega estas credenciales al ${tipo} de forma privada. La contraseña temporal se mostrará solo ahora y deberá cambiarse en el primer ingreso.`;
  extra.replaceChildren();

  const usuarioLabel = document.createElement('p');
  usuarioLabel.className = 'credential-label';
  usuarioLabel.textContent = `Usuario: ${credencial.email}`;
  const passwordLabel = document.createElement('label');
  passwordLabel.className = 'credential-label';
  passwordLabel.textContent = 'Contraseña temporal';
  const password = document.createElement('input');
  password.className = 'credential-password';
  password.type = 'text';
  password.readOnly = true;
  password.value = credencial.passwordTemporal;
  password.autocomplete = 'off';
  const copiar = document.createElement('button');
  copiar.className = 'btn btn-secondary';
  copiar.type = 'button';
  copiar.textContent = 'Copiar contraseña';
  copiar.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(credencial.passwordTemporal);
      copiar.textContent = 'Copiada';
    } catch (error) {
      console.error('No fue posible copiar la contraseña:', error);
      password.select();
      copiar.textContent = 'Selecciona y copia';
    }
  });

  extra.append(usuarioLabel, passwordLabel, password, copiar);
  extra.hidden = false;
  abrirModal();
}

async function cargarListaClientes() {
  const resultado = await obtenerClientes();
  
  if (!resultado.success) {
    mostrarAlerta('Error al cargar clientes', 'danger');
    return;
  }

  const contenedor = document.getElementById('tablaClientes');
  if (!contenedor) return;

  const acciones = [
    (fila) => `<button class="btn btn-small btn-warning" onclick="editarCliente(${fila.ID})">✏️ Editar</button>`,
    (fila) => `<button class="btn btn-small btn-secondary" onclick="gestionarAccesoCliente(${fila.ID}, ${fila.tieneAcceso})">${fila.tieneAcceso ? 'Restablecer acceso' : 'Crear acceso'}</button>`,
    (fila) => `<button class="btn btn-small btn-danger" onclick="eliminarClienteConfirm(${fila.ID})">🗑️ Eliminar</button>`
  ];

  contenedor.innerHTML = `
    <div class="tabla-contenedor">
      ${crearTabla(
        resultado.data.map(c => ({
          ID: c.id,
          'Nombre': c.nombre,
          'Teléfono': c.telefono,
          'Email': c.email,
          'Ciudad': c.ciudad,
          'Acceso': c.tieneAcceso ? 'Cuenta activa' : 'Sin acceso',
          'Fecha': formatearFecha(c.fechaRegistro)
        })),
        ['ID', 'Nombre', 'Teléfono', 'Email', 'Ciudad', 'Acceso', 'Fecha'],
        acciones
      )}
    </div>
  `;
}

function configurarFormularioClientes() {
  const contenedor = document.getElementById('formularioClientes');
  if (!contenedor) return;

  const form = document.createElement('form');
  form.className = 'card';
  form.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Nuevo Cliente</h3>
    </div>
    <div class="card-body">
      <div class="form-row">
        <div class="form-group">
          <label for="nombre">Nombre *</label>
          <input type="text" id="nombre" name="nombre" required placeholder="Nombre completo">
        </div>
        <div class="form-group">
          <label for="telefono">Teléfono *</label>
          <input type="tel" id="telefono" name="telefono" required placeholder="3001234567">
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="email">Email *</label>
          <input type="email" id="email" name="email" required placeholder="cliente@email.com">
        </div>
        <div class="form-group">
          <label for="ciudad">Ciudad *</label>
          <input type="text" id="ciudad" name="ciudad" required placeholder="Villavicencio">
        </div>
      </div>

      <div class="form-group form-row full">
        <label for="direccion">Dirección *</label>
        <input type="text" id="direccion" name="direccion" required placeholder="Calle 5 #10-20">
      </div>

      <div class="btn-group">
        <button type="submit" class="btn btn-primary">➕ Crear Cliente</button>
        <button type="reset" class="btn btn-secondary">Limpiar</button>
      </div>
    </div>
  `;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const datos = {
      nombre: document.getElementById('nombre').value,
      telefono: document.getElementById('telefono').value,
      email: document.getElementById('email').value,
      ciudad: document.getElementById('ciudad').value,
      direccion: document.getElementById('direccion').value
    };

    const resultado = await crearCliente(datos);
    
    if (resultado.success) {
      mostrarAlerta('✅ Cliente creado correctamente', 'success');
      form.reset();
      cargarListaClientes();
    } else {
      mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
    }
  });

  contenedor.appendChild(form);
}

async function editarCliente(id) {
  const resultado = await obtenerCliente(id);
  
  if (!resultado.success) {
    mostrarAlerta('Error al cargar cliente', 'danger');
    return;
  }

  const cliente = resultado.data;
  
  const formulario = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Editar Cliente #${id}</h3>
      </div>
      <div class="card-body">
        <div class="form-row">
          <div class="form-group">
            <label>Nombre *</label>
            <input type="text" id="editNombre" value="${cliente.nombre}" required>
          </div>
          <div class="form-group">
            <label>Teléfono *</label>
            <input type="tel" id="editTelefono" value="${cliente.telefono}" required>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Email *</label>
            <input type="email" id="editEmail" value="${cliente.email}" required>
          </div>
          <div class="form-group">
            <label>Ciudad *</label>
            <input type="text" id="editCiudad" value="${cliente.ciudad}" required>
          </div>
        </div>

        <div class="form-group form-row full">
          <label>Dirección *</label>
          <input type="text" id="editDireccion" value="${cliente.direccion}" required>
        </div>

        <div class="btn-group">
          <button class="btn btn-primary" onclick="guardarClienteEditado(${id})">💾 Guardar</button>
          <button class="btn btn-secondary" onclick="cargarListaClientes()">❌ Cancelar</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('formularioClientes').innerHTML = formulario;
}

async function guardarClienteEditado(id) {
  const datos = {
    nombre: document.getElementById('editNombre').value,
    telefono: document.getElementById('editTelefono').value,
    email: document.getElementById('editEmail').value,
    ciudad: document.getElementById('editCiudad').value,
    direccion: document.getElementById('editDireccion').value
  };

  const resultado = await actualizarCliente(id, datos);
  
  if (resultado.success) {
    mostrarAlerta('✅ Cliente actualizado correctamente', 'success');
    cargarListaClientes();
    configurarFormularioClientes();
  } else {
    mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
  }
}

async function eliminarClienteConfirm(id) {
  if (!confirmar('¿Está seguro de que desea eliminar este cliente?')) {
    return;
  }

  const resultado = await eliminarCliente(id);
  
  if (resultado.success) {
    mostrarAlerta('✅ Cliente eliminado correctamente', 'success');
    cargarListaClientes();
  } else {
    mostrarAlerta('❌ Error: ' + resultado.message, 'danger');
  }
}