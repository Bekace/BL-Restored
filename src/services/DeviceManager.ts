import { ApiService } from "./ApiService"

class DeviceManagerClass {
  private deviceId = ""
  private apiKey = ""

  async initialize(deviceId: string, apiKey: string) {
    this.deviceId = deviceId
    this.apiKey = apiKey
  }

  async sendHeartbeat(status: any) {
    return await ApiService.sendHeartbeat(this.deviceId, this.apiKey, {
      ...status,
      deviceInfo: {
        platform: "android-tv",
        type: "firestick",
        timestamp: new Date().toISOString(),
      },
    })
  }

  getDeviceId() {
    return this.deviceId
  }

  getApiKey() {
    return this.apiKey
  }
}

export const DeviceManager = new DeviceManagerClass()
