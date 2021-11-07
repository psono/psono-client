import React, { useState } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { compose } from "redux";
import { withTranslation } from "react-i18next";
import actionCreators from "../../actions/action-creators";
import LoginViewForm from "./login-form";
import { useParams } from "react-router-dom";

const LoginView = (props) => {
    let { samlTokenId, oidcTokenId } = useParams();
    return (
        <div className={"loginbox dark"}>
            <img src="img/logo.png" alt="Psono Web Client" id="logo" />
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true" />
            </a>
            <LoginViewForm state={props.state} samlTokenId={samlTokenId} oidcTokenId={oidcTokenId} />
        </div>
    );
};

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default compose(withTranslation(), connect(mapStateToProps, mapDispatchToProps))(LoginView);
