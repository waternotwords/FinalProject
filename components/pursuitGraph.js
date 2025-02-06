
import { View } from "react-native";
import Svg, { Polyline } from "react-native-svg"

export const PursuitGraph = (p) => {
  if (!p.values || p.values.length < 3) return null;
  console.log("VALUES", p.values);
  if (p.values[1] == 0) return (null);

  const height = p?.height ? p.height : 175;
  const width = p?.width ? p.width : 100;
  const color = p?.color ? p.color : '#fff'
  const vals = p?.values; // ? p.values : [0, height * 0.4, height * 0.55, height];
  const xCounter = width / (vals.length - 1);
  let pointStr = '0,' + height + ' ';

  // build up the point str
  for(let x = xCounter, i = 1; i < vals.length; x += xCounter, i++){
    const range = (vals[vals.length - 1] - vals[0]);
    const v = height - (vals[i] - vals[0]) / range * height;
    pointStr += (x + ',' + v + ' ');
  }
  // console.log(pointStr);
  
  return (
  <View style={[p.style]}>
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      fill="none"
      viewBox={"0 0 " + String(width) + " " + String(height)}
    >
      <Polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={pointStr}
      />
    </Svg>
  </View>
  )

}
