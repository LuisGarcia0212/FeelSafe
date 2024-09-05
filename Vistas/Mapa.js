import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View, TextInput, Alert, TouchableOpacity, Text, Image, Modal, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { GOOGLE_MAPS_APIKEY } from '@env';
import { calcularDistancia, decodificarPolilinea, obtenerIconoMarcador, geocodificarInversoCoordenada, geocodificarDireccion, colorearRuta } from '../utils/mapUtils';
import { verificarSeguridadLogaritmica } from '../utils/routeSafety';

const UMBRAL_PELIGRO_METROS = 100;

export default function PantallaMapa({ navigation }) {
  const { colors } = useTheme();
  const [origen, setOrigen] = useState(null);
  const [destino, setDestino] = useState(null);
  const [coordenadasRuta, setCoordenadasRuta] = useState([]);
  const [inputOrigen, setInputOrigen] = useState('');
  const [inputDestino, setInputDestino] = useState('');
  const [seleccionandoOrigen, setSeleccionandoOrigen] = useState(true);
  const [modoViaje, setModoViaje] = useState('walking');
  const [regionMapa, setRegionMapa] = useState({
    latitude: -11.985, 
    longitude: -77.005, 
    latitudeDelta: 0.007, 
    longitudeDelta: 0.007,
  });
  const [seguridadRuta, setSeguridadRuta] = useState('seguro');
  const [puntuacionSeguridad, setPuntuacionSeguridad] = useState(100);
  const [zonaSeleccionada, setZonaSeleccionada] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [ubicacionActual, setUbicacionActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);

  const zonasPeligrosas = useMemo(() => [
    { id: 1, latitude: -11.984, longitude: -77.007, descripcion: 'Zona peligrosa 1', tipo: 'ACOSO', umbral: UMBRAL_PELIGRO_METROS, peso: 30 },
    { id: 2, latitude: -11.982, longitude: -77.003, descripcion: 'Zona peligrosa 2', tipo: 'CRIMEN', umbral: UMBRAL_PELIGRO_METROS, peso: 50 },
    { id: 3, latitude: -11.980, longitude: -77.004, descripcion: 'Tienda 1', tipo: 'DROGAS', umbral: UMBRAL_PELIGRO_METROS, peso: 20 },
    { id: 4, latitude: -11.979, longitude: -77.005, descripcion: 'Robo a Casa', tipo: 'ROBO_A_CASA', umbral: UMBRAL_PELIGRO_METROS, peso: 40 },
    { id: 5, latitude: -11.978, longitude: -77.006, descripcion: 'Robo a Comercio', tipo: 'ROBO_A_COMERCIO', umbral: UMBRAL_PELIGRO_METROS, peso: 45 },
    { id: 6, latitude: -11.977, longitude: -77.007, descripcion: 'Robo a Persona', tipo: 'ROBO_A_PERSONA', umbral: UMBRAL_PELIGRO_METROS, peso: 35 },
    { id: 7, latitude: -11.976, longitude: -77.008, descripcion: 'Robo a Vehículo', tipo: 'ROBO_A_VEHICULO', umbral: UMBRAL_PELIGRO_METROS, peso: 30 },
    { id: 8, latitude: -11.975, longitude: -77.009, descripcion: 'Sospechoso', tipo: 'SOSPECHOSO', umbral: UMBRAL_PELIGRO_METROS, peso: 25 },
    { id: 9, latitude: -11.974, longitude: -77.010, descripcion: 'Vandalismo', tipo: 'VANDALISMO', umbral: UMBRAL_PELIGRO_METROS, peso: 30 },
  ], []);

  const actualizarRegionMapa = useCallback((coordenada) => {
    setRegionMapa(prevRegion => ({
      ...prevRegion,
      latitude: coordenada.latitude,
      longitude: coordenada.longitude,
    }));
  }, []);

  const obtenerRuta = useCallback(async () => {
    if (!origen || !destino) {
      Alert.alert('Error', 'Debe seleccionar un origen y un destino');
      return;
    }

    setLoading(true);

    try {
      const urlDirecciones = `https://maps.googleapis.com/maps/api/directions/json?origin=${origen.latitude},${origen.longitude}&destination=${destino.latitude},${destino.longitude}&mode=${modoViaje}&key=${GOOGLE_MAPS_APIKEY}`;
      const respuesta = await fetch(urlDirecciones);
      const datos = await respuesta.json();

      if (datos.status === "OK" && datos.routes.length > 0) {
        const ruta = datos.routes[0];
        const puntosDecodificados = decodificarPolilinea(ruta.overview_polyline.points);
        setCoordenadasRuta(puntosDecodificados);

        ajustarVistaRuta(puntosDecodificados);

        const puntosPeligrosos = verificarSeguridadLogaritmica(puntosDecodificados, zonasPeligrosas, setPuntuacionSeguridad, setSeguridadRuta);

        if (puntosPeligrosos.length > 0) {
          Alert.alert('Advertencia', `La ruta pasa cerca de ${puntosPeligrosos.length} zonas peligrosas.`);
        }
      } else {
        Alert.alert('Error', 'No se encontraron rutas. Por favor, verifique las ubicaciones e intente de nuevo.');
      }
    } catch (error) {
      console.error('Error al obtener la ruta:', error);
      Alert.alert('Error', 'Hubo un problema al generar la ruta. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [origen, destino, verificarSeguridadLogaritmica]);

  const ajustarVistaRuta = useCallback((coordenadas) => {
    if (mapRef.current && coordenadas.length > 0) {
      mapRef.current.fitToCoordinates(coordenadas, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, []);

  useEffect(() => {
    if (origen && destino) {
      obtenerRuta();
    }
  }, [origen, destino, modoViaje, obtenerRuta]);

  const obtenerUbicacionActual = useCallback(async () => {
    setLoading(true);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso de ubicación denegado');
        return;
      }
      let ubicacion = await Location.getCurrentPositionAsync({});
      const coordenada = {
        latitude: ubicacion.coords.latitude,
        longitude: ubicacion.coords.longitude,
      };
      setUbicacionActual(coordenada);
      setOrigen(coordenada);
      actualizarRegionMapa(coordenada);
      geocodificarInversoCoordenada(coordenada, setInputOrigen);
    } catch (error) {
      console.error('Error al obtener la ubicación actual:', error);
    } finally {
      setLoading(false);
    }
  }, [actualizarRegionMapa, geocodificarInversoCoordenada]);

  const manejarPresionMarcador = useCallback((zona) => {
    setZonaSeleccionada(zona);
    setModalVisible(true);
  }, []);

  const manejarFinArrastreMarcador = useCallback((coordenada, setCoordenada, setInput) => {
    setCoordenada(coordenada);
    actualizarRegionMapa(coordenada);
    geocodificarInversoCoordenada(coordenada, setInput);
  }, [actualizarRegionMapa, geocodificarInversoCoordenada]);

  const manejarCambioInput = useCallback(async (texto, esOrigen) => {
    setLoading(true);

    try {
      if (esOrigen) {
        setInputOrigen(texto);
        const coordenada = await geocodificarDireccion(texto);
        if (coordenada) {
          setOrigen(coordenada);
          actualizarRegionMapa(coordenada);
        }
      } else {
        setInputDestino(texto);
        const coordenada = await geocodificarDireccion(texto);
        if (coordenada) {
          setDestino(coordenada);
          actualizarRegionMapa(coordenada);
        }
      }
   } catch (error) {
      console.error('Error al manejar el cambio de input:', error);
    } finally {
      setLoading(false);
    }
  }, [actualizarRegionMapa, geocodificarDireccion]);

  const manejarPresionMapa = useCallback((e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const coordenada = { latitude, longitude };
    actualizarRegionMapa(coordenada);
    if (seleccionandoOrigen) {
      setOrigen(coordenada);
      geocodificarInversoCoordenada(coordenada, setInputOrigen);
    } else {
      setDestino(coordenada);
      geocodificarInversoCoordenada(coordenada, setInputDestino);
    }
  }, [seleccionandoOrigen, actualizarRegionMapa, geocodificarInversoCoordenada]);

  const manejarZoom = useCallback((tipo) => {
    setRegionMapa(prevRegion => ({
      ...prevRegion,
      latitudeDelta: tipo === 'in' ? prevRegion.latitudeDelta / 2 : prevRegion.latitudeDelta * 2,
      longitudeDelta: tipo === 'in' ? prevRegion.longitudeDelta / 2 : prevRegion.longitudeDelta * 2,
    }));
  }, []);

  return (
    <View style={styles.contenedor}>
      <MapView
        ref={mapRef}
        style={styles.mapa}
        region={regionMapa}
        onRegionChangeComplete={setRegionMapa}
        onPress={manejarPresionMapa}
      >
        {origen && (
          <Marker
            coordinate={origen}
            title="Origen"
            draggable
            onDragEnd={(e) => manejarFinArrastreMarcador(e.nativeEvent.coordinate, setOrigen, setInputOrigen)}
          />
        )}
        {destino && (
          <Marker
            coordinate={destino}
            title="Destino"
            draggable
            onDragEnd={(e) => manejarFinArrastreMarcador(e.nativeEvent.coordinate, setDestino, setInputDestino)}
          />
        )}
        {colorearRuta(coordenadasRuta, zonasPeligrosas).map((segmento, index) => (
          <Polyline
            key={index}
            coordinates={segmento.coordenadas}
            strokeColor={segmento.color}
            strokeWidth={3}
          />
        ))}
        {zonasPeligrosas.map((zona) => (
          <Marker
            key={zona.id}
            coordinate={{ latitude: zona.latitude, longitude: zona.longitude }}
            title={zona.descripcion}
            onPress={() => manejarPresionMarcador(zona)}
          >
            <Image
              source={obtenerIconoMarcador(zona.tipo)}
              style={{ width: 40, height: 40 }}
            />
          </Marker>
        ))}
        {zonasPeligrosas.map((zona) => (
          <Circle
            key={`${zona.id}-circle`}
            center={{ latitude: zona.latitude, longitude: zona.longitude }}
            radius={zona.umbral}
            strokeWidth={2}
            strokeColor="rgba(255, 0, 0, 0.5)"
            fillColor="rgba(255, 0, 0, 0.2)"
          />
        ))}
      </MapView>

      <View style={styles.contenedorZoom}>
        <TouchableOpacity onPress={() => manejarZoom('in')} style={styles.botonZoom}>
          <Text style={styles.textoBotonZoom}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => manejarZoom('out')} style={styles.botonZoom}>
          <Text style={styles.textoBotonZoom}>-</Text>
        </TouchableOpacity>
      </View>

      
      <TouchableOpacity
        style={styles.botonGPS}
        onPress={obtenerUbicacionActual}
      >
        <Ionicons name="navigate" size={30} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.contenedorInput}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="¿Dónde estamos?"
          placeholderTextColor={colors.text}
          value={inputOrigen}
          onChangeText={(texto) => manejarCambioInput(texto, true)}
          onFocus={() => setSeleccionandoOrigen(true)}
        />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="¿Adónde vamos?"
          placeholderTextColor={colors.text}
          value={inputDestino}
          onChangeText={(texto) => manejarCambioInput(texto, false)}
          onFocus={() => setSeleccionandoOrigen(false)}
        />
      </View>

      <View style={styles.indicadorSeguridad}>
        <Text style={{ color: seguridadRuta === 'peligroso' ? '#FF0000' : seguridadRuta === 'moderado' ? '#FFA500' : '#00FF00' }}>
          Nivel de seguridad: {seguridadRuta}
        </Text>
        <Text>Puntuación de seguridad: {puntuacionSeguridad}</Text>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.vistaModal}>
          {zonaSeleccionada && (
            <>
              <Text style={styles.textoModal}>Información de Peligro</Text>
              <Text>Descripción: {zonaSeleccionada.descripcion}</Text>
              <Text>Tipo: {zonaSeleccionada.tipo}</Text>
              <TouchableOpacity
                style={styles.botonCerrar}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textoBotonCerrar}>Cerrar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  mapa: {
    width: '100%',
    height: '50%',
  },
  contenedorZoom: {
    position: 'absolute',
    right: 20,
    bottom: 140,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 5,
    zIndex: 1,
  },
  botonZoom: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  textoBotonZoom: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  botonGPS: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
  },
  contenedorInput: {
    padding: 10,
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  indicadorSeguridad: {
    padding: 10,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  vistaModal: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  textoModal: {
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  botonCerrar: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
  },
  textoBotonCerrar: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
