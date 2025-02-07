import { useRef, useState, useEffect } from "react"
import PropTypes from "prop-types"
import { DataGrid } from "@mui/x-data-grid"
import { Paper, Typography, Box } from "@mui/material"
import { getDevices, getSensorsForDevice, socket, scheduleFallbackFetch } from "../api"

const MIN_FETCH_INTERVAL = parseInt(import.meta.env.VITE_MIN_FETCH_INTERVAL) || 1000
let isFetching = false
let lastFetchTime = 0

const columns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "name", headerName: "Device Name", width: 150 },
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
    const [error, setError] = useState(null)
    const hasSubscribed = useRef(false)  //  Prevent multiple subscriptions

    const fetchData = async () => {
        const now = Date.now()
        if (isFetching || now - lastFetchTime < MIN_FETCH_INTERVAL) return

        isFetching = true
        lastFetchTime = now
        console.log("📡 Fetching devices...")

        try {
            let devices = await getDevices()
            if (!Array.isArray(devices)) devices = []

            const devicesWithStatus = await Promise.all(
                devices.map(async (device) => {
                    const sensors = await getSensorsForDevice(device.id)
                    return { ...device, hasData: sensors.length > 0 }
                })
            )

            devicesWithStatus.sort((a, b) => b.hasData - a.hasData)
            setDevices(devicesWithStatus)
            console.log(`✅ Loaded ${devicesWithStatus.length} devices.`)
            setError(null)
        } catch (err) {
            console.error("❌ Error fetching devices:", err)
            setError("Failed to load devices.")
            setDevices([])
        } finally {
            isFetching = false
        }
    }

    useEffect(() => {
        fetchData().catch(console.error)
        scheduleFallbackFetch(fetchData, "device-update")

        if (!hasSubscribed.current) {
            const devicesRoom = "devices"
            const deviceCreatedEvent = "device-created"
            const deviceDeletedEvent = "device-deleted"

            socket.emit("subscribe", devicesRoom)
            console.log(`📡 Subscribed to WebSocket room: ${devicesRoom}`)

            // Handle device creation
            socket.on(deviceCreatedEvent, (newDevice) => {
                console.log(`🆕 Device added: ${newDevice.name}`)
                setDevices((prev) => [...prev, { ...newDevice, hasData: false }])
            })

            // Handle device deletion
            socket.on(deviceDeletedEvent, (data) => {
                console.log(`🗑️ Device deleted: ${data.id}`)
                setDevices((prev) => prev.filter(device => Number(device.id) !== Number(data.id)))
            })

            hasSubscribed.current = true  // Prevent future re-subscribes
        } else {
            console.log("♻️ Reused websocket")
        }

        return () => {
            console.log("🔌 WebSocket staying subscribed to avoid unnecessary unsubscribing")
        }
    }, [])

    return (
        <Paper elevation={3} sx={{ padding: 2, height: "100%" }}>
            <Typography variant="h6" color="primary" gutterBottom>
                Registered Devices
            </Typography>

            {error && <Typography color="error" variant="body2">{error}</Typography>}

            <Box sx={{ height: 300 }}>
                <DataGrid
                    rows={devices}
                    columns={columns}
                    pageSize={5}
                    onRowClick={(row) => onDeviceSelect(row.row)}
                    disableSelectionOnClick
                />
            </Box>
        </Paper>
    )
}

DeviceTable.propTypes = {
    onDeviceSelect: PropTypes.func.isRequired
}