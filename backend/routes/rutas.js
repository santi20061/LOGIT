const express = require('express');
const rutaController = require('../controllers/rutaController');

const router = express.Router();

router.get('/', rutaController.obtenerTodos);
router.get('/:id', rutaController.obtenerPorId);
router.put('/:id', rutaController.actualizar);
router.put('/:id/estado', rutaController.cambiarEstado);
router.delete('/:id', rutaController.eliminar);

module.exports = router;