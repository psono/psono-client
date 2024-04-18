import React, {Fragment, useState} from "react";
import PropTypes from "prop-types";

import DOMPurify from "dompurify";
import browserClient from "../services/browser-client";


const ConfigLogo = (props) => {
    const { defaultLogo, configKey } = props;
    const [imageSrc, setImageSrc] = useState('');

    let isSubscribed = true;
    React.useEffect(() => {
        loadImageFromConfig();
        return () => (isSubscribed = false);
    }, []);

    const loadImageFromConfig = async () => {
        const newImage = await browserClient.getConfig(configKey);
        if (newImage) {
            setImageSrc(DOMPurify.sanitize('<img alt="Psono" src="' + newImage + '" height="100%"/>', {ALLOWED_TAGS: ['img']}));
        }
    };

    if (imageSrc) {
        return <div dangerouslySetInnerHTML={{__html: imageSrc}}/>
    }

    return (
        <div>
            <img alt="Psono" src={defaultLogo} height="100%"/>
            <a href="https://psono.com/" target="_blank" rel="noopener" className="infolabel">
                <i className="fa fa-info-circle" aria-hidden="true" />
            </a>
        </div>
    );
};

ConfigLogo.propTypes = {
    defaultLogo: PropTypes.string.isRequired,
    configKey: PropTypes.string.isRequired,
};

export default ConfigLogo;
