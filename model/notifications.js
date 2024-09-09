
import { Alert } from "react-native";
import * as Notifications from "expo-notifications";
import * as Linking from 'expo-linking';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
  }),
});


export class Notify {
  static STATUS = {
    canSend: null,
    canAsk: null,
    date: null,
    finished: false
  }

  static parseStatus(status){
    if (status.granted || status?.ios?.status >= 2) 
      return [true, false];
    if (status.undetermined || status.ios?.status == 0)
      return [false, true];
    if (status.denied || status.ios?.status == 1) 
      return [false, false]
    return [false, false]
  }

  static async initialize(askMess=null, unSwitcher=null, startUp=false){
    Notify.STATUS.date = Date.now();
    const [canSend, canAsk] = Notify.parseStatus(await Notifications.getPermissionsAsync());
    Notify.STATUS.canSend = canSend;
    Notify.STATUS.canAsk = canAsk;
    Notify.STATUS.finished = true;
    if (!startUp) Notify.switch(askMess, unSwitcher);
  }

  static async switch(askMess, unSwitcher){
    console.log("canSend", Notify.STATUS.canSend, "canAsk", Notify.STATUS.canAsk);
    if (Notify.STATUS.canSend) return true;
    if (Notify.STATUS.canAsk) return Notify.askPermission(askMess, unSwitcher);
    if (Notify.STATUS.canSend == null && Date.now() - Notify.STATUS.date.valueOf() < 5000){
      unSwitcher();
      return Notify.tryAgain()
    }
    if (Notify.STATUS.canSend == null) await this.initialize(askMess, unSwitcher);
    if (!Notify.STATUS.canSend && !Notify.STATUS.canAsk) {
      unSwitcher();
      Notify.permissionDenied();
    } 
  }

  static async send(mObj){
    const id = await Notifications.scheduleNotificationAsync(mObj);
    return id;
  }

  static async cancel(id){
    if (!!id) return;
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  static askPermission = (askMess, callBack) => {
    const ask = askMess 
      ? askMess
      : 'Reminders require you grant TimeOnTarget permission to send notifications. We never send unwanted reminders.';
  
    Alert.alert(
      // Title
      'Permission Required',
      // Message
      ask,
      // button array
      [
        // left button
        { text: 'Cancel', style: 'cancel', onPress: ()=>callBack?.() },
        
        { // right button
          text: 'OK', 
          onPress: async () => {
            await Notifications.requestPermissionsAsync();
            await Notify.initialize(); 
            await Notify.switch(askMess, this.callBack);
          }
        },
      ]
    ) 
  }

  static async schedulePushNotification() {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "You've got mail!",
            body: "Here is the notification body",
            data: { data: "goes here" },
            sound: "alarm.wav",
        },
        trigger: { seconds: 2 },
    });
}
 

  static permissionDenied(message=null){
    const m = message != null 
      ? message
      : 'You have turned notifications off. Fixing this requires changing notification settings.';

    Alert.alert(
      // Title & message
      'Permission Denied', m,
      // button array
      [
          // left button
        { text: 'Leave Off', style: 'cancel', onPress: ()=>callBack?.() },
        { // right button
          text: 'Open Settings', 
          onPress: ()=>{
            Linking.openURL('App-Prefs:NOTIFICATIONS_ID');
          }
        },
      ]
    ) 
  }
  






 // static sendNotification(m, t, askMessage=null, onFail=null){
  //   // if uninitialized or hasn't checked in over 25 hours ch eck status
  //   if(Notify.STATUS.canSend == null || Date.now() - Notify.STATUS.date > 90000000){
  //     // if it is under 5 seconds don't check again yet, just fail & exit
  //     if (Date.now() - Notify.STATUS.date < 5000) return false;
  //     // try to initialize
  //     Notify.initialize();
  //     // if it doesn't work then fail & exit
  //     if (Notify.STATUS.canSend == null) return onFail?.();
  //   }
    
  //   if(!Notify.STATUS.canSend && !Notify.STATUS.canAsk){
  //     permissionDenied(onFail);
  //     return false;
  //   }
  //   if(!Notify.STATUS.canSend && Notify.STATUS.canAsk){
  //     [canSend, _] = canSendCanAsk(await Notifications.requestPermissionsAsync());
  //   }
  //   if(Notify.STATUS.canSend){
  //     await Notifications.scheduleNotificationAsync({content:m, trigger:t});
  //     return true;
  //   } 
  //   onFail();
  //   return false;
  // }



}



