import axios from "axios"
import { io } from "socket.io-client"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api"
const POLL_DELAY_MS = parseInt(import.meta.env.VITE_POLL_DELAY_MS) || 180000 // Default: 3 minutes

export const socket = io(API_BASE_URL.replace("/api", ""), { transports: ["websocket"] })

// Track last event timestamps
const lastEventTimestamps = {}

// Store timers per event type
const timers = {}

/**
 * Logs a formatted message with timestamps
 */
const logEvent = (type, source) => {
    const time = new Date().toLocaleTimeString()
    console.log(`[${time}] 🔄 ${type.toUpperCase()} triggered by ${source}`)
}

/**
 * Schedules a fallback fetch if no WebSocket event is received within POLL_DELAY_MS
 */
export const scheduleFallbackFetch = (fetchFn, eventType, param = null) => {
    if (timers[eventType]) clearTimeout(timers[eventType])

    timers[eventType] = setTimeout(async () => {
        logEvent(eventType, "fallback poll")
        await (param ? fetchFn(param) : fetchFn())
    }, POLL_DELAY_MS)
}

// API Calls
export const getDevices = async () => {
    logEvent("device-fetch", "API")
    const response = await axios.get(`${API_BASE_URL}/devices`)
    return response.data
}

export const getSensorsForDevice = async (deviceId) => {
    logEvent("sensor-fetch", `API for device ${deviceId}`)
    const response = await axios.get(`${API_BASE_URL}/device-sensors/${deviceId}`)
    return response.data
}

export const getLatestSensorsReading = async (deviceId) => {
    logEvent("sensor-readings-fetch", `API for device ${deviceId}`)
    const response = await axios.get(`${API_BASE_URL}/latest-sensors-reading/${deviceId}`)
    return response.data
}

// WebSocket Listeners: Reset the fallback poll when an event is received
socket.on("device-created", () => {
    lastEventTimestamps["device-update"] = Date.now()
    logEvent("device-update", "WebSocket")
    scheduleFallbackFetch(getDevices, "device-update")
})

socket.on("sensors-update", (data) => {
    if (!data.device_id) return
    lastEventTimestamps[`sensors-update-${data.device_id}`] = Date.now()
    logEvent("sensors-update", `WebSocket for device ${data.device_id}`)
    scheduleFallbackFetch(getLatestSensorsReading, "sensors-update", data.device_id)
})

socket.on("sensor-update", (data) => {
    if (!data.device_sensor_id) return
    lastEventTimestamps[`sensor-update-${data.device_sensor_id}`] = Date.now()
    logEvent("sensor-update", `WebSocket for sensor ${data.device_sensor_id}`)
    scheduleFallbackFetch(getLatestSensorsReading, "sensor-update", data.device_sensor_id)
})