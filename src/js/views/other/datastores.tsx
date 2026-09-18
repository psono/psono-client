import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Grid } from "@mui/material";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import React from "react";
import { useTranslation } from "react-i18next";
import type {
	DatastoreRow,
	ManagementViewProps,
} from "../../../types/management-ui";
import type { TableColumn, TableOptions } from "../../../types/table";
import Table from "../../components/table";
import datastore from "../../services/datastore";
import CreateDatastoresDialog from "./create-datastores-dialog";
import DeleteDatastoresDialog from "./delete-datastores-dialog";
import EditDatastoresDialog from "./edit-datastores-dialog";

const OtherDatastoresView = (props: ManagementViewProps) => {
	const { t } = useTranslation();
	const [datastores, setDatastores] = React.useState<DatastoreRow[]>([]);
	const [editDatastoreId, setEditDatastoreId] = React.useState("");
	const [editDatastoreDescription, setEditDatastoreDescription] =
		React.useState("");
	const [editDatastoreIsDefault, setEditDatastoreIsDefault] =
		React.useState(false);
	const [deleteDatastoreId, setDeleteDatastoreId] = React.useState("");
	const [createOpen, setCreateOpen] = React.useState(false);
	const [editOpen, setEditOpen] = React.useState(false);
	const [deleteOpen, setDeleteOpen] = React.useState(false);

	React.useEffect(() => {
		loadDatastores();
	}, []);

	const loadDatastores = () => {
		return datastore.getDatastoreOverview(true).then(
			(overview) => {
				setDatastores(
					overview!.datastores
						.filter((datastore) => datastore["type"] === "password")
						.map((datastore): DatastoreRow => {
							return [
								datastore.id,
								datastore.description,
								datastore.is_default,
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

		return loadDatastores().then(onSuccess, onError);
	};

	const onDelete = (rowData: DatastoreRow) => {
		setDeleteDatastoreId(rowData[0]);
		setDeleteOpen(true);
	};

	const onCreate = () => {
		setCreateOpen(true);
	};

	const onEdit = (rowData: DatastoreRow) => {
		setEditDatastoreId(rowData[0]);
		setEditDatastoreDescription(rowData[1]);
		setEditDatastoreIsDefault(rowData[2]);
		setEditOpen(true);
	};

	const columns: TableColumn<DatastoreRow>[] = [
		{ name: t("ID"), options: { display: false } },
		{ name: t("DESCRIPTION") },
		{
			name: t("DEFAULT"),
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
							disabled={rowData[2]}
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
					<h2>{t("DATASTORES")}</h2>
					<p>{t("HERE_YOU_CAN_MANAGE_ALL_YOUR_PASSWORD_DATASTORES")}</p>
					<Divider style={{ marginBottom: "20px" }} />
				</Grid>
				<Grid item xs={12} sm={12} md={12}>
					<Table
						data={datastores}
						columns={columns}
						options={options}
						onCreate={onCreate}
					/>
				</Grid>
				{editOpen && (
					<EditDatastoresDialog
						{...props}
						open={editOpen}
						onClose={closeModal}
						datastoreId={editDatastoreId}
						description={editDatastoreDescription}
						isDefault={editDatastoreIsDefault}
					/>
				)}
				{deleteOpen && (
					<DeleteDatastoresDialog
						{...props}
						open={deleteOpen}
						onClose={closeModal}
						datastoreId={deleteDatastoreId}
					/>
				)}
				{createOpen && (
					<CreateDatastoresDialog
						{...props}
						open={createOpen}
						onClose={closeModal}
					/>
				)}
			</Grid>
		</>
	);
};

export default OtherDatastoresView;
