import { useState } from "react"
import { Container, Grid, ThemeProvider } from "@mui/material"
import theme from "./theme"
import DeviceTable from "./components/DeviceTable.jsx"
import SensorTable from "./components/SensorTable.jsx"

function App() {
    const [selectedDevice, setSelectedDevice] = useState(null)

    return (
        <ThemeProvider theme={theme}>
            <Container maxWidth="lg" sx={{ padding: 3 }}>
                <Grid container spacing={3}>
                    {/* Top-Left: Device Table */}
                    <Grid item xs={5}>
                        <DeviceTable onDeviceSelect={setSelectedDevice} />
                    </Grid>

                    {/* Bottom-Left: Sensor Data Table */}
                    <Grid item xs={7}>
                        <SensorTable device={selectedDevice} />
                    </Grid>
                </Grid>
            </Container>
        </ThemeProvider>
    )
}

export default App