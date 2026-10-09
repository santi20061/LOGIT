const { leerJSON, escribirJSON, obtenerSiguienteId } = require('../utils/fileHandler');

exports.obtenerTodos = (req, res) => {
  try {
    const rutas = leerJSON('rutas');
    const conductores = leerJSON('conductores');
    const vehiculos = leerJSON('vehiculos');

    const rutasEnriquecidas = rutas.map(r => {
      const conductor = conductores.find(c => c.id === r.conductorId);
      const vehiculo = vehiculos.find(v => v.id === r.vehiculoId);
      return {
        ...r,
        conductorNombre: conductor?.nombre || 'N/A',
        vehiculoPlaca: vehiculo?.placa || 'N/A'
      };
    });

    res.json({ success: true, data: rutasEnriquecidas, total: rutas.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener rutas' });
  }
};

exports.obtenerPorId = (req, res) => {
  try {
    const rutas = leerJSON('rutas');
    const ruta = rutas.find(r => r.id === parseInt(req.params.id));
    if (!ruta) return res.status(404).json({ success: false, message: 'Ruta no encontrada' });
    res.json({ success: true, data: ruta });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener ruta' });
  }
};

exports.crear = (req, res) => {
  try {
    const { nombre, descripcion, conductorId, vehiculoId, zonas, horaInicio } = req.body;

    if (!nombre || !conductorId || !vehiculoId) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
    }

    const rutas = leerJSON('rutas');
    const nuevaRuta = {
      id: obtenerSiguienteId(rutas),
      nombre,
      descripcion: descripcion || '',
      conductorId: parseInt(conductorId),
      vehiculoId: parseInt(vehiculoId),
      estado: 'Planificada',
      fechaCreacion: new Date().toISOString().split('T')[0],
      horaInicio: horaInicio || '08:00',
      horaFin: null,
      paquetesAsignados: [],
      zonas: zonas || []
    };

    rutas.push(nuevaRuta);
    escribirJSON('rutas', rutas);

    res.status(201).json({ success: true, message: 'Ruta creada', data: nuevaRuta });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear ruta' });
  }
};

exports.actualizarEstado = (req, res) => {
  try {
    const { id } = req.params;
    const { estado, horaFin } = req.body;

    const rutas = leerJSON('rutas');
    const index = rutas.findIndex(r => r.id === parseInt(id));

    if (index === -1) return res.status(404).json({ success: false, message: 'Ruta no encontrada' });

    rutas[index].estado = estado;
    if (horaFin) rutas[index].horaFin = horaFin;

    escribirJSON('rutas', rutas);

    res.json({ success: true, message: 'Estado actualizado', data: rutas[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar ruta' });
  }
};

exports.asignarPaquete = (req, res) => {
  try {
    const { id } = req.params;
    const { paqueteId } = req.body;

    const rutas = leerJSON('rutas');
    const index = rutas.findIndex(r => r.id === parseInt(id));

    if (index === -1) return res.status(404).json({ success: false, message: 'Ruta no encontrada' });

    if (!rutas[index].paquetesAsignados.includes(parseInt(paqueteId))) {
      rutas[index].paquetesAsignados.push(parseInt(paqueteId));
    }

    escribirJSON('rutas', rutas);

    res.json({ success: true, message: 'Paquete asignado a ruta', data: rutas[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al asignar paquete' });
  }
};

exports.iniciarRuta = (req, res) => {
  try {
    const { id } = req.params;

    const rutas = leerJSON('rutas');
    const index = rutas.findIndex(r => r.id === parseInt(id));

    if (index === -1) return res.status(404).json({ success: false, message: 'Ruta no encontrada' });

    rutas[index].estado = 'En progreso';
    escribirJSON('rutas', rutas);

    res.json({ success: true, message: 'Ruta iniciada', data: rutas[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al iniciar ruta' });
  }
};

exports.eliminar = (req, res) => {
  try {
    let rutas = leerJSON('rutas');
    const exists = rutas.find(r => r.id === parseInt(req.params.id));

    if (!exists) return res.status(404).json({ success: false, message: 'Ruta no encontrada' });

    rutas = rutas.filter(r => r.id !== parseInt(req.params.id));
    escribirJSON('rutas', rutas);

    res.json({ success: true, message: 'Ruta eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar ruta' });
  }
};