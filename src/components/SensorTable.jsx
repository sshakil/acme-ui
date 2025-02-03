import { useState, useEffect } from "react"
import PropTypes from "prop-types"
import { DataGrid } from "@mui/x-data-grid"
import { Paper, Typography, Box } from "@mui/material"
import { getLatestSensorsReading, socket, scheduleFallbackFetch } from "../api"

const columns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "type", headerName: "Sensor Type", width: 200 },
    { field: "value", headerName: "Latest Value", width: 150 },
    { field: "unit", headerName: "Unit", width: 100 },
    { field: "time", headerName: "Last Updated", width: 200 }, // For debugging timestamp-based updates
]

export default function SensorTable({ device }) {
    const [sensors, setSensors] = useState([])

    useEffect(() => {
        if (!device) return

        const fetchData = async () => {
            try {
                console.log(`📡 Fetching latest sensor readings for device: ${device.name}`)
                const data = await getLatestSensorsReading(device.id)
                setSensors(data)
                console.log(`✅ Loaded ${data.length} sensor readings for ${device.name}`)
            } catch (error) {
                console.error("❌ Error fetching sensor readings:", error)
            }
        }

        fetchData().catch(console.error)
        scheduleFallbackFetch(() => getLatestSensorsReading(device.id), `sensors-update-${device.id}`)

        // Subscribe to WebSocket room
        const deviceRoom = `device-id-${device.id}`
        socket.emit("subscribeToDevice", deviceRoom)
        console.log(`📡 Subscribed to WebSocket room: ${deviceRoom}`)

        // Handle bulk updates for all sensors of the device
        socket.on("sensors-update", (updatedData) => {
            if (!updatedData.device_id || !updatedData.readings) return
            console.log("🔄 sensors-update event:", updatedData)

            setSensors((prevSensors) =>
                prevSensors.map((sensor) => {
                    const updatedSensor = updatedData.readings.find(r => r.device_sensor_id === sensor.id)
                    if (!updatedSensor) return sensor

                    // Only update if the new reading is more recent
                    if (new Date(updatedSensor.time) > new Date(sensor.time)) {
                        return { ...sensor, value: updatedSensor.value, time: updatedSensor.time }
                    }
                    return sensor
                })
            )
        })

        // Handle individual sensor updates
        const handleSensorUpdate = (updatedSensor) => {
            if (!updatedSensor.device_sensor_id || !updatedSensor.value) {
                console.warn("⚠️ Missing expected fields in WebSocket payload:", updatedSensor)
                return
            }

            console.log("🔄 sensor-update event:", updatedSensor)

            setSensors((prevSensors) =>
                prevSensors.map((sensor) =>
                    sensor.id === updatedSensor.device_sensor_id &&
                    (!sensor.time || new Date(updatedSensor.time) > new Date(sensor.time))
                        ? { ...sensor, value: updatedSensor.value, time: updatedSensor.time }
                        : sensor
                )
            )
        }

        // Subscribe to individual sensor updates
        sensors.forEach((sensor) => {
            const sensorRoom = `device-sensor-id-${sensor.id}`
            socket.emit("subscribeToDevice", sensorRoom)
            socket.on(sensorRoom, handleSensorUpdate)
        })

        return () => {
            console.log(`🔌 Unsubscribing from WebSocket room: ${deviceRoom}`)
            socket.off("sensors-update")
            sensors.forEach((sensor) => {
                const sensorRoom = `device-sensor-id-${sensor.id}`
                socket.off(sensorRoom)
            })
        }
    }, [device, sensors])

    if (!device) return <Typography>Select a device to view sensors.</Typography>

    return (
        <Paper elevation={3} sx={{ padding: 2, height: "100%" }}>
            <Typography variant="h6" color="primary" gutterBottom>
                Sensor Data for {device.name}
            </Typography>
            <Box sx={{ height: 400 }}>
                <DataGrid rows={sensors} columns={columns} pageSize={5} />
            </Box>
        </Paper>
    )
}

SensorTable.propTypes = {
    device: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
    })
}