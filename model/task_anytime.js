
// import { Task } from './task';
// import { TimeDate } from './time';

// export class AnytimeTask extends Task {
//   constructor(){
//     super();
//   }
//   initialize(){
//     this.updated = TimeDate.todayDateVal();
//   }

//   getUsage(dayAdjustInt){
//     const i = dayAdjustInt + Task.CTI;
//     if (i < 0 || i > this._cM.length) 
//       return console.alert('dayAdjustInt out of range in Task.completeForDay');

//     return [this._cM[i], 0, this._cM[i]];
//   }

//   newPeriodRequiredMinutes(){
//     return 0;
//   }

//   checkRollOver(){
//     if (!TimeDate.isMoreThanDay(this._updated)) return;

//     const [dCount, dateVal] = TimeDate.calcDaysFromVal(this._updated, this._daysMap);

//     for(let i = 0; i < dCount; i++){
//       this._cM.shift();
//       this._cM.push(0);
//     }
//     // use setters to store
//     this.cM = this._cM;
//     this.updated = dateVal;
//   }

// }
