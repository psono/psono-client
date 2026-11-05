import React from "react";
import type { Datastore } from "../../types/datastore";
import type { CachedResource } from "../services/offline-cache";
import datastorePassword from "../services/datastore-password";
import {
	createDisplayResource,
	getDisplayScope,
} from "../services/offline-cache";
import { getStore } from "../services/store";

export function useCachedDatastore(
	id: string | undefined,
	callbacks: {
		onData: (data: Datastore, source: "cache" | "server") => void;
		onReset: () => void;
		onError: (error: unknown, retained: boolean) => void;
	},
) {
	const currentCallbacks = React.useRef(callbacks);
	currentCallbacks.current = callbacks;
	const resource = React.useRef<CachedResource<Datastore>>();
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<unknown>(null);
	React.useEffect(() => {
		currentCallbacks.current.onReset();
		setError(null);
		const loader = createDisplayResource<Datastore>({
			kind: "datastore",
			read: (mode) =>
				datastorePassword.getPasswordDatastoreForDisplay(id, mode),
			scope: () =>
				`${getDisplayScope()}:${
					getStore()
						.getState()
						.user.userDatastoreOverview.datastores.find(
							(entry) => entry.type === "password" && entry.is_default,
						)?.id ?? ""
				}`,
			onData: (data, source) => {
				if (source === "server") datastorePassword.fillStorage(data);
				currentCallbacks.current.onData(data, source);
			},
			onError: (error, retained) => {
				setError(error);
				currentCallbacks.current.onError(error, retained);
			},
			onState: (state) => {
				setLoading(state.refreshing && !state.hasData);
				if (!state.error) setError(null);
			},
		});
		resource.current = loader;
		void loader.load();
		const retry = () => {
			void loader.load();
		};
		window.addEventListener("online", retry);
		return () => {
			window.removeEventListener("online", retry);
			loader.dispose();
		};
	}, [id]);
	const reload = React.useCallback(() => {
		void resource.current?.load();
	}, []);
	return { loading, error, reload };
}
