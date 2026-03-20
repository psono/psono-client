import { Check } from "@mui/icons-material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import { Checkbox, Grid } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { makeStyles } from "@mui/styles";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import datastoreUserService from "../../services/datastore-user";
import groupsService from "../../services/groups";
import helper from "../../services/helper";
import CreateGroupDialog from "../../views/groups/create-group-dialog";
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
	tabPanel: {
		"& .MuiBox-root": {
			padding: "16px 0px",
		},
	},
	permissionPanel: {
		padding: "4px 0 8px 0",
		color: theme.palette.text.primary,
		marginBottom: "8px",
	},
	permissionTitle: {
		fontWeight: 400,
		marginBottom: "8px",
	},
	permissionItem: {
		display: "flex",
		alignItems: "center",
		padding: "0 4px",
	},
	expirationRow: {
		marginTop: "8px",
	},
}));

const DialogNewGroupShare = (props) => {
	const { open, onClose, onCreate, node } = props;
	const { t } = useTranslation();
	const disableUnmanagedGroups = useSelector(
		(state) => state.server.complianceDisableUnmanagedGroups,
	);
	const classes = useStyles();
	const [read, setRead] = useState(true);
	const [write, setWrite] = useState(false);
	const [grant, setGrant] = useState(false);
	const [groups, setGroups] = useState([]);
	const [newGroupOpen, setNewGroupOpen] = useState(false);
	const [groupColumnData, setGroupColumnData] = useState([]);
	const [selectedGroups, setSelectedGroups] = useState([]);
	const [validTill, setValidTill] = useState(null);

	let isSubscribed = true;
	React.useEffect(() => {
		loadGroups();
		return () => (isSubscribed = false);
	}, []);

	const loadGroups = () => {
		groupsService.readGroups(true).then((newGroups) => {
			if (!isSubscribed) {
				return;
			}
			helper.removeFromArray(newGroups, "", (a, b) => !a.share_admin);
			setGroups(newGroups);
			setGroupColumnData(
				newGroups.map((group) => [group.group_id, group.name]),
			);
		});
	};

	const toggleSelect = (entityId, type) => {
		let searchArray;
		searchArray = helper.duplicateObject(selectedGroups);

		var array_index = searchArray.indexOf(entityId);
		if (array_index > -1) {
			//its selected, lets deselect it
			searchArray.splice(array_index, 1);
		} else {
			searchArray.push(entityId);
		}
		setSelectedGroups(searchArray);
	};

	const onCloseCreateGroupModal = () => {
		setNewGroupOpen(false);
		loadGroups();
	};
	const onCreateGroup = () => {
		setNewGroupOpen(true);
	};

	const groupColumns = [
		{ name: t("ID"), options: { display: false } },
		{
			name: t("GROUP"),
			options: {
				filter: true,
				sort: true,
				empty: false,
				customBodyRender: (value, tableMeta, updateValue) => {
					return (
						<React.Fragment>
							{tableMeta.rowData[1].length > 58
								? tableMeta.rowData[1].substring(0, 58) + "...)"
								: tableMeta.rowData[1]}
						</React.Fragment>
					);
				},
			},
		},
		{
			name: t("INVITE"),
			options: {
				filter: true,
				sort: true,
				empty: false,
				customHeadLabelRender: () => null,
				customBodyRender: (value, tableMeta, updateValue) => {
					return (
						<IconButton
							onClick={() => toggleSelect(tableMeta.rowData[0], "group")}
							size="large"
						>
							{selectedGroups.indexOf(tableMeta.rowData[0]) > -1 ? (
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

	const options = {
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
			<form
				onSubmit={(e) => {
					e.preventDefault();
				}}
				name="createShare"
				autoComplete="off"
			>
				<DialogTitle id="alert-dialog-title">
					{t("SHARE")} {node.name}
				</DialogTitle>
				<DialogContent>
					<Grid container>
						<Grid item xs={12} sm={12} md={12}>
							<Paper elevation={0} className={classes.permissionPanel}>
								<Typography
									variant="subtitle2"
									className={classes.permissionTitle}
								>
									{t("PERMISSIONS")}
								</Typography>
								<Grid container spacing={1}>
									<Grid item xs={12} sm={4} md={4}>
										<div className={classes.permissionItem}>
											<Checkbox
												tabIndex={1}
												checked={read}
												onChange={(event) => {
													setRead(event.target.checked);
												}}
												checkedIcon={<Check className={classes.checkedIcon} />}
												icon={<Check className={classes.uncheckedIcon} />}
												classes={{ checked: classes.checked }}
											/>
											{t("READ")}
										</div>
									</Grid>
									<Grid item xs={12} sm={4} md={4}>
										<div className={classes.permissionItem}>
											<Checkbox
												tabIndex={1}
												checked={write}
												onChange={(event) => {
													setWrite(event.target.checked);
												}}
												checkedIcon={<Check className={classes.checkedIcon} />}
												icon={<Check className={classes.uncheckedIcon} />}
												classes={{ checked: classes.checked }}
											/>
											{t("WRITE")}
										</div>
									</Grid>
									<Grid item xs={12} sm={4} md={4}>
										<div className={classes.permissionItem}>
											<Checkbox
												tabIndex={1}
												checked={grant}
												onChange={(event) => {
													setGrant(event.target.checked);
												}}
												checkedIcon={<Check className={classes.checkedIcon} />}
												icon={<Check className={classes.uncheckedIcon} />}
												classes={{ checked: classes.checked }}
											/>
											{t("ADMIN")}
										</div>
									</Grid>
									<Grid
										item
										xs={12}
										sm={12}
										md={12}
										className={classes.expirationRow}
									>
										<DateTimePicker
											ampm={false}
											disablePast
											minDateTime={new Date()}
											label={t("VALID_TILL")}
											value={validTill}
											onChange={(newValidTill) => {
												setValidTill(newValidTill);
											}}
											format={t("DATE_TIME_YYYY_MM_DD_HH_MM")}
											slotProps={{
												actionBar: { actions: ["clear", "accept"] },
												field: {
													clearable: true,
													onClear: () => setValidTill(null),
												},
												textField: {
													variant: "outlined",
													size: "small",
													margin: "dense",
													fullWidth: true,
													placeholder: t("NOT_EXPIRING"),
												},
											}}
										/>
									</Grid>
								</Grid>
							</Paper>
						</Grid>
						<Grid item xs={12} sm={12} md={12}>
							<Divider style={{ marginTop: "20px", marginBottom: "10px" }} />
							<Table
								data={groupColumnData}
								columns={groupColumns}
								options={options}
								onCreate={disableUnmanagedGroups ? undefined : onCreateGroup}
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
					<Button
						onClick={() => {
							onCreate(
								groups.filter(
									(group) => selectedGroups.indexOf(group.group_id) > -1,
								),
								read,
								write,
								grant,
								validTill ? validTill.toISOString() : null,
							);
						}}
						disabled={!read && !write && !grant}
						variant="contained"
						color="primary"
						type="submit"
					>
						{t("CREATE")}
					</Button>
				</DialogActions>
				{newGroupOpen && (
					<CreateGroupDialog
						{...props}
						open={newGroupOpen}
						onClose={onCloseCreateGroupModal}
					/>
				)}
			</form>
		</Dialog>
	);
};

DialogNewGroupShare.propTypes = {
	onClose: PropTypes.func.isRequired,
	onCreate: PropTypes.func.isRequired,
	open: PropTypes.bool.isRequired,
	node: PropTypes.object.isRequired,
};

export default DialogNewGroupShare;
