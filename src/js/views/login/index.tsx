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

const LoginView = ({ fullWidth = false }: LoginViewProps) => {
	const classes = useStyles();
	const { t } = useTranslation();
	const { samlTokenId, oidcTokenId } = useParams<SsoRouteParams>();

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
				<LoginForm
					samlTokenId={samlTokenId}
					oidcTokenId={oidcTokenId}
					fullWidth={fullWidth}
				/>
			</DarkBox>
		</>
	);
};

export default LoginView;
