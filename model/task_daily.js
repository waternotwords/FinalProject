
// import { Task } from './task';
// import { TimeDate } from './time';

// export class DailyTask extends Task {
//   // this.rM's TODAY's index
//   static RTI = 6;

//   constructor(){
//     super();
//   }

//   initialize(minDur, daysMap){
//     const today = TimeDate.getDay();
//     this.streakBar = [0,0,0,0,0,0,0,0,0,0];
//     this.rM = [null,null,null,null,null,null,
//                daysMap[today] ? minDur : null,              // today
//                (daysMap[(today + 1) % 7]) ? minDur : null], // tomorrow
//     this.updated = TimeDate.todayDateVal();
//     this.oldStreak = 0;
//     this.storeMinDur(minDur);
//   }

//   get streak(){
//     if (this._streak == null) this._streak = this.calcStreak();
//     return this._streak;
//   }

//   set daysMap(v){ 
//     // calculate old requirements BEFORE saving map which it depends on
//     const [reqMin, nextReqMin] = this.calcReqMinFromNow();
//     // store old map to compare for finding changes
//     const oldMap = this._daysMap;
//     // write the changes
//     this.storeMap(v);

//     const today = TimeDate.getDay();

//     // for today and tomorrow
//     for(let i = 0; i < 2; i++){
//       const d = (today + i) % 7;
//       // if the old map did not require minutes but new map does
//       if (!oldMap[d] && v[d])
//         this._rM[DailyTask.RTI + i] = this._minDur;
//       // if old map required but new one doesn't
//       else if (oldMap[d] && !v[d])
//         this._rM[DailyTask.RTI + i] = 0;
//     }

//     // use setter to write minutes to storage
//     this.rM = this._rM;
//     // after saving the minutes calculate the new time requirements
//     const [newReqMin, newNextReqMin] = this.calcReqMinFromNow();
//     // adjust pursuit required minutes remaining
//     this.pursuit.adjustReqMin(newReqMin - reqMin, newNextReqMin - nextReqMin);
//     // cancel any notifications and set for proper days (if reminders on)
//     this.cancelNotify();
//     this.setNotify();
//   }

//   set minDur(v){ 
//     const [reqMin, nextReqMin] = this.calcReqMinFromNow();
//     this.storeMinDur(v);

//     // update the required values today and tomorrow indices
//     if (this._rM[DailyTask.RTI] != null) this._rM[DailyTask.RTI] = v;
//     if (this._rM[DailyTask.RTI + 1] != null) this._rM[DailyTask.RTI + 1] = v;
//     // use setter to update storage
//     this.rM = this._rM;

//     const [newReqMin, newNextReqMin] = this.calcReqMinFromNow();
//     // adjust pursuit required minutes remaining
//     this.pursuit.adjustReqMin(newReqMin - reqMin, newNextReqMin - nextReqMin);
//   }

//   getUsage(dayAdjustInt){
//     const i = dayAdjustInt + Task.CTI;
//     if (i < 0 || i > this._cM.length) 
//       return console.alert('dayAdjustInt out of range in Task.completeForDay');

//     // complete this period, required this period, complete today
//     return [this._cM[i], this._rM[i], this._cM[i]];
//   }

//   // calculate total required minutes REMAINING for this period & for next period
//   calcReqMinFromNow(){
//     let nextP = this.newPeriodRequiredMinutes();

//     const today = TimeDate.getDay();
//     // if today is start of the week then full period * current min so:
//     if (today == this.pursuit.dayOfWeek) return [nextP, nextP];
    
//     // number of days remaining in week
//     const rDays = (this.pursuit.dayOfWeek + 7 - TimeDate.getDay()) % 7;
//     let thisP = 0;

//     // put two copies of _daysMap head to tail to use as a mask
//     const daysArr = this._daysMap.concat(this._daysMap);
//     // get subsection starting today for remaining days length & sum using mask
//     daysArr.slice(today, today + rDays).forEach(e => thisP += (e ? this._minDur : 0));

//     return [thisP, nextP];
//   }

//   calcIncompleteMinFromNow(){
//     // get the remaining required minutes
//     let [thisP, nextP] = calcReqMinFromNow();
//     const today = TimeDate.getDay();

//     // if a new period starts tomorrow then subtract any completed minutes
//     if ((today + 1) % 7 == this.pursuit.dayOfWeek) 
//       nextP -= Math.max(0, this._rm[DailyTask.RTI] - this._cM[Task.CTI + 1]);
    
//     const daysRemaining = (this.pursuit.dayOfWeek + 7 - TimeDate.getDay()) % 7;
//     const endIndex = Task.CTI + daysRemaining;
//     // the gap between the minutes.completed / required & daysOfWeek indices
//     const gap = (Task.CTI + 7 - today) % 7;
  
//     // add up uncompleted required minutes for days remaining in the pursuit week
//     for(let i = Task.CTI; i < endIndex; i++){
//       // while in range use the difference between required and completed
//       if (i < this._cM.length) thisP -= Math.max(0, this._rM[i] - this._cM[i]); 
//       // afterwards use the days map & add minDur for days task is required
//       else thisP -= (this.daysMap[(i - gap) % 7] ? this._minDur : 0);
//     }
//     return [thisP, nextP];
//   }

//   calcStreak(){
//     let todayReq = this._rM[DailyTask.RTI];
//     let today = 0;
//     let tomorrow = 0;

//     // if today required
//     if(todayReq && this._cM[Task.CTI] > todayReq) today = 1;
    
//     // if tomorrow required & today was either streak or not required)
//     if(this._rM[DailyTask.RTI+1] && (today == 1 || !todayReq) &&
//        // and completed is greater than required
//        this._cM[Task.CTI+1] > this._rM[DailyTask.RTI]+1){
//       tomorrow = 1;
//     }

//     const s = 0;
//     const sArr = this._streakBar.toReversed();
//     for(let i = 0; i < sArr.length; i++){
//       if (sArr[i] == 1) s++;
//       else break;
//     }
  
//     // if the streak bar is all full include oldStreak
//     if (s == sArr.length) return tomorrow + today + s + this._oldStreak;
//     else return tomorrow + today + s;
//   }

//   newPeriodRequiredMinutes(){
//     let reqMin = 0;
//     this.daysMap.forEach(d => { 
//       if (d) reqMin += this.minDur; 
//     });
//     return reqMin;
//   }

//   registerTime(duration, dayAdjust){
//     // TODO
//     const restarted = false // check if there has been a lack of activity for a few days
//     const oldP = this.pursuit.totalM;
//     const oldT = this._totalM;
//     const oldS = this.streak;
//     const rI = DailyTask.RTI + dayAdjust;
//     const cI = Task.CTI + dayAdjust;
//     const required = this._rM[rI] ? this._rM[rI] : 0;

//     // use setter to update the minutes complete
//     this.cM[cI] += duration;
//     // update total minutes for task using setter
//     this.totalM += duration;
//     // update total minutes for pursuit using setter
//     this.pursuit.totalM += duration;

//     // UPDATE PURSUIT required minutes if necessary
//     const stillReqM = required - this._cM[cI];
//     if (stillReqM > 0 && !this.paused)
//         this.pursuit.registerTime(Math.min(stillReqM, duration), dayAdjust);

//     // Deal with streak bar (only need to worry about past)
//     if (!this.paused && dayAdjust < 0 && required != 0){
//       let nonZeroCount = 0;
//       // count the number of past days the task was due
//       for(let i = rI; i < DailyTask.RTI; i++){
//         if (this._rM[i] != null) nonZeroCount++;
//       }
//       // if there was 1 past day due it is the last index (length - 1), etc
//       const sbIndex = this._streakBar.length - nonZeroCount;
//       this._streakBar[sbIndex] = Math.min(this.cM[cI] / required, 1);
//       // use setter to store;
//       this.streakBar = this._streakBar;
//     }

//     // update the single number streak indicator
//     if (!this.paused) this._streak = this.calcStreak();
//     // return any awards
//     return getAwardData(this._calcType, oldT, this.totalM, oldP, this.pursuit.totalM, oldS, this.streak, restarted);
//   }

//   checkRollOver(){
//     if (!TimeDate.isMoreThanDay(this._updated) || this.paused) return;

//     const [dCount, dateVal] = TimeDate.calcDaysFromVal(this._updated, this._daysMap);
//     const dow = TimeDate.getDay(dateVal);

//     for(let i = 0; i < dCount; i++){
//       this.rollStreakBar(this._cM[DailyTask.RTI], this_.rM[DailyTask.RTI]);
//       this._rM.shift();
//       this._rM.push(this._daysMap[(dow + i + 1) % 7] ? this._minDur : null);
//       this._cM.shift();
//       this._cM.push(0);
//     }
//     // use setters to store
//     this.cM = this._cM;
//     this.rM = this._rM;
//     this.updated = dateVal;

//     // update the single number streak indicator
//     this._streak = this.calcStreak();
//   }
// }
