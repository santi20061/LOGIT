const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');

// Leer archivo JSON
function leerJSON(archivo) {
  try {
    const rutaArchivo = path.join(DATA_DIR, `${archivo}.json`);
    const datos = fs.readFileSync(rutaArchivo, 'utf8');
    return JSON.parse(datos);
  } catch (error) {
    console.error(`Error leyendo ${archivo}.json:`, error.message);
    return [];
  }
}

// Escribir archivo JSON
function escribirJSON(archivo, datos) {
  try {
    const rutaArchivo = path.join(DATA_DIR, `${archivo}.json`);
    fs.writeFileSync(rutaArchivo, JSON.stringify(datos, null, 2));
    return true;
  } catch (error) {
    console.error(`Error escribiendo ${archivo}.json:`, error.message);
    return false;
  }
}

// Obtener el siguiente ID disponible
function obtenerSiguienteId(datos) {
  if (datos.length === 0) return 1;
  return Math.max(...datos.map(item => item.id)) + 1;
}

module.exports = {
  leerJSON,
  escribirJSON,
  obtenerSiguienteId
};