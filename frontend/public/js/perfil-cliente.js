function mostrarMensajePerfil(elemento, mensaje, tipo) {
  elemento.textContent = mensaje;
  elemento.className = `alert alert-${tipo}`;
  elemento.hidden = false;
}

async function inicializarPerfilCliente() {
  const resultado = await obtenerPerfilCliente();
  if (!resultado.success) {
    mostrarAlerta(resultado.error || 'No se pudo cargar el perfil.', 'danger');
    return;
  }

  const perfil = resultado.data;
  document.getElementById('perfil-nombre').value = perfil.nombre;
  document.getElementById('perfil-telefono').value = perfil.telefono;
  document.getElementById('perfil-email').value = perfil.email;
  document.getElementById('perfil-ciudad').value = perfil.ciudad;
  document.getElementById('perfil-direccion').value = perfil.direccion;

  document.getElementById('perfil-cliente-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const datos = Object.fromEntries(new FormData(form));
    const respuesta = await actualizarPerfilCliente(datos);
    const mensaje = document.getElementById('perfil-mensaje');
    if (!respuesta.success) {
      mostrarMensajePerfil(mensaje, respuesta.error || 'No se pudieron guardar los datos.', 'danger');
      return;
    }

    document.getElementById('topbar-user').textContent = respuesta.data.nombre;
    mostrarMensajePerfil(mensaje, 'Tus datos se actualizaron correctamente.', 'success');
  });

  document.getElementById('password-cliente-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const datos = Object.fromEntries(new FormData(form));
    const respuesta = await cambiarPasswordCliente(datos);
    const mensaje = document.getElementById('password-mensaje');
    if (!respuesta.success) {
      mostrarMensajePerfil(mensaje, respuesta.error || 'No se pudo cambiar la contraseña.', 'danger');
      return;
    }

    form.reset();
    mostrarMensajePerfil(mensaje, 'La contraseña se actualizó correctamente.', 'success');
  });
}
