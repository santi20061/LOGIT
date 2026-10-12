const express = require('express');
const cors = require('cors');
const path = require('path');
const autenticacionRoutes = require('./routes/autenticacion');
const clientePortalRoutes = require('./routes/portalCliente');
const conductorPortalRoutes = require('./routes/portalConductor');
const despachoRoutes = require('./routes/despacho');
const { MUNICIPIOS_META } = require('./utils/municipiosMeta');
const {
  ROLES,
  requerirAutenticacion,
  requerirPasswordActualizada,
  requerirRol,
} = require('./middleware/autenticacion');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ===== RUTAS API =====
// Ruta de prueba
app.get('/api/status', (req, res) => {
  res.json({
    status: 'API LOGIT funcionando',
    bd: 'SQLite',
    timestamp: new Date()
  });
});

app.get('/api/catalogos/municipios-meta', (req, res) => {
  res.json({ success: true, data: MUNICIPIOS_META });
});

app.use('/api/auth', autenticacionRoutes);

// Importar rutas
const clientesRoutes = require('./routes/clientes');
const paquetesRoutes = require('./routes/paquetes');
const vehiculosRoutes = require('./routes/vehiculos');
const conductoresRoutes = require('./routes/conductores');
const rutasRoutes = require('./routes/rutas');
const entregasRoutes = require('./routes/entregas');

// Registrar rutas API
const requerirAdmin = [
  requerirAutenticacion,
  requerirPasswordActualizada,
  requerirRol(ROLES.ADMIN),
];

app.use('/api/clientes', ...requerirAdmin, clientesRoutes);
app.use('/api/paquetes', ...requerirAdmin, paquetesRoutes);
app.use('/api/vehiculos', ...requerirAdmin, vehiculosRoutes);
app.use('/api/conductores', ...requerirAdmin, conductoresRoutes);
app.use('/api/rutas', ...requerirAdmin, rutasRoutes);
app.use('/api/despacho', ...requerirAdmin, despachoRoutes);
app.use('/api/entregas', ...requerirAdmin, entregasRoutes);
app.use(
  '/api/cliente',
  requerirAutenticacion,
  requerirPasswordActualizada,
  requerirRol(ROLES.CLIENTE),
  clientePortalRoutes
);
app.use(
  '/api/conductor',
  requerirAutenticacion,
  requerirPasswordActualizada,
  requerirRol(ROLES.CONDUCTOR),
  conductorPortalRoutes
);

console.log('✅ Rutas API registradas');

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'Ruta de API no encontrada' });
});

// ===== ARCHIVOS ESTÁTICOS =====
const frontendPath = path.join(__dirname, '../frontend/public');
app.use(express.static(frontendPath));

// ===== SPA FALLBACK =====
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ===== MANEJO DE ERRORES =====
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;