require('dotenv').config();

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const {
  sequelize,
  Cliente,
  Vehiculo,
  Conductor,
  Ruta,
  Paquete,
  Entrega,
  Usuario,
  SesionUsuario,
} = require('./models');
const actualizarEsquemaPortalCliente = require('./migrations/actualizarEsquemaPortalCliente');
const { MUNICIPIOS_META } = require('./utils/municipiosMeta');

async function crearRespaldo() {
  const rutaBase = sequelize.options.storage;
  if (!rutaBase || rutaBase === ':memory:' || !fs.existsSync(rutaBase)) {
    return null;
  }

  const fecha = new Date().toISOString().replace(/[:.]/g, '-');
  const rutaRespaldo = `${rutaBase}.backup-${fecha}.sqlite`;
  const baseOrigen = new sqlite3.Database(rutaBase, sqlite3.OPEN_READONLY);

  await new Promise((resolve, reject) => {
    const respaldo = baseOrigen.backup(rutaRespaldo);
    respaldo.step(-1, (error, terminado) => {
      if (error || !terminado) {
        respaldo.finish(() => {
          baseOrigen.close(() => {
            reject(error || new Error('No se completó el respaldo de SQLite.'));
          });
        });
        return;
      }

      respaldo.finish(errorAlCerrarRespaldo => {
        baseOrigen.close(errorAlCerrarBase => {
          if (errorAlCerrarRespaldo) {
            reject(errorAlCerrarRespaldo);
          } else if (errorAlCerrarBase) {
            reject(errorAlCerrarBase);
          } else {
            resolve();
          }
        });
      });
    });
  });

  return rutaRespaldo;
}

async function limpiarDatosOperativos(transaction) {
  const usuariosCliente = await Usuario.findAll({
    attributes: ['id'],
    where: { rol: ['cliente', 'conductor'] },
    transaction,
  });
  const idsUsuarioCliente = usuariosCliente.map(usuario => usuario.id);

  if (idsUsuarioCliente.length > 0) {
    await SesionUsuario.destroy({
      where: { usuarioId: idsUsuarioCliente },
      transaction,
    });
    await Usuario.destroy({
      where: { id: idsUsuarioCliente },
      transaction,
    });
  }

  await Entrega.destroy({ where: {}, transaction });
  await Paquete.destroy({ where: {}, transaction });
  await Ruta.destroy({ where: {}, transaction });
  await Cliente.destroy({ where: {}, transaction });
  await Conductor.destroy({ where: {}, transaction });
  await Vehiculo.destroy({ where: {}, transaction });
}

async function guardarPorClave(Model, where, defaults, transaction) {
  const [registro] = await Model.findOrCreate({ where, defaults, transaction });
  await registro.update(defaults, { transaction });
  return registro;
}

async function seed() {
  try {
    const reemplazarDatos = process.argv.includes('--reset');
    console.log('🌱 Preparando datos de demostración local del Meta...');
    await sequelize.sync({ alter: false });
    await actualizarEsquemaPortalCliente();
    if (reemplazarDatos) {
      const rutaRespaldo = await crearRespaldo();
      if (rutaRespaldo) {
        console.log(`🛟 Respaldo SQLite creado antes del reemplazo: ${rutaRespaldo}`);
      } else {
        console.log('ℹ️ No había una base SQLite previa para respaldar.');
      }
    }

    const clientesBase = [
      ['Juan Pérez', '3001234567', 'juan@email.com', 'Villavicencio', 'Calle 1 #45'],
      ['María García', '3104567890', 'maria@email.com', 'Acacías', 'Carrera 2 #67'],
      ['Carlos López', '3209876543', 'carlos@email.com', 'Granada', 'Calle 50 #12-34'],
      ['Sandra Rodríguez', '3153456789', 'sandra@email.com', 'Puerto López', 'Calle 5 #10-20'],
      ['Pedro Martínez', '3167890123', 'pedro@email.com', 'Restrepo', 'Carrera 10 #25-40'],
      ['Laura Gómez', '3178901234', 'laura@email.com', 'Villavicencio', 'Calle 30 #8-15'],
      ['Diego Ramírez', '3189012345', 'diego@email.com', 'Acacías', 'Carrera 15 #20-30'],
      ['Claudia Soto', '3190123456', 'claudia@email.com', 'Granada', 'Calle 72 #5-10'],
      ['Francisco Díaz', '3201234567', 'francisco@email.com', 'Cumaral', 'Calle 10 #15-25'],
      ['Elena Vargas', '3212345678', 'elena@email.com', 'Villavicencio', 'Carrera 20 #30-40'],
    ];
    const vehiculosBase = [
      { placa: 'ABC-123', marca: 'Toyota', modelo: 'Hilux', año: 2020, capacidad: '1000 kg' },
      { placa: 'DEF-456', marca: 'Nissan', modelo: 'Frontier', año: 2019, capacidad: '950 kg' },
      { placa: 'GHI-789', marca: 'Chevrolet', modelo: 'NPR', año: 2021, capacidad: '1200 kg' },
      { placa: 'JKL-012', marca: 'Ford', modelo: 'Transit', año: 2018, capacidad: '1100 kg' },
      { placa: 'MNO-345', marca: 'Hyundai', modelo: 'H100', año: 2022, capacidad: '900 kg' },
    ];
    const conductoresBase = [
      { nombre: 'Roberto Sánchez', cedula: '12345678', telefono: '3101234567', email: 'roberto@email.com', licencia: 'CC-123456', categoriaLicencia: 'C' },
      { nombre: 'Andrés Morales', cedula: '23456789', telefono: '3112345678', email: 'andres@email.com', licencia: 'CC-234567', categoriaLicencia: 'C' },
      { nombre: 'Miguel Hernández', cedula: '34567890', telefono: '3123456789', email: 'miguel@email.com', licencia: 'CC-345678', categoriaLicencia: 'C' },
      { nombre: 'Juan Castro', cedula: '45678901', telefono: '3134567890', email: 'juan.castro@email.com', licencia: 'CC-456789', categoriaLicencia: 'C' },
      { nombre: 'Luis Fuentes', cedula: '56789012', telefono: '3145678901', email: 'luis@email.com', licencia: 'CC-567890', categoriaLicencia: 'C' },
    ];

    await sequelize.transaction(async transaction => {
      if (reemplazarDatos) {
        await limpiarDatosOperativos(transaction);
      }

      const clientes = [];
      for (const [nombre, telefono, email, ciudad, direccion] of clientesBase) {
        clientes.push(await guardarPorClave(Cliente, { email }, {
          nombre, telefono, ciudad, direccion,
        }, transaction));
      }

      const vehiculos = [];
      for (const vehiculoBase of vehiculosBase) {
        vehiculos.push(await guardarPorClave(Vehiculo, { placa: vehiculoBase.placa }, {
          ...vehiculoBase,
          estado: 'disponible',
        }, transaction));
      }

      const conductores = [];
      for (let i = 0; i < conductoresBase.length; i += 1) {
        const conductorBase = conductoresBase[i];
        conductores.push(await guardarPorClave(Conductor, { email: conductorBase.email }, {
          ...conductorBase,
          vehiculoId: vehiculos[i].id,
          estado: 'activo',
        }, transaction));
      }

      const rutasBase = [
        { nombre: 'Local Villavicencio', estado: 'en_curso', conductorIndex: 0, vehiculoIndex: 0 },
        { nombre: 'Villavicencio - Acacías', estado: 'planeada', conductorIndex: 1, vehiculoIndex: 1 },
        { nombre: 'Villavicencio - Granada', estado: 'planeada', conductorIndex: 2, vehiculoIndex: 2 },
        { nombre: 'Villavicencio - Puerto López', estado: 'planeada', conductorIndex: 3, vehiculoIndex: 3 },
        { nombre: 'Villavicencio - Restrepo', estado: 'completada', conductorIndex: 4, vehiculoIndex: 4 },
      ];
      const rutas = [];
      for (const rutaBase of rutasBase) {
        const enCurso = rutaBase.estado === 'en_curso';
        const completada = rutaBase.estado === 'completada';
        rutas.push(await guardarPorClave(Ruta, { nombre: rutaBase.nombre }, {
          conductorId: conductores[rutaBase.conductorIndex].id,
          vehiculoId: vehiculos[rutaBase.vehiculoIndex].id,
          estado: rutaBase.estado,
          horaInicio: enCurso || completada ? '08:00:00' : null,
          horaFin: completada ? '10:30:00' : null,
          descripcion: `Recorrido de demostración dentro del departamento del Meta (${MUNICIPIOS_META.length} municipios habilitados).`,
        }, transaction));
      }

      const paquetesBase = [
        { cliente: 0, origen: 'Villavicencio', destino: 'Villavicencio', estado: 'pendiente', contenido: 'Documentos', ruta: null },
        { cliente: 1, origen: 'Villavicencio', destino: 'Acacías', estado: 'en_ruta', contenido: 'Repuestos', ruta: 0 },
        { cliente: 2, origen: 'Villavicencio', destino: 'Granada', estado: 'en_ruta', contenido: 'Ropa', ruta: 0 },
        { cliente: 3, origen: 'Villavicencio', destino: 'Puerto López', estado: 'entregado', contenido: 'Alimentos empacados', ruta: 4 },
        { cliente: 4, origen: 'Villavicencio', destino: 'Restrepo', estado: 'entregado', contenido: 'Artículos del hogar', ruta: 4 },
        { cliente: 5, origen: 'Acacías', destino: 'Villavicencio', estado: 'pendiente', contenido: 'Medicamentos', ruta: null },
        { cliente: 6, origen: 'Granada', destino: 'Acacías', estado: 'pendiente', contenido: 'Documentos', ruta: null },
        { cliente: 7, origen: 'Puerto López', destino: 'Villavicencio', estado: 'pendiente', contenido: 'Electrónica', ruta: null },
        { cliente: 8, origen: 'Cumaral', destino: 'Villavicencio', estado: 'pendiente', contenido: 'Repuestos', ruta: null },
        { cliente: 9, origen: 'Villavicencio', destino: 'Restrepo', estado: 'pendiente', contenido: 'Ropa', ruta: null },
      ];
      const paquetes = [];
      for (let i = 0; i < paquetesBase.length; i += 1) {
        const paqueteBase = paquetesBase[i];
        paquetes.push(await guardarPorClave(Paquete, { numeroSeguimiento: `DEMO-META-${String(i + 1).padStart(3, '0')}` }, {
          clienteId: clientes[paqueteBase.cliente].id,
          peso: 1 + (i % 5) * 0.5,
          origen: paqueteBase.origen,
          destino: paqueteBase.destino,
          valor: 25000 + i * 5000,
          contenido: paqueteBase.contenido,
          estado: paqueteBase.estado,
          rutaId: paqueteBase.ruta === null ? null : rutas[paqueteBase.ruta].id,
          fechaEntrega: paqueteBase.estado === 'entregado' ? new Date('2026-10-10T15:30:00.000Z') : null,
        }, transaction));
      }

      const entregasBase = [
        { paqueteIndex: 1, rutaIndex: 0, estado: 'en_transito', ubicacionActual: 'Villavicencio', fechaEntrega: null },
        { paqueteIndex: 2, rutaIndex: 0, estado: 'en_puerta', ubicacionActual: 'Llegó al domicilio en Granada', fechaEntrega: null },
        { paqueteIndex: 3, rutaIndex: 4, estado: 'entregado', ubicacionActual: 'Restrepo', fechaEntrega: new Date('2026-10-10T15:30:00.000Z') },
        { paqueteIndex: 4, rutaIndex: 4, estado: 'entregado', ubicacionActual: 'Restrepo', fechaEntrega: new Date('2026-10-10T15:30:00.000Z') },
      ];
      for (const entregaBase of entregasBase) {
        const paquete = paquetes[entregaBase.paqueteIndex];
        await guardarPorClave(Entrega, { paqueteId: paquete.id }, {
          numeroSeguimiento: paquete.numeroSeguimiento,
          rutaId: rutas[entregaBase.rutaIndex].id,
          conductorId: conductores[rutasBase[entregaBase.rutaIndex].conductorIndex].id,
          estado: entregaBase.estado,
          ubicacionActual: entregaBase.ubicacionActual,
          firmaRecibido: entregaBase.estado === 'entregado' ? 'Cliente de demostración' : null,
          observaciones: entregaBase.estado === 'en_puerta'
            ? 'Pendiente de confirmación por parte del cliente.'
            : null,
          fechaEntrega: entregaBase.fechaEntrega,
        }, transaction);
      }

      const vehiculoEnRuta = vehiculos[0];
      if (vehiculoEnRuta.estado !== 'en_uso') {
        await vehiculoEnRuta.update({ estado: 'en_uso' }, { transaction });
      }
    });

    console.log('✅ Seed lista: 10 clientes, 5 vehículos, 5 conductores, 5 rutas, 10 paquetes y 4 entregas.');
    console.log(reemplazarDatos
      ? '✅ Datos operativos anteriores reemplazados. Se conservaron las cuentas administradoras.'
      : 'ℹ️ El seed no elimina registros existentes. Usa npm run seed -- --reset para reemplazar los datos operativos.');
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed();
