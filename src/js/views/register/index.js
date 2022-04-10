import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import actionCreators from "../../actions/action-creators";
import RegisterViewForm from "./register-form";
import { useParams } from "react-router-dom";

const RegisterView = (props) => {
    let { samlTokenId, oidcTokenId } = useParams();
    return (
        <div className={"registerbox dark"}>
            <img src="img/logo.png" alt="Psono Web Client" id="logo" />
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true" />
            </a>
            <RegisterViewForm state={props.state} samlTokenId={samlTokenId} oidcTokenId={oidcTokenId} />
        </div>
    );
};

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default connect(mapStateToProps, mapDispatchToProps)(RegisterView);
