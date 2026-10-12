const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vehiculo = sequelize.define('Vehiculo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  placa: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  marca: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  modelo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  año: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  capacidad: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('disponible', 'en_uso', 'mantenimiento'),
    defaultValue: 'disponible',
  },
  conductorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fechaRegistro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'vehiculos',
  timestamps: false,
});

module.exports = Vehiculo;