const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { SesionUsuario, Usuario } = require('../models');
const {
  NOMBRE_COOKIE,
  hashToken,
  opcionesCookie,
  obtenerToken,
  borrarCookie,
} = require('../middleware/autenticacion');

const DURACION_SESION_MS = 8 * 60 * 60 * 1000;

exports.iniciarSesion = async (req, res, next) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Ingresa tu correo y contraseña.' });
    }

    const usuario = await Usuario.findOne({ where: { email } });
    const credencialesValidas = usuario
      ? await bcrypt.compare(password, usuario.passwordHash)
      : false;

    if (!credencialesValidas) {
      return res.status(401).json({ success: false, error: 'Correo o contraseña incorrectos.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiraEn = new Date(Date.now() + DURACION_SESION_MS);

    await SesionUsuario.destroy({
      where: { expiraEn: { [Op.lte]: new Date() } },
    });
    await SesionUsuario.create({
      tokenHash: hashToken(token),
      usuarioId: usuario.id,
      expiraEn,
    });

    res.cookie(NOMBRE_COOKIE, token, opcionesCookie());
    return res.json({
      success: true,
      data: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        clienteId: usuario.clienteId,
        conductorId: usuario.conductorId,
        debeCambiarPassword: usuario.debeCambiarPassword,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.obtenerSesion = async (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.usuario.id,
      email: req.usuario.email,
      nombre: req.usuario.nombre,
      rol: req.usuario.rol,
      clienteId: req.usuario.clienteId,
      conductorId: req.usuario.conductorId,
      debeCambiarPassword: req.usuario.debeCambiarPassword,
    },
  });
};

exports.cambiarPassword = async (req, res, next) => {
  try {
    const { password, confirmarPassword } = req.body;
    if (typeof password !== 'string' || password.length < 12) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 12 caracteres.',
      });
    }
    if (password !== confirmarPassword) {
      return res.status(400).json({ success: false, error: 'Las contraseñas no coinciden.' });
    }

    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) {
      return res.status(401).json({ success: false, error: 'La cuenta ya no está disponible.' });
    }
    if (!usuario.debeCambiarPassword) {
      const passwordActual = typeof req.body.passwordActual === 'string' ? req.body.passwordActual : '';
      if (!passwordActual || !(await bcrypt.compare(passwordActual, usuario.passwordHash))) {
        return res.status(401).json({ success: false, error: 'La contraseña actual es incorrecta.' });
      }
    }
    if (await bcrypt.compare(password, usuario.passwordHash)) {
      return res.status(400).json({ success: false, error: 'Elige una contraseña diferente a la actual.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await usuario.update({ passwordHash, debeCambiarPassword: false });
    await SesionUsuario.destroy({
      where: {
        usuarioId: usuario.id,
        tokenHash: { [Op.ne]: req.sesionTokenHash },
      },
    });

    return res.json({
      success: true,
      data: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        clienteId: usuario.clienteId,
        conductorId: usuario.conductorId,
        debeCambiarPassword: false,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.cerrarSesion = async (req, res, next) => {
  try {
    const token = obtenerToken(req);
    if (token) {
      await SesionUsuario.destroy({ where: { tokenHash: hashToken(token) } });
    }
    borrarCookie(res);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};
