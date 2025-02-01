import { useState, useEffect } from "react"
import PropTypes from "prop-types"
import { DataGrid } from "@mui/x-data-grid"
import { Paper, Typography, Box } from "@mui/material"
import { getSensorsForDevice } from "../api"

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
            const data = await getSensorsForDevice(device.id)
            setSensors(data)
        }

        fetchData()
        const interval = setInterval(fetchData, 5000)
        return () => clearInterval(interval)
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