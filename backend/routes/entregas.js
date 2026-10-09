const express = require('express');
const router = express.Router();
const entregaController = require('../controllers/entregaController');

router.get('/', entregaController.obtenerTodos);
router.get('/:id', entregaController.obtenerPorId);
router.post('/', entregaController.crear);
router.put('/:id/ubicacion', entregaController.actualizarUbicacion);
router.put('/:id/completar', entregaController.completarEntrega);
router.delete('/:id', entregaController.eliminar);

module.exports = router;