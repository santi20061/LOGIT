const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Crear carpeta data si no existe
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Carpeta /data creada');
}

// Configurar Sequelize con SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || path.join(dataDir, 'logit.db'),
  logging: false,
});

module.exports = sequelize;