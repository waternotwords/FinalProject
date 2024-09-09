
import { View, Text } from "react-native";
import Svg, { Path } from "react-native-svg"
export const Star = (p) => {
  const v = p?.children;
  return (
  <View style={p.style}>
    {/* SVG modified from orginal available at <a href="https://dazzleui.gumroad.com/l/dazzleiconsfree?ref=svgrepo.com" target="_blank">Dazzle Ui</a> in CC Attribution License via <a href="https://www.svgrepo.com/" target="_blank">SVG Repo</a> */}
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      width={"100%"}
      height="100%"
      fill="none"
      viewBox="0 0 24 24"
    >
      <Path
        d="M6.328 3.77c.013-.513.02-.769.132-.92a.592.592 0 0 1 .408-.236c.186-.021.41.1.86.345l3.956 2.152c.17.093.255.139.344.156a.59.59 0 0 0 .24-.003c.089-.02.172-.067.34-.163l4.018-2.306c.474-.273.712-.409.905-.387.168.02.32.11.417.248.112.16.107.433.097.982l-.08 4.342c-.004.208-.006.312.024.405.026.083.07.158.127.222.066.072.157.122.338.223l3.79 2.102c.48.265.719.398.8.575a.595.595 0 0 1 .005.486c-.077.179-.313.317-.786.593l-4 2.336c-.167.097-.25.146-.312.214a.591.591 0 0 0-.122.206c-.03.087-.032.183-.037.377l-.12 4.511c-.014.513-.02.77-.132.92a.593.593 0 0 1-.408.236c-.186.021-.41-.1-.86-.345l-3.956-2.152c-.17-.092-.255-.139-.344-.156a.588.588 0 0 0-.24.003c-.088.02-.172.067-.34.163l-4.018 2.306c-.474.273-.712.409-.905.387a.592.592 0 0 1-.417-.248c-.112-.16-.107-.433-.097-.982l.08-4.342c.004-.208.006-.312-.024-.405a.595.595 0 0 0-.127-.222c-.066-.072-.157-.122-.338-.223l-3.79-2.102c-.48-.265-.719-.398-.8-.575a.596.596 0 0 1-.005-.486c.077-.179.313-.317.786-.593l4-2.336c.167-.097.25-.146.312-.214a.595.595 0 0 0 .122-.206c.03-.087.032-.183.037-.377z"
        style={{
          fill: p.color,
          fillOpacity: 1,
          stroke: "#fff",
          strokeWidth: 1.2,
          strokeDasharray: "none",
          strokeOpacity: 1,
        }}
      />
    </Svg>
    <View style={{position:'absolute', top:0, bottom:0, left:0, right:0, 
                  alignItems:'center', justifyContent:'center'}}>
      <Text style={[{textAlign:'center', textAlignVertical:'center', fontSize: v > 99 ? 18 : 22}, p?.txtStyle]}>{v}</Text>
    </View>
  </View>

)}
