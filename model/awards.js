import { TimeDate } from "./time";
const min = (m) => m == 1 ? '1 minute' : String(m) + ' minutes';


const pursuitAwards = (oldPurM, newPurM) => {
  const awards = [];
  for(let i = 0; i < pAwards.length; i++){
    const a = pAwards[i];
    // if (newPurM < a[0] && oldPurM <a [0]) break;

    if (oldPurM < a[0] && newPurM >= a[0]) awards.push({
      title: a[0] == 2 
        ? 'First Step: ' + min(newPurM)
        : 'Pursuit: ' + String(a[0] / 60) + 'h+',
      message: a[1],
      star: a[0] == 2 ? newPurM : a[0] / 60
    });
  }
  return awards;
}

const streakAwards = (oldS, newS, calcType) => {
  const awards = [];
  const period = calcType == 1 ? ' Day ' : ' Week ';
  // if the streak length has increased
  if (oldS < newS) awards.push({
    title: String(newS) + period + 'Streak',
    message: null,
    star: newS
  })
  return awards;
}

const taskTimeAwards = (oldTaskM, newTaskM) => {
  // calculates hour based award given new hour & min, a modulus, & old min
  const divAward = (h, m, mod, oldM) => {
    const quot = h - (h % mod)
    if(oldM < quot * 60) return {
      title: quot + '+ Total Hours', message: h + ' hours ' + min(m), star: quot
    };
    return false;
  }

  const awards = [];
  const {h, m} = TimeDate.minToHoursMin(newTaskM);

  // if streak is less than 100h give awards at 1st 5h & every 10h
  if (newTaskM < 6000){
    if (oldTaskM < 300 && newTaskM >= 300) awards.push({
      title: '5+ Total Hours', message: h + ' hours ' + min(m), star: 5
    });
    // awards every 10 hours up to 100h
    else {
      const awar = divAward (h, m, 10, oldTaskM);
      if (awar) awards.push(awar);
    }
  // awards every 25h after 100h
  } else {
    const award = divAward(h, m, 25, oldTaskM);
    if (award) awards.push(award)
  }
  return awards; 
}

// test that all arguments are zero to return special award
const resumeAward = () => {
  for (const a of args){
    console.log("ARGS: ", a);
    if (a != 0) return [];
  }

  // get a random message from the back i
  const a = bAwards[Math.floor(Math.random() * bAwards.length)];

  return [{
    title: a[0],
    message: a[1],
    star: null
  }]
} 

export const getAwardData = (calcType, oldTaskM, newTaskM, oldPurM, newPurM, oldS, newS, restarted) => {
  const p = pursuitAwards(oldPurM, newPurM);
  const s = calcType > 0 ? streakAwards(oldS, newS, calcType) : [];
  const t = taskTimeAwards(oldTaskM, newTaskM);
  // const b = restarted ? resumeAward(p.length, t.length) : [];
  
  const out = p.concat(s, t);
  console.log("AWARDS", '\n', "------", '\n', calcType, oldTaskM,  newTaskM, oldPurM, newPurM, oldS, newS, '\n', p, s, t ,'\n', out);

  return out;
}

const bAwards = [
  [ 'Back in the Saddle', 
    'Keep riding toward what matters'],
  [ 'On the Road Again', 
    'Enjoy the travel as you go'],
  [ 'Persistence Trumps Strain', 
    'It is a marathon not a sprint'],
  [ 'Back in Black',
    'Day number 1, behind your back']
]


const pAwards = [
  [2,         'A 1st step, a new possibility'],
  [25*60,     'Working toward what counts'],
  [50*60,     'Habits serving what matters'],
  [75*60,     'Every step,one direction'],
  [100*60,    'Centurion challenge complete'],
  [250*60,    'New status: earnest novice'],
  [500*60,    'Upgraded to refined novice'],
  [750*60,    'Approaching awesome heights'],
  [1000*60,   'Awesomely Intermediate'],
  [1250*60,   'New status: high intermediate'],
  [1500*60,   'Approaching advanced tier'],
  [1750*60,   'Advanced dedication evident'],
  [2000*60,   'Time on target; two thousand'],
  [2250*60,   'Aspiring technician develops'],
  [2500*60,   'New status: technician'],
  [2750*60,   'Experienced technician'],
  [3000*60,   '3000 reasons to celebrate'],
  [3500*60,   'New status: craftsperson'],
  [4000*60,   'New status: operative'],
  [4500*60,   'New status: specialist'],
  [5000*60,   'New status: ace specialist'],
  [6000*60,   'New status: expert'],
  [7000*60,   'New status: hallowed hero'],
  [8000*60,   'New status: righteous rockstar'],
  [9000*60,   'New status: divine guru'],
  [10000*60,  'New status: 10000 Hour Master'],
  [12000*60,  'New status: Grand Master'],
  [14000*60,  'Enlightened Grand Master'],
]
