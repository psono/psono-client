import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import action from '../../actions/bound-action-creators'; //

const DeviceParameterHandler = () => {
    const { deviceCode, deviceCodeSecretBoxKey } = useParams();

    useEffect(() => {
        if (deviceCode && deviceCodeSecretBoxKey) {
            action().setDeviceCode(deviceCode, deviceCodeSecretBoxKey);
        }
    }, [deviceCode, deviceCodeSecretBoxKey]);

    return null;
};

export default DeviceParameterHandler;