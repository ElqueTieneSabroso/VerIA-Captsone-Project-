import React,{useState} from "react";
import{
View,
Text,
Switch,
StyleSheet,
} from "react-native";
import Slider from "@react-native-community/slider";

export default function Feedback(){
    const [vibration,setVibration]=useState(true);
    const [intensity,setIntensity]=useState(50);
        return(
            <View style={styles.container}>
                    <Text style={styles.title}>
                        Feedback
                    </Text>
                <View style={styles.row}>

                    <Text style={styles.text}>
                        Enable Vibration
                    </Text>

                    <Switch
                        value={vibration}
                        onValueChange={setVibration}
                    />

                </View>

                    <Text style={styles.text}>
                    Intensity
                    </Text>

                    <Slider
                    minimumValue={0}
                    maximumValue={100}
                    value={intensity}
                    onValueChange={setIntensity}
                    />
            </View>
);
}
const styles=StyleSheet.create({

container:{
flex:1,
backgroundColor:"#111",
padding:25,
},

title:{
fontSize:28,
fontWeight:"bold",
color:"white",
marginBottom:30,
},

row:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
paddingVertical:20,
borderBottomWidth:1,
borderBottomColor:"#555",
},

text:{
fontSize:20,
color:"white",
}

});