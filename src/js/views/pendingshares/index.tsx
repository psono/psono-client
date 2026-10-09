import CheckIcon from "@mui/icons-material/Check";
import type { TableColumn, TableOptions } from "../../../types/table";
import type {
	AccountViewProps,
	PendingShare,
	PendingShareRow,
} from "../../../types/account-ui";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Toolbar from "@mui/material/Toolbar";
import { makeStyles } from "@mui/styles";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Base from "../../components/base";
import BaseContent from "../../components/base-content";
import BaseTitle from "../../components/base-title";
import DialogAcceptShare from "../../components/dialogs/accept-share";
import Table from "../../components/table";
import format from "../../services/date";
import itemBlueprintService from "../../services/item-blueprint";
import shareService from "../../services/share";
import statusService from "../../services/status";

const useStyles = makeStyles((theme) => ({
	root: {
		padding: "15px",
	},
	toolbarRoot: {
		backgroundColor: theme.palette.baseTitleBackground.main,
		display: "flex",
	},
	button: {
		marginTop: "5px",
		marginBottom: "5px",
	},
}));

const PendingSharesView = (props: AccountViewProps) => {
	const classes = useStyles();
	const { t } = useTranslation();
	let isSubscribed = true;
	const [pendingRequests, setPendingRequests] = useState<PendingShareRow[]>([]);
	const [pendingRequestsDict, setPendingRequestsDict] = useState<
		Record<string, PendingShare>
	>({});
	const [acceptShareOpen, setAcceptShareOpen] = useState(false);
	const [acceptShareId, setAcceptShareId] = useState("");

	React.useEffect(() => {
		loadShares();
		// cancel subscription to useEffect
		return () => {
			isSubscribed = false;
		};
	}, []);

	const loadShares = () => {
		const onSuccess = (data: { shares: PendingShare[] } | undefined) => {
			if (!isSubscribed) {
				return;
			}
			const newPendingRequestsDict: Record<string, PendingShare> = {};
			setPendingRequests(
				data!.shares
					.filter((request) => request.share_right_accepted === null)
					.map((request): PendingShareRow => {
						newPendingRequestsDict[request.id] = request;
						let title = request.share_right_title;
						if (
							request.share_right_type &&
							!request.share_right_title.endsWith("'")
						) {
							let entry_type = t("FOLDER");
							if (request.share_right_type !== "folder") {
								const blueprint = itemBlueprintService
									.getEntryTypes()
									.find((entry) => entry.value === request.share_right_type);
								if (blueprint) {
									entry_type = t(blueprint.title);
								}
							}

							title = t("SHARE_TITLE_ITEM", {
								entry_type: entry_type,
								title: request.share_right_title,
							});
						}
						return [
							request.id,
							request.share_right_create_user_username,
							title,
							request.share_right_create_date
								? format(new Date(request.share_right_create_date))
								: null,
							request.share_right_read,
							request.share_right_write,
							request.share_right_grant,
							request.share_right_id,
						];
					}),
			);
			setPendingRequestsDict(newPendingRequestsDict);
		};
		const onError = (data: unknown) => {
			//pass
			console.log(data);
		};
		shareService.readShares().then(onSuccess, onError);
	};

	const accept = (rowData: PendingShareRow) => {
		setAcceptShareId(rowData[0]);
		setAcceptShareOpen(true);
	};

	const decline = (rowData: PendingShareRow) => {
		shareService.declineShareRight(rowData[7]).then(() => {
			statusService.getStatus(true);
			loadShares();
		});
	};

	const columns: TableColumn<PendingShareRow>[] = [
		{ name: t("ID"), options: { display: false } },
		{ name: t("USERNAME") },
		{ name: t("TITLE") },
		{ name: t("SHARED_ON"), options: { display: false } },
		{
			name: t("READ"),
			options: {
				filter: true,
				sort: true,
				empty: false,
				customBodyRender: (value, tableMeta, updateValue) => {
					return <span>{tableMeta.rowData[4] && <CheckIcon />}</span>;
				},
			},
		},
		{
			name: t("WRITE"),
			options: {
				filter: true,
				sort: true,
				empty: false,
				customBodyRender: (value, tableMeta, updateValue) => {
					return <span>{tableMeta.rowData[5] && <CheckIcon />}</span>;
				},
			},
		},
		{
			name: t("ADMIN"),
			options: {
				filter: true,
				sort: true,
				empty: false,
				customBodyRender: (value, tableMeta, updateValue) => {
					return <span>{tableMeta.rowData[6] && <CheckIcon />}</span>;
				},
			},
		},
		{
			name: t("ACCEPT"),
			options: {
				filter: true,
				sort: false,
				empty: false,
				customBodyRender: (value, tableMeta, updateValue) => {
					return (
						<Button
							className={classes.button}
							onClick={() => {
								accept(tableMeta.rowData);
							}}
						>
							{t("ACCEPT")}
						</Button>
					);
				},
			},
		},
		{
			name: t("DECLINE"),
			options: {
				filter: true,
				sort: false,
				empty: false,
				customBodyRender: (value, tableMeta, updateValue) => {
					return (
						<Button
							className={classes.button}
							onClick={() => {
								decline(tableMeta.rowData);
							}}
						>
							{t("DECLINE")}
						</Button>
					);
				},
			},
		},
	];

	const options: TableOptions = {
		filterType: "checkbox",
	};

	return (
		<Base {...props}>
			<BaseTitle>{t("PENDING_REQUESTS")}</BaseTitle>
			<BaseContent>
				<Paper square>
					<AppBar elevation={0} position="static" color="default">
						<Toolbar className={classes.toolbarRoot}>
							{t("PENDING_REQUESTS")}
						</Toolbar>
					</AppBar>
					<div className={classes.root}>
						<Table data={pendingRequests} columns={columns} options={options} />
					</div>
					{acceptShareOpen && (
						<DialogAcceptShare
							item={pendingRequestsDict[acceptShareId]}
							open={acceptShareOpen}
							onClose={() => {
								setAcceptShareOpen(false);
								loadShares();
							}}
						/>
					)}
				</Paper>
			</BaseContent>
		</Base>
	);
};

export default PendingSharesView;
