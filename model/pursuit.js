
import { Storage } from './storage';
import { TimeDate } from './time';

const M = Storage();

export class Pursuit {
    // When app loads get the categoryIDs and the highest ID from storage
  static CIDs = [];
  static PURSUITS = [];
  static ACTIVE = null;
  static ID_COUNTER = null;
  
  static GET_NEXT_ID(){
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
    // make sure counter is further in future (because of device time changes)
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
    // console.log("ALL KEYS", M.STORAGE.getAllKeys());
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

  get CID(){return this._CID};
  get name(){return this._name};
  get totalM(){return this._totalM};
  get progress(){return this._progress};
  get progDur(){return this._progDur};
  get currentProgStart(){return this._currentProgStart};
  get taskIDs(){return this._taskIDs};
  get colorScheme(){return this._colorScheme}
  get reminders(){return this._reminders}
  get sounds(){return this._sounds}
  get dayOfWeek(){return this._dayOfWeek}
  get paused(){return this._paused};
  // progress update (just use mod operator since start of task)
  get lastUpdate(){return this._lastUpdate}
  get minutes(){return this._minutes}
  get requiredMin() {return this._minutes.required[0]}
  get completeMin() {return this._minutes.complete[0]}
  get streak(){
    const today = this._minutes.complete[0] > this.minutes.required[0] ? 1 : 0;
    const next = this._minutes.complete[1] > this.minutes.required[1] ? 1 : 0;
    return this._minutes.oldStreak + today + (today > 0 ? next : 0)
  }

  set taskIDs(v){
    this._taskIDs = v;
    M.STORAGE.set(this._CID + '.taskIDs', JSON.stringify(v));
  };
  set name(v){ 
    this._name = v;
    M.STORAGE.set(this._CID + '.name', v); 
  }
  set totalM(v){
    this._totalM = v;
    M.STORAGE.set(this._CID + '.totalM', v);
  }
  set progressDuration(v){
    this._progDur = v;
    M.STORAGE.set(this._CID + '.progDur', v);
  }
  set currentProgStart(dv){
    this._currentProgStart = dv
    M.STORAGE.set(this._CID + '.currentProgStart', this._currentProgStart); 
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
  set paused(v){
    // don't reset the pause-date if it already was paused
    if (v != false && this._paused != false) return;
    if (v) this.tasks.forEach(t => t.paused = true);
    else this.tasks.forEach(t => t.paused = false);
    const val = v ? TimeDate.nowVal() : false;
    this._paused = val;
    M.STORAGE.set(this._CID + '.paused', val);
  }
  set lastUpdate(date){
    this._lastUpdate = date.now();
    M.STORAGE.set(this._CID + '.lastUpdate', this._lastUpdate)
  }
  set minutes(v){ 
    this._minutes = v
    M.STORAGE.set(this._CID + '.minutes', JSON.stringify(v));
  }

  static CreateFromID(CID, key){
    const c = new Pursuit();
    c._CID = CID;
    c._name = M.STORAGE.getString(c._CID + '.name');
    c._totalM = M.STORAGE.getNumber(c._CID + '.totalM');
    c._minutes = JSON.parse(M.STORAGE.getString(c._CID + '.minutes'));
    c._progress = JSON.parse(M.STORAGE.getString(c._CID + '.progress'));
    c._progDur = M.STORAGE.getNumber(c._CID + '.progDur');
    c._currentProgStart = new Date(M.STORAGE.getString(c._CID + '.currentProgStart'));
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
    c._CID = 'c' + Pursuit.GET_NEXT_ID();
    c._progress = [0];
    c._taskIDs = [];

    Pursuit.CIDs.push(c._CID);
    M.STORAGE.set('CIDs', JSON.stringify(Pursuit.CIDs));
    M.STORAGE.set(c._CID + '.progress', JSON.stringify(c._progress));
    M.STORAGE.set(c._CID + '.taskIDs', JSON.stringify([]));

    c.name = name;
    c.dayOfWeek = startOfWeek;
    c.reminders = notifications;
    c.sounds = sounds;
    c.colorScheme = colorScheme;
    c.totalM = initialHours * 60;
    c.progressDuration = 1;
    c.paused = false;
    const dv = TimeDate.getRecentDateValOfDOW(startOfWeek);
    c.currentProgStart = dv;

    c.minutes = {
      // this period, next period
      required: [0,0], 
      complete: [0,0],
      updated: dv,
      oldStreak: 0,
    };
    c.key = Pursuit.PURSUITS.length;
    Pursuit.PURSUITS.push(c);
    console.log(c);
    return c;
  }

  // add time to completed minutes for required tasks
  registerTime(duration, futurePeriod=false){
    console.log("REGISTER TIME (duration, futurePeriod):",duration, futurePeriod);
    const index = futurePeriod ? 1 : 0;
    console.log("minutes", '\n', '-----------', this._minutes);
    this._minutes.complete[index] += duration;
    // use setter to write to storage
    console.log("minutes", '\n', '-----------', this._minutes);
    console.log()
  }

  // adjust the REQUIRED minutes (not the minutes completed)
  adjustReqMin(thisPeriod, nextPeriod=false){
    const now = thisPeriod ? thisPeriod : 0;
    const next = nextPeriod ? nextPeriod : 0;
    const l = this._minutes.required.length;
    this._minutes.required[l-2] += now; 
    this._minutes.required[l-1] += next; 
    // use setter to write to storage
    this.minutes = this._minutes;
    console.log("THIS", now, "NEXT", next, '\n', this.minutes);

  }

  addTask(task, id){
    const t = task
    // console.log("ADDING TASK:\n", t.TID, t.pursuit.name, t.name, t.calcType, t.minDur, t.defaultDur, t.daysMap, t.streak, t.minutes, t.paused, t.taskOrder, t.reminders);

    // add a reference of the task to the tasks array
    this.tasks.push(task);
    // add the task to the array of task IDs
    this._taskIDs.push(id);

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
    M.STORAGE.delete(this._CID + '.minutes');
    M.STORAGE.delete(this._CID + '.progress');
    M.STORAGE.delete(this._CID + '.name');
    M.STORAGE.delete(this._CID + '.totalM');
    M.STORAGE.delete(this._CID + '.progDur');
    M.STORAGE.delete(this._CID + '.currentProgStart');
    M.STORAGE.delete(this._CID + '.colorScheme');
    M.STORAGE.delete(this._CID + '.reminders');
    M.STORAGE.delete(this._CID + '.sounds');
    M.STORAGE.delete(this._CID + '.dayOfWeek');
    M.STORAGE.delete(this._CID + '.paused');

    // re-index the keys
    Pursuit.PURSUITS.forEach((p, i) => p.key = i);

    callBack?.();
  }


  checkRollOver(){
    if (!TimeDate.isMoreThanWeek(this._minutes.updated)) return;

    const [p, dVal] = TimeDate.calcPeriodsFrom7DayRollover(this._minutes.updated);
    if (p < 1) return;
    const m = this._minutes;
    for(let i = 0; i < p; i++){
      if (m[0].complete >= m[0].required && m[0].required != null) m.oldStreak++;
      else m.oldStreak = 0;
      m[0].required = m[1].required;
      m[0].complete = m[1].complete;
      // the future required should not change
      m[1].complete = 0;
    }

    m.updated = getRecentDateValOfDOW(this._pursuit.dayOfWeek, dateVal);
    this.minutes = m;
  }
}
