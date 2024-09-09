import { useContext} from 'react';
import Svg, { Circle, Path } from "react-native-svg"
import { UI } from '../model/ui'

export const CircularProgress = (p) => {
  const directionFlag = 1;
  const bColor = p?.backgroundColor 
                 ? p.backgroundColor 
                 : UI.colors[UI.colors.length - 1].contrast;
  const color = p?.color 
                ? p.color 
                : UI.colors[UI.colors.length - 1].dark;

  
  let startD = p?.start ? p.start : 270;
  while (startD < 0) startD += 360;

  const twoPI = 2 * Math.PI;
  const startR = startD * Math.PI / 180;
  const prog = (p?.percent != null && p.percent < 100) ? p.percent : 99.99;
  const longWayFlag = prog > 50 ? 1 : 0;
  const stopR = (twoPI * prog * 0.01 + startR) % twoPI;
  const size = p?.expanded ? '120%' : '100%';

  const x1 = Math.cos(startR) * 90;
  const y1 = Math.sin(startR) * 90;
  const x2 = Math.cos(stopR) * 90;
  const y2 = Math.sin(stopR) * 90;
  const arc = `M ${x1} ${y1} A 90 90 0 ${longWayFlag} ${directionFlag} ${x2} ${y2}`;

  // console.log(p.percent, String(prog) + '%', startD, startR, stopR, x1, y1, x2, y2, '\n', arc);

  return (
  <Svg width={size} height={size} fill="none" viewBox="-100 -100 200 200">
    <Circle r={89} fill="none" stroke={bColor} strokeWidth={22} />
    <Path
      fill="none"
      stroke={color}
      strokeWidth={20}
      d={arc}
    />
  </Svg>
  );
}
