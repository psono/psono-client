import { bindActionCreators } from "redux";
import type { BoundActionCreators } from "../../types/actions";
import { getStore } from "../services/store";
import actionCreators from "./action-creators";

const useBoundActionCreators = () => {
	return bindActionCreators<
		typeof actionCreators,
		BoundActionCreators<typeof actionCreators>
	>(actionCreators, getStore().dispatch);
};

export default useBoundActionCreators;
