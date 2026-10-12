const { Entrega, Paquete, Ruta, Conductor } = require('../models');

exports.obtenerTodos = async (req, res) => {
  try {
    const entregas = await Entrega.findAll({
      include: [
        { model: Paquete, attributes: ['numeroSeguimiento', 'destino'] },
        { model: Ruta, attributes: ['nombre', 'estado'] },
        { model: Conductor, attributes: ['nombre'] }
      ],
      order: [['id', 'DESC']]
    });

    res.json({ success: true, total: entregas.length, data: entregas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  try {
    const entrega = await Entrega.findByPk(req.params.id, {
      include: [{ model: Paquete }, { model: Ruta }, { model: Conductor }]
    });

    if (!entrega) {
      return res.status(404).json({ success: false, error: 'Entrega no encontrada' });
    }

    res.json({ success: true, data: entrega });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.crear = async (req, res) => {
  return res.status(409).json({
    success: false,
    error: 'Las entregas se generan automáticamente al iniciar una ruta asignada desde Despacho.',
  });
};

exports.actualizar = async (req, res) => {
  try {
    const entrega = await Entrega.findByPk(req.params.id);
    if (!entrega) {
      return res.status(404).json({ success: false, error: 'Entrega no encontrada' });
    }

    if ('estado' in req.body || 'firmaRecibido' in req.body || 'fechaEntrega' in req.body) {
      return res.status(400).json({
        success: false,
        error: 'El administrador no puede confirmar la recepción del cliente.',
      });
    }

    const cambios = {};
    if (typeof req.body.ubicacionActual === 'string' && req.body.ubicacionActual.trim()) {
      cambios.ubicacionActual = req.body.ubicacionActual.trim();
    }
    if (typeof req.body.observaciones === 'string') {
      cambios.observaciones = req.body.observaciones.trim();
    }
    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ success: false, error: 'No hay cambios válidos para guardar.' });
    }
    await entrega.update(cambios);

    res.json({
      success: true,
      message: 'Entrega actualizada exitosamente',
      data: entrega
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.actualizarUbicacion = async (req, res) => {
  try {
    const { ubicacionActual } = req.body;

    if (!ubicacionActual) {
      return res.status(400).json({ success: false, error: 'Ubicación es requerida' });
    }

    const entrega = await Entrega.findByPk(req.params.id);
    if (!entrega) {
      return res.status(404).json({ success: false, error: 'Entrega no encontrada' });
    }

    await entrega.update({ ubicacionActual: ubicacionActual.trim() });

    res.json({
      success: true,
      message: 'Ubicación actualizada',
      data: entrega
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.marcarLlegada = async (req, res) => {
  try {
    const entrega = await Entrega.findByPk(req.params.id);
    if (!entrega) {
      return res.status(404).json({ success: false, error: 'Entrega no encontrada' });
    }
    if (entrega.estado !== 'en_transito') {
      return res.status(409).json({ success: false, error: 'Solo se puede registrar la llegada de una visita en tránsito.' });
    }
    const ruta = await Ruta.findByPk(entrega.rutaId);
    if (!ruta || ruta.estado !== 'en_curso') {
      return res.status(409).json({ success: false, error: 'La ruta de esta entrega no está activa.' });
    }
    await entrega.update({
      estado: 'en_puerta',
      ubicacionActual: entrega.ubicacionActual || 'En el domicilio de entrega',
    });

    res.json({
      success: true,
      message: 'Llegada registrada. El cliente debe confirmar la recepción desde su perfil.',
      data: entrega
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const entrega = await Entrega.findByPk(req.params.id);
    if (!entrega) {
      return res.status(404).json({ success: false, error: 'Entrega no encontrada' });
    }

    if (['entregado', 'rechazado'].includes(entrega.estado)) {
      return res.status(409).json({
        success: false,
        error: 'No se puede borrar el historial de una entrega completada o una visita fallida.',
      });
    }
    if (entrega.estado === 'en_transito' || entrega.estado === 'en_puerta') {
      return res.status(409).json({
        success: false,
        error: 'No se puede eliminar una entrega activa; registra su resultado desde la ruta.',
      });
    }

    await entrega.destroy();

    res.json({ success: true, message: 'Entrega eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};