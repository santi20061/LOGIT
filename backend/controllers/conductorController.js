const { Conductor, Vehiculo, Ruta, Usuario, SesionUsuario } = require('../models');
const { Op, Transaction } = require('sequelize');
const { sequelize } = require('../models');

exports.obtenerTodos = async (req, res) => {
  try {
    const conductores = await Conductor.findAll({
      include: [
        { model: Ruta, attributes: ['nombre', 'estado'] },
        { model: Usuario, as: 'Cuenta', attributes: ['id', 'email'] }
      ],
      order: [['id', 'DESC']]
    });
    const idsVehiculos = conductores.map(conductor => conductor.vehiculoId).filter(Boolean);
    const vehiculos = await Vehiculo.findAll({
      where: { id: idsVehiculos },
      attributes: ['id', 'placa', 'marca', 'modelo', 'estado'],
    });
    const vehiculosPorId = new Map(vehiculos.map(vehiculo => [vehiculo.id, vehiculo]));
    const rutasReservadas = await Ruta.findAll({
      attributes: ['conductorId', 'estado'],
      where: { estado: ['planeada', 'en_curso'] },
      raw: true,
    });
    const rutasPorConductor = new Map(rutasReservadas.map(ruta => [ruta.conductorId, ruta.estado]));

    const data = conductores.map(conductor => {
      const registro = conductor.toJSON();
      registro.disponibilidad = registro.estado !== 'activo'
        ? registro.estado
        : rutasPorConductor.get(registro.id) === 'en_curso'
          ? 'ocupado'
          : rutasPorConductor.has(registro.id) ? 'asignado' : 'disponible';
      registro.Vehiculo = vehiculosPorId.get(registro.vehiculoId) || null;
      registro.tieneAcceso = Boolean(registro.Cuenta);
      delete registro.Cuenta;
      return registro;
    });

    res.json({ success: true, total: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const conductor = await Conductor.findByPk(req.params.id, {
      include: [{ model: Vehiculo }, { model: Ruta }]
    });

    if (!conductor) {
      return res.status(404).json({ success: false, error: 'Conductor no encontrado' });
    }

    res.json({ success: true, data: conductor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { nombre, cedula, telefono, email, licencia, categoriaLicencia } = req.body;

    if (!nombre || !cedula || !telefono || !email || !licencia || !categoriaLicencia) {
      return res.status(400).json({ success: false, error: 'Campos obligatorios faltantes' });
    }

    const conductor = await Conductor.create({
      nombre: nombre.trim(),
      cedula: cedula.trim(),
      telefono: telefono.trim(),
      email: email.trim().toLowerCase(),
      licencia: licencia.toUpperCase().trim(),
      categoriaLicencia: categoriaLicencia.trim(),
      estado: 'activo'
    });

    res.status(201).json({
      success: true,
      message: 'Conductor creado exitosamente',
      data: conductor
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: 'Cédula, email o licencia ya están registrados'
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const conductor = await Conductor.findByPk(req.params.id);
    if (!conductor) {
      return res.status(404).json({ success: false, error: 'Conductor no encontrado' });
    }

    const cambios = {};
    for (const campo of ['nombre', 'telefono', 'email', 'licencia', 'categoriaLicencia']) {
      if (typeof req.body[campo] === 'string') {
        cambios[campo] = req.body[campo].trim();
      }
    }
    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ success: false, error: 'No hay cambios válidos para guardar.' });
    }
    await conductor.update(cambios);

    res.json({
      success: true,
      message: 'Conductor actualizado exitosamente',
      data: conductor
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.cambiarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    const estadosValidos = ['activo', 'inactivo', 'vacaciones'];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: `Estado debe ser uno de: ${estadosValidos.join(', ')}`
      });
    }

    const conductor = await sequelize.transaction({
      type: Transaction.TYPES.IMMEDIATE,
    }, async transaction => {
      const conductorActual = await Conductor.findByPk(req.params.id, { transaction });
      if (!conductorActual) {
        const error = new Error('Conductor no encontrado');
        error.status = 404;
        throw error;
      }
      if (estado !== 'activo' && await Ruta.count({
        where: { conductorId: conductorActual.id, estado: ['planeada', 'en_curso'] },
        transaction,
      })) {
        const error = new Error('No se puede cambiar el estado de un conductor mientras tenga una ruta planeada o en curso.');
        error.status = 409;
        throw error;
      }

      await conductorActual.update({ estado }, { transaction });
      return conductorActual;
    });

    res.json({
      success: true,
      message: `Conductor actualizado a: ${estado}`,
      data: conductor
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.asignarVehiculo = async (req, res) => {
  const conductorId = Number(req.params.id);
  const vehiculoId = Number(req.body.vehiculoId);
  if (!Number.isSafeInteger(conductorId) || conductorId <= 0
    || !Number.isSafeInteger(vehiculoId) || vehiculoId <= 0) {
    return res.status(400).json({ success: false, error: 'Selecciona un conductor y vehículo válidos.' });
  }

  try {
    const conductor = await sequelize.transaction({
      type: Transaction.TYPES.IMMEDIATE,
    }, async transaction => {
      const conductorActual = await Conductor.findByPk(conductorId, { transaction });
      if (!conductorActual) {
        const error = new Error('Conductor no encontrado.');
        error.status = 404;
        throw error;
      }
      const vehiculo = await Vehiculo.findByPk(vehiculoId, { transaction });
      if (!vehiculo) {
        const error = new Error('Vehículo no encontrado.');
        error.status = 404;
        throw error;
      }
      if (conductorActual.vehiculoId === vehiculo.id
        && vehiculo.conductorId === conductorActual.id) {
        return conductorActual;
      }
      if (vehiculo.estado !== 'disponible' && conductorActual.vehiculoId !== vehiculo.id) {
        const error = new Error('El vehículo seleccionado no está disponible.');
        error.status = 409;
        throw error;
      }

      const rutasAsignadas = await Ruta.count({
        where: {
          estado: ['planeada', 'en_curso'],
          [Op.or]: [
            { conductorId: conductorActual.id },
            { vehiculoId: vehiculo.id },
          ],
        },
        transaction,
      });
      if (rutasAsignadas > 0) {
        const error = new Error('No se puede cambiar el vehículo mientras el conductor o el vehículo tenga una ruta planeada o en curso.');
        error.status = 409;
        throw error;
      }

      const otroConductor = await Conductor.findOne({
        where: {
          id: { [Op.ne]: conductorActual.id },
          vehiculoId: vehiculo.id,
        },
        transaction,
      });
      if (otroConductor) {
        const error = new Error('El vehículo ya está asignado a otro conductor.');
        error.status = 409;
        throw error;
      }
      if (vehiculo.conductorId && vehiculo.conductorId !== conductorActual.id) {
        const error = new Error('El vehículo ya está vinculado a otro conductor.');
        error.status = 409;
        throw error;
      }

      if (conductorActual.vehiculoId && conductorActual.vehiculoId !== vehiculo.id) {
        await Vehiculo.update(
          { conductorId: null },
          {
            where: { id: conductorActual.vehiculoId, conductorId: conductorActual.id },
            transaction,
          }
        );
      }
      await vehiculo.update({ conductorId: conductorActual.id }, { transaction });
      await conductorActual.update({ vehiculoId: vehiculo.id }, { transaction });
      return conductorActual;
    });

    res.json({
      success: true,
      message: 'Vehículo asignado al conductor. Ya puede seleccionarse para sus rutas.',
      data: conductor
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
    await sequelize.transaction(async transaction => {
      const conductor = await Conductor.findByPk(req.params.id, { transaction });
      if (!conductor) {
        const error = new Error('Conductor no encontrado');
        error.status = 404;
        throw error;
      }
      if (conductor.estado === 'activo') {
        const error = new Error('No se puede eliminar conductor activo');
        error.status = 400;
        throw error;
      }
      const cuenta = await Usuario.findOne({
        where: { conductorId: conductor.id },
        transaction,
      });
      if (cuenta) {
        await SesionUsuario.destroy({ where: { usuarioId: cuenta.id }, transaction });
        await cuenta.destroy({ transaction });
      }
      await conductor.destroy({ transaction });
    });

    res.json({ success: true, message: 'Conductor eliminado exitosamente' });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};