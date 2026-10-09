const { leerJSON, escribirJSON, obtenerSiguienteId } = require('../utils/fileHandler');

exports.obtenerTodos = (req, res) => {
  try {
    const paquetes = leerJSON('paquetes');
    const clientes = leerJSON('clientes');

    const paquetesConCliente = paquetes.map(paquete => {
      const cliente = clientes.find(c => c.id === paquete.clienteId);
      return {
        ...paquete,
        clienteNombre: cliente?.nombre || 'N/A'
      };
    });

    res.json({
      success: true,
      data: paquetesConCliente,
      total: paquetes.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener paquetes' });
  }
};

exports.obtenerPorId = (req, res) => {
  try {
    const { id } = req.params;
    const paquetes = leerJSON('paquetes');
    const paquete = paquetes.find(p => p.id === parseInt(id));

    if (!paquete) {
      return res.status(404).json({ success: false, message: 'Paquete no encontrado' });
    }

    res.json({ success: true, data: paquete });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener paquete' });
  }
};

exports.crear = (req, res) => {
  try {
    const { clienteId, origen, destino, peso, contenido, valor, observaciones } = req.body;

    if (!clienteId || !origen || !destino || !peso || !valor) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
    }

    const paquetes = leerJSON('paquetes');
    const numeroSeguimiento = `PKG-${obtenerSiguienteId(paquetes)}-2026`;

    const nuevoPaquete = {
      id: obtenerSiguienteId(paquetes),
      numeroSeguimiento,
      clienteId: parseInt(clienteId),
      origen,
      destino,
      peso: parseFloat(peso),
      contenido: contenido || 'No especificado',
      valor: parseInt(valor),
      estado: 'Registrado',
      fechaRegistro: new Date().toISOString().split('T')[0],
      fechaEntrega: null,
      rutaId: null,
      observaciones: observaciones || ''
    };

    paquetes.push(nuevoPaquete);
    escribirJSON('paquetes', paquetes);

    res.status(201).json({ success: true, message: 'Paquete creado', data: nuevoPaquete });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear paquete' });
  }
};

exports.actualizarEstado = (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({ success: false, message: 'El estado es requerido' });
    }

    const paquetes = leerJSON('paquetes');
    const index = paquetes.findIndex(p => p.id === parseInt(id));

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Paquete no encontrado' });
    }

    paquetes[index].estado = estado;
    if (estado === 'Entregado') {
      paquetes[index].fechaEntrega = new Date().toISOString().split('T')[0];
    }

    escribirJSON('paquetes', paquetes);

    res.json({ success: true, message: 'Estado actualizado', data: paquetes[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar paquete' });
  }
};

exports.asignarARuta = (req, res) => {
  try {
    const { id } = req.params;
    const { rutaId } = req.body;

    if (!rutaId) {
      return res.status(400).json({ success: false, message: 'rutaId es requerido' });
    }

    const paquetes = leerJSON('paquetes');
    const index = paquetes.findIndex(p => p.id === parseInt(id));

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Paquete no encontrado' });
    }

    paquetes[index].rutaId = parseInt(rutaId);
    paquetes[index].estado = 'Asignado';

    escribirJSON('paquetes', paquetes);

    res.json({ success: true, message: 'Paquete asignado a ruta', data: paquetes[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al asignar paquete' });
  }
};

exports.eliminar = (req, res) => {
  try {
    const { id } = req.params;

    let paquetes = leerJSON('paquetes');
    const paqueteExiste = paquetes.find(p => p.id === parseInt(id));

    if (!paqueteExiste) {
      return res.status(404).json({ success: false, message: 'Paquete no encontrado' });
    }

    paquetes = paquetes.filter(p => p.id !== parseInt(id));
    escribirJSON('paquetes', paquetes);

    res.json({ success: true, message: 'Paquete eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar paquete' });
  }
};