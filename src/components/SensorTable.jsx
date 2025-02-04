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

export default function SensorTable({ device }) {
    const [sensors, setSensors] = useState({})
    const currentDeviceIdRef = useRef(null)

    useEffect(() => {
        currentDeviceIdRef.current = device?.id
    }, [device])

    useEffect(() => {
        if (!device) return

        currentDeviceIdRef.current = device.id

        const fetchData = async () => {
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
            } catch (error) {
                console.error("❌ Error fetching sensor readings:", error)
            }
        }

        fetchData().catch(console.error)
        scheduleFallbackFetch(() => getSensorReadingsForDevice(device.id), `sensors-update-${device.id}`)

        const deviceRoom = `device-id-${device.id}`
        socket.emit("subscribe", deviceRoom)

        const handleSensorsUpdate = (updatedData) => {
            if (!updatedData.device_id || !updatedData.readings) return
            if (Number(updatedData.device_id) !== Number(currentDeviceIdRef.current)) return

            setSensors(prevSensors => {
                const updatedSensors = { ...prevSensors }

                updatedData.readings.forEach(updatedSensor => {
                    updatedSensors[updatedSensor.device_sensor_id] = {
                        id: updatedSensor.device_sensor_id,
                        type: updatedSensor.type || "Unknown",
                        unit: updatedSensor.unit || "",
                        value: updatedSensor.value,
                        time: updatedSensor.time
                    }
                })

                return { ...updatedSensors }
            })
        }

        socket.on("sensors-update", handleSensorsUpdate)

        return () => {
            socket.emit("unsubscribe", deviceRoom)
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