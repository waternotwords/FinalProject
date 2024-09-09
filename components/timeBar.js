import { StyleSheet, View, Text } from 'react-native';

export const TimeBar = (p) => {
  const radius = p?.radius ? p.radius : 0;
  const backCol = p?.backgroundColor ? {backgroundColor: p.backgroundColor} : {backgroundColor: '#fff'};
  const forCol = p?.barColor ? {backgroundColor: p.barColor} : {backgroundColor: '#7ac1ff'};
  const completed = p?.timeComplete ? p.timeComplete : 0;
  const total = p?.timeRequired ? p.timeRequired : 0;
  const message = p?.message;
  const w = message ? 100 : Math.min(completed / total * 100, 100);
  const width = w > 0 ? { width: String(w) + '%'} : null;

  return (
    <View style={[s.backgroundView, backCol, {borderRadius: radius}, s.style]}>
      <View style={[s.bar, forCol, width, {borderRadius: radius-1}]}/>
      <View style={[s.txtContain]}>
        { message 
          ? <Text style={[s.txt, {color: p?.txtCol}]}>{message}</Text> 
          : <Text style={[s.txt, {color: p?.txtCol}]}>{completed} / {total} min</Text>
        }
      </View>
    </View>
  );

}



const s = StyleSheet.create({
  backgroundView: {
    borderWidth: 1,
    // borderColor: '#fff',
    flexDirection: 'row',
    height: '100%',
    flexGrow: 1,
  },
  bar: {
    // borderRightWidth: 1,
    height: '100%',
  },
  txtContain: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  txt: {
    fontSize: 18,
  }
})
