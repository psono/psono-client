import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";

import helper from "../services/helper";
import widgetService from "../services/widget";
import {getStore} from "../services/store";
import publicSuffixService from "../services/public-suffix";

// Cache for favicon URLs to prevent duplicate requests and mismatched icons
const faviconCache = new Map();

const EntryIcon = (props) => {
    const { entry, ...rest } = props;
    const [faviconUrl, setFaviconUrl] = useState(null);
    const [imageLoadError, setImageLoadError] = useState(false);
    const faviconServiceUrl = getStore().getState().server.faviconServiceUrl;

    const entryKey = useMemo(() => entry.secret_id || entry.file_id, [entry]);

    useEffect(() => {
        setImageLoadError(false);

        if (faviconCache.has(entryKey)) {
            setFaviconUrl(faviconCache.get(entryKey));
            return;
        }
        
        loadIcon();
    }, [entryKey, entry.urlfilter]);

    async function loadIcon() {
        let urlFilters = [];
        if (entry.urlfilter) {
            urlFilters = entry.urlfilter.split(/\s+|,|;/)
        }

        let chosenUrlFilter = '';
        if (urlFilters.length > 0 && faviconServiceUrl) {
            if (urlFilters[0].startsWith('*.')) {
                urlFilters[0] = urlFilters[0].substring(2);
            }
            if (faviconServiceUrl === 'https://favicon.psono.com/v1/icon/' && await publicSuffixService.isValidPublicDomain(urlFilters[0])) {
                chosenUrlFilter = urlFilters[0];
            } else if (faviconServiceUrl !== 'https://favicon.psono.com/v1/icon/' && helper.isValidHostname(urlFilters[0])) {
                chosenUrlFilter = urlFilters[0];
            }
        }

        const newFaviconUrl = chosenUrlFilter ? (faviconServiceUrl + chosenUrlFilter) : 'default';

        // Cache the result
        faviconCache.set(entryKey, newFaviconUrl);
        setFaviconUrl(newFaviconUrl);
    }

    const handleImageError = () => {
        setImageLoadError(true);
    };

    if (faviconUrl === null) {
        return null;
    } else if (faviconUrl === 'default' || imageLoadError) {
        return (
            <i className={"fa-fw " + widgetService.itemIcon(entry)} {...rest} />
        )
    } else {
        return (
            <span style={{display: "inline-block", verticalAlign: "middle"}}>
                <img 
                    alt={"Psono"}
                    src={faviconUrl} 
                    {...rest} 
                    className={"fa-fw"} 
                    style={{display: "block"}}
                    onError={handleImageError}
                />
            </span>
        );
    }
};

EntryIcon.propTypes = {
    entry: PropTypes.object.isRequired,
};

export default EntryIcon;
