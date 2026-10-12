const express = require('express');
const portalClienteController = require('../controllers/portalClienteController');

const router = express.Router();

router.get('/perfil', portalClienteController.obtenerPerfil);
router.put('/perfil', portalClienteController.actualizarPerfil);
router.get('/pedidos', portalClienteController.obtenerPedidos);
router.post('/pedidos/:id/confirmar-recepcion', portalClienteController.confirmarRecepcion);
router.post('/pedidos/:id/reportar-dano', portalClienteController.reportarDano);

module.exports = router;
