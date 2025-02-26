
import { Storage } from './storage';
import { TimeDate } from './time';
import { pursuitAward } from './awards';

const M = Storage();

export class Pursuit {
    // When app loads get the categoryIDs and the highest ID from storage
  static CIDs = [];
  static PURSUITS = [];
  static LAST_FULL_ROLL = null;
  static ACTIVE = null;
  static ID_COUNTER = null;
  // this.rM's TODAY's index
  static RTI = 1;

  static getFullRollDate(){
    // if first run or app restart
    if(Pursuit.LAST_FULL_ROLL == null){
      // if not first run
      if(M.STORAGE.contains('lastFullRoll')){
        Pursuit.LAST_FULL_ROLL = M.STORAGE.getNumber('lastFullRoll');
      } else {
        Pursuit.LAST_FULL_ROLL = TimeDate.todayDateVal();
        M.STORAGE.set('lastFullRoll', Pursuit.LAST_FULL_ROLL); 
      }
    }
    return Pursuit.LAST_FULL_ROLL;
  }

  static updateFullRollDate(){
    Pursuit.LAST_FULL_ROLL = TimeDate.todayDateVal();
    M.STORAGE.set('lastFullRoll', Pursuit.LAST_FULL_ROLL);
  }

  static fullRoll(){
    console.log("Pursuit.STATIC.fullRoll");
    for(const p of Pursuit.PURSUITS){
      p.checkRollOver();
    }
    Pursuit.updateFullRollDate();
  }

  static checkFullRoll(){
    if (TimeDate.isMoreThanDay(Pursuit.getFullRollDate())) Pursuit.fullRoll();
  }

  static async checkFullRollAsync(onFinish){
    console.log("Pursuit.STATIC.checkFullRollAsync", Pursuit.getFullRollDate(), TimeDate.nowVal(), TimeDate.isMoreThanDay(Pursuit.getFullRollDate()));
    if (TimeDate.isMoreThanDay(Pursuit.getFullRollDate())){
      Pursuit.fullRoll();
      onFinish?.(true);
    
    } else onFinish?.(false);
  }

  // static checkFullRoll(runAsync=false, onAsyncRollFinish=null){
  //   console.log("Pursuit.checkFullRoll()", Pursuit.getFullRollDate(), 
  //               TimeDate.nowVal(), TimeDate.nowVal() - Pursuit.getFullRollDate());
  //   if (TimeDate.isMoreThanDay(Pursuit.getFullRollDate())){
  //     console.log("Pursuit.checkFullRoll() : rolling");
  //     if (runAsync) Pursuit.asyncFullRoll(onAsyncRollFinish);
  //     else Pursuit.fullRoll();
      
  //     return true;
  //   }
  //   return false;
  // }


  
  static getNextID(){
    const d = TimeDate.nowVal();
    if(Pursuit.ID_COUNTER == null){
      // first run (pursuit / task creation)
      if(!M.STORAGE.contains('highID')){
        M.STORAGE.set('highID', d);
        return d; 
      }
      // first storage retrieval
      Pursuit.ID_COUNTER = M.STORAGE.getNumber('highID');
    }
    // make sure counter is further in future
    Pursuit.ID_COUNTER = (d > Pursuit.ID_COUNTER) ? d : Pursuit.ID_COUNTER + 1;
    // store latest (new highest) value
    M.STORAGE.set('highID', Pursuit.ID_COUNTER);
    return Pursuit.ID_COUNTER;
  }

  static initialize(wipe=false){
    Pursuit.CIDs = [];
    Pursuit.PURSUITS = [];
    Pursuit.ID_COUNTER = null;
    if (wipe) M.STORAGE.clearAll();
    console.log("STORAGE KEY COUNT:", (M.STORAGE.getAllKeys()).length);

    Pursuit.CIDs = M.STORAGE.contains('CIDs') ? JSON.parse(M.STORAGE.getString('CIDs')) : [];
    for(let i = 0; i < Pursuit.CIDs.length; i++){
      const c = Pursuit.CreateFromID(Pursuit.CIDs[i], i);
      Pursuit.PURSUITS.push(c);
    }
    console.log("PURSUITS:", Pursuit.PURSUITS.map(e=>e.name));
    return Pursuit.PURSUITS;
  }

  constructor(){
    this.tasks = [];
  }

  get CID(){return this._CID;}
  get name(){return this._name;}
  get totalM(){return this._tM[this._tM.length - 1];}
  get taskIDs(){return this._taskIDs;}
  get colorScheme(){return this._colorScheme;}
  get reminders(){return this._reminders;}
  get sounds(){return this._sounds;}
  get dayOfWeek(){return this._dayOfWeek;}
  get paused(){return this._paused;}
  get rM(){return this._rM;}
  get cM(){return this._cM;}
  get tM(){return this._tM;}
  get oldStreak(){return this._oldStreak;}
  get requiredMin() {return this._rM[Pursuit.RTI]}
  get completeMin() {return this._cM[Pursuit.RTI]}
  get updated(){return this._updated;}
  get streak(){
    // the last period will always be included in the streak
    let sum = this._cM[0] >= this._rM[0] && this._rM[0] ? 1 : 0;
    // if the last period is complete then add the oldStreak
    if (sum) sum += this._oldStreak;

    // this week is only added to the streak when complete
    const thisP = this._cM[1] >= this._rM[1] && this._rM[1] ? 1 : 0;
    // add the current week if it is complete
    sum += thisP;
    // next week is only added if this week is complete or has 0 required min
    if (thisP || !this._rM[1]) sum += (this._cM[2] >= this._rM[2] && this._rM[2] ? 1 : 0);

    return sum;
  }
  set taskIDs(v){
    this._taskIDs = v;
    M.STORAGE.set(this._CID + '.taskIDs', JSON.stringify(v));
  }
  set name(v){ 
    this._name = v;
    M.STORAGE.set(this._CID + '.name', v); 
  }
  set colorScheme(v){
    this._colorScheme = v;
    M.STORAGE.set(this._CID + '.colorScheme', v);
  }
  set reminders(v){
    this._reminders = v;
    M.STORAGE.set(this._CID + '.reminders', v);
  }
  set sounds(v){
    this._sounds = v;
    M.STORAGE.set(this._CID + '.sounds', v);
  }
  set dayOfWeek(v){
    this._dayOfWeek = v;
    M.STORAGE.set(this._CID + '.dayOfWeek', v);
  }
  set rM(v){ 
    this._rM = v;
    M.STORAGE.set(this._CID + '.rM', JSON.stringify(v));
  }
  set cM(v){ 
    this._cM = v;
    M.STORAGE.set(this._CID + '.cM', JSON.stringify(v));
  }
  set tM(v){ 
    this._tM = v;
    M.STORAGE.set(this._CID + '.tM', JSON.stringify(v));
  }
  set oldStreak(v){
    this._oldStreak = v;
    M.STORAGE.set(this._CID + '.oldStreak', v);
  }
  set updated(v){
    this._updated = v;
    M.STORAGE.set(this._CID + '.updated', v);
  }
  set paused(v){
    // don't reset the pause-date if it already was paused
    if (v != false && this._paused != false) return;
    if (v) this.tasks.forEach(t => t.paused = true);
    else this.tasks.forEach(t => t.paused = false);
    const val = v ? TimeDate.nowVal() : false;
    this._paused = val;
    M.STORAGE.set(this._CID + '.paused', val);
  }


  static CreateFromID(CID, key){
    const c = new Pursuit();
    c._CID = CID;
    c._name = M.STORAGE.getString(c._CID + '.name');
    c._totalM = M.STORAGE.getNumber(c._CID + '.totalM');
    c._updated = M.STORAGE.getNumber(c._CID + '.updated');
    c._oldStreak = M.STORAGE.getNumber(c._CID + '.oldStreak');
    c._tM = JSON.parse(M.STORAGE.getString(c._CID + '.tM'));
    c._cM = JSON.parse(M.STORAGE.getString(c._CID + '.cM'));
    c._rM = JSON.parse(M.STORAGE.getString(c._CID + '.rM'));
    const TIDs = M.STORAGE.getString(c._CID + '.taskIDs');
    c._taskIDs = TIDs ? JSON.parse(TIDs) : [];
    c._colorScheme = M.STORAGE.getNumber(c._CID + '.colorScheme');
    c._reminders = M.STORAGE.getBoolean(c._CID + '.reminders') == true;
    c._sounds = M.STORAGE.getBoolean(c._CID + '.sounds') == true;
    c._dayOfWeek = M.STORAGE.getNumber(c._CID + '.dayOfWeek');
    const p = M.STORAGE.getNumber(c._CID + '.paused');
    c._paused = (p) ? new Date(p) : false;
    c.key = key;
    return c;
  }

  // make new category and save in STORAGE
  static MakeNew(name, startOfWeek, colorScheme, notifications, sounds, initialHours){
    const c = new Pursuit();
    c._CID = 'c' + Pursuit.getNextID();
    c._taskIDs = [];

    Pursuit.CIDs.push(c._CID);
    M.STORAGE.set('CIDs', JSON.stringify(Pursuit.CIDs));
    M.STORAGE.set(c._CID + '.taskIDs', JSON.stringify([]));

    c.name = name;
    c.dayOfWeek = startOfWeek;
    c.reminders = notifications;
    c.sounds = sounds;
    c.colorScheme = colorScheme;
    c.paused = false;
    const dv = TimeDate.getRecentDateValOfDOW(startOfWeek);
    c.currentProgStart = dv;

    c.rM = [0,0,0]; 
    c.cM = [0,0,0];
    c.tM = [initialHours * 60, initialHours * 60];
    c.updated = dv;
    c.oldStreak = 0,

    c.key = Pursuit.PURSUITS.length;
    Pursuit.PURSUITS.push(c);
    console.log(c);
    return c;
  }

  // add time to completed minutes for total time & required tasks
  registerTime(total, required, dayAdjust){
    console.log("pursuit.registerTime:", total, required, dayAdjust);
    const i = Pursuit.RTI + TimeDate.dayAdjustToPeriodAdjust(dayAdjust, this._dayOfWeek);
    this._cM[i] += required;
    // use setter to store;
    this.cM = this._cM;
    // cache the old value
    const oldM = this.totalM;
    // always add to the latest total since cumulative
    this._tM[this._tM.length - 1] += total;
    // if past period, also add to past period
    if (i < 0) this._tM[this._tM.length -2] += total;
    this.tM = this._tM;

    // TODO pursuit completed required minutes award
    return pursuitAward(oldM, this.totalM);
  }



  // adjust the REQUIRED minutes (not the minutes completed)
  adjustReqMin(thisPeriod, nextPeriod=false){
    const now = thisPeriod ? thisPeriod : 0;
    const next = nextPeriod ? nextPeriod : 0;
    this._rM[Pursuit.RTI] += now; 
    this._rM[Pursuit.RTI + 1] += next; 
    // use setter to write to storage
    this.rM = this._rM;
    // console.log("THIS", now, "NEXT", next, '\n', this.rM);
  }

  addTask(task, id){
    // const t = task
    // console.log("ADDING TASK:\n", t.TID, t.pursuit.name, t.name, t.calcType, t.minDur, t.defaultDur, t.daysMap, t.streak, t.minutes, t.paused, t.taskOrder, t.reminders);

    // add a reference of the task to the tasks array
    this.tasks.push(task);
    // add the task to the array of task IDs
    this._taskIDs.push(id);

    this.adjustReqMin(...task.calcReqMinFromNow());

    // update the task ids in storage
    M.STORAGE.set(this._CID + '.taskIDs', JSON.stringify(this._taskIDs));

  }
  removeTaskID(id){
    var change = false;
    for(let i = 0; i < this._taskIDs.length; i++){
      if(this._taskIDs[i] == id){
        this._taskIDs.splice(i,1);
        change = true;
        break;     
      } 
    }
    if (change) M.STORAGE.set(this._CID + '.taskIDs', JSON.stringify(this._taskIDs));
  }

  deleteTask(id, task){
    const index = this.tasks.indexOf(task);
    if (index >= 0 && index < this.tasks.length) this.tasks.splice(index, 1);
    const idIndex = this._taskIDs.indexOf(id);
    if (idIndex >= 0 && idIndex < this._taskIDs.length) this._taskIDs.splice(idIndex, 1);
    this.taskIDs = this._taskIDs;
  }

  delete(callBack=null){
    Pursuit.PURSUITS.splice(this.key, 1);
    Pursuit.CIDs.splice(this.key, 1);

    // use removeFromPursuits false flag to stop index perversion
    for(const t of this.tasks) t.delete(false);
    M.STORAGE.set('CIDs', JSON.stringify(Pursuit.CIDs));
    M.STORAGE.delete(this._CID + '.taskIDs');
    M.STORAGE.delete(this._CID + '.tM');
    M.STORAGE.delete(this._CID + '.cM');
    M.STORAGE.delete(this._CID + '.rM');
    M.STORAGE.delete(this._CID + '.name');
    M.STORAGE.delete(this._CID + '.colorScheme');
    M.STORAGE.delete(this._CID + '.reminders');
    M.STORAGE.delete(this._CID + '.sounds');
    M.STORAGE.delete(this._CID + '.dayOfWeek');
    M.STORAGE.delete(this._CID + '.paused');
    M.STORAGE.delete(this._CID + '.updated');
    M.STORAGE.delete(this._CID + '.oldStreak');

    // re-index the keys
    Pursuit.PURSUITS.forEach((p, i) => p.key = i);
    callBack?.();
  }

  checkRollOver(){
    let reqMin = 0;
    this.tasks.forEach(t => {
      t.checkRollOver();
      reqMin += t.newPeriodRequiredMinutes();
    });

    if (!TimeDate.isMoreThanWeek(this._updated)) return;

    const [pCount, dVal] = TimeDate.calcPeriodsFrom7DayRollover(this._updated);

    for(let i = 0; i < pCount; i++){
      this._rM.shift();
      this._rM.push(reqMin);
      this._cM.shift();
      this._cM.push(0);
      // no need to update if no time has been registered yet
      if(this._tM.length > 2 || this._tM[1] != 0)
        this._tM.push(this._tM[this._tM.length - 1]);
    }

    this.updated = TimeDate.getRecentDateValOfDOW(this._dayOfWeek, dVal);
    this.rM = this._rM;
    this.cM = this._cM;
    this.tM = this._tM;
  }
}
