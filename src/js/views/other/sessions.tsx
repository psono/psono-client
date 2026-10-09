import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import { Grid } from "@mui/material";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import React from "react";
import { useTranslation } from "react-i18next";
import type {
	ManagementViewProps,
	SessionRow,
} from "../../../types/management-ui";
import type { TableColumn, TableOptions } from "../../../types/table";

import Table from "../../components/table";
import format from "../../services/date";
import user from "../../services/user";

const OtherSessionsView = (_props: ManagementViewProps) => {
	const { t } = useTranslation();
	const [sessions, setSessions] = React.useState<SessionRow[]>([]);

	React.useEffect(() => {
		loadSessions();
	}, []);

	const loadSessions = () => {
		user.getSessions().then(
			(data) => {
				setSessions(
					data!.map((key): SessionRow => {
						return [
							key.id,
							key.device_description,
							format(new Date(key.create_date)),
							key.current_session,
						];
					}),
				);
			},
			(error) => {
				console.log(error);
			},
		);
	};

	const onDelete = (rowData: SessionRow) => {
		const onSuccess = () => {
			loadSessions();
		};

		const onError = (error: unknown) => {
			console.log(error);
		};

		return user.deleteSession(rowData[0]).then(onSuccess, onError);
	};

	const columns: TableColumn<SessionRow>[] = [
		{ name: t("ID"), options: { display: false } },
		{ name: t("DEVICE") },
		{ name: t("CREATED") },
		{
			name: t("CURRENT_SESSION"),
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
							disabled={rowData[3]}
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
		<Grid container>
			<Grid item xs={12} sm={12} md={12}>
				<h2>{t("SESSIONS")}</h2>
				<p>{t("SESSIONS_DESCRIPTION")}</p>
				<Divider style={{ marginBottom: "20px" }} />
			</Grid>
			<Grid item xs={12} sm={12} md={12}>
				<Table data={sessions} columns={columns} options={options} />
			</Grid>
		</Grid>
	);
};

export default OtherSessionsView;
