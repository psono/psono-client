import store from "../services/store";
import actionCreators from "./action-creators";
import { bindActionCreators } from "redux";

export default bindActionCreators(actionCreators, store.dispatch);
