const { leerJSON, escribirJSON, obtenerSiguienteId } = require('../utils/fileHandler');

// Obtener todos los clientes
exports.obtenerTodos = (req, res) => {
  try {
    const clientes = leerJSON('clientes');
    res.json({
      success: true,
      data: clientes,
      total: clientes.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener clientes' });
  }
};

// Obtener cliente por ID
exports.obtenerPorId = (req, res) => {
  try {
    const { id } = req.params;
    const clientes = leerJSON('clientes');
    const cliente = clientes.find(c => c.id === parseInt(id));

    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    res.json({ success: true, data: cliente });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener cliente' });
  }
};

// Crear nuevo cliente
exports.crear = (req, res) => {
  try {
    const { nombre, telefono, email, direccion, ciudad } = req.body;

    if (!nombre || !telefono || !email || !direccion || !ciudad) {
      return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
    }

    const clientes = leerJSON('clientes');
    const nuevoCliente = {
      id: obtenerSiguienteId(clientes),
      nombre,
      telefono,
      email,
      direccion,
      ciudad,
      fechaRegistro: new Date().toISOString().split('T')[0]
    };

    clientes.push(nuevoCliente);
    escribirJSON('clientes', clientes);

    res.status(201).json({ success: true, message: 'Cliente creado', data: nuevoCliente });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear cliente' });
  }
};

// Actualizar cliente
exports.actualizar = (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, email, direccion, ciudad } = req.body;

    const clientes = leerJSON('clientes');
    const index = clientes.findIndex(c => c.id === parseInt(id));

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    if (nombre) clientes[index].nombre = nombre;
    if (telefono) clientes[index].telefono = telefono;
    if (email) clientes[index].email = email;
    if (direccion) clientes[index].direccion = direccion;
    if (ciudad) clientes[index].ciudad = ciudad;

    escribirJSON('clientes', clientes);

    res.json({ success: true, message: 'Cliente actualizado', data: clientes[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar cliente' });
  }
};

// Eliminar cliente
exports.eliminar = (req, res) => {
  try {
    const { id } = req.params;

    let clientes = leerJSON('clientes');
    const clienteExiste = clientes.find(c => c.id === parseInt(id));

    if (!clienteExiste) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    clientes = clientes.filter(c => c.id !== parseInt(id));
    escribirJSON('clientes', clientes);

    res.json({ success: true, message: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar cliente' });
  }
};