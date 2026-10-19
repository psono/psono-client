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
