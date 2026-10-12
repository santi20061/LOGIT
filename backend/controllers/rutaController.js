const { Op, Transaction } = require('sequelize');
const { sequelize, Ruta, Conductor, Vehiculo, Paquete, Entrega } = require('../models');

async function validarDisponibilidad(conductorId, vehiculoId, rutaId, transaction) {
  const whereRutaActiva = { estado: { [Op.in]: ['planeada', 'en_curso'] } };
  if (rutaId) whereRutaActiva.id = { [Op.ne]: rutaId };

  const rutaConductorOcupado = await Ruta.findOne({
    where: { ...whereRutaActiva, conductorId },
    transaction,
  });
  if (rutaConductorOcupado) {
    const error = new Error('El conductor ya tiene otra ruta planeada o en curso.');
    error.status = 409;
    throw error;
  }

  const rutaVehiculoOcupado = await Ruta.findOne({
    where: { ...whereRutaActiva, vehiculoId },
    transaction,
  });
  if (rutaVehiculoOcupado) {
    const error = new Error('El vehículo ya está asignado a otra ruta planeada o en curso.');
    error.status = 409;
    throw error;
  }
}

exports.obtenerTodos = async (req, res) => {
  try {
    const rutas = await Ruta.findAll({
      include: [
        { model: Conductor, attributes: ['nombre', 'licencia'] },
        { model: Vehiculo, attributes: ['placa', 'marca'] },
        { model: Paquete, attributes: ['numeroSeguimiento', 'estado'] }
      ],
      order: [['id', 'DESC']]
    });

    res.json({ success: true, total: rutas.length, data: rutas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const ruta = await Ruta.findByPk(req.params.id, {
      include: [
        { model: Conductor },
        { model: Vehiculo },
        { model: Paquete }
      ]
    });

    if (!ruta) {
      return res.status(404).json({ success: false, error: 'Ruta no encontrada' });
    }

    res.json({ success: true, data: ruta });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const ruta = await Ruta.findByPk(req.params.id);
    if (!ruta) {
      return res.status(404).json({ success: false, error: 'Ruta no encontrada' });
    }

    if (ruta.estado !== 'planeada') {
      return res.status(409).json({ success: false, error: 'Solo se pueden editar rutas planeadas.' });
    }

    const cambios = {};
    if (typeof req.body.nombre === 'string' && req.body.nombre.trim()) {
      cambios.nombre = req.body.nombre.trim();
    }
    if (typeof req.body.descripcion === 'string' || req.body.descripcion === null) {
      cambios.descripcion = req.body.descripcion?.trim() || null;
    }

    const conductorId = req.body.conductorId === undefined ? ruta.conductorId : Number(req.body.conductorId);
    const vehiculoId = req.body.vehiculoId === undefined ? ruta.vehiculoId : Number(req.body.vehiculoId);
    if (!Number.isSafeInteger(conductorId) || conductorId <= 0
      || !Number.isSafeInteger(vehiculoId) || vehiculoId <= 0) {
      return res.status(400).json({ success: false, error: 'Conductor o vehículo inválido.' });
    }

    await sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
      const conductor = await Conductor.findByPk(conductorId, { transaction });
      const vehiculo = await Vehiculo.findByPk(vehiculoId, { transaction });
      if (!conductor || !vehiculo) {
        const error = new Error(!conductor ? 'Conductor no encontrado' : 'Vehículo no encontrado');
        error.status = 404;
        throw error;
      }
      if (vehiculo.estado !== 'disponible') {
        const error = new Error('Solo se pueden asignar vehículos disponibles a una ruta planeada.');
        error.status = 409;
        throw error;
      }
      if (conductor.estado !== 'activo') {
        const error = new Error('Solo se pueden asignar conductores activos a una ruta.');
        error.status = 409;
        throw error;
      }
      if (conductor.vehiculoId !== vehiculo.id) {
        const error = new Error('La ruta debe usar el vehículo asignado al conductor.');
        error.status = 409;
        throw error;
      }
      await validarDisponibilidad(conductorId, vehiculoId, ruta.id, transaction);
      await ruta.update({ ...cambios, conductorId, vehiculoId }, { transaction });
    });

    res.json({
      success: true,
      message: 'Ruta actualizada exitosamente',
      data: ruta
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.cambiarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    const estadosValidos = ['cancelada'];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: 'El administrador puede cancelar una ruta. El conductor inicia y finaliza su recorrido.',
      });
    }

    const ruta = await sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
      const rutaActual = await Ruta.findByPk(req.params.id, { transaction });
      if (!rutaActual) {
        const error = new Error('Ruta no encontrada');
        error.status = 404;
        throw error;
      }
      const transiciones = {
        planeada: ['cancelada'],
        en_curso: ['cancelada'],
      };
      if (!transiciones[rutaActual.estado]?.includes(estado)) {
        const error = new Error('La transición de estado solicitada no está permitida.');
        error.status = 409;
        throw error;
      }

      const estabaEnCurso = rutaActual.estado === 'en_curso';
      if (estado === 'cancelada' && estabaEnCurso) {
        const entregasActivas = await Entrega.findAll({
          where: { rutaId: rutaActual.id, estado: 'en_transito' },
          transaction,
        });
        for (const entrega of entregasActivas) {
          await entrega.update({
            estado: 'rechazado',
            motivoNovedad: 'ruta_cancelada',
            fechaNovedad: new Date(),
            observaciones: 'Visita cancelada por cierre de la ruta.',
          }, { transaction });
          await Paquete.update(
            { estado: 'pendiente', rutaId: null },
            { where: { id: entrega.paqueteId, estado: 'en_ruta' }, transaction }
          );
        }
      }
      if (estado === 'cancelada' && !estabaEnCurso) {
        await Paquete.update(
          { rutaId: null },
          { where: { rutaId: rutaActual.id, estado: 'pendiente' }, transaction }
        );
      }
      await rutaActual.update({
        estado,
        horaFin: estabaEnCurso
          ? new Date().toLocaleTimeString('es-CO', { hour12: false })
          : rutaActual.horaFin,
      }, { transaction });

      const vehiculo = await Vehiculo.findByPk(rutaActual.vehiculoId, { transaction });
      if (estabaEnCurso && vehiculo?.estado === 'en_uso') {
        await vehiculo.update({ estado: 'disponible' }, { transaction });
      }
      return rutaActual;
    });

    res.json({
      success: true,
      message: `Ruta actualizada a: ${estado}`,
      data: ruta
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
    const ruta = await Ruta.findByPk(req.params.id);
    if (!ruta) {
      return res.status(404).json({ success: false, error: 'Ruta no encontrada' });
    }

    if (ruta.estado !== 'planeada') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden eliminar rutas en estado "planeada"'
      });
    }

    await sequelize.transaction(async transaction => {
      await Paquete.update(
        { rutaId: null },
        { where: { rutaId: ruta.id, estado: 'pendiente' }, transaction }
      );
      await ruta.destroy({ transaction });
    });

    res.json({ success: true, message: 'Ruta eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};