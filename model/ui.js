import { createContext, useState} from 'react';
export const COLOR = createContext();
export const ColorContext = (p) => {
  const grey = UI.colors[UI.colors.length - 1];
  const [col, setCol] = useState({c:grey, t:grey});
  const getByIndex = (i)=> i==null || i < 0 ? grey : UI.colors[i];
  UI.setTimeColByI = (i)=>setCol({c: col.c, t: getByIndex(i)});

  return (
    <COLOR.Provider value={{
      timeC: col.t,
      catC: col.c,
      setTimeC: (v)=>setCol({c: col.c, t: v}),
      setCatC: (v)=>setCol({c: v, t: col.t}),
      setTimeColByI: (i)=>setCol({c: col.c, t: getByIndex(i)}),
      setCatColByI: (i)=>setCol({c: getByIndex(i), t: col.t}),
      resetTimeC: ()=>setCol({c: col.c, t: grey}),
      resetCatC: ()=>setCol({c: grey, t: col.t}),
      all: UI.colors,
      grey: grey,
    }}>
      { p.children }
    </COLOR.Provider>
  );
}

export const UI = {
  colors: [
    {
      dark: '#042164',
      medium: '#054b8f',
      light: '#527bb5',
      contrast: '#9ad1ff',
    },
    {
      dark: '#473039',
      medium: '#b06484',
      light: '#c785a0',
      contrast: '#f5bfd4',
    },
    {
      dark: '#706531',
      medium: '#9a8c44',
      light: '#c5b257',
      contrast: '#ffef94',
    },
    {
      dark: '#223212',
      medium: '#405c22',
      light: '#5d8731',
      contrast: '#bbf57d',
    },
    {
      dark: '#3f2222',
      medium: '#944f4f',
      light: '#bf6565',
      contrast: '#ffc9c9',
    },
    {
      dark: '#483f6a',
      medium: '#655894',
      light: '#8271bf',
      contrast: '#cbbdfc',
    },
    {
      dark: '#5e3506',
      medium: '#b3650b',
      light: '#de9c50',
      contrast: '#f7c58b',
    },
    {
      dark: '#3f564f',
      medium: '#5f8076',
      light: '#7eab9d',
      contrast: '#d4fcf0',
    },
    {
      dark: '#333333',
      medium: '#777777',
      light: '#AAAAAA',
      contrast: '#CCCCCC',
    },
  ]
}
