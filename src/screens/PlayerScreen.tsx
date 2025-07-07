"use client"

import { useState, useEffect, useRef } from "react"
import { View, Text, Image, StyleSheet, Dimensions, Alert, BackHandler, useTVEventHandler } from "react-native"
import Video from "react-native-video"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { DeviceManager } from "../services/DeviceManager"
import { PlaylistManager } from "../services/PlaylistManager"
import StatusBar from "../components/StatusBar"
import { WebView } from "react-native-webview"

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

export default function PlayerScreen() {
  const [currentItem, setCurrentItem] = useState(null)
  const [playlist, setPlaylist] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [deviceInfo, setDeviceInfo] = useState(null)
  const [showStatus, setShowStatus] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("connected")

  const videoRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    initializePlayer()
    setupEventHandlers()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const myTVEventHandler = (evt) => {
    if (evt && evt.eventType === "down") {
      handleRemoteControl(evt.eventKeyAction)
    }
  }

  useTVEventHandler(myTVEventHandler)

  const handleRemoteControl = (keyAction) => {
    switch (keyAction) {
      case "menu":
        setShowStatus(!showStatus)
        break
      case "playPause":
        // Handle play/pause for videos
        break
      case "left":
        previousItem()
        break
      case "right":
        nextItem()
        break
    }
  }

  const initializePlayer = async () => {
    try {
      const deviceId = await AsyncStorage.getItem("deviceId")
      const apiKey = await AsyncStorage.getItem("apiKey")
      const screenName = await AsyncStorage.getItem("screenName")

      setDeviceInfo({ deviceId, screenName })

      // Initialize services
      await DeviceManager.initialize(deviceId, apiKey)
      await PlaylistManager.initialize(deviceId, apiKey)

      // Load initial playlist
      await loadPlaylist()

      // Start heartbeat
      startHeartbeat()

      // Listen for playlist updates
      PlaylistManager.onPlaylistUpdate(handlePlaylistUpdate)
    } catch (error) {
      console.error("Player initialization failed:", error)
      Alert.alert("Error", "Failed to initialize player")
    }
  }

  const setupEventHandlers = () => {
    const backAction = () => {
      if (showStatus) {
        setShowStatus(false)
        return true
      }
      return false
    }

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction)
    return () => backHandler.remove()
  }

  const loadPlaylist = async () => {
    try {
      const playlistData = await PlaylistManager.getCurrentPlaylist()
      if (playlistData && playlistData.items.length > 0) {
        setPlaylist(playlistData.items)
        setCurrentIndex(0)
        setCurrentItem(playlistData.items[0])
        scheduleNextItem(playlistData.items[0])
      }
    } catch (error) {
      console.error("Failed to load playlist:", error)
      setConnectionStatus("error")
    }
  }

  const handlePlaylistUpdate = (newPlaylist) => {
    setPlaylist(newPlaylist.items)
    setCurrentIndex(0)
    setCurrentItem(newPlaylist.items[0])
    scheduleNextItem(newPlaylist.items[0])
  }

  const scheduleNextItem = (item) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const duration = item.duration * 1000 // Convert to milliseconds
    timeoutRef.current = setTimeout(() => {
      nextItem()
    }, duration)
  }

  const nextItem = () => {
    if (playlist.length === 0) return

    const nextIndex = (currentIndex + 1) % playlist.length
    setCurrentIndex(nextIndex)
    setCurrentItem(playlist[nextIndex])
    scheduleNextItem(playlist[nextIndex])
  }

  const previousItem = () => {
    if (playlist.length === 0) return

    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1
    setCurrentIndex(prevIndex)
    setCurrentItem(playlist[prevIndex])
    scheduleNextItem(playlist[prevIndex])
  }

  const startHeartbeat = () => {
    const sendHeartbeat = async () => {
      try {
        const status = await DeviceManager.sendHeartbeat({
          currentItem: currentItem?.id,
          playlistPosition: currentIndex,
          timestamp: new Date().toISOString(),
        })
        setConnectionStatus("connected")
      } catch (error) {
        console.error("Heartbeat failed:", error)
        setConnectionStatus("disconnected")
      }
    }

    // Send heartbeat every 30 seconds
    const interval = setInterval(sendHeartbeat, 30000)

    // Send initial heartbeat
    sendHeartbeat()

    return () => clearInterval(interval)
  }

  const renderContent = () => {
    if (!currentItem) {
      return (
        <View style={styles.noContent}>
          <Text style={styles.noContentText}>No content available</Text>
          <Text style={styles.noContentSubtext}>Please add content to your playlist in the SignageCloud dashboard</Text>
        </View>
      )
    }

    switch (currentItem.type) {
      case "image":
        return <Image source={{ uri: currentItem.url }} style={styles.fullScreen} resizeMode="contain" />

      case "video":
        return (
          <Video
            ref={videoRef}
            source={{ uri: currentItem.url }}
            style={styles.fullScreen}
            resizeMode="contain"
            repeat={false}
            muted={currentItem.muted || false}
            onEnd={nextItem}
            onError={(error) => {
              console.error("Video playback error:", error)
              nextItem()
            }}
          />
        )

      case "webpage":
        return (
          <View style={styles.webpageContainer}>
            <Text style={styles.webpageTitle}>{currentItem.title}</Text>
            <Text style={styles.webpageUrl}>{currentItem.url}</Text>
          </View>
        )
      case "presentation":
        if (currentItem.media_source === "google_slides") {
          return (
            <WebView
              source={{ uri: currentItem.url }}
              style={styles.fullScreen}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              onError={(error) => {
                console.error("Google Slides load error:", error)
                nextItem()
              }}
              onLoadEnd={() => {
                // Auto-advance after the specified duration
                const settings = currentItem.embed_settings ? JSON.parse(currentItem.embed_settings) : {}
                const duration = (settings.duration || 30) * 1000
                setTimeout(() => {
                  nextItem()
                }, duration)
              }}
            />
          )
        }
        return (
          <View style={styles.unsupported}>
            <Text style={styles.unsupportedText}>Unsupported presentation type</Text>
          </View>
        )

      default:
        return (
          <View style={styles.unsupported}>
            <Text style={styles.unsupportedText}>Unsupported content type: {currentItem.type}</Text>
          </View>
        )
    }
  }

  return (
    <View style={styles.container}>
      {renderContent()}

      {showStatus && (
        <StatusBar
          deviceInfo={deviceInfo}
          connectionStatus={connectionStatus}
          currentItem={currentItem}
          playlist={playlist}
          currentIndex={currentIndex}
          onClose={() => setShowStatus(false)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  fullScreen: {
    width: screenWidth,
    height: screenHeight,
  },
  noContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 60,
  },
  noContentText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
  },
  noContentSubtext: {
    fontSize: 24,
    color: "#cccccc",
    textAlign: "center",
    lineHeight: 36,
  },
  webpageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 60,
  },
  webpageTitle: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 30,
  },
  webpageUrl: {
    fontSize: 28,
    color: "#cccccc",
    textAlign: "center",
  },
  unsupported: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  unsupportedText: {
    fontSize: 32,
    color: "#ff6b6b",
    textAlign: "center",
  },
})
