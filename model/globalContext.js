import { createContext, useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { Pursuit } from './pursuit';
import { Task } from './task';
import { TimeDate } from './time';

var FULL_ROLL_IN_PROGRESS = 0;
var clearTimer = null;

export const MODEL = createContext();

export const ModelContext = (p) => {
  // used to manually refresh context through state change
  const [state, setState] = useState(1);

  const checkRoll = ()=>{
    // if roll over not in progress
    if(FULL_ROLL_IN_PROGRESS == 0){
      console.log("model.refresh : checkIfShouldRoll", FULL_ROLL_IN_PROGRESS);
      // mark in progress
      FULL_ROLL_IN_PROGRESS++;
      // asynchronously check (and execute if needed)
      Pursuit.checkFullRollAsync((didRollOver)=>{
        // when finished mark as not in progress
        FULL_ROLL_IN_PROGRESS = 0;
        // if day rolled over reset state to refresh model 
        if (didRollOver) setState(0)
      });
    }
  }

  const refresh = ()=>{
    setState(state + 1);
    checkRoll();
  }

  const resetTimer = (tomorrowVal)=> {
    console.log("ModelContext : resetTimer (refresh)", clearTimer);
    clearTimer?.();
    id = setTimeout(refresh, tomorrowVal - TimeDate.nowVal() + 100);
    clearTimer = ()=>clearTimeout(id);    
    return clearTimer;
  }

  const tomorrowVal = TimeDate.tomorrowVal();
  useEffect(()=>resetTimer(tomorrowVal),[tomorrowVal]);


  const backgroundState = useRef(AppState.currentState);
  useEffect(() => {
    const listener = AppState.addEventListener("change", nextState => {
      console.log("AppState:", nextState);
      if(backgroundState.current.match(/inactive|background/) && nextState == 'active'){
        checkRoll();
        resetTimer();
      } else if(backgroundState.current.match(/active/) && 
               (nextState == 'inactive' || nextState == 'background')){
        clearTimer();
      }
      backgroundState.current = nextState;
    }); 
    return ()=>listener.remove();
  }, []);

  return (
    <MODEL.Provider value={model(refresh, checkRoll)}>
      { p.children }
    </MODEL.Provider>
  );
}


function model(refresh, checkRoll){
  return {
    PURSUITS: Pursuit.PURSUITS,
    TASKS: Task.TASKS,
    refresh: refresh,
    checkRoll: checkRoll,
    rollInProgress: fullRollInProgress,
    getTasks: Task.getTasks,
    wipeAll: ()=>{
      Pursuit.initialize(true);
      Task.initialize([]);
      refresh();
    }
  }
}

export function fullRollInProgress(){
  return FULL_ROLL_IN_PROGRESS > 0;
}






