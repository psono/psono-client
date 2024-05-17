import * as React from "react";
import { useTranslation } from "react-i18next";
import browserClient from "../services/browser-client";
import accountService from "../services/account";
import {useState} from "react";
import DialogChangeAccount from "./dialogs/change-account";

function FooterLinks(props) {
    const { t } = useTranslation();
    const [footerLinks, setFooterLinks] = React.useState([]);
    const [showAccountSwitch, setShowAccountSwitch] = useState(false);
    const [changeAccountOpen, setChangeAccountOpen] = React.useState(false);

    React.useEffect(() => {
        browserClient.getConfig().then(onNewConfigLoaded);
        accountService.listAccounts().then(
            (allAccountsList) => {
                if (allAccountsList.length > 1) {
                    setShowAccountSwitch(true);
                }
            },
            (errors) => {
                //pass
            }
        );
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
            {showAccountSwitch &&
                <React.Fragment>
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            setChangeAccountOpen(true)
                        }}
                    >
                        {t("CHANGE_ACCOUNT")}
                    </a>
                    &nbsp;&nbsp;
                </React.Fragment>}
            {changeAccountOpen && <DialogChangeAccount open={changeAccountOpen} onClose={() => setChangeAccountOpen(false)} allowNewAccounts={false} />}
        </React.Fragment>
    );
}

export default FooterLinks;
