
// import { Task } from './task';
// import { TimeDate } from './time';

// export class OnceTask extends Task {
//   constructor(){
//     super();
//   }

//   initialize(minDur){
//     this.updated = TimeDate.todayDateVal();
//     this.storeMinDur(minDur);
//   }

//   getUsage(dayAdjustInt){
//     const i = dayAdjustInt + Task.CTI;
//     if (i < 0 || i > this._cM.length) 
//       return console.alert('dayAdjustInt out of range in Task.completeForDay');

//     return [this._totalM, this._minDur, this._cM[i]];
//   }

//   checkRollOver(){
//     if (!TimeDate.isMoreThanDay(this._updated)) return;

//     const [dCount, dateVal] = TimeDate.calcDaysFromVal(this._updated, this._daysMap);

//     for(let i = 0; i < dCount; i++){
//       this._cM.push(0);
//     }
//     // use setters to store
//     this.cM = this._cM;
//     this.updated = dateVal;
//   }

//   newPeriodRequiredMinutes(){
//     return 0;
//   }
// }
