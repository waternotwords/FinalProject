import { View, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, router} from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { FlashList } from "@shopify/flash-list";
import { TaskCell } from '../../components/taskCell.js';
import { BannerCell, EmptyNoticeCell } from '../../components/taskListInfoCells.js';
import { TimeDate } from '../../model/time.js';
import { MODEL } from "../../model/globalContext.js";

export default function Tab() {
  const model = useContext(MODEL);
  // useFocusEffect(()=>model.navigationTookPlaceTo('index', true));
  const params = useLocalSearchParams();

  useEffect(()=>{
    if (params?.route != 'index') return;
    
    if (params?.refresh || params?.taskCreated || params?.pursuitCreated){
      router.setParams({...params, refresh:'', taskCreated:'', pursuitCreated:''});
      model.refresh();
    }
  })

  const date = (TimeDate.DAY < 1 ? TimeDate.DAY : 0);
  const tasks = model.getTasks(date);
  
  const initState = ()=>{
    const s = {Once: true, Anytime: true};
    for (const d of TimeDate.daysRelative) s[d] = true; 
    for (const d of TimeDate.daysFull) s[d] = true; 
    return s;
  }

  const [openState, setOpenState] = useState(initState());

  let data = [];
  
  const d = (type, text=null, keyValue={}, d=null)=>({type:type, text:text, keyValue:keyValue, d});
  const cells = (dArr, day) => dArr.map(e=>d('data', null, {day:day}, e));

  // once
  if (tasks.once.length > 0) data.push(d('banner', 'Once', {style: {marginTop:0}}));
  if (openState.Once) data = data.concat(cells(tasks.once, date));
  // today / current day
  data.push(d('banner', TimeDate.dayText(date), data.length < 1 ? {style: {marginTop:0}} : {}));
  if (openState[TimeDate.dayText(date)]){
    if (tasks.current.length > 0) data = data.concat(cells(tasks.current, date));
    else data.push(d('empty','There '+ (date < 0 ? 'were' : 'are') +
                     ' no tasks to complete '+ TimeDate.dayText().toLowerCase() + '.'));
  }
  // anytime tasks
  if (tasks.anyTime.length > 0) data.push(d('banner', 'Anytime'));
  if (openState.Anytime) data = data.concat(cells(tasks.anyTime, date));
  // tomorrow
  if (date == 0){
    data.push(d('banner', 'Tomorrow'));
    if (openState.Tomorrow){
      if(tasks.tomorrow.length > 0) data = data.concat(cells(tasks.tomorrow, 1));
      else data.push(d('empty', 
        'No tasks available. Tasks that are\nincomplete today are shown here\nas they become completed.'));
    } 
  } 

  return (
    <View style={s.container}>
      <FlashList
        data={data}
        renderItem={({item}) => {
          if (item.type == 'empty') return (<EmptyNoticeCell>{item.text}</EmptyNoticeCell>);
          else if (item.type == 'banner') return (
            <BannerCell 
              style={item?.keyValue?.style}
              open={openState[item?.text]}
              onPress={()=>{
                const state = {...openState};
                state[item?.text] = !state[item?.text];
                setOpenState(state);
            }}>
              {item.text}
            </BannerCell>
          );
          else if (item.type === 'data') 
            return (
            <TaskCell 
              task={item.d} 
              round={true} 
              day={item.keyValue.day} 
              refreshModel={model.refresh}/>);
        }}
        estimatedItemSize={100}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  },
});
