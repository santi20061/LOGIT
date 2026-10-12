const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Paquete = sequelize.define('Paquete', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  numeroSeguimiento: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  peso: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  origen: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  destino: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  contenido: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'en_ruta', 'entregado', 'incidencia', 'devuelto'),
    defaultValue: 'pendiente',
  },
  rutaId: {
    type: DataTypes.INTEGER,
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
  incidenciaCliente: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fechaIncidencia: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fechaDevolucion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'paquetes',
  timestamps: false,
});

module.exports = Paquete;