import Button from "@mui/material/Button";
import React from "react";

/** Firefox closes action popups when WebAuthn takes focus. Authenticate in a
 * real extension tab, closing the popup only after tab creation succeeds. */
export default function AuthenticationInTab({
	children,
}: {
	children: React.ReactNode;
}) {
	const opening = React.useRef(false);
	const openTab = React.useCallback(async () => {
		if (opening.current) return;
		opening.current = true;
		try {
			await browser.tabs.create({
				url: browser.runtime.getURL("data/index.html"),
				active: true,
			});
			window.close();
		} catch (error) {
			opening.current = false;
			console.error("Could not open the authentication tab", error);
		}
	}, []);
	React.useEffect(() => {
		void openTab();
	}, [openTab]);
	return (
		<Button variant="contained" color="primary" onClick={openTab}>
			{children}
		</Button>
	);
}
