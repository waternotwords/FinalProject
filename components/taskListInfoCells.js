import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const BannerCell = (p) => {
  // console.log(p.children);
  return (
    <TouchableOpacity style={[s.banner, p?.style]} onPress={p?.onPress}>
      <View style={s.txtHolder}>
        <Icon 
          name={p?.open ? 'chevron-up' : 'chevron-down'} 
          style={s.chevronStyle}
        />
        <Text style={s.bannerTxt}>{p.children}</Text>
        <Icon 
          name={p?.open ? 'chevron-up' : 'chevron-down'} 
          style={s.chevronStyle}
        />
      </View>
    </TouchableOpacity>
  );
}

export const EmptyNoticeCell = (p) => (
  <View style={s.empty}>
    <Text style={s.emptyTxt}>{p?.children}</Text>
  </View>);


const s = StyleSheet.create({
  empty: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTxt: {
    fontSize: 18,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  banner: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#BBB',
    marginTop: 5,
    flexDirection: 'row'
  },
  txtHolder: {
    width: 160,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
    // backgroundColor: 'pink'
  },
  bannerTxt: {
    fontSize: 18,
    fontFamily: 'monospace',
  },
  chevronStyle: {
    // position: 'absolute',
    // top: 0,
    // right: 5,
    fontSize: 28,
  },
});
