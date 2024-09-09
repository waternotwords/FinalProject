
import { useContext, useState } from 'react';
import { Tabs, Link, router } from 'expo-router';
import { View, Button, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MODEL } from '../../model/globalContext.js';
import { COLOR } from '../../model/ui.js';
import { TimeDate } from '../../model/time.js';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Octicons from '@expo/vector-icons/Octicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';



export default function TabLayout() {
  const model = useContext(MODEL);
  const c = useContext(COLOR);
  const [update, setUpdate] = useState(0);
  const refresh = ()=>{
    model.refresh();
    setUpdate(update + 1);
  }
  const grey = c.grey;

  const IndexPrevButton = () => (
    <TouchableOpacity style={s.leftButt} onPress={()=>{
      // the index page should go to yesterday if in future
      if (TimeDate.DAY == 1) TimeDate.prevDay;

      TimeDate.prevDay();
      refresh();
    }}>
      <Ionicons name='chevron-back-sharp' size={35} color="white" />
      <Text style={[s.txt, {marginBottom: 1}]}>
        {/* The index page should show as if it is today  */}
        {TimeDate.dayText(TimeDate.DAY > 0 ? -1 : TimeDate.DAY - 1)}
      </Text>
    </TouchableOpacity>
  );

  const TimerPrevButton = () => (
    <TouchableOpacity style={s.leftButt} onPress={()=>{
      TimeDate.prevDay();
      refresh();
    }}>
      <Ionicons name='chevron-back-sharp' size={35} color="white" />
      <Text style={[s.txt, {marginBottom: 1}]}>
        {TimeDate.dayText(TimeDate.DAY - 1)}
      </Text>
    </TouchableOpacity>
  );

  const NextDayButton = (p) => (
    <TouchableOpacity style={s.leftButt} onPress={()=>{
      TimeDate.nextDay()
      refresh();
    }}>
      <Text style={[s.txt]}>
        {TimeDate.dayText(TimeDate.DAY + 1)}
      </Text>
      <Ionicons name='chevron-forward-sharp' size={35} color="white"/>
    </TouchableOpacity>
  )

  const ResetDayButton = () => ( 
    <TouchableOpacity style={s.leftButt} onPress={() => {
      TimeDate.resetDay();
      refresh();
    }}>
      <Text style={s.txt}>Today</Text>
      <Ionicons name='chevron-forward-sharp' size={35} color="white"/>
    </TouchableOpacity>
  );

  const AddTaskButton = ()=> (
    <TouchableOpacity style={s.leftButt} onPress={() => {
      router.navigate({pathname: '/addEditTask'})
    }}>
    <Text style={[s.txt, {marginTop: 2}]}>Add Task</Text>
    <MaterialIcons name='add' size={39} color="white" />
    </TouchableOpacity>
  );

  const AddPursuitButton = ()=> (
    <TouchableOpacity style={s.leftButt} onPress={() => {
      router.navigate({pathname: '/addEditPursuit'});
    }}>
    <Text style={[s.txt, {marginTop: 2}]}>Add Pursuit</Text>
    <MaterialIcons name='add' size={39} color="white" />
    </TouchableOpacity>
  );


  const TimeTravelForward = (p) => (
    <TouchableOpacity style={s.leftButt} onPress={()=>{
      TimeDate.futureDays++;
      model.refresh();
    }}>
      <Text style={[s.txt]}>
        {(()=>{
          const d = new Date(Date.now() + (TimeDate.futureDays + 1) * TimeDate.secsPerDay());
          const m = TimeDate.months[d.getMonth()];
          const dom = d.getDate();
          return m + ' ' + dom;
        })()}
      </Text>
      <Ionicons name='chevron-forward-sharp' size={35} color="white"/>
    </TouchableOpacity>
  );

  const TimeTravelBack = () => (
    <TouchableOpacity style={s.leftButt} onPress={()=>{
      TimeDate.futureDays--;
      model.refresh();
    }}>
      <Ionicons name='chevron-back-sharp' size={35} color="white" />
      <Text style={[s.txt]}>
        {(()=>{
          const d = new Date(Date.now() + (TimeDate.futureDays - 1) * TimeDate.secsPerDay());
          const m = TimeDate.months[d.getMonth()];
          const dom = d.getDate();
          return m + ' ' + dom;
        })()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Tabs
      initialParams={{route:'tabs2'}}
      screenOptions={{ 
        tabBarInactiveTintColor: grey.light,
        tabBarStyle:{paddingBottom: 0, backgroundColor: grey.dark},
        tabBarItemStyle: {justifyContent:'flex-end'},
      }}
    >
      
      <Tabs.Screen
        name="index"
        initialParams={{route:'index'}}
        options={{
          headerTitle: 'Task List' ,  // TimeDate.dayText(TimeDate.DAY), 
          headerTitleStyle: {color:'white', fontSize:20},
          tabBarShowLabel: false,
          headerBackground: ()=><View style={{backgroundColor:'#2C2C2C', flex:1}}/>,
          headerLeft: TimeDate.DAY == -6 ? null : IndexPrevButton,
          headerRight: TimeDate.DAY >= 0 ? AddTaskButton : ResetDayButton,
          tabBarIcon: ({color}) => <FontAwesome size={40} name="check-square" color={color}/>,
          tabBarActiveTintColor: '#EEE', 
        }}
      />
      <Tabs.Screen
        name="categories"
        initialParams={{route:'categories'}}
        options={{
          headerTitle:'Pursuits',
          headerTitleStyle:{color:'white', fontSize:20},
          headerBackground: ()=><View style={{backgroundColor: c.catC.dark, flex:1}}/>,          
          tabBarShowLabel: false,
          headerRight: AddPursuitButton,
          tabBarIcon: ({ color }) => <Octicons name="rows" size={36} color={color} />,
          tabBarActiveTintColor: c.catC != c.grey ? c.catC.contrast : '#EEE', 
        }}
      />
      <Tabs.Screen
        name="timer"
        initialParams={{route:'timer'}}
        options={{
          title: 'Task Timer',
          headerTitle: TimeDate.DAY == 0 ? 'Task Timer' : TimeDate.dayText(),
          headerTitleStyle:{color:'white', fontSize:20},
          tabBarShowLabel: false,
          headerBackground: ()=><View style={{backgroundColor: c.timeC.dark, flex:1}}/>,          
          headerLeft: TimeDate.DAY == -6 ? null : TimerPrevButton,
          headerRight: 
            (TimeDate.DAY < 0) 
            ? ResetDayButton
            : TimeDate.DAY > 0 ? null : NextDayButton,
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="timer" size={45} color={color} />,
          tabBarActiveTintColor: c.timeC != c.grey ? c.timeC.contrast : '#EEE', 
        }}
      />
      <Tabs.Screen
        name="settings"
        initialParams={{route:'settings'}}
        options={{
          headerTitle:'App Info',
          headerTitleStyle:{color:'white', fontSize:20},
          headerBackground: ()=><View style={{backgroundColor:'#2C2C2C', flex:1}}/>,
          headerRight: ()=><TimeTravelForward />,
          headerLeft: ()=><TimeTravelBack />,          
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => <FontAwesome6 size={38} name="gear" color={color} />,
          tabBarActiveTintColor: '#EEE', 
        }}
      />

    </Tabs>
  );
}



const s = StyleSheet.create({
  leftButt: {
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center',
  },
  txt: {
    color: '#fff',
    fontSize: 18,
    textAlignVertical: 'center',
  },
});


