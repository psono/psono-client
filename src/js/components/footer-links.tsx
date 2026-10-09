import * as React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import accountService from "../services/account";
import browserClient from "../services/browser-client";
import DialogChangeAccount from "./dialogs/change-account";
import type {
	ClientConfiguration,
	ConfigurationLink,
} from "../../types/browser";

function FooterLinks() {
	const { t } = useTranslation();
	const [footerLinks, setFooterLinks] = React.useState<ConfigurationLink[]>([]);
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
			},
		);
	}, []);

	const onNewConfigLoaded = (configJson: ClientConfiguration) => {
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
			{showAccountSwitch && (
				<React.Fragment>
					<a
						href="#"
						onClick={(e) => {
							e.preventDefault();
							setChangeAccountOpen(true);
						}}
					>
						{t("CHANGE_ACCOUNT")}
					</a>
					&nbsp;&nbsp;
				</React.Fragment>
			)}
			{changeAccountOpen && (
				<DialogChangeAccount
					open={changeAccountOpen}
					onClose={() => setChangeAccountOpen(false)}
					allowNewAccounts={false}
				/>
			)}
		</React.Fragment>
	);
}

export default FooterLinks;
