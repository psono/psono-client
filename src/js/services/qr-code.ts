import jsQR from "jsqr";

function decodeImage(
	image: CanvasImageSource,
	width: number,
	height: number,
): string {
	if (!width || !height) throw new Error("TOTP_QR_READ_ERROR");
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	try {
		const context = canvas.getContext("2d", { willReadFrequently: true });
		if (!context) throw new Error("TOTP_QR_READ_ERROR");
		// Transparent QR images should be read against a white background.
		context.fillStyle = "white";
		context.fillRect(0, 0, width, height);
		context.drawImage(image, 0, 0, width, height);
		const pixels = context.getImageData(0, 0, width, height);
		const result = jsQR(pixels.data, width, height, {
			inversionAttempts: "attemptBoth",
		});
		if (!result) throw new Error("TOTP_QR_NOT_FOUND");
		return result.data;
	} finally {
		canvas.width = 0;
		canvas.height = 0;
	}
}

/** Reads an uploaded or pasted image locally. */
async function readFromImage(source: Blob): Promise<string> {
	const url = URL.createObjectURL(source);
	const image = new Image();
	try {
		await new Promise<void>((resolve, reject) => {
			image.onload = () => resolve();
			image.onerror = () => reject(new Error("TOTP_QR_READ_ERROR"));
			image.src = url;
		});
		return decodeImage(image, image.naturalWidth, image.naturalHeight);
	} finally {
		image.onload = null;
		image.onerror = null;
		image.src = "";
		URL.revokeObjectURL(url);
	}
}

export default { readFromImage };
