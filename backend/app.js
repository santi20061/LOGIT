const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Importar controllers
const clienteController = require('./controllers/clienteController');
const paqueteController = require('./controllers/paqueteController');
const vehiculoController = require('./controllers/vehiculoController');
const conductorController = require('./controllers/conductorController');
const rutaController = require('./controllers/rutaController');
const entregaController = require('./controllers/entregaController');

// ==================== RUTAS DE CLIENTES ====================
app.get('/api/clientes', clienteController.obtenerTodos);
app.get('/api/clientes/:id', clienteController.obtenerPorId);
app.post('/api/clientes', clienteController.crear);
app.put('/api/clientes/:id', clienteController.actualizar);
app.delete('/api/clientes/:id', clienteController.eliminar);

// ==================== RUTAS DE PAQUETES ====================
app.get('/api/paquetes', paqueteController.obtenerTodos);
app.get('/api/paquetes/:id', paqueteController.obtenerPorId);
app.post('/api/paquetes', paqueteController.crear);
app.put('/api/paquetes/:id/estado', paqueteController.actualizarEstado);
app.put('/api/paquetes/:id/ruta', paqueteController.asignarARuta);
app.delete('/api/paquetes/:id', paqueteController.eliminar);

// ==================== RUTAS DE VEHÍCULOS ====================
app.get('/api/vehiculos', vehiculoController.obtenerTodos);
app.get('/api/vehiculos/:id', vehiculoController.obtenerPorId);
app.post('/api/vehiculos', vehiculoController.crear);
app.put('/api/vehiculos/:id/estado', vehiculoController.actualizarEstado);
app.delete('/api/vehiculos/:id', vehiculoController.eliminar);

// ==================== RUTAS DE CONDUCTORES ====================
app.get('/api/conductores', conductorController.obtenerTodos);
app.get('/api/conductores/:id', conductorController.obtenerPorId);
app.post('/api/conductores', conductorController.crear);
app.put('/api/conductores/:id/estado', conductorController.actualizarEstado);
app.put('/api/conductores/:id/vehiculo', conductorController.asignarVehiculo);
app.delete('/api/conductores/:id', conductorController.eliminar);

// ==================== RUTAS DE RUTAS ====================
app.get('/api/rutas', rutaController.obtenerTodos);
app.get('/api/rutas/:id', rutaController.obtenerPorId);
app.post('/api/rutas', rutaController.crear);
app.put('/api/rutas/:id/estado', rutaController.actualizarEstado);
app.put('/api/rutas/:id/paquete', rutaController.asignarPaquete);
app.put('/api/rutas/:id/iniciar', rutaController.iniciarRuta);
app.delete('/api/rutas/:id', rutaController.eliminar);

// ==================== RUTAS DE ENTREGAS ====================
app.get('/api/entregas', entregaController.obtenerTodos);
app.get('/api/entregas/:id', entregaController.obtenerPorId);
app.post('/api/entregas', entregaController.crear);
app.put('/api/entregas/:id/ubicacion', entregaController.actualizarUbicacion);
app.put('/api/entregas/:id/completar', entregaController.completarEntrega);
app.delete('/api/entregas/:id', entregaController.eliminar);

// ==================== RUTAS GENERALES ====================
// Ruta raíz - Servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// Ruta para any other path - Servir index.html (para SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ==================== MANEJO DE ERRORES ====================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;