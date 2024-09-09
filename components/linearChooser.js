import { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Keyboard } from 'react-native';

// txtColor:'#fff', selectedTxtColor:'#000',backgroundColor:'#AAA, selectedBackgroundColor:'#fff}
// elements:[{text:'Sun', selected:true, }], radio:true, callback:(value, index, array)=>{}

const Cell = (p) => {
  const s = StyleSheet.flatten(p?.cellStyle);
  const txtStyle = StyleSheet.flatten(p?.textStyle);
  return(
    <TouchableOpacity style={[style.cell, s]} 
    onPress={()=>{
      Keyboard.dismiss();
      p.onPress();
    }}>
      <Text style={[style.text, txtStyle]}>{p?.text}</Text>
    </TouchableOpacity>
  )
}

export const LinearChooser = (p) => {
  const radius = (p?.borderRadius) ? p.borderRadius : 5;
  const backColor = '#fff';
  const textColor = '#000';
  const selectBackCol = p?.selectColor ? p.selectColor : '#5f8735';
  const selectCol = '#fff';
  const length = p?.elements?.length ? p.elements.length : 0;

  const [selected, setSelected] = useState(p?.elements?.map(e=>e?.selected == true));
  
  useEffect(()=>{
    if (p?.manualSingleSelect == null) return;
    const arr = p?.elements?.map(e=>false);
    arr[p.manualSingleSelect] = true;
    setSelected(arr)
  }, [p?.manualSingleSelect]);


  const callback = (p?.radio) 
    ? (index, value) => {
      const on = new Array(length).fill(false);
      on[index] = true;
      setSelected(on);
      p?.callback?.(value, index, on);
    }
    : (index, value) => {
      let count = 0;
      const on = new Array(selected.length);
      selected.map((e, i) => {
        on[i] = e;
        if (e) count++;
      });
      on[index] = (count > 1 || p?.noChoiceOK) ? !on[index] : true;
      setSelected(on);
      p?.callback?.(value, index, on);
    }

  const cells = p?.elements?.map((e, i) => {
    const font = {}
    const s = { borderWidth: 1};

    if (i == 0){
      s.borderTopLeftRadius = radius;
      s.borderBottomLeftRadius = radius;
      s.borderRightWidth = 0;
    } else if (i == length - 1){
      s.borderTopRightRadius = radius;
      s.borderBottomRightRadius = radius;
    } else {
      s.borderRightWidth = 0;
    }


    if(selected[i]){
      font.color = e?.selectedTxtColor ? e.selectedTxtColor : selectCol;
      if (e?.color != undefined){
        s.borderColor = '#fff'
        s.backgroundColor = e.color;
      } else {
        s.backgroundColor = e?.selectedBackgroundColor ? e.selectedBackgroundColor : selectBackCol;
      }
    } else {
      s.backgroundColor = e?.color ? e.color : backColor;
      font.color = e?.txtColor ? e.txtColor : textColor;
    }

    return (
      <Cell 
        cellStyle={s}
        textStyle={font}
        key={i}
        text={e?.text}
        onPress={()=>callback(i, e?.text)}
      />
    )
  });

  return(
    <View style={[p.style, style.container]}>
      {cells}
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width:'100%',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    fontSize: 16
  }
});
