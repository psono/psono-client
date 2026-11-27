import type { Datastore } from "../../types/datastore";
import type { LinkTree } from "../../types/vault";
import apiClient from "./api-client";
import cryptoLibrary from "./crypto-library";
import datastoreService from "./datastore";
import offlineCache, { type CacheMetadata } from "./offline-cache";
import shareService from "./share";
import { getStore } from "./store";
import vaultLock from "./vault-lock";

export interface LinkCleanupResult {
	moved: number;
	deleted: number;
	skipped: number;
	unavailableShares?: string[];
}

export interface LinkCleanupProgress extends LinkCleanupResult {
	phase: "scan" | "repair";
	completed: number;
	total: number;
}

export class LinkCleanupError extends Error {
	constructor(
		message: string,
		public result: LinkCleanupResult,
		public details?: string,
	) {
		super(message);
	}
}

interface Container {
	kind: "datastore" | "share";
	id: string;
	write: boolean;
	metadata: CacheMetadata;
}

interface Reference {
	secretId: string;
	parent: Container;
}

const parentKey = (parent: Pick<Container, "kind" | "id">) =>
	`${parent.kind}:${parent.id}`;
const signature = (metadata: CacheMetadata) =>
	JSON.stringify({
		write_date: metadata.write_date,
		shares: metadata.shares?.map((share) => share.id).sort(),
		secrets: metadata.secrets
			?.map((secret) => `${secret.link_id}:${secret.id}`)
			.sort(),
	});

let running = false;

/** Transport errors keep the decrypted API payload inside a data envelope. */
function cleanupErrorCodes(error: unknown): string[] {
	if (typeof error === "string")
		return /^[A-Z][A-Z0-9_]+$/.test(error) ? [error] : [];
	if (Array.isArray(error)) return error.flatMap(cleanupErrorCodes);
	if (!error || typeof error !== "object") return [];
	return [
		"data",
		"non_field_errors",
		"errors",
		"error",
		"detail",
		"message",
	].flatMap((key) =>
		cleanupErrorCodes((error as Record<string, unknown>)[key]),
	);
}

function isUnavailableCleanupShare(error: unknown) {
	return (
		(error as { status?: number } | null)?.status === 400 ||
		cleanupErrorCodes(error).includes("NO_PERMISSION_OR_NOT_EXIST")
	);
}

/** Only called by the manual settings action. Never reconcile a cached or partial tree. */
async function cleanup(
	onProgress?: (progress: LinkCleanupProgress) => void,
): Promise<LinkCleanupResult> {
	const result: LinkCleanupResult = { moved: 0, deleted: 0, skipped: 0 };
	if (running) throw new LinkCleanupError("LINK_CLEANUP_RUNNING", result);
	running = true;
	let operation = "";
	try {
		const state = getStore().getState();
		const { token, sessionSecretKey } = state.user;
		const revision = vaultLock.getRevision();
		const assertCurrent = () => {
			const current = getStore().getState();
			if (
				!token ||
				!sessionSecretKey ||
				vaultLock.isBlocked() ||
				current.user.token !== token ||
				current.user.sessionSecretKey !== sessionSecretKey ||
				current.server.url !== state.server.url ||
				vaultLock.getRevision() !== revision ||
				offlineCache.isActive()
			)
				throw new Error("LINK_CLEANUP_UNAVAILABLE");
		};
		assertCurrent();
		const containers = new Map<string, Container>();
		const references = new Map<string, Reference>();
		// Shared single-entry roots in legacy data can omit their local link ID.
		const anonymous = new Map<string, Container[]>();
		const shareKeys = new Map<string, string>();
		const requiredShares = new Set<string>();
		const unavailableShares = new Set<string>();
		let scanned = 0;
		const progress = (
			phase: LinkCleanupProgress["phase"],
			completed: number,
			total: number,
		) => onProgress?.({ ...result, phase, completed, total });
		const discoverShare = (id: string, key?: string) => {
			requiredShares.add(id);
			if (key) {
				if (shareKeys.has(id) && shareKeys.get(id) !== key)
					throw new Error("LINK_CLEANUP_CONFLICT");
				shareKeys.set(id, key);
			}
		};
		const index = (node: Datastore, parent: Container, root = false) => {
			if (!node || typeof node !== "object" || Array.isArray(node))
				throw new Error("LINK_CLEANUP_INCOMPLETE");
			if (node.share_id) {
				discoverShare(node.share_id, node.share_secret_key);
				return; // Embedded share contents belong to the share, not this parent.
			}
			if (node.secret_id) {
				if (!node.id && root && parent.kind === "share") {
					anonymous.set(node.secret_id, [
						...(anonymous.get(node.secret_id) ?? []),
						parent,
					]);
				} else {
					if (!node.id) throw new Error("LINK_CLEANUP_INCOMPLETE");
					const previous = references.get(node.id);
					if (
						previous &&
						(previous.secretId !== node.secret_id ||
							parentKey(previous.parent) !== parentKey(parent))
					)
						throw new Error("LINK_CLEANUP_CONFLICT");
					references.set(node.id, { secretId: node.secret_id, parent });
				}
			}
			for (const [id, location] of Object.entries(node.share_index ?? {})) {
				discoverShare(id, location?.secret_key);
			}
			for (const children of [node.folders, node.items]) {
				if (children !== undefined && !Array.isArray(children))
					throw new Error("LINK_CLEANUP_INCOMPLETE");
				for (const child of children ?? []) index(child, parent);
			}
		};
		const register = (parent: Container, tree: Datastore) => {
			const metadata = parent.metadata;
			if (
				!metadata.write_date ||
				tree.write_date !== metadata.write_date ||
				!Array.isArray(metadata.secrets) ||
				!Array.isArray(metadata.shares)
			)
				throw new Error("LINK_CLEANUP_CHANGED");
			for (const secret of metadata.secrets) {
				if (!secret.id || !secret.link_id)
					throw new Error("LINK_CLEANUP_SERVER_UNSUPPORTED");
			}
			containers.set(parentKey(parent), parent);
			// Settings datastores contain arrays instead of folder trees.
			if (Array.isArray(tree)) {
				if (metadata.secrets.length || metadata.shares.length)
					throw new Error("LINK_CLEANUP_INCOMPLETE");
			} else index(tree, parent, true);
			for (const share of metadata.shares) {
				if (!share.id) throw new Error("LINK_CLEANUP_INCOMPLETE");
				discoverShare(share.id);
			}
			scanned++;
		};

		operation = "GET /datastore/";
		const overview = await apiClient.readDatastore(
			token,
			sessionSecretKey,
			undefined,
			"refresh",
		);
		assertCurrent();
		operation = "GET /share/right/";
		const rights = await apiClient.readShareRightsOverview(
			token,
			sessionSecretKey,
			"refresh",
		);
		assertCurrent();
		const rightsSignature = (value: typeof rights.data) =>
			JSON.stringify(
				value.share_rights
					.filter((right) => !unavailableShares.has(right.share_id))
					.map(
						(right) =>
							`${right.share_id}:${right.read}:${right.write}:${right.grant}`,
					)
					.sort(),
			);
		for (const right of rights.data.share_rights)
			if (right.read) discoverShare(right.share_id);
		// Also discover accepted shares whose tree placeholder was lost.
		operation = "GET /share/";
		const shares = await apiClient.readShares(
			token,
			sessionSecretKey,
			"refresh",
		);
		assertCurrent();
		for (const share of shares.data.shares) {
			if (share.share_right_accepted === true && share.share_right_read) {
				operation = `Decrypt share key ${share.id}`;
				discoverShare(
					share.id,
					cryptoLibrary.decryptSecretKey(
						share.share_right_key,
						share.share_right_key_nonce,
					),
				);
			}
		}
		for (const datastore of overview.data.datastores) {
			assertCurrent();
			operation = `GET /datastore/${datastore.id}/`;
			const tree = await datastoreService.getDatastoreWithId(
				datastore.id,
				"refresh",
			);
			assertCurrent();
			if (!tree) throw new Error("LINK_CLEANUP_INCOMPLETE");
			operation = `GET /metadata-datastore/${datastore.id}/`;
			const metadata = await apiClient.readCacheMetadata(
				"datastore",
				token,
				sessionSecretKey,
				datastore.id,
			);
			assertCurrent();
			register(
				{
					kind: "datastore",
					id: datastore.id,
					write: true,
					metadata: metadata.data,
				},
				tree,
			);
			progress(
				"scan",
				scanned,
				overview.data.datastores.length + requiredShares.size,
			);
		}
		// Keys discovered in one share may unlock another; never recurse indefinitely on cycles.
		while (true) {
			const next = [...shareKeys].find(
				([id]) => !containers.has(`share:${id}`) && !unavailableShares.has(id),
			);
			if (!next) break;
			const [id, key] = next;
			assertCurrent();
			operation = `GET /share/${id}/`;
			let share;
			let metadata: { data: CacheMetadata };
			try {
				share = await shareService.readShare(id, key, "refresh");
				assertCurrent();
				if (!share) throw new Error("LINK_CLEANUP_INCOMPLETE");
				operation = `GET /metadata-share/${id}/`;
				metadata = await apiClient.readCacheMetadata(
					"share",
					token,
					sessionSecretKey,
					id,
				);
			} catch (error) {
				assertCurrent();
				if (!isUnavailableCleanupShare(error)) throw error;
				unavailableShares.add(id);
				result.unavailableShares = [...unavailableShares];
				continue;
			}
			assertCurrent();
			if (!share) throw new Error("LINK_CLEANUP_INCOMPLETE");
			register(
				{
					kind: "share",
					id,
					write: share.rights.write,
					metadata: metadata.data,
				},
				share.data,
			);
			progress(
				"scan",
				scanned,
				overview.data.datastores.length + requiredShares.size,
			);
		}
		// Stale metadata and share indexes can retain descendants after access
		// was lost, without retaining their keys. Check access before requiring a key.
		for (const id of requiredShares) {
			if (containers.has(`share:${id}`) || unavailableShares.has(id)) continue;
			operation = `GET /metadata-share/${id}/`;
			try {
				await apiClient.readCacheMetadata("share", token, sessionSecretKey, id);
				assertCurrent();
				// Metadata alone does not confirm access to the encrypted share.
				// Probe it without decrypting so a rejected keyless share is skipped too.
				operation = `GET /share/${id}/`;
				await apiClient.readShare(token, sessionSecretKey, id, "refresh");
			} catch (error) {
				assertCurrent();
				if (!isUnavailableCleanupShare(error)) throw error;
				unavailableShares.add(id);
				result.unavailableShares = [...unavailableShares];
				continue;
			}
			assertCurrent();
			throw new Error("LINK_CLEANUP_INCOMPLETE");
		}

		const links = new Map<string, { secretId: string; parent: Container }>();
		for (const parent of containers.values()) {
			for (const secret of parent.metadata.secrets!) {
				if (links.has(secret.link_id!))
					throw new Error("LINK_CLEANUP_CONFLICT");
				links.set(secret.link_id!, { secretId: secret.id!, parent });
			}
		}
		const operations: {
			linkId: string;
			source: Container;
			target?: Container;
		}[] = [];
		for (const [linkId, link] of links) {
			let reference = references.get(linkId);
			if (reference && reference.secretId !== link.secretId)
				throw new Error("LINK_CLEANUP_CONFLICT");
			if (!reference && anonymous.has(link.secretId)) {
				const parents = anonymous.get(link.secretId)!;
				const candidates = [...links].filter(
					([id, candidate]) =>
						candidate.secretId === link.secretId && !references.has(id),
				);
				if (parents.length !== 1 || candidates.length !== 1) {
					result.skipped++;
					continue;
				}
				reference = { secretId: link.secretId, parent: parents[0] };
			}
			if (reference && parentKey(reference.parent) === parentKey(link.parent))
				continue;
			if (!link.parent.write || (reference && !reference.parent.write)) {
				result.skipped++;
				continue;
			}
			operations.push({
				linkId,
				source: link.parent,
				target: reference?.parent,
			});
		}

		// Revalidate the complete scan before the first mutation. Link changes do not
		// update the encrypted parent's write_date, so compare link membership too.
		operation = "GET /datastore/";
		const latestOverview = await apiClient.readDatastore(
			token,
			sessionSecretKey,
			undefined,
			"refresh",
		);
		assertCurrent();
		if (
			overview.data.datastores
				.map((store) => store.id)
				.sort()
				.join() !==
			latestOverview.data.datastores
				.map((store) => store.id)
				.sort()
				.join()
		)
			throw new Error("LINK_CLEANUP_CHANGED");
		for (const parent of containers.values()) {
			operation = `GET /metadata-${parent.kind}/${parent.id}/`;
			let latest;
			try {
				latest = await apiClient.readCacheMetadata(
					parent.kind,
					token,
					sessionSecretKey,
					parent.id,
				);
			} catch (error) {
				assertCurrent();
				if (parent.kind !== "share" || !isUnavailableCleanupShare(error))
					throw error;
				unavailableShares.add(parent.id);
				result.unavailableShares = [...unavailableShares];
				continue;
			}
			assertCurrent();
			if (signature(latest.data) !== signature(parent.metadata))
				throw new Error("LINK_CLEANUP_CHANGED");
		}
		operation = "GET /share/right/";
		const latestRights = await apiClient.readShareRightsOverview(
			token,
			sessionSecretKey,
			"refresh",
		);
		assertCurrent();
		if (rightsSignature(latestRights.data) !== rightsSignature(rights.data))
			throw new Error("LINK_CLEANUP_CHANGED");
		const accessible = (parent: Container) =>
			parent.kind !== "share" || !unavailableShares.has(parent.id);
		const repairs = operations.filter(
			(repair) =>
				accessible(repair.source) &&
				(!repair.target || accessible(repair.target)),
		);
		result.skipped += operations.length - repairs.length;
		progress("repair", 0, repairs.length);
		for (const [i, repair] of repairs.entries()) {
			assertCurrent();
			operation = `${repair.target ? "POST" : "DELETE"} /secret/link/ (${repair.linkId})`;
			if (repair.target) {
				await apiClient.moveSecretLink(
					token,
					sessionSecretKey,
					repair.linkId,
					repair.target.kind === "share" ? repair.target.id : undefined,
					repair.target.kind === "datastore" ? repair.target.id : undefined,
				);
				result.moved++;
			} else {
				await apiClient.deleteSecretLink(
					token,
					sessionSecretKey,
					repair.linkId,
				);
				result.deleted++;
			}
			assertCurrent();
			progress("repair", i + 1, repairs.length);
		}
		return result;
	} catch (error) {
		const codes = cleanupErrorCodes(error);
		const reason =
			codes.join(", ") || (error instanceof Error ? error.name : "");
		throw new LinkCleanupError(
			error instanceof Error ? error.message : "LINK_CLEANUP_FAILED",
			{ ...result },
			[operation, reason].filter(Boolean).join(": "),
		);
	} finally {
		running = false;
	}
}

let timeout = 0;

/**
 * Searches a datastore object and moves all links to the new target
 * Won't look into shares nor move them
 *
 * @param {object} datastore The datastore object
 * @param {uuid|undefined} [newParentShareId=null] (optional) New parent share ID, necessary if no newParentDatastoreId is provided
 * @param {uuid|undefined} [newParentDatastoreId=null] (optional) New datastore ID, necessary if no newParentShareId is provided
 * @param {function|undefined} [onOpenRequest] (optional) callback function that is called whenever a request to the backend is fired
 * @param {function|undefined} [onClosedRequest] (optional) callback function that is called whenever a request to the backend finishes
 *
 * @returns {Promise} Returns promise with the status of the move
 */
function moveSecretLinks(
	datastore: LinkTree,
	newParentShareId?: string,
	newParentDatastoreId?: string,
	onOpenRequest?: () => void,
	onClosedRequest?: () => void,
) {
	let i;

	function moveSecretLinkTimed(
		linkId: string,
		newParentShareId?: string,
		newParentDatastoreId?: string,
	) {
		if (onOpenRequest) {
			onOpenRequest();
		}
		timeout = timeout + 50;
		setTimeout(() => {
			moveSecretLink(
				linkId,
				newParentShareId,
				newParentDatastoreId,
				undefined,
				onClosedRequest,
			);
		}, timeout);
	}
	for (
		i = 0;
		Object.hasOwn(datastore, "folders") && i < datastore["folders"]!.length;
		i++
	) {
		if (Object.hasOwn(datastore["folders"]![i], "share_id")) {
			continue;
		}
		moveSecretLinks(
			datastore["folders"]![i],
			newParentShareId,
			newParentDatastoreId,
			onOpenRequest,
			onClosedRequest,
		);
	}
	for (
		i = 0;
		Object.hasOwn(datastore, "items") && i < datastore["items"]!.length;
		i++
	) {
		if (!Object.hasOwn(datastore["items"]![i], "secret_id")) {
			continue;
		}
		if (Object.hasOwn(datastore["items"]![i], "share_id")) {
			continue;
		}
		moveSecretLinkTimed(
			datastore["items"]![i]["id"]!,
			newParentShareId,
			newParentDatastoreId,
		);
	}
}

/** Resets the timeout before running moveSecretLinks. */
function resetSecretLinkTimeout() {
	timeout = 0;
}

/** Moves a secret link to a new parent share or datastore. */
function moveSecretLink(
	linkId: string,
	newParentShareId?: string,
	newParentDatastoreId?: string,
	onOpenRequest?: () => void,
	onClosedRequest?: () => void,
) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	if (onOpenRequest) {
		onOpenRequest();
	}
	const onError = () => {
		if (onClosedRequest) {
			onClosedRequest();
		}
	};
	const onSuccess = () => {
		if (onClosedRequest) {
			onClosedRequest();
		}
	};
	return apiClient
		.moveSecretLink(
			token,
			sessionSecretKey,
			linkId,
			newParentShareId,
			newParentDatastoreId,
		)
		.then(onSuccess, onError);
}

/** Deletes a link to a secret. */
function deleteSecretLink(linkId: string, logAuditTitle?: string) {
	const token = getStore().getState().user.token;
	const sessionSecretKey = getStore().getState().user.sessionSecretKey;
	const onError = () => {
		// pass
	};
	const onSuccess = () => {
		// pass
	};
	return apiClient
		.deleteSecretLink(token, sessionSecretKey, linkId, logAuditTitle)
		.then(onSuccess, onError);
}

/** Handles reparenting after a secret is moved. */
function onSecretMoved(linkId: string, parent: LinkTree) {
	let new_parent_share_id, new_parent_datastore_id;
	if (Object.hasOwn(parent, "share_id")) {
		new_parent_share_id = parent.share_id;
	} else if (Object.hasOwn(parent, "datastore_id")) {
		new_parent_datastore_id = parent.datastore_id;
	} else {
		return Promise.reject({
			response: "error",
			error_data: "Could not determine if its a share or datastore parent",
		});
	}
	return moveSecretLink(linkId, new_parent_share_id, new_parent_datastore_id);
}

export default {
	cleanup,
	moveSecretLinks,
	resetSecretLinkTimeout,
	moveSecretLink,
	deleteSecretLink,
	onSecretMoved,
};
