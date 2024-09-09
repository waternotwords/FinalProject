import { Storage } from './storage';

const M = Storage();

export class TimeDate {
  static userOffset = 0;
  static _msPerDay = 86400000;
  static _rollTimeOutID = null;
  // 0 is today, 1 is tomorrow, -1 is yesterday
  static DAY = 0;
  // once / daily / week / anytime (0, 1, 7, -1)
  static calcPeriod = [0, 1, 7, -1];

  static months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  static daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  static daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  static daysRelative = ['Yesterday', 'Today', 'Tomorrow'];


  static initialize(){
    if (M.STORAGE.contains('Time.userOffset'))
      TimeDate.tzOffset = M.STORAGE.getNumber('Time.userOffset');
    if(M.STORAGE.contains('Time.rollTimeOutID'))
      TimeDate._timeOutID = M.STORAGE.getNumber('Time.rollTimeOutID');
  }


  // used by memoized component so const value prevents rerender
  static dayText(dayAdjusterInt=TimeDate.DAY){
    switch(dayAdjusterInt){
      case 1: return TimeDate.daysRelative[2];
      case 0: return TimeDate.daysRelative[1];
      case -1: return TimeDate.daysRelative[0];
    }
    let v = (new Date()).getDay() + dayAdjusterInt;
    while (v >= TimeDate.daysFull.length) v -= TimeDate.daysFull.length;
    while (v < 0) v += TimeDate.daysFull.length;
    return TimeDate.daysFull[v];
  }

  static resetDay(){ 
    TimeDate.DAY = 0; 
  };
  static prevDay(){
    TimeDate.DAY = (TimeDate.DAY > -6) ? TimeDate.DAY - 1 : TimeDate.DAY;
    console.log("time.js: Time.DAY called. new value:", TimeDate.DAY);
  };
  static nextDay(){ 
    TimeDate.DAY = TimeDate.DAY + 1;
  };

  static twelveHourTimeStr(d){
    const h = d.getHours();
    const m = d.getMinutes();
    const str = (h == 0 || h == 12) ? '12' : String((h % 12));
    return str + (m < 10 ? ':0' : ':') + String(d.getMinutes());
  }

  static getAM(d){
    return d.getHours() < 12
  }

  static setAMPM(d, toAM){
    const fromAM = TimeDate.getAM(d);
    if (fromAM == toAM) return d;

    if (fromAM) d.setHours(d.getHours() + 12);
    else d.setHours(d.getHours() - 12);

    return d;
  }

  static minToHoursMin(min){
    const m = min % 60;
    const h = (min - m) / 60;
    return { h: h, m: m } 
  }

  static futureDays = 0;
  static adjustedNow = () => (new Date(TimeDate.futureDays * daySecs + Date.now()));
  static now(){ return TimeDate.adjustedNow() }//return new Date(); }

  static getDay(){ return (TimeDate.now()).getDay(); }

  static nowVal(){ return TimeDate.now().valueOf(); }
  
  static stripTime(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  
  static stripTimeFromVal(d){ return this.stripTime(d).valueOf(); }
  
  static appDateValue(d){ return TimeDate.stripTimeFromVal(d); }
 
  static todayDateVal(){ return TimeDate.appDateValue(TimeDate.now()); }

  static calcDaysFromVal(dv){
    const dv2 = TimeDate.todayDateVal();
    return [Math.max(0, Math.floor((dv2 - dv) / daySecs)), dv2];
  }
  static isMoreThanDay(fromDV){
    return (TimeDate.nowVal() - fromDV > daySecs);
  }
  static isMoreThanWeek(fromDV){
    return (TimeDate.nowVal() - fromDV > daySecs * 7);
  }

  // pursuits and 7 day tasks need to be started with PREVIOUS day
  static getRecentDateValOfDOW(dow, fromDV=null){
    const d = (fromDV == null) ? TimeDate.now() : (new Date(fromDV));
    const today = d.getDay();
    const daysAgo = (today + 7 - dow) % 7;
    // add safety for daylight savings time 
    d.setHours(12); 
    const date = new Date(d.valueOf() - (daysAgo * daySecs));
    console.log("DATE IN GET MOST RECENT", String(d), daysAgo, String(date));

    return TimeDate.stripTimeFromVal(date);
  }

  static calcPeriodsFrom7DayRollover = (dVal)=>{
    const [days, dv2] = TimeDate.calcDaysFromVal(dVal);
    // return periods and date value of check
    return [(Math.floor(days) / 7), dv2];
  }

  // static calcDailyRoll = (dVal, dayMap)=>{
  //   const dow = (new Date(dVal)).getDay()
  //   const [totDays, dv2] = TimeDate.calcDaysFromVal(dVal);
  //   const endIndex = dow + totDays;
  //   let periods = 0;
  //   for(let i = dow; i < endIndex; i++){
  //     if (dayMap[i % 7]) periods++;
  //   }
  //   // return total days, periods where it was required, date value of check
  //   return [totDays, periods, dv2];
  // }

  static secsPerDay(){ return daySecs; }

}

const daySecs = 86400000;

