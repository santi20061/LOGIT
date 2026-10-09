const { leerJSON, escribirJSON, obtenerSiguienteId } = require('../utils/fileHandler');

exports.obtenerTodos = (req, res) => {
  try {
    const conductores = leerJSON('conductores');
    const vehiculos = leerJSON('vehiculos');

    const conductoresConVehiculo = conductores.map(c => {
      const vehiculo = vehiculos.find(v => v.id === c.vehiculoId);
      return {
        ...c,
        vehiculoPlaca: vehiculo?.placa || 'Sin asignar'
      };
    });

    res.json({ success: true, data: conductoresConVehiculo, total: conductores.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener conductores' });
  }
};

exports.obtenerPorId = (req, res) => {
  try {
    const conductores = leerJSON('conductores');
    const conductor = conductores.find(c => c.id === parseInt(req.params.id));
    if (!conductor) return res.status(404).json({ success: false, message: 'Conductor no encontrado' });
    res.json({ success: true, data: conductor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener conductor' });
  }
};

exports.crear = (req, res) => {
  try {
    const { nombre, cedula, telefono, email, licencia, categorialicencia, vehiculoId, observaciones } = req.body;

    if (!nombre || !cedula || !telefono || !licencia) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
    }

    const conductores = leerJSON('conductores');
    const nuevoConductor = {
      id: obtenerSiguienteId(conductores),
      nombre,
      cedula,
      telefono,
      email: email || '',
      licencia,
      categorialicencia: categorialicencia || 'C',
      estado: 'Disponible',
      vehiculoId: vehiculoId ? parseInt(vehiculoId) : null,
      fechaRegistro: new Date().toISOString().split('T')[0],
      observaciones: observaciones || ''
    };

    conductores.push(nuevoConductor);
    escribirJSON('conductores', conductores);

    res.status(201).json({ success: true, message: 'Conductor creado', data: nuevoConductor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear conductor' });
  }
};

exports.actualizarEstado = (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const conductores = leerJSON('conductores');
    const index = conductores.findIndex(c => c.id === parseInt(id));

    if (index === -1) return res.status(404).json({ success: false, message: 'Conductor no encontrado' });

    conductores[index].estado = estado;
    escribirJSON('conductores', conductores);

    res.json({ success: true, message: 'Estado actualizado', data: conductores[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar conductor' });
  }
};

exports.asignarVehiculo = (req, res) => {
  try {
    const { id } = req.params;
    const { vehiculoId } = req.body;

    const conductores = leerJSON('conductores');
    const index = conductores.findIndex(c => c.id === parseInt(id));

    if (index === -1) return res.status(404).json({ success: false, message: 'Conductor no encontrado' });

    conductores[index].vehiculoId = parseInt(vehiculoId);
    escribirJSON('conductores', conductores);

    res.json({ success: true, message: 'Vehículo asignado', data: conductores[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al asignar vehículo' });
  }
};

exports.eliminar = (req, res) => {
  try {
    let conductores = leerJSON('conductores');
    const exists = conductores.find(c => c.id === parseInt(req.params.id));

    if (!exists) return res.status(404).json({ success: false, message: 'Conductor no encontrado' });

    conductores = conductores.filter(c => c.id !== parseInt(req.params.id));
    escribirJSON('conductores', conductores);

    res.json({ success: true, message: 'Conductor eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar conductor' });
  }
};