import { createTheme } from "@mui/material/styles"

// Extracted from the provided image
const themeColor = "#EB4D4B" // Closest HEX to match

const theme = createTheme({
    palette: {
        primary: { main: themeColor },
        secondary: { main: "#2C3E50" }, // Dark shade for contrast
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    borderRadius: "8px",
                    fontWeight: "bold",
                },
            },
        },
        MuiDataGrid: {
            styleOverrides: {
                root: {
                    borderRadius: "8px",
                    boxShadow: "0px 2px 10px rgba(0,0,0,0.1)",
                    "& .MuiDataGrid-columnHeaders": {
                        backgroundColor: themeColor,
                        color: "white",
                    },
                    "& .MuiDataGrid-cell": {
                        borderBottom: "1px solid #ddd",
                    },
                },
            },
        },
    },
})

export default theme