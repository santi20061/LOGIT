const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SesionUsuario = sequelize.define('SesionUsuario', {
  tokenHash: {
    type: DataTypes.STRING(64),
    primaryKey: true,
  },
  expiraEn: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'sesiones_usuario',
  timestamps: true,
});

module.exports = SesionUsuario;
