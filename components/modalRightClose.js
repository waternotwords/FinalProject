
import { TouchableOpacity, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import EvilIcons from '@expo/vector-icons/EvilIcons';

export const ModalRightClose = () => {
  const params = useLocalSearchParams();
  return (
    <TouchableOpacity
      style={[{
        height:'130%', width:50, alignItems:'flex-end', 
        paddingTop: 10, paddingLeft: 17, marginRight: -8}
      ]}
      onPress={()=>{
        router.back();
        router.setParams({...params, task:'', refresh:'', prePop:'', pursuit:''});
      }}
    >
      <EvilIcons name="close" size={35} color="#777777" />
    </TouchableOpacity>
  );
}
