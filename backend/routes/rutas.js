const express = require('express');
const router = express.Router();
const rutaController = require('../controllers/rutaController');

router.get('/', rutaController.obtenerTodos);
router.get('/:id', rutaController.obtenerPorId);
router.post('/', rutaController.crear);
router.put('/:id/estado', rutaController.actualizarEstado);
router.put('/:id/paquete', rutaController.asignarPaquete);
router.put('/:id/iniciar', rutaController.iniciarRuta);
router.delete('/:id', rutaController.eliminar);

module.exports = router;