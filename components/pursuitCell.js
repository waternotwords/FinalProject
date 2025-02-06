import { StyleSheet, Text, View, Pressable, TouchableOpacity, Dimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TimeBar } from './timeBar';
import { router } from 'expo-router';
import { PursuitGraph } from './pursuitGraph.js';
import { TaskCell } from './taskCell.js';
import { Hamburger } from './hamburger.js';
import { Star } from './star.js';
import { UI } from '../model/ui.js';

export function PursuitCell(p) {
  const e = p.pursuit;
  const h = e?.totalM ? Math.trunc(e.totalM / 60) : 0;
  const m = e?.totalM ? e.totalM % 60 : 0;
  const expanded = p?.expanded;
  const width = Dimensions.get('window').width;

  const FullBar = () => {
    return (
      <View style={s.fullBarContain}>
        <View style={s.streakIndContain}>
          <Star style={s.star} color={UI.colors[e.colorScheme].contrast}>{e.streak}</Star>
        </View>
        <View style={s.statsContain}>
          <Text style={[s.time]}>
            {String(h) + 'h' + String(m) + 'm'}
          </Text>
          <View style={s.barHeight}>
            <TimeBar radius={7} timeComplete={e.completeMin} timeRequired={e.requiredMin} 
                     barColor={UI.colors[e.colorScheme].contrast}/> 
          </View>   
        </View>
      </View>
    );
  }

  const Bar = () => {
    return (
      <View style={s.openBarContain}>
        <View style={s.openBarItem}>
        <TouchableOpacity>
          <MaterialIcons name='add' size={39} color="white" onPress={()=>{
            router.navigate({pathname: '/addEditTask', params: {new: true, prePop: e.key}})
          }}/>
        </TouchableOpacity>
        
        </View>
        <View style={s.openBarItem}>
          <Text style={[s.streakWeeks, {color: UI.colors[e.colorScheme].contrast}]}>
            {e.streak}W
          </Text>
        </View>
        <View style={[s.barHeight, s.openTimeBar]}>
          <TimeBar radius={7} timeComplete={e.completeMin} timeRequired={e.requiredMin} 
            barColor={UI.colors[e.colorScheme].contrast}/> 
        </View>       
      </View>
    );
  }


  const cells = [];
  for(let i = 0; i < e.tasks.length; i++){
    cells.push(<TaskCell refreshModel={p.refreshModel} task={e.tasks[i]} key={i} gap={i > 0 ? 1 : 0}/>)
  }

  return (
    <Pressable 
      onPress={()=>p?.onExpand?.(e.key)}
      style={[s.container, {backgroundColor: UI.colors[e.colorScheme].medium},
        expanded ? s.expandedContain : null]}
      >
      {!expanded 
        ? <View style={s.absoluteBack}>
            <PursuitGraph 
              style={s.graph} 
              width={width - 55} 
              height={95}
              color={UI.colors[e.colorScheme].contrast}
              values={e.tM}
            />
          </View> 
        : null}

      {/* TITLE BAR */}
      <View style={[s.titleBar]}>
        <Text style={s.title}>{e?.name}</Text>

        { expanded 
          ? <Text style={[s.time]}>
              {String(h) + 'h' + String(m) + 'm'}
            </Text>
          : <Hamburger 
              onPress={()=>{
                router.navigate({pathname: '/addEditPursuit', params: {pursuit: e.key}})
              }}
              onLongPress={()=>console.log('longPress')}
            />
        }
      </View>

      {/* Cell Holder */}
      <View >
      { !expanded 
        ? <View style={{height: 75}}/> 
        : ( cells.length > 0 
          ? cells 
          : <EmptyCell pursuit={e}/>
        )
      }
      </View>

      {/* Bottom Bar */}
      { expanded ? <Bar/> : <FullBar/>}
    </Pressable>
  );
}

const EmptyCell = (p) => {
  return (
       <View style={
         [s.noCells, {height: 100, backgroundColor: UI.colors[p.pursuit.colorScheme].contrast}]}>
         <Text>You have not added tasks to this pursuit yet. Add tasks by using the white plus icon below.</Text>
       </View>
     )
 };

const s = StyleSheet.create({
  container: {
    borderRadius: 15,
    marginTop: 10,
    marginRight: 10,
    marginLeft: 10,
    padding: 1,
  },
  expandedContain: {
    padding: 0,
    borderColor: '#002456',
    borderWidth: 1
  },
  star: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  absoluteBack: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1,
    padding: 2.5,
  },
  graph: {
    width: '100%',
    height: '100%',
    paddingTop: 40,
    paddingLeft: 30,
  },
  titleBar: {
    height: 45,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingRight: 10,
      },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    margin: 10
  },
  fullBarContain:{
    height: 55,
    flexDirection: 'row',
    gap: 10,
  },
  streakIndContain: {
    height: 55,
    width: 55,
    marginLeft: 6,

  },
  streakImgTxtContain: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  streakTxt: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  statsContain: {
    justifyContent: 'flex-end',
    paddingRight: 10,
    paddingBottom: 10,
    flex: 1,
  },
  time:{
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#fff',
    paddingRight: 2
  },
  openBarContain: {
    height: 45,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  openBarItem: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakWeeks: {
    fontSize: 23,
    fontWeight: 'bold'
  },
  noCells: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  barHeight: {
    height: 27, 
  },
  openTimeBar: {
    flex: 1,
  }
});
