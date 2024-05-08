import { getStore } from "../services/store";
import actionCreators from "./action-creators";
import { bindActionCreators } from "redux";


const useBoundActionCreators = () => {
    return bindActionCreators(actionCreators, getStore().dispatch);
};

export default useBoundActionCreators;
