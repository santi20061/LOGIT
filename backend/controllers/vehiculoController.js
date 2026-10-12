const { Vehiculo, Ruta, sequelize } = require('../models');
const { Transaction } = require('sequelize');

exports.obtenerTodos = async (req, res) => {
  try {
    const vehiculos = await Vehiculo.findAll({
      include: [{ model: Ruta, attributes: ['nombre', 'estado'] }],
      order: [['id', 'DESC']]
    });
    const rutasReservadas = await Ruta.findAll({
      attributes: ['vehiculoId', 'estado'],
      where: { estado: ['planeada', 'en_curso'] },
      raw: true,
    });
    const rutasPorVehiculo = new Map(rutasReservadas.map(ruta => [ruta.vehiculoId, ruta.estado]));
    const data = vehiculos.map(vehiculo => {
      const registro = vehiculo.toJSON();
      const estadoRuta = rutasPorVehiculo.get(registro.id);
      registro.disponibilidad = estadoRuta === 'en_curso'
        ? 'ocupado'
        : estadoRuta === 'planeada' ? 'asignado' : registro.estado;
      return registro;
    });

    res.json({ success: true, total: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByPk(req.params.id, {
      include: [{ model: Ruta }]
    });

    if (!vehiculo) {
      return res.status(404).json({ success: false, error: 'Vehículo no encontrado' });
    }

    res.json({ success: true, data: vehiculo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { placa, marca, modelo, año, capacidad } = req.body;

    if (!placa || !marca || !modelo || !año || !capacidad) {
      return res.status(400).json({ success: false, error: 'Campos obligatorios faltantes' });
    }

    if (isNaN(año) || año < 2000 || año > new Date().getFullYear()) {
      return res.status(400).json({ success: false, error: 'Año inválido' });
    }

    const vehiculo = await Vehiculo.create({
      placa: placa.toUpperCase().trim(),
      marca: marca.trim(),
      modelo: modelo.trim(),
      año,
      capacidad: capacidad.trim(),
      estado: 'disponible'
    });

    res.status(201).json({
      success: true,
      message: 'Vehículo creado exitosamente',
      data: vehiculo
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, error: 'Placa ya está registrada' });
    }

    res.status(500).json({ success: false, error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByPk(req.params.id);
    if (!vehiculo) {
      return res.status(404).json({ success: false, error: 'Vehículo no encontrado' });
    }

    const cambios = {};
    for (const campo of ['placa', 'marca', 'modelo', 'capacidad']) {
      if (typeof req.body[campo] === 'string') {
        cambios[campo] = req.body[campo].trim();
      }
    }
    if (req.body['año'] !== undefined) {
      const año = Number(req.body['año']);
      if (!Number.isInteger(año) || año < 2000 || año > new Date().getFullYear()) {
        return res.status(400).json({ success: false, error: 'Año inválido' });
      }
      cambios['año'] = año;
    }
    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ success: false, error: 'No hay cambios válidos para guardar.' });
    }
    await vehiculo.update(cambios);

    res.json({
      success: true,
      message: 'Vehículo actualizado exitosamente',
      data: vehiculo
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.cambiarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    const estadosValidos = ['disponible', 'en_uso', 'mantenimiento'];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: `Estado debe ser uno de: ${estadosValidos.join(', ')}`
      });
    }

    const vehiculo = await sequelize.transaction({
      type: Transaction.TYPES.IMMEDIATE,
    }, async transaction => {
      const vehiculoActual = await Vehiculo.findByPk(req.params.id, { transaction });
      if (!vehiculoActual) {
        const error = new Error('Vehículo no encontrado');
        error.status = 404;
        throw error;
      }
      if (await Ruta.count({
        where: { vehiculoId: vehiculoActual.id, estado: ['planeada', 'en_curso'] },
        transaction,
      })) {
        const error = new Error('No se puede cambiar el estado del vehículo mientras tenga una ruta planeada o en curso.');
        error.status = 409;
        throw error;
      }

      await vehiculoActual.update({ estado }, { transaction });
      return vehiculoActual;
    });

    res.json({
      success: true,
      message: `Vehículo actualizado a: ${estado}`,
      data: vehiculo
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByPk(req.params.id);
    if (!vehiculo) {
      return res.status(404).json({ success: false, error: 'Vehículo no encontrado' });
    }

    if (vehiculo.estado === 'en_uso') {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar vehículo en uso'
      });
    }

    await vehiculo.destroy();

    res.json({ success: true, message: 'Vehículo eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};