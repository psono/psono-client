import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        background: {
            default: "#0f1118",
        },
        primary: {
            main: "#2dbb93",
        },
        secondary: {
            main: "#0b4a23",
        },
        action: {
            disabledBackground: '#2dbb9380',
        },
    },
    typography: {
        fontFamily: ['"Open Sans"', "sans-serif"].join(","),
        fontSize: 13,
    },
    components: {
        MuiToolbar: {
            styleOverrides: {
                regular: {
                    height: "48px",
                    minHeight: "48px",
                    "@media(min-width:600px)": {
                        minHeight: "48px",
                    },
                },
            },
        },
        MUIDataTable: {
            styleOverrides: {
                paper: {
                    boxShadow: "none",
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                containedPrimary: {
                    color: "white",
                },
                root: {
                    color: 'rgba(0, 0, 0, 0.87)', // Set default font color for all buttons
                },
            },
        },
    },
});

export default theme;