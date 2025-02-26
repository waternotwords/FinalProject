import { Storage } from './storage';
import { Pursuit } from './pursuit';
import { TimeDate } from './time';
import { Notify } from './notifications';
import { getAwardData } from './awards';

const M = Storage();

export class Task {
  static TASKS = [];
  static ACTIVE = null;
  // complete array: TODAY's index
  static CTI = 6;

  static initialize(pursuitArray){
    Task.TASKS = [];
    for(const p of pursuitArray){
      for(const id of p.taskIDs){
        const t = Task.CreateFromID(id, p);
        p.tasks.push(t);
      }
    }
    // check if roll-over is required for any of data model
    Pursuit.checkFullRoll();
    Task.TASKS.sort((a,b)=>a.taskOrder-b.taskOrder);
    // Task.TASKS.forEach(e=>e.print());
  }

  static taskTypeChooser(calcType){
    if (calcType == -1) return new AnytimeTask();
    else if (calcType == 0) return new OnceTask();
    else if (calcType == 1) return new DailyTask();
    else if (calcType == 7) return new WeeklyTask();
  }

  // make new TASK and save in STORAGE 
  // passing a number to thisWeekReq can be used to modify minutes for 1st week
  static MakeNew(pursuit, name, calcType, minDur, defaultDur, daysMap, reminderTime, reminders, thisWeekReq = null, existingID = null){
    const t = Task.taskTypeChooser(calcType);
    t._pursuit = pursuit;
    t._TID = existingID ? existingID : Pursuit.getNextID();
    t.name = name;
    t.defaultDur = defaultDur;
    t.totalM = 0; 
    t.taskOrder = (Task.TASKS.length);
    t.notifyIDs = [];
    // setting reminderTime should be before setting reminders with setter
    t.reminderTime = reminderTime;
    t.reminders = reminders;
    t.cM = [0,0,0,0,0,0,0,0];

    // the setters for these valuess recalculate stuff so just store
    t.storeCalcType(calcType); 
    t.storeMap(daysMap);
    t.storePauseState(false);

    // use subclass initializer
    t.initialize(minDur, daysMap, t.pursuit.dayOfWeek, thisWeekReq);

    if(existingID == null){
      pursuit.addTask(t, t.TID);
      Task.TASKS.push(t);
    }

    if (t.reminders) t.setNotify();
    // console.log("MAKE NEW");
    // t.print();
    return t;
  }

  static DaysMapChanged(a1,a2){
    if (a1.length != a2.length) return false;
    for(let i = 0; i < a1.length; i++){
      if (a1[i] != a2[i]) return true;
    }
    return false;
  }

  static Edit(task, name, pursuit, daysMap, defaultDur, reminderTime, reminders, minDur, calcType){    
    console.log("EDIT CALLED");
    task.pursuit = pursuit;
    // TODO
    // change task type


    // if (task.calcType != calcType){
    //   const time = task.totalM;
    //   const tIndex = Task.TASKS.indexOf(task);
    //   // const pIndex = pursuit.tasks.indexOf(task);
    //   task.delete();
    //   // add back the time and the notifications
    //   t.totalM = time;
    //   t.TID = task._TID;
    //   // add the task at the appropriate indices
    //   Task.TASKS.splice(tIndex, 0, t);
    //   t._taskOrder = tIndex;
    //   pursuit.tasks.splice(tIndex, 0, t);
    //   t.print();
    //   console.log("#############");
    //   for (const ta of Task.TASKS) console.log(ta.name, ta.calcType);
    //   for (const pt of t.pursuit.tasks) console.log(pt.name, pt.calcType);
    //   for (const id of t.pursuit.taskIDs) console.log(id);
    //   return t;
    // }
    
    task.name = name;
    task.daysMap = daysMap;
    task.defaultDur = defaultDur;
    task.minDur = minDur;
    task._reminderTime = reminderTime;
    task.reminders = reminders;
    if (task.reminders) task.setNotify();

    console.log("EDIT: reminders, reminderTime");
    console.log(String(reminderTime), String(task.reminderTime));
      

    return task;
  }

  static CreateFromID(TID, pursuit){
    const calcType = M.STORAGE.getNumber(TID + '.calcType');
    const t = Task.taskTypeChooser(calcType);
    
    t._calcType = calcType;
    t._TID = TID;
    t._pursuit = pursuit;
    t._name = M.STORAGE.getString(t._TID + '.name');
    t._updated = M.STORAGE.getNumber(t._TID + '.updated');
    t._cM = JSON.parse(M.STORAGE.getString(t._TID + '.cM'));
    t._defaultDur = M.STORAGE.getNumber(t._TID + '.defaultDur');
    const days = M.STORAGE.getNumber(t._TID + '.daysMap');
    t._daysMap = days.toString(2).split('').map(e => e == '1');
    t._daysMap.shift();
    t._totalM = M.STORAGE.getNumber(t._TID + '.totalM');
    const p = M.STORAGE.getNumber(t._TID + '.paused');
    t._paused = (p && p > 0) ? new Date(p) : false;
    t._taskOrder = M.STORAGE.getNumber(t._TID + '.taskOrder');
    t._reminderTime = M.STORAGE.getNumber(t._TID + '.reminderTime');
    t._reminders = M.STORAGE.getBoolean(t._TID + '.reminders');
    t._notifyIDs = JSON.parse(M.STORAGE.getString(t._TID + '.notifyIDs'));
    t._minDur = M.STORAGE.getNumber(t._TID + '.minDur');

    if (calcType > 0){
      t._streakBar = JSON.parse(M.STORAGE.getString(t._TID + '.streakBar'));
      t._oldStreak = M.STORAGE.getNumber(t._TID + '.oldStreak');
      t._rM = JSON.parse(M.STORAGE.getString(t._TID + '.rM'));
      if (calcType == 7) t._pcM = JSON.parse(M.STORAGE.getString(t._TID + '.pcM'));
    }
    Task.TASKS.push(t);
    return t;
  }

  static getTasks(dayAdjust){
    const once = [];
    const tasks = [];
    const anyTime = [];
    const tomoTasks = [];

    for(t of Task.TASKS){
      if (t.paused) continue;

      const [complete, required] = t.getUsage(0);

      // if daily task
      if (t.calcType == 1){
        // if due on viewed day or minutes complete on that day
        if (t._rM[DailyTask.RTI + dayAdjust] || t._cM[Task.CTI + dayAdjust]) tasks.push(t);
        // if viewing todays tasks & task is due tomorrow
        if (dayAdjust == 0 && t._rM[DailyTask.RTI+1] && complete >= required) 
          tomoTasks.push(t);
      // if weekly task
      } else if (t.calcType == 7){
        // always show weekly tasks
        tasks.push(t); 
        // if new period starts tomorrow & this period's minutes complete, show in tomorrow
        if (dayAdjust == 0 && complete >= required 
            && t.pursuit.dayOfWeek == (TimeDate.getDay() + 1) % 7)
          tomoTasks.push(t);
      }  
      // if once/anytime task & active day is today or minutes complete on that day
      else if (dayAdjust == 0 || t._cM[Task.CTI + dayAdjust]){
        // if do once type
        if (t.calcType == 0) once.push(t);
        // if anytime type
        if (t.calcType == -1) anyTime.push(t);
      } 
    }
    return {current: tasks, once: once, anyTime: anyTime, tomorrow: tomoTasks};
  }

  constructor(){
    this._pursuit = null;
    this._streak = null;
    this._streakBar = false;
    this._notifyIDs = [];
    this._reminderTime = 0;
  }

  get TID(){ return this._TID; }
  get pursuit(){ return this._pursuit; }
  get name(){ return this._name; }
  get calcType(){ return this._calcType; }
  get defaultDur(){ return this._defaultDur; }
  get daysMap(){ return this._daysMap; }
  get totalM(){ return this._totalM; }
  get updated(){ return this._updated; }
  get paused(){ return this._paused; }
  get taskOrder(){ return this._taskOrder; }
  get minDur(){ return this._minDur; }
  get reminders(){return this._reminders && Notify.STATUS.canSend; } 
  get notifyIDs(){ return this._notifyIDs; }
  get reminderTime(){ return new Date (Math.abs(this._reminderTime)); }
  get daysMap(){ return this._daysMap}
  get streak(){ return this._streak; }
  get cM (){ return this._cM; }
  get pcM (){ return this._pcM; }
  get rM (){ 
    if(this.hasOwnProperty('_rM') &&  this._rM.length > 0) return this._rM; 
    else return false;
  }
  // overridden in subclasses with streak bars
  get streakBar(){ return false; }

  set pursuit(v){
    if(v && this.hasOwnProperty('_pursuit') && this._pursuit && this._pursuit != v){
      this.removeFromPursuit();
      const [complete, required] = this.getUsage(0);
      //.(Math.max(complete - required));
      // TODO: remove completed minutes AND remove completed from required for this period

      // TODO: DEAL WITH CHANGE OF PURSUIT MINUTES
      v.addTask(this, this._TID);
    }
    this._pursuit = v;    
  }
  set name(v){ 
    this._name = v
    M.STORAGE.set(this._TID + '.name', v); 
  }
  set defaultDur(v){ 
    this._defaultDur = v;
    M.STORAGE.set(this._TID + '.defaultDur', v); 
  }
  set totalM(v){ 
    this._totalM = v;
    M.STORAGE.set(this._TID + '.totalM', v); 
  }
  set rM(v){ 
    this._rM = v;
    M.STORAGE.set(this._TID + '.rM', JSON.stringify(v));
  }
  set cM(v){ 
    this._cM = v;
    M.STORAGE.set(this._TID + '.cM', JSON.stringify(v));
  }
  set pcM(v){ 
    this._pcM = v;
    M.STORAGE.set(this._TID + '.pcM', JSON.stringify(v));
  }
  set streakBar(v){
    this.storeStreakBar(v);
  }
  set oldStreak(v){
    this._oldStreak = v;
    M.STORAGE.set(this._TID + '.oldStreak', v);
  }
  set updated(v){
    this._updated = v;
    M.STORAGE.set(this._TID + '.updated', v);
  }
  set notifyIDs(v){
    this._notifyIDs = v;
    M.STORAGE.set(this._TID + '.notifyIDs', JSON.stringify(v));
  }
  set reminderTime(d){
    M.STORAGE.set(this._TID + '.reminderTime', d.valueOf());
  }
  set taskOrder(v){
    this._taskOrder = v;
    M.STORAGE.set(this._TID + '.taskOrder', v);
  }
  set reminders(v){
    if (v) this._reminders = true;
    else this._reminders = false;
    M.STORAGE.set(this._TID + '.reminders', v);
  }

  set paused(v){
    // don't reset the pause-date if it already was paused
    if ((v != false && this._paused != false) || v == this._paused) return;

    if (v != false) this.removeIncompletePursuitMinutes(); 
    else if (this._calcType > 0) this.restorePausedMinutes();

    this.storePauseState(v);
  }  
  set daysMap(v){
    this.storeMap(v);
  }

  storeMap(m){
    this._daysMap = m;
    const daysInt = parseInt([1].concat(m.map(e => e ? '1' : '0')).join(''), 2);
    M.STORAGE.set(this._TID + '.daysMap', daysInt); 
  }
  storeMinDur(v){
    this._minDur = v;
    M.STORAGE.set(this._TID + '.minDur', v); 
  }
  storeCalcType(t){
    this._calcType = t;
    M.STORAGE.set(this._TID + '.calcType', t);
  }
  storePauseState(v){
    this._paused = (v == false) ? 0 : TimeDate.now();
    M.STORAGE.set(this._TID + '.paused', (v == false) ? 0 : this._paused.valueOf());
  }
  storeStreakBar(v){ 
    this._streakBar = v;
    M.STORAGE.set(this._TID + '.streakBar', JSON.stringify(v));
  }

  print(){
    console.log(this.name, '{');
    for(const [k,v] of Object.entries(this)){
      console.log('  ' + k + ':', k=='_pursuit' ? v.name : v);
    }
    console.log('}');
  }

  restorePausedMinutes(){
    const [thisP, nextP] = this.calcIncompleteMinFromNow();
    this.pursuit.adjustReqMin(thisP, nextP);
  }

  removeIncompletePursuitMinutes(){
    const [thisP, nextP] = this.calcIncompleteMinFromNow();
    this.pursuit.adjustReqMin(-1 * thisP, -1 * nextP);
  }

  calcReqMinFromNow(){
    return [0,0];
  }

  removeFromPursuit(){
    this.removeIncompletePursuitMinutes();
    this.pursuit.deleteTask(this._TID, this);
  }

  removeFromTaskList(){
    // remove from in-memory model
    const index = Task.TASKS.indexOf(this);
    Task.TASKS.splice(index, 1);
    // reassign taskOrder vals so they are still 0 through length - 1
    Task.TASKS.forEach((t, i) => t.taskOrder = i);
  }

  delete(removeFromP=true, removeFromTL=true){
    this.cancelNotify();
    // remove from pursuit (storage & in-memory model)
    if (removeFromP) this.removeFromPursuit();

    // remove from storage
    try { M.STORAGE.delete(this._TID + '.cM');} catch(e){}
    try { M.STORAGE.delete(this._TID + '.pcM');} catch(e){}
    try { M.STORAGE.delete(this._TID + '.rM');} catch(e){}
    try { M.STORAGE.delete(this._TID + '.required');} catch(e){}
    try { M.STORAGE.delete(this._TID + '.name');} catch(e){}
    try { M.STORAGE.delete(this._TID + '.calcType');} catch(e){}
    try { M.STORAGE.delete(this._TID + '.defaultDur');} catch(e){}
    try { M.STORAGE.delete(this._TID + '.minDur');} catch(e){}
    try { M.STORAGE.delete(this._TID + '.daysMap');} catch(e){}
    try { M.STORAGE.delete(this._TID + '.totalM');} catch(e){}
    try { M.STORAGE.delete(this._TID + '.paused');} catch(e){}
    try { M.STORAGE.delete(this._TID + '.taskOrder');} catch(e){}
    try { M.STORAGE.delete(this._TID + '.reminderTime');} catch(e){}
    try { M.STORAGE.delete(this._TID + '.reminders');} catch(e){}
    try { M.STORAGE.delete(this._TID + '.oldStreak');} catch(e){}
    try { M.STORAGE.delete(this._TID + '.updated');} catch(e){}
    try { M.STORAGE.delete(this._TID + '.streakBar');} catch(e){}
    try { M.STORAGE.delete(this._TID + '.notifyIDs');} catch(e){}

    if (removeFromTL) this.removeFromTaskList();
  }

  rollStreakBar(complete, required){
    // if no require minutes, it does not count toward streak
    if(required == null || required == 0) return;

    if (this._streakBar[0] == 1) this.oldStreak++;
    else this.oldStreak = 0;

    this._streakBar.shift();
    this._streakBar.push(Math.min(1, complete / required));
  }

  async setNotify(){
    await this.cancelNotify();
    if (!this.reminders || this._reminderTime == 0) return;
    if (!Notify.STATUS.canSend) return;

    const d = new Date(this.reminderTime);
    console.log(String(d));
    const ids = [];

    for(let i = 0; i < this._daysMap.length; i++){
      if (!this._daysMap[i]){
        ids.push(0);
        continue;
      }

      const mObj = {
        content: {
          title: 'Reminder ' + this.name,
          body: "Keep your streak going, or start a new one. Everyday is chance to invest time in what matters.",
          sound: "notify.wav",
        },
        trigger: {
          weekday: i+1,
          hour: d.getHours(),
          minute: d.getMinutes(),
          repeats: true
        }
      }
      console.log("setNotify Called", mObj.trigger);

      const id = await Notify.send(mObj);
      ids.push(id);
      // await (()=>new Promise(empty=>setTimeout(empty, 500)))();
    }
    this.notifyIDs = ids;
  }

  async cancelNotify(){
    for(const id of this._notifyIDs){
      // console.log("NOTIFICATION cancelled");
      if(id == 0) continue;
      await Notify.cancel(id);
    }
    this.notifyIDs = [];
  }
}


// ----------------------------------------------------------------------------
//  AnytimeTask Sub-class
// ----------------------------------------------------------------------------

export class AnytimeTask extends Task {
  constructor(){
    super();
  }
  initialize(){
    this.updated = TimeDate.todayDateVal();
    this.storeMinDur(0);
  }

  getUsage(dayAdjustInt){
    const i = dayAdjustInt + Task.CTI;
    if (i < 0 || i > this._cM.length) 
      return console.alert('dayAdjustInt out of range in Task.completeForDay');

    return [this._cM[i], 0, this._cM[i]];
  }

  registerTime(duration, dayAdjust){
    const restarted = false // check if there has been a lack of activity for a few days
    const oldP = this.pursuit.totalM;
    const oldT = this._totalM;

    const cI = Task.CTI + dayAdjust;

    // use setter to update the minutes complete
    this.cM[cI] += duration;
    // update total minutes for task using setter
    this.totalM += duration;
    // update total minutes for pursuit using setter
    this.pursuit.registerTime(duration, 0, dayAdjust);

    return []//getAwardData(this._calcType, oldT, this.totalM, oldP, this.pursuit.totalM, 0, 0, restarted);
  }
  calcIncompleteMinFromNow(){
    return [0,0];
  }

  newPeriodRequiredMinutes(){
    return 0;
  }

  checkRollOver(){
    if (!TimeDate.isMoreThanDay(this._updated)) return;

    const [dCount, dateVal] = TimeDate.calcDaysFromVal(this._updated, this._daysMap);

    for(let i = 0; i < dCount; i++){
      this._cM.shift();
      this._cM.push(0);
    }
    // use setters to store
    this.cM = this._cM;
    this.updated = dateVal;
  }
}



// ----------------------------------------------------------------------------
//  OnceTask Sub-class
// ----------------------------------------------------------------------------

export class OnceTask extends Task {
  constructor(){
    super();
  }

  initialize(minDur){
    this.updated = TimeDate.todayDateVal();
    this.storeMinDur(minDur);
  }

  getUsage(dayAdjustInt){
    const i = dayAdjustInt + Task.CTI;
    if (i < 0 || i > this._cM.length) 
      return console.alert('dayAdjustInt out of range in Task.completeForDay');

    return [this._totalM, this._minDur, this._cM[i]];
  }

  registerTime(duration, dayAdjust){
    // const restarted = false // check if there has been a lack of activity for a few days
    // const oldP = this.pursuit.totalM;
    // const oldT = this._totalM;

    const cI = Task.CTI + dayAdjust;

    // use setter to update the minutes complete
    this.cM[cI] += duration;
    // update total minutes for task using setter
    this.totalM += duration;
    // update total minutes for pursuit using setter
    const awards = this.pursuit.registerTime(duration, 0, dayAdjust);

    return awards//getAwardData(this._calcType, oldT, this.totalM, oldP, this.pursuit.totalM, 0, 0, restarted);
  }

  calcIncompleteMinFromNow(){
    return [0,0];
  }

  checkRollOver(){
    if (!TimeDate.isMoreThanDay(this._updated)) return;

    const [dCount, dateVal] = TimeDate.calcDaysFromVal(this._updated, this._daysMap);

    for(let i = 0; i < dCount; i++){
      this._cM.push(0);
    }
    // use setters to store
    this.cM = this._cM;
    this.updated = dateVal;
  }

  newPeriodRequiredMinutes(){
    return 0;
  }
}



// ----------------------------------------------------------------------------
//  DailyTask Sub-class
// ----------------------------------------------------------------------------

export class DailyTask extends Task {
  // this.rM's TODAY's index
  static RTI = 6;

  constructor(){
    super();
  }

  initialize(minDur, daysMap){
    const today = TimeDate.getDay();
    this.streakBar = [0,0,0,0,0,0,0,0,0,0];
    this.rM = [null,null,null,null,null,null,
               daysMap[today] ? minDur : null,              // today
               (daysMap[(today + 1) % 7]) ? minDur : null], // tomorrow
    this.updated = TimeDate.todayDateVal();
    this.oldStreak = 0;
    this.storeMinDur(minDur);
  }

  get streak(){
    if (this._streak == null) this._streak = this.calcStreak();
    return this._streak;
  }
  get streakBar(){ 
    const sB = this._streakBar.slice();
    const today = this.todayIsStreak();
    if (today) sB.push(1);
    if ((today || !this._rM[DailyTask.RTI]) && this.tomorrowIsStreak()) sB.push(1);

    return sB.slice(-8);
  }
  set streakBar(v){ this.storeStreakBar(v); }


  get daysMap(){ return this._daysMap; }
  set daysMap(v){ 
    // calculate old requirements BEFORE saving map which it depends on
    const [reqMin, nextReqMin] = this.calcReqMinFromNow();
    // store old map to compare for finding changes
    const oldMap = this._daysMap;
    // write the changes
    this.storeMap(v);

    const today = TimeDate.getDay();

    // for today and tomorrow
    for(let i = 0; i < 2; i++){
      const d = (today + i) % 7;
      // if the old map did not require minutes but new map does
      if (!oldMap[d] && v[d])
        this._rM[DailyTask.RTI + i] = this._minDur;
      // if old map required but new one doesn't
      else if (oldMap[d] && !v[d])
        this._rM[DailyTask.RTI + i] = 0;
    }

    // use setter to write minutes to storage
    this.rM = this._rM;
    // after saving the minutes calculate the new time requirements
    const [newReqMin, newNextReqMin] = this.calcReqMinFromNow();
    // adjust pursuit required minutes remaining
    this.pursuit.adjustReqMin(newReqMin - reqMin, newNextReqMin - nextReqMin);
  }

  get minDur(){ return this._minDur; }

  set minDur(v){ 
    const [reqMin, nextReqMin] = this.calcReqMinFromNow();
    this.storeMinDur(v);

    // update the required values today and tomorrow indices
    if (this._rM[DailyTask.RTI] != null) this._rM[DailyTask.RTI] = v;
    if (this._rM[DailyTask.RTI + 1] != null) this._rM[DailyTask.RTI + 1] = v;
    // use setter to update storage
    this.rM = this._rM;

    const [newReqMin, newNextReqMin] = this.calcReqMinFromNow();
    // adjust pursuit required minutes remaining
    this.pursuit.adjustReqMin(newReqMin - reqMin, newNextReqMin - nextReqMin);
  }

  getUsage(dayAdjustInt){
    // complete this period, required this period, complete today
    return [
      this._cM[dayAdjustInt + Task.CTI], 
      this._rM[dayAdjustInt + DailyTask.RTI], 
      this._cM[dayAdjustInt + Task.CTI]
    ];
  }

  // calculate total required minutes REMAINING for this period & for next period
  calcReqMinFromNow(){
    const nextP = this.newPeriodRequiredMinutes();

    const today = TimeDate.getDay();
    // if today is start of the week then full period * current min so:
    if (today == this.pursuit.dayOfWeek) return [nextP, nextP];
    
    // number of days remaining in week
    const rDays = (this.pursuit.dayOfWeek + 7 - TimeDate.getDay()) % 7;
    const end = today + rDays;
    let thisP = 0;

    // put two copies of _daysMap head to tail to use as a mask
    const daysArr = this._daysMap.concat(this._daysMap);
    // iterate over subsection starting today for remaining days using as mask
    for(let i = today; i < end; i++){
      if (daysArr[i]) thisP += this._minDur; 
    }

    return [thisP, nextP];
  }

  calcIncompleteMinFromNow(){
    // get the remaining required minutes
    let [_, nextP] = this.calcReqMinFromNow();
    const today = TimeDate.getDay();

    // if a new period starts tomorrow then subtract any completed minutes
    if ((today + 1) % 7 == this.pursuit.dayOfWeek) 
      nextP -= Math.max(0, this._rM[DailyTask.RTI] - this._cM[Task.CTI + 1]);
    
    const daysRemaining = (this.pursuit.dayOfWeek + 7 - TimeDate.getDay()) % 7;
    const endIndex = Task.CTI + daysRemaining;
    // the gap between the minutes.completed / required & daysOfWeek indices
    const gap = (Task.CTI + 7 - today) % 7;
    let thisP = 0;
  
    // add up uncompleted required minutes for days remaining in the pursuit week
    for(let i = Task.CTI; i < endIndex; i++){
      // while in range use the difference between required and completed
      if (i < this._cM.length) thisP += Math.max(0, this._rM[i] - this._cM[i]); 
      // afterwards use the days map & add minDur for days task is required
      else thisP += (this.daysMap[(i - gap) % 7] ? this._minDur : 0);
    }

    return [thisP, nextP];
  }

  todayIsStreak(){
    if (this._rM[DailyTask.RTI] && this._cM[Task.CTI] >= this._rM[DailyTask.RTI]) return 1;
    else return 0;
  }

  tomorrowIsStreak(){
    if (this._rM[DailyTask.RTI+1] && this._cM[Task.CTI+1] >= this._rM[DailyTask.RTI+1]) return 1;
    else return 0;
  }

  calcStreak(){
    const today = this.todayIsStreak();
    const tomorrow = today || !this._rM[DailyTask.RTI] ? this.tomorrowIsStreak() : 0;

    let s = 0;
    const sArr = this._streakBar.toReversed();
    for(let i = 0; i < sArr.length; i++){
      if (sArr[i] == 1) s++;
      else break;
    }
  
    // if the streak bar is all full include oldStreak
    if (s == sArr.length) return tomorrow + today + s + this._oldStreak;
    else return tomorrow + today + s;
  }

  newPeriodRequiredMinutes(){
    let reqMin = 0;
    this._daysMap.forEach(d => { 
      if (d) reqMin += this._minDur; 
    });
    return reqMin;
  }

  registerTime(duration, dayAdjust){
    let awards = [];

    const restarted = false // check if there has been a lack of activity for a few days
    const oldP = this.pursuit.totalM;
    const oldT = this._totalM;
    const oldS = this.streak;
    const rI = DailyTask.RTI + dayAdjust;
    const cI = Task.CTI + dayAdjust;
    const required = this._rM[rI] ? this._rM[rI] : 0;

    // update pursuit required minutes if necessary
    const stillReqM = required - this._cM[cI];
    const reqMin = stillReqM < 0 || this.paused ? 0 : stillReqM;
    awards.concat(this.pursuit.registerTime(duration, Math.min(reqMin, duration), dayAdjust));

    // use setter to update the minutes complete
    this._cM[cI] += duration;
    this.cM = this._cM;
    // update total minutes for task using setter
    this.totalM += duration;

    // Deal with streak bar (only need to worry about past)
    if (!this.paused && dayAdjust < 0 && required != 0){
      let nonZeroCount = 0;
      // count the number of past days the task was due
      for(let i = rI; i < DailyTask.RTI; i++){
        if (this._rM[i] != null) nonZeroCount++;
      }
      // if there was 1 past day due it is the last index (length - 1), etc
      const sbIndex = this._streakBar.length - nonZeroCount;
      this._streakBar[sbIndex] = Math.min(this.cM[cI] / required, 1);
      // use setter to store;
      this.streakBar = this._streakBar;
    }

    // update the single number streak indicator
    if (!this.paused) this._streak = this.calcStreak();

    // return any awards
    return getAwardData(this._calcType, oldT, this.totalM, oldS, this.streak);
  }

  checkRollOver(){
    // console.log("DailyTask[", this.name, "].checkRollOver()");
    // console.log(this.cM);
    if (!TimeDate.isMoreThanDay(this._updated) || this.paused) return;

    const [dCount, dateVal] = TimeDate.calcDaysFromVal(this._updated, this._daysMap);
    const dow = (new Date(dateVal)).getDay();

    for(let i = 0; i < dCount; i++){
      this.rollStreakBar(this._cM[DailyTask.RTI], this._rM[DailyTask.RTI]);
      this._rM.shift();
      this._rM.push(this._daysMap[(dow + i + 1) % 7] ? this._minDur : null);
      this._cM.shift();
      this._cM.push(0);
    }
    // use setters to store
    this.cM = this._cM;
    this.rM = this._rM;
    this.updated = dateVal;

    // update the single number streak indicator
    this._streak = this.calcStreak();
    // console.log(this.cM);
    // console.log("streak:", this.streak);
  }
}



// ----------------------------------------------------------------------------
//  WeeklyTask Sub-class
// ----------------------------------------------------------------------------



export class WeeklyTask extends Task {
  // this.rM's current period's index
  static RTI = 1;
  constructor(){
    super();
  }

  initialize(minDur, _, dayOfWeek, thisWeekReq=null){
    this.oldStreak = 0;
    this.streakBar = [0,0,0,0,0,0,0,0,0,0];
    this.rM = [0, thisWeekReq == null ? minDur : thisWeekReq, minDur];
    this.pcM = [0,0,0];
    this.updated = TimeDate.getRecentDateValOfDOW(dayOfWeek);
    this.storeMinDur(minDur);
  }

  get streak(){
    if (this._streak == null) this._streak = this.calcStreak();
    return this._streak;
  }
  get streakBar(){ 
    const sB = this._streakBar.slice();
    // if the past period was required append a value for past period
    if (this._rM[WeeklyTask.RTI - 1]) 
      sB.push(Math.min(1, this._pcM[WeeklyTask.RTI - 1] / this._rM[WeeklyTask.RTI - 1]));
    const thisP = this.thisPerIsStreak();
    // if this period is already finished append a 1 for this period
    if (thisP) sB.push(1);
    // if this period  is complete (or not required) & next period is complete
    if ((thisP || !this._rM[WeeklyTask.RTI]) && this.nexPerIsStreak()) sB.push(1);
    return sB.slice(-6);
  }
  set streakBar(v){ this.storeStreakBar(v); }

  get minDur(){ return this._minDur; }
  set minDur(v){
    // cache old values for this and next period
    const oldMD = this._rM[WeeklyTask.RTI];
    const oldMDNext = this._rM[WeeklyTask.RTI + 1];
    // update the values
    this._rM[WeeklyTask.RTI] = v;
    this._rM[WeeklyTask.RTI + 1] = v;
    // use setter to write to disk
    this.rM = this._rM;
    // update the pursuit minutes
    this.pursuit.adjustReqMin(v - oldMD, v - oldMDNext);
  }


  getUsage(dayAdjustInt){
    const p = TimeDate.dayAdjustToPeriodAdjust(dayAdjustInt, this.pursuit.dayOfWeek);
    const rI = p + WeeklyTask.RTI;
    const cI = p + Task.CTI;

    // complete this period, required this period, complete today
    return [this._pcM[rI], this._rM[rI], this._cM[cI]];
  }

  newPeriodRequiredMinutes(){
    return this.minDur;
  }

  thisPerIsStreak(){
    if (this._rM[WeeklyTask.RTI] && this._pcM[WeeklyTask.RTI] >= this._rM[WeeklyTask.RTI])
      return 1;
    else return 0;
  }

  nexPerIsStreak(){
    if (this._rM[WeeklyTask.RTI+1] && this._pcM[WeeklyTask.RTI+1] >= this._minDur) return 1;
    else return 0;
  }

  calcStreak(){
    let s = 0;
    const sArr = this.streakBar.toReversed();
    for(let i = 0; i < sArr.length; i++){
      if (sArr[i] == 1) s++;
      else break;
    }
    // if the streak bar is all full include oldStreak
    return (s == sArr.length) ? s + this._oldStreak : s;
  }


  registerTime(duration, dayAdjust){
    const restarted = false // check if there has been a lack of activity for a few days
    const oldP = this.pursuit.totalM;
    const oldT = this._totalM;
    const oldS = this.streak;
    const pI = WeeklyTask.RTI + TimeDate.dayAdjustToPeriodAdjust(dayAdjust, this.pursuit.dayOfWeek);
    const cI = Task.CTI + dayAdjust;
    const required = this._rM[pI] ? this._rM[pI] : 0;

    // update total minutes for task using setter
    this.totalM += duration;
    // update total minutes for pursuit using setter
    this.pursuit.totalM += duration;

    // UPDATE PURSUIT required minutes if necessary
    const stillReqM = required - this._pcM[pI];
    const reqMin = stillReqM < 0 || this.paused ? 0 : stillReqM;
    this.pursuit.registerTime(duration, Math.min(reqMin, duration), dayAdjust);

    // use setter to update the minutes complete in the period
    this._pcM[pI] += duration;
    this.pcM = this._pcM;
    // use setter to update the minutes complete for day (cM)
    this._cM[cI] += duration;
    this.cM = this._cM;

    // update the single number streak indicator
    if (!this.paused) this._streak = this.calcStreak();
    // return any awards
    return []; // getAwardData(this._calcType, oldT, this.totalM, oldP, this.pursuit.totalM, oldS, this.streak, restarted);
  }

  calcReqMinFromNow(){
    return [this._rM[WeeklyTask.RTI], this._minDur];
  }

  calcIncompleteMinFromNow(){
    return [
      Math.max(0, this._rM[WeeklyTask.RTI] - this._pcM[WeeklyTask.RTI]),
      Math.max(0, this._rM[WeeklyTask.RTI+1] - this._pcM[WeeklyTask.RTI+1]),
    ]
  }


  checkRollOver(){
    // console.log("WeeklyTask[", this.name, "].checkRollOver()", String(new Date(this._updated)));
    // console.log(this.pcM);
    // console.log(this.rM);
    // console.log("-------------");
    

    if (!TimeDate.isMoreThanWeek(this._updated)) return;

    const [periods, dateVal] = TimeDate.calcPeriodsFrom7DayRollover(this._updated);
    // console.log("PERIODS:", periods);
    for(let i = 0; i < periods; i++){
      this.rollStreakBar(this._pcM[WeeklyTask.RTI - 1], this._rM[WeeklyTask.RTI - 1]);
      this._rM.shift();
      this._rM.push(this._minDur);
      this._cM.shift();
      this._cM.push(0);
      this._pcM.shift();
      this._pcM.push(0);
    }
    // use setters to store
    this.updated = TimeDate.getRecentDateValOfDOW(this._pursuit.dayOfWeek, dateVal);
    this.cM = this._cM;
    this.rM = this._rM;
    this.pcM = this._pcM
    // refresh the stored numerical streak value
    this.calcStreak();

    // console.log(this.pcM);
  }
}
