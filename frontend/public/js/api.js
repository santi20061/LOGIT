// ============================================
// API.JS - Funciones para comunicarse con backend
// ============================================

const API_URL = 'http://localhost:3000/api';

// ==================== CLIENTES ====================

async function obtenerClientes() {
  try {
    const response = await fetch(`${API_URL}/clientes`);
    return await response.json();
  } catch (error) {
    console.error('Error obtener clientes:', error);
    return { success: false, data: [] };
  }
}

async function obtenerCliente(id) {
  try {
    const response = await fetch(`${API_URL}/clientes/${id}`);
    return await response.json();
  } catch (error) {
    console.error('Error obtener cliente:', error);
    return { success: false };
  }
}

async function crearCliente(datos) {
  try {
    const response = await fetch(`${API_URL}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    return await response.json();
  } catch (error) {
    console.error('Error crear cliente:', error);
    return { success: false, message: error.message };
  }
}

async function actualizarCliente(id, datos) {
  try {
    const response = await fetch(`${API_URL}/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    return await response.json();
  } catch (error) {
    console.error('Error actualizar cliente:', error);
    return { success: false, message: error.message };
  }
}

async function eliminarCliente(id) {
  try {
    const response = await fetch(`${API_URL}/clientes/${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('Error eliminar cliente:', error);
    return { success: false, message: error.message };
  }
}

// ==================== PAQUETES ====================

async function obtenerPaquetes() {
  try {
    const response = await fetch(`${API_URL}/paquetes`);
    return await response.json();
  } catch (error) {
    console.error('Error obtener paquetes:', error);
    return { success: false, data: [] };
  }
}

async function obtenerPaquete(id) {
  try {
    const response = await fetch(`${API_URL}/paquetes/${id}`);
    return await response.json();
  } catch (error) {
    console.error('Error obtener paquete:', error);
    return { success: false };
  }
}

async function crearPaquete(datos) {
  try {
    const response = await fetch(`${API_URL}/paquetes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    return await response.json();
  } catch (error) {
    console.error('Error crear paquete:', error);
    return { success: false, message: error.message };
  }
}

async function actualizarEstadoPaquete(id, estado) {
  try {
    const response = await fetch(`${API_URL}/paquetes/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    });
    return await response.json();
  } catch (error) {
    console.error('Error actualizar paquete:', error);
    return { success: false, message: error.message };
  }
}

async function asignarPaqueteARuta(id, rutaId) {
  try {
    const response = await fetch(`${API_URL}/paquetes/${id}/ruta`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rutaId })
    });
    return await response.json();
  } catch (error) {
    console.error('Error asignar paquete:', error);
    return { success: false, message: error.message };
  }
}

async function eliminarPaquete(id) {
  try {
    const response = await fetch(`${API_URL}/paquetes/${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('Error eliminar paquete:', error);
    return { success: false, message: error.message };
  }
}

// ==================== VEHÍCULOS ====================

async function obtenerVehiculos() {
  try {
    const response = await fetch(`${API_URL}/vehiculos`);
    return await response.json();
  } catch (error) {
    console.error('Error obtener vehículos:', error);
    return { success: false, data: [] };
  }
}

async function crearVehiculo(datos) {
  try {
    const response = await fetch(`${API_URL}/vehiculos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    return await response.json();
  } catch (error) {
    console.error('Error crear vehículo:', error);
    return { success: false, message: error.message };
  }
}

async function actualizarEstadoVehiculo(id, estado) {
  try {
    const response = await fetch(`${API_URL}/vehiculos/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    });
    return await response.json();
  } catch (error) {
    console.error('Error actualizar vehículo:', error);
    return { success: false, message: error.message };
  }
}

async function eliminarVehiculo(id) {
  try {
    const response = await fetch(`${API_URL}/vehiculos/${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('Error eliminar vehículo:', error);
    return { success: false, message: error.message };
  }
}

// ==================== CONDUCTORES ====================

async function obtenerConductores() {
  try {
    const response = await fetch(`${API_URL}/conductores`);
    return await response.json();
  } catch (error) {
    console.error('Error obtener conductores:', error);
    return { success: false, data: [] };
  }
}

async function crearConductor(datos) {
  try {
    const response = await fetch(`${API_URL}/conductores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    return await response.json();
  } catch (error) {
    console.error('Error crear conductor:', error);
    return { success: false, message: error.message };
  }
}

async function actualizarEstadoConductor(id, estado) {
  try {
    const response = await fetch(`${API_URL}/conductores/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    });
    return await response.json();
  } catch (error) {
    console.error('Error actualizar conductor:', error);
    return { success: false, message: error.message };
  }
}

async function asignarVehiculo(id, vehiculoId) {
  try {
    const response = await fetch(`${API_URL}/conductores/${id}/vehiculo`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehiculoId })
    });
    return await response.json();
  } catch (error) {
    console.error('Error asignar vehículo:', error);
    return { success: false, message: error.message };
  }
}

async function eliminarConductor(id) {
  try {
    const response = await fetch(`${API_URL}/conductores/${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('Error eliminar conductor:', error);
    return { success: false, message: error.message };
  }
}

// ==================== RUTAS ====================

async function obtenerRutas() {
  try {
    const response = await fetch(`${API_URL}/rutas`);
    return await response.json();
  } catch (error) {
    console.error('Error obtener rutas:', error);
    return { success: false, data: [] };
  }
}

async function crearRuta(datos) {
  try {
    const response = await fetch(`${API_URL}/rutas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    return await response.json();
  } catch (error) {
    console.error('Error crear ruta:', error);
    return { success: false, message: error.message };
  }
}

async function actualizarEstadoRuta(id, estado, horaFin = null) {
  try {
    const response = await fetch(`${API_URL}/rutas/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado, horaFin })
    });
    return await response.json();
  } catch (error) {
    console.error('Error actualizar ruta:', error);
    return { success: false, message: error.message };
  }
}

async function asignarPaqueteRuta(id, paqueteId) {
  try {
    const response = await fetch(`${API_URL}/rutas/${id}/paquete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paqueteId })
    });
    return await response.json();
  } catch (error) {
    console.error('Error asignar paquete a ruta:', error);
    return { success: false, message: error.message };
  }
}

async function iniciarRuta(id) {
  try {
    const response = await fetch(`${API_URL}/rutas/${id}/iniciar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    return await response.json();
  } catch (error) {
    console.error('Error iniciar ruta:', error);
    return { success: false, message: error.message };
  }
}

async function eliminarRuta(id) {
  try {
    const response = await fetch(`${API_URL}/rutas/${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('Error eliminar ruta:', error);
    return { success: false, message: error.message };
  }
}

// ==================== ENTREGAS ====================

async function obtenerEntregas() {
  try {
    const response = await fetch(`${API_URL}/entregas`);
    return await response.json();
  } catch (error) {
    console.error('Error obtener entregas:', error);
    return { success: false, data: [] };
  }
}

async function crearEntrega(datos) {
  try {
    const response = await fetch(`${API_URL}/entregas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    return await response.json();
  } catch (error) {
    console.error('Error crear entrega:', error);
    return { success: false, message: error.message };
  }
}

async function actualizarUbicacionEntrega(id, ubicacionActual) {
  try {
    const response = await fetch(`${API_URL}/entregas/${id}/ubicacion`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ubicacionActual })
    });
    return await response.json();
  } catch (error) {
    console.error('Error actualizar ubicación:', error);
    return { success: false, message: error.message };
  }
}

async function completarEntrega(id, firmaRecibido = null, observaciones = '') {
  try {
    const response = await fetch(`${API_URL}/entregas/${id}/completar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firmaRecibido, observaciones })
    });
    return await response.json();
  } catch (error) {
    console.error('Error completar entrega:', error);
    return { success: false, message: error.message };
  }
}

async function eliminarEntrega(id) {
  try {
    const response = await fetch(`${API_URL}/entregas/${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error('Error eliminar entrega:', error);
    return { success: false, message: error.message };
  }
}

// ==================== UTILIDADES ====================

function mostrarModal(titulo, mensaje, tipo = 'info') {
  const modal = document.getElementById('modal');
  const modalTitulo = document.getElementById('modal-titulo');
  const modalMensaje = document.getElementById('modal-mensaje');
  
  modalTitulo.textContent = titulo;
  modalMensaje.textContent = mensaje;
  modal.classList.add('show');
}

function cerrarModal() {
  const modal = document.getElementById('modal');
  modal.classList.remove('show');
}

function mostrarAlerta(mensaje, tipo = 'success') {
  const contenedor = document.getElementById('contenido');
  const alert = document.createElement('div');
  alert.className = `alert alert-${tipo}`;
  alert.textContent = mensaje;
  
  contenedor.insertBefore(alert, contenedor.firstChild);
  
  setTimeout(() => alert.remove(), 3000);
}