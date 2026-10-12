const express = require('express');
const entregaController = require('../controllers/entregaController');

const router = express.Router();

router.get('/', entregaController.obtenerTodos);
router.get('/:id', entregaController.obtenerPorId);
router.post('/', entregaController.crear);
router.put('/:id', entregaController.actualizar);
router.put('/:id/ubicacion', entregaController.actualizarUbicacion);
router.put('/:id/llegada', entregaController.marcarLlegada);
router.put('/:id/completar', entregaController.marcarLlegada);
router.delete('/:id', entregaController.eliminar);

module.exports = router;