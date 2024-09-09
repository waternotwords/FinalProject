
import { Pressable, StyleSheet } from 'react-native';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';

export const Hamburger = (p) => {
  const size = p?.size ? p.size : 32
  return(
    <Pressable
      onPress={()=>p?.onPress?.()}
      onLongPress={()=>p?.onLongPress?.()}
      // press dependent style: https://stackoverflow.com/a/68978207/4577867
      style={({pressed}) => [s.hamburger, {size: size, opacity: pressed ? 0.4 : 1 }]}
    >
      <SimpleLineIcons name='menu' size={size} color={p?.color ? p.color : '#fff'}/>
    </Pressable>

  )}

const s = StyleSheet.create({
  hamburger: {
    // padding: 10,
    // paddingTop: 6,
    // paddingBottom: 10,
  },
})
