/**
 * Store service
 */

import { applyMiddleware, compose, createStore } from "redux";
import type { Middleware } from "redux";
import { createLogger } from "redux-logger";
import { createMigrate, persistReducer } from "redux-persist";
import type { MigrationManifest, Persistor } from "redux-persist";
import type { PersistPartial } from "redux-persist/es/persistReducer";
import autoMergeLevel2 from "redux-persist/lib/stateReconciler/autoMergeLevel2";
import {
	createStateSyncMiddleware,
	initMessageListener,
} from "redux-state-sync";
import thunkMiddleware from "redux-thunk";
import {
	LOGOUT,
	SET_REQUESTS_IN_PROGRESS,
	SET_SERVER_INFO,
	SET_SERVER_POLICY,
} from "../actions/action-types";

import rootReducer from "../reducers";
import accountService from "./account";
import storageService from "./storage";
import vaultLock from "./vault-lock";
import type {
	OfflineCacheEncryptionKey,
	ScryptParameters,
} from "../../types/crypto";
import type {
	AppAction,
	AppDispatch,
	AppState,
	AppStore,
	PersistentState,
} from "../../types/state";

const appReducer: typeof rootReducer = (state, action) => {
	if (action.type === "@@VAULT_LOCK") {
		const empty = rootReducer(undefined, { type: "@@INIT" });
		return {
			...empty,
			persistent: state?.persistent ?? empty.persistent,
			server: state?.server ?? empty.server,
		};
	}
	if (action.type === "@@VAULT_RESTORE" && restoredState) return restoredState;
	return rootReducer(state, action);
};
let restoredState: AppState | undefined;
let store: AppStore;
let unsubscribeLock: (() => void) | undefined;
let activePersistor: Persistor | undefined;
let storeGeneration = 0;

export function registerPersistor(persistor: Persistor) {
	activePersistor = persistor;
}

type PersistedAppState = AppState & PersistPartial;
type DebugWindow = Window & {
	store?: AppStore;
	__REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: (options: object) => typeof compose;
};

export function addOfflineCacheHashingParameters(
	encryptionKey: OfflineCacheEncryptionKey,
	hashingAlgorithm = "scrypt",
	hashingParameters?: ScryptParameters,
): OfflineCacheEncryptionKey {
	if (encryptionKey.hashingAlgorithm && encryptionKey.hashingParameters) {
		return encryptionKey;
	}
	return {
		...encryptionKey,
		hashingAlgorithm,
		hashingParameters: {
			u: Math.max(14, hashingParameters?.u ?? 14),
			r: Math.max(8, hashingParameters?.r ?? 8),
			p: Math.max(1, hashingParameters?.p ?? 1),
			l: Math.max(64, hashingParameters?.l ?? 64),
		},
	};
}

export function migrateOfflineCacheEncryptionInfo<
	T extends Pick<AppState, "client" | "user">,
>(state: T): T {
	const encryptionKey = state.client.offlineCacheEncryptionKey;
	if (
		!encryptionKey ||
		(encryptionKey.hashingAlgorithm && encryptionKey.hashingParameters)
	) {
		return state;
	}
	return {
		...state,
		client: {
			...state.client,
			offlineCacheEncryptionKey: addOfflineCacheHashingParameters(
				encryptionKey,
				state.user.hashingAlgorithm,
				state.user.hashingParameters,
			),
		},
	};
}

export const initStore = async () => {
	if (activePersistor) {
		activePersistor.pause();
		await activePersistor.flush();
	}
	await vaultLock.flush();
	// Retired stores may still be referenced by a state-sync listener. Clear
	// them, and permanently reject later application actions for that instance.
	store?.dispatch({ type: "@@VAULT_LOCK" });
	const instance = ++storeGeneration;
	const persistAccountId = await accountService.getCurrentId();
	await vaultLock.initialize(persistAccountId);

	const config = {
		channel: `redux_state_sync:${persistAccountId}`,
		// Never let the library's IndexedDB/localStorage fallback persist actions
		// containing session keys. All supported clients have native channels.
		broadcastChannelOption: { type: "native" as const },
		blacklist: [
			"persist/PERSIST",
			"persist/REHYDRATE",
			"@@VAULT_LOCK",
			"@@VAULT_RESTORE",
		],
	};

	const middlewares: Middleware<object, AppState>[] = [
		() => (next) => (action) => {
			if (instance !== storeGeneration && !String(action.type).startsWith("@@"))
				return;
			if (
				vaultLock.isBlocked() &&
				action.type !== LOGOUT &&
				!String(action.type).startsWith("persist/") &&
				!String(action.type).startsWith("@@")
			)
				return;
			return next(action);
		},
		thunkMiddleware,
		({ getState }) =>
			(next) =>
			(action) => {
				const result = next(action);
				if (
					action.type === SET_SERVER_POLICY ||
					action.type === SET_SERVER_INFO
				) {
					const server = getState().server;
					const lock = vaultLock.getConfiguration();
					if (
						lock?.enabled &&
						server.complianceMaxLockTimeout &&
						server.complianceMaxLockTimeout > 0 &&
						lock.timeout > server.complianceMaxLockTimeout
					) {
						vaultLock
							.update(
								true,
								server.complianceMaxLockTimeout,
								!!server.complianceEnforceLocking,
								server.complianceMaxLockTimeout,
							)
							.catch(() => vaultLock.lock());
					}
					if (
						server.complianceDisableOfflineMode ||
						(server.complianceEnforceLocking && !lock?.enabled)
					) {
						vaultLock.clearAccountData(persistAccountId).catch(() => {});
					}
				}
				return result;
			},
		createStateSyncMiddleware(config),
	];

	let composeEnhancers = compose; // Default to Redux's compose

	if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
		const loggerMiddleware = createLogger({
			predicate: (_getState: () => AppState, action: AppAction) =>
				action.type !== SET_REQUESTS_IN_PROGRESS,
		});
		middlewares.push(loggerMiddleware);

		// Enable Redux DevTools Extension in development
		if (
			typeof window !== "undefined" &&
			(window as DebugWindow).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
		) {
			composeEnhancers = (window as DebugWindow)
				.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__!({});
		}
	}

	const migrations: Record<
		number,
		(state: PersistedAppState) => PersistedAppState
	> = {
		0: (state) => {
			return {
				...state,
				server: {
					...state.server,
					complianceDisableUnmanagedGroups: false,
				},
				user: {
					...state.user,
					userDatastoreOverview: {
						datastores: [],
					},
				},
			};
		},
		1: (state) => {
			return {
				...state,
				client: {
					...state.client,
					lastPopupSearch: "",
				},
			};
		},
		2: (state) => {
			return {
				...state,
				server: {
					...state.server,
					disableCallbacks: true,
					allowedFileRepositoryTypes: [
						"azure_blob",
						"gcp_cloud_storage",
						"aws_s3",
						"do_spaces",
						"backblaze",
					],
				},
			};
		},
		3: (state) => {
			return {
				...state,
				user: {
					...state.user,
					serverSecretExists: ["SAML", "OIDC", "LDAP"].includes(
						state.user.authentication,
					),
				},
				server: {
					...state.server,
					complianceServerSecrets: "auto",
				},
				persistent: {
					...state.persistent,
					remoteConfigWebClientUrl: null,
				},
			};
		},
		4: (state) => {
			return {
				...state,
				server: {
					...state.server,
					complianceEnforceBreachDetection: false,
				},
			};
		},
		5: (state) => {
			return {
				...state,
				server: {
					...state.server,
					faviconServiceUrl: "",
				},
			};
		},
		6: (state) => {
			return {
				...state,
				user: {
					...state.user,
					hashingAlgorithm: "scrypt",
					hashingParameters: {
						u: 14,
						r: 8,
						p: 1,
						l: 64,
					},
				},
			};
		},
		7: (state) => {
			return {
				...state,
				server: {
					...state.server,
					complianceDisableTotp: false,
				},
			};
		},
		8: (state) => {
			return {
				...state,
				server: {
					...state.server,
					domainSynonyms: [],
					customDomainSynonyms: [],
					domainSynonymMap: {},
				},
			};
		},
		9: (state) => {
			return {
				...state,
				server: {
					...state.server,
					complianceDisableMultiplePasswordDatastores: false,
				},
			};
		},
		10: (state) => {
			return {
				...state,
				settingsDatastore: {
					...state.settingsDatastore,
					useMarkdownForNotes:
						state.settingsDatastore?.useMarkdownForNotes ?? true,
				},
			};
		},
		11: migrateOfflineCacheEncryptionInfo,
	};

	const persistConfig = {
		key: persistAccountId,
		blacklist: ["transient", "notification"],
		version: 11,
		storage: vaultLock.persistence,
		stateReconciler: autoMergeLevel2<AppState>,
		debug: false,
		// redux-persist exposes only _persist; these migrations operate on our roots.
		migrate: createMigrate(migrations as unknown as MigrationManifest, {
			debug: false,
		}),
	};

	const persistedReducer = persistReducer<AppState, AppAction>(
		persistConfig,
		appReducer,
	);

	store = createStore(
		persistedReducer,
		composeEnhancers(applyMiddleware<AppDispatch, AppState>(...middlewares)),
	);

	initMessageListener(store);
	unsubscribeLock?.();
	unsubscribeLock = vaultLock.subscribe(() => {
		if (vaultLock.isBlocked()) store.dispatch({ type: "@@VAULT_LOCK" });
		else if (
			vaultLock.getConfiguration()?.enabled &&
			!store.getState().user.isLoggedIn
		) {
			const generation = vaultLock.getRevision();
			vaultLock.persistence
				.getItem(`persist:${persistAccountId}`)
				.then((raw) => {
					if (
						!raw ||
						vaultLock.isLocked() ||
						generation !== vaultLock.getRevision()
					)
						return;
					const serialized = JSON.parse(raw) as Record<string, string>;
					const next = rootReducer(undefined, { type: "@@INIT" });
					for (const key of Object.keys(next) as (keyof AppState)[]) {
						if (serialized[key])
							Object.assign(next, {
								[key]: { ...next[key], ...JSON.parse(serialized[key]) },
							});
					}
					restoredState = next;
					store.dispatch({ type: "@@VAULT_RESTORE" });
					restoredState = undefined;
				});
		}
	});

	// Expose store to window only in development for debugging (optional)
	if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
		(window as DebugWindow).store = store;
	}

	return store;
};

/**
 * Initializes the standalone link-share page with a private, anonymous store.
 * Only host pins and client configuration are copied from the active account.
 * There is deliberately no persistence or cross-tab state synchronization: a
 * share's backend selection and host approvals must stay within this page.
 */
export const initLinkShareStore = async () => {
	const initialState = appReducer(undefined, { type: "@@INIT_LINK_SHARE" });
	const accountId = await accountService.getCurrentId();
	const persistedState: Record<string, string> | null = JSON.parse(
		(await vaultLock.readPublicState(accountId)) ??
			(await vaultLock.readAccount(accountId)) ??
			"null",
	);

	if (persistedState?.persistent) {
		const persistent: PersistentState = JSON.parse(persistedState.persistent);
		const copyPersistent = <K extends keyof PersistentState>(key: K) => {
			initialState.persistent[key] = persistent[key];
		};
		for (const key of [
			"knownHosts",
			"remoteConfigWebClientUrl",
			"remoteConfigJson",
		] as const) {
			if (Object.hasOwn(persistent, key)) {
				copyPersistent(key);
			}
		}
	}

	store = createStore(
		appReducer,
		initialState,
		applyMiddleware(thunkMiddleware),
	);
	return store;
};

export const isStoreInitialized = () => {
	return store !== undefined;
};

/** Call after initStore/initLinkShareStore; isStoreInitialized guards startup. */
export const getStore = (): AppStore => {
	return store;
};
