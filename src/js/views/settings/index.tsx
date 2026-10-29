import AppBar from "@mui/material/AppBar";
import type { SettingsViewProps } from "../../../types/settings-ui";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";

import Base from "../../components/base";
import BaseContent from "../../components/base-content";
import BaseTitle from "../../components/base-title";
import TabPanel from "../../components/tab-panel";
import SettingsDomainSynonymsView from "./domain-synonyms";
import SettingsEntryTypesView from "./entry-types";
import SettingsGeneralView from "./general";
import SettingsGpgView from "./gpg";
import SettingsNotificationView from "./notification";
import SettingsPasswordGeneratorView from "./password-generator";
import SettingsOfflineCacheView from "./offline-cache";

const SettingsView = (props: SettingsViewProps) => {
	const { t } = useTranslation();
	const location = useLocation();
	const offlineMode = useSelector((state) => state.client.offlineMode === true);
	const [value, setValue] = React.useState(location.pathname);
	React.useEffect(() => setValue(location.pathname), [location.pathname]);

	return (
		<Base {...props}>
			<BaseTitle>{t("SETTINGS")}</BaseTitle>
			<BaseContent>
				<Paper square>
					<AppBar elevation={0} position="static" color="default">
						<Tabs
							variant="scrollable"
							scrollButtons="auto"
							value={value}
							aria-label="scrollable auto tabs example"
						>
							<Tab
								label={t("GENERATORS")}
								disabled={offlineMode}
								value="/settings/password-generator"
								component={Link}
								to={"/settings/password-generator"}
								onClick={() => setValue("/settings/password-generator")}
							/>
							<Tab
								label={t("ENTRY_TYPES")}
								disabled={offlineMode}
								value="/settings/entry-types"
								component={Link}
								to={"/settings/entry-types"}
								onClick={() => setValue("/settings/entry-types")}
							/>
							<Tab
								label={t("NOTIFICATIONS")}
								disabled={offlineMode}
								value="/settings/notification"
								component={Link}
								to={"/settings/notification"}
								onClick={() => setValue("/settings/notification")}
							/>
							<Tab
								label={t("GPG")}
								disabled={offlineMode}
								value="/settings/gpg"
								component={Link}
								to={"/settings/gpg"}
								onClick={() => setValue("/settings/gpg")}
							/>
							<Tab
								label={t("DOMAIN_SYNONYMS")}
								disabled={offlineMode}
								value="/settings/domain-synonyms"
								component={Link}
								to={"/settings/domain-synonyms"}
								onClick={() => setValue("/settings/domain-synonyms")}
							/>
							<Tab
								label={t("GENERAL")}
								disabled={offlineMode}
								value="/settings/general"
								component={Link}
								to={"/settings/general"}
								onClick={() => setValue("/settings/general")}
							/>
							<Tab
								label={t("OFFLINE_CACHE")}
								value="/settings/offline-cache"
								component={Link}
								to="/settings/offline-cache"
								onClick={() => setValue("/settings/offline-cache")}
							/>
						</Tabs>
					</AppBar>
					<TabPanel value={value} index={"/settings/password-generator"}>
						<SettingsPasswordGeneratorView {...props} />
					</TabPanel>
					<TabPanel value={value} index={"/settings/entry-types"}>
						<SettingsEntryTypesView {...props} />
					</TabPanel>
					<TabPanel value={value} index={"/settings/notification"}>
						<SettingsNotificationView {...props} />
					</TabPanel>
					<TabPanel value={value} index={"/settings/gpg"}>
						<SettingsGpgView {...props} />
					</TabPanel>
					<TabPanel value={value} index={"/settings/domain-synonyms"}>
						<SettingsDomainSynonymsView {...props} />
					</TabPanel>
					<TabPanel value={value} index={"/settings/general"}>
						<SettingsGeneralView {...props} />
					</TabPanel>
					<TabPanel value={value} index="/settings/offline-cache">
						<SettingsOfflineCacheView {...props} />
					</TabPanel>
				</Paper>
			</BaseContent>
		</Base>
	);
};

export default SettingsView;
