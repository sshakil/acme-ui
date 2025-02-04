import { useState, useEffect, useCallback } from "react"
import PropTypes from "prop-types"
import { DataGrid } from "@mui/x-data-grid"
import { Paper, Typography, Box } from "@mui/material"
import { getSensorReadingsForDevice, socket, scheduleFallbackFetch } from "../api"

const sensorColumns= [
    { field: "id", headerName: "ID", width: 90 },
    { field: "type", headerName: "Type", width: 200 },
    { field: "value", headerName: "Value", width: 60 },
    { field: "unit", headerName: "Unit", width: 80 },
    { field: "time", headerName: "Time", width: 200 },
]

export default function SensorTable({ device }) {
    const [sensors, setSensors] = useState({})

    // **Memoized WebSocket handler for individual sensor updates**
    const handleSensorUpdate = useCallback((updatedSensor) => {
        if (!updatedSensor.device_sensor_id || updatedSensor.value === undefined) {
            console.warn("⚠️ Missing expected fields in WebSocket payload:", updatedSensor)
            return
        }

        console.log("🔄 sensor-update event:", updatedSensor)

        setSensors(prevSensors => {
            const existing = prevSensors[updatedSensor.device_sensor_id]
            if (!existing || new Date(updatedSensor.time) > new Date(existing.time)) {
                return {
                    ...prevSensors,
                    [updatedSensor.device_sensor_id]: {
                        ...existing,
                        value: updatedSensor.value,
                        time: updatedSensor.time
                    }
                }
            }
            return prevSensors
        })
    }, [])

    useEffect(() => {
        if (!device) return

        const fetchData = async () => {
            try {
                console.log(`📡 Fetching latest sensor readings for device: ${device.name}`)
                const data = await getSensorReadingsForDevice(device.id)

                // Ensure each row has a unique `id` and attach sensor details
                setSensors(
                    Object.fromEntries(data.map(sensor => {
                        console.log("sensor,", sensor)
                        return [sensor.device_sensor_id, {
                            id: sensor.device_sensor_id,
                            type: sensor.type || "Unknown",
                            unit: sensor.unit || "",
                            value: sensor.value,
                            time: sensor.time
                        }]
                    }))
                )

                console.log(`✅ Loaded ${data.length} sensor readings for ${device.name}`)
            } catch (error) {
                console.error("❌ Error fetching sensor readings:", error)
            }
        }

        fetchData().catch(console.error)
        scheduleFallbackFetch(() => getSensorReadingsForDevice(device.id), `sensors-update-${device.id}`)

        // Subscribe to WebSocket room
        const deviceRoom = `device-id-${device.id}`
        socket.emit("subscribeToDevice", deviceRoom)
        console.log(`📡 Subscribed to WebSocket room: ${deviceRoom}`)

        // Handle bulk updates
        const handleSensorsUpdate = (updatedData) => {
            if (!updatedData.device_id || !updatedData.readings) return
            console.log("🔄 sensors-update event:", updatedData)

            setSensors(prevSensors => {
                const updatedSensors = { ...prevSensors }
                updatedData.readings.forEach(updatedSensor => {
                    const uniqueId = `${updatedSensor.device_sensor_id}-${updatedSensor.time}`
                    const existing = updatedSensors[updatedSensor.device_sensor_id]
                    if (!existing || new Date(updatedSensor.time) > new Date(existing.time)) {
                        updatedSensors[updatedSensor.device_sensor_id] = {
                            ...existing,
                            id: uniqueId,
                            value: updatedSensor.value,
                            time: updatedSensor.time
                        }
                    }
                })
                return updatedSensors
            })
        }

        socket.on("sensors-update", handleSensorsUpdate)
        socket.on("sensor-update", handleSensorUpdate)

        return () => {
            console.log(`🔌 Unsubscribing from WebSocket room: ${deviceRoom}`)
            socket.off("sensors-update", handleSensorsUpdate)
            socket.off("sensor-update", handleSensorUpdate)
        }
    }, [device, handleSensorUpdate])

    if (!device) return <Typography>Select a device to view sensors.</Typography>

    return (
        <Paper elevation={3} sx={{ padding: 2, height: "100%" }}>
            <Typography variant="h6" color="primary" gutterBottom>
                Sensor Data for {device.name}
            </Typography>
            <Box sx={{ height: 300 }}>
                <DataGrid
                    rows={Object.values(sensors)}
                    columns={sensorColumns}
                    pageSize={50}
                    getRowId={(row) => row.id}
                    disableColumnFilter
                    disableColumnMenu
                    disableSelectionOnClick
                    initialState={{
                        pagination: {
                            paginationModel: {
                                pageSize: 50,
                            },
                        },
                    }}
                />
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