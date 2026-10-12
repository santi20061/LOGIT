const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Entrega = sequelize.define('Entrega', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  numeroSeguimiento: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  paqueteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rutaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  conductorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  ubicacionActual: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('en_transito', 'en_puerta', 'entregado', 'rechazado'),
    defaultValue: 'en_transito',
  },
  firmaRecibido: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  motivoNovedad: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fechaNovedad: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fechaCreacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fechaEntrega: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'entregas',
  timestamps: false,
});

module.exports = Entrega;