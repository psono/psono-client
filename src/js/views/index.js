import React from "react";
import { connect } from "react-redux";
import { Switch, Route } from "react-router-dom";
import { bindActionCreators } from "redux";
import actionCreators from "../actions/action-creators";

import LoginView from "./login";
import DatastoreView from "./datastore";
import AccountView from "./account/index";
import PendingsharesView from "./pendingshares";
import PrivacyPolicyView from "./privacy-policy";

const IndexView = (props) => {
    const pathname = window.location.pathname;

    if (pathname.endsWith("/activate.html")) {
    } else if (pathname.endsWith("/background.html")) {
    } else if (pathname.endsWith("/default_popup.html")) {
    } else if (pathname.endsWith("/download-file.html")) {
    } else if (pathname.endsWith("/emergency-code.html")) {
    } else if (pathname.endsWith("/enforce-two-fa.html")) {
    } else if (pathname.endsWith("/link-share.html")) {
    } else if (pathname.endsWith("/lost-password.html")) {
    } else if (pathname.endsWith("/open-secret.html")) {
    } else if (pathname.endsWith("/popup_pgp.html")) {
    } else if (pathname.endsWith("/privacy-policy.html")) {
        return <PrivacyPolicyView {...props} />;
    } else if (pathname.endsWith("/register.html")) {
        return <h1>Register here!</h1>;
    } else {
        // pathname.endsWith('/index.html')
        if (!props.state.user.isLoggedIn) {
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
                    <Route path="/account">
                        <AccountView {...props} />
                    </Route>
                    <Route path="/share/pendingshares">
                        <PendingsharesView {...props} />
                    </Route>
                    <Route path="/">
                        <DatastoreView {...props} />
                    </Route>
                </Switch>
            );
        }
    }
};

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default connect(mapStateToProps, mapDispatchToProps)(IndexView);
