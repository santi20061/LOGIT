const { Op, Transaction } = require('sequelize');
const { sequelize, Ruta, Entrega, Paquete, Cliente, Vehiculo } = require('../models');
const rutaService = require('../services/rutaService');

exports.obtenerRutaActiva = async (req, res, next) => {
  try {
    const conductorId = req.usuario.conductorId;
    const ruta = await Ruta.findOne({
      where: { conductorId, estado: 'en_curso' },
      include: [{ model: Vehiculo, attributes: ['placa', 'marca', 'modelo'] }],
    }) || await Ruta.findOne({
      where: { conductorId, estado: 'planeada' },
      include: [{ model: Vehiculo, attributes: ['placa', 'marca', 'modelo'] }],
      order: [['id', 'ASC']],
    });
    if (!ruta) {
      return res.json({ success: true, data: null });
    }

    let paradas;
    if (ruta.estado === 'en_curso') {
      const entregas = await Entrega.findAll({
        where: { rutaId: ruta.id, conductorId },
        include: [{
          model: Paquete,
          attributes: ['id', 'numeroSeguimiento', 'destino', 'contenido', 'estado'],
          include: [{
            model: Cliente,
            attributes: ['nombre', 'telefono', 'ciudad', 'direccion'],
          }],
        }],
        order: [['id', 'ASC']],
      });
      paradas = await Promise.all(entregas.map(async entrega => ({
        id: entrega.id,
        estado: entrega.estado,
        ubicacionActual: entrega.ubicacionActual,
        observaciones: entrega.observaciones,
        motivoNovedad: entrega.motivoNovedad,
        fechaNovedad: entrega.fechaNovedad,
        intento: await Entrega.count({
          where: { paqueteId: entrega.paqueteId, id: { [Op.lte]: entrega.id } },
        }),
        paquete: entrega.Paquete,
      })));
    } else {
      const paquetes = await Paquete.findAll({
        where: { rutaId: ruta.id, estado: 'pendiente' },
        include: [{
          model: Cliente,
          attributes: ['nombre', 'telefono', 'ciudad', 'direccion'],
        }],
        order: [['id', 'ASC']],
      });
      paradas = await Promise.all(paquetes.map(async paquete => ({
        id: null,
        estado: 'pendiente',
        intento: (await Entrega.count({ where: { paqueteId: paquete.id } })) + 1,
        paquete,
      })));
    }

    return res.json({
      success: true,
      data: {
        id: ruta.id,
        nombre: ruta.nombre,
        estado: ruta.estado,
        horaInicio: ruta.horaInicio,
        vehiculo: ruta.Vehiculo,
        paradas,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.iniciarRuta = async (req, res, next) => {
  try {
    const ruta = await rutaService.iniciarRuta(null, req.usuario.conductorId);
    return res.json({
      success: true,
      message: 'Viaje iniciado. Las entregas están activas.',
      data: ruta,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    return next(error);
  }
};

exports.marcarLlegada = async (req, res, next) => {
  const entregaId = Number(req.params.id);
  if (!Number.isSafeInteger(entregaId) || entregaId <= 0) {
    return res.status(400).json({ success: false, error: 'Parada inválida.' });
  }
  try {
    const llegadaRegistrada = await sequelize.transaction({
      type: Transaction.TYPES.IMMEDIATE,
    }, async transaction => {
      const entrega = await Entrega.findOne({
        where: { id: entregaId, conductorId: req.usuario.conductorId, estado: 'en_transito' },
        include: [{ model: Ruta, where: { estado: 'en_curso' } }],
        transaction,
      });
      if (!entrega) return false;
      await entrega.update({
        estado: 'en_puerta',
        ubicacionActual: 'Conductor llegó al domicilio',
      }, { transaction });
      return true;
    });
    if (!llegadaRegistrada) {
      return res.status(404).json({ success: false, error: 'La parada no existe o ya no está activa.' });
    }
    return res.json({
      success: true,
      message: 'Llegada registrada. El cliente debe confirmar la recepción desde su perfil.',
    });
  } catch (error) {
    return next(error);
  }
};

exports.reportarNovedad = async (req, res, next) => {
  const entregaId = Number(req.params.id);
  const motivosValidos = ['no_responde', 'direccion_incorrecta', 'cliente_reprograma', 'rechazado', 'otro'];
  const motivo = req.body.motivo;
  const observaciones = typeof req.body.observaciones === 'string'
    ? req.body.observaciones.trim()
    : '';
  if (!Number.isSafeInteger(entregaId) || entregaId <= 0
    || !motivosValidos.includes(motivo)
    || (motivo === 'otro' && !observaciones)
    || observaciones.length > 500) {
    return res.status(400).json({ success: false, error: 'Indica un motivo válido y agrega detalle para “Otro”.' });
  }

  try {
    await sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
      const entrega = await Entrega.findOne({
        where: { id: entregaId, conductorId: req.usuario.conductorId, estado: 'en_transito' },
        include: [{ model: Ruta, where: { estado: 'en_curso' } }],
        transaction,
      });
      if (!entrega) {
        const error = new Error('La parada no existe o ya fue procesada.');
        error.status = 404;
        throw error;
      }
      const paquete = await Paquete.findByPk(entrega.paqueteId, { transaction });
      if (!paquete || paquete.estado !== 'en_ruta' || paquete.rutaId !== entrega.rutaId) {
        const error = new Error('El paquete ya no pertenece a esta ruta.');
        error.status = 409;
        throw error;
      }

      const textoMotivo = {
        no_responde: 'Cliente no responde',
        direccion_incorrecta: 'Dirección incorrecta',
        cliente_reprograma: 'Cliente solicita reprogramación',
        rechazado: 'Cliente rechazó el paquete',
        otro: 'Otra novedad',
      }[motivo];
      await entrega.update({
        estado: 'rechazado',
        motivoNovedad: motivo,
        fechaNovedad: new Date(),
        observaciones: [textoMotivo, observaciones].filter(Boolean).join(': '),
      }, { transaction });
      await paquete.update({ estado: 'pendiente', rutaId: null }, { transaction });
    });

    return res.json({
      success: true,
      message: 'Novedad guardada. El paquete volvió a la cola de despacho para un nuevo intento.',
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    return next(error);
  }
};

exports.finalizarRuta = async (req, res, next) => {
  try {
    await sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
      const ruta = await Ruta.findOne({
        where: { conductorId: req.usuario.conductorId, estado: 'en_curso' },
        transaction,
      });
      if (!ruta) {
        const error = new Error('No tienes una ruta activa.');
        error.status = 404;
        throw error;
      }
      const paradasPendientes = await Entrega.count({
        where: { rutaId: ruta.id, estado: 'en_transito' },
        transaction,
      });
      if (paradasPendientes > 0) {
        const error = new Error('Visita todas las paradas o registra una novedad antes de finalizar.');
        error.status = 409;
        throw error;
      }
      await ruta.update({
        estado: 'completada',
        horaFin: new Date().toLocaleTimeString('es-CO', { hour12: false }),
      }, { transaction });
      await Vehiculo.update(
        { estado: 'disponible' },
        { where: { id: ruta.vehiculoId, estado: 'en_uso' }, transaction }
      );
    });
    return res.json({ success: true, message: 'Ruta finalizada. El vehículo quedó disponible.' });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    return next(error);
  }
};
