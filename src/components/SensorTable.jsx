import { useState, useEffect, useRef } from "react"
import PropTypes from "prop-types"
import { DataGrid } from "@mui/x-data-grid"
import { Paper, Typography, Box } from "@mui/material"
import { getSensorReadingsForDevice, socket, scheduleFallbackFetch } from "../api"

const sensorColumns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "type", headerName: "Type", width: 200 },
    { field: "value", headerName: "Value", width: 60 },
    { field: "unit", headerName: "Unit", width: 80 },
    { field: "time", headerName: "Time", width: 200 },
]

/**
 * SensorTable displays real-time sensor data for a selected device.
 * It fetches sensor readings from the API, subscribes to WebSocket updates,
 * and updates the table dynamically based on incoming data.
 */
export default function SensorTable({ device }) {
    const [sensors, setSensors] = useState({})
    const currentDeviceIdRef = useRef(null)

    useEffect(() => {
        if (!device) return

        currentDeviceIdRef.current = device.id

        const fetchData = async () => {
            console.log(`📡 Fetching latest sensor readings for device: ${device.name}`)
            try {
                const data = await getSensorReadingsForDevice(device.id)

                setSensors(
                    Object.fromEntries(data.map(sensor => [
                        sensor.device_sensor_id, {
                            id: sensor.device_sensor_id,
                            type: sensor.type || "Unknown",
                            unit: sensor.unit || "",
                            value: sensor.value,
                            time: sensor.time
                        }
                    ]))
                )

                console.log(`✅ Loaded ${data.length} sensor readings for ${device.name}`)
            } catch (error) {
                console.error("❌ Error fetching sensor readings:", error)
            }
        }

        fetchData().catch(console.error)
        scheduleFallbackFetch(() => getSensorReadingsForDevice(device.id), `sensors-update-${device.id}`)

        const deviceRoom = `device-id-${device.id}`
        const sensorsRoom = "sensorreading"
        socket.emit("subscribe", deviceRoom)
        socket.emit("subscribe", sensorsRoom)
        console.log(`📡 Subscribed to WebSocket room: ${deviceRoom}`)
        console.log(`📡 Subscribed to WebSocket room: ${sensorsRoom}`)

        const handleSensorsUpdate = (event) => {
            console.log(
                `🔄 ${"sensors-update".toUpperCase()} handler with event:
                \n ${JSON.stringify(event, null, 2)}`
            )
            if (!event.parentResourceId || !event.data) return
            if (Number(event.parentResourceId) !== Number(currentDeviceIdRef.current)) return

            setSensors(prevSensors => {
                const updatedSensors = { ...prevSensors }

                event.data.forEach(sensorReading => {
                    updatedSensors[sensorReading.device_sensor_id] = {
                        id: sensorReading.device_sensor_id,
                        type: sensorReading.type || "Unknown",
                        unit: sensorReading.unit || "",
                        value: sensorReading.value,
                        time: sensorReading.time
                    }
                })

                return updatedSensors
            })
        }

        socket.on("sensors-update", handleSensorsUpdate)

        return () => {
            console.log(`🔌 Unsubscribing from WebSocket room: ${deviceRoom}`)
            console.log(`🔌 Unsubscribing from WebSocket room: ${sensorsRoom}`)
            socket.emit("unsubscribe", deviceRoom)
            socket.emit("unsubscribe", sensorsRoom)
            socket.off("sensors-update", handleSensorsUpdate)
        }
    }, [device])

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