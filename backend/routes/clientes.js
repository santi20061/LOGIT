const express = require('express');
const clienteController = require('../controllers/clienteController');
const usuarioController = require('../controllers/usuarioController');

const router = express.Router();

router.get('/', clienteController.obtenerTodos);
router.get('/:id', clienteController.obtenerPorId);
router.post('/', clienteController.crear);
router.post('/:id/acceso', usuarioController.generarAccesoCliente);
router.put('/:id', clienteController.actualizar);
router.delete('/:id', clienteController.eliminar);

module.exports = router;