
import axios from 'axios'
import action from "../actions/bound-action-creators";

export function initRequestProgressBar () {

    let requestCounterOpen = 0;
    let requestCounterClosed = 0;

    axios.interceptors.request.use(function (config) {
        requestCounterOpen++;
        action.setRequestsInProgress(requestCounterOpen, requestCounterClosed);
        return config;
    }, function (error) {
        return Promise.reject(error);
    });

    // Add a response interceptor
    axios.interceptors.response.use(function (response) {
        requestCounterClosed++;
        if (requestCounterOpen === requestCounterClosed) {
            requestCounterOpen = 0;
            requestCounterClosed = 0;
        }
        action.setRequestsInProgress(requestCounterOpen, requestCounterClosed);
        return response;
    }, function (error) {
        requestCounterClosed++;
        if (requestCounterOpen === requestCounterClosed) {
            requestCounterOpen = 0;
            requestCounterClosed = 0;
        }
        action.setRequestsInProgress(requestCounterOpen, requestCounterClosed);
        return Promise.reject(error);
    });
}
