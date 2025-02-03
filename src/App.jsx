import { useState } from "react"
import { ThemeProvider } from "@mui/material"
import Grid from "@mui/material/Grid2"
import theme from "./theme"
import DeviceTable from "./components/DeviceTable.jsx"
import SensorTable from "./components/SensorTable.jsx"

function App() {
    const [selectedDevice, setSelectedDevice] = useState(null)

    return (
        <ThemeProvider theme={theme}>
            <Grid container spacing={2}>
                <Grid xs={12} sx={{  width: "100%"  }}>
                    <DeviceTable onDeviceSelect={setSelectedDevice} />
                </Grid>

                <Grid xs={12} sx={{  width: "100%"}}>
                    <SensorTable device={selectedDevice} />
                </Grid>
            </Grid>
        </ThemeProvider>
    )
}

export default App