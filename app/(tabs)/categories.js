import { View, StyleSheet } from 'react-native';
import { useContext, useRef, useState, useEffect} from 'react';
import { router, useLocalSearchParams , useFocusEffect} from 'expo-router';
import { FlashList } from "@shopify/flash-list";
import { PursuitCell } from "../../components/pursuitCell.js";
import { Pursuit } from '../../model/pursuit.js';
import { MODEL } from "../../model/globalContext.js";
import { COLOR } from '../../model/ui.js';

export default function Tab(){
  const model = useContext(MODEL);
  // useFocusEffect(()=>model.navigationTookPlaceTo('categories', true)); 
  const c = useContext(COLOR);
  const listRef = useRef();
  const scroll = useRef(null);
  const params = useLocalSearchParams();
  const {pursuitCreated, route, refresh, taskCreated } = params;
  const [expanded, setExpanded] = useState(-1);


  useEffect(()=>{
    if (route != 'categories') return;

    if(pursuitCreated){
      const i = Pursuit.PURSUITS.length - 1;
      setExpanded(i);
      c.setCatColByI(Pursuit.PURSUITS[i].colorScheme);
      scroll.current = true;
    }

    if (refresh || pursuitCreated || taskCreated){
      router.setParams({...params, refresh:'', pursuitCreated:'', taskCreated:''});
      // model.refresh();
    }
  })

  const d = Pursuit.PURSUITS.map(e=>e);

  return (
    <View style={s.container}>
      <FlashList
        ref={listRef}
        data={d}
        onContentSizeChange={()=>{
          if(d.length > 0 && scroll.current != null){
            scroll.current = false;
            listRef.current.scrollToEnd();
          }
        }}
        renderItem={({item})=>
          <PursuitCell 
            refreshModel={model.refresh}
            pursuit={item} 
            expanded={expanded==item.key}
            onExpand={(i)=>{
              if(expanded == i){
                setExpanded(-1);
                c.resetCatC();
              } else {
                setExpanded(i);
                c.setCatColByI(item.colorScheme);
              }
            }}
          />}
        estimatedItemSize={180}
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
    // because of bug that 
    flexDirection: 'row'
  },
});
