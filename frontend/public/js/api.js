const API_URL = '/api';
let municipiosMetaCache;

async function obtenerMunicipiosMeta() {
  if (municipiosMetaCache) return { success: true, data: municipiosMetaCache };

  try {
    const response = await fetch(`${API_URL}/catalogos/municipios-meta`);
    const result = await response.json();
    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      return { success: false, data: [], error: result.error || 'No se pudieron cargar los municipios del Meta.' };
    }
    municipiosMetaCache = result.data;
    return { success: true, data: municipiosMetaCache };
  } catch (error) {
    console.error('Error cargando municipios del Meta:', error);
    return { success: false, data: [], error: 'Error de conexión al cargar los municipios.' };
  }
}

async function solicitarAPI(url, opciones) {
  const response = await fetch(url, opciones);
  if (response.status === 401 && typeof mostrarLogin === 'function') {
    mostrarLogin('Tu sesión expiró. Inicia sesión nuevamente.');
  }
  return response;
}

// ==================== CLIENTES ====================
async function obtenerClientes() {
  try {
    const response = await solicitarAPI(`${API_URL}/clientes`);
    const result = await response.json();
    return { success: result.success, data: result.data || [], message: result.message };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, data: [], message: 'Error de conexión' };
  }
}

async function obtenerCliente(id) {
  try {
    const response = await solicitarAPI(`${API_URL}/clientes/${id}`);
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return { success: false };
  }
}

async function crearCliente(data) {
  try {
    const response = await solicitarAPI(`${API_URL}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return { success: false, message: 'Error de conexión' };
  }
}

async function actualizarCliente(id, datos) {
  try {
    const response = await solicitarAPI(`${API_URL}/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return { success: false };
  }
}

async function eliminarCliente(id) {
  try {
    const response = await solicitarAPI(`${API_URL}/clientes/${id}`, { method: 'DELETE' });
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return { success: false, message: 'Error de conexión' };
  }
}

// ==================== PAQUETES ====================
async function obtenerPaquetes() {
  try {
    const response = await solicitarAPI(`${API_URL}/paquetes`);
    const result = await response.json();
    return { success: result.success, data: result.data || [] };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, data: [] };
  }
}

async function obtenerPaquete(id) {
  try {
    const response = await solicitarAPI(`${API_URL}/paquetes/${id}`);
    const result = await response.json();
    return { success: response.ok && result.success, data: result.data, error: result.error };
  } catch (error) {
    console.error('Error consultando paquete:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

async function crearPaquete(data) {
  try {
    const response = await solicitarAPI(`${API_URL}/paquetes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return { success: false };
  }
}

async function actualizarPaquete(id, datos) {
  try {
    const response = await solicitarAPI(`${API_URL}/paquetes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const result = await response.json();
    return { success: response.ok && result.success, message: result.message, error: result.error };
  } catch (error) {
    console.error('Error actualizando paquete:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

async function coordinarDevolucionPaquete(id) {
  try {
    const response = await solicitarAPI(`${API_URL}/paquetes/${id}/coordinar-devolucion`, {
      method: 'PUT',
    });
    const result = await response.json();
    return { success: result.success, message: result.message, error: result.error };
  } catch (error) {
    console.error('Error registrando devolución coordinada:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

// ==================== VEHÍCULOS ====================
async function obtenerVehiculos() {
  try {
    const response = await solicitarAPI(`${API_URL}/vehiculos`);
    const result = await response.json();
    return { success: result.success, data: result.data || [] };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, data: [] };
  }
}

async function crearVehiculo(data) {
  try {
    const response = await solicitarAPI(`${API_URL}/vehiculos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return { success: false };
  }
}

// ==================== CONDUCTORES ====================
async function obtenerConductores() {
  try {
    const response = await solicitarAPI(`${API_URL}/conductores`);
    const result = await response.json();
    return { success: result.success, data: result.data || [] };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, data: [] };
  }
}

async function actualizarEstadoConductor(id, estado) {
  try {
    const response = await solicitarAPI(`${API_URL}/conductores/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error actualizando estado del conductor:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

async function asignarVehiculo(id, vehiculoId) {
  try {
    const response = await solicitarAPI(`${API_URL}/conductores/${id}/vehiculo`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehiculoId: Number(vehiculoId) }),
    });
    const result = await response.json();
    return {
      success: result.success,
      data: result.data,
      message: result.message,
      error: result.error,
    };
  } catch (error) {
    console.error('Error asignando vehículo al conductor:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

async function crearConductor(data) {
  try {
    const response = await solicitarAPI(`${API_URL}/conductores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return { success: false };
  }
}

async function generarAccesoConductor(id) {
  try {
    const response = await solicitarAPI(`${API_URL}/conductores/${id}/acceso`, { method: 'POST' });
    const result = await response.json();
    return { success: result.success, data: result.data, error: result.error };
  } catch (error) {
    console.error('Error generando acceso de conductor:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

// ==================== RUTAS ====================
async function obtenerColaDespacho() {
  try {
    const response = await solicitarAPI(`${API_URL}/despacho/paquetes`);
    const result = await response.json();
    return { success: result.success, data: result.data, error: result.error };
  } catch (error) {
    console.error('Error consultando paquetes para despacho:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

async function crearDespacho(datos) {
  try {
    const response = await solicitarAPI(`${API_URL}/despacho`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const result = await response.json();
    return { success: result.success, data: result.data, message: result.message, error: result.error };
  } catch (error) {
    console.error('Error creando despacho:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

async function obtenerRutas() {
  try {
    const response = await solicitarAPI(`${API_URL}/rutas`);
    const result = await response.json();
    return { success: result.success, data: result.data || [] };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, data: [] };
  }
}

async function actualizarEstadoRuta(id, estado) {
  try {
    const response = await solicitarAPI(`${API_URL}/rutas/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error actualizando estado de ruta:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

async function eliminarRuta(id) {
  try {
    const response = await solicitarAPI(`${API_URL}/rutas/${id}`, { method: 'DELETE' });
    return await response.json();
  } catch (error) {
    console.error('Error eliminando ruta:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

// ==================== ENTREGAS ====================
async function obtenerEntregas() {
  try {
    const response = await solicitarAPI(`${API_URL}/entregas`);
    const result = await response.json();
    return { success: result.success, data: result.data || [] };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, data: [] };
  }
}

async function crearEntrega(data) {
  try {
    const response = await solicitarAPI(`${API_URL}/entregas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return { success: false };
  }
}

async function actualizarUbicacionEntrega(id, ubicacionActual) {
  try {
    const response = await solicitarAPI(`${API_URL}/entregas/${id}/ubicacion`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ubicacionActual }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error actualizando ubicación:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

async function marcarLlegadaEntrega(id, observaciones) {
  try {
    const response = await solicitarAPI(`${API_URL}/entregas/${id}/llegada`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observaciones }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error registrando llegada:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

// ==================== ACCESO DE CLIENTES ====================
async function generarAccesoCliente(id) {
  try {
    const response = await solicitarAPI(`${API_URL}/clientes/${id}/acceso`, { method: 'POST' });
    const result = await response.json();
    return { success: result.success, data: result.data, error: result.error };
  } catch (error) {
    console.error('Error generando acceso de cliente:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

async function obtenerPedidosCliente() {
  try {
    const response = await solicitarAPI(`${API_URL}/cliente/pedidos`);
    const result = await response.json();
    return { success: result.success, data: result.data || [], error: result.error };
  } catch (error) {
    console.error('Error cargando pedidos:', error);
    return { success: false, data: [], error: 'Error de conexión' };
  }
}

async function confirmarRecepcionPedido(id) {
  try {
    const response = await solicitarAPI(`${API_URL}/cliente/pedidos/${id}/confirmar-recepcion`, {
      method: 'POST',
    });
    const result = await response.json();
    return { success: result.success, message: result.message, error: result.error };
  } catch (error) {
    console.error('Error confirmando recepción:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

async function reportarDanoPedido(id, detalle) {
  try {
    const response = await solicitarAPI(`${API_URL}/cliente/pedidos/${id}/reportar-dano`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ detalle }),
    });
    const result = await response.json();
    return { success: result.success, message: result.message, error: result.error };
  } catch (error) {
    console.error('Error reportando daño del pedido:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

async function obtenerPerfilCliente() {
  try {
    const response = await solicitarAPI(`${API_URL}/cliente/perfil`);
    const result = await response.json();
    return { success: result.success, data: result.data, error: result.error };
  } catch (error) {
    console.error('Error cargando perfil:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

async function actualizarPerfilCliente(datos) {
  try {
    const response = await solicitarAPI(`${API_URL}/cliente/perfil`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const result = await response.json();
    return { success: result.success, data: result.data, error: result.error };
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

async function cambiarPasswordCliente(datos) {
  try {
    const response = await solicitarAPI(`${API_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const result = await response.json();
    return { success: result.success, error: result.error };
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

async function obtenerRutaActivaConductor() {
  try {
    const response = await solicitarAPI(`${API_URL}/conductor/ruta`);
    const result = await response.json();
    return { success: result.success, data: result.data, error: result.error };
  } catch (error) {
    console.error('Error consultando ruta del conductor:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

async function iniciarRutaConductor() {
  try {
    const response = await solicitarAPI(`${API_URL}/conductor/ruta/iniciar`, { method: 'POST' });
    const result = await response.json();
    return { success: result.success, data: result.data, message: result.message, error: result.error };
  } catch (error) {
    console.error('Error iniciando ruta del conductor:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

async function marcarLlegadaConductor(id) {
  try {
    const response = await solicitarAPI(`${API_URL}/conductor/entregas/${id}/llegada`, { method: 'POST' });
    const result = await response.json();
    return { success: result.success, message: result.message, error: result.error };
  } catch (error) {
    console.error('Error registrando llegada del conductor:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

async function reportarNovedadConductor(id, datos) {
  try {
    const response = await solicitarAPI(`${API_URL}/conductor/entregas/${id}/novedad`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    const result = await response.json();
    return { success: result.success, message: result.message, error: result.error };
  } catch (error) {
    console.error('Error registrando novedad de entrega:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

async function finalizarRutaDeConductor() {
  try {
    const response = await solicitarAPI(`${API_URL}/conductor/ruta/finalizar`, { method: 'POST' });
    const result = await response.json();
    return { success: result.success, message: result.message, error: result.error };
  } catch (error) {
    console.error('Error finalizando ruta del conductor:', error);
    return { success: false, error: 'Error de conexión' };
  }
}

// ==================== FUNCIONES AUXILIARES ====================

function crearTabla(datos, columnas, acciones = []) {
  if (!datos || datos.length === 0) {
    return '<p class="empty-state">No hay datos disponibles.</p>';
  }

  let html = '<table><thead><tr>';

  columnas.forEach(col => {
    html += `<th>${col}</th>`;
  });

  if (acciones.length > 0) {
    html += '<th>Acciones</th>';
  }

  html += '</tr></thead><tbody>';

  datos.forEach(fila => {
    html += '<tr>';

    columnas.forEach(col => {
      const valor = fila[col];
      html += `<td>${valor === undefined || valor === null || valor === '' ? '-' : valor}</td>`;
    });

    if (acciones.length > 0) {
      html += '<td class="table-actions">';
      acciones.forEach(accion => {
        html += accion(fila);
      });
      html += '</td>';
    }

    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
}

function obtenerBadgeEstado(estado) {
  const estados = {
    pendiente: ['warning', 'Pendiente'],
    en_ruta: ['primary', 'En ruta'],
    en_transito: ['primary', 'En tránsito'],
    en_puerta: ['warning', 'En domicilio'],
    rechazado: ['danger', 'Visita fallida'],
    entregado: ['success', 'Entregado'],
    devuelto: ['danger', 'Devuelto'],
    incidencia: ['danger', 'Incidencia'],
    disponible: ['success', 'Disponible'],
    ocupado: ['warning', 'En ruta'],
    asignado: ['primary', 'Ruta planeada'],
    en_uso: ['warning', 'En uso'],
    activo: ['success', 'Activo'],
    inactivo: ['danger', 'Inactivo'],
    vacaciones: ['warning', 'Vacaciones'],
    cancelada: ['danger', 'Cancelada'],
    mantenimiento: ['warning', 'En mantenimiento'],
    planeada: ['primary', 'Planeada'],
    en_curso: ['warning', 'En curso'],
    completada: ['success', 'Completada']
  };
  const estadoNormalizado = String(estado || '').toLowerCase();
  const [tipo, etiqueta] = estados[estadoNormalizado] || ['primary', estado || 'Sin estado'];
  return `<span class="badge badge-${tipo}">${etiqueta}</span>`;
}

function formatearFecha(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-CO');
}

function mostrarAlerta(mensaje, tipo = 'info') {
  console.log(`[${tipo}] ${mensaje}`);

  let alertas = document.getElementById('alertas');
  if (!alertas) {
    alertas = document.createElement('div');
    alertas.id = 'alertas';
    document.body.appendChild(alertas);
  }

  const alerta = document.createElement('div');
  alerta.className = `alert alert-${tipo}`;
  alerta.textContent = mensaje;
  alertas.appendChild(alerta);

  setTimeout(() => alerta.remove(), 4000);
}

function confirmar(mensaje) {
  return confirm(mensaje);
}

function cerrarModal() {
  const modal = document.getElementById('modal');
  if (modal) modal.style.display = 'none';
}

function abrirModal() {
  const modal = document.getElementById('modal');
  if (modal) modal.style.display = 'block';
}