// App.js
import React from 'react';
import { Text, StyleSheet, View, Image, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { useFonts } from 'expo-font';
import Boton from '../Componentes/Boton.js'; // Asegúrate de que la ruta sea correcta
import { useNavigation } from '@react-navigation/native';

const App = () => {
  const [fontsLoaded] = useFonts({
    Ultra: require("../fonts/Poppins-ExtraBold.ttf"),
  });

  const navigation = useNavigation(); // Usando useNavigation para obtener el objeto de navegación

  if (!fontsLoaded) return null;

  return (
    <KeyboardAvoidingView
      style={styles.principal}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.overlay}>
          <Image source={require('../Imagenes/mesaTrabajo2.png')} style={styles.fondo} />
          <Image source={require('../Imagenes/LogoBN.png')} style={styles.fondo2} />
          <Image source={require('../Imagenes/developers.png')} style={styles.desarrollador} />
        </View>

        <View style={styles.pesheto}>
          <View >
            <View style={styles.cajatexto}>
              <TextInput placeholder='Ingrese Correo' style={styles.input} />
            </View>
            <View style={styles.cajatexto}>
              <TextInput placeholder='Contraseña' style={styles.input} secureTextEntry />
            </View>
          </View>
            <View style={styles.botoningresar}>
              <Boton text="Inicia Sesión"
                     style={styles.TextoBoton3}
                     onPress={() => navigation.navigate('Menu')} />
            </View>

            <View>
              <Text style={styles.TextoBoton1}>Contraseña</Text>
            </View>

            <View>
              <Text style={styles.TextoBoton2}>Correo</Text>
            </View>
          
            <View>
              <Text style={styles.Texto1}>Iniciar xd con: </Text>
            </View>
            
            <View>
              <Text style={styles.Texto2}>¿No tienes cuenta? </Text>
            </View>

            <View>
              <Text style={styles.Texto3} onPress={() => navigation.navigate('Registro')} >Registrate </Text>
            </View>

            <View>
              <Text style={styles.Texto4}>FEEL SAFE </Text>
            </View>

            <View>
              <Text style={styles.Texto5}>Sientete Seguro </Text>
            </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  principal: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  pesheto: {
    flex: 1,
    zIndex: 4,
    marginTop:190,
  },
  fondo2: {
    width: 130,
    height: 130,
    position: 'absolute',
    top: 30,
    left: 165,
    zIndex:0,
  },
  fondo: {
    width: 450,
    height: 1150,
    position: 'absolute',
    bottom: 1,
    zIndex: 0,
  },
  desarrollador: {
    width: 50,
    height: 50,
    zIndex: 2,
    position: 'absolute',
    left: 190,
    top: 830,
  },
  
  cajatexto: {
    width: 250,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 30,
    marginVertical: 21,
    top:210,
  },
  input: {
    paddingHorizontal: 15,
  },
  botoningresar: {
    backgroundColor: '#000000',
    borderRadius: 30,
    paddingVertical: 4,
    width: 210,
    height:40,
    top:230,
    marginVertical: -20,
    alignSelf: 'center',
    alignItems: 'center',
  },
  TextoBoton3: {
    fontFamily: 'Ultra',
    color: 'white',
    paddingVertical: 2,
    top:3
  },
  TextoBoton1: {
    width: 210,
    fontFamily: 'Ultra',
    color: 'black',
    fontSize: 18,
    marginTop: 10,
    bottom:-99,
    left:15,
    zIndex:5,
    right:30
  },
  TextoBoton2: {
    fontFamily: 'Ultra',
    width: 205,
    color: 'black',
    fontSize: 18,
    marginTop: 10,
    bottom:20,
    zIndex:6,
    left:15,
  },
  Texto1: {
    bottom:-180,
    color:'black',
    left:85,
    
  },
  Texto2: {
    bottom:-280,
    left:65,
    color:'white'
  },
  Texto3: {
    bottom:-310,
    color:'#00FFFF',
    left:85,
    textDecorationLine: 'underline',
  },
  Texto4: {
    fontFamily: 'Ultra',
    fontSize: 41,
    fontWeight: 'bold',
    textAlign: 'center',
    position:'absolute',
    bottom:140,
    left:30
  },
  Texto5:{
    fontSize:10,
    left:90,
    bottom:145,
  }
});

export default App;
