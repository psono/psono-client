import React from "react";
import { useSelector } from "react-redux";
import { Switch, Route } from "react-router-dom";

import LoginView from "./login";
import DatastoreView from "./datastore";
import AccountView from "./account/index";
import PendingsharesView from "./pendingshares";
import PopupView from "./popup";
import PrivacyPolicyView from "./privacy-policy";
import OtherView from "./other";
import SettingsView from "./settings";
import LostPasswordView from "./lost-password";
import EmergencyCodeView from "./emergency-code";
import OpenSecretView from "./open-secret";
import DownloadFileView from "./download-file";
import TrustedUsersView from "./trusted-users";
import GroupsView from "./groups";
import ActiveLinkShareView from "./active-link-shares";

const IndexView = (props) => {
    const isLoggedIn = useSelector((state) => state.user.isLoggedIn);

    const pathname = window.location.pathname;

    if (pathname.endsWith("/activate.html")) {
    } else if (pathname.endsWith("/background.html")) {
        return "BACKGROUND";
    } else if (pathname.endsWith("/default_popup.html")) {
        if (!isLoggedIn) {
            return (
                <Switch>
                    <Route path="/">
                        <LoginView {...props} />
                    </Route>
                </Switch>
            );
        } else {
            return (
                <Switch>
                    <Route path="/">
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
    } else if (pathname.endsWith("/enforce-two-fa.html")) {
    } else if (pathname.endsWith("/link-share.html")) {
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
    } else if (pathname.endsWith("/privacy-policy.html")) {
        return <PrivacyPolicyView {...props} />;
    } else if (pathname.endsWith("/register.html")) {
        return <h1>Register here!</h1>;
    } else {
        // pathname.endsWith('/index.html')
        if (!isLoggedIn) {
            return (
                <Switch>
                    <Route path="/saml/token/:samlTokenId">
                        <LoginView {...props} />
                    </Route>
                    <Route path="/oidc/token/:oidcTokenId">
                        <LoginView {...props} />
                    </Route>
                    <Route path="/">
                        <LoginView {...props} />
                    </Route>
                </Switch>
            );
        } else {
            return (
                <Switch>
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
                    <Route path="/">
                        <DatastoreView {...props} />
                    </Route>
                </Switch>
            );
        }
    }
};

export default IndexView;
