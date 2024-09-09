import { StyleSheet, View } from 'react-native';


const Cell = (p) => {
  const forCol = p?.color ? p.color : '#042164';
  const backCol = '#fff';
  const w = p?.width ? String(p.width * 100) + '%' : '0%';

  return (
  <View style={[s.holder, {backgroundColor:backCol}]}>
    <View style={[s.cellBar, {backgroundColor:forCol, width:w}]}/>
  </View>
  );
}

export const StreakBar = (p) => { 

  return (
  <View style={s.container}>
    { p.widths.map((v,i) => <Cell style={p.style} width={v} key={i} color={p?.color}/>)}
  </View>
)};



const s = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
    // backgroundColor: 'red'
  },
  holder: {
    borderRadius: 3,
    // padding: 1,
    flex: 1,
    height: 8,
  },
  cellBar: {
    borderRadius: 2,
    height: '100%',
  } 
});
