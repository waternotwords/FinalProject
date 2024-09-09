import { View, Text, StyleSheet } from 'react-native';
import SelectDropdown from 'react-native-select-dropdown';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const DropDown = (p) => {
  const selected = Number.isInteger(p?.selected);
  const d = p.data.map((e, i) => ({name: e.name, key: i + 1}));
  d.unshift({name: p?.addItemButtonText ? p.addItemButtonText : 'Add', key: 0});
  // console.log(p.selected);
  return (
    <SelectDropdown
      data={d}
      onSelect={(e, i) => {
        const v = (i > 0) ? p.data[i - 1] : null;
        const j = (i > 0) ? i - 1 : null;
        p?.onSelect(v, j);    
        if (i==0) p?.addItemButtonCallBack?.();
      }}
      renderButton={(_, isOpen) => {
        return (
          <View style={[s.buttonStyle, p?.style]}>
            <Text style={[s.buttonTxtStyle, selected && {color:'#000'}]}>
              { selected ? p.data[p.selected].name : 'Choose ' + (p?.taskView ? 'Task' : 'Pursuit') }
            </Text>
            {/* The expo version of material community is missing chevron up!!! */}
            <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} style={s.chevronStyle}/>
          </View>
        );
      }}
      renderItem={(e, i, _) => {
        return (
          <View style={[s.itemStyle, (i === selected && {backgroundColor: '#c4c4c7'})]}>
            { i == 0 ? <Icon name={'plus'} style={s.addIconStyle}/> : null }
            <Text style={[s.itemTxtStyle, (i==0 && s.addButton)]}>{e.name}</Text>
          </View>
        );
      }}
      showsVerticalScrollIndicator={true}
      dropdownStyle={s.menuStyle}
    />
  );
}

const s = StyleSheet.create({
  container: {
    paddingVertical: 100,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingTop: 90,
  },
  buttonStyle: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    height: 38,
  },
  buttonTxtStyle: {
    flex: 1,
    fontSize: 18,
    color: '#777',
  },
  chevronStyle: {
    fontSize: 28,
    marginRight: -6,
    color: '#555555'
  },
  addIconStyle: {
    fontSize: 22,
    marginRight: 8,
  },
  menuStyle: {
    backgroundColor: '#E9ECEF',
    borderRadius: 5,
  },
  itemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#AAA'
  },
  addButton: {
    borderWidth: 0,
    fontWeight: 'bold',
  },
  itemTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#151E26',
  },
});
