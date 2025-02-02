import { useState, useEffect } from "react"
import PropTypes from "prop-types"
import { DataGrid } from "@mui/x-data-grid"
import { Paper, Typography, Box } from "@mui/material"
import { getDeviceSensorReadings, socket, scheduleFallbackFetch } from "../api"

const columns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "type", headerName: "Sensor Type", width: 200 },
    { field: "value", headerName: "Latest Value", width: 150 },
    { field: "unit", headerName: "Unit", width: 100 },
]

export default function SensorTable({ device }) {
    const [sensors, setSensors] = useState([])

    useEffect(() => {
        if (!device) return

        const fetchData = async () => {
            try {
                console.log(`📡 Fetching sensor readings for device: ${device.name}`)
                const data = await getDeviceSensorReadings(device.id)
                setSensors(data)
                console.log(`✅ Loaded ${data.length} sensor readings for ${device.name}`)
            } catch (error) {
                console.error("❌ Error fetching sensor readings:", error)
            }
        }

        // Fetch initial data
        fetchData().catch(console.error)
        scheduleFallbackFetch(() => getDeviceSensorReadings(device.id), `sensor-update-${device.id}`)

        // Subscribe to WebSocket events
        socket.emit("subscribeToDevice", String(device.id))

        socket.on("sensor-update", (updatedSensor) => {
            console.log("🔄 Incoming WebSocket event:", updatedSensor)

            if (!updatedSensor.device_id || !updatedSensor.value) {
                console.warn("⚠️ Missing expected fields in WebSocket payload:", updatedSensor)
                return
            }

            console.log(`🔄 Sensor updated: ID ${updatedSensor.sensor_id}, Value: ${updatedSensor.value}`)

            setSensors((prevSensors) =>
                prevSensors.map((sensor) =>
                    sensor.id === updatedSensor.sensor_id // 🔄 Now correctly using `sensor_id`
                        ? { ...sensor, value: updatedSensor.value }
                        : sensor
                )
            )
        })

        return () => {
            console.log(`🔌 Unsubscribing from WebSocket for device ${device.id}`)
            socket.off("sensor-update")
        }
    }, [device])

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