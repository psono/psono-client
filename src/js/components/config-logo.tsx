import PropTypes from "prop-types";
import React, { useState } from "react";

import browserClient from "../services/browser-client";

export interface ConfigLogoProps
	extends React.ImgHTMLAttributes<HTMLImageElement> {
	defaultLogo: string;
	configKey: string;
}

const ConfigLogo = (props: ConfigLogoProps) => {
	const { defaultLogo, configKey, ...rest } = props;
	const [imageSrc, setImageSrc] = useState(defaultLogo);

	let isSubscribed = true;
	React.useEffect(() => {
		loadImageFromConfig();
		return () => {
			isSubscribed = false;
		};
	}, []);

	const loadImageFromConfig = async () => {
		const newImage = await browserClient.getConfig(configKey);
		if (newImage) {
			// Branding configuration supplies image URLs for these keys.
			setImageSrc(newImage as string);
		}
	};
	return <img alt="Psono" src={imageSrc} {...rest} />;
};

ConfigLogo.propTypes = {
	defaultLogo: PropTypes.string.isRequired,
	configKey: PropTypes.string.isRequired,
};

export default ConfigLogo;
