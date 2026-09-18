import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Grid } from "@mui/material";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import React from "react";
import { useTranslation } from "react-i18next";
import type {
	FileRepositoryRow,
	ManagementFileRepository,
	ManagementViewProps,
} from "../../../types/management-ui";
import type { TableColumn, TableOptions } from "../../../types/table";
import DialogVerify from "../../components/dialogs/verify";
import Table from "../../components/table";
import fileRepositoryService from "../../services/file-repository";
import CreateFileRepositoriesDialog from "./create-file-repositories-dialog";
import DeleteFileRepositoriesDialog from "./delete-file-repositories-dialog";
import EditFileRepositoriesDialog from "./edit-file-repositories-dialog";

const OtherFileRepositoriesView = (props: ManagementViewProps) => {
	const { t } = useTranslation();
	const [fileRepositories, setFileRepositories] = React.useState<
		ManagementFileRepository[]
	>([]);
	const [editFileRepositoryId, setEditFileRepositoryId] = React.useState<
		string | null
	>("");
	const [deleteFileRepositoryId, setDeleteFileRepositoryId] = React.useState<
		string | null
	>(null);
	const [createOpen, setCreateOpen] = React.useState(false);
	const [declineFileRepository, setDeclineFileRepository] = React.useState<
		ManagementFileRepository | null | undefined
	>(null);

	React.useEffect(() => {
		loadFileRepositories();
	}, []);

	const loadFileRepositories = () => {
		return fileRepositoryService.readFileRepositories().then(
			(data) => setFileRepositories(data!),
			(error: unknown) => {
				console.log(error);
			},
		);
	};

	const closeModal = () => {
		const onSuccess = () => {
			setCreateOpen(false);
			setEditFileRepositoryId(null);
			setDeleteFileRepositoryId(null);
		};

		const onError = (error: unknown) => {
			console.log(error);
		};

		return loadFileRepositories().then(onSuccess, onError);
	};

	const onDelete = (rowData: FileRepositoryRow) => {
		setDeleteFileRepositoryId(rowData[0]);
	};

	const onCreate = () => {
		setCreateOpen(true);
	};

	const onEdit = (rowData: FileRepositoryRow) => {
		setEditFileRepositoryId(rowData[0]);
	};

	const accept = (rowData: FileRepositoryRow) => {
		const fileRepository = fileRepositories.find(
			(fileRepository) => fileRepository.id === rowData[0],
		);

		const onSuccess = () => {
			loadFileRepositories();
		};

		const onError = () => {
			//pass
		};

		fileRepositoryService
			.accept(fileRepository!.file_repository_right_id!)
			.then(onSuccess, onError);
	};

	const decline = () => {
		const localDeclineFileRepository = declineFileRepository;
		setDeclineFileRepository(null);

		const onSuccess = () => {
			loadFileRepositories();
		};

		const onError = () => {
			//pass
		};

		fileRepositoryService
			.decline(localDeclineFileRepository!.file_repository_right_id!)
			.then(onSuccess, onError);
	};

	const columns: TableColumn<FileRepositoryRow>[] = [
		{ name: t("ID"), options: { display: false } },
		{ name: t("TITLE") },
		{ name: t("TYPE") },
		{
			name: t("ACTIVE"),
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
				sort: false,
				empty: false,
				display: false,
				customBodyRender: (_value, tableMeta) => {
					const rowData = tableMeta.rowData;
					return <span>{rowData[5] && <CheckIcon />}</span>;
				},
			},
		},
		{
			name: t("WRITE"),
			options: {
				filter: true,
				sort: false,
				empty: false,
				display: false,
				customBodyRender: (_value, tableMeta) => {
					const rowData = tableMeta.rowData;
					return <span>{rowData[5] && <CheckIcon />}</span>;
				},
			},
		},
		{
			name: t("GRANT"),
			options: {
				filter: true,
				sort: false,
				empty: false,
				display: false,
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
							// prevent edit for not accepted (4) and not readable (5) file repositories
							disabled={!rowData[4] || !rowData[5]}
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
							disabled={!rowData[4] || !rowData[6] || !rowData[7]}
							size="large"
						>
							<DeleteIcon />
						</IconButton>
					);
				},
			},
		},
		{
			name: t("ACTION"),
			options: {
				filter: true,
				sort: false,
				empty: false,
				customHeadLabelRender: () => null,
				customBodyRender: (_value, tableMeta) => {
					const rowData = tableMeta.rowData;
					if (!rowData[8]) {
						return;
					}
					if (rowData[4]) {
						return (
							<Button
								variant="outlined"
								onClick={() => {
									setDeclineFileRepository(
										fileRepositories.find(
											(fileRepository) => fileRepository.id === rowData[0],
										),
									);
								}}
							>
								{t("DECLINE")}
							</Button>
						);
					} else {
						return (
							<Button
								variant="outlined"
								onClick={() => {
									accept(rowData);
								}}
							>
								{t("ACCEPT")}
							</Button>
						);
					}
				},
			},
		},
	];

	const options: TableOptions = {
		filterType: "checkbox",
	};
	const data = fileRepositories.map((fileRepository): FileRepositoryRow => {
		return [
			fileRepository.id,
			fileRepository.title,
			fileRepository.type,
			fileRepository.active,
			fileRepository.accepted,
			fileRepository.read,
			fileRepository.write,
			fileRepository.grant,
			fileRepository.file_repository_right_id,
		];
	});

	return (
		<>
			<Grid container>
				<Grid item xs={12} sm={12} md={12}>
					<h2>{t("FILE_REPOSITORIES")}</h2>
					<p>{t("HERE_YOU_CAN_MANAGE_ALL_YOUR_FILE_REPOSITORIES")}</p>
					<Divider style={{ marginBottom: "20px" }} />
				</Grid>
				<Grid item xs={12} sm={12} md={12}>
					<Table
						data={data}
						columns={columns}
						options={options}
						onCreate={onCreate}
					/>
				</Grid>
				{!!editFileRepositoryId && (
					<EditFileRepositoriesDialog
						{...props}
						open={Boolean(editFileRepositoryId)}
						onClose={closeModal}
						fileRepositoryId={editFileRepositoryId}
					/>
				)}
				{!!deleteFileRepositoryId && (
					<DeleteFileRepositoriesDialog
						{...props}
						open={Boolean(deleteFileRepositoryId)}
						onClose={closeModal}
						fileRepositoryId={deleteFileRepositoryId}
					/>
				)}
				{createOpen && (
					<CreateFileRepositoriesDialog
						{...props}
						open={createOpen}
						onClose={closeModal}
					/>
				)}
				{!!declineFileRepository && (
					<DialogVerify
						title={"DELETE_FILE_REPOSITORY_RIGHT"}
						description={"DELETE_FILE_REPOSITORY_RIGHT_WARNING"}
						open={Boolean(declineFileRepository)}
						entries={[declineFileRepository.title]}
						affectedEntriesText={"AFFECTED_FILE_REPOSITORIES"}
						onClose={() => setDeclineFileRepository(null)}
						onConfirm={decline}
					/>
				)}
			</Grid>
		</>
	);
};

export default OtherFileRepositoriesView;
