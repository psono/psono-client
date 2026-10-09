import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import { Grid } from "@mui/material";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import React from "react";
import { useTranslation } from "react-i18next";
import type {
	KnownHostRow,
	ManagementViewProps,
} from "../../../types/management-ui";
import type { TableColumn, TableOptions } from "../../../types/table";

import Table from "../../components/table";
import host from "../../services/host";

const OtherKnownHostsView = (_props: ManagementViewProps) => {
	const { t } = useTranslation();
	const [knownHosts, setKnownHosts] = React.useState<KnownHostRow[]>([]);

	React.useEffect(() => {
		loadKnownHosts();
	}, []);

	const loadKnownHosts = () => {
		const knownHosts = host.getKnownHosts();
		const currentHostUrl = host.getCurrentHostUrl();
		setKnownHosts(
			knownHosts.map((knownHost): KnownHostRow => {
				return [
					knownHost.verify_key,
					knownHost.url,
					knownHost.verify_key.length <= 15
						? knownHost.verify_key
						: knownHost.verify_key.substring(0, 20) + "...",
					currentHostUrl === knownHost.url,
				];
			}),
		);
	};

	const onDelete = (rowData: KnownHostRow) => {
		host.deleteKnownHost(rowData[0]);
		loadKnownHosts();
	};

	const columns: TableColumn<KnownHostRow>[] = [
		{ name: t("ID"), options: { display: false } },
		{ name: t("HOST") },
		{ name: t("FINGERPRINT") },
		{
			name: t("CURRENT_HOST"),
			options: {
				filter: true,
				sort: true,
				empty: false,
				customBodyRender: (_value, tableMeta) => {
					const rowData = tableMeta.rowData;
					return <span>{rowData[3] && <CheckIcon />}</span>;
				},
			},
		},
		{
			name: t("DELETE"),
			options: {
				filter: true,
				sort: false,
				empty: false,
				customHeadLabelRender: () => null,
				customBodyRender: (_value, tableMeta) => {
					const rowData = tableMeta.rowData;
					return (
						<IconButton
							onClick={() => {
								onDelete(rowData);
							}}
							size="large"
						>
							<DeleteIcon />
						</IconButton>
					);
				},
			},
		},
	];

	const options: TableOptions = {
		filterType: "checkbox",
	};

	return (
		<>
			<Grid container>
				<Grid item xs={12} sm={12} md={12}>
					<h2>{t("KNOWN_HOSTS")}</h2>
					<p>{t("KNOWN_HOSTS_DESCRIPTION")}</p>
					<Divider style={{ marginBottom: "20px" }} />
				</Grid>
				<Grid item xs={12} sm={12} md={12}>
					<Table data={knownHosts} columns={columns} options={options} />
				</Grid>
			</Grid>
		</>
	);
};

export default OtherKnownHostsView;
