import { SET_FINGERPRINT, SET_KNOWN_HOSTS, SET_AUTO_APPROVE_PLAINTEXT_PASSWORD, SET_REMOTE_CONFIG_JSON } from "../actions/action-types";

const defaultKnownHosts = [
    {
        url: "https://www.psono.pw/server",
        verify_key: "a16301bd25e3a445a83b279e7091ea91d085901933f310fdb1b137db9676de59",
    },
];

function persistent(
    state = {
        knownHosts: defaultKnownHosts,
        autoApproveLdap: {},
        remoteConfigJson: null,
        fingerprint: null,
    },
    action
) {
    switch (action.type) {
        case SET_KNOWN_HOSTS:
            return Object.assign({}, state, {
                knownHosts: action.knownHosts,
            });
        case SET_AUTO_APPROVE_PLAINTEXT_PASSWORD:
            return Object.assign({}, state, {
                autoApproveLdap: action.autoApproveLdap,
            });
        case SET_REMOTE_CONFIG_JSON:
            return Object.assign({}, state, {
                remoteConfigJson: action.remoteConfigJson,
            });
        case SET_FINGERPRINT:
            return Object.assign({}, state, {
                fingerprint: action.fingerprint,
            });
        default:
            return state;
    }
}

export default persistent;
