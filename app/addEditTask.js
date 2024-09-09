import { useEffect, useState, useRef} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions,
         TextInput, Alert, Keyboard, Pressable } from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { router, useNavigation, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearChooser } from '../components/linearChooser';
import { NumericalChooser } from '../components/numericalChooser';
import { SimpleSwitch } from '../components/simpleSwitch';
import { Notify } from '../model/notifications.js';
import { DropDown } from '../components/dropDown';
import { TimeDate } from '../model/time.js';
import { Task } from '../model/task.js';
import { Pursuit } from '../model/pursuit.js';

export default function AddTask(){
  const navigation = useNavigation();
  const pursuitsLen = useRef(Pursuit.PURSUITS.length);
  const params = useLocalSearchParams();
  const i = params?.task ? parseInt(params.task) : null;
  const task = (i != null && i >= 0 && i < Task.TASKS.length) ? Task.TASKS[i] : null;
  const pI = !task && params?.prePop ? params.prePop : null;
  const prePop = (pI != null && i >=0 && i < Pursuit.PURSUITS.length) 
                  ? Pursuit.PURSUITS[pI]: null;
  const editMode = params?.new != 'true' && task;
  const short = Dimensions.get('window').height < 718;
  const [tData, setTData] = useState(editMode ? existingTaskState(task) : getNewState(prePop));
  const changes = changesHaveBeenMade(task, tData);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      presentation: 'modal', 
      title: (editMode) ? 'Edit Task' : 'Add Task' 
    });
  }, [editMode]);

  // if a pursuit was created, make it the pursuit the task will be part of
  if(pursuitsLen.current != Pursuit.PURSUITS.length){
    if(pursuitsLen.current < Pursuit.PURSUITS.length){
      setTData({...tData, pursuit: Pursuit.PURSUITS[Pursuit.PURSUITS.length - 1]});
    }
    pursuitsLen.current = Pursuit.PURSUITS.length;
  }

  return (
    <Pressable style={[s.contain]} onPress={()=>Keyboard.dismiss()}>
      <View style={s.three}>
        <Text style={[s.label]}>Pursuit Category</Text>
        <DropDown
          data={Pursuit.PURSUITS}
          selected={tData?.pursuit?.key}
          onSelect={(val)=>setTData({...tData, pursuit: val})} 
          // setTimeout because SelectDropdown uses conflicting navigation
          addItemButtonCallBack={()=>setTimeout(
            ()=>router.navigate({pathname: '/addEditPursuit', params: {new: true}}), 20
          )}
          addItemButtonText={'Add New Pursuit'}
          style={s.two}
        />
      </View>

      <View style={s.three}>
        <Text style={[s.label]}>Task Name</Text>
        <View style={[s.nameInputHolder, s.two]}>
          <TextInput 
            style={[s.nameInput]}
            placeholder='Enter Task Name'
            placeholderTextColor={'#777'}
            value={tData.name}
            maxLength={60}
            onChangeText={v => setTData({...tData, name: v.substring(0,60)})}
          />
          <TouchableOpacity style={s.erase} onPress={()=>setTData({...tData, name:''})}>
            <Ionicons name="close" size={22} color="#444" style={{backgroundColor:"#fff"}}/>
          </TouchableOpacity>     
        </View>
      </View>

      <View style={s.three}>
        <Text style={[s.label]}>Minutes Calculation Period</Text>
        <LinearChooser
          elements={[
            {text:'Once', selected:tData.calcType == TimeDate.calcPeriod[0]},
            {text:'Daily', selected:tData.calcType == TimeDate.calcPeriod[1]},
            {text:'7 Days', selected:tData.calcType == TimeDate.calcPeriod[2]},
            {text:'Anytime', selected:tData.calcType == TimeDate.calcPeriod[3]}
          ]}
          callback={(_, index)=>setTData({
            ...tData, 
            calcType: TimeDate.calcPeriod[index], 
            minDur: (index < 3 && tData.minDur == 0) ? tData.defaultDur : tData.minDur,
          })}
          radio={true}
          style={s.two}
        />        
      </View>

      { tData.calcType != 1
        ? null
        : <View style={s.three}>
            <Text style={[s.label]}>Days of the Week</Text>
            <LinearChooser
              elements={TimeDate.daysOfWeek.map((e,i)=>({text:e, selected:tData.daysMap[i]}))}
              callback={(v, i, arr)=>setTData({...tData, daysMap: arr})}
              style={s.two}
            />        
          </View>
      }

      <View style={[s.three, s.horizontal, {gap: short ? 10 : 50}]}>
        <View style={[s.numContainer]}>
          <Text style={[s.label]}>Default Usage Time</Text>
          <NumericalChooser 
            initialValue={tData.defaultDur} 
            max={1200}
            min={0}
            onChange={(v)=>setTData({...tData, defaultDur: v})}
            style={s.two}/>
        </View>
        <View style={[s.numContainer]}>
          { // don't show if anytime is selected
            tData.calcType == TimeDate.calcPeriod[3] 
            ? null 
            : <Text style={[s.label]}>{totalMinStr(tData.calcType)}</Text> 
          }
          { tData.calcType == TimeDate.calcPeriod[3]
            ? null 
            :  <NumericalChooser 
                initialValue={tData.minDur} 
                style={s.two}
                min={0}
                onChange={(v)=>setTData({...tData, minDur: v})}
              />
          }
        </View>
      </View>

      { tData.calcType == 1
        ? null
        : <View style={s.three}>
            <Text style={[s.label]}>Reminder Days</Text>
            <LinearChooser
              elements={TimeDate.daysOfWeek.map((e,i)=>({text:e, selected:tData.daysMap[i]}))}
              callback={(v, i, arr)=>setTData({...tData, daysMap: arr})}
              noChoiceOK={true}
              style={s.two}
            />        
          </View>
      }

      <View style={[s.three, s.horizontal]}>
        <View style={{height: '100%', flex: 1}}>
          <Text style={[s.label]}>Reminders</Text>
          <View style={s.switchContain}>
            <SimpleSwitch
              isOn={tData.reminders} 
              onChange={async (isOn, revert)=>{              
                const s = await Notify.switch(false, ()=>{
                  if (isOn) revert(); 
                });
                setTData({...tData, reminders: s});
              }}
            />
          </View>
        </View>
        <View style={{flex: 1, alignItems: 'center'}}>
          <Text style={[s.label, {textAlign: 'center'}]}>Notify Time</Text>
          <View style={s.switchContain}>
            <TouchableOpacity 
              style={[{height: '100%'}, s.button, tData.reminders ? s.green : s.grey]}
              onPress={()=>setShowPicker(true)}
            >
              <Text style={{color: '#fff', fontSize: 18, fontVariant: ['tabular-nums']}}>
                {TimeDate.twelveHourTimeStr(tData?.reminderTime)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{flex: 1, alignItems: 'flex-end'}}>
          <Text style={[s.label, {textAlign: 'right'}]}>Time of Day</Text>
          <View style={s.switchContain}>
            <LinearChooser 
              elements={[{text:'AM'}, {text:'PM'}]}
              callback={(v, i)=> setTData({
                ...tData, reminderTime: TimeDate.setAMPM(tData?.reminderTime, i==0)
              })}
              style={s.two}
              radio={true}
              selectColor={!tData.reminders ? '#999' : null }
              manualSingleSelect={TimeDate.getAM(tData.reminderTime) ? 0 : 1}
            />
          </View>
        </View>
      </View>

      <DateTimePickerModal
        isVisible={showPicker}
        mode='time'
        date={tData.reminderTime}
        onConfirm={(d)=>{
          setShowPicker(false);
          setTData({...tData, reminderTime: d});
        }}
        onCancel={()=>setShowPicker(false)}
      />

      <View style={editMode ? s.buttonContain : s.smallButtContain}>
        <TouchableOpacity
          onPress={
            (editMode) 
            ? ()=>deleteWarn(tData.name, ()=>{
                task.delete();
                setTimeout(()=>{
                  router.back();
                  router.setParams({...params, refresh:'true'});
                },10);  
              })
            : ()=>{
                router.back();
                router.setParams({...params, refresh:'', prePop:'', task:''}); 
              } 
          }
          style={[s.button, s.red, {height: short ? 38 : 44}]}
        >
          <Text style={s.buttTxt}>{ editMode ? 'DELETE TASK' : 'CANCEL'}</Text>
        </TouchableOpacity>
        { editMode 
          ? <TouchableOpacity
             style={[s.button, s.orange, {
                height: short ? 38 : 44, 
                opacity: changes ? 0.5 : 1} 
              ]}
             onPress={
              changes
              ? ()=>saveBeforePause()
              : task.paused 
                ? ()=>unPauseTask(()=>{
                    task.paused = false;
                    router.back();
                    router.setParams({...params, task:'', refresh:''}); 
                  })
                : ()=>pauseTask(()=>{
                    task.paused = true;
                    router.back();
                    router.setParams({...params, task:'', refresh:''});  
                  })
              }>
              <Text style={s.buttTxt}>{tData.paused ? 'UNPAUSE TASK' : 'PAUSE TASK'}</Text>
            </TouchableOpacity>
          : null
        }
        <TouchableOpacity 
          style={[s.button, s.green, {height: short ? 38 : 44}]}
          onPress={editMode ? ()=>editTask(task, tData, params) : ()=>createNew(tData, params)}
        >
          <Text style={s.buttTxt}>OK</Text>
        </TouchableOpacity>
      </View>
      { short ? null : <View style={s.bottom}/> }

    </Pressable>
  );
}


const getNewState = (pursuit) => ({ 
  name:'',
  pursuit: pursuit,
  calcType:1, 
  daysMap:[false,true,true,true,true,true,false], 
  minDur:20, 
  defaultDur:10, 
  reminders:false, 
  paused:false,
  reminderTime: new Date(1997, 11, 10, 11, 30)
});

const existingTaskState = (task) => {
  console.log(task.name, task.reminders, TimeDate.twelveHourTimeStr(task.reminderTime));
  return ({
  name: task.name,
  pursuit: task.pursuit,
  calcType: task.calcType,
  daysMap: task.daysMap,
  minDur: task.minDur,
  defaultDur: task.defaultDur,
  reminders: task.reminders,
  // paused is a date in the model
  paused: task.paused != false,
  reminderTime: task.reminderTime
});
};


const createNew = (tData, params)=>{
  if (tData.name.length < 1) return missingName();
  if (tData.pursuit == null) return missingPursuit();

  const minDur = (tData.calcType == TimeDate.calcPeriod[3]) ? 0 : tData.minDur;

  // console.log(tData.pursuit.name, tData.name, tData.calcType, minDur, tData.defaultDur, tData.daysMap, tData.reminders);

  const t = Task.MakeNew(tData.pursuit, tData.name, tData.calcType, minDur, 
                          tData.defaultDur, tData.daysMap, tData.reminderTime, tData.reminders);


  router.back();
  router.setParams({...params, taskCreated:t.taskOrder, refresh:'true', prePop:''});
}



const editTask = (task, tData, params) => {
  if (tData.name.length < 1) return missingName();
  if (tData.pursuit == null) return missingPursuit();

  // check if data has not changed just go back
  if(!changesHaveBeenMade(task, tData)){ 
    router.back();
    router.setParams({...params, task:'', refresh:''});    
    return
  // otherwise refresh is needed
  } 
  
  // if (task.calcType != tData.calcType) console.log("addEditTask.js");

  task.name = tData.name;
  task.pursuit = tData.pursuit;
  task.daysMap = tData.daysMap;
  task.defaultDur = tData.defaultDur;
  task.reminderTime = tData.reminderTime;
  task.reminders = tData.reminders;
  const minDur = (tData.calcType == TimeDate.calcPeriod[3]) ? 0 : tData.minDur;
  task.minDur = minDur;
  task.calcType = tData.calcType;
  router.back();
  router.setParams({...params, task:'', refresh:'true'}); 
}


const changesHaveBeenMade = (task, tData)=>{
  if (!task) return true;
  if(
    task.name == tData.name &&
    task.pursuit == tData.pursuit &&
    task.calcType == tData.calcType &&
    task.daysMap == tData.daysMap &&
    task.defaultDur == tData.defaultDur &&
    task.reminders == tData.reminders &&
    task.reminderTime.valueOf() == tData.reminderTime.valueOf() &&
    (task.minDur == tData.minDur || tData.calcType == TimeDate.calcPeriod[3]))
  return false;

  return true;
}

const totalMinStr = (calcType)=>{
  let s = 'Required ';
  if (calcType == 0) return s + 'Total';
  s += (calcType == 1 ? 'Per Day' : 'Per Week');
  return s;
}


const missingName = () => Alert.alert(
  'Missing Name', 'A name is required to create a new task.', [{ text: 'OK'}]
);
const missingPursuit = () => Alert.alert(
  'Missing Pursuit Category', 'All tasks must be assigned to a pursuit.', [{ text: 'OK'}]
);
const saveBeforePause = () => Alert.alert(
  'Save Changes First', 'Please confirm your changes to this task before pausing or unpausing.', [{ text: 'OK'}]
);
const deleteWarn = (name, onDelete) => Alert.alert(
  'Delete Task?', 'Warning! Deleting a task cannot be undone. Are you sure you want to delete the task: ' + name + '?', 
  [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: onDelete }]
);
const pauseTask = (onOK) => Alert.alert(
  'Pause Task', 
  'Pausing a task removes all remaining required minutes for that task. Paused tasks do not show up in the Task List', 
  [{ text: 'Cancel', style: 'cancel' }, { text: 'Pause', onPress: onOK}]
);
const unPauseTask = (onOK, calcType) => {
  let m;
  if (calcType = 1)
    m = 'When a daily task is un-paused any completed minutes from the day it was paused will be subtracted from the required minutes of the current day.';
  else if (calcType = 7)
    m =  'When a 7-day task is un-paused any required minutes that were remaining when it was paused will be required in the current 7-day period.';
  else m = 'Task will once again show up in the Task List.'
  Alert.alert(
    'Resume Paused Task', m, 
    [{ text: 'Cancel', style: 'cancel' }, { text: 'Resume', onPress: onOK}]
  )
} 


const s = StyleSheet.create({
  contain: { 
    flex: 1, 
    alignItems: 'left', 
    justifyContent: 'space-between',
    padding: 10,
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
    width: '100%',
    fontSize: 18,
    textAlignVertical: 'center',
    paddingBottom: 3,
  },
  two: {
    width: '100%',
    height: 38
  },
  three: {
    height: '11%',
    maxHeight: 70,
    width: '100%',
  },
  horizontal: { 
    flexDirection: 'row',
    gap: 10
  },
  numContainer: {
    flex: 1,
    height: '100%',
  },
  bottom: {
    height: 1,
  },
  switchContain: {
    flex: 2,
    aspectRatio: 2.5,
    maxHeight: 38,
  },
  buttonContain: {
    gap: 10,
    width: '100%',
  },
  smallButtContain: {
    gap: 10,
    width: '100%',
  },
  button: {
    height: 38,
    borderWidth: 1,
    borderRadius: 5,
    width: '100%' ,
    alignItems: 'center', 
    justifyContent: 'center',
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
  },
  grey: {
    backgroundColor: '#999',
  }
});
