const express = require('express');
const router = express.Router();
const paqueteController = require('../controllers/paqueteController');

router.get('/', paqueteController.obtenerTodos);
router.get('/:id', paqueteController.obtenerPorId);
router.post('/', paqueteController.crear);
router.put('/:id/estado', paqueteController.actualizarEstado);
router.put('/:id/ruta', paqueteController.asignarARuta);
router.delete('/:id', paqueteController.eliminar);

module.exports = router;