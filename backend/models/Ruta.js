const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ruta = sequelize.define('Ruta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  conductorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  vehiculoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  horaInicio: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  horaFin: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('planeada', 'en_curso', 'completada', 'cancelada'),
    defaultValue: 'planeada',
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fechaCreacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'rutas',
  timestamps: false,
});

module.exports = Ruta;