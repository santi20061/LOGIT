const { Paquete, Cliente, Ruta } = require('../models');
const { Op, Transaction } = require('sequelize');
const { sequelize } = require('../models');
const { obtenerMunicipioMeta } = require('../utils/municipiosMeta');

// Generar número de seguimiento único
const generarNumeroSeguimiento = async () => {
  const fecha = new Date();
  const aleatorio = Math.floor(Math.random() * 10000);
  return `PKG-${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${aleatorio}`;
};

exports.obtenerTodos = async (req, res) => {
  try {
    const paquetes = await Paquete.findAll({
      include: [
        { model: Cliente, attributes: ['nombre', 'email', 'telefono'] },
        { model: Ruta, attributes: ['nombre', 'estado'] }
      ],
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      total: paquetes.length,
      data: paquetes
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    if (isNaN(req.params.id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const paquete = await Paquete.findByPk(req.params.id, {
      include: [
        { model: Cliente },
        { model: Ruta }
      ]
    });

    if (!paquete) {
      return res.status(404).json({ success: false, error: 'Paquete no encontrado' });
    }

    res.json({ success: true, data: paquete });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { clienteId, peso, origen, destino, valor, contenido } = req.body;

    if (!clienteId || !peso || !origen || !destino || valor === undefined || valor === null) {
      return res.status(400).json({ success: false, error: 'Campos obligatorios faltantes' });
    }

    const origenMeta = obtenerMunicipioMeta(origen);
    const destinoMeta = obtenerMunicipioMeta(destino);
    if (!origenMeta || !destinoMeta) {
      return res.status(400).json({
        success: false,
        error: 'El origen y el destino deben ser municipios del departamento del Meta.',
      });
    }

    if (peso <= 0) {
      return res.status(400).json({ success: false, error: 'Peso debe ser mayor a 0' });
    }

    if (valor <= 0) {
      return res.status(400).json({ success: false, error: 'Valor debe ser mayor a 0' });
    }

    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
    }

    const numeroSeguimiento = await generarNumeroSeguimiento();

    const paquete = await Paquete.create({
      numeroSeguimiento,
      clienteId,
      peso,
      origen: origenMeta,
      destino: destinoMeta,
      valor,
      contenido: contenido ? contenido.trim() : null,
      estado: 'pendiente'
    });

    res.status(201).json({
      success: true,
      message: 'Paquete creado exitosamente',
      data: paquete
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    if (isNaN(req.params.id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const paquete = await sequelize.transaction({
      type: Transaction.TYPES.IMMEDIATE,
    }, async transaction => {
      const registro = await Paquete.findByPk(req.params.id, { transaction });
      if (!registro) {
        const error = new Error('Paquete no encontrado');
        error.status = 404;
        throw error;
      }
      if (registro.estado !== 'pendiente') {
        const error = new Error('Solo se pueden editar paquetes pendientes.');
        error.status = 409;
        throw error;
      }

      const cambios = {};
      for (const campo of ['peso', 'valor']) {
        if (req.body[campo] !== undefined) {
          const valor = Number(req.body[campo]);
          if (!Number.isFinite(valor) || valor <= 0) {
            const error = new Error(`${campo === 'peso' ? 'Peso' : 'Valor'} debe ser mayor a 0.`);
            error.status = 400;
            throw error;
          }
          cambios[campo] = valor;
        }
      }
      if (req.body.contenido !== undefined) {
        if (typeof req.body.contenido !== 'string' || req.body.contenido.length > 255) {
          const error = new Error('El contenido debe tener máximo 255 caracteres.');
          error.status = 400;
          throw error;
        }
        cambios.contenido = req.body.contenido.trim() || null;
      }
      if (Object.keys(cambios).length === 0) {
        const error = new Error('Indica al menos un dato para actualizar.');
        error.status = 400;
        throw error;
      }

      await registro.update(cambios, { transaction });
      return registro;
    });

    res.json({
      success: true,
      message: 'Paquete actualizado exitosamente',
      data: paquete
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.coordinarDevolucion = async (req, res, next) => {
  try {
    const paquete = await sequelize.transaction({
      type: Transaction.TYPES.IMMEDIATE,
    }, async transaction => {
      const registro = await Paquete.findByPk(req.params.id, { transaction });
      if (!registro) {
        const error = new Error('Paquete no encontrado.');
        error.status = 404;
        throw error;
      }
      if (registro.estado !== 'incidencia') {
        const error = new Error('Solo se puede coordinar la devolución de un paquete con incidencia reportada.');
        error.status = 409;
        throw error;
      }
      await registro.update({ estado: 'devuelto', fechaDevolucion: new Date() }, { transaction });
      return registro;
    });
    return res.json({
      success: true,
      message: 'Devolución coordinada y registrada.',
      data: paquete,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    return next(error);
  }
};

exports.eliminar = async (req, res) => {
  try {
    if (isNaN(req.params.id)) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }

    const paquete = await Paquete.findByPk(req.params.id);
    if (!paquete) {
      return res.status(404).json({ success: false, error: 'Paquete no encontrado' });
    }

    if (paquete.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        error: 'Solo se pueden eliminar paquetes en estado "pendiente"'
      });
    }

    await paquete.destroy();

    res.json({ success: true, message: 'Paquete eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.obtenerPorEstado = async (req, res) => {
  try {
    const { estado } = req.params;
    const estadosValidos = ['pendiente', 'en_ruta', 'entregado', 'incidencia', 'devuelto'];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: `Estado debe ser uno de: ${estadosValidos.join(', ')}`
      });
    }

    const paquetes = await Paquete.findAll({
      where: { estado },
      include: [{ model: Cliente, attributes: ['nombre'] }]
    });

    res.json({ success: true, total: paquetes.length, data: paquetes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};