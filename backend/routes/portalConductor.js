const express = require('express');
const portalConductorController = require('../controllers/portalConductorController');

const router = express.Router();

router.get('/ruta', portalConductorController.obtenerRutaActiva);
router.post('/ruta/iniciar', portalConductorController.iniciarRuta);
router.post('/entregas/:id/llegada', portalConductorController.marcarLlegada);
router.post('/entregas/:id/novedad', portalConductorController.reportarNovedad);
router.post('/ruta/finalizar', portalConductorController.finalizarRuta);

module.exports = router;
