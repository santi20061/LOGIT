const sequelize = require('../config/database');
const Cliente = require('./Cliente');
const Paquete = require('./Paquete');
const Vehiculo = require('./Vehiculo');
const Conductor = require('./Conductor');
const Ruta = require('./Ruta');
const Entrega = require('./Entrega');
const Usuario = require('./Usuario');
const SesionUsuario = require('./SesionUsuario');

// Definir relaciones entre modelos
// Un cliente tiene muchos paquetes
Cliente.hasMany(Paquete, { foreignKey: 'clienteId' });
Paquete.belongsTo(Cliente, { foreignKey: 'clienteId' });

// Un paquete pertenece a una ruta
Ruta.hasMany(Paquete, { foreignKey: 'rutaId' });
Paquete.belongsTo(Ruta, { foreignKey: 'rutaId' });

// Una ruta tiene un conductor
Conductor.hasMany(Ruta, { foreignKey: 'conductorId' });
Ruta.belongsTo(Conductor, { foreignKey: 'conductorId' });

// Una ruta tiene un vehículo
Vehiculo.hasMany(Ruta, { foreignKey: 'vehiculoId' });
Ruta.belongsTo(Vehiculo, { foreignKey: 'vehiculoId' });

// Un conductor tiene un vehículo
Conductor.hasOne(Vehiculo, { foreignKey: 'conductorId' });
Vehiculo.belongsTo(Conductor, { foreignKey: 'conductorId' });

// Una entrega tiene un paquete
Paquete.hasMany(Entrega, { foreignKey: 'paqueteId' });
Entrega.belongsTo(Paquete, { foreignKey: 'paqueteId' });

// Una entrega tiene una ruta
Ruta.hasMany(Entrega, { foreignKey: 'rutaId' });
Entrega.belongsTo(Ruta, { foreignKey: 'rutaId' });

// Una entrega tiene un conductor
Conductor.hasMany(Entrega, { foreignKey: 'conductorId' });
Entrega.belongsTo(Conductor, { foreignKey: 'conductorId' });

Usuario.hasMany(SesionUsuario, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });
SesionUsuario.belongsTo(Usuario, { foreignKey: 'usuarioId' });
Cliente.hasOne(Usuario, { as: 'Cuenta', foreignKey: 'clienteId' });
Usuario.belongsTo(Cliente, { as: 'Cliente', foreignKey: 'clienteId' });
Conductor.hasOne(Usuario, { as: 'Cuenta', foreignKey: 'conductorId' });
Usuario.belongsTo(Conductor, { as: 'Conductor', foreignKey: 'conductorId' });

module.exports = {
  sequelize,
  Cliente,
  Paquete,
  Vehiculo,
  Conductor,
  Ruta,
  Entrega,
  Usuario,
  SesionUsuario,
};