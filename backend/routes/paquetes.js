const express = require('express');
const paqueteController = require('../controllers/paqueteController');

const router = express.Router();

router.get('/', paqueteController.obtenerTodos);
router.get('/:id', paqueteController.obtenerPorId);
router.post('/', paqueteController.crear);
router.put('/:id', paqueteController.actualizar);
router.put('/:id/coordinar-devolucion', paqueteController.coordinarDevolucion);
router.delete('/:id', paqueteController.eliminar);

module.exports = router;