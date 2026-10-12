const { sequelize } = require('./models');

// Sincronizar todos los modelos con la BD
async function initDB() {
  try {
    await sequelize.sync({ force: false }); // force: false = no borra datos existentes
    console.log('✅ Base de datos sincronizada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sincronizando BD:', error);
    process.exit(1);
  }
}

initDB();