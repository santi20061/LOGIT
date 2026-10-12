const crypto = require('crypto');
const { Op } = require('sequelize');
const { SesionUsuario, Usuario } = require('../models');

const NOMBRE_COOKIE = 'logit_session';
const ROLES = Object.freeze({
  ADMIN: 'admin',
  CLIENTE: 'cliente',
  CONDUCTOR: 'conductor',
});

function obtenerToken(req) {
  const cookies = (req.headers.cookie || '').split(';');
  const cookie = cookies.find(parte => parte.trim().startsWith(`${NOMBRE_COOKIE}=`));
  if (!cookie) return null;

  const valor = cookie.slice(cookie.indexOf('=') + 1).trim();
  return /^[a-f0-9]{64}$/i.test(valor) ? valor : null;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function opcionesCookie() {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000,
  };
}

function borrarCookie(res) {
  const { maxAge, ...opciones } = opcionesCookie();
  res.clearCookie(NOMBRE_COOKIE, opciones);
}

async function requerirAutenticacion(req, res, next) {
  try {
    const token = obtenerToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Debes iniciar sesión.' });
    }

    const sesion = await SesionUsuario.findOne({
      where: {
        tokenHash: hashToken(token),
        expiraEn: { [Op.gt]: new Date() },
      },
      include: [{
        model: Usuario,
        attributes: ['id', 'email', 'nombre', 'rol', 'clienteId', 'conductorId', 'debeCambiarPassword'],
      }],
    });

    if (!sesion || !sesion.Usuario) {
      borrarCookie(res);
      return res.status(401).json({ success: false, error: 'Tu sesión expiró. Inicia sesión nuevamente.' });
    }

    req.usuario = sesion.Usuario;
    req.sesionTokenHash = sesion.tokenHash;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requerirRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para acceder a este recurso.' });
    }
    return next();
  };
}

function requerirPasswordActualizada(req, res, next) {
  if (req.usuario?.debeCambiarPassword) {
    return res.status(403).json({
      success: false,
      error: 'Debes cambiar tu contraseña temporal antes de continuar.',
      code: 'PASSWORD_CHANGE_REQUIRED',
    });
  }
  return next();
}

module.exports = {
  NOMBRE_COOKIE,
  ROLES,
  hashToken,
  opcionesCookie,
  obtenerToken,
  borrarCookie,
  requerirAutenticacion,
  requerirRol,
  requerirPasswordActualizada,
};
