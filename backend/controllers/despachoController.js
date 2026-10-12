const { Op, Transaction } = require('sequelize');
const { sequelize, Paquete, Cliente, Conductor, Vehiculo, Ruta } = require('../models');
const { obtenerMunicipioMeta } = require('../utils/municipiosMeta');

exports.obtenerPaquetesPendientes = async (req, res, next) => {
  try {
    const paquetes = await Paquete.findAll({
      where: { estado: 'pendiente', rutaId: null },
      include: [{
        model: Cliente,
        attributes: ['nombre', 'telefono', 'ciudad', 'direccion'],
      }],
      order: [['destino', 'ASC'], ['fechaCreacion', 'ASC'], ['id', 'ASC']],
    });
    const [conductoresActivos, vehiculosDisponibles, rutasReservadas] = await Promise.all([
      Conductor.findAll({
        where: { estado: 'activo' },
        attributes: ['id', 'nombre', 'vehiculoId'],
        order: [['nombre', 'ASC']],
      }),
      Vehiculo.findAll({
        where: { estado: 'disponible' },
        attributes: ['id', 'placa', 'marca', 'modelo'],
        order: [['placa', 'ASC']],
      }),
      Ruta.findAll({
        where: { estado: { [Op.in]: ['planeada', 'en_curso'] } },
        attributes: ['conductorId', 'vehiculoId'],
      }),
    ]);
    const conductoresReservados = new Set(rutasReservadas.map(ruta => ruta.conductorId));
    const vehiculosReservados = new Set(rutasReservadas.map(ruta => ruta.vehiculoId));
    const vehiculos = vehiculosDisponibles.filter(vehiculo => !vehiculosReservados.has(vehiculo.id));
    const vehiculosPorId = new Map(vehiculos.map(vehiculo => [vehiculo.id, vehiculo]));
    const conductoresConVehiculo = conductoresActivos
      .map(conductor => ({
        ...conductor.toJSON(),
        Vehiculo: vehiculosPorId.get(conductor.vehiculoId) || null,
      }))
      .filter(conductor => conductor.Vehiculo && !conductoresReservados.has(conductor.id));
    return res.json({
      success: true,
      data: { paquetes, conductores: conductoresConVehiculo, vehiculos },
    });
  } catch (error) {
    return next(error);
  }
};

exports.crearDespacho = async (req, res, next) => {
  const destino = obtenerMunicipioMeta(req.body.destino);
  const conductorId = Number(req.body.conductorId);
  const vehiculoId = Number(req.body.vehiculoId);
  const paqueteIds = Array.isArray(req.body.paqueteIds)
    ? [...new Set(req.body.paqueteIds.map(Number))]
    : [];

  if (!destino || !Number.isSafeInteger(conductorId) || conductorId <= 0
    || !Number.isSafeInteger(vehiculoId) || vehiculoId <= 0
    || paqueteIds.length === 0
    || paqueteIds.some(id => !Number.isSafeInteger(id) || id <= 0)) {
    return res.status(400).json({
      success: false,
      error: 'Selecciona un municipio, un conductor, un vehículo y al menos un paquete.',
    });
  }

  try {
    const resultado = await sequelize.transaction({
      type: Transaction.TYPES.IMMEDIATE,
    }, async transaction => {
      const conductor = await Conductor.findByPk(conductorId, { transaction });
      if (!conductor || conductor.estado !== 'activo') {
        const error = new Error('El conductor ya no está disponible.');
        error.status = 409;
        throw error;
      }
      const vehiculo = await Vehiculo.findByPk(vehiculoId, { transaction });
      if (!vehiculo || vehiculo.estado !== 'disponible') {
        const error = new Error('El vehículo ya no está disponible.');
        error.status = 409;
        throw error;
      }
      if (conductor.vehiculoId !== vehiculo.id) {
        const error = new Error('El conductor debe salir con el vehículo que tiene asignado en Conductores.');
        error.status = 409;
        throw error;
      }
      const asignacionActiva = await Ruta.findOne({
        where: {
          estado: { [Op.in]: ['planeada', 'en_curso'] },
          [Op.or]: [{ conductorId }, { vehiculoId }],
        },
        transaction,
      });
      if (asignacionActiva) {
        const error = new Error('El conductor o vehículo ya está en otra ruta.');
        error.status = 409;
        throw error;
      }

      const paquetes = await Paquete.findAll({
        where: { id: paqueteIds, estado: 'pendiente', rutaId: null },
        transaction,
      });
      if (paquetes.length !== paqueteIds.length) {
        const error = new Error('Uno o más paquetes ya fueron asignados o dejaron de estar pendientes. Actualiza la cola.');
        error.status = 409;
        throw error;
      }
      if (paquetes.some(paquete => obtenerMunicipioMeta(paquete.destino) !== destino)) {
        const error = new Error('Todos los paquetes de una ruta deben tener el mismo municipio de destino.');
        error.status = 400;
        throw error;
      }

      const fecha = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Bogota' });
      const ruta = await Ruta.create({
        nombre: `Reparto ${destino} · ${fecha}`,
        descripcion: `Despacho diario para ${paquetes.length} paquete(s) en ${destino}.`,
        conductorId,
        vehiculoId,
        estado: 'planeada',
      }, { transaction });
      await Paquete.update(
        { rutaId: ruta.id },
        { where: { id: paqueteIds, estado: 'pendiente', rutaId: null }, transaction }
      );
      return { ruta, cantidadPaquetes: paquetes.length };
    });

    return res.status(201).json({
      success: true,
      message: `Despacho planeado con ${resultado.cantidadPaquetes} paquete(s).`,
      data: resultado,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    return next(error);
  }
};
