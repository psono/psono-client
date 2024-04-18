import React, {useState} from "react";
import PropTypes from "prop-types";

import browserClient from "../services/browser-client";


const ConfigLogo = (props) => {
    const { defaultLogo, configKey } = props;
    const [imageSrc, setImageSrc] = useState(defaultLogo);

    let isSubscribed = true;
    React.useEffect(() => {
        loadImageFromConfig();
        return () => (isSubscribed = false);
    }, []);

    const loadImageFromConfig = async () => {
        const newImage = await browserClient.getConfig(configKey);
        if (newImage) {
            setImageSrc(newImage);
        }
    };

    return (
        <img alt="Psono" src={imageSrc} height="100%"/>
    );
};

ConfigLogo.propTypes = {
    defaultLogo: PropTypes.string.isRequired,
    configKey: PropTypes.string.isRequired,
};

export default ConfigLogo;
