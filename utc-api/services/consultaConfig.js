const DOCUMENTOS_REQUERIDOS = {
  nutricion: {
    primera:     ['consentimiento', 'historia_clinica_nutricion'],
    subsecuente: ['seguimiento_nutricion']
  },
  fisioterapia: {
    primera:     ['valoracion_inicial_fisioterapia'],
    subsecuente: ['nota_evolutiva']
  }
};

function getTipoConsulta(area, tieneHistorialPrevio) {
  return tieneHistorialPrevio ? 'subsecuente' : 'primera';
}

function getDocumentosRequeridos(area, tipoConsulta) {
  return DOCUMENTOS_REQUERIDOS[area]?.[tipoConsulta] ?? [];
}

module.exports = { getTipoConsulta, getDocumentosRequeridos };
