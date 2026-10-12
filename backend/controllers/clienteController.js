const { Cliente, Paquete, SesionUsuario, Usuario, sequelize } = require('../models');
const { Op } = require('sequelize');

// Validar email
const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validar teléfono (10 dígitos)
const validarTelefono = (telefono) => {
  return /^\d{10}$/.test(telefono);
};

// GET - Obtener todos los clientes
exports.obtenerTodos = async (req, res) => {
  try {
    const clientes = await Cliente.findAll({
      include: [{
        model: Paquete,
        attributes: ['id', 'numeroSeguimiento', 'estado']
      }, {
        model: Usuario,
        as: 'Cuenta',
        attributes: ['rol']
      }],
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      total: clientes.length,
      data: clientes
        .map(cliente => {
          const data = cliente.toJSON();
          data.tieneAcceso = data.Cuenta?.rol === 'cliente';
          delete data.Cuenta;
          return data;
        })
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener clientes',
      details: error.message
    });
  }
};

// GET - Obtener un cliente por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID debe ser un número'
      });
    }

    const cliente = await Cliente.findByPk(id, {
      include: [{
        model: Paquete,
        attributes: ['id', 'numeroSeguimiento', 'peso', 'origen', 'destino', 'estado']
      }, {
        model: Usuario,
        as: 'Cuenta',
        attributes: ['rol']
      }]
    });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        ...cliente.toJSON(),
        tieneAcceso: cliente.Cuenta?.rol === 'cliente',
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener cliente',
      details: error.message
    });
  }
};

// POST - Crear nuevo cliente
exports.crear = async (req, res) => {
  try {
    const { nombre, telefono, email, ciudad, direccion } = req.body;

    if (!nombre || !telefono || !email || !ciudad || !direccion) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son obligatorios'
      });
    }

    if (nombre.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Nombre debe tener al menos 3 caracteres'
      });
    }

    if (!validarEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido'
      });
    }

    if (!validarTelefono(telefono)) {
      return res.status(400).json({
        success: false,
        error: 'Teléfono debe tener 10 dígitos'
      });
    }

    const cliente = await Cliente.create({
      nombre: nombre.trim(),
      telefono,
      email: email.toLowerCase(),
      ciudad: ciudad.trim(),
      direccion: direccion.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: cliente
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: 'Este email ya está registrado'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error al crear cliente',
      details: error.message
    });
  }
};

// PUT - Actualizar cliente
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, email, ciudad, direccion } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID debe ser un número'
      });
    }

    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    if (nombre && nombre.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Nombre debe tener al menos 3 caracteres'
      });
    }

    if (email && !validarEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido'
      });
    }

    if (telefono && !validarTelefono(telefono)) {
      return res.status(400).json({
        success: false,
        error: 'Teléfono debe tener 10 dígitos'
      });
    }

    const emailActualizado = email ? email.trim().toLowerCase() : cliente.email;
    await sequelize.transaction(async transaction => {
      const cuenta = await Usuario.findOne({
        where: { clienteId: cliente.id },
        transaction,
      });
      if (cuenta && emailActualizado !== cuenta.email) {
        const cuentaConMismoCorreo = await Usuario.findOne({
          where: { email: emailActualizado },
          transaction,
        });
        if (cuentaConMismoCorreo && cuentaConMismoCorreo.id !== cuenta.id) {
          const error = new Error('Este correo ya está asociado a otra cuenta.');
          error.status = 409;
          throw error;
        }
        await cuenta.update({
          email: emailActualizado,
          nombre: nombre ? nombre.trim() : cliente.nombre,
        }, { transaction });
      } else if (cuenta && nombre) {
        await cuenta.update({ nombre: nombre.trim() }, { transaction });
      }

      await cliente.update({
        nombre: nombre ? nombre.trim() : cliente.nombre,
        telefono: telefono || cliente.telefono,
        email: emailActualizado,
        ciudad: ciudad ? ciudad.trim() : cliente.ciudad,
        direccion: direccion ? direccion.trim() : cliente.direccion
      }, { transaction });
    });

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: cliente
    });
  } catch (error) {
    if (error.status === 409) {
      return res.status(409).json({ success: false, error: error.message });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: 'Este email ya está registrado'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error al actualizar cliente',
      details: error.message
    });
  }
};

// DELETE - Eliminar cliente
exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID debe ser un número'
      });
    }

    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    const paquetes = await Paquete.count({ where: { clienteId: id } });
    if (paquetes > 0) {
      return res.status(400).json({
        success: false,
        error: `No se puede eliminar cliente con ${paquetes} paquete(s) activo(s)`
      });
    }

    await sequelize.transaction(async transaction => {
      const cuenta = await Usuario.findOne({
        where: { clienteId: cliente.id },
        transaction,
      });
      if (cuenta) {
        await SesionUsuario.destroy({
          where: { usuarioId: cuenta.id },
          transaction,
        });
        await cuenta.destroy({ transaction });
      }
      await cliente.destroy({ transaction });
    });

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al eliminar cliente',
      details: error.message
    });
  }
};