import { useEffect, useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Pressable, Alert, Keyboard } from 'react-native';
import { router, useNavigation, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearChooser } from '../components/linearChooser';
import { SimpleSwitch } from '../components/simpleSwitch';
import { NumericalChooser } from '../components/numericalChooser.js';
import { Pursuit } from '../model/pursuit.js';
import { TimeDate } from '../model/time.js';
import { UI } from '../model/ui.js';

export default function AddPursuit() {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const i = params?.pursuit ? parseInt(params.pursuit) : null;
  const pursuit = (i != null && i >= 0 && i < Pursuit.PURSUITS.length) ? Pursuit.PURSUITS[i] : null;
  const editMode = pursuit != null;

  useEffect(() => {
    navigation.setOptions({
      presentation: 'modal', 
      title: (editMode) ? 'Edit Pursuit' : 'Add New Pursuit' 
    });
  }, [editMode]);

  const [pData, setPData] = useState(
    (!editMode)
    ? { name:'', startOfWeek:0, color:0, reminders:true, sounds:true, paused:false, init: 0 }
    : {
        name: pursuit.name,
        startOfWeek: pursuit.dayOfWeek,
        color: pursuit.colorScheme,
        reminders: pursuit.reminders,
        sounds: pursuit.sounds,
        paused: pursuit.paused != false,
      }
  );

  const missingName = () => Alert.alert(
    'Missing Name', 'A name is required to create a pursuit.', [{ text: 'OK'}]
  );

  const createNew = ()=>{
    if (pData.name.length < 1) return missingName();

    const p = Pursuit.MakeNew(pData.name, pData.startOfWeek, pData.color,
                    pData.reminders, pData.sounds, pData.init);
    router.back();
    router.setParams({...params, pursuitCreated:p.key, refresh:'true'});
  }

  const editPursuit = () => {
    if (pData.name.length < 1) return missingName();

    if(
      pursuit.name == pData.name &&
      pursuit.dayOfWeek == pData.startOfWeek &&
      pursuit.colorScheme == pData.color &&
      pursuit.reminders == pData.reminders &&
      pursuit.sounds == pData.sounds
    ){
      router.back();
      router.setParams({...params, pursuit:'', refresh:''}); 
      return;
    }

    pursuit.name = pData.name;
    pursuit.dayOfWeek = pData.startOfWeek;
    pursuit.colorScheme = pData.color;
    pursuit.reminders = pData.reminders;
    pursuit.sounds = pData.sounds;
    router.back();
    router.setParams({...params, pursuit:'', refresh:'true'}); 
  }

  return (
    <Pressable style={s.contain} onPress={()=>Keyboard.dismiss()}>
      <View style={s.three}>
        <Text style={[s.label]}>Pursuit Name</Text>
        <View style={[s.nameInputHolder, s.two]}>
          <TextInput 
            style={[s.nameInput]}
            placeholder='Enter Pursuit Name'
            placeholderTextColor={'#777'}
            value={pData.name}
            maxLength={60}
            onChangeText={v => setPData({...pData, name: v.substring(0,60)})}
          />
          <TouchableOpacity style={s.erase} onPress={()=>setPData({...pData, name:''})}>
            <Ionicons name="close" size={22} color="#444" style={{backgroundColor:"#fff"}}/>
          </TouchableOpacity>     
        </View>
      </View>

      <View style={s.three}>
        <Text style={[s.label]}>Start of Week for Minutes Calculation</Text>
        <LinearChooser
          elements={ TimeDate.daysOfWeek.map(
            (e, i) => ({ text: e, selected: pData.startOfWeek == i })
          )}
          callback={(_, i)=>{setPData({...pData, startOfWeek: i})}}
          radio={true}
          style={s.two}
        />        
      </View>

      <View style={s.three}>
        <Text style={[s.label]}>Pursuit & Tasks Color Theme</Text>
        <LinearChooser
          elements={UI.colors.slice(0,8).map((e,i)=>({color: e.medium, selected: pData.color == i}))}
          callback={(_, i)=>setPData({...pData, color: i})}
          style={s.two}
          radio={true}
        />        
      </View>

      <View style={[s.three]}>
        <Text style={[s.label]}>Reminder Notifications for All Tasks</Text>
        <View style={s.horizontal}>
            <View style={s.switchContain}>
              <SimpleSwitch 
                isOn={pData.reminders} 
                onChange={isOn=>setPData({...pData, reminders: isOn})}/>
            </View>
            <View style={s.miniButtContain}>
              { !editMode
                ? null
                : <TouchableOpacity 
                    style={[s.button, s.green, {height: '100%', opacity: pData.reminders ? 1 : 0.7}]}
                  >
                    <Text style={s.miniButtTxt}>Turn All On</Text>
                  </TouchableOpacity>
              }
            </View>
            <View style={s.miniButtContain}>
              { !editMode
                  ? null
                  : <TouchableOpacity 
                      style={[s.button, s.red, {height: '100%', opacity: pData.reminders ? 1 : 0.7}]}
                    >
                      <Text style={s.miniButtTxt}>Turn All Off</Text>
                    </TouchableOpacity>
              }
            </View>
        </View>
      </View>

      <View style={[s.three]}>
        <Text style={[s.label]}>Achievement Sounds for All Tasks</Text>
        <View style={s.horizontal}>
            <View style={s.switchContain}>
              <SimpleSwitch
                isOn={pData.sounds} 
                onChange={isOn=>setPData({...pData, sounds: isOn})}/>
            </View>
            <View style={s.miniButtContain}>
              { !editMode
                ? null
                : <TouchableOpacity 
                    style={[s.button, s.green, {height: '100%', opacity: pData.sounds ? 1 : 0.7}]}
                  >
                    <Text style={s.miniButtTxt}>Turn All On</Text>
                  </TouchableOpacity>
              }
            </View>
            <View style={s.miniButtContain}>
              { !editMode
                  ? null
                  : <TouchableOpacity 
                      style={[s.button, s.red, {height: '100%', opacity: pData.sounds ? 1 : 0.7}]}
                    >
                      <Text style={s.miniButtTxt}>Turn All Off</Text>
                    </TouchableOpacity>
              }
            </View>
        </View>
      </View>

      { editMode
        ? null
        : <View style={s.three}>
            <Text style={[s.label]}>Starting Hours for Pursuit</Text>
            <NumericalChooser 
              initialValue={pData.init} 
              max={10000}
              min={0}
              onChange={(v)=>setPData({...pData, init: v})}
              hours={true}
              style={[s.two, {width: '50%'}]}/>
          </View>
      }


      <View style={editMode ? s.buttonContain : s.smallButtContain}>
        <TouchableOpacity
          onPress={
            editMode 
            ? ()=>Alert.alert('Delete Pursuit?', 
              'Warning! Deleting a pursuit cannot be undone. All associated tasks will also be deleted. Are you sure you want to delete the pursuit: ' + pursuit.name + '?', 
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => {
                    pursuit.delete(()=>{
                      router.back();
                      router.setParams({...params, pursuit:'', refresh:'true'}); 
                    }); 
                    
                  }},
              ]) 
            : ()=>{
                router.back();
                router.setParams({...params, pursuit:'', refresh:''})
              }
          } 
          style={[s.button, s.red]}
        >
          <Text style={s.buttTxt}>{ editMode ? 'DELETE PURSUIT' : 'CANCEL'}</Text>
        </TouchableOpacity>
        { editMode
          ? <TouchableOpacity 
          style={[s.button, s.orange]}
          onPress={()=>{
            if(pData.paused){ 
              unPauseTask(()=>{
                setPData({...pData, paused: false});
                pursuit.paused = false;
                setTimeout(()=>{
                  router.back();
                  router.setParams({...params, pursuit:'', refresh:''});
                }, 20);
              });
            } else {
              pauseTask(()=>{
                setPData({...pData, paused: true});
                pursuit.paused = true
                setTimeout(()=>{
                  router.back();
                  router.setParams({...params, pursuit:'', refresh:''});
                }, 20);
              });
            }
          }}>
           <Text style={s.buttTxt}>{pData.paused ? 'UNPAUSE All TASKS' : 'PAUSE ALL TASKS'}</Text>
         </TouchableOpacity>
          : null
        }
        <TouchableOpacity 
          style={[s.button, s.green]}
          onPress={editMode ? editPursuit : createNew}
        >
          <Text style={s.buttTxt}>OK</Text>
        </TouchableOpacity>
      </View>

      <View style={s.bottom}>

      </View>
    </Pressable>
  );
}

const pauseTask = (onOK) => Alert.alert(
  'Pause All Tasks', 
  'Pausing a task removes all remaining required minutes for that task. Paused tasks do not show up in the Task List', 
  [{ text: 'Cancel', style: 'cancel' }, { text: 'Pause', onPress: onOK}]
);
const unPauseTask = (onOK) => Alert.alert(
  'Resume All Tasks', 
  'When tasks are un-paused any required minutes that were remaining when it was paused will be required in the current period. Tasks will once again show in the Task List.', 
  [{ text: 'Cancel', style: 'cancel' }, { text: 'Unpause', onPress: onOK}]
);

const s = StyleSheet.create({
  contain: { 
    flex: 1, 
    alignItems: 'left', 
    justifyContent: 'space-between',
    margin: 10
  },
  nameInputHolder: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  nameInput: {
    flexGrow: 1,
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 5,
    fontSize: 18,
    paddingHorizontal: 12
  },
  erase: {
    height:'100%', 
    width:30, 
    alignItems:'left', 
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    width: '100%',
    fontSize: 18,
    textAlignVertical: 'center',
    justifyContent: 'center',

  },
  two: {
    flex: 2,
    width: '100%',
    maxHeight: 38
  },
  three: {
    height: '11%',
    maxHeight: 70,
    width: '100%',
  },  
  horizontal: { 
    flexDirection: 'row',
    width: '100%',
    justifyContent:'space-between'
  },

  numContainer: {
    flex: 1,
    height: '100%',
  },
  bottom: {
    height: 1,
  },
  switchContain: {
    height: '100%',
    aspectRatio: 2.5,
    maxHeight: 38,
  },
  miniButtContain: {
    height: '100%',
    aspectRatio: 3.2,
    maxHeight: 38,
  },
  buttonContain: {
    // height: '22%',
    // maxHeight: 125,
    gap: 10,
    width: '100%',
  },
  smallButtContain: {
    // height: '20%',
    // maxHeight: 100,
    gap: 10,
    width: '100%',
  },
  button: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    width: '100%' ,
    alignItems: 'center', 
    justifyContent: 'center',
  },  
  miniButtTxt: {
    color: '#fff',
    fontSize: 18
  },
  buttTxt: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 18
  },
  red: {
    backgroundColor: '#C0554f',
  },
  orange: {
    backgroundColor: '#ffA666',
  },
  green: {
    backgroundColor: '#5f8735',
  }
});
