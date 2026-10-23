import Button from "@mui/material/Button";
import { makeStyles } from "@mui/styles";
import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import type { LoginViewProps, SsoRouteParams } from "../../../types/auth-ui";
import ConfigLogo from "../../components/config-logo";
import DarkBox from "../../components/dark-box";
import FrameControls from "../../components/frame-controls";
import LoginForm from "./login-form";

const useStyles = makeStyles((theme) => ({
	box: {
		width: "340px",
		padding: theme.spacing(2.5),
		position: "absolute",
		top: "40%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		borderRadius: "4px",
		[theme.breakpoints.up("sm")]: {
			width: "540px",
		},
	},
	popupBox: {
		paddingBottom: "16px",
	},
}));

/** Firefox closes action popups when the WebAuthn prompt takes focus. */
const LoginInTab = () => {
	const { t } = useTranslation();
	const opening = React.useRef(false);
	const openLoginTab = React.useCallback(async () => {
		if (opening.current) {
			return;
		}
		opening.current = true;
		try {
			await browser.tabs.create({
				url: browser.runtime.getURL("data/index.html"),
				active: true,
			});
			window.close();
		} catch (error) {
			opening.current = false;
			console.error("Could not open the login tab", error);
		}
	}, []);

	React.useEffect(() => {
		void openLoginTab();
	}, [openLoginTab]);

	return (
		<Button variant="contained" color="primary" onClick={openLoginTab}>
			{t("LOGIN")}
		</Button>
	);
};

const LoginView = ({ fullWidth = false }: LoginViewProps) => {
	const classes = useStyles();
	const { t } = useTranslation();
	const { samlTokenId, oidcTokenId } = useParams<SsoRouteParams>();
	const loginInTab =
		TARGET === "firefox" &&
		window.location.pathname.endsWith("/default_popup.html");

	return (
		<>
			<FrameControls />
			<DarkBox className={fullWidth ? classes.popupBox : classes.box}>
				<ConfigLogo
					configKey={"logo"}
					defaultLogo={"img/logo.png"}
					height="100%"
				/>
				<a
					href="https://psono.com/"
					aria-label={`${t("INFO")}: Psono`}
					target="_blank"
					rel="noopener"
					className="infolabel"
				>
					<i className="fa fa-info-circle" aria-hidden="true" />
				</a>
				{loginInTab ? (
					<LoginInTab />
				) : (
					<LoginForm
						samlTokenId={samlTokenId}
						oidcTokenId={oidcTokenId}
						fullWidth={fullWidth}
					/>
				)}
			</DarkBox>
		</>
	);
};

export default LoginView;
