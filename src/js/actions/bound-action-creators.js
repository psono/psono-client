import { bindActionCreators } from "redux";
import { getStore } from "../services/store";
import actionCreators from "./action-creators";

const useBoundActionCreators = () => {
	return bindActionCreators(actionCreators, getStore().dispatch);
};

export default useBoundActionCreators;
