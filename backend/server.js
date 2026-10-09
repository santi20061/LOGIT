require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const server = app.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════╗
║     🚀 SERVIDOR LOGIT INICIADO 🚀      ║
╠════════════════════════════════════════╣
║                                        ║
║  Servidor corriendo en:                ║
║  http://${HOST}:${PORT}                 ║
║                                        ║
║  Ambiente: ${process.env.NODE_ENV || 'development'}               ║
║                                        ║
║  Presiona Ctrl+C para detener          ║
║                                        ║
╚════════════════════════════════════════╝
  `);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  process.exit(1);
});