const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Conductor = sequelize.define('Conductor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cedula: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  licencia: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  categoriaLicencia: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  vehiculoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo', 'vacaciones'),
    defaultValue: 'activo',
  },
  fechaRegistro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'conductores',
  timestamps: false,
});

module.exports = Conductor;