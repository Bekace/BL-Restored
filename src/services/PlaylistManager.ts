import { ApiService } from "./ApiService"

class PlaylistManagerClass {
  private deviceId = ""
  private apiKey = ""
  private updateCallback: ((playlist: any) => void) | null = null
  private pollInterval: NodeJS.Timeout | null = null

  async initialize(deviceId: string, apiKey: string) {
    this.deviceId = deviceId
    this.apiKey = apiKey
    this.startPolling()
  }

  async getCurrentPlaylist() {
    return await ApiService.getPlaylist(this.deviceId, this.apiKey)
  }

  onPlaylistUpdate(callback: (playlist: any) => void) {
    this.updateCallback = callback
  }

  private startPolling() {
    // Poll for playlist updates every 60 seconds
    this.pollInterval = setInterval(async () => {
      try {
        const playlist = await this.getCurrentPlaylist()
        if (this.updateCallback) {
          this.updateCallback(playlist)
        }
      } catch (error) {
        console.error("Playlist polling error:", error)
      }
    }, 60000)
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }
}

export const PlaylistManager = new PlaylistManagerClass()
