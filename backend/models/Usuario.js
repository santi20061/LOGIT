const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rol: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'cliente',
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
  },
  conductorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
  },
  debeCambiarPassword: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'usuarios',
  timestamps: true,
});

module.exports = Usuario;
