import { useState, useEffect } from "react"
import PropTypes from "prop-types"
import { DataGrid } from "@mui/x-data-grid"
import { Paper, Typography, Box } from "@mui/material"
import { getDevices, getSensorsForDevice } from "../api"

const columns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "name", headerName: "Device Name", width: 200 },
    { field: "type", headerName: "Type", width: 150 },
    {
        field: "hasData",
        headerName: "Status",
        width: 120,
        renderCell: (params) => (
            <span style={{ color: params.value ? "green" : "gray" }}>
                {params.value ? "Active" : "Inactive"}
            </span>
        )
    },
]

export default function DeviceTable({ onDeviceSelect }) {
    const [devices, setDevices] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const devices = await getDevices()

                // Fetch sensor data for each device to determine activity
                const devicesWithStatus = await Promise.all(
                    devices.map(async (device) => {
                        const sensors = await getSensorsForDevice(device.id)
                        return { ...device, hasData: sensors.length > 0 }
                    })
                )

                // Sort: Active devices at the top
                devicesWithStatus.sort((a, b) => b.hasData - a.hasData)

                setDevices(devicesWithStatus)
                setError(null)
            } catch (err) {
                console.error("Error fetching devices:", err)
                setError("Failed to load devices.")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
        const interval = setInterval(fetchData, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <Paper elevation={3} sx={{ padding: 2, height: "100%" }}>
            <Typography variant="h6" color="primary" gutterBottom>
                Registered Devices
            </Typography>

            {error && (
                <Typography color="error" variant="body2">
                    {error}
                </Typography>
            )}

            <Box sx={{ height: 400 }}>
                <DataGrid
                    rows={devices}
                    columns={columns}
                    pageSize={5}
                    onRowClick={(row) => onDeviceSelect(row.row)}
                    loading={loading}
                    disableSelectionOnClick
                />
            </Box>
        </Paper>
    )
}

DeviceTable.propTypes = {
    onDeviceSelect: PropTypes.func.isRequired
}