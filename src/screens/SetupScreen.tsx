"use client"

import { useState, useRef, useEffect } from "react"
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, useTVEventHandler } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useNavigation } from "@react-navigation/native"

import { ApiService } from "../services/ApiService"
import { DeviceManager } from "../services/DeviceManager"
import Button from "../components/Button"

export default function SetupScreen() {
  const [deviceCode, setDeviceCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [focusedInput, setFocusedInput] = useState(0)
  const navigation = useNavigation()

  const inputRefs = useRef([])
  const buttonRef = useRef(null)

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const myTVEventHandler = (evt) => {
    if (evt && evt.eventType === "down") {
      handleRemoteNavigation(evt.eventKeyAction)
    }
  }

  useTVEventHandler(myTVEventHandler)

  const handleRemoteNavigation = (keyAction) => {
    switch (keyAction) {
      case "down":
        if (focusedInput < 5) {
          setFocusedInput(focusedInput + 1)
          if (focusedInput === 5) {
            buttonRef.current?.focus()
          } else {
            inputRefs.current[focusedInput + 1]?.focus()
          }
        }
        break
      case "up":
        if (focusedInput > 0) {
          setFocusedInput(focusedInput - 1)
          inputRefs.current[focusedInput - 1]?.focus()
        }
        break
      case "select":
        if (focusedInput === 6) {
          handleConnect()
        }
        break
    }
  }

  const handleConnect = async () => {
    if (deviceCode.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit device code")
      return
    }

    setLoading(true)
    try {
      // Register device with platform
      const response = await ApiService.registerDevice(deviceCode)

      if (response.success) {
        // Store configuration
        await AsyncStorage.setItem("deviceId", response.deviceId)
        await AsyncStorage.setItem("apiKey", response.apiKey)
        await AsyncStorage.setItem("screenName", response.screenName)

        // Initialize device manager
        await DeviceManager.initialize(response.deviceId, response.apiKey)

        Alert.alert("Success", "Device connected successfully!", [
          { text: "OK", onPress: () => navigation.replace("Player") },
        ])
      } else {
        Alert.alert("Error", response.message || "Failed to connect device")
      }
    } catch (error) {
      Alert.alert("Error", "Connection failed. Please check your code and try again.")
    } finally {
      setLoading(false)
    }
  }

  const renderDigitInput = (index) => (
    <TextInput
      key={index}
      ref={(ref) => (inputRefs.current[index] = ref)}
      style={[styles.digitInput, focusedInput === index && styles.focusedInput]}
      value={deviceCode[index] || ""}
      onChangeText={(text) => {
        if (text.length <= 1 && /^\d*$/.test(text)) {
          const newCode = deviceCode.split("")
          newCode[index] = text
          setDeviceCode(newCode.join(""))

          // Auto-focus next input
          if (text && index < 5) {
            setFocusedInput(index + 1)
            inputRefs.current[index + 1]?.focus()
          }
        }
      }}
      onFocus={() => setFocusedInput(index)}
      maxLength={1}
      keyboardType="numeric"
      selectTextOnFocus
      hasTVPreferredFocus={index === 0}
    />
  )

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Connect Your Screen</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code from your SignageCloud dashboard</Text>

        <View style={styles.codeContainer}>{[0, 1, 2, 3, 4, 5].map(renderDigitInput)}</View>

        <Text style={styles.instructions}>
          1. Go to your SignageCloud dashboard{"\n"}
          2. Navigate to Screens → Add Screen{"\n"}
          3. Select "Fire TV Stick" as device type{"\n"}
          4. Enter the code shown above
        </Text>

        <Button
          ref={buttonRef}
          title={loading ? "Connecting..." : "Connect"}
          onPress={handleConnect}
          disabled={loading || deviceCode.length !== 6}
          style={[styles.connectButton, focusedInput === 6 && styles.focusedButton]}
          hasTVPreferredFocus={false}
        />

        {loading && <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 60,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 24,
    color: "#cccccc",
    marginBottom: 60,
    textAlign: "center",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 60,
  },
  digitInput: {
    width: 80,
    height: 100,
    backgroundColor: "#333333",
    borderRadius: 12,
    marginHorizontal: 8,
    textAlign: "center",
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
    borderWidth: 3,
    borderColor: "transparent",
  },
  focusedInput: {
    borderColor: "#007AFF",
    backgroundColor: "#444444",
  },
  instructions: {
    fontSize: 20,
    color: "#999999",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 60,
  },
  connectButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 60,
    paddingVertical: 20,
    borderRadius: 12,
    minWidth: 200,
  },
  focusedButton: {
    backgroundColor: "#0056CC",
  },
  loader: {
    marginTop: 30,
  },
})
