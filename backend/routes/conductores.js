const express = require('express');
const router = express.Router();
const conductorController = require('../controllers/conductorController');

router.get('/', conductorController.obtenerTodos);
router.get('/:id', conductorController.obtenerPorId);
router.post('/', conductorController.crear);
router.put('/:id/estado', conductorController.actualizarEstado);
router.put('/:id/vehiculo', conductorController.asignarVehiculo);
router.delete('/:id', conductorController.eliminar);

module.exports = router;