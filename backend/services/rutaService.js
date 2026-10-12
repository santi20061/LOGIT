const { Op, Transaction } = require('sequelize');
const { sequelize, Ruta, Conductor, Vehiculo, Paquete, Entrega } = require('../models');

async function validarDisponibilidad(conductorId, vehiculoId, rutaId, transaction) {
  const whereRutaActiva = { estado: 'en_curso' };
  if (rutaId) whereRutaActiva.id = { [Op.ne]: rutaId };

  const conductorOcupado = await Ruta.findOne({
    where: { ...whereRutaActiva, conductorId },
    transaction,
  });
  const vehiculoOcupado = await Ruta.findOne({
    where: { ...whereRutaActiva, vehiculoId },
    transaction,
  });
  if (conductorOcupado || vehiculoOcupado) {
    const error = new Error('El conductor o el vehículo ya está asignado a otra ruta en curso.');
    error.status = 409;
    throw error;
  }
}

async function iniciarRuta(rutaId, conductorId) {
  return sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
    const ruta = rutaId
      ? await Ruta.findByPk(rutaId, { transaction })
      : await Ruta.findOne({
        where: { conductorId, estado: 'planeada' },
        order: [['id', 'ASC']],
        transaction,
      });
    if (!ruta || (conductorId && ruta.conductorId !== conductorId)) {
      const error = new Error('No se encontró una ruta planeada asignada a tu cuenta.');
      error.status = 404;
      throw error;
    }
    if (ruta.estado !== 'planeada') {
      const error = new Error('Solo puedes iniciar una ruta que esté planeada.');
      error.status = 409;
      throw error;
    }

    const conductor = await Conductor.findByPk(ruta.conductorId, { transaction });
    if (!conductor || conductor.estado !== 'activo') {
      const error = new Error('El conductor asignado no está activo.');
      error.status = 409;
      throw error;
    }
    const vehiculo = await Vehiculo.findByPk(ruta.vehiculoId, { transaction });
    if (!vehiculo || vehiculo.estado !== 'disponible') {
      const error = new Error('El vehículo asignado no está disponible.');
      error.status = 409;
      throw error;
    }
    if (conductor.vehiculoId !== vehiculo.id) {
      const error = new Error('El vehículo de la ruta ya no está asignado al conductor.');
      error.status = 409;
      throw error;
    }

    await validarDisponibilidad(conductor.id, vehiculo.id, ruta.id, transaction);
    const paquetes = await Paquete.findAll({
      where: { rutaId: ruta.id, estado: 'pendiente' },
      transaction,
    });
    if (!paquetes.length) {
      const error = new Error('La ruta no tiene paquetes pendientes asignados desde Despacho.');
      error.status = 409;
      throw error;
    }

    for (const paquete of paquetes) {
      const entregaActiva = await Entrega.findOne({
        where: {
          paqueteId: paquete.id,
          estado: { [Op.in]: ['en_transito', 'en_puerta'] },
        },
        transaction,
      });
      if (entregaActiva) {
        const error = new Error(`El paquete ${paquete.numeroSeguimiento} ya tiene una entrega activa.`);
        error.status = 409;
        throw error;
      }
    }

    for (const paquete of paquetes) {
      await Entrega.create({
        numeroSeguimiento: paquete.numeroSeguimiento,
        paqueteId: paquete.id,
        rutaId: ruta.id,
        conductorId: ruta.conductorId,
        estado: 'en_transito',
      }, { transaction });
      await paquete.update({ estado: 'en_ruta' }, { transaction });
    }
    await ruta.update({
      estado: 'en_curso',
      horaInicio: new Date().toLocaleTimeString('es-CO', { hour12: false }),
    }, { transaction });
    await vehiculo.update({ estado: 'en_uso' }, { transaction });
    return ruta;
  });
}

module.exports = { iniciarRuta };
