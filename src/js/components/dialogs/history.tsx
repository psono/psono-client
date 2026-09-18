import VisibilityIcon from "@mui/icons-material/Visibility";
import { Grid } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { DialogProps } from "../../../types/dialogs";
import type { EntryItem } from "../../../types/entry-ui";
import type { TableColumn, TableOptions } from "../../../types/table";
import type { SecretContent } from "../../../types/vault";
import format from "../../services/date";
import helper from "../../services/helper";
import historyService from "../../services/history";
import Table from "../table";
import DialogEditEntry from "./edit-entry";

export interface DialogHistoryProps extends DialogProps {
	item: EntryItem & { secret_id: string; secret_key: string };
}

type HistoryRow = [
	id: string,
	date: string,
	username: string | undefined,
	timestamp: Date,
];

const DialogHistory = (props: DialogHistoryProps) => {
	const { open, onClose, item } = props;
	const { t } = useTranslation();
	const [historyItems, setHistoryItems] = useState<HistoryRow[]>([]);
	const [editEntryOpen, setEditEntryOpen] = useState(false);
	const [historyData, setHistoryData] = useState<SecretContent | undefined>({});
	const [readOnlyItem, setReadOnlyItem] = useState<EntryItem | null>(null);

	let isSubscribed = true;
	React.useEffect(() => {
		const clonedItem = helper.duplicateObject(item);
		clonedItem.share_rights = {
			read: true,
			write: false,
			grant: false,
			delete: false,
		};
		setReadOnlyItem(clonedItem);
		loadHistoryItems();
		return () => {
			isSubscribed = false;
		};
	}, []);

	const loadHistoryItems = () => {
		historyService.readSecretHistory(item.secret_id).then((history) => {
			if (!isSubscribed || !history) {
				return;
			}
			setHistoryItems(
				history.map((historyItem) => [
					historyItem.id,
					format(new Date(historyItem.create_date)),
					historyItem.username,
					new Date(historyItem.create_date),
				]),
			);
		});
	};

	const showHistoryItem = (historyItemId: string) => {
		historyService.readHistory(historyItemId, item.secret_key).then((data) => {
			setHistoryData(data);
			setEditEntryOpen(true);
		});
	};

	const columns: TableColumn<HistoryRow>[] = [
		{ name: t("ID"), options: { display: false } },
		{
			name: t("DATE"),
			options: {
				sortCompare: (order) => {
					return (obj1, obj2) => {
						return (
							(obj1.rowData[3].getTime() - obj2.rowData[3].getTime()) *
							(order === "asc" ? 1 : -1)
						);
					};
				},
			},
		},
		{ name: t("USER") },
		{
			name: t("SHOW"),
			options: {
				filter: false,
				sort: false,
				empty: false,
				customBodyRender: (value, tableMeta, updateValue) => {
					return (
						<IconButton
							onClick={() => {
								showHistoryItem(tableMeta.rowData[0]);
							}}
							size="large"
						>
							<VisibilityIcon />
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
		<Dialog
			fullWidth
			maxWidth={"sm"}
			open={open}
			onClose={() => {
				onClose();
			}}
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
		>
			<DialogTitle id="alert-dialog-title">{t("HISTORY")}</DialogTitle>
			<DialogContent>
				<Grid container>
					<Grid item xs={12} sm={12} md={12}>
						<Table<HistoryRow>
							data={historyItems}
							columns={columns}
							options={options}
						/>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions>
				<Button
					onClick={() => {
						onClose();
					}}
				>
					{t("CLOSE")}
				</Button>
			</DialogActions>
			{editEntryOpen && readOnlyItem && (
				<DialogEditEntry
					open={editEntryOpen}
					onClose={() => setEditEntryOpen(false)}
					item={readOnlyItem}
					data={historyData}
					hideLinkToEntry={true}
					hideShowHistory={true}
					hideMoreMenu={true}
					hideAttachments={true}
					setDirty={() => {}}
				/>
			)}
		</Dialog>
	);
};

export default DialogHistory;
