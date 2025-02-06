
// import { Task } from './task';
// import { TimeDate } from './time';

// export class WeeklyTask extends Task {
//   // this.rM's current period's index
//   static RTI = 1;
//   constructor(){
//     super();
//   }

//   initialize(minDur, daysMap, dayOfWeek, thisWeekReq=null){
//     this.oldStreak = 0;
//     this.streakBar = [0,0,0,0,0,0,0,0,0,0];
//     this.rM = [0, thisWeekReq == null ? minDur : thisWeekReq, minDur];
//     this.pcM = [0,0,0];
//     this.updated = TimeDate.getRecentDateValOfDOW(dayOfWeek);
//     this.storeMinDur(minDur);
//   }

//   get streak(){
//     if (this._streak == null) this._streak = this.calcStreak();
//     return this._streak;
//   }

//   set MinDur(v){
//     // cache old values for this and next period
//     const oldMD = this._rM[WeeklyTask.RTI];
//     const oldMDNext = this._rM[WeeklyTask.RTI + 1];
//     // update the values
//     this._rM[WeeklyTask.RTI] = v;
//     this._rM[WeeklyTask.RTI + 1] = v;
//     // use setter to write to disk
//     this.rM = this._rM;
//     // update the pursuit minutes
//     this.pursuit.adjustReqMin(v - oldMD, v - oldMDNext);
//   }

//   getUsage(dayAdjustInt){
//     const p = TimeDate.dayAdjustToPeriodAdjust(dayAdjustInt)
//     const rI = p + WeeklyTask.RTI;
//     const cI = p + Task.CTI;

//     // complete this period, required this period, complete today
//     return [this._pcM[rI], this._rM[rI], this._cM[cI]];
//   }

//   newPeriodRequiredMinutes(){
//     return this.minDur;
//   }

//   calcStreak(){
//     let thisPerReq = this._rM[WeeklyTask.RTI];
//     let thisP = 0;
//     let nextP = 0;

//     // if this period has required time
//     if (thisPerReq && this._pcM[WeeklyTask.RTI] > thisPerReq) thisP++;
    
//     // if next period required & this period was either streak or not required)
//     if(this._rM[WeeklyTask.RTI+1] && (s > 0 || !thisPerReq) &&
//        // and completed is greater than required
//        this._pcM[WeeklyTask.RTI+1] > this._minDur){
//       nextP++;
//     }

//     const s = 0;
//     const sArr = this._streakBar.toReversed();
//     for(let i = 0; i < sArr.length; i++){
//       if (sArr[i] == 1) s++;
//       else break;
//     }
  
//     // if the streak bar is all full include oldStreak
//     if (s == sArr.length) return nextP + thisP + s + this._oldStreak;
//     else return nextP + thisP + s;
//   }


//   registerTime(duration, dayAdjust){
//     // TODO
//     const restarted = false // check if there has been a lack of activity for a few days
//     const oldP = this.pursuit.totalM;
//     const oldT = this._totalM;
//     const oldS = this.streak;
//     const pI = WeeklyTask.RTI + TimeDate.dayAdjustToPeriodAdjust(dayAdjust, this.pursuit.dayOfWeek);
//     const cI = Task.CTI + dayAdjust;
//     const required = this._rM[pI] ? this._rM[pI] : 0;

//     // use setter to update the minutes complete in the period
//     this.pcM[pI] += duration;
//     // use setter to update the minutes complete for day (cM)
//     this.cM[cI] += duration;
//     // update total minutes for task using setter
//     this.totalM += duration;
//     // update total minutes for pursuit using setter
//     this.pursuit.totalM += duration;

//     // UPDATE PURSUIT required minutes if necessary
//     const stillReqM = required - this._pcM[pI];
//     if(stillReqM > 0 && !this.paused)
//         this.pursuit.registerTime(Math.min(stillReqM, duration), dayAdjust);
    
//     // if not paused AND past period AND required for that period was > 0
//     if (!this.paused && pI == 0 && this._rM[pI] > 0){
//       this._streakBar[this._streakBar.length - 1] = Math.min(1, this._pcM[0] / this._rM[0]);
//       // use setter to store
//       this.streakBar = this._streakBar;
//     }

//     // update the single number streak indicator
//     if (!this.paused) this._streak = this.calcStreak();
//     // return any awards
//     return getAwardData(this._calcType, oldT, this.totalM, oldP, this.pursuit.totalM, oldS, this.streak, restarted);
//   }

//   calcIncompleteMinFromNow(){
//     return [
//       Math.max(0, this._rM[WeeklyTask.RTI] - this._pcM[WeeklyTask.RTI]),
//       Math.max(0, this._rM[WeeklyTask.RTI+1] - this._pcM[WeeklyTask.RTI+1]),
//     ]
//   }


//   checkRollOver(){
//     if (!TimeDate.isMoreThanWeek(this._updated)) return;

//     const [periods, dateVal] = TimeDate.calcPeriodsFrom7DayRollover(this._updated);

//     for(let i = 0; i < periods; i++){
//       this.rollStreakBar(this._cM[WeeklyTask.RTI], this._rM[WeeklyTask.RTI]);
//       this._rM.shift();
//       this._rM.push(this._minDur);
//       this._cM.shift();
//       this._cM.push(0);
//     }
//     // use setters to store
//     this.updated = TimeDate.getRecentDateValOfDOW(this._pursuit.dayOfWeek, dateVal);
//     this.cM = this._cM;
//     this.rM = this._rM;
//     // refresh the stored numerical streak value
//     this.calcStreak();
//   }
// }
