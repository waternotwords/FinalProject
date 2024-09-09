import { useState } from 'react';
import { Text, Pressable, StyleSheet, View, Keyboard } from 'react-native';

export const SimpleSwitch = (p) => {
  const [state, setState] = useState(p?.isOn == true);
  const onC = p?.color ? p.color : '#5f8735';

  return (
    <Pressable 
      style={[s.container, state ? {backgroundColor: onC, alignItems: 'flex-end',} : s.off, ]} 
      onPressIn={()=>{
        Keyboard.dismiss();
        const newState = !state
        setState(newState)
        p?.onChange?.(newState, ()=>setState(false));
      }}
    >
      <View style={[s.switch]}>
        <Text style={s.txt}> </Text>
      </View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#AAA',
    borderWidth: 1,
    borderRadius: 5,
    padding: 1,
  },
  off: {
    alignItems: 'start',
  },
  switch: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 3,
    width: '50%',
    height: '100%',
    backgroundColor: '#fff',
  },
  txt: {
    fontSize: 16,
  }
})
