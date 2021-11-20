import React from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import actionCreators from "../../actions/action-creators";
import EmergencyCodeViewForm from "./emergency-code-form";
import { useParams } from "react-router-dom";

const EmergencyCodeView = (props) => {
    let { samlTokenId, oidcTokenId } = useParams();
    return (
        <div className={"lostpasswordbox dark"}>
            <img src="img/logo.png" alt="Psono Web Client" id="logo" />
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true" />
            </a>
            <EmergencyCodeViewForm state={props.state} samlTokenId={samlTokenId} oidcTokenId={oidcTokenId} />
        </div>
    );
};

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default connect(mapStateToProps, mapDispatchToProps)(EmergencyCodeView);
