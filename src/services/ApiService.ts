class ApiServiceClass {
  private baseUrl = "https://your-signage-platform.com/api"

  async registerDevice(deviceCode: string) {
    try {
      const response = await fetch(`${this.baseUrl}/devices/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceCode,
          deviceType: "firestick",
          platform: "android-tv",
        }),
      })

      return await response.json()
    } catch (error) {
      throw new Error("Registration failed")
    }
  }

  async validateConnection(deviceId: string, apiKey: string) {
    try {
      const response = await fetch(`${this.baseUrl}/devices/${deviceId}/validate`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      })

      return response.ok
    } catch (error) {
      return false
    }
  }

  async getPlaylist(deviceId: string, apiKey: string) {
    try {
      const response = await fetch(`${this.baseUrl}/devices/${deviceId}/playlist`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch playlist")
      }

      return await response.json()
    } catch (error) {
      throw error
    }
  }

  async sendHeartbeat(deviceId: string, apiKey: string, status: any) {
    try {
      const response = await fetch(`${this.baseUrl}/devices/${deviceId}/heartbeat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(status),
      })

      return await response.json()
    } catch (error) {
      throw error
    }
  }
}

export const ApiService = new ApiServiceClass()
