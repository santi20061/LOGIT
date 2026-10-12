var paquetesDespacho = [];
var municipiosDespacho = [];
var paquetesSeleccionados = new Set();

async function inicializarDespacho() {
  const [cola, municipios] = await Promise.all([
    obtenerColaDespacho(),
    obtenerMunicipiosMeta(),
  ]);
  const destino = document.getElementById('despacho-destino');
  if (!destino) return;

  if (!municipios.success || !cola.success) {
    mostrarAlerta(municipios.error || cola.error || 'No se pudo cargar el despacho.', 'danger');
    return;
  }

  municipiosDespacho = municipios.data;
  paquetesDespacho = cola.data.paquetes;
  paquetesSeleccionados = new Set();
  destino.replaceChildren(new Option('Selecciona un municipio', ''));
  municipiosDespacho.forEach(municipio => destino.add(new Option(municipio, municipio)));
  if (paquetesDespacho.length) destino.value = paquetesDespacho[0].destino;
  destino.addEventListener('change', () => {
    paquetesSeleccionados.clear();
    renderizarPaquetesDespacho();
  });
  document.getElementById('form-despacho').addEventListener('submit', crearDespachoDesdeFormulario);
  poblarConductoresDespacho(cola.data.conductores);
  actualizarVehiculoDespacho();
  document.getElementById('despacho-conductor').addEventListener('change', actualizarVehiculoDespacho);
  renderizarPaquetesDespacho();
}

async function cargarDespacho() {
  const resultado = await obtenerColaDespacho();
  if (!resultado.success) {
    mostrarAlerta(resultado.error || 'No se pudo actualizar la cola.', 'danger');
    return;
  }
  paquetesDespacho = resultado.data.paquetes;
  paquetesSeleccionados = new Set(
    [...paquetesSeleccionados].filter(id => paquetesDespacho.some(paquete => paquete.id === id))
  );
  const conductorIdActual = document.getElementById('despacho-conductor').value;
  poblarConductoresDespacho(resultado.data.conductores);
  if (resultado.data.conductores.some(item => String(item.id) === conductorIdActual)) {
    document.getElementById('despacho-conductor').value = conductorIdActual;
  }
  actualizarVehiculoDespacho();
  renderizarPaquetesDespacho();
}

function poblarConductoresDespacho(conductores) {
  const select = document.getElementById('despacho-conductor');
  select.replaceChildren(new Option('Selecciona un conductor', ''));
  conductores.forEach(conductor => {
    const option = new Option(
      `${conductor.nombre} · ${conductor.Vehiculo.placa}`,
      conductor.id
    );
    option.dataset.vehiculoId = conductor.Vehiculo.id;
    option.dataset.vehiculoLabel = `${conductor.Vehiculo.placa} · ${conductor.Vehiculo.marca} ${conductor.Vehiculo.modelo}`;
    select.add(option);
  });
  if (!conductores.length) {
    select.options[0].textContent = 'Sin conductores con vehículo disponible';
  }
}

function actualizarVehiculoDespacho() {
  const conductor = document.getElementById('despacho-conductor').selectedOptions[0];
  const vehiculo = document.getElementById('despacho-vehiculo');
  const texto = conductor?.dataset.vehiculoLabel || 'Selecciona un conductor con vehículo asignado';
  vehiculo.replaceChildren(new Option(texto, conductor?.dataset.vehiculoId || ''));
  vehiculo.value = conductor?.dataset.vehiculoId || '';
}

function renderizarPaquetesDespacho() {
  const destino = document.getElementById('despacho-destino').value;
  const contenedor = document.getElementById('despacho-paquetes');
  contenedor.replaceChildren();
  const paquetes = paquetesDespacho.filter(paquete => !destino || paquete.destino === destino);
  if (!paquetes.length) {
    const vacio = document.createElement('p');
    vacio.className = 'empty-state';
    vacio.textContent = destino ? 'No hay paquetes pendientes para este municipio.' : 'La cola está vacía. No hay paquetes listos para despachar.';
    contenedor.append(vacio);
  }

  paquetes.forEach(paquete => {
    const label = document.createElement('label');
    label.className = 'dispatch-package';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'paquete-despacho';
    checkbox.value = paquete.id;
    checkbox.checked = paquetesSeleccionados.has(paquete.id);
    label.classList.toggle('selected', checkbox.checked);
    checkbox.addEventListener('change', () => {
      label.classList.toggle('selected', checkbox.checked);
      if (checkbox.checked) paquetesSeleccionados.add(paquete.id);
      else paquetesSeleccionados.delete(paquete.id);
      actualizarResumenDespacho();
    });

    const detalles = document.createElement('span');
    detalles.className = 'dispatch-package-info';
    const nombre = document.createElement('strong');
    nombre.textContent = `${paquete.Cliente?.nombre || 'Cliente'} · ${paquete.numeroSeguimiento}`;
    const direccion = document.createElement('span');
    direccion.textContent = `${paquete.Cliente?.direccion || 'Sin dirección'} · ${paquete.destino}`;
    const contenido = document.createElement('small');
    contenido.textContent = paquete.contenido || 'Paquete';
    detalles.append(nombre, direccion, contenido);
    label.append(checkbox, detalles);
    contenedor.append(label);
  });
  actualizarResumenDespacho();
}

function actualizarResumenDespacho() {
  const cantidad = paquetesSeleccionados.size;
  document.getElementById('despacho-seleccion').textContent = cantidad
    ? `${cantidad} paquete${cantidad === 1 ? '' : 's'} seleccionado${cantidad === 1 ? '' : 's'}.`
    : 'Selecciona paquetes para preparar la ruta.';
  document.querySelector('.dispatch-submit').disabled = cantidad === 0;
}

async function crearDespachoDesdeFormulario(event) {
  event.preventDefault();
  const paqueteIds = [...document.querySelectorAll('[name="paquete-despacho"]:checked')]
    .map(input => Number(input.value));
  if (!paqueteIds.length) {
    mostrarAlerta('Selecciona al menos un paquete.', 'warning');
    return;
  }
  const boton = document.querySelector('.dispatch-submit');
  boton.disabled = true;
  const resultado = await crearDespacho({
    destino: document.getElementById('despacho-destino').value,
    conductorId: Number(document.getElementById('despacho-conductor').value),
    vehiculoId: Number(document.getElementById('despacho-vehiculo').value),
    paqueteIds,
  });
  boton.disabled = false;
  if (!resultado.success) {
    mostrarAlerta(resultado.error || 'No se pudo crear el despacho.', 'danger');
    return;
  }
  mostrarAlerta(resultado.message || 'Ruta planeada correctamente.', 'success');
  paquetesSeleccionados.clear();
  await cargarDespacho();
}
