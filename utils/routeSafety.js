import { calcularDistancia } from './mapUtils';

export const verificarSeguridadLogaritmica = (coordenadasRuta, zonasPeligrosas, setPuntuacionSeguridad, setSeguridadRuta) => {
  let puntuacionPeligroTotal = 0;
  let zonasPeligrosasUnicas = new Set();

  coordenadasRuta.forEach((punto) => {
    zonasPeligrosas.forEach(zona => {
      const distancia = calcularDistancia(punto, zona);
      if (distancia < zona.umbral) {
        if (!zonasPeligrosasUnicas.has(zona.id)) {
          puntuacionPeligroTotal += zona.peso;
          zonasPeligrosasUnicas.add(zona.id);
        }
      }
    });
  });

  const porcentajeSeguridad = Math.max(0, 100 - 100 * (Math.log(puntuacionPeligroTotal + 1) / Math.log(zonasPeligrosas.length * 50 + 1)));
  setPuntuacionSeguridad(Math.round(porcentajeSeguridad));

  if (porcentajeSeguridad < 50) {
    setSeguridadRuta('peligroso');
  } else if (porcentajeSeguridad < 75) {
    setSeguridadRuta('moderado');
  } else {
    setSeguridadRuta('seguro');
  }

  return Array.from(zonasPeligrosasUnicas);
};

export const colorearRuta = (coordenadasRuta, zonasPeligrosas) => {
  const segmentosColoreados = [];
  let zonasPeligrosasUnicas = new Set();

  for (let i = 0; i < coordenadasRuta.length - 1; i++) {
    const puntoInicio = coordenadasRuta[i];
    const puntoFin = coordenadasRuta[i + 1];
    let puntuacionPeligroTotal = 0;

    zonasPeligrosas.forEach(zona => {
      const distanciaInicio = calcularDistancia(puntoInicio, zona);
      const distanciaFin = calcularDistancia(puntoFin, zona);
      if (distanciaInicio < zona.umbral || distanciaFin < zona.umbral) {
        puntuacionPeligroTotal += zona.peso;
        zonasPeligrosasUnicas.add(zona.id);
      }
    });

    let colorSegmento = '#00FF00';
    if (puntuacionPeligroTotal > 50) {
      colorSegmento = '#FF0000';
    } else if (puntuacionPeligroTotal > 20) {
      colorSegmento = '#FFA500';
    }

    segmentosColoreados.push({
      coordenadas: [puntoInicio, puntoFin],
      color: colorSegmento,
    });
  }

  return segmentosColoreados;
};
