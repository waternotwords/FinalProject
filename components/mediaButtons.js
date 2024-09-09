import Svg, { Path, Rect } from "react-native-svg"
import { TouchableOpacity } from "react-native";

export const PlayButton = (p) => {
  const color = p?.color ? p.color : "#AAA";
  return (
    <TouchableOpacity style={p.style} onPress={p?.onPress} disabled={p?.disabled}>
      <Svg width="100%" height="100%" viewBox="0 0 80 100">
        <Path fill={color} d="m0 0 80 50-80 50z" />
      </Svg>
    </TouchableOpacity>
  );
}

export const PauseButton = (p) => {
  const color = p?.color ? p.color : "#AAA";
  return (
    <TouchableOpacity style={p.style} onPress={p?.onPress} disabled={p?.disabled}>
      <Svg width="100%" height="100%" viewBox="0 0 80 90">
        <Rect width="28" height="90" x="0" y="0"fill={color} />
        <Rect width="28" height="90" x="52" y="0"fill={color} />
      </Svg>
    </TouchableOpacity>
  );
}

export const StopButton = (p) => {
  const color = p?.color ? p.color : "#AAA";
  return (
    <TouchableOpacity style={p.style} onPress={p?.onPress} disabled={p?.disabled}>
      <Svg width="100%" height="100%" viewBox="0 0 80 90">
        <Rect width="80" height="90" x="0" y="0"fill={color} />
      </Svg>
    </TouchableOpacity>
  );
}
