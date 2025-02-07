import axios from "axios"
import {io} from "socket.io-client"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/acme"
const POLL_DELAY_MS = parseInt(import.meta.env.VITE_POLL_DELAY_MS) || 180000 // Default: 3 minutes
const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL || "minimal"

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "ws://localhost:4000"
export const socket = io(SOCKET_URL, {transports: ["websocket"]})

// Track last event timestamps
const lastEventTimestamps = {}

// Store timers per event type
const timers = {}

/**
 * Logs a formatted message with timestamps
 */
const logEvent = (type, source, event = null, error = false) => {
    if (LOG_LEVEL === "disabled") return // Skip logging if disabled

    const time = new Date().toLocaleTimeString()
    const statusIcon = error ? "❌" : "🔄"
    let logMessage = `[${time}] ${statusIcon} ${type.toUpperCase()} ${error ? "error:" : "triggered by"} ${source}`

    if (LOG_LEVEL === "verbose" && event?.data) {
        logMessage += ` | Event: ${JSON.stringify(event, null, 2)}`
    }

    console.log(logMessage)
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

export const getSensorReadingsForDevice = async (deviceId) => {
    logEvent("sensor-readings-fetch", `API for device ${deviceId}`)
    const response = await axios.get(`${API_BASE_URL}/sensor-readings/${deviceId}`)
    return response.data
}

// WebSocket Listeners: Reset the fallback poll when an event is received
socket.on("device-created", (event) => {
    lastEventTimestamps["device-update"] = Date.now()
    logEvent("device-update", "WebSocket", event)
    // scheduleFallbackFetch(getDevices, "device-update")
})

socket.on("sensors-update", (event) => {
    if (!event.parentResourceId || !event.data) {
        logEvent("sensors-update", "WebSocket event received with missing fields.", event, true)
        return
    }

    lastEventTimestamps[`sensors-update-${event.parentResourceId}`] = Date.now()
    logEvent("sensors-update", `WebSocket for device ${event.parentResourceId}`, event)
    // scheduleFallbackFetch(getSensorReadingsForDevice, "sensors-update", data.device_id)
})