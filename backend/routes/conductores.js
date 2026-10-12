const express = require('express');
const conductorController = require('../controllers/conductorController');
const usuarioController = require('../controllers/usuarioController');

const router = express.Router();

router.get('/', conductorController.obtenerTodos);
router.get('/:id', conductorController.obtenerPorId);
router.post('/', conductorController.crear);
router.put('/:id', conductorController.actualizar);
router.put('/:id/estado', conductorController.cambiarEstado);
router.put('/:id/vehiculo', conductorController.asignarVehiculo);
router.post('/:id/acceso', usuarioController.generarAccesoConductor);
router.delete('/:id', conductorController.eliminar);

module.exports = router;