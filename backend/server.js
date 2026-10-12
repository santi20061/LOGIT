require('dotenv').config();

const app = require('./app');
const { sequelize, Usuario } = require('./models');
const bcrypt = require('bcryptjs');
const actualizarEsquemaPortalCliente = require('./migrations/actualizarEsquemaPortalCliente');

const PORT = process.env.PORT || 3000;

async function initServer() {
  try {
    // Mostrar ruta de la BD
    const dbPath = sequelize.options.storage;
    console.log('📂 Ruta BD:', dbPath);

    await sequelize.authenticate();
    console.log('✅ Conexión a SQLite exitosa');

    await sequelize.sync({ alter: false });
    await actualizarEsquemaPortalCliente();
    console.log('✅ Base de datos sincronizada');

    await configurarAdministradorInicial();

    app.listen(PORT, () => {
      console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function configurarAdministradorInicial() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('Configura ADMIN_EMAIL y ADMIN_PASSWORD en .env para habilitar el acceso.');
  }

  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 12 caracteres.');
  }

  const existente = await Usuario.findOne({ where: { email } });
  if (existente) {
    if (['cliente', 'conductor'].includes(existente.rol)
      && (existente.clienteId !== null || existente.conductorId !== null)) {
      throw new Error('El correo de ADMIN_EMAIL ya pertenece a una cuenta vinculada.');
    }
    await existente.update({
      nombre: process.env.ADMIN_NAME?.trim() || 'Administrador',
      rol: 'admin',
      clienteId: null,
      conductorId: null,
      debeCambiarPassword: false,
    });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await Usuario.create({
    email,
    nombre: process.env.ADMIN_NAME?.trim() || 'Administrador',
    passwordHash,
    rol: 'admin',
    debeCambiarPassword: false,
  });
  console.log(`✅ Cuenta administradora inicial creada: ${email}`);
}

initServer();