// Debug utility for tracking state changes and API calls
class DebugLogger {
  private enabled = process.env.NODE_ENV === "development"
  private logs: Array<{ timestamp: string; type: string; message: string; data?: any }> = []

  log(type: string, message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const logEntry = { timestamp, type, message, data }

    this.logs.push(logEntry)

    if (this.enabled) {
      console.log(`[${type.toUpperCase()}] ${message}`, data || "")
    }

    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100)
    }
  }

  getLogs() {
    return this.logs
  }

  clearLogs() {
    this.logs = []
  }

  // Specific logging methods
  userAction(action: string, data?: any) {
    this.log("USER_ACTION", action, data)
  }

  apiCall(method: string, url: string, data?: any) {
    this.log("API_CALL", `${method} ${url}`, data)
  }

  apiResponse(url: string, success: boolean, data?: any) {
    this.log("API_RESPONSE", `${url} - ${success ? "SUCCESS" : "ERROR"}`, data)
  }

  stateChange(component: string, change: string, data?: any) {
    this.log("STATE_CHANGE", `${component}: ${change}`, data)
  }

  refresh(component: string, trigger: string) {
    this.log("REFRESH", `${component} refreshed by ${trigger}`)
  }
}

export const debugLogger = new DebugLogger()
