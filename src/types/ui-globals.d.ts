import type { Theme } from "@mui/material/styles";
import type { AppState } from "./state";

declare module "react-redux" {
	interface DefaultRootState extends AppState {}
}

declare module "@mui/styles/defaultTheme" {
	interface DefaultTheme extends Theme {}
}

interface ClientPaletteColor {
	main: string;
}

declare module "@mui/material/styles" {
	interface Palette {
		blueBackground: ClientPaletteColor;
		lightBackground: ClientPaletteColor;
		greyText: ClientPaletteColor;
		lightGreyText: ClientPaletteColor;
		appBarBackground: ClientPaletteColor;
		appBarText: ClientPaletteColor;
		appBarReadOnlyBackground: ClientPaletteColor;
		appBarReadOnlyText: ClientPaletteColor;
		badgeBackground: ClientPaletteColor;
		baseBackground: ClientPaletteColor;
		baseTitleBackground: ClientPaletteColor;
		checked: ClientPaletteColor;
	}

	interface PaletteOptions {
		blueBackground?: ClientPaletteColor;
		lightBackground?: ClientPaletteColor;
		greyText?: ClientPaletteColor;
		lightGreyText?: ClientPaletteColor;
		appBarBackground?: ClientPaletteColor;
		appBarText?: ClientPaletteColor;
		appBarReadOnlyBackground?: ClientPaletteColor;
		appBarReadOnlyText?: ClientPaletteColor;
		badgeBackground?: ClientPaletteColor;
		baseBackground?: ClientPaletteColor;
		baseTitleBackground?: ClientPaletteColor;
		checked?: ClientPaletteColor;
	}
}
