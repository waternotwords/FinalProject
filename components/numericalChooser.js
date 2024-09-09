import { useState, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

export const NumericalChooser = (p) => {
  const [duration, setDuration] = useState(p?.initialValue);
  const dataRef = useRef(p?.valueChangedDataRef);
  const lastTouch = useRef(Date.now());
  const min = p?.min != null ? p.min : 1;
  const max = p?.max != null ? p.max : 6000;

  // if the data reference has changed reset state from initial value
  if(p?.valueChangedDataRef != dataRef.current){
    dataRef.current = p?.valueChangedDataRef;
    setDuration(p?.initialValue);
  }

  // returns the scalar 1 or 2 based on the time to last increment
  const multiplier = () => {
    const time = Date.now();
    let multiplier = (time - lastTouch.current < 250) ? 2 : 1;
    if (p?.hours) multiplier *= 2;
    lastTouch.current = time;
    return multiplier;
  }

  const increment = (duration, setDuration, descending=false) => {
    const v = descending ? duration - 1 : duration;
    let inc;
    if (p?.hours) {
      if (v >= 200) inc = 50 * multiplier();
      else if (v >= 100) inc = 25 * multiplier();
      else if (v < 20) inc = 10;
      else inc = 10 * multiplier();
    } else {
      if (v >= 300) inc = 30 * multiplier();
      else if (v >= 120) inc = 10 * multiplier();
      else if (v < 10) inc = 1;
      else inc = 5 * multiplier();
    }


    let newVal;
    if(descending){
      newVal = duration - inc;
      newVal = newVal >= min ? newVal : min;
      setDuration(newVal);
    } else {
      newVal = duration + inc;
      newVal = newVal <= max ? newVal : max;
      if(p?.hours && newVal > 100 && newVal % 100 < 50) newVal -= (newVal % 100)
      setDuration(newVal);
    }
    p?.onChange?.(newVal)
  }

  return (
    <View style={[s.container, p?.style]}>
      <TouchableOpacity style={[s.control, s.left]} onPress={()=>increment(duration, setDuration, true)}>
        <AntDesign name="caretdown" size={16} color="black"/>
      </TouchableOpacity>
      <View style={s.txtContain}>
        <Text style={s.txt}>{duration + (p?.hours ? ' hours' : 'min')}</Text>
      </View>
      <TouchableOpacity style={[s.control, s.right]} onPress={()=>increment(duration, setDuration)}>
        <AntDesign name="caretup" size={16} color="black"/>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    borderWidth: 1,
    borderRadius: 5,
  },
  control: {
    backgroundColor: '#AAA',
    alignItems: 'center', 
    justifyContent: 'center',
    aspectRatio: 1,
    padding: 5,
    height: '100%',
  },
  left: {
    borderBottomLeftRadius: 5,
    borderTopLeftRadius: 5,
  },
  right: {
    borderBottomRightRadius: 5,
    borderTopRightRadius: 5,
  },
  txtContain: {
    flexGrow: 1,
    padding: 4,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#fff',
    height: '100%'
  },
  txt: {
    fontSize: 15,
    fontWeight: 'bold',
  }

});
