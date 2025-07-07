import { View, Text, StyleSheet, TouchableOpacity } from "react-native"

interface StatusBarProps {
  deviceInfo: any
  connectionStatus: string
  currentItem: any
  playlist: any[]
  currentIndex: number
  onClose: () => void
}

export default function StatusBar({
  deviceInfo,
  connectionStatus,
  currentItem,
  playlist,
  currentIndex,
  onClose,
}: StatusBarProps) {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "#4CAF50"
      case "disconnected":
        return "#FF9800"
      case "error":
        return "#F44336"
      default:
        return "#9E9E9E"
    }
  }

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      <View style={styles.statusContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Device Status</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Device Information</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Screen Name:</Text>
              <Text style={styles.value}>{deviceInfo?.screenName || "Unknown"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Device ID:</Text>
              <Text style={styles.value}>{deviceInfo?.deviceId || "Unknown"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Connection:</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                <Text style={[styles.value, { color: getStatusColor() }]}>{connectionStatus.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Content</Text>
            {currentItem ? (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Title:</Text>
                  <Text style={styles.value}>{currentItem.title}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Type:</Text>
                  <Text style={styles.value}>{currentItem.type.toUpperCase()}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Duration:</Text>
                  <Text style={styles.value}>{currentItem.duration}s</Text>
                </View>
              </>
            ) : (
              <Text style={styles.noContent}>No content playing</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Playlist</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Items:</Text>
              <Text style={styles.value}>{playlist.length}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Current Position:</Text>
              <Text style={styles.value}>
                {currentIndex + 1} of {playlist.length}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Press MENU to toggle status • Use arrow keys to navigate content</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  statusContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 40,
    maxWidth: 800,
    maxHeight: 600,
    borderWidth: 2,
    borderColor: "#333333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
  },
  closeButton: {
    padding: 10,
  },
  closeText: {
    fontSize: 40,
    color: "#cccccc",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    fontSize: 18,
    color: "#cccccc",
  },
  value: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "500",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  noContent: {
    fontSize: 18,
    color: "#999999",
    fontStyle: "italic",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#333333",
    paddingTop: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: "#999999",
    textAlign: "center",
  },
})
