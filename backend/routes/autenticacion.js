const express = require('express');
const autenticacionController = require('../controllers/autenticacionController');
const { requerirAutenticacion } = require('../middleware/autenticacion');

const router = express.Router();

router.post('/login', autenticacionController.iniciarSesion);
router.get('/session', requerirAutenticacion, autenticacionController.obtenerSesion);
router.post('/change-password', requerirAutenticacion, autenticacionController.cambiarPassword);
router.post('/logout', autenticacionController.cerrarSesion);

module.exports = router;
