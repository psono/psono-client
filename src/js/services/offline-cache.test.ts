jest.mock("./store", () => ({
	addOfflineCacheHashingParameters:
		jest.requireActual<typeof import("./store")>("./store")
			.addOfflineCacheHashingParameters,
	getStore: () => ({ getState: () => mockState }),
}));
jest.mock("../actions/bound-action-creators", () => ({
	__esModule: true,
	default: () => ({
		setOfflineCacheEncryptionInfo: (
			key: OfflineCacheEncryptionKey,
			salt: string,
		) => {
			mockState.client = {
				...mockState.client,
				offlineCacheEncryptionKey: key,
				offlineCacheEncryptionSalt: salt,
			};
		},
	}),
}));
jest.mock("./browser-client", () => ({
	__esModule: true,
	default: { emitSec: jest.fn() },
}));
jest.mock("./offscreen-document", () => ({
	__esModule: true,
	default: {
		getOfflineCacheEncryptionKey: jest.fn(),
		setOfflineCacheEncryptionKey: jest.fn(),
	},
}));
jest.mock("./secret", () => ({ __esModule: true, default: {} }));
jest.mock("./storage", () => ({ __esModule: true, default: {} }));

import type { OfflineCacheEncryptionKey } from "../../types/crypto";
import type { AppState } from "../../types/state";
import clientReducer from "../reducers/client";
import userReducer from "../reducers/user";
import cryptoLibrary from "./crypto-library";
import offlineCache from "./offline-cache";

let mockState: Pick<AppState, "client" | "user">;
const legacy = { u: 14, r: 8, p: 1, l: 64 };
const stronger = { ...legacy, u: 15 };

describe("offline cache wrapper hashing metadata", () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockState = {
			client: clientReducer(undefined, { type: "@@INIT" }),
			user: userReducer(undefined, { type: "@@INIT" }),
		};
		offlineCache.setEncryptionKey(null);
	});
	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	it.each([
		legacy,
		stronger,
	])("unlocks with wrapper parameters after account parameters change: %p", (parameters) => {
		mockState.user.hashingParameters = { ...parameters };
		offlineCache.setEncryptionPassword("offline-password");
		const key = offlineCache.getEncryptionKey();
		const wrapper = mockState.client.offlineCacheEncryptionKey!;
		expect(wrapper.hashingAlgorithm).toBe("scrypt");
		expect(wrapper.hashingParameters).toEqual(parameters);
		mockState.user.hashingParameters!.u = 16;
		mockState.user.hashingAlgorithm = "different-account-algorithm";
		offlineCache.setEncryptionKey(null);
		jest.runOnlyPendingTimers();
		expect(offlineCache.unlock("offline-password")).toBe(true);
		expect(offlineCache.getEncryptionKey()).toBe(key);
		expect(offlineCache.unlock("wrong-password")).toBe(false);
	});

	it("pins missing legacy metadata after a successful unlock", () => {
		mockState.client.offlineCacheEncryptionKey = cryptoLibrary.encryptSecret(
			"key",
			"password",
			"untagged-salt",
		);
		mockState.client.offlineCacheEncryptionSalt = "untagged-salt";
		expect(offlineCache.unlock("wrong-password")).toBe(false);
		expect(mockState.client.offlineCacheEncryptionKey).not.toHaveProperty(
			"hashingParameters",
		);
		expect(offlineCache.unlock("password")).toBe(true);
		expect(
			mockState.client.offlineCacheEncryptionKey!.hashingParameters,
		).toEqual(legacy);
	});

	it("keeps empty legacy state usable", () => {
		expect(offlineCache.unlock("password")).toBe(true);
	});
});
