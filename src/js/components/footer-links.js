import * as React from "react";
import { useTranslation } from "react-i18next";
import browserClient from "../services/browser-client";

function FooterLinks(props) {
    const { t } = useTranslation();
    const [footerLinks, setFooterLinks] = React.useState([]);

    React.useEffect(() => {
        browserClient.getConfig().then(onNewConfigLoaded);
    }, []);

    const onNewConfigLoaded = (configJson) => {
        setFooterLinks(configJson.footer_links);
    };

    return (
        <React.Fragment>
            {footerLinks.map((link, index) => (
                <React.Fragment key={index}>
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            browserClient.openTab(link.href);
                        }}
                    >
                        {t(link.title)}
                    </a>
                    &nbsp;&nbsp;
                </React.Fragment>
            ))}
        </React.Fragment>
    );
}

export default FooterLinks;
