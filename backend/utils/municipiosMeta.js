const MUNICIPIOS_META = [
  'Acacías',
  'Barranca de Upía',
  'Cabuyaro',
  'Castilla la Nueva',
  'Cubarral',
  'Cumaral',
  'El Calvario',
  'El Castillo',
  'El Dorado',
  'Fuente de Oro',
  'Granada',
  'Guamal',
  'La Macarena',
  'Uribe',
  'Lejanías',
  'Mapiripán',
  'Mesetas',
  'Puerto Concordia',
  'Puerto Gaitán',
  'Puerto Lleras',
  'Puerto López',
  'Puerto Rico',
  'Restrepo',
  'San Carlos de Guaroa',
  'San Juan de Arama',
  'San Juanito',
  'San Martín',
  'Villavicencio',
  'Vistahermosa',
];

function normalizarTexto(valor) {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es-CO');
}

const MUNICIPIOS_POR_NOMBRE = new Map(
  MUNICIPIOS_META.map(municipio => [normalizarTexto(municipio), municipio])
);

function obtenerMunicipioMeta(valor) {
  if (typeof valor !== 'string') return null;
  return MUNICIPIOS_POR_NOMBRE.get(normalizarTexto(valor)) || null;
}

module.exports = { MUNICIPIOS_META, obtenerMunicipioMeta };
