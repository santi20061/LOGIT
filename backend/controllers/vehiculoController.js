const { leerJSON, escribirJSON, obtenerSiguienteId } = require('../utils/fileHandler');

exports.obtenerTodos = (req, res) => {
  try {
    const vehiculos = leerJSON('vehiculos');
    res.json({ success: true, data: vehiculos, total: vehiculos.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener vehículos' });
  }
};

exports.obtenerPorId = (req, res) => {
  try {
    const vehiculos = leerJSON('vehiculos');
    const vehiculo = vehiculos.find(v => v.id === parseInt(req.params.id));
    if (!vehiculo) return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });
    res.json({ success: true, data: vehiculo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener vehículo' });
  }
};

exports.crear = (req, res) => {
  try {
    const { placa, marca, modelo, año, capacidad, observaciones } = req.body;

    if (!placa || !marca || !modelo) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
    }

    const vehiculos = leerJSON('vehiculos');
    const nuevoVehiculo = {
      id: obtenerSiguienteId(vehiculos),
      placa,
      marca,
      modelo,
      año: parseInt(año),
      capacidad,
      estado: 'Disponible',
      fechaRegistro: new Date().toISOString().split('T')[0],
      observaciones: observaciones || ''
    };

    vehiculos.push(nuevoVehiculo);
    escribirJSON('vehiculos', vehiculos);

    res.status(201).json({ success: true, message: 'Vehículo creado', data: nuevoVehiculo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear vehículo' });
  }
};

exports.actualizarEstado = (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const vehiculos = leerJSON('vehiculos');
    const index = vehiculos.findIndex(v => v.id === parseInt(id));

    if (index === -1) return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });

    vehiculos[index].estado = estado;
    escribirJSON('vehiculos', vehiculos);

    res.json({ success: true, message: 'Estado actualizado', data: vehiculos[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar vehículo' });
  }
};

exports.eliminar = (req, res) => {
  try {
    let vehiculos = leerJSON('vehiculos');
    const exists = vehiculos.find(v => v.id === parseInt(req.params.id));

    if (!exists) return res.status(404).json({ success: false, message: 'Vehículo no encontrado' });

    vehiculos = vehiculos.filter(v => v.id !== parseInt(req.params.id));
    escribirJSON('vehiculos', vehiculos);

    res.json({ success: true, message: 'Vehículo eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar vehículo' });
  }
};