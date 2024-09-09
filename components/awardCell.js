import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { Star } from './star.js'
import { TimeBar } from './timeBar.js'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

//  colors / awards
export const Award = (p) => {
  return (
    <View style={[s.award, {backgroundColor: p.colors.dark}]}>
    <Text style={s.awardTxt}>{p.title}</Text>
    <View style={s.barStarContain}>
      <View style={{height: 30, width: '90%',}}>
        <TimeBar 
          barColor={p.colors.light} 
          message={p.message} 
          radius={10}
          timeComplete={p.timeComplete}
          timeRequired={p.timeRequired}/>
      </View>
      <View style={s.starHolder}>
        <Star color={p.colors.contrast} style={s.star}>{p.star}</Star>
        { p.star != null 
          ? null
          : <FontAwesome6 name="face-smile-beam" size={30} color="#fff" style={s.face}/>
        }
      </View>
    </View>
  </View>
  )

}

const s = StyleSheet.create({ 
  award: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  awardTxt: {
    fontSize: 20,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#fff',
    fontWeight: 'bold'
  },
  barStarContain: {
    flexDirection: 'row',
    width: '100%',
    paddingLeft: 10,
    paddingRight: 5,
    marginTop: -5,
    alignItems: 'center',
  },
  starHolder: {
    height: 55,
    width: 55,
    marginLeft: -25,
    alignItems: 'center',
    justifyContent: 'center'
  },
  star: {
    position: 'absolute', 
    top:-8, 
    bottom:-8,
    left:-8,
    right:-8}
})
