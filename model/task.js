import { Storage } from './storage';
import { Pursuit } from './pursuit';
import { getAwardData } from './awards';
import { TimeDate } from './time';
import { Notify } from './notifications';

const M = Storage();

export class Task {
  static TASKS = [];
  static ACTIVE = null;

  static initialize(pursuitArray){
    Task.TASKS = [];
    for(const p of pursuitArray){
      for(const id of p.taskIDs){
        const t = Task.CreateFromID(id, p);
        p.tasks.push(t);
        t.checkRollOver();
      }
    }
    Task.TASKS.sort((a,b)=>a.taskOrder-b.taskOrder);

    Task.TASKS.forEach(e=>console.log(e.name, e.pursuit.name));

    // console.log("ALL KEYS:\n", M.STORAGE.getAllKeys());
  }

  constructor(){
    this._pursuit = null;
    this._streak = null;
    this._minDur = 0;
  }

  get TID(){ return this._TID };
  get pursuit(){ return this._pursuit };
  get name(){ return this._name };
  get calcType(){ return this._calcType };
  get defaultDur(){ return this._defaultDur };
  get daysMap(){ return this._daysMap };
  get totalM(){ return this._totalM };
  get minutes(){ return this._minutes };
  get paused(){ return this._paused };
  get taskOrder(){ return this._taskOrder};
  get minDur(){ return this._minDur };
  get streakBar(){ return this._minutes.streakBar };
  get reminders(){return this._notifyTime > 0 && this?.pursuit?.reminders && Notify.STATUS.canSend } 
  get notifyIDs(){ return this._notifyIDs };
  get reminderTime(){ return new Date (Math.abs(this._notifyTime))}
  // lazy instantiation as cells are displayed (since flashlist makes this fast)
  get streak(){
    if (this._streak == null) this._streak = this.calcStreak();
    return this._streak;
  }

  // req(i){ return this._minutes.required[i] }
  // com(i){ return this._minutes.complete[i] }
  // setReq(i,v){ this._minutes.required[i] = v }
  // setCom(i,v){ this._minutes.required[i] = v }

  set pursuit(v){
    this._pursuit = v;
  }
  set name(v){ 
    this._name = v
    M.STORAGE.set(this._TID + '.name', v); 
  }
  set calcType(v){ 
    this._calcType = v
    M.STORAGE.set(this._TID + '.calcType', v); 
  }
  set defaultDur(v){ 
    this._defaultDur = v
    M.STORAGE.set(this._TID + '.defaultDur', v); 
  }
  set totalM(v){ 
    this._totalM = v
    M.STORAGE.set(this._TID + '.totalM', v); 
  }
  set minutes(v){ 
    this._minutes = v
    M.STORAGE.set(this._TID + '.minutes', JSON.stringify(v));
  }
  set notifyIDs(v){
    this._notifyIDs = v;
    M.STORAGE.set(this._TID + '.notifyIDs', JSON.stringify(v));
  }
  set reminders(v){
    if (v) {
      this.cancelNotify();
      this.setNotify(true);
      this._notifyTime = Math.abs(this._notifyTime);
    } else {
      this.cancelNotify();
      this._notifyTime = Math.abs(this._notifyTime) * -1;
    }
    this.notifyTime = this._notifyTime;
  }
  set notifyTime(v){
    this._notifyTime = v;
    M.STORAGE.set(this._TID + '.notifyTime', v);
  }
  set reminderTime(v){

    this.setNotify(true)
    let t = v.valueOf();
    if (this._notifyTime < 0) t *= -1;
    // use setter to store
    this.notifyTime = t;
  }
  set paused(v){
    // don't reset the pause-date if it already was paused
    if (v != false && this._paused != false) return;

    if (v != false) this.removeIncompletePursuitMinutes(); 
    else this.restorePausedMinutes();

    this.storePause(v);
  }
  set taskOrder(v){
    this._taskOrder = v;
    M.STORAGE.set(this._TID + '.taskOrder', v);
  }
  set minDur(v){ 
    const [reqMin, nextReqMin] = this.calcReqMin(true);
    this._minDur = v;
    M.STORAGE.set(this._TID + '.minDur', v); 

    // prevents _minutes from being used by accident before it exists
    if (!this._minutes) 
      return console.warn('Task._minutes must be set before minDur');

    const todayI = this._minutes.required.length - 2;
    if (this._minutes.required[todayI] != null) this._minutes.required[todayI] = v;
    // for daily and 7-day tasks tomorrow needs to also be set
    if (this.calcType > 0 && this._minutes.required[todayI + 1] != null) 
      this._minutes.required[todayI + 1] = v;
    // use setter to update storage
    this.minutes = this._minutes;
    // no need to adjust required minutes for Once and Anytime tasks
    if(this._calcType < 1) return;
    const [newReqMin, newNextReqMin] = this.calcReqMin(true);
    // adjust pursuit required minutes remaining
    this.pursuit.adjustReqMin(newReqMin - reqMin, newNextReqMin - nextReqMin);
  }
  set daysMap(v){ 
    // calculate old requirements BEFORE saving map which it depends on
    const [reqMin, nextReqMin] = this.calcReqMin(true);
    // store old map to compare for finding changes
    const oldMap = this._daysMap;
    // write the changes
    this._daysMap = v;
    this.storeMap(this._daysMap);

    // if daily task then changing day map will change time requirements
    if(this._calcType == 1){
      const todayI = this._minutes.required.length - 2;
      const today = TimeDate.getDay();

      if (v[today] && !oldMap[today])
        this._minutes.required[todayI] = this._minDur;
      else if (!v[today] && oldMap[today])
        this._minutes.required[todayI] = 0;
      
      const tomorrow = (today + 1) % 7;
      if (v[tomorrow] && !oldMap[tomorrow])
        this._minutes.required[todayI + 1] = this._minDur; 
      else if (!v[tomorrow] && oldMap[tomorrow])
        this._minutes.required[todayI + 1] = 0;

      // use setter to write minutes to storage
      this.minutes = this._minutes;
      // after saving the minutes calculate the new time requirements
      const [newReqMin, newNextReqMin] = this.calcReqMin(true);

      // adjust pursuit required minutes remaining
      this.pursuit.adjustReqMin(newReqMin - reqMin, newNextReqMin - nextReqMin);

      this.cancelNotify();
      this.setNotify();
    }
  }
  storePause(v){
    this._paused = (v == false) ? 0 : TimeDate.now();
    M.STORAGE.set(this._TID + '.paused', (v == false) ? 0 : this._paused.valueOf());
  }

  storeMap(m){
    const daysInt = parseInt(m.map(e => e ? '1' : '0').join(''), 2);
    M.STORAGE.set(this._TID + '.daysMap', daysInt); 
  }



  static CreateFromID(TID, pursuit){
    const t = new Task();
    t._TID = TID;
    t._pursuit = pursuit;
    t._name = M.STORAGE.getString(t._TID + '.name');
    t._calcType = M.STORAGE.getNumber(t._TID + '.calcType');
    t._defaultDur = M.STORAGE.getNumber(t._TID + '.defaultDur');
    t._minDur = M.STORAGE.getNumber(t._TID + '.minDur');
    const days = M.STORAGE.getNumber(t._TID + '.daysMap');
    t._daysMap = days.toString(2).split('').map(e => e == '1');
    t._totalM = M.STORAGE.getNumber(t._TID + '.totalM');
    t._minutes = JSON.parse(M.STORAGE.getString(t._TID + '.minutes'));
    const p = M.STORAGE.getNumber(t._TID + '.paused');
    t._paused = (p && p > 0) ? new Date(p) : false;
    t._taskOrder = M.STORAGE.getNumber(t._TID + '.taskOrder');
    t._notifyTime = M.STORAGE.getNumber(t._TID + '.notifyTime');
    t._notifyIDs = JSON.parse(M.STORAGE.getString(t._TID + '.notifyIDs'));
    Task.TASKS.push(t);
    return t;
  }


  // make new TASK and save in STORAGE 
  // passing a number to thisWeekReq can be used to modify minutes for 1st week
  static MakeNew(pursuit, name, calcType, minDur, defaultDur, daysMap, time, reminders, thisWeekReq = null){
    const t = new Task();
    t.pursuit = pursuit;
    t._TID = Pursuit.GET_NEXT_ID();
    t.name = name;
    // oneTime/anyTime/daily/week (-1, 0, 1, 7)
    t.calcType = calcType;
    t.defaultDur = defaultDur;
    t.totalM = 0; 
    t.storePause(false)   
    t.taskOrder = (Task.TASKS.length);
    t.notifyTime = time * (reminders ? 1 : -1);
    pursuit.addTask(t, t.TID);
    Task.TASKS.push(t);
    // days map setter recalculates required minutes so store using storeMap()
    t._daysMap = daysMap;
    t.storeMap(daysMap);
    const dv = TimeDate.todayDateVal();

    // 7 day broken into 3 periods (last, current, next)
    if (calcType == 7) 
      t.minutes = {
        required: [0, thisWeekReq == null ? minDur : thisWeekReq, minDur], 
        complete: [0,0,0],
        streakBar:[0,0,0,0],
        updated: TimeDate.getRecentDateValOfDOW(t.pursuit.dayOfWeek), 
        oldStreak: 0,
      };
    // once
    else if (calcType == 0) 
      t.minutes = {required:[minDur], complete:[0], oldStreak:0, updated:dv};
    // anytime
    else if (calcType == -1)
      t.minutes = {required:[defaultDur], complete:[0], oldStreak:0, updated:dv};
    // daily (last 6 days, today, tomorrow)
    else {
      const today = TimeDate.getDay();
      t.minutes = {
        required: [null,null,null,null,null,null,
                  daysMap[today] ? minDur : null, (daysMap[(today + 1) % 7]) ? minDur : null],
        complete: [0,0,0,0,0,0,0,0],
        streakBar:[0,0,0,0,0,0,0],
        updated: dv,
        oldStreak: 0,
      }
    }
    // use setter which calculates the required minutes everywhere
    t.minDur = minDur;
    t.notifyIDs = [];
    if (t.reminders) t.setNotify();
    return t;
  }


  static getTasks(dayAdjuster){
    const once = [];
    const tasks = [];
    const anyTime = [];
    const tomoTasks = [];

    for(t of Task.TASKS){
      if (t.paused) continue;

      const [complete, required] = t.getUsage(0);

      // if daily task
      if (t.calcType == 1){
        const indexToday = t.minutes.required.length - 2;
        // if due on viewed day
        if (t.minutes.required[indexToday + dayAdjuster]) tasks.push(t);
        // if viewing todays tasks & task is due tomorrow
        if (dayAdjuster == 0 && t.minutes.required[indexToday + 1]){
          // if already complete today, show in tomorrow section
          if (complete >= required) tomoTasks.push(t);
        }
      // if weekly task
      } else if (t.calcType == 7){
        // always show weekly tasks
        tasks.push(t); 
        // if new period starts tomorrow & this period's minutes complete, show in tomorrow
        if (dayAdjuster == 0 && complete >= required 
            && t.pursuit.dayOfWeek == (TimeDate.getDay() + 1) % 7)
          tomoTasks.push(t);
      }  
      // if active day is today
      else if (dayAdjuster == 0){
        // if do once type
        if (t.calcType == 0) once.push(t);
        // if anytime type
        if (t.calcType == -1) anyTime.push(t);
      } 
    }
    return {current: tasks, once: once, anyTime: anyTime, tomorrow: tomoTasks};
  }


  // calculate total required minutes for this period & for next period
  calcReqMin(ignorePastDays = false){
    if (!this?._minDur) this._minDur = 0;
    if (this._calcType < 1) return [0,0];
    if (this._calcType == 7) return [this._minDur, this._minDur];

    let nextP = 0;
    // nextPeriod will be a full period so daysMap * current minimum duration
    this._daysMap.map(e => nextP += e ? this._minDur : 0);

    const today = TimeDate.getDay();
    // if today is start of the week then full period * current min so:
    if (today == this.pursuit.dayOfWeek) return [nextP, nextP];
    
    // thisPeriod needs to account for possible past differences in required min
    // number of past days until start of week
    const pastDays = (today + 7 - this.pursuit.dayOfWeek) % 7;
    let thisP = 0;

    // add the required minutes for past days
    if(!ignorePastDays){
      const todaysIndex = this._minutes.required.length - 2;
      for(let i = todaysIndex - pastDays; i < todaysIndex; i++){
        thisP += this._minutes.required[i];
      }
    }

    // add the required minutes for today and future days
    const nonPastDays = 7 - pastDays;
    const daysArr = this._daysMap.concat(this._daysMap);
    daysArr.slice(today, today + nonPastDays).map(e => thisP += (e ? this._minDur : 0));

    return [thisP, nextP];
  }

  getIndex(dayAdjust){
    const len = this._minutes.complete.length
    // for once and anytime calc types
    let index = 0;
    // last index is tomorrow, 2nd last is today
    if (this.calcType == 1) index = len - 2 + dayAdjust;
    // 7 day (weekly)type
    else if (this.calcType == 7){
      const weekStart = this.pursuit.dayOfWeek;
      const day = TimeDate.getDay();
      // if tomorrow is the weekStart (tomorrow a new period)
      if (dayAdjust == 1 && weekStart == (day + 1) % 7) index = len - 1;
      // if days back to week start < days to go back to active day
      if (dayAdjust < 0 && (day + 7 - weekStart) % 7 < dayAdjust * -1) index = len - 3;
      // if current period
      else index = len - 2;       
    }
    return index;
  }

  updateStreakBar(dataIndex, streakBarIndex){
    const c = this._minutes.complete[dataIndex];
    const r = (this._minutes.required[dataIndex] != null)
              ? this._minutes.required[dataIndex] : 0;
    const sB = (r == 0) ? 0 : Math.min(c / r, 1)
    this._minutes.streakBar[streakBarIndex] = sB;
  }

  calcStreak(){
        // only daily and 7-day tasks should have streaks
        if (this._calcType < 1) return null;

        const thisReq = this.minutes.required[this.minutes.required.length - 2];
        const thisComp = this.minutes.complete[this.minutes.complete.length - 2];
        const nextReq = this.minutes.required[this.minutes.required.length - 1];
        const nextComp = this.minutes.complete[this.minutes.complete.length - 1]; 
        const thisPeriod = (thisReq > 0 && thisReq - thisComp <= 0) ? 1 : 0;
        const nextPeriod = (nextReq > 0 && nextReq - nextComp <= 0) ? 1 : 0;
    
        const sArr = this._minutes.streakBar.toReversed();
        let streak = 0;
        for(let i = 0; i < sArr.length; i++){
          if (sArr[i] == 1) streak++;
          else break;
        }
    
        if (streak < sArr.length) return thisPeriod + nextPeriod + streak;
        else return thisPeriod + nextPeriod + streak + this._minutes.oldStreak;
  }

  registerTime(duration, dayAdjust){
    const oldP = this.pursuit.totalM;
    const oldT = this._totalM;
    const oldS = this.streak;

    const index = this.getIndex(dayAdjust);
    // used for awards
    const restarted = this._calcType > 0 && dayAdjust == 0 
                   && this._minutes.complete[index] == 0 && oldS == 0;

    const required = this._minutes.required[index] ? this._minutes.required[index] : 0;
    // index of the current day/week for daily/7-day tasks
    const currentPeriodI = this._minutes.required.length - 2; 
    // index of future period tomorrow/next week for daily/7-day tasks
    const futurePeriodI = this._minutes.required.length - 1;
    const tomorrow = (TimeDate.getDay()+1) % 7;

    // UPDATE PURSUIT required minutes if necessary
    const stillReqM = required - this._minutes.complete[index];

    if(stillReqM > 0 && !this.paused){
      // for 7-day, time is either registered for current or future period based on index
      if (this._calcType == 7){
        this.pursuit.registerTime(Math.min(stillReqM, duration), index == futurePeriodI);
      // if daily
      } else if (this._calcType == 1){
        const newP = (index == futurePeriodI && tomorrow == this.pursuit.dayOfWeek)
        this.pursuit.registerTime(Math.min(stillReqM, duration), newP);
      }
    }

    // update total minutes per period
    this._minutes.complete[index] += duration;
    // update total minutes for task using setter
    this.totalM += duration;
    // update total minutes for pursuit using setter
    this.pursuit.totalM += duration;



    // Deal with streak bar (only need to worry about past)

    // if 7-day and index indicates the past week was entered
    if (!this.paused && this.calcType == 7 && index == 0){
      // since you can only go back 6 days it will be data from last index
      this.updateStreakBar(index, this._minutes.streakBar.length - 1)
      
    // if task is daily & being registered for a past day & task is due on that day
    } else if (!this.paused && this.calcType == 1 && dayAdjust < 0 && required != 0){
      let nonNullCount = 0;
      // count the number of past days the task was due
      for(let i = index; i < currentPeriodI; i++){
        if (this._minutes.required[i] != null) nonNullCount++;
      }
      // if there was 1 past day due it is the last index (length - 1), etc
      const sbIndex = this._minutes.streakBar.length - nonNullCount;
      this.updateStreakBar(index, sbIndex);
    }

    // use setter to save value to storage
    this.minutes = this._minutes;
    // update the single number streak indicator
    if (!this.paused) this._streak = this.calcStreak();

    // deal with streak awards (only for today is fine)
    // the model will automatically update past data for missing streaks
    // check if hours at threshold (hours award)
    // check if long time since last complete (back on the horse award)

    // return whether gamified view is required using shouldShowReward method

    return getAwardData(this._calcType, oldT, this.totalM, oldP, this.pursuit.totalM, oldS, this.streak, restarted);
  }


  getUsage(dayAdjust){
    const index = this.getIndex(dayAdjust);
    return [this.minutes.complete[index], this.minutes.required[index]];
  }


  // stop remove all remaining required minutes
  // pause remove all remaining required minutes for this and 
  // change type to any or once
  // WHAT TO DO WHEN CHANGE TYPE BACK (just make new with old data)
  // WHAT TO DO WHEN CHANGE BETWEEN DAILY AND WEEKLY AND VICE VERSA
  calcIncompleteMinutesThisNextPeriod(){
    const getDiffAtI = (i) => {
      const r = this._minutes.required[i] ? this._minutes.required[i] : 0;
      const c = this._minutes.complete[i] ? this._minutes.complete[i] : 0;
      return Math.max(0, r - c);
    }

    let nowAmount = 0;
    let nextAmount = 0;
    const l = this._minutes.required.length;

    // Calculate for 7-day
    if(this._calcType == 7){
      nowAmount = getDiffAtI(l-2);
      nextAmount = getDiffAtI(l-1);

    // Calculate for Daily
    } else if (this._calcType == 1){
      const today = TimeDate.getDay();

    // Future period (next Amount)
      // for daily the next amount is the minDur * dayMap days minus 
      // anything done tomorrow if tomorrow is the start of a new period
      this.daysMap.forEach(v => nextAmount += v ? this._minDur : 0);
      // if tomorrow is new period subtract tomorrows completed from next period
      if ((today + 1) % 7 == this.pursuit.dayOfWeek) nextAmount -= getDiffAtI(l-1);
  
      
      // number of days since the start of week to today
      const daysAgo = (today + 7 - this.pursuit.dayOfWeek) % 7;
      const daysRemaining = 7 - daysAgo;
      const startIndex = l - 2;
      const endIndex = startIndex + daysRemaining;
      // the gap between the minutes.completed/required & daysOfWeek indices
      const gap = (startIndex + 7 - today) % 7;
    
      // add up uncompleted required minutes for days remaining in the pursuit week
      for(let i = startIndex; i < endIndex; i++){
        // while in range use the difference between required and completed
        if (i < l) nowAmount += getDiffAtI(i);
        // afterwards use the days map & add minDur for days task is required
        else nowAmount += (this.daysMap[(i - gap) % 7] ? this._minDur : 0);

        console.log(daysAgo, i, i - daysAgo, (i - gap) % 7);
      }
    }
    return [nowAmount, nextAmount];
  }

  restorePausedMinutes(){
    if (this._calcType < 1) return;

    const [thisP, nextP] = this.calcIncompleteMinutesThisNextPeriod();
    console.log(" PAUSED NOW, NEXT", thisP, nextP);
    this.pursuit.adjustReqMin(thisP, nextP);
  }

  removeIncompletePursuitMinutes(){
    if (this._calcType < 1) return;

    const [thisP, nextP] = this.calcIncompleteMinutesThisNextPeriod();
    console.log("REMOVE NOW, NEXT", -1 * thisP, -1 * nextP);
    this.pursuit.adjustReqMin(-1 * thisP, -1 * nextP);
  }

  delete(pursuitRemains = true, callback=null){
    // remove from pursuit (storage & in-memory model)
    if (pursuitRemains){
      this.pursuit.deleteTask(this._TID, this);
      this.removeIncompletePursuitMinutes();
    } 
    // remove from storage
    M.STORAGE.delete(this._TID + '.minutes');
    M.STORAGE.delete(this._TID + '.name');
    M.STORAGE.delete(this._TID + '.calcType');
    M.STORAGE.delete(this._TID + '.defaultDur');
    M.STORAGE.delete(this._TID + '.minDur');
    M.STORAGE.delete(this._TID + '.daysMap');
    M.STORAGE.delete(this._TID + '.totalM');
    M.STORAGE.delete(this._TID + '.paused');
    M.STORAGE.delete(this._TID + '.taskOrder');
    M.STORAGE.delete(this._TID + '.notifyTime');
    // remove from in-memory model
    const index = Task.TASKS.indexOf(this);
    Task.TASKS.splice(index, 1);
    // reassign taskOrder vals so they are still 0 through length - 1
    Task.TASKS.forEach((t, i) => t.taskOrder = i);
  }



  anyRollOver(){
    this.minutes = {
      required:[this._defaultDur], 
      complete:[0], 
      oldStreak:0, 
      updated:TimeDate.todayDateVal()
    };
  }

  updateStreak(m, complete, required){
    // if no require minutes, it does not count toward streak
    if(required == null || required == 0) return;

    if (m.streakBar[0] == 1) m.oldStreak++;
    else m.oldStreak = 0;

    m.streakBar.shift();
    m.streakBar.push(Math.min(1, complete / required));
  }

  rollWeekly(periods, dateVal){
    if (periods < 1) return;

    const m = this._minutes;
    const thisI = m.required.length - 2;
    for(let i = 0; i < periods; i++){
      this.updateStreak(m, m.complete[thisI], m.required[thisI]);
      m.required.shift();
      m.required.push(this._minDur);
      m.complete.shift();
      m.complete.push(0);
    }
    m.updated = TimeDate.getRecentDateValOfDOW(this._pursuit.dayOfWeek, dateVal);
    console.log(m);
    this.minutes = m;
    this.calcStreak;
  }

  rollDaily(dCount, dateVal){
    if(dCount < 1){
      m.updated = dateVal;
      this.minutes = m;
      return;
    }

    const m = this._minutes;
    const thisI = m.required.length - 2;
    const dow = (new Date(dateVal)).getDay();
    for(let i = 0; i < dCount; i++){
      this.updateStreak(m, m.complete[thisI], m.required[thisI]);
      m.required.shift()
      m.required.push(this._daysMap[(dow + i + 1) % 7] ? this._minDur : null)
      m.complete.shift()
      m.complete.push(0);
    }
    m.updated = dateVal;
    this.minutes = m;
    this.calcStreak();
  }

  checkRollOver(){
    if (this._calcType == 0) return;

    if (this._calcType == -1 && TimeDate.isMoreThanDay(this._minutes.updated))
      return this.anyRollOver();

    if (this._calcType == 1 && TimeDate.isMoreThanDay(this._minutes.updated)){
      const [d, dVal] = TimeDate.calcDaysFromVal(this._minutes.updated, this._daysMap);
      console.log("DAYS:", d);
      console.log(this.minutes);
      this.rollDaily(d, dVal);
      console.log(this.minutes);
    } else if (this._calcType == 7 && TimeDate.isMoreThanWeek(this._minutes.updated)){
      const [p, dVal] = TimeDate.calcPeriodsFrom7DayRollover(this._minutes.updated);
      if (p > 0) this.rollWeekly(p, dVal);
    }
  }



  async setNotify(force){
    if (!Notify.STATUS.canSend) return;

    if (force) this.notifyTime == Math.abs(this._notifyTime);
    else if (!this.reminders || this._notifyTime < 0) return;

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
          hours: d.getHours(),
          minute: d.getMinutes(),
          repeats: true
        }
      }

      const id = await Notify.send(mObj);
      console.log(id, '\n', mObj);
      ids.push(id);
      await (()=>new Promise(empty=>setTimeout(empty, 500)))();
    }
    this.notifyIDs = ids;
  }

  async cancelNotify(){
    for(const id of this._notifyIDs){
      if(id == 0) continue;

      await Notify.cancel(id);
    }
  }
}
