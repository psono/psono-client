const DEFAULT_FOLDER_COLOR = "000000";
const FOLDER_COLOR_REGEX = /^[0-9a-fA-F]{6}$/;

function normalizeFolderColor(color) {
	const sanitizedColor = sanitizeFolderColorInput(color);

	if (!FOLDER_COLOR_REGEX.test(sanitizedColor)) {
		return DEFAULT_FOLDER_COLOR;
	}

	return sanitizedColor.toLowerCase();
}

function sanitizeFolderColorInput(color) {
	return (color || "")
		.replace(/^#/, "")
		.replace(/[^0-9a-fA-F]/g, "")
		.slice(0, 6);
}

function isFolderColorValid(color) {
	return color === "" || FOLDER_COLOR_REGEX.test(color);
}

function getFolderColorContrastColor(color) {
	const normalizedColor = normalizeFolderColor(color);
	const red = getLinearColorChannel(normalizedColor.slice(0, 2));
	const green = getLinearColorChannel(normalizedColor.slice(2, 4));
	const blue = getLinearColorChannel(normalizedColor.slice(4, 6));
	const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
	const contrastWithBlack = (luminance + 0.05) / 0.05;
	const contrastWithWhite = 1.05 / (luminance + 0.05);

	return contrastWithBlack > contrastWithWhite ? "#000000" : "#ffffff";
}

function getLinearColorChannel(hexValue) {
	const channel = parseInt(hexValue, 16) / 255;

	if (channel <= 0.03928) {
		return channel / 12.92;
	}

	return ((channel + 0.055) / 1.055) ** 2.4;
}

export default {
	DEFAULT_FOLDER_COLOR: DEFAULT_FOLDER_COLOR,
	normalizeFolderColor: normalizeFolderColor,
	sanitizeFolderColorInput: sanitizeFolderColorInput,
	isFolderColorValid: isFolderColorValid,
	getFolderColorContrastColor: getFolderColorContrastColor,
};
