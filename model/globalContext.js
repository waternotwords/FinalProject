import { createContext, useState, useEffect, useRef } from 'react';
import { Pursuit } from './pursuit';
import { Task } from './task';

export const MODEL = createContext();

export const ModelContext = (p) => {
  const [state, setState] = useState(false);
  const refresh = ()=>setState(!state);

  return (
    <MODEL.Provider value={model(refresh)}>
      { p.children }
    </MODEL.Provider>
  );
}

function model(refresh, didNewTabShow){
  return {
    PURSUITS: Pursuit.PURSUITS,
    TASKS: Task.TASKS,
    refresh: refresh,
    getTasks: Task.getTasks,
  }
}





