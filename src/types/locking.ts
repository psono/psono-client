export type TimeoutAction = "LOCK" | "LOGOUT";

/** Older configurations and key hosts have no action field. */
export function normalizeTimeoutAction(value: unknown): TimeoutAction {
	return value === "LOGOUT" ? "LOGOUT" : "LOCK";
}
