async function inicializarDashboard() {
  const recursos = [
    ['totalClientes', obtenerClientes],
    ['totalPaquetes', obtenerPaquetes],
    ['totalVehiculos', obtenerVehiculos],
    ['totalConductores', obtenerConductores],
    ['totalRutas', obtenerRutas],
    ['totalEntregas', obtenerEntregas]
  ];

  try {
    const resultados = await Promise.all(recursos.map(([, obtener]) => obtener()));
    resultados.forEach((resultado, index) => {
      const elemento = document.getElementById(recursos[index][0]);
      if (!elemento) return;

      if (resultado.success) {
        elemento.textContent = resultado.data.length.toLocaleString('es-CO');
      } else {
        elemento.textContent = '—';
        elemento.title = resultado.message || 'No se pudo cargar este dato';
      }
    });

    const indicador = document.getElementById('estadoIndicador');
    const estado = document.getElementById('estadoSistema');
    try {
      const response = await fetch('/api/status');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await response.json();
      estado.textContent = 'Servidor y base de datos conectados';
    } catch (error) {
      console.error('Error verificando el estado del servidor:', error);
      indicador.style.backgroundColor = '#d92d20';
      indicador.style.boxShadow = '0 0 0 4px #fef3f2';
      estado.textContent = 'No se pudo verificar la conexión';
    }
  } catch (error) {
    console.error('Error cargando el resumen del dashboard:', error);
  } finally {
    const actualizado = document.getElementById('ultimaActualizacion');
    if (actualizado) {
      actualizado.textContent = new Date().toLocaleString('es-CO');
    }
  }
}
