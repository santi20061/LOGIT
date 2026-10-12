const express = require('express');
const despachoController = require('../controllers/despachoController');

const router = express.Router();

router.get('/paquetes', despachoController.obtenerPaquetesPendientes);
router.post('/', despachoController.crearDespacho);

module.exports = router;
