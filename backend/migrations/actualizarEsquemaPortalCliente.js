const { DataTypes } = require('sequelize');
const { sequelize } = require('../models');

async function actualizarEsquemaPortalCliente() {
  const queryInterface = sequelize.getQueryInterface();
  const tablas = await queryInterface.showAllTables();

  if (tablas.includes('usuarios')) {
    const columnas = await queryInterface.describeTable('usuarios');
    const nuevasColumnas = {
      rol: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'cliente',
      },
      clienteId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      conductorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      debeCambiarPassword: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    };

    for (const [nombre, definicion] of Object.entries(nuevasColumnas)) {
      if (!columnas[nombre]) {
        await queryInterface.addColumn('usuarios', nombre, definicion);
      }
    }

    const indices = await queryInterface.showIndex('usuarios');
    const clienteIdUnico = indices.some(indice =>
      indice.unique && indice.fields.some(campo => campo.attribute === 'clienteId')
    );
    if (!clienteIdUnico) {
      await queryInterface.addIndex('usuarios', ['clienteId'], {
        name: 'usuarios_cliente_id_unico',
        unique: true,
      });
    }
    const conductorIdUnico = indices.some(indice =>
      indice.unique && indice.fields.some(campo => campo.attribute === 'conductorId')
    );
    if (!conductorIdUnico) {
      await queryInterface.addIndex('usuarios', ['conductorId'], {
        name: 'usuarios_conductor_id_unico',
        unique: true,
      });
    }
  }

  if (tablas.includes('entregas')) {
    const columnas = await queryInterface.describeTable('entregas');
    if (!columnas.motivoNovedad) {
      await queryInterface.addColumn('entregas', 'motivoNovedad', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
    if (!columnas.fechaNovedad) {
      await queryInterface.addColumn('entregas', 'fechaNovedad', {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }
  }

  if (tablas.includes('paquetes')) {
    const columnas = await queryInterface.describeTable('paquetes');
    const nuevasColumnasPaquete = {
      fechaEntrega: { type: DataTypes.DATE, allowNull: true },
      incidenciaCliente: { type: DataTypes.TEXT, allowNull: true },
      fechaIncidencia: { type: DataTypes.DATE, allowNull: true },
      fechaDevolucion: { type: DataTypes.DATE, allowNull: true },
    };
    for (const [nombre, definicion] of Object.entries(nuevasColumnasPaquete)) {
      if (!columnas[nombre]) {
        await queryInterface.addColumn('paquetes', nombre, definicion);
      }
    }
  }
}

module.exports = actualizarEsquemaPortalCliente;
