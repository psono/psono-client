import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import vaultLock from "../services/vault-lock";
import { normalizeTimeoutAction } from "../../types/locking";

export default function LockCountdown() {
	const { t } = useTranslation();
	const loggedIn = useSelector((state) => state.user.isLoggedIn);
	const [remaining, setRemaining] = React.useState(() =>
		vaultLock.getRemainingSeconds(),
	);
	const [action, setAction] = React.useState(() =>
		normalizeTimeoutAction(vaultLock.getConfiguration()?.timeoutAction),
	);
	React.useEffect(() => {
		let active = true;
		const update = () => {
			const seconds = vaultLock.getRemainingSeconds();
			if (active) {
				setRemaining(seconds);
				setAction(
					normalizeTimeoutAction(vaultLock.getConfiguration()?.timeoutAction),
				);
			}
		};
		const unsubscribe = vaultLock.subscribe(update);
		const timer = window.setInterval(update, 1000);
		update();
		return () => {
			active = false;
			window.clearInterval(timer);
			unsubscribe();
		};
	}, []);
	if (!loggedIn || remaining === null) return null;
	const hours = Math.floor(remaining / 3600);
	const minutes = Math.floor(remaining / 60) % 60;
	const seconds = remaining % 60;
	const pad = (value: number) => String(value).padStart(2, "0");
	const time = `${hours ? `${hours}:` : ""}${pad(minutes)}:${pad(seconds)}`;
	return (
		<div role="timer" style={{ fontVariantNumeric: "tabular-nums" }}>
			{action === "LOGOUT"
				? t("AUTO_LOGOUT_IN", { time })
				: t("AUTO_LOCK_IN", { time })}
		</div>
	);
}
