const { leerJSON, escribirJSON, obtenerSiguienteId } = require('../utils/fileHandler');

exports.obtenerTodos = (req, res) => {
  try {
    const entregas = leerJSON('entregas');
    const paquetes = leerJSON('paquetes');
    const conductores = leerJSON('conductores');

    const entregasEnriquecidas = entregas.map(e => {
      const paquete = paquetes.find(p => p.id === e.paqueteId);
      const conductor = conductores.find(c => c.id === e.conductorId);
      return {
        ...e,
        numeroSeguimiento: paquete?.numeroSeguimiento || 'N/A',
        conductorNombre: conductor?.nombre || 'N/A'
      };
    });

    res.json({ success: true, data: entregasEnriquecidas, total: entregas.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener entregas' });
  }
};

exports.obtenerPorId = (req, res) => {
  try {
    const entregas = leerJSON('entregas');
    const entrega = entregas.find(e => e.id === parseInt(req.params.id));
    if (!entrega) return res.status(404).json({ success: false, message: 'Entrega no encontrada' });
    res.json({ success: true, data: entrega });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener entrega' });
  }
};

exports.crear = (req, res) => {
  try {
    const { paqueteId, rutaId, conductorId, ubicacionActual, observaciones } = req.body;

    if (!paqueteId || !rutaId || !conductorId) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
    }

    const entregas = leerJSON('entregas');
    const nuevaEntrega = {
      id: obtenerSiguienteId(entregas),
      paqueteId: parseInt(paqueteId),
      rutaId: parseInt(rutaId),
      conductorId: parseInt(conductorId),
      estado: 'En tránsito',
      fechaCreacion: new Date().toISOString().split('T')[0],
      fechaEntrega: null,
      horaEntrega: null,
      firmaRecibido: null,
      observaciones: observaciones || '',
      ubicacionActual: ubicacionActual || ''
    };

    entregas.push(nuevaEntrega);
    escribirJSON('entregas', entregas);

    res.status(201).json({ success: true, message: 'Entrega registrada', data: nuevaEntrega });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear entrega' });
  }
};

exports.actualizarUbicacion = (req, res) => {
  try {
    const { id } = req.params;
    const { ubicacionActual } = req.body;

    const entregas = leerJSON('entregas');
    const index = entregas.findIndex(e => e.id === parseInt(id));

    if (index === -1) return res.status(404).json({ success: false, message: 'Entrega no encontrada' });

    entregas[index].ubicacionActual = ubicacionActual;
    escribirJSON('entregas', entregas);

    res.json({ success: true, message: 'Ubicación actualizada', data: entregas[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar ubicación' });
  }
};

exports.completarEntrega = (req, res) => {
  try {
    const { id } = req.params;
    const { firmaRecibido, observaciones } = req.body;

    const entregas = leerJSON('entregas');
    const index = entregas.findIndex(e => e.id === parseInt(id));

    if (index === -1) return res.status(404).json({ success: false, message: 'Entrega no encontrada' });

    entregas[index].estado = 'Entregado';
    entregas[index].fechaEntrega = new Date().toISOString().split('T')[0];
    entregas[index].horaEntrega = new Date().toTimeString().split(' ')[0];
    entregas[index].firmaRecibido = firmaRecibido || 'Sin firma digital';
    if (observaciones) entregas[index].observaciones = observaciones;

    // Actualizar el estado del paquete también
    const paquetes = leerJSON('paquetes');
    const paqueteIndex = paquetes.findIndex(p => p.id === entregas[index].paqueteId);
    if (paqueteIndex !== -1) {
      paquetes[paqueteIndex].estado = 'Entregado';
      paquetes[paqueteIndex].fechaEntrega = entregas[index].fechaEntrega;
    }

    escribirJSON('entregas', entregas);
    escribirJSON('paquetes', paquetes);

    res.json({ success: true, message: 'Entrega completada', data: entregas[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al completar entrega' });
  }
};

exports.eliminar = (req, res) => {
  try {
    let entregas = leerJSON('entregas');
    const exists = entregas.find(e => e.id === parseInt(req.params.id));

    if (!exists) return res.status(404).json({ success: false, message: 'Entrega no encontrada' });

    entregas = entregas.filter(e => e.id !== parseInt(req.params.id));
    escribirJSON('entregas', entregas);

    res.json({ success: true, message: 'Entrega eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar entrega' });
  }
};