import { GlobalStyles } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Redirect, Route, Switch } from "react-router-dom";
import DialogDeviceClaimConsent from "../components/dialogs/claim-device-code";
import backgroundService from "../services/background";
import jobSchedulerService from "../services/job-scheduler";
import statusService from "../services/status";
import user from "../services/user";
import AccountView from "./account/index";
import ActivateView from "./activate";
import ActivateSuccessfulView from "./activate-successful";
import ActiveLinkShareView from "./active-link-shares";
import AuthenticateView from "./authenticate";
import DatastoreView from "./datastore";
import DeleteUserView from "./delete-user";
import DeleteUserConfirmView from "./delete-user-confirm";
import DeviceParameterHandler from "./device/device-parameter-handler";
import DownloadFileView from "./download-file";
import EmergencyCodeView from "./emergency-code";
import EnforceTwoFaView from "./enforce-two-fa";
import GroupsView from "./groups";
import InstallSuccessfulView from "./install-successful";
import KeyTransferView from "./key-transfer";
import LinkShareAccessView from "./link-share-access";
import LoginView from "./login";
import LogoutSuccessView from "./logout-success";
import LostPasswordView from "./lost-password";
import NotificationBarView from "./notification-bar";
import OpenSecretView from "./open-secret";
import OtherView from "./other";
import PendingsharesView from "./pendingshares";
import PopupView from "./popup";
import PopupPgpReadView from "./popup-pgp-read";
import PopupPgpWriteView from "./popup-pgp-write";
import PrivacyPolicyView from "./privacy-policy";
import RegisterView from "./register";
import SecurityReportView from "./security-report";
import SettingsView from "./settings";
import TrustedUsersView from "./trusted-users";

const IndexView = (props) => {
	const theme = useTheme();
	const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
	const hasTwoFactor = useSelector((state) => state.user.hasTwoFactor);
	const deviceCode = useSelector((state) => state.device.deviceCode);

	const [showDeviceCodeModal, setShowDeviceCodeModal] = useState(false);
	const pathname = window.location.pathname;

	React.useEffect(() => {
		document.body.classList.remove("loading");
		statusService.getStatus();
		jobSchedulerService.checkForJobs();
		if (pathname.endsWith("/background.html")) {
			backgroundService.activateAfterStore();
		}
	}, []);

	React.useEffect(() => {
		if (isLoggedIn && deviceCode && deviceCode.id && deviceCode.secretBoxKey) {
			setShowDeviceCodeModal(true);
		}
	}, [isLoggedIn, deviceCode]);

	if (pathname.endsWith("/activate.html")) {
		return (
			<Switch>
				<Route path="/activation-code/:activationCode">
					<ActivateView {...props} />
				</Route>
				<Route path="/">
					<ActivateView {...props} />
				</Route>
			</Switch>
		);
	} else if (pathname.endsWith("/logout-success.html")) {
		return (
			<Switch>
				<Route path="/">
					<LogoutSuccessView {...props} />
				</Route>
			</Switch>
		);
	} else if (pathname.endsWith("/notification-bar.html")) {
		return (
			<Switch>
				<Route path="/">
					<NotificationBarView {...props} />
				</Route>
			</Switch>
		);
	} else if (pathname.endsWith("/background.html")) {
		console.log("BACKGROUND");
		return "BACKGROUND";
	} else if (pathname.endsWith("/default_popup.html")) {
		if (!isLoggedIn) {
			return (
				<Switch>
					<Route path="/">
						<GlobalStyles
							styles={{
								body: { backgroundColor: theme.palette.blueBackground.main },
							}}
						/>
						<LoginView {...props} fullWidth />
					</Route>
				</Switch>
			);
		} else {
			return (
				<Switch>
					<Route path="/">
						<GlobalStyles
							styles={{
								body: { backgroundColor: theme.palette.blueBackground.main },
							}}
						/>
						<PopupView {...props} />
					</Route>
				</Switch>
			);
		}
	} else if (pathname.endsWith("/download-file.html")) {
		return (
			<Switch>
				<Route path="/file/download/:id">
					<DownloadFileView {...props} />
				</Route>
			</Switch>
		);
	} else if (pathname.endsWith("/emergency-code.html")) {
		return <EmergencyCodeView {...props} />;
	} else if (pathname.endsWith("/authenticate.html")) {
		return <AuthenticateView {...props} />;
	} else if (pathname.endsWith("/enforce-two-fa.html")) {
		return <EnforceTwoFaView {...props} />;
	} else if (pathname.endsWith("/key-transfer.html")) {
		return <KeyTransferView {...props} />;
	} else if (pathname.endsWith("/link-share-access.html")) {
		return (
			<Switch>
				<Route path="/link-share-access/:linkShareId/:linkShareSecret/:backendServerUrl/:verifyKey">
					<LinkShareAccessView {...props} />
				</Route>
				<Route path="/link-share-access/:linkShareId/:linkShareSecret/:backendServerUrl">
					<LinkShareAccessView {...props} />
				</Route>
			</Switch>
		);
	} else if (pathname.endsWith("/lost-password.html")) {
		return <LostPasswordView {...props} />;
	} else if (pathname.endsWith("/open-secret.html")) {
		return (
			<Switch>
				<Route path="/secret/:type/:secretId">
					<OpenSecretView {...props} />
				</Route>
			</Switch>
		);
	} else if (pathname.endsWith("/popup_pgp.html")) {
		if (!isLoggedIn) {
			return (
				<Switch>
					<Route path="/">
						<LoginView {...props} fullWidth />
					</Route>
				</Switch>
			);
		} else {
			return (
				<Switch>
					<Route path="/gpg/read/:gpgMessageId">
						<PopupPgpReadView {...props} />
					</Route>
					<Route path="/gpg/write/:gpgMessageId">
						<PopupPgpWriteView {...props} />
					</Route>
					<Route path="/">GPG Message ID not specified</Route>
				</Switch>
			);
		}
	} else if (pathname.endsWith("/privacy-policy.html")) {
		return <PrivacyPolicyView {...props} />;
	} else if (pathname.endsWith("/register.html")) {
		return <RegisterView {...props} />;
	} else if (pathname.endsWith("/delete-user.html")) {
		return <DeleteUserView {...props} />;
	} else if (pathname.endsWith("/delete-user-confirm.html")) {
		return (
			<Switch>
				<Route path="/unregistration-code/:unregisterCode">
					<DeleteUserConfirmView {...props} />
				</Route>
				<Route path="/">
					<DeleteUserConfirmView {...props} />
				</Route>
			</Switch>
		);
	} else if (pathname.endsWith("/install-successful.html")) {
		return <InstallSuccessfulView {...props} />;
	} else if (pathname.endsWith("/activate-successful.html")) {
		return <ActivateSuccessfulView {...props} />;
	} else {
		// pathname.endsWith('/index.html')
		if (isLoggedIn && !hasTwoFactor && user.requireTwoFaSetup()) {
			setTimeout(() => {
				// Timeout required, otherwise setUserInfo3 doesn't finish and not persisted
				window.location.href = "enforce-two-fa.html";
			}, 1);
		}
		if (isLoggedIn && user.requireServerSecretModification()) {
			setTimeout(() => {
				// Timeout required, otherwise setUserInfo3 doesn't finish and not persisted
				window.location.href = "key-transfer.html";
			}, 1);
		}
		if (!isLoggedIn) {
			return (
				<Switch>
					<Route path="/saml/token/:samlTokenId">
						<LoginView {...props} />
					</Route>
					<Route path="/oidc/token/:oidcTokenId">
						<LoginView {...props} />
					</Route>
					<Route path="/device/:deviceCode/:deviceCodeSecretBoxKey">
						<DeviceParameterHandler {...props} />
						<LoginView {...props} />
					</Route>
					<Route path="/">
						<LoginView {...props} />
					</Route>
				</Switch>
			);
		} else {
			return (
				<>
					<Switch>
						<Route path="/device/:deviceCode/:deviceCodeSecretBoxKey">
							<DeviceParameterHandler {...props} />
							<Redirect to="/" />
						</Route>
						<Route path="/device">
							<Redirect to="/" />
						</Route>
						<Route path="/settings">
							<SettingsView {...props} />
						</Route>
						<Route path="/account">
							<AccountView {...props} />
						</Route>
						<Route path="/other">
							<OtherView {...props} />
						</Route>
						<Route path="/share/pendingshares">
							<PendingsharesView {...props} />
						</Route>
						<Route path="/share/users">
							<TrustedUsersView {...props} />
						</Route>
						<Route path="/groups">
							<GroupsView {...props} />
						</Route>
						<Route path="/active-link-shares">
							<ActiveLinkShareView {...props} />
						</Route>
						<Route path="/security-report">
							<SecurityReportView {...props} />
						</Route>
						<Route path="/datastore/edit/:secretType/:secretId">
							<DatastoreView {...props} />
						</Route>
						<Route path="/datastore/search/:defaultSearch">
							<DatastoreView {...props} />
						</Route>
						<Route path="/">
							<DatastoreView {...props} />
						</Route>
					</Switch>
					<DialogDeviceClaimConsent
						open={showDeviceCodeModal}
						onClose={() => {
							setShowDeviceCodeModal(false);
						}}
					/>
				</>
			);
		}
	}
};

export default IndexView;
