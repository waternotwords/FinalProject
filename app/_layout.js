import { Stack } from 'expo-router/stack';
import { View } from 'react-native';
import { ModelContext } from '../model/globalContext.js';
import { ColorContext } from '../model/ui.js';
import { ModalRightClose } from '../components/modalRightClose.js';
import { StatusBar } from 'expo-status-bar';
import { SplashScreen } from 'expo-router';
import { Pursuit } from '../model/pursuit';
import { Task } from '../model/task';
import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Notify } from '../model/notifications.js'

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
  }),
});

const shouldResetStorage = false;



export default function Layout(){
  const [modelReady, setModelReady] = useState(false);

  useEffect(()=>{
    Notify.initialize(null, null, true);
    Task.initialize(Pursuit.initialize(shouldResetStorage));
    setModelReady(true);
  },[]);

  const setReady = useCallback(() => {
    if (modelReady) setTimeout(SplashScreen.hideAsync, 20);
  }, [modelReady]);

  if (!modelReady) return null;

  return (
    <View style={{height:'100%', width:'100%'}} onLayout={setReady}>
      <ModelContext>
        <ColorContext>
          <StatusBar style='light' />
          <Stack>
            <Stack.Screen 
              name='(tabs)' 
              initialParams={{route:'tabs'}}
              options={{ headerShown: false }}/>
            <Stack.Screen 
              name='addEditTask' 
              options={{
                presentation: 'modal', 
                title: 'Add New Task',
                headerRight: ModalRightClose,
              }}
            />
            <Stack.Screen 
              name='addEditPursuit' 
              options={{
                presentation: 'modal', 
                title: 'Add New Pursuit',
                headerRight: ModalRightClose,
              }}
            />
            <Stack.Screen 
              name='appSurvey' 
              options={{
                presentation: 'modal', 
                title: 'App Feedback',
                headerRight: ModalRightClose,
              }}
            />
          </Stack>
        </ColorContext>
      </ModelContext>
    </View>
  );
  
}
