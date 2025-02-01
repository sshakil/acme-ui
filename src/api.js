import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api"

export const getDevices = async () => {
    const response = await axios.get(`${API_BASE_URL}/devices`)
    return response.data
}

export const getSensorsForDevice = async (deviceId) => {
    const response = await axios.get(`${API_BASE_URL}/device-sensors`, { params: { device_id: deviceId } })
    return response.data
}