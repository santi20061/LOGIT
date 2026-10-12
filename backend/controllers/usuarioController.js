const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Cliente, Conductor, SesionUsuario, Usuario, sequelize } = require('../models');

async function generarAcceso(req, res, entidad, rol) {
  const entidadId = Number(req.params.id);
  if (!Number.isSafeInteger(entidadId) || entidadId <= 0) {
    return res.status(400).json({ success: false, error: 'ID inválido.' });
  }

  try {
    const registro = await entidad.findByPk(entidadId);
    if (!registro) {
      return res.status(404).json({ success: false, error: 'Registro no encontrado.' });
    }
    if (!registro.email || !registro.email.trim()) {
      return res.status(400).json({ success: false, error: 'El registro debe tener un correo válido.' });
    }

    const passwordTemporal = crypto.randomBytes(18).toString('hex');
    const passwordHash = await bcrypt.hash(passwordTemporal, 12);
    const cuentaExistente = await sequelize.transaction(async transaction => {
      const llave = rol === 'cliente' ? 'clienteId' : 'conductorId';
      const cuenta = await Usuario.findOne({ where: { [llave]: registro.id }, transaction });
      const mismaCuentaPorCorreo = await Usuario.findOne({
        where: { email: registro.email.trim().toLowerCase() },
        transaction,
      });
      if (mismaCuentaPorCorreo && (!cuenta || mismaCuentaPorCorreo.id !== cuenta.id)) {
        const error = new Error('El correo ya está asociado a otra cuenta.');
        error.status = 409;
        throw error;
      }

      if (cuenta) {
        if (cuenta.rol !== rol) {
          const error = new Error('La cuenta vinculada tiene un rol distinto.');
          error.status = 409;
          throw error;
        }
        await cuenta.update({
          email: registro.email.trim().toLowerCase(),
          nombre: registro.nombre,
          passwordHash,
          debeCambiarPassword: true,
        }, { transaction });
        await SesionUsuario.destroy({ where: { usuarioId: cuenta.id }, transaction });
        return true;
      }

      await Usuario.create({
        email: registro.email.trim().toLowerCase(),
        nombre: registro.nombre,
        passwordHash,
        rol,
        ...(rol === 'cliente' ? { clienteId: registro.id } : { conductorId: registro.id }),
        debeCambiarPassword: true,
      }, { transaction });
      return false;
    });

    return res.status(cuentaExistente ? 200 : 201).json({
      success: true,
      message: cuentaExistente ? 'Acceso restablecido.' : 'Acceso creado.',
      data: { email: registro.email.trim().toLowerCase(), passwordTemporal },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
}

exports.generarAccesoCliente = async (req, res, next) => {
  const clienteId = Number(req.params.id);
  if (!Number.isSafeInteger(clienteId) || clienteId <= 0) {
    return res.status(400).json({ success: false, error: 'ID de cliente inválido.' });
  }

  try {
    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado.' });
    }

    const passwordTemporal = crypto.randomBytes(18).toString('hex');
    const passwordHash = await bcrypt.hash(passwordTemporal, 12);
    let cuentaExistente = false;

    await sequelize.transaction(async transaction => {
      const cuenta = await Usuario.findOne({
        where: { clienteId: cliente.id },
        transaction,
      });
      const cuentaConMismoCorreo = await Usuario.findOne({
        where: { email: cliente.email },
        transaction,
      });

      if (cuentaConMismoCorreo && (!cuenta || cuentaConMismoCorreo.id !== cuenta.id)) {
        const error = new Error('El correo del cliente ya está asociado a otra cuenta.');
        error.status = 409;
        throw error;
      }

      if (cuenta) {
        cuentaExistente = true;
        if (cuenta.rol !== 'cliente') {
          const error = new Error('La cuenta vinculada no tiene rol de cliente.');
          error.status = 409;
          throw error;
        }
        await cuenta.update({
          email: cliente.email,
          nombre: cliente.nombre,
          passwordHash,
          debeCambiarPassword: true,
        }, { transaction });
        await SesionUsuario.destroy({
          where: { usuarioId: cuenta.id },
          transaction,
        });
      } else {
        await Usuario.create({
          email: cliente.email,
          nombre: cliente.nombre,
          passwordHash,
          rol: 'cliente',
          clienteId: cliente.id,
          debeCambiarPassword: true,
        }, { transaction });
      }
    });

    return res.status(cuentaExistente ? 200 : 201).json({
      success: true,
      message: cuentaExistente
        ? 'Contraseña temporal restablecida. Entrégala al cliente de forma privada; no se podrá volver a consultar.'
        : 'Acceso creado. Entrega la contraseña al cliente de forma privada; no se podrá volver a consultar.',
      data: {
        email: cliente.email,
        passwordTemporal,
      },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    return next(error);
  }
};

exports.generarAccesoConductor = (req, res) => generarAcceso(req, res, Conductor, 'conductor');
