var etiquetasNovedad = {
  no_responde: 'Cliente no responde',
  direccion_incorrecta: 'Dirección incorrecta',
  cliente_reprograma: 'Solicita reprogramar',
  rechazado: 'Rechazado',
  otro: 'Otra novedad',
  ruta_cancelada: 'Ruta cancelada',
};

async function inicializarPortalConductor() {
  await cargarRutaConductor();
}

async function cargarRutaConductor() {
  const contenedor = document.getElementById('conductor-ruta');
  if (!contenedor) return;
  contenedor.replaceChildren();
  const resultado = await obtenerRutaActivaConductor();
  if (!resultado.success) {
    mostrarAlerta(resultado.error || 'No se pudo consultar tu ruta.', 'danger');
    return;
  }
  if (!resultado.data) {
    const card = document.createElement('div');
    card.className = 'card driver-empty';
    card.textContent = 'No tienes una ruta planeada o activa en este momento. Consulta con el administrador si esperabas un recorrido.';
    contenedor.append(card);
    return;
  }

  const ruta = resultado.data;
  if (ruta.estado === 'planeada') {
    const inicio = document.createElement('section');
    inicio.className = 'driver-start-panel';
    const ayuda = document.createElement('p');
    ayuda.textContent = 'Esta ruta está planeada. Inicia el recorrido cuando hayas cargado los paquetes y estés listo para salir.';
    const botonIniciar = document.createElement('button');
    botonIniciar.className = 'btn btn-primary driver-finish';
    botonIniciar.type = 'button';
    botonIniciar.textContent = 'Iniciar recorrido';
    botonIniciar.addEventListener('click', iniciarRecorridoConductor);
    inicio.append(ayuda, botonIniciar);
    contenedor.append(inicio);
  }
  const resumen = document.createElement('section');
  resumen.className = 'driver-route-summary';
  const titulo = document.createElement('h3');
  titulo.textContent = ruta.nombre;
  const vehiculo = document.createElement('p');
  vehiculo.textContent = `Vehículo: ${ruta.vehiculo?.placa || 'Sin asignar'} · Inicio: ${ruta.horaInicio || '-'}`;
  const progreso = document.createElement('span');
  const visitadas = ruta.paradas.filter(parada => parada.estado !== 'en_transito').length;
  progreso.className = 'badge badge-primary';
  progreso.textContent = ruta.estado === 'planeada'
    ? `${ruta.paradas.length} paquete${ruta.paradas.length === 1 ? '' : 's'} asignado${ruta.paradas.length === 1 ? '' : 's'}`
    : `${visitadas} de ${ruta.paradas.length} visitas registradas`;
  resumen.append(titulo, vehiculo, progreso);
  contenedor.append(resumen);

  const lista = document.createElement('div');
  lista.className = 'driver-stops';
  ruta.paradas.forEach((parada, indice) => lista.append(crearTarjetaParada(parada, indice)));
  contenedor.append(lista);

  if (ruta.estado === 'planeada') return;

  const puedeFinalizar = ruta.paradas.every(parada => parada.estado !== 'en_transito');
  const finalizar = document.createElement('button');
  finalizar.className = 'btn btn-primary driver-finish';
  finalizar.type = 'button';
  finalizar.textContent = 'Finalizar recorrido';
  finalizar.disabled = !puedeFinalizar;
  finalizar.addEventListener('click', finalizarRutaConductor);
  contenedor.append(finalizar);
  if (!puedeFinalizar) {
    const ayuda = document.createElement('p');
    ayuda.className = 'driver-finish-hint';
    ayuda.textContent = 'Registra la llegada o una novedad en cada parada antes de finalizar.';
    contenedor.append(ayuda);
  }
}

function crearTarjetaParada(parada, indice) {
  const paquete = parada.paquete || {};
  const cliente = paquete.Cliente || {};
  const card = document.createElement('article');
  card.className = 'driver-stop';
  const cabecera = document.createElement('div');
  cabecera.className = 'driver-stop-header';
  const numero = document.createElement('strong');
  numero.textContent = `Parada ${indice + 1} · ${paquete.numeroSeguimiento || ''}`;
  const estado = document.createElement('span');
  estado.innerHTML = obtenerBadgeEstado(parada.estado);
  cabecera.append(numero, estado);

  const nombre = document.createElement('h3');
  nombre.textContent = cliente.nombre || 'Cliente';
  const direccion = document.createElement('p');
  direccion.className = 'driver-address';
  direccion.textContent = [cliente.direccion, cliente.ciudad, paquete.destino, 'Meta'].filter(Boolean).join(', ');
  const contacto = document.createElement('p');
  contacto.className = 'driver-contact';
  contacto.textContent = cliente.telefono ? `Teléfono: ${cliente.telefono}` : 'Sin teléfono registrado';
  const intento = document.createElement('small');
  intento.textContent = `Intento ${parada.intento || 1}${paquete.contenido ? ` · ${paquete.contenido}` : ''}`;
  card.append(cabecera, nombre, direccion, contacto, intento);

  const urlMapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${direccion.textContent}`)}`;
  const mapa = document.createElement('a');
  mapa.className = 'btn btn-secondary driver-map';
  mapa.href = urlMapa;
  mapa.target = '_blank';
  mapa.rel = 'noopener noreferrer';
  mapa.textContent = 'Abrir en mapas';
  card.append(mapa);

  if (parada.estado === 'en_transito') {
    const acciones = document.createElement('div');
    acciones.className = 'driver-stop-actions';
    const llegada = document.createElement('button');
    llegada.className = 'btn btn-primary';
    llegada.type = 'button';
    llegada.textContent = 'Llegué al domicilio';
    llegada.addEventListener('click', () => registrarLlegadaConductor(parada.id));
    const novedad = document.createElement('button');
    novedad.className = 'btn btn-secondary';
    novedad.type = 'button';
    novedad.textContent = 'Reportar novedad';
    novedad.addEventListener('click', () => mostrarFormularioNovedad(card, parada.id));
    acciones.append(llegada, novedad);
    card.append(acciones);
  } else if (parada.estado === 'rechazado') {
    const nota = document.createElement('p');
    nota.className = 'driver-exception';
    nota.textContent = `Visita fallida: ${etiquetasNovedad[parada.motivoNovedad] || 'Novedad'}${parada.observaciones ? ` · ${parada.observaciones}` : ''}`;
    card.append(nota);
  } else if (parada.estado === 'en_puerta' && paquete.estado === 'incidencia') {
    const nota = document.createElement('p');
    nota.className = 'driver-exception';
    nota.textContent = 'El cliente reportó un daño. LOGIT revisará la incidencia y coordinará la devolución.';
    card.append(nota);
  } else if (parada.estado === 'en_puerta') {
    const nota = document.createElement('p');
    nota.className = 'driver-arrival-note';
    nota.textContent = 'Llegada registrada. El cliente confirma la recepción desde su cuenta.';
    card.append(nota);
  } else if (parada.estado === 'entregado') {
    const nota = document.createElement('p');
    nota.className = 'driver-arrival-note';
    nota.textContent = 'Recepción confirmada por el cliente.';
    card.append(nota);
  }
  return card;
}

function mostrarFormularioNovedad(card, entregaId) {
  if (card.querySelector('.driver-exception-form')) return;
  const form = document.createElement('form');
  form.className = 'driver-exception-form';
  const select = document.createElement('select');
  select.name = 'motivo';
  select.required = true;
  select.add(new Option('Selecciona el motivo', ''));
  [
    ['no_responde', 'Cliente no responde'],
    ['direccion_incorrecta', 'Dirección incorrecta'],
    ['cliente_reprograma', 'Cliente solicita reprogramar'],
    ['rechazado', 'Cliente rechazó el paquete'],
    ['otro', 'Otra novedad'],
  ].forEach(([value, label]) => select.add(new Option(label, value)));
  const observaciones = document.createElement('textarea');
  observaciones.name = 'observaciones';
  observaciones.maxLength = 500;
  observaciones.placeholder = 'Detalle de la novedad (obligatorio para "Otra novedad")';
  const enviar = document.createElement('button');
  enviar.className = 'btn btn-danger';
  enviar.type = 'submit';
  enviar.textContent = 'Guardar novedad y reprogramar';
  form.append(select, observaciones, enviar);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    enviar.disabled = true;
    const resultado = await reportarNovedadConductor(entregaId, {
      motivo: select.value,
      observaciones: observaciones.value,
    });
    if (!resultado.success) {
      enviar.disabled = false;
      mostrarAlerta(resultado.error || 'No se pudo guardar la novedad.', 'danger');
      return;
    }
    mostrarAlerta(resultado.message, 'success');
    await cargarRutaConductor();
  });
  card.append(form);
}

async function registrarLlegadaConductor(id) {
  const resultado = await marcarLlegadaConductor(id);
  if (!resultado.success) {
    mostrarAlerta(resultado.error || 'No se pudo registrar la llegada.', 'danger');
    return;
  }
  mostrarAlerta(resultado.message, 'success');
  await cargarRutaConductor();
}

async function iniciarRecorridoConductor() {
  if (!confirm('Iniciarás el recorrido y los paquetes pasarán a estar en ruta. ¿Estás listo para salir?')) return;
  const resultado = await iniciarRutaConductor();
  if (!resultado.success) {
    mostrarAlerta(resultado.error || 'No se pudo iniciar la ruta.', 'danger');
    return;
  }
  mostrarAlerta(resultado.message || 'Recorrido iniciado.', 'success');
  await cargarRutaConductor();
}

async function finalizarRutaConductor() {
  const resultado = await finalizarRutaDeConductor();
  if (!resultado.success) {
    mostrarAlerta(resultado.error || 'No se pudo finalizar la ruta.', 'danger');
    return;
  }
  mostrarAlerta(resultado.message, 'success');
  await cargarRutaConductor();
}
