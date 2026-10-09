import DeleteIcon from "@mui/icons-material/Delete";
import type {
	TableColumn,
	TableMeta,
	TableOptions,
} from "../../../types/table";
import type {
	AccountViewProps,
	ActiveLinkShareRow,
} from "../../../types/account-ui";
import type { LinkShare } from "../../../types/vault";
import EditIcon from "@mui/icons-material/Edit";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Toolbar from "@mui/material/Toolbar";
import { makeStyles } from "@mui/styles";
import React from "react";
import { useTranslation } from "react-i18next";
import Base from "../../components/base";
import BaseContent from "../../components/base-content";
import BaseTitle from "../../components/base-title";
import Table from "../../components/table";
import format from "../../services/date";
import linkShareService from "../../services/link-share";
import EditActiveLinksShareDialog from "./edit-active-links-share-dialog";

const useStyles = makeStyles((theme) => ({
	root: {
		padding: "15px",
	},
	toolbarRoot: {
		backgroundColor: theme.palette.baseTitleBackground.main,
		display: "flex",
	},
}));

const ActiveLinkShareView = (props: AccountViewProps) => {
	const classes = useStyles();
	const { t } = useTranslation();
	let isSubscribed = true;
	const [activeLinkShares, setActiveLinkShares] = React.useState<
		ActiveLinkShareRow[]
	>([]);
	const [editOpen, setEditOpen] = React.useState(false);
	const [editLinkShare, setEditLinkShare] = React.useState<Partial<LinkShare>>(
		{},
	);
	const [linkShares, setLinkShares] = React.useState<Record<string, LinkShare>>(
		{},
	);

	React.useEffect(() => {
		loadActiveLinkShares();
		// cancel subscription to useEffect
		return () => {
			isSubscribed = false;
		};
	}, []);

	const loadActiveLinkShares = () => {
		const onSuccess = (
			newActiveLinkShares: { link_shares: LinkShare[] } | void,
		) => {
			if (!isSubscribed) {
				return;
			}
			const newLinkShares: Record<string, LinkShare> = {};
			setActiveLinkShares(
				newActiveLinkShares!.link_shares.map(
					(linkShare): ActiveLinkShareRow => {
						newLinkShares[linkShare.id] = linkShare;
						return [
							linkShare.id,
							linkShare.public_title,
							linkShare.valid_till
								? format(new Date(linkShare.valid_till))
								: "",
							linkShare.allowed_reads,
						];
					},
				),
			);
			setLinkShares(newLinkShares);
		};
		const onError = (data: unknown) => {
			//pass
			console.log(data);
		};
		return linkShareService.readLinkShares().then(onSuccess, onError);
	};

	const onEditLinkShare = (tableMeta: TableMeta<ActiveLinkShareRow>) => {
		setEditLinkShare(linkShares[tableMeta.rowData[0]]);
		setEditOpen(true);
	};

	const onDeleteLinkShare = (tableMeta: TableMeta<ActiveLinkShareRow>) => {
		const onSuccess = () => loadActiveLinkShares();

		const onError = (error: unknown) => {
			console.log(error);
		};
		linkShareService
			.deleteLinkShare(tableMeta.rowData[0])
			.then(onSuccess, onError);
	};

	const onCloseEditModal = () => {
		const onSuccess = () => {
			setEditOpen(false);
		};

		const onError = (error: unknown) => {
			console.log(error);
		};

		return loadActiveLinkShares().then(onSuccess, onError);
	};

	const columns: TableColumn<ActiveLinkShareRow>[] = [
		{ name: t("ID"), options: { display: false } },
		{ name: t("PUBLIC_TITLE") },
		{ name: t("VALID_TILL") },
		{ name: t("ALLOWED_USAGE") },
		{
			name: t("EDIT"),
			options: {
				filter: true,
				sort: true,
				empty: false,
				customHeadLabelRender: () => null,
				customBodyRender: (value, tableMeta, updateValue) => {
					return (
						<IconButton
							onClick={() => {
								onEditLinkShare(tableMeta);
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
				customBodyRender: (value, tableMeta, updateValue) => {
					return (
						<IconButton
							onClick={() => {
								onDeleteLinkShare(tableMeta);
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
		<Base {...props}>
			<BaseTitle>{t("ACTIVE_LINK_SHARES")}</BaseTitle>
			<BaseContent>
				<Paper square>
					<AppBar elevation={0} position="static" color="default">
						<Toolbar className={classes.toolbarRoot}>
							{t("ACTIVE_LINK_SHARES")}
						</Toolbar>
					</AppBar>
					<div className={classes.root}>
						<Table
							data={activeLinkShares}
							columns={columns}
							options={options}
						/>
					</div>
				</Paper>
				{editOpen && (
					<EditActiveLinksShareDialog
						{...props}
						open={editOpen}
						onClose={onCloseEditModal}
						linkShare={editLinkShare as LinkShare}
					/>
				)}
			</BaseContent>
		</Base>
	);
};

export default ActiveLinkShareView;
