// ALARM SOUND
// https://freesound.org/people/deleted_user_4397472/sounds/383468/
// https://creativecommons.org/publicdomain/zero/1.0/

import { useEffect, useState, useRef, useContext} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState, Dimensions, Alert } from 'react-native';
import { router, useLocalSearchParams} from 'expo-router';
import { MODEL } from "../../model/globalContext.js"; 
import { Task } from '../../model/task.js';
import { Pursuit } from '../../model/pursuit.js';
import { TimeDate } from '../../model/time.js';
import { COLOR } from '../../model/ui.js';
import { LinearGradient } from 'expo-linear-gradient';
import { DropDown } from '../../components/dropDown.js';
import { TimeBar}  from '../../components/timeBar.js';
import { NumericalChooser}  from '../../components/numericalChooser.js';
import { CircularProgress}  from '../../components/circularProgress.js';
import { SimpleSwitch } from '../../components/simpleSwitch.js';
import { Storage } from '../../model/storage.js';
import { PlayButton, PauseButton, StopButton } from '../../components/mediaButtons.js';
import { Award } from '../../components/awardCell.js';
import { Notify } from '../../model/notifications.js';
import * as Notifications from "expo-notifications";

const M = Storage();
const initTimed = { startTime: 0, elapsed: 0, playing: false };


Notifications.setNotificationHandler({
  handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
  }),
});


export default function Tab(){
  const model = useContext(MODEL);
  // if not redirect from past day in task list change to today better to do in taskCell not here
  // useFocusEffect(()=>model.navigationTookPlaceTo('timer', true));

  const color = useContext(COLOR);
  const short = Dimensions.get('window').height < 718;
  const backgroundState = useRef(AppState.currentState);
  const playRef = useRef(null);
  const [rewards, setRewards] = useState([]);
  const [award, setAward] = useState(null);


  useEffect(()=>{
    if (rewards.length == 0) return;
    console.log("AWARD SET");
    const l = rewards.length; 
    setAward(rewards[l - 1]);
    setTimeout(()=>{
      setAward(null)
    }, 4000)
    setTimeout(()=>setRewards(rewards.slice(0,-1)), 4500);

  }, [rewards.length])

  const [dropState, setDropState] = useState({p: null, t: null, i: null});
  const [target, setTarget] = useState(20);
  const [notify, setNotify] = useState(false);
  const [notifyID, setNotifyID] = useState(false);
  const [timed, setTimed] = useState(initTimed);
  const setters = {
    setDropState:setDropState, 
    setTarget:setTarget, 
    setTimed:setTimed, 
    setNotify:setNotify, 
    setNotifyID:setNotifyID
  }
  const params = useLocalSearchParams();
  const { taskCreated, pursuitCreated, timerTaskI, route } = params;
  const i = timerTaskI ? parseInt(timerTaskI) : null;
  const task = (i != null && i >= 0 && i < Task.TASKS.length) ? Task.TASKS[i] : null;

  // console.log(timed);

  useEffect(() => {
    if (route != 'timer') return;

    if(task){
      taskChange(t, color, timed, notify, notifyID, setters);
    } else if(taskCreated){
      const t = Task.TASKS[Task.TASKS.length - 1];
      taskChange(t, color, timed, notify, notifyID, setters);
    } else if(pursuitCreated){
      const p = Pursuit.PURSUITS[Pursuit.PURSUITS.length -1];
      pChange(p, color, timed, notify, notifyID, setters);
    }
    router.setParams({taskCreated: '', pursuitCreated: '', refresh: '', timerTaskI: ''});

  }, [taskCreated, pursuitCreated, task]);

  const adjustedTimeOut = () => {
    if (!timed.playing) return;

    const ms = (timed.elapsed && timed.elapsed >= 0.85) ? 1000 : 99;
    const elapsedMS = Date.now() - timed.startTime;
    const adjustedMS =  ms - (elapsedMS % ms);
    playRef.current = setTimeout(() => {
      setTimed({...timed, elapsed: (Date.now() - timed.startTime) / 1000});
      adjustedTimeOut();
    }, adjustedMS);
  }

  useEffect(()=>{
    if (timed.playing && playRef.current == null) adjustedTimeOut();
    else if (!timed.playing && playRef.current != null){
      clearTimeout(playRef.current);
      playRef.current = null;
    } 
  }, [timed.playing]);

  useEffect(() => {
    // based on: https://reactnative.dev/docs/appstate
    const listener = AppState.addEventListener("change", nextState => {
      if(backgroundState.current.match(/inactive|background/) && nextState === 'active')
        restoreState(setters);
      
      backgroundState.current = nextState;
    }); 
    return () => listener.remove();
  }, []);

  const setPlayState = (shouldPlay)=>{
    console.log("SHOUD PLAY", shouldPlay);
    if (shouldPlay){
      const t = {
        startTime: Date.now() - timed.elapsed * 1000,
        elapsed: timed.elapsed, 
        playing: true
      }
      
      if (notify)
        scheduleNotification(dropState, target, t, notify, notifyID, setters);
      else
        cacheState(dropState, target, t, false, false, setters);
    } 
    else {
      if (playRef.current != null) clearTimeout(playRef.current);

      cancelNotification(notifyID, setNotifyID);
      const resetT = {...initTimed, elapsed: timed.elapsed};
      cacheState(dropState, target, resetT, notify, false, setters);
    } 
  }

  const stop = (clearAll)=>{
    if (playRef.current != null) clearTimeout(playRef.current);

    cancelNotification(notifyID, setNotifyID);
    cacheState(dropState, target, initTimed, notify, false, setters);

    if (clearAll){
      color.resetTimeC();
      setDropState({p: null, t: null, i: null});
      wipeCache();
    } 
  }

  const [complete, required] = dropState?.t 
                              ? dropState.t.getUsage(TimeDate.DAY) 
                              : [0,0];
  const c = color.timeC;
  const elapsed = Math.round(timed.elapsed);
  const percent = Math.min(100,Math.round(elapsed / (target * 60) * 100));
  let timeStr;
  const ms = (timed.elapsed && timed.elapsed < 1) ? Math.trunc(timed.elapsed * 100) : null;
  const msStr = (ms < 10) ? '0' + String(ms) : String(ms); 
  const seconds = elapsed % 60;
  const minutes = (elapsed - seconds) / 60;
  const minStr = minutes < 10 ? "0" + String(minutes) : String(minutes);
  if (ms) timeStr = '00:' + msStr;
  else if (minutes > 59) timeStr = String(Math.trunc(minutes / 60)) + ':' + minStr;
  else timeStr = minStr + ':' + (seconds < 10 ? "0" + String(seconds) : String(seconds));

  return (
    <View style={[s.container, {backgroundColor: 
        (!dropState?.t && !dropState?.p) ? c.light : c.medium}]}>
      <LinearGradient colors={[c.medium, '#aaaaaa77']} style={s.grad}/>
      <View style={s.holder}>
        <Text style={[s.label]}>Pursuit</Text>
        <DropDown
          data={Pursuit.PURSUITS}
          selected={dropState?.p?.key}
          onSelect={(p)=>{
            // just refresh if no change to reset after backgrounded
            if (dropState.p == p) setDropState({...dropState});
            else if (p) 
              pChange(p, color, timed, notify, notifyID, setters);
          }} 
          // setTimeout because SelectDropdown uses conflicting nav that must finish
          addItemButtonCallBack={()=>setTimeout(
            ()=>router.navigate({pathname: '/addEditPursuit', params: {new: true}}), 20
          )}
          addItemButtonText={'Add New Pursuit'}
          style={s.two}
        />
      </View>

      <View style={s.holder}>
        <Text style={[s.label]}>Task</Text>
        <DropDown
          taskView={true}
          data={dropState?.p ? dropState.p.tasks : Task.TASKS}
          selected={dropState?.i}
          onSelect={(t, i) => {
            // just refresh if same task chosen (for coming back from background)
            if (t == dropState.t) setDropState({...dropState});
            else if (t) 
              taskChange(t, color, timed, notify, notifyID, setters);
          }} 
          // setTimeout because SelectDropdown uses conflicting navigation
          addItemButtonCallBack={()=>{setTimeout(
            ()=>router.navigate({
              pathname: '/addEditTask',  
              params: {new: true, prePop: dropState.p?.key}
            }), 20);
        }}
          addItemButtonText={'Start New Task'}
          style={s.two}
        />
      </View>

      <View style={s.split}>

          <View style={s.splitChild}>
            <Text style={[s.label]}>Current Target</Text>
            <View style={s.holder}>             
              <NumericalChooser 
                initialValue={target} 
                valueChangedDataRef={dropState.t}
                style={s.target}
                min={1}
                onChange={(v)=>{
                  if (timed.playing)
                    scheduleNotification(dropState, v, timed, notify, notifyID, setters);
                  else
                    cacheState(dropState, v, timed, notify, notifyID, setters);
                }}
              />
            </View>
          </View>

          <View style={[s.splitChild, {alignItems:'flex-start', paddingLeft: 66}]}>
            <Text style={[s.label]}>Notify at Target</Text>
            <View style={s.switchHolder}>             
              <SimpleSwitch 
                color={c.dark}
                isOn={notify} 
                onChange={async wasOn => {
                  if(wasOn){
                    cancelNotification(notifyID, setNotifyID);
                    cacheState(dropState, target, timed, false, false, setters);
                  } else {
                    if (await Notify.switch(timerAskMessage, ()=>setNotify(false))){
                      if (timed.playing) 
                        scheduleNotification(dropState, target, timed, true, notifyID, setters);
                      else
                        cacheState(dropState, target, timed, true, false, setters);
                    } else {
                      cacheState(dropState, target, timed, false, false, setters);
                    }
                  } 
                }}/>
            </View>
          </View>
      </View>

      <View style={[s.timeBarHolder, {height: short? 25 : 30, marginTop: short? 0 : 15}]}>
            <TimeBar timeComplete={complete} timeRequired={required} 
                     barColor={c.contrast} radius={6}/>
      </View>

      <View style={s.middle}>
        <View style={s.timeHolder}>
          <Text style={[s.time, {color: c.contrast, fontSize: short? 120 : 130}]}>{ timeStr }</Text>
          <View style={s.awardHolder}>
          { award == null
            ? null
            : <Award 
                colors={c} 
                timeRequired={required} 
                timeComplete={complete}
                message={award.message}
                title={award.title}
                star={award.star}
            />
          }
          </View>
        </View>

        <View style={[s.controls, {maxHeight: short ? 105 : 150}]}>
          { (elapsed && !timed.playing)
            ? <StopButton 
                style={[s.media,  {padding: short ? 5 : 0}]}
                color={c.dark}
                onPress={()=>stop(false)}
              />
            : <PauseButton 
                style={[s.media, {padding: short ? 5 : 0}]} 
                color={c.dark}
                onPress={()=>{
                  if (timed.playing) setPlayState(false);
                }}
              />
          }
          <View style={[s.middleThird]}>
            <CircularProgress 
              percent={percent} 
              color={c.dark} 
              backgroundColor={c.contrast}
              expanded={!short}
            />
            <View style={s.absolute}>
              <Text style={{color:c.dark, fontSize: short ? 28 : 42}}>{percent + '%'}</Text>
            </View>
          </View>
          <PlayButton 
            style={[s.media, {padding: short ? 5 : 0}]} 
            color={timed.playing ? c.light : c.dark}
            disabled={timed.playing}
            onPress={()=>{
              if (!timed.playing) setPlayState(true);
            }}
          />
        </View>
        
      </View>

      { short 
        ? null
        : <View style={s.buttonHolder}>
            <TouchableOpacity 
              style={[s.button, {borderColor:c.dark, backgroundColor:c.contrast}]}
              onPress={()=>{
                if (dropState?.t==null) return Alert.alert(
                  'No Task Chosen', 
                  'Choose or create a task from the drop-down menu to add time.', 
                  [{text: 'OK'}])
                else {
                  console.log("TASK", dropState.t, '\n', '==========================', '\n', target, TimeDate.DAY);
                  const t = dropState?.t.registerTime(target, TimeDate.DAY);
                  setRewards(rewards.concat(t));
                } 
              }}
            >
              <Text style={{fontSize:18, color:c.dark}}>{'Add Target Time (' + target + 'min)'}</Text>
            </TouchableOpacity>
          </View> 
      }
      <View style={s.buttonHolder}>
        <TouchableOpacity 
          style={[s.button, {backgroundColor: color.grey.dark, opacity: 0.6}]}
          onPress={()=>{
            if(timed.elapsed){
              Alert.alert('Discard Time Warning', 
              'The add button has not been pressed and the elapsed time will not be added.', 
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Discard', style: 'destructive', onPress: () => stop(true) },
              ]); 
            } else stop(true);
          }}
        >
          <Text style={s.buttTxt}>RESET</Text>
        </TouchableOpacity>
        { !short 
          ? null
          : <TouchableOpacity 
              style={[s.button, {backgroundColor: c.contrast, opacity: 0.8}]}
              onPress={()=>{
                if (dropState?.t==null) return Alert.alert(
                  'No Task Chosen', 
                  'Choose or create a task from the drop-down menu to add time.', 
                  [{text: 'OK'}])
                else {
                  stop(false);
                  const t = dropState?.t.registerTime(target, TimeDate.DAY);
                  setRewards(rewards.concat(t));
                } 
              }}
            >
              <Text style={[s.buttTxt, {color:c.dark}]}>
                {'ADD ' + target + 'm'}
              </Text>
            </TouchableOpacity>
        }
        <TouchableOpacity 
          disabled={timed.elapsed < 1}
          style={[s.button, {backgroundColor: timed.elapsed > 0 ? c.dark : '#99999944'}]}
          onPress={()=>{
            if (dropState?.t==null){
              return Alert.alert(
                'No Task Chosen', 
                'Choose or create a task from the drop-down menu to add time.', 
                [{text: 'OK'}]) 
              } 
            else {
              stop(false);
              setRewards(
                rewards.concat(dropState?.t.registerTime(Math.round(timed.elapsed / 60), 
                TimeDate.DAY))
              );
            } 
          }}
        >
          <Text style={[s.buttTxt, {opacity: timed.elapsed > 0 ? 1 : 0.5}]}>
            {timed.elapsed >= 1 ? 'ADD ' + timeStr : 'ADD 00:00'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const taskChange = (t, color, timed, notify, notifyID, setters) => {
  color.setTimeColByI(t.pursuit.colorScheme);
  const d = {p: t.pursuit, t: t, i: t.pursuit.tasks.indexOf(t)};
  // console.log("TASK CHANGE:", d.p.name, d.t.name, d.i, t.pursuit.tasks.indexOf(t));
  cacheState(d, t.defaultDur, timed, notify, notifyID, setters);
}


const pChange = (p, color, timed, notify, notifyID, setters) => {
  color.setTimeColByI(p.colorScheme);
  const d = {p: p, t: null, i: null};
  cacheState(d, 20, timed, notify, notifyID, setters);
}


const cacheState = (dropState, target, timed, notify, notifyID, setters) => {
  setters.setDropState(dropState);
  setters.setTarget(target);
  setters.setTimed(timed);
  setters.setNotify(notify);
  setters.setNotifyID(notifyID);

  const sObj = {
    notify: notify ? 1 : 0,
    notifyID: notifyID ? notifyID : 0,
    target: target,
    startTime: timed.startTime,
    taskIndex: dropState?.t != null ? dropState.t.taskOrder : -1,
    i: dropState?.i != null ? dropState.i : -1,
    pursuitIndex: dropState?.p != null ? dropState.p.key : -1,
  }
  console.log('CACHE:', sObj);
  M.STORAGE.set('alarm', JSON.stringify(sObj));
}

const wipeCache = () => M.STORAGE.delete('alarm');


const restoreState = (setters) => {
  if (!M.STORAGE.contains('alarm')) return; 
  
  const sObj = JSON.parse(M.STORAGE.getString('alarm'));
  console.log("RESTORE:", sObj);
  // if startTime is zero playState is paused so no time has elapsed
  const msSoFar = sObj.startTime ? Date.now() - sObj.startTime : 0;
  // if over 99h99m99s then abandon
  if (msSoFar > 359999000 || msSoFar < 0){
    wipeCache();
    setters.setDropState({p: null, t: null, i: null});
    setters.setTarget(20);
    setters.setTimed(initTimed);
    return;
  }

  setters.setNotify(sObj.notify == 1 ? true : false);
  setters.setNotifyID(sObj.notifyID ? sObj.notifyID : false);
  setters.setTarget(sObj.target);
  // msSoFar is zero when not playing so convert to boolean for playing state
  const t = {startTime: sObj.startTime, playing: !!msSoFar, elapsed: msSoFar / 1000};
  setters.setTimed(t);
  const d = {
    t: sObj.taskIndex >= 0 ? Task.TASKS[sObj.taskIndex] : null,
    p: sObj.pursuitIndex >= 0 ? Pursuit.PURSUITS[sObj.pursuitIndex] : null,
    i: sObj.i >=0 ? sObj.i : null,
  }
  setters.setDropState(d);
}

const timerAskMessage = `Enabling notifications is required in order to be notified when the timer reaches the target time.`

const scheduleNotification = async (dropState, target, timed, notify, notifyID, setters) => {
  if (notifyID) cancelNotification(notifyID, null)
  const s = target * 60 - (Date.now() - timed.startTime) / 1000;
  // ignore notifications in the past
  if (s < 0) return console.log("Notification deadline is in the past");

  const id = await Notify.send({
    content: {
      title: target + ' minute' + ((target != 1) ? 's:' : ':') + ' Great Work!',
      body: "Putting time into the things you care about leads to good life outcomes.",
      sound: "alarm.wav",
    },
    trigger: {
      seconds: s
    }
  });
  console.log("SCHEDULE NOTIFY", timed, notify, id);

  cacheState(dropState, target, timed, notify, id, setters);
}


const cancelNotification = (notifyID, setNotifyID) => {
  Notify.cancel(notifyID);
  if (setNotifyID) setNotifyID(false);
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 10,
    padding: 10,
    borderRadius: 10,
    gap: 10
  },
  grad: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 10,
  },

  label: {
    width: '100%',
    fontSize: 18,
    textAlignVertical: 'center',
    marginBottom: 4,
    color: '#f9f9f9'
  },
  split: {
    flexDirection: 'row',

  },
  splitChild: {
    flex: 1,
  },
  switchHolder: {
    height: 38,
    aspectRatio: 2.5,
  },
  target: {
    height: 38,
  },
  timeBarHolder: {
    width: '100%'
  },
  middle: {
    flexGrow: 1,
    width: '100%',
    justifyContent: 'space-evenly'
  },
  controls: {
    flexGrow: 1,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 33,
  },
  media: {
    height: '100%',
    flex: 1,
  },
  middleThird: {
    height: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // borderWidth: 1,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#ff000055',
  },
  timeHolder: {
    height: 100,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    // borderWidth: 1,
    // backgroundColor: 'pink'
  },
  awardHolder: {
    position: 'absolute',
    alignSelf: 'center',
    top: 0,
    bottom: 0,
    left: -10,
    right: -10,
    // backgroundColor: 'pink',
    // opacity: 0.5
  },
  time: {
    color: '#fff',
    // fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
    marginTop: -28,
    marginLeft: -3,
  },
  buttonHolder: {
    flexDirection: 'row',
    gap: 10,
    height: 42
  },
  button: {
    // height: 38,
    // borderWidth: 1,
    borderRadius: 5,
    width: '100%',
    flex: 1,
    alignItems: 'center', 
    justifyContent: 'center',
    // borderColor: '#AAA'
  },
  buttTxt: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
  red: {
    backgroundColor: '#C0554f',
  },
  green: {
    backgroundColor: '#5f8735',
  },
  border:{
    borderWidth: 1,
  },
});


