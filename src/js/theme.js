import { createTheme } from "@material-ui/core/styles";

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
    },
    typography: {
        fontFamily: ['"Open Sans"', "sans-serif"].join(","),
        fontSize: 14,
    },
    overrides: {
        MuiToolbar: {
            regular: {
                height: "48px",
                minHeight: "48px",
                "@media(min-width:600px)": {
                    minHeight: "48px",
                },
            },
        },
        MUIDataTable: {
            paper: {
                boxShadow: "none",
            },
        },
        MuiButton: {
            containedPrimary: {
                color: "white",
            },
        },
    },
});

export default theme;
