"use client"

import { useEffect, useState } from "react"
import { View, StyleSheet, Alert, BackHandler } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import AsyncStorage from "@react-native-async-storage/async-storage"

import SetupScreen from "./src/screens/SetupScreen"
import PlayerScreen from "./src/screens/PlayerScreen"
import { ApiService } from "./src/services/ApiService"

const Stack = createStackNavigator()

export default function App() {
  const [isConfigured, setIsConfigured] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkConfiguration()
    setupBackHandler()
  }, [])

  const checkConfiguration = async () => {
    try {
      const deviceId = await AsyncStorage.getItem("deviceId")
      const apiKey = await AsyncStorage.getItem("apiKey")

      if (deviceId && apiKey) {
        // Verify connection to platform
        const isValid = await ApiService.validateConnection(deviceId, apiKey)
        setIsConfigured(isValid)
      }
    } catch (error) {
      console.error("Configuration check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const setupBackHandler = () => {
    const backAction = () => {
      Alert.alert("Exit App", "Are you sure you want to exit?", [
        { text: "Cancel", style: "cancel" },
        { text: "Exit", onPress: () => BackHandler.exitApp() },
      ])
      return true
    }

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction)
    return () => backHandler.remove()
  }

  if (loading) {
    return <View style={styles.container} />
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: false,
        }}
        initialRouteName={isConfigured ? "Player" : "Setup"}
      >
        <Stack.Screen name="Setup" component={SetupScreen} />
        <Stack.Screen name="Player" component={PlayerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
})
