import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';


export default function Tab(){

  return (
    <View style={s.container}>
      <View style={[s.banner]}>
        <View style={s.txtHolder}>
          <Text style={s.bannerTxt}>Use the Buttons Above for Testing</Text>
        </View>
      </View>

      
      <View style={s.infoHolder}>
        <Text style={s.title}>SVGs - Designed by me except for</Text>
        <Text style={s.sub}>Star Alt 1 SVG Vector by Dazzle Ui</Text>
        <Text style={s.url}>https://www.svgrepo.com/svg/532289/star-alt-1</Text>
        <Text style={s.url}>https://creativecommons.org/licenses/by/4.0/</Text>
        <Text style={s.title}>Sounds</Text>

        <Text style={s.sub}>Sample 128 Bpm (Alarm Sound)</Text>
        <Text style={s.url}>https://freesound.org/people/deleted_user_4397472/sounds/383468/</Text>
        <Text style={s.url}>http://creativecommons.org/publicdomain/zero/1.0/</Text>

        <Text style={s.sub}>Achievement Happy Beeps Jingle (Reminder Sound)</Text>
        <Text style={s.url}>https://freesound.org/people/CogFireStudios/sounds/619838/</Text>
        <Text style={s.url}>http://creativecommons.org/publicdomain/zero/1.0/</Text>

        <Text style={s.title}>Icons - All UI Icons</Text>

        <Text style={s.sub}>@expo/vector-icons</Text>
        <Text style={s.url}>https://github.com/expo/vector-icons</Text>
        <Text style={s.sub}>Which uses @oblador/react-native-vector-icons </Text>
        <Text style={s.url}>https://github.com/oblador/react-native-vector-icons</Text>

        <Text style={s.title}>App Splash Screen & Icon</Text>

        <Text style={s.sub}>Target SVG Vector by colourcreative</Text>
        <Text style={s.url}>https://www.svgrepo.com/svg/474707/target</Text>
        <Text style={s.url}>https://creativecommons.org/licenses/by/4.0/</Text>

        <Text style={s.sub}>Target And Arrow SVG Vector by Icooon Mono</Text>
        <Text style={s.url}>https://www.svgrepo.com/svg/477511/target-and-arrow</Text>
        <Text style={s.url}>http://creativecommons.org/publicdomain/zero/1.0/</Text>

      </View>


      <View style={s.bHold}>
        <TouchableOpacity style={s.b}
          onPress={()=>{
            router.navigate({pathname: '/appSurvey'});
          }}
        >
          <Text style={s.bTxt}>App User Survey</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  banner: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#BBB',
    flexDirection: 'row'
  },
  txtHolder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTxt: {
    fontSize: 16,
    fontFamily: 'monospace',
  },
  infoHolder:{
    width: '90%'
  },
  title: {
    textAlign:'center',
    fontSize: 20,
    fontWeight: 'bold',
    width: '100%',
    marginTop: 20,
    marginBottom: 5,
  },
  sub: {
    fontSize: 18,
    marginTop: 10
  },
  url: {
    textDecorationLine: 'underline',
    color:'#999',
    fontSize: 12
  },
  bHold:{
    width:'95%',
  },
  b: {
    height: 45,
    width: '100%',
    borderWidth: 1,
    borderRadius: 5,
    width: '100%' ,
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#333333',
    marginBottom: 10,
  },
  bTxt: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 18
  }
});
