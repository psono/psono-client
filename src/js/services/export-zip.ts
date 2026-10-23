import type { DownloadFile } from "../../types/files";
import type { ExportFolder } from "../../types/import";
import fileTransfer from "./file-transfer";

// One safe leaf name; numeric parent directories prevent collisions even when
// multiple entries have identical names. Original names remain in export.json.
export function archiveFileName(name: string) {
	const encoder = new TextEncoder();
	let safe = "";
	let size = 0;
	for (const character of name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")) {
		size += encoder.encode(character).length;
		if (size > 120) break;
		safe += character;
	}
	safe = safe.replace(/[. ]+$/g, "");
	return !safe || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(safe)
		? `_${safe || "file"}`
		: safe;
}

/** ZIP64, stored entries and awaited writes avoid whole-file/archive buffers. */
export async function writeZipExport(
	data: ExportFolder,
	writable: WritableStream<Uint8Array>,
	onProgress: (percentage: number) => void = () => {},
) {
	const { ZipWriter, TextReader } = await import("@zip.js/zip.js");
	let lastPercentage = -1;
	const reportProgress = (percentage: number) => {
		if (percentage !== lastPercentage) {
			lastPercentage = percentage;
			onProgress(percentage);
		}
	};
	const files: { path: string; file: DownloadFile }[] = [];
	let itemIndex = 0;
	function collect(folder: ExportFolder) {
		for (const item of folder.items ?? []) {
			const owner = ++itemIndex;
			if (item.type === "file") {
				const title = item.file_title ?? item.name ?? "file";
				const path = `files/${owner}/${archiveFileName(title)}`;
				item.archive_path = path;
				files.push({ path, file: { ...item, file_title: title } });
			}
			for (const [index, attachment] of (item.attachments ?? []).entries()) {
				const path = `attachments/${owner}/${index + 1}/${archiveFileName(attachment.filename)}`;
				attachment.archive_path = path;
				files.push({
					path,
					file: {
						...attachment,
						file_title: attachment.filename,
						file_chunks: Object.fromEntries(
							attachment.file_chunks.map(({ position, hash }) => [
								position,
								hash,
							]),
						),
					},
				});
			}
		}
		for (const child of folder.folders ?? []) collect(child);
	}
	collect(data);
	// Own the disk writer so failures can abort it even if zip.js holds a lock
	// on its output stream. Aborting discards an unfinished save-picker file.
	const disk = writable.getWriter();
	const output = new WritableStream<Uint8Array>({
		write: (chunk) => disk.write(chunk),
		close: () => disk.close(),
		abort: (error) => disk.abort(error),
	});
	try {
		const zip = new ZipWriter(output, {
			zip64: true,
			level: 0,
			bufferedWrite: false,
			keepOrder: true,
			dataDescriptor: true,
			useWebWorkers: false,
		});
		await zip.add("export.json", new TextReader(JSON.stringify(data)));
		for (const [index, { path, file }] of files.entries()) {
			const chunks = fileTransfer.downloadFileChunks(file);
			const source = new ReadableStream<Uint8Array>(
				{
					async pull(controller) {
						try {
							const next = await chunks.next();
							if (next.done) controller.close();
							else controller.enqueue(next.value);
						} catch (error) {
							controller.error(error);
						}
					},
					async cancel() {
						await chunks.return();
					},
				},
				{ highWaterMark: 0 },
			);
			try {
				await zip.add(path, source, {
					uncompressedSize: file.file_size,
					onprogress: (loaded) => {
						if (file.file_size)
							reportProgress(
								Math.round(
									((index + Math.min(loaded / file.file_size, 1)) /
										files.length) *
										100,
								),
							);
					},
				});
			} finally {
				await chunks.return();
			}
			reportProgress(Math.round(((index + 1) / files.length) * 100));
		}
		await zip.close();
		reportProgress(100);
	} catch (error) {
		await disk.abort(error).catch(() => {});
		throw error;
	} finally {
		disk.releaseLock();
	}
}

interface SavePickerWindow extends Window {
	showSaveFilePicker?: (options: {
		suggestedName: string;
		types: { description: string; accept: Record<string, string[]> }[];
	}) => Promise<FileSystemFileHandle>;
}

/** Always disk-backed; never fall back to an in-memory BlobWriter. */
export async function createZipExportTarget() {
	const picker = (window as SavePickerWindow).showSaveFilePicker;
	if (picker) {
		const handle = await picker.call(window, {
			suggestedName: "export.zip",
			types: [{ description: "ZIP", accept: { "application/zip": [".zip"] } }],
		});
		const writable = await handle.createWritable();
		return {
			writable,
			complete: async () => {},
			abort: async () => {
				if (!writable.locked) await writable.abort();
			},
		};
	}
	const root = await navigator.storage.getDirectory();
	const directory = await root.getDirectoryHandle("psono-zip-exports", {
		create: true,
	});
	// Recover temporary archives left behind when a tab closed before cleanup.
	for await (const [entry] of (
		directory as FileSystemDirectoryHandle & {
			entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
		}
	).entries()) {
		const timestamp = Number(entry.split("-")[0]);
		if (timestamp && timestamp < Date.now() - 24 * 60 * 60 * 1000) {
			await directory.removeEntry(entry).catch(() => {});
		}
	}
	const name = `${Date.now()}-${crypto.randomUUID()}.zip`;
	const handle = await directory.getFileHandle(name, { create: true });
	let writable: FileSystemWritableFileStream;
	try {
		writable = await handle.createWritable();
	} catch (error) {
		await directory.removeEntry(name);
		throw error;
	}
	return {
		writable,
		async complete() {
			const url = URL.createObjectURL(await handle.getFile());
			const link = document.createElement("a");
			link.href = url;
			link.download = "export.zip";
			link.click();
			// Keep the disk-backed snapshot alive while the browser starts saving.
			setTimeout(() => {
				URL.revokeObjectURL(url);
				void directory.removeEntry(name).catch(() => {});
			}, 300_000);
		},
		async abort() {
			try {
				if (!writable.locked) await writable.abort();
			} finally {
				await directory.removeEntry(name);
			}
		},
	};
}
