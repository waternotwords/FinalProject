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
  const [time, setTime] = useState({
    startTime: 0, elapsed: 0, playing: false
  })

  const taskChange = (t) => {
    color.setTimeColByI(t.pursuit.colorScheme);
    const d = {p: t.pursuit, t: t, i: t.pursuit.tasks.indexOf(t)};
    console.log("TASK CHANGE:", d.p.name, d.t.name, d.i, t.pursuit.tasks.indexOf(t));
    setDropState(d);
    setTarget(t.defaultDur);
    cacheState(d, target, time);
  }

  const pChange = (p) => {
    color.setTimeColByI(p.colorScheme);
    const d = {p: p, t: null, i: null};
    setDropState(d);
    setTarget(20);
    cacheState(d, target, time);
  }


  const params = useLocalSearchParams();
  const { taskCreated, pursuitCreated, timerTaskI, route } = params;
  const i = timerTaskI ? parseInt(timerTaskI) : null;
  const task = (i != null && i >= 0 && i < Task.TASKS.length) ? Task.TASKS[i] : null;

  useEffect(() => {
    if (route != 'timer') return;

    if(task){
      taskChange(t);
    } else if(taskCreated){
      const t = Task.TASKS[Task.TASKS.length - 1];
      taskChange(t);
    } else if(pursuitCreated){
      const p = Pursuit.PURSUITS[Pursuit.PURSUITS.length -1];
      pChange(p);
    }
    router.setParams({taskCreated: '', pursuitCreated: '', refresh: '', timerTaskI: ''});

  }, [taskCreated, pursuitCreated, task]);

  const adjustedTimeOut = () => {
    if (!time.playing) return;

    const ms = (time.elapsed && time.elapsed >= 0.95) ? 1000 : 20;
    const elapsedMS = Date.now() - time.startTime;
    const adjustedMS =  ms - (elapsedMS % ms);
    playRef.current = setTimeout(() => {
      setTime({...time, elapsed: (Date.now() - time.startTime) / 1000});
      adjustedTimeOut();
    }, adjustedMS);
  }

  useEffect(()=>{
    if (time.playing && playRef.current == null) adjustedTimeOut();
    else if (!time.playing && playRef.current != null){
      clearTimeout(playRef.current);
      playRef.current = null;
    } 
  }, [time.playing]);

  useEffect(() => {
    // based on: https://reactnative.dev/docs/appstate
    const listener = AppState.addEventListener("change", nextState => {
      if(backgroundState.current.match(/inactive|background/) && nextState === 'active')
        restoreState(setDropState, setTarget, setTime);
      
      backgroundState.current = nextState;
    }); 
    return () => listener.remove();
  }, []);

  const setPlayState = (shouldPlay)=>{
    if(!shouldPlay && playRef.current != null){
      clearTimeout(playRef.current);
    }
    const t = {
      startTime: shouldPlay ? Date.now() - time.elapsed * 1000 : 0,
      elapsed: time.elapsed, playing: shouldPlay
    }
    setTime(t);
    if (shouldPlay){
      cacheState(dropState, target, t);
      setTimer(t, target, setNotify);
    } 
    else{
      cancelTimer(notify);
      wipeCache();
    } 
  }

  const stop = (clearAll)=>{
    cancelTimer();
    if (playRef.current) clearTimeout(playRef.current);
    if (clearAll) color.resetTimeC();
    
    setTime({playing: false, elapsed: 0, startTime: 0});
    wipeCache();
  }

  const [complete, required] = dropState?.t 
                              ? dropState.t.getUsage(TimeDate.DAY) 
                              : [0,0];
  const c = color.timeC;
  const elapsed = Math.round(time.elapsed);
  const percent = Math.min(100,Math.round(elapsed / (target * 60) * 100));
  let timeStr;
  const ms = (time.elapsed && time.elapsed < 1) ? Math.trunc(time.elapsed * 100) : null;
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
            else if (p) pChange(p);
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
            else if (t) taskChange(t);
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
                  setTarget(v);
                  cacheState(dropState, v, time)
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
                onChange={async (isOn, revert)=>{
                  if (isOn){
                    if (await Notify.switch(timerAskMessage, ()=>{
                      revert();
                      setNotify(false);
                    })){
                      setNotify(true);
                      if (time.playing) setTimer(time, setNotify);
                    }
                    else revert();
                  } else {
                    cancelTimer(notify);
                    setNotify(false);
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
          { (elapsed && !time.playing)
            ? <StopButton 
                style={[s.media,  {padding: short ? 5 : 0}]}
                color={c.dark}
                onPress={()=>stop()}
              />
            : <PauseButton 
                style={[s.media, {padding: short ? 5 : 0}]} 
                color={c.dark}
                onPress={()=>{
                  if (!playRef.current) return;
                  setPlayState(false);
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
            color={time.playing ? c.light : c.dark}
            disabled={time.playing}
            onPress={()=>{
              if (playRef.current != null) return;
              setPlayState(true);
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
            if(time.elapsed){
              Alert.alert('Discard Time Warning', 
              'The add button has not been pressed and the elapsed time will not be added.', 
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Discard', 
                  style: 'destructive',
                  onPress: () => {
                    if (playRef.current) clearTimeout(playRef.current);
                    stop(true);
                  }
                },
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
                  stop();
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
          disabled={time.elapsed < 1}
          style={[s.button, {backgroundColor: time.elapsed > 0 ? c.dark : '#99999944'}]}
          onPress={()=>{
            if (dropState?.t==null){
              return Alert.alert(
                'No Task Chosen', 
                'Choose or create a task from the drop-down menu to add time.', 
                [{text: 'OK'}]) 
              } 
            else {
              stop();
              setRewards(
                rewards.concat(dropState?.t.registerTime(Math.round(time.elapsed / 60), 
                TimeDate.DAY))
              );
            } 
          }}
        >
          <Text style={[s.buttTxt, {opacity: time.elapsed > 0 ? 1 : 0.5}]}>
            {time.elapsed >= 1 ? 'ADD ' + timeStr : 'ADD 00:00'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cacheState = (dropState, target, time) => {
  if (!time.playing) return;

  const sObj = {
    target: target,
    startTime: time.startTime,
    taskIndex: dropState?.t != null ? dropState.t.taskOrder : -1,
    i: dropState?.i != null ? dropState.i : -1,
    pursuitIndex: dropState?.p != null ? dropState.p.key : -1,
  }
  M.STORAGE.set('alarm', JSON.stringify(sObj));
}

const wipeCache = () => M.STORAGE.delete('alarm');


const restoreState = (setDropState, setTarget, setTime) => {
  if (!M.STORAGE.contains('alarm')) return; 

  console.log("RESTORING STATE");
  
  const sObj = JSON.parse(M.STORAGE.getString('alarm'));
  console.log("SOBJ:", sObj);
  const msSoFar = Date.now() - sObj.startTime;
  // if over 99h99m99s then abandon
  if (msSoFar > 359999000 || msSoFar < 0){
    wipeCache();
    setDropState({p: null, t: null, i: null});
    setTarget(20);
    setTime({startTime: 0, elapsed: 0, playing: false})
    return;
  }

  setTarget(sObj.target);
  const t = {startTime: sObj.startTime, playing: true, elapsed: msSoFar / 1000};
  setTime(t);
  const d = {
    t: sObj.taskIndex >= 0 ? Task.TASKS[sObj.taskIndex] : null,
    p: sObj.pursuitIndex >= 0 ? Pursuit.PURSUITS[sObj.pursuitIndex] : null,
    i: sObj.i >=0 ? sObj.i : null,
  }
  setDropState(d);
}

const timerAskMessage = `Enabling notifications is required in order to be notified when the timer reaches the target time.`

const setTimer = async (time, target, setNotify) => {
  const s = target * 60 - (Date.now() - time.startTime) / 1000;

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
  console.log("TIMER NOT> SECONDS:", s, id);
  setNotify(id);

}
const cancelTimer = (notify) => {

  Notify.cancel(notify);
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


