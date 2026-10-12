const express = require('express');
const vehiculoController = require('../controllers/vehiculoController');

const router = express.Router();

router.get('/', vehiculoController.obtenerTodos);
router.get('/:id', vehiculoController.obtenerPorId);
router.post('/', vehiculoController.crear);
router.put('/:id', vehiculoController.actualizar);
router.put('/:id/estado', vehiculoController.cambiarEstado);
router.delete('/:id', vehiculoController.eliminar);

module.exports = router;