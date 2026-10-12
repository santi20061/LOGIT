function crearTexto(tag, className, texto) {
  const elemento = document.createElement(tag);
  if (className) elemento.className = className;
  elemento.textContent = texto;
  return elemento;
}

function fechaPedido(fecha) {
  return fecha ? new Date(fecha).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : '—';
}

function etiquetaEstadoPedido(estado) {
  const etiquetas = {
    pendiente: 'En preparación',
    en_ruta: 'En ruta',
    entregado: 'Recibido',
    incidencia: 'Incidencia en revisión',
    devuelto: 'Devuelto',
  };
  return etiquetas[estado] || 'Estado por confirmar';
}

async function inicializarPortalCliente() {
  const resultado = await obtenerPedidosCliente();
  const contenedor = document.getElementById('listaPedidos');
  if (!contenedor) return;

  if (!resultado.success) {
    contenedor.appendChild(crearTexto('p', 'alert alert-danger', resultado.error || 'No se pudieron cargar tus pedidos.'));
    return;
  }

  const pedidos = resultado.data;
  document.getElementById('pedidosEnProceso').textContent =
    pedidos.filter(pedido => !['entregado', 'devuelto'].includes(pedido.estado)).length.toLocaleString('es-CO');
  document.getElementById('pedidosRecibidos').textContent =
    pedidos.filter(pedido => pedido.estado === 'entregado').length.toLocaleString('es-CO');
  contenedor.replaceChildren();

  if (pedidos.length === 0) {
    contenedor.appendChild(crearTexto('div', 'empty-orders', 'Aún no tienes pedidos asociados a tu cuenta.'));
    return;
  }

  pedidos.forEach(pedido => {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'customer-order';

    const cabecera = document.createElement('div');
    cabecera.className = 'customer-order-header';
    cabecera.append(
      crearTexto('div', 'customer-order-title', pedido.contenido || 'Pedido LOGIT'),
      crearTexto('span', `badge ${pedido.estado === 'entregado' ? 'badge-success' : ['devuelto', 'incidencia'].includes(pedido.estado) ? 'badge-danger' : pedido.estado === 'pendiente' ? 'badge-warning' : 'badge-primary'}`, etiquetaEstadoPedido(pedido.estado))
    );

    const trayecto = document.createElement('p');
    trayecto.className = 'customer-order-route';
    trayecto.textContent = `${pedido.origen} → ${pedido.destino}`;

    const detalle = document.createElement('div');
    detalle.className = 'customer-order-details';
    detalle.append(
      crearTexto('span', '', `Registrado el ${fechaPedido(pedido.fechaCreacion)}`),
      crearTexto('span', '', `Contenido: ${pedido.contenido || 'No especificado'}`)
    );

    const entregaActual = pedido.Entregas[0];
    if (entregaActual?.ubicacionActual) {
      detalle.appendChild(crearTexto('span', '', `Última ubicación: ${entregaActual.ubicacionActual}`));
    }
    if (entregaActual?.estado === 'rechazado') {
      detalle.appendChild(crearTexto(
        'span',
        'customer-order-note',
        `La última visita no se completó (${entregaActual.motivoNovedad || 'novedad registrada'}); tu pedido está pendiente de reprogramar.`
      ));
    }
    if (pedido.incidenciaCliente) {
      detalle.appendChild(crearTexto(
        'span',
        'customer-order-note',
        `Daño reportado: ${pedido.incidenciaCliente}`
      ));
    }
    if (pedido.fechaIncidencia && pedido.estado === 'incidencia') {
      detalle.appendChild(crearTexto(
        'span',
        'customer-order-note',
        `Incidencia enviada el ${fechaPedido(pedido.fechaIncidencia)}. LOGIT coordinará la devolución.`
      ));
    }
    if (pedido.fechaDevolucion) {
      detalle.appendChild(crearTexto(
        'span',
        'customer-order-note',
        `Devolución coordinada el ${fechaPedido(pedido.fechaDevolucion)}.`
      ));
    }
    if (pedido.fechaEntrega) {
      detalle.appendChild(crearTexto('span', '', `Recibido el ${fechaPedido(pedido.fechaEntrega)}`));
    }

    tarjeta.append(cabecera, trayecto, detalle);
    if (pedido.estado === 'incidencia') {
      tarjeta.appendChild(crearTexto(
        'p',
        'customer-order-note',
        'Tu reporte está en revisión. LOGIT coordinará la devolución.'
      ));
    } else if (pedido.estado === 'devuelto') {
      tarjeta.appendChild(crearTexto('p', 'customer-order-note', 'La devolución fue coordinada por LOGIT.'));
    } else if (pedido.puedeConfirmarRecepcion) {
      const accion = document.createElement('button');
      accion.type = 'button';
      accion.className = 'btn btn-primary customer-confirm';
      accion.dataset.pedidoId = pedido.id;
      accion.textContent = 'Confirmar que recibí el pedido';
      tarjeta.appendChild(accion);
      const reportar = document.createElement('button');
      reportar.type = 'button';
      reportar.className = 'btn btn-secondary customer-report-damage';
      reportar.dataset.danoPedidoId = pedido.id;
      reportar.textContent = 'Reportar que llegó dañado';
      tarjeta.appendChild(reportar);
    } else if (pedido.estado === 'en_ruta') {
      tarjeta.appendChild(crearTexto('p', 'customer-order-note', 'La confirmación estará disponible cuando el pedido llegue a tu domicilio.'));
    }
    contenedor.appendChild(tarjeta);
  });

  contenedor.onclick = async event => {
    const reportar = event.target.closest('[data-dano-pedido-id]');
    if (reportar && contenedor.contains(reportar)) {
      mostrarFormularioDano(reportar.closest('.customer-order'), reportar.dataset.danoPedidoId);
      return;
    }
    const boton = event.target.closest('[data-pedido-id]');
    if (!boton || !contenedor.contains(boton)) return;
    if (!confirm('Confirma solo si tienes el pedido contigo. ¿Lo recibiste?')) return;

    boton.disabled = true;
    const respuesta = await confirmarRecepcionPedido(boton.dataset.pedidoId);
    if (!respuesta.success) {
      mostrarAlerta(respuesta.error || 'No se pudo confirmar la recepción.', 'danger');
      boton.disabled = false;
      return;
    }

    mostrarAlerta(respuesta.message || 'Recepción confirmada.', 'success');
    await inicializarPortalCliente();
  };
}

function mostrarFormularioDano(tarjeta, pedidoId) {
  if (tarjeta.querySelector('.customer-damage-form')) return;
  const form = document.createElement('form');
  form.className = 'customer-damage-form';
  const etiqueta = crearTexto('label', '', 'Describe el daño encontrado (10 a 500 caracteres)');
  const detalle = document.createElement('textarea');
  detalle.required = true;
  detalle.minLength = 10;
  detalle.maxLength = 500;
  detalle.placeholder = 'Cuéntanos brevemente cómo llegó el paquete.';
  const enviar = document.createElement('button');
  enviar.className = 'btn btn-danger';
  enviar.type = 'submit';
  enviar.textContent = 'Enviar reporte';
  etiqueta.append(detalle);
  form.append(etiqueta, enviar);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    enviar.disabled = true;
    const respuesta = await reportarDanoPedido(pedidoId, detalle.value);
    if (!respuesta.success) {
      enviar.disabled = false;
      mostrarAlerta(respuesta.error || 'No se pudo enviar el reporte.', 'danger');
      return;
    }
    mostrarAlerta(respuesta.message || 'Reporte enviado.', 'success');
    await inicializarPortalCliente();
  });
  tarjeta.append(form);
}
