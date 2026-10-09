import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Grid } from "@mui/material";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import React from "react";
import { useTranslation } from "react-i18next";
import type {
	ApiKeyOverview,
	ApiKeyRow,
	ManagementViewProps,
} from "../../../types/management-ui";
import type { TableColumn, TableOptions } from "../../../types/table";
import Table from "../../components/table";
import apiKey from "../../services/api-keys";
import CreateApiKeysDialog from "./create-api-keys-dialog";
import DeleteApiKeysDialog from "./delete-api-keys-dialog";
import EditApiKeysDialog from "./edit-api-keys-dialog";

const OtherApiKeysView = (props: ManagementViewProps) => {
	const { t } = useTranslation();
	const [apiKeys, setApiKeys] = React.useState<ApiKeyRow[]>([]);
	const [editApiKeyId, setEditApiKeyId] = React.useState("");
	const [deleteApiKeyId, setDeleteApiKeyId] = React.useState("");
	const [createOpen, setCreateOpen] = React.useState(false);
	const [editOpen, setEditOpen] = React.useState(false);
	const [deleteOpen, setDeleteOpen] = React.useState(false);

	let isSubscribed = true;
	React.useEffect(() => {
		loadApiKeys();
		return () => {
			isSubscribed = false;
		};
	}, []);

	const loadApiKeys = () => {
		return apiKey.readApiKeys().then(
			(response) => {
				// The list endpoint returns an envelope; the shared service type needs updating.
				const data = response as unknown as ApiKeyOverview;
				if (!isSubscribed) {
					return false;
				}
				setApiKeys(
					data.api_keys.map((apiKey): ApiKeyRow => {
						return [
							apiKey.id,
							apiKey.title,
							apiKey.restrict_to_secrets,
							apiKey.allow_insecure_access,
							apiKey.read,
							apiKey.write,
							apiKey.active,
						];
					}),
				);
			},
			(error) => {
				console.log(error);
			},
		);
	};

	const closeModal = () => {
		const onSuccess = () => {
			setEditOpen(false);
			setDeleteOpen(false);
			setCreateOpen(false);
		};

		const onError = (error: unknown) => {
			console.log(error);
		};

		return loadApiKeys().then(onSuccess, onError);
	};

	const onDelete = (rowData: ApiKeyRow) => {
		setDeleteApiKeyId(rowData[0]);
		setDeleteOpen(true);
	};

	const onCreate = () => {
		setCreateOpen(true);
	};

	const onEdit = (rowData: ApiKeyRow) => {
		setEditApiKeyId(rowData[0]);
		setEditOpen(true);
	};

	const columns: TableColumn<ApiKeyRow>[] = [
		{ name: t("ID"), options: { display: false } },
		{ name: t("TITLE") },
		{
			name: t("SECRETS_ONLY"),
			options: {
				filter: true,
				sort: true,
				empty: false,
				customBodyRender: (_value, tableMeta) => {
					const rowData = tableMeta.rowData;
					return <span>{rowData[2] && <CheckIcon />}</span>;
				},
			},
		},
		{
			name: t("INSECURE"),
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
			name: t("READ"),
			options: {
				filter: true,
				sort: true,
				empty: false,
				customBodyRender: (_value, tableMeta) => {
					const rowData = tableMeta.rowData;
					return <span>{rowData[4] && <CheckIcon />}</span>;
				},
			},
		},
		{
			name: t("WRITE"),
			options: {
				filter: true,
				sort: true,
				empty: false,
				customBodyRender: (_value, tableMeta) => {
					const rowData = tableMeta.rowData;
					return <span>{rowData[5] && <CheckIcon />}</span>;
				},
			},
		},
		{
			name: t("ACTIVE"),
			options: {
				filter: true,
				sort: true,
				empty: false,
				customBodyRender: (_value, tableMeta) => {
					const rowData = tableMeta.rowData;
					return <span>{rowData[6] && <CheckIcon />}</span>;
				},
			},
		},
		{
			name: t("EDIT"),
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
								onEdit(rowData);
							}}
							size="large"
						>
							<EditIcon />
						</IconButton>
					);
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
					<h2>{t("API_KEYS")}</h2>
					<p>{t("HERE_YOU_CAN_MANAGE_ALL_YOUR_API_KEYS")}</p>
					<Divider style={{ marginBottom: "20px" }} />
				</Grid>
				<Grid item xs={12} sm={12} md={12}>
					<Table
						data={apiKeys}
						columns={columns}
						options={options}
						onCreate={onCreate}
					/>
				</Grid>
				{editOpen && (
					<EditApiKeysDialog
						{...props}
						open={editOpen}
						onClose={closeModal}
						apiKeyId={editApiKeyId}
					/>
				)}
				{deleteOpen && (
					<DeleteApiKeysDialog
						{...props}
						open={deleteOpen}
						onClose={closeModal}
						apiKeyId={deleteApiKeyId}
					/>
				)}
				{createOpen && (
					<CreateApiKeysDialog
						{...props}
						open={createOpen}
						onClose={closeModal}
					/>
				)}
			</Grid>
		</>
	);
};

export default OtherApiKeysView;
