const express = require('express');
const router = express.Router();
const vehiculoController = require('../controllers/vehiculoController');

router.get('/', vehiculoController.obtenerTodos);
router.get('/:id', vehiculoController.obtenerPorId);
router.post('/', vehiculoController.crear);
router.put('/:id/estado', vehiculoController.actualizarEstado);
router.delete('/:id', vehiculoController.eliminar);

module.exports = router;