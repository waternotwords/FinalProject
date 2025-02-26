import { Storage } from './storage';

const M = Storage();

export class TimeDate {
  static _msPerDay = 86400000;
  // 0 is today, 1 is tomorrow, -1 is yesterday
  static DAY = 0;
  // once / daily / week / anytime (0, 1, 7, -1)
  static calcPeriod = [0, 1, 7, -1];

  static months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  static daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  static daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  static daysRelative = ['Yesterday', 'Today', 'Tomorrow'];


  // used by memoized component so const value prevents rerender
  static dayText(dayAdjusterInt=TimeDate.DAY){
    switch(dayAdjusterInt){
      case 1: return TimeDate.daysRelative[2];
      case 0: return TimeDate.daysRelative[1];
      case -1: return TimeDate.daysRelative[0];
    }
    let v = TimeDate.getDay() + dayAdjusterInt;
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

  static notifyTimesEqual(a,b){
    if (a.getHours() != b.getHours()) return false;
    if (a.getMinutes() != b.getMinutes()) return false;

    return true;
  }

  static dayAdjustToPeriodAdjust(dayAdjust, startOfWeek){
    if (dayAdjust == 0) return 0;

    const d = TimeDate.getDay();
    if(dayAdjust == 1){
      if((d + 1) % 7 == startOfWeek) return 1;
      else return 0;
    }

    const lower = (d + dayAdjust + 7) % 7;
    const upper = d < lower ? d + 7 : d;
    console.log(d, lower, startOfWeek, upper);

    const dow = startOfWeek < lower ? startOfWeek + 7 : startOfWeek;
    if (dow > lower && dow <= upper) return -1;
    else return 0;    
  }

  static futureDays = (()=>{
    if (M.STORAGE.contains('testDay')) return M.STORAGE.getNumber('testDay');
    else return 0;
  })();

  static nextTestDay(){
    this.futureDays++;
    M.STORAGE.set('testDay', this.futureDays);
  }
  static prevTestDay(){

    M.STORAGE.set('testDay', this.futureDays);
    this.futureDays--;
  }
  static adjustedNow = () => (new Date(TimeDate.futureDays * TimeDate._msPerDay + Date.now()));
  static now(){ return TimeDate.adjustedNow() }//return new Date(); }

  static getDay(v=null){ 
    if (v) return (new Date(v)).getDay();

    return (TimeDate.now()).getDay(); 
  }

  static nowVal(){ return TimeDate.now().valueOf(); }
  
  static stripTime(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  
  static stripTimeToVal(d){ return this.stripTime(d).valueOf(); }
 
  static todayDateVal(){ return TimeDate.stripTimeToVal(TimeDate.now()); }

  static tomorrowVal() { return this.todayDateVal() + TimeDate._msPerDay }

  static yesterdayVal() { return this.todayDateVal() - TimeDate._msPerDay }

  static calcDaysFromVal(dv){
    const dv2 = TimeDate.todayDateVal();
    return [Math.max(0, Math.floor((dv2 - dv) / TimeDate._msPerDay)), dv2];
  }
  static isMoreThanDay(fromDV){
    return (TimeDate.nowVal() - fromDV > TimeDate._msPerDay);
  }
  static isMoreThanWeek(fromDV){
    return (TimeDate.nowVal() - fromDV > TimeDate._msPerDay * 7);
  }

  static daysAgoForDOW(dow, todayDV=null){
    const date = (todayDV == null) ? TimeDate.now() : (new Date(todayDV));
    const today = date.getDay();
    return [(today + 7 - dow) % 7, date];
  }

  // pursuits and 7 day tasks need to be started with PREVIOUS day
  static getRecentDateValOfDOW(dow, todayDV=null){
    const [daysAgo, d] = TimeDate.daysAgoForDOW(dow, todayDV);
    // add safety for daylight savings time 
    d.setHours(12); 
    const date = new Date(d.valueOf() - (daysAgo * TimeDate._msPerDay));

    return TimeDate.stripTimeToVal(date);
  }

  static calcPeriodsFrom7DayRollover = (dVal)=>{
    const [days, dv2] = TimeDate.calcDaysFromVal(dVal);
    // return periods and date value of check
    return [(Math.floor(days) / 7), dv2];
  }

  static msPerDay(){ return TimeDate._msPerDay; }
}
