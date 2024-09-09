import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Pressable} from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { UI } from '../model/ui.js';
import { TimeDate } from '../model/time.js';
import { StreakBar } from './streakBar';
import { Hamburger } from './hamburger';
import { TimeBar } from './timeBar';
import { Award } from './awardCell.js'


// const prettyJ = (json) => {
//   if (typeof json !== 'string') {
//     json = JSON.stringify(json, undefined, 2);
//   }
//   return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, 
//     function (match) {
//       let cls = "\x1b[36m";
//       if (/^"/.test(match)) {
//         if (/:$/.test(match)) {
//           cls = "\x1b[34m";
//         } else {
//           cls = "\x1b[32m";
//         }
//       } else if (/true|false/.test(match)) {
//         cls = "\x1b[35m"; 
//       } else if (/null/.test(match)) {
//         cls = "\x1b[31m";
//       }
//       return cls + match + "\x1b[0m";
//     }
//   );
// }
// const PP = (obj)=>console.log(prettyJ(obj));



export function TaskCell(p) {
  // console.log(p.refreshModel);
  const [update, setUpdate] = useState(0);
  const [rewards, setRewards] = useState([]);
  const [award, setAward] = useState(null);

  const refresh = () => {
    p.refreshModel();
    setUpdate(update + 1);
  };

  useEffect(()=>{
    if (rewards.length == 0) return;
    const l = rewards.length; 
    setAward(rewards[l - 1]);
    setTimeout(()=>{
      setAward(null)
    }, 4000)
    setTimeout(()=>setRewards(rewards.slice(0,-1)), 4500);

  }, [rewards.length])


  const e = p.task;
  const colors = UI.colors[e.pursuit.colorScheme];
  const round = p?.round == true;
  const activeDay = p?.day ? p.day : 0;
  const isPast = activeDay < 0;

  const h = e?.totalM ? Math.trunc(e.totalM / 60) : 0;
  const m = e?.totalM ? e.totalM % 60 : 0;
  const streakStr = (e?.streak > 9) ? '' : (e?.calcType == 7) ? 'W' : 'D' 
  const [complete, required] = e?.getUsage ? e.getUsage(activeDay) : [0,0];


  return (
    <Pressable style={[ isPast ? s.isPastContain : s.container, round ? s.rounded : s.pView,
                 {backgroundColor:colors.light, opacity: e?.paused ? 0.5 : 1}]}>
      <View style={s.titleBar}>
        <TouchableOpacity onPress={() => {
          setRewards(rewards.concat(e.registerTime(e.defaultDur, activeDay)));
          refresh();  
        }}>
          { complete >= required 
            ? <FontAwesome6 name="face-smile-beam" size={36} color="black" style={s.face}/>
            : <MaterialIcons name='check-circle-outline' size={41} color='#000' style={s.check}/>
          }
          <View style={s.absolute}>
            <Text style={s.default}>
              {e?.defaultDur && e.defaultDur > 0 && complete < required ? e.defaultDur : null}
            </Text>
          </View>
        </TouchableOpacity>
        <Text numberOfLines={1} style={s.title}>{e?.name}</Text>
        <View style={s.useSpace}/>
        { !isPast
          ? <Hamburger 
              onPress={()=>
                router.navigate({pathname: '/addEditTask', params: {task: e.taskOrder}})
              }
              onLongPress={()=>console.log('longPress')}
              color= {'#000'}
            />
          : <TouchableOpacity onPress={()=>{
              Ui.setTimeColByI(e.pursuit.colorScheme);
              router.replace({pathname:'/timer', params: {task: e.taskOrder}});
          }}>
              <MaterialCommunityIcons name="timer" size={41} color={'#000'}/>
            </TouchableOpacity>
        } 
      </View>
      { !isPast  
        ? <View style={s.streakBarHolder}>
            { e.calcType > 0 && !e.paused 
              ? <StreakBar widths={e.streakBar} color={colors.dark}/> 
              : null 
            }
          </View>
        : null
      }

      <View style={s.bottomRow}>
        <View style={isPast ? s.extendedTimeBar : s.timeBar}>
          <TimeBar timeComplete={complete} timeRequired={e.calcType == -1 ? e.defaultDur : required} 
                   barColor={colors.contrast}/>
        </View>
        { e?.calcType > 0 && !isPast // only daily & 7 day tasks
          ? <Text style={s.streakDur}>{e?.streak + streakStr}</Text> 
          : null
        }
        { isPast || e.calcType == 0
          ? null
          : <Text style={s.time}>{String(h) + 'h' + String(m) + 'm'}</Text>
        }
        { isPast
          ? null
          : <TouchableOpacity onPress={()=>{
            TimeDate.DAY = activeDay;
            UI.setTimeColByI(e.pursuit.colorScheme);
            router.replace({pathname:'/timer', params: {timerTaskI: e.taskOrder}});
          }
          }>
               <MaterialCommunityIcons name="timer" size={43} color={'#000'} style={s.expandedIcon}/>
            </TouchableOpacity>
        }        
      </View>
      { award == null
        ? null
        : <Award 
          colors={colors} 
          timeRequired={required} 
          timeComplete={e.calcType == -1 ? e.defaultDur : complete}
          message={award.message}
          title={award.title}
          star={award.star}
        />
      }
      { e.paused ? <View style={s.paused}><Text style={s.pauseTxt}>P A U S E D</Text></View> : null }
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: {
    height: 100,
  },
  isPastContain: {
    height: 80,
  },
  rounded: {
    marginTop: 5, 
    borderRadius: 10, 
    marginHorizontal: 5
  },
  pView: {
    marginBottom: 1,
  },
  titleBar: {
    height: 44,
    alignItems: 'center',
    flexDirection: 'row',
    paddingTop: 3,
    paddingLeft: 2,
    paddingRight: 10
    // backgroundColor: 'pink'
  },
  useSpace: {
    flexGrow: 1
  },
  check: {
    marginLeft: 2
  },
  face: {
    marginLeft: 4,
    marginRight: 3,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 2,
    bottom: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  default: {
    color: '#fff',
    fontSize: 16
  },
  title: {
    flexShrink: 1,
    fontSize: 24,
    color: '#000',
    marginBottom: 2,
    marginHorizontal: 7,
    // overflow: 'hidden'
    // fontWeight: 'bold',
  },
  duration: {
    fontSize: 20,
    color: 'white'
  },
  streakBarHolder: {
    height: 12,
    // backgroundColor:'yellow',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
    paddingRight: 50
  },
  bottomRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 8,
    paddingRight: 4,
    // backgroundColor: 'pink'
  },
  expandedIcon: {
    marginTop: -3, 
    marginRight: -1
  },
  streakDur: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  time:{
    fontSize: 20,
  },
  timeBar: {
    width: '40%',
    height: 25
  },
  extendedTimeBar: {
    width: '100%',
    height: 24,
    paddingRight: 4,
    marginTop: 3,
  },
  paused: {
    position: 'absolute',
    left: 40,
    right: 40,
    top: 0,
    height: 97,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseTxt: {
    fontSize: 24,
    // fontWeight: 'bold',
    color: '#fff',
  },
});
