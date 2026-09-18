import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import { Grid } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import { makeStyles } from "@mui/styles";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SharingUser } from "../../../types/sharing-ui";
import type { TableColumn, TableOptions } from "../../../types/table";

import datastoreUserService from "../../services/datastore-user";
import helperService from "../../services/helper";
import Table from "../table";
import DialogNewUser from "./new-user";

const useStyles = makeStyles((theme) => ({
	textField: {
		width: "100%",
	},
	checked: {
		color: theme.palette.checked.main,
	},
	checkedIcon: {
		width: "20px",
		height: "20px",
		border: `1px solid ${theme.palette.greyText.main}`,
		borderRadius: "3px",
	},
	uncheckedIcon: {
		width: "0px",
		height: "0px",
		padding: "9px",
		border: `1px solid ${theme.palette.greyText.main}`,
		borderRadius: "3px",
	},
	tree: {
		marginTop: "8px",
		marginBottom: "8px",
	},
}));

export interface DialogSelectUserProps {
	open: boolean;
	onClose: (userIds: string[]) => void;
}

const DialogSelectUser = (props: DialogSelectUserProps) => {
	const { open, onClose } = props;
	const { t } = useTranslation();
	const classes = useStyles();

	const [users, setUsers] = useState<SharingUser[]>([]);
	const [newUserOpen, setNewUserOpen] = useState(false);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

	let isSubscribed = true;
	React.useEffect(() => {
		loadUsers();
		// cancel subscription to useEffect
		return () => {
			isSubscribed = false;
		};
	}, []);

	const loadUsers = () => {
		datastoreUserService.getUserDatastore().then((userDatastore) => {
			if (!isSubscribed) {
				return;
			}
			const newUsers: SharingUser[] = [];
			helperService.createList(userDatastore!, newUsers);
			setUsers(newUsers);
		});
	};

	const onNewUserCreate = (userObject: SharingUser) => {
		// called once someone clicked the CREATE button in the dialog closes with the infos about the user
		setNewUserOpen(false);

		datastoreUserService.getUserDatastore().then((datastore) => {
			datastoreUserService.addUserToDatastore(datastore!, userObject)!.then(
				() => {
					loadUsers();
				},
				(error) => {
					console.log(error);
				},
			);
		});
	};

	const onSearchUser = () => {
		setNewUserOpen(true);
	};

	const toggleUser = (userId: string) => {
		if (selectedUsers.includes(userId)) {
			setSelectedUsers(
				selectedUsers.filter((selectedUserId) => selectedUserId !== userId),
			);
		} else {
			setSelectedUsers([...selectedUsers, userId]);
		}
	};

	const columns: TableColumn<[string, string]>[] = [
		{ name: t("ID"), options: { display: false } },
		{ name: t("USER") },
		{
			name: t("SELECTED"),
			options: {
				filter: false,
				sort: true,
				empty: false,
				customHeadLabelRender: () => null,
				customBodyRender: (value, tableMeta, updateValue) => {
					return (
						<IconButton
							onClick={() => toggleUser(tableMeta.rowData[0])}
							size="large"
						>
							{selectedUsers.includes(tableMeta.rowData[0]) ? (
								<CheckBoxIcon />
							) : (
								<CheckBoxOutlineBlankIcon />
							)}
						</IconButton>
					);
				},
			},
		},
	];

	const userColumnData = users.map<[string, string]>((user) => {
		return [user.data.user_id, user.name];
	});

	const options: TableOptions = {
		filterType: "checkbox",
	};

	return (
		<Dialog
			fullWidth
			maxWidth={"sm"}
			open={open}
			onClose={() => {
				onClose([]);
			}}
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
		>
			<DialogTitle id="alert-dialog-title">{t("USER_SELECTION")}</DialogTitle>
			<DialogContent>
				<Grid container>
					<Grid item xs={12} sm={12} md={12} className={classes.tree}>
						<Table
							data={userColumnData}
							columns={columns}
							options={options}
							onCreate={onSearchUser}
						/>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions>
				<Button
					onClick={() => {
						onClose([]);
					}}
				>
					{t("CLOSE")}
				</Button>
				<Button
					onClick={() => {
						onClose(selectedUsers);
					}}
					variant="contained"
					color="primary"
					disabled={selectedUsers.length === 0}
				>
					{t("SAVE")}
				</Button>
			</DialogActions>
			{newUserOpen && (
				<DialogNewUser
					open={newUserOpen}
					onClose={() => setNewUserOpen(false)}
					onCreate={onNewUserCreate}
				/>
			)}
		</Dialog>
	);
};

export default DialogSelectUser;
