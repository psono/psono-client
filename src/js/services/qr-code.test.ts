import QRCode from "qrcode";
import qrCode from "./qr-code";

const uri =
	"otpauth://totp/Example:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example";

/** A real QR code embedded off-centre in screenshot-like pixels. */
function qrPixels(inverted: boolean): ImageData {
	const modules = QRCode.create(uri).modules;
	const scale = 4;
	const left = 92;
	const top = 56;
	const width = modules.size * scale + left + 36;
	const height = modules.size * scale + top + 88;
	const data = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const row = Math.floor((y - top) / scale);
			const column = Math.floor((x - left) / scale);
			const dark =
				row >= 0 &&
				column >= 0 &&
				row < modules.size &&
				column < modules.size &&
				modules.data[row * modules.size + column];
			const shade = Boolean(dark) !== inverted ? 0 : 255;
			const index = (y * width + x) * 4;
			data[index] = data[index + 1] = data[index + 2] = shade;
			data[index + 3] = 255;
		}
	}
	return { data, width, height, colorSpace: "srgb" } as ImageData;
}

describe("qr-code", () => {
	const originalCreateObjectURL = Object.getOwnPropertyDescriptor(
		URL,
		"createObjectURL",
	);
	const originalRevokeObjectURL = Object.getOwnPropertyDescriptor(
		URL,
		"revokeObjectURL",
	);
	let image: HTMLImageElement;
	let pixels: ImageData;

	beforeAll(() => {
		Object.defineProperty(URL, "createObjectURL", {
			configurable: true,
			value: jest.fn(() => "blob:qr-image"),
		});
		Object.defineProperty(URL, "revokeObjectURL", {
			configurable: true,
			value: jest.fn(),
		});
	});

	afterAll(() => {
		if (originalCreateObjectURL)
			Object.defineProperty(URL, "createObjectURL", originalCreateObjectURL);
		else delete (URL as Partial<typeof URL>).createObjectURL;
		if (originalRevokeObjectURL)
			Object.defineProperty(URL, "revokeObjectURL", originalRevokeObjectURL);
		else delete (URL as Partial<typeof URL>).revokeObjectURL;
	});

	beforeEach(() => {
		jest.clearAllMocks();
		pixels = qrPixels(false);
		image = document.createElement("img");
		Object.defineProperties(image, {
			naturalWidth: { get: () => pixels.width },
			naturalHeight: { get: () => pixels.height },
		});
		jest.spyOn(window, "Image").mockImplementation(() => image);
		jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
			fillStyle: "",
			fillRect: jest.fn(),
			drawImage: jest.fn(),
			getImageData: () => pixels,
		} as unknown as CanvasRenderingContext2D);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it.each([
		false,
		true,
	])("decodes a real QR code from screenshot pixels (inverted: %p)", async (inverted) => {
		pixels = qrPixels(inverted);
		const file = new File(["image"], "screenshot.png", { type: "image/png" });
		const result = qrCode.readFromImage(file);
		image.dispatchEvent(new Event("load"));
		await expect(result).resolves.toBe(uri);
		expect(URL.createObjectURL).toHaveBeenCalledWith(file);
		expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:qr-image");
	});

	it("reports an image without a QR code and releases its URL", async () => {
		pixels.data.fill(255);
		const result = qrCode.readFromImage(
			new File(["image"], "blank.png", { type: "image/png" }),
		);
		image.dispatchEvent(new Event("load"));
		await expect(result).rejects.toThrow("TOTP_QR_NOT_FOUND");
		expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:qr-image");
	});

	it("reports an unreadable image and releases its URL", async () => {
		const result = qrCode.readFromImage(
			new File(["broken"], "broken.png", { type: "image/png" }),
		);
		image.dispatchEvent(new Event("error"));
		await expect(result).rejects.toThrow("TOTP_QR_READ_ERROR");
		expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:qr-image");
	});
});
