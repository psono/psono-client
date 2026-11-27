import apiFileserver from "./api-fileserver";

const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
const originalFetch = globalThis.fetch;

beforeEach(() => {
	fetchMock.mockReset();
	globalThis.fetch = fetchMock;
});

afterEach(() => {
	globalThis.fetch = originalFetch;
});

const upload = () =>
	apiFileserver.upload(
		"https://files.example",
		"transfer",
		new Blob(["encrypted"]),
		"ticket",
		"nonce",
	);

it.each([
	200, 201, 204,
])("accepts successful uploads (HTTP %s) without requiring a response body", async (status) => {
	const response = { ok: true, status } as Response;
	fetchMock.mockResolvedValue(response);
	await expect(upload()).resolves.toBe(response);
	const [url, request] = fetchMock.mock.calls[0];
	expect(url).toBe("https://files.example/upload/");
	expect(request?.method).toBe("POST");
	expect((request?.body as FormData).get("file_transfer_id")).toBe("transfer");
});

it.each([
	400, 401, 403, 404, 413, 429, 500, 503,
])("rejects unsuccessful uploads (HTTP %s)", async (status) => {
	fetchMock.mockResolvedValue({ ok: false, status } as Response);
	await expect(upload()).rejects.toMatchObject({
		status,
		message: `Fileserver request failed (HTTP ${status})`,
	});
});

it.each([
	new TypeError("Network interrupted"),
	new DOMException("Timed out", "TimeoutError"),
	new DOMException("Aborted", "AbortError"),
])("propagates transport failures: %s", async (error) => {
	fetchMock.mockRejectedValue(error);
	await expect(upload()).rejects.toBe(error);
});

it("does not treat error response bodies as downloaded chunks", async () => {
	const arrayBuffer = jest.fn();
	fetchMock.mockResolvedValue({
		ok: false,
		status: 400,
		arrayBuffer,
	} as unknown as Response);
	await expect(
		apiFileserver.download(
			"https://files.example",
			"transfer",
			"ticket",
			"nonce",
		),
	).rejects.toMatchObject({ status: 400 });
	expect(arrayBuffer).not.toHaveBeenCalled();
});

it("preserves successful downloaded bytes", async () => {
	const bytes = new Uint8Array([0, 1, 128, 255]).buffer;
	fetchMock.mockResolvedValue({
		ok: true,
		arrayBuffer: async () => bytes,
	} as Response);
	await expect(
		apiFileserver.download(
			"https://files.example",
			"transfer",
			"ticket",
			"nonce",
		),
	).resolves.toEqual({ data: bytes });
});
