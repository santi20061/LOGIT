const { Cliente, Entrega, Paquete, Usuario, sequelize } = require('../models');
const { Transaction } = require('sequelize');

async function obtenerClienteDeSesion(usuario, options = {}) {
  if (!usuario.clienteId) return null;
  return Cliente.findByPk(usuario.clienteId, options);
}

exports.obtenerPerfil = async (req, res, next) => {
  try {
    const cliente = await obtenerClienteDeSesion(req.usuario, {
      attributes: ['nombre', 'telefono', 'email', 'ciudad', 'direccion'],
    });
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'No se encontró el perfil del cliente.' });
    }
    return res.json({ success: true, data: cliente });
  } catch (error) {
    return next(error);
  }
};

exports.actualizarPerfil = async (req, res, next) => {
  try {
    const { nombre, telefono, ciudad, direccion } = req.body;
    if (![nombre, telefono, ciudad, direccion].every(value => typeof value === 'string' && value.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, teléfono, ciudad y dirección son obligatorios.',
      });
    }
    if (nombre.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'El nombre debe tener al menos 3 caracteres.' });
    }
    if (!/^\d{10}$/.test(telefono.trim())) {
      return res.status(400).json({ success: false, error: 'El teléfono debe tener 10 dígitos.' });
    }

    let perfil;
    await sequelize.transaction(async transaction => {
      const cliente = await obtenerClienteDeSesion(req.usuario, { transaction });
      if (!cliente) {
        const error = new Error('No se encontró el perfil del cliente.');
        error.status = 404;
        throw error;
      }

      await cliente.update({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        ciudad: ciudad.trim(),
        direccion: direccion.trim(),
      }, { transaction });
      await Usuario.update(
        { nombre: nombre.trim() },
        { where: { id: req.usuario.id }, transaction }
      );
      perfil = {
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        email: cliente.email,
        ciudad: cliente.ciudad,
        direccion: cliente.direccion,
      };
    });

    return res.json({ success: true, data: perfil });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    return next(error);
  }
};

exports.obtenerPedidos = async (req, res, next) => {
  try {
    const paquetes = await Paquete.findAll({
      attributes: [
        'id', 'origen', 'destino', 'contenido', 'estado', 'fechaCreacion', 'fechaEntrega',
        'incidenciaCliente', 'fechaIncidencia', 'fechaDevolucion',
      ],
      where: { clienteId: req.usuario.clienteId },
      include: [{
        model: Entrega,
        attributes: ['estado', 'ubicacionActual', 'fechaCreacion', 'fechaEntrega', 'motivoNovedad', 'fechaNovedad'],
        required: false,
      }],
      order: [['fechaCreacion', 'DESC'], [Entrega, 'id', 'DESC']],
    });

    return res.json({
      success: true,
      total: paquetes.length,
      data: paquetes.map(paquete => {
        const registro = paquete.toJSON();
        registro.puedeConfirmarRecepcion = registro.estado === 'en_ruta'
          && registro.Entregas.some(entrega => entrega.estado === 'en_puerta');
        return registro;
      }),
    });
  } catch (error) {
    return next(error);
  }
};

exports.confirmarRecepcion = async (req, res, next) => {
  const paqueteId = Number(req.params.id);
  if (!Number.isSafeInteger(paqueteId) || paqueteId <= 0) {
    return res.status(400).json({ success: false, error: 'Pedido inválido.' });
  }

  try {
    let fechaEntrega;
    await sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
      const paquete = await Paquete.findOne({
        where: { id: paqueteId, clienteId: req.usuario.clienteId },
        transaction,
      });
      if (!paquete) {
        const error = new Error('Pedido no encontrado.');
        error.status = 404;
        throw error;
      }
      if (paquete.estado === 'entregado') {
        const error = new Error('Este pedido ya figura como recibido.');
        error.status = 409;
        throw error;
      }
      if (paquete.estado !== 'en_ruta') {
        const error = new Error('Solo puedes confirmar pedidos que estén en ruta.');
        error.status = 409;
        throw error;
      }

      const entregasEnPuerta = await Entrega.findAll({
        where: { paqueteId, estado: 'en_puerta' },
        transaction,
      });
      if (entregasEnPuerta.length === 0) {
        const error = new Error('El pedido todavía no figura como llegado a tu domicilio.');
        error.status = 409;
        throw error;
      }

      fechaEntrega = new Date();
      await paquete.update({ estado: 'entregado', fechaEntrega }, { transaction });
      await Promise.all(entregasEnPuerta.map(entrega => entrega.update({
        estado: 'entregado',
        firmaRecibido: req.usuario.nombre,
        observaciones: 'Recepción confirmada por el cliente desde el portal.',
        fechaEntrega,
      }, { transaction })));
    });

    return res.json({
      success: true,
      message: 'Gracias. La recepción del pedido quedó confirmada.',
      data: { fechaEntrega },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    return next(error);
  }
};

exports.reportarDano = async (req, res, next) => {
  const paqueteId = Number(req.params.id);
  const detalle = typeof req.body.detalle === 'string' ? req.body.detalle.trim() : '';
  if (!Number.isSafeInteger(paqueteId) || paqueteId <= 0
    || detalle.length < 10 || detalle.length > 500) {
    return res.status(400).json({
      success: false,
      error: 'Describe el daño en 10 a 500 caracteres.',
    });
  }

  try {
    await sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
      const paquete = await Paquete.findOne({
        where: { id: paqueteId, clienteId: req.usuario.clienteId },
        transaction,
      });
      if (!paquete) {
        const error = new Error('Pedido no encontrado.');
        error.status = 404;
        throw error;
      }
      if (paquete.estado !== 'en_ruta') {
        const error = new Error('Solo puedes reportar daños de un pedido llegado a tu domicilio.');
        error.status = 409;
        throw error;
      }
      const entregaEnPuerta = await Entrega.findOne({
        where: { paqueteId, estado: 'en_puerta' },
        transaction,
      });
      if (!entregaEnPuerta) {
        const error = new Error('El conductor todavía no registró la llegada al domicilio.');
        error.status = 409;
        throw error;
      }

      await paquete.update({
        estado: 'incidencia',
        incidenciaCliente: detalle,
        fechaIncidencia: new Date(),
      }, { transaction });
    });
    return res.json({
      success: true,
      message: 'Reporte enviado. LOGIT revisará la incidencia y coordinará la devolución.',
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    return next(error);
  }
};
