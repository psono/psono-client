import type { FileDestination } from "../../types/components";
import type { EntryAttachment } from "../../types/entry-ui";
import cryptoLibrary from "./crypto-library";
import fileTransferService from "./file-transfer";

export interface PendingAttachment {
	file: File;
	filename: string;
	destination: FileDestination;
	uploaded?: EntryAttachment;
}

/** A producer must await write: extraction cannot outrun encrypted uploads. */
export async function uploadAttachmentStream(
	size: number,
	filename: string,
	destination: FileDestination,
	secretId: string,
	produce: (write: (bytes: Uint8Array) => Promise<void>) => Promise<void>,
	onProgress: (percentage: number) => void,
): Promise<EntryAttachment> {
	const shard =
		destination.destination_type === "shard" ? destination : undefined;
	const repository =
		destination.destination_type === "file_repository"
			? destination
			: undefined;
	const key = cryptoLibrary.generateSecretKey();
	const chunkSize = 8 * 1024 * 1024;
	const chunkCount = Math.max(1, Math.ceil(size / chunkSize));
	const transfer = await fileTransferService.createFile(
		shard?.id,
		repository?.id,
		size + chunkCount * 40,
		chunkCount,
		undefined,
		undefined,
		undefined,
		secretId,
	);
	try {
		const chunks: EntryAttachment["file_chunks"] = [];
		const buffer = new Uint8Array(Math.min(chunkSize, size));
		let buffered = 0;
		let received = 0;
		const flush = async () => {
			const encrypted = await cryptoLibrary.encryptFile(
				buffer.subarray(0, buffered),
				key,
			);
			const hash = cryptoLibrary.sha512(encrypted);
			const position = chunks.length + 1;
			await fileTransferService.upload(
				new Blob([encrypted], { type: "application/octet-stream" }),
				transfer.file_transfer_id,
				transfer.file_transfer_secret_key,
				encrypted.byteLength,
				position,
				shard,
				repository,
				hash,
			);
			chunks.push({ hash, position });
			buffered = 0;
			onProgress(Math.round((position / chunkCount) * 100));
		};
		await produce(async (bytes) => {
			received += bytes.length;
			if (received > size) throw new Error("FILE_FORMAT_WRONG");
			let offset = 0;
			while (offset < bytes.length) {
				const count = Math.min(buffer.length - buffered, bytes.length - offset);
				buffer.set(bytes.subarray(offset, offset + count), buffered);
				buffered += count;
				offset += count;
				if (buffered === buffer.length) await flush();
			}
		});
		if (received !== size) throw new Error("FILE_FORMAT_WRONG");
		if (buffered || size === 0) await flush();
		return {
			file_id: transfer.file_id,
			file_chunks: chunks,
			file_secret_key: key,
			file_size: size,
			file_shard_id: shard?.id ?? null,
			file_repository_id: repository?.id ?? null,
			filename,
		};
	} catch (error) {
		await fileTransferService.deleteFile(transfer.file_id).catch(() => {});
		throw error;
	}
}

export async function uploadAttachment(
	pending: PendingAttachment,
	secretId: string,
	onProgress: (percentage: number) => void,
): Promise<EntryAttachment> {
	if (pending.uploaded) return pending.uploaded;
	const { file, destination } = pending;
	const shard =
		destination.destination_type === "shard" ? destination : undefined;
	const repository =
		destination.destination_type === "file_repository"
			? destination
			: undefined;
	const key = cryptoLibrary.generateSecretKey();
	const chunkSize = 128 * 1024 * 1024;
	const chunkCount = Math.max(1, Math.ceil(file.size / chunkSize));
	const transfer = await fileTransferService.createFile(
		shard?.id,
		repository?.id,
		file.size + chunkCount * 40,
		chunkCount,
		undefined,
		undefined,
		undefined,
		secretId,
	);
	try {
		const chunks: EntryAttachment["file_chunks"] = [];
		for (let position = 1; position <= chunkCount; position++) {
			const bytes = await new Promise<ArrayBuffer>((resolve, reject) => {
				const reader = new FileReader();
				reader.onerror = () => reject(reader.error);
				reader.onload = () => resolve(reader.result as ArrayBuffer);
				reader.readAsArrayBuffer(
					file.slice((position - 1) * chunkSize, position * chunkSize),
				);
			});
			const encrypted = await cryptoLibrary.encryptFile(
				new Uint8Array(bytes),
				key,
			);
			const hash = cryptoLibrary.sha512(encrypted);
			await fileTransferService.upload(
				new Blob([encrypted], { type: "application/octet-stream" }),
				transfer.file_transfer_id,
				transfer.file_transfer_secret_key,
				encrypted.byteLength,
				position,
				shard,
				repository,
				hash,
			);
			chunks.push({ hash, position });
			onProgress(Math.round((position / chunkCount) * 100));
		}
		pending.uploaded = {
			file_id: transfer.file_id,
			file_chunks: chunks,
			file_secret_key: key,
			file_size: file.size,
			file_shard_id: shard?.id ?? null,
			file_repository_id: repository?.id ?? null,
			filename: pending.filename,
		};
		return pending.uploaded;
	} catch (error) {
		await fileTransferService.deleteFile(transfer.file_id).catch(() => {});
		throw error;
	}
}
