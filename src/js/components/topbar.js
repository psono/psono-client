import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AddIcon from "@mui/icons-material/Add";
import AirplanemodeActiveIcon from "@mui/icons-material/AirplanemodeActive";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";
import StorageIcon from "@mui/icons-material/Storage";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import TuneIcon from "@mui/icons-material/Tune";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Hidden from "@mui/material/Hidden";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { makeStyles } from "@mui/styles";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import action from "../actions/bound-action-creators";
import avatarService from "../services/avatar";
import datastoreService from "../services/datastore";
import offlineCache from "../services/offline-cache";
import { getStore } from "../services/store";
import CreateDatastoresDialog from "../views/other/create-datastores-dialog";
import ConfigLogo from "./config-logo";
import DialogChangeAccount from "./dialogs/change-account";
import DialogGoOffline from "./dialogs/go-offline";
import FrameControls from "./frame-controls";

const useStyles = makeStyles((theme) => ({
	appBar: {
		zIndex: theme.zIndex.drawer + 1,
		[theme.breakpoints.up("sm")]: {
			width: `calc(100% - 0px)`,
			marginLeft: 0,
		},
		backgroundColor: theme.palette.appBarBackground.main,
		color: theme.palette.appBarText.main,
		borderColor: theme.palette.appBarBackground.main,
		borderStyle: "solid",
		borderWidth: "1px",
		boxShadow: "none",
	},
	appBarReadOnly: {
		zIndex: theme.zIndex.drawer + 1,
		[theme.breakpoints.up("sm")]: {
			width: `calc(100% - 0px)`,
			marginLeft: 0,
		},
		backgroundColor: theme.palette.appBarReadOnlyBackground.main,
		color: theme.palette.appBarReadOnlyText.main,
		borderColor: theme.palette.appBarReadOnlyBackground.main,
		borderStyle: "solid",
		borderWidth: "1px",
		boxShadow: "none",
	},
	topLogo: {
		padding: "10px",
		height: "100%",
	},
	menuButton: {
		marginRight: theme.spacing(2),
		[theme.breakpoints.up("sm")]: {
			display: "none",
		},
	},
	listItemIcon: {
		minWidth: theme.spacing(4),
	},
	icon: {
		fontSize: "18px",
	},
	topMenuButton: {
		textTransform: "none",
		padding: "8px",
	},
	signInText: {
		marginRight: "10px",
		display: "inline",
	},
	avatar: {
		width: 25,
		height: 25,
		marginLeft: "6px",
		marginRight: "6px",
	},
	avatarPlaceholder: {
		width: 25,
		height: 25,
		backgroundColor: "#999",
		paddingTop: "6px",
		marginLeft: "6px",
		marginRight: "6px",
		color: "white",
		"& > *:first-child": {
			fontSize: "28px",
		},
	},
	overlayIcon: {
		position: "absolute",
		width: "0.6em",
		height: "0.6em",
		bottom: 4,
		right: 4,
		backgroundColor: theme.palette.background.paper,
		borderRadius: "50%",
		color: theme.palette.secondary.main,
		border: `1px solid ${theme.palette.background.paper}`,
	},
	overlayedIcon: {
		width: 25,
		height: 25,
		backgroundColor: "#999",
		marginLeft: "0px",
		marginRight: "0px",
		color: "white",
	},
	toolbar: {
		display: "flex",
		alignItems: "center", // Align items vertically in the middle
		justifyContent: "space-between", // This might be adjusted based on your design
	},
	signInTextContainer: {
		display: "flex",
		alignItems: "center", // Align text and button vertically
		marginRight: theme.spacing(2), // Adds some spacing between this text and whatever comes next
	},
}));

const Topbar = (props) => {
	const { mobileOpen, setMobileOpen } = props;
	const { t } = useTranslation();
	const classes = useStyles();
	const [anchorTopMenuEl, setAnchorTopMenuEl] = React.useState(null);
	const [anchorDatastoreMenuEl, setAnchorDatastoreMenuEl] =
		React.useState(null);
	const [goOfflineOpen, setGoOfflineOpen] = React.useState(false);
	const [changeAccountOpen, setChangeAccountOpen] = React.useState(false);
	const [createDatastoreOpen, setCreateDatastoreOpen] = React.useState(false);
	const [datastores, setDatastores] = React.useState([]);
	const [profilePic, setProfilePic] = useState("");
	const settingsDatastore = useSelector((state) => state.settingsDatastore);

	const passwordDatastore = useSelector((state) =>
		state.user.userDatastoreOverview?.datastores?.find(
			(datastore) => datastore.type === "password" && datastore.is_default,
		),
	);

	const setClientOptions = (nosavemode) => {
		action().setClientOptionsConfig(
			settingsDatastore.clipboardClearDelay,
			nosavemode,
			settingsDatastore.showNoSaveToggle,
			settingsDatastore.confirmOnUnsavedChanges,
		);
	};
	let isSubscribed = true;
	React.useEffect(() => {
		reloadDatastoreOverview();
		loadAvatar();
		return () => (isSubscribed = false);
	}, []);

	const loadAvatar = async () => {
		setProfilePic((await avatarService.readAvatarCached()) || "");
	};

	const reloadDatastoreOverview = () => {
		datastoreService.getDatastoreOverview().then((overview) => {
			if (!isSubscribed) {
				return;
			}
			const newDatastores = [];
			for (let i = 0; i < overview.datastores.length; i++) {
				if (overview.datastores[i]["type"] === "password") {
					newDatastores.push(overview.datastores[i]);
				}
			}
			setDatastores(newDatastores);
		});
	};

	const handleDrawerToggle = () => {
		setMobileOpen(!mobileOpen);
	};

	const openChangeAccount = (event) => {
		setChangeAccountOpen(true);
	};

	const openTopMenu = (event) => {
		setAnchorTopMenuEl(event.currentTarget);
	};
	const closeTopMenu = () => {
		setAnchorTopMenuEl(null);
	};

	const openDatastoreMenu = (event) => {
		setAnchorDatastoreMenuEl(event.currentTarget);
	};
	const closeDatastoreMenu = () => {
		setAnchorDatastoreMenuEl(null);
	};

	const onCreateDatastore = (rowData) => {
		setCreateDatastoreOpen(true);
		closeDatastoreMenu();
	};

	const toggleNoSaveMode = (checked) => {
		setClientOptions(checked);
	};

	const onDatastoreSwitchClick = (datastore) => {
		closeDatastoreMenu();
		datastoreService
			.saveDatastoreMeta(datastore.id, datastore.description, true)
			.then((result) => {
				reloadDatastoreOverview();
			});
	};

	const goOffline = () => {
		setGoOfflineOpen(true);
	};
	const goOnline = () => {
		offlineCache.disable();
		offlineCache.clear();
	};
	const logout = async () => {
		window.location.href = "logout-success.html";
	};

	return (
		<AppBar
			position="fixed"
			className={
				settingsDatastore.noSaveMode ? classes.appBarReadOnly : classes.appBar
			}
		>
			<FrameControls />
			<Container maxWidth="lg">
				<Toolbar disableGutters={true} className={classes.toolbar}>
					<IconButton
						color="inherit"
						aria-label="open drawer"
						edge="start"
						onClick={handleDrawerToggle}
						className={classes.menuButton}
						size="large"
					>
						<MenuIcon />
					</IconButton>
					<a className={classes.topLogo} href="index.html">
						<ConfigLogo
							configKey={"logo_inverse"}
							defaultLogo={"img/logo-inverse.png"}
							height="100%"
						/>
					</a>
					<div style={{ width: "100%" }}>
						{datastores && datastores.length > 1 && (
							<div style={{ float: "left" }}>
								<Hidden smUp>
									<IconButton
										variant="contained"
										onClick={openDatastoreMenu}
										color="primary"
										className={classes.topMenuButton}
										size="large"
									>
										<StorageIcon />
									</IconButton>
								</Hidden>
								<Hidden smDown>
									<Button
										variant="contained"
										aria-controls="datastore-menu"
										aria-haspopup="true"
										onClick={openDatastoreMenu}
										color="primary"
										disableElevation
										className={classes.topMenuButton}
										endIcon={<ExpandMoreIcon />}
									>
										{passwordDatastore
											? passwordDatastore.description
											: t("DATASTORE")}
									</Button>
								</Hidden>
								<Menu
									id="datastore-menu"
									anchorEl={anchorDatastoreMenuEl}
									keepMounted
									open={Boolean(anchorDatastoreMenuEl)}
									onClose={closeDatastoreMenu}
									anchorOrigin={{
										vertical: "top",
										horizontal: "right",
									}}
									transformOrigin={{
										vertical: "bottom",
										horizontal: "right",
									}}
								>
									{datastores.map((datastore, index) => {
										return (
											<MenuItem
												onClick={() => {
													onDatastoreSwitchClick(datastore);
												}}
												key={index}
											>
												<ListItemIcon className={classes.listItemIcon}>
													{datastore.is_default ? (
														<CheckBoxIcon className={classes.icon} />
													) : (
														<CheckBoxOutlineBlankIcon
															className={classes.icon}
														/>
													)}
												</ListItemIcon>
												<Typography variant="body2">
													{datastore.description}
												</Typography>
											</MenuItem>
										);
									})}
									{!offlineCache.isActive() && [
										<Divider key={"divider"} />,
										<MenuItem
											onClick={onCreateDatastore}
											key={"create-datastore"}
										>
											<ListItemIcon className={classes.listItemIcon}>
												<AddIcon className={classes.icon} />
											</ListItemIcon>
											<Typography variant="body2">
												{t("CREATE_NEW_DATASTORE")}
											</Typography>
										</MenuItem>,
									]}
								</Menu>
							</div>
						)}
						<div style={{ float: "right" }}>
							<Hidden mdUp>
								<ButtonGroup
									variant="contained"
									color="primary"
									disableElevation
									aria-label="main menu"
								>
									{(settingsDatastore.showNoSaveToggle ||
										settingsDatastore.noSaveMode) && (
										<Tooltip title={t("NO_SAVE_MODE")}>
											<Switch
												checked={settingsDatastore.noSaveMode}
												onChange={(event) => {
													toggleNoSaveMode(event.target.checked);
												}}
												//inputProps={{ 'aria-label': 'controlled' }}
												disabled={!settingsDatastore.showNoSaveToggle}
											/>
										</Tooltip>
									)}
									<IconButton
										variant="contained"
										onClick={openTopMenu}
										color="primary"
										className={classes.topMenuButton}
										size="large"
									>
										{profilePic ? (
											<Avatar
												alt="Profile Picture"
												src={profilePic}
												className={classes.avatar}
											/>
										) : (
											<Avatar className={classes.avatarPlaceholder}>
												<i className="fa fa-user" aria-hidden="true"></i>
											</Avatar>
										)}
									</IconButton>
									<IconButton
										variant="contained"
										onClick={openChangeAccount}
										color="primary"
										className={classes.topMenuButton}
										size="large"
									>
										<Badge
											overlap="circular"
											anchorOrigin={{
												vertical: "bottom",
												horizontal: "right",
											}}
											badgeContent={
												<SettingsIcon className={classes.overlayIcon} />
											}
										>
											<Avatar className={classes.overlayedIcon}>
												<SupervisorAccountIcon />
											</Avatar>
										</Badge>
									</IconButton>
								</ButtonGroup>
							</Hidden>
							<Hidden mdDown>
								<div className={classes.signInTextContainer}>
									{(settingsDatastore.showNoSaveToggle ||
										settingsDatastore.noSaveMode) && (
										<Tooltip title={t("NO_SAVE_MODE")}>
											<FormControl component="fieldset">
												<FormControlLabel
													value="end"
													control={
														<Switch
															checked={settingsDatastore.noSaveMode}
															onChange={(event) => {
																toggleNoSaveMode(event.target.checked);
															}}
															//inputProps={{ 'aria-label': 'controlled' }}
															disabled={!settingsDatastore.showNoSaveToggle}
														/>
													}
													labelPlacement="end"
												/>
											</FormControl>
										</Tooltip>
									)}
									{t("SIGNED_IN_AS")}&nbsp;
									<ButtonGroup
										variant="contained"
										color="primary"
										disableElevation
										aria-label="main menu"
									>
										<Button
											aria-controls="top-menu"
											aria-haspopup="true"
											onClick={openTopMenu}
											className={classes.topMenuButton}
											endIcon={<ExpandMoreIcon />}
											startIcon={
												profilePic ? (
													<Avatar
														alt="Profile Picture"
														src={profilePic}
														className={classes.avatar}
													/>
												) : (
													<Avatar className={classes.avatarPlaceholder}>
														<i className="fa fa-user" aria-hidden="true"></i>
													</Avatar>
												)
											}
										>
											{getStore().getState().user.username}
										</Button>
										<Button
											aria-label="change account"
											aria-haspopup="menu"
											onClick={openChangeAccount}
											className={classes.topMenuButton}
											style={{ position: "relative" }} // Ensure relative positioning for proper overlay
										>
											<Badge
												overlap="circular"
												anchorOrigin={{
													vertical: "bottom",
													horizontal: "right",
												}}
												badgeContent={
													<SettingsIcon className={classes.overlayIcon} />
												}
											>
												<Avatar className={classes.overlayedIcon}>
													<SupervisorAccountIcon />
												</Avatar>
											</Badge>
										</Button>
									</ButtonGroup>
								</div>
							</Hidden>
							<Menu
								id="top-menu"
								anchorEl={anchorTopMenuEl}
								keepMounted
								open={Boolean(anchorTopMenuEl)}
								onClose={closeTopMenu}
								anchorOrigin={{
									vertical: "bottom",
									horizontal: "right",
								}}
								transformOrigin={{
									vertical: "top",
									horizontal: "right",
								}}
							>
								{!offlineCache.isActive() && (
									<MenuItem component={Link} to="/account/server-info">
										<ListItemIcon className={classes.listItemIcon}>
											<TuneIcon className={classes.icon} />
										</ListItemIcon>
										<Typography variant="body2">{t("ACCOUNT")}</Typography>
									</MenuItem>
								)}
								{!offlineCache.isActive() && (
									<MenuItem component={Link} to="/settings/password-generator">
										<ListItemIcon className={classes.listItemIcon}>
											<SettingsIcon className={classes.icon} />
										</ListItemIcon>
										<Typography variant="body2">{t("SETTINGS")}</Typography>
									</MenuItem>
								)}
								{!offlineCache.isActive() && (
									<MenuItem component={Link} to="/other/sessions">
										<ListItemIcon className={classes.listItemIcon}>
											<AccountTreeIcon className={classes.icon} />
										</ListItemIcon>
										<Typography variant="body2">{t("OTHER")}</Typography>
									</MenuItem>
								)}
								{!offlineCache.isActive() &&
									!getStore().getState().server
										.complianceDisableOfflineMode && (
										<MenuItem onClick={goOffline}>
											<ListItemIcon className={classes.listItemIcon}>
												<AirplanemodeActiveIcon className={classes.icon} />
											</ListItemIcon>
											<Typography variant="body2">{t("GO_OFFLINE")}</Typography>
										</MenuItem>
									)}
								{offlineCache.isActive() &&
									!getStore().getState().server
										.complianceDisableOfflineMode && (
										<MenuItem onClick={goOnline}>
											<ListItemIcon className={classes.listItemIcon}>
												<AirplanemodeActiveIcon className={classes.icon} />
											</ListItemIcon>
											<Typography variant="body2">{t("GO_ONLINE")}</Typography>
										</MenuItem>
									)}
								<Divider />
								<MenuItem onClick={logout}>
									<ListItemIcon className={classes.listItemIcon}>
										<ExitToAppIcon className={classes.icon} />
									</ListItemIcon>
									<Typography variant="body2">{t("LOGOUT")}</Typography>
								</MenuItem>
							</Menu>
						</div>
					</div>
				</Toolbar>
			</Container>
			{goOfflineOpen && (
				<DialogGoOffline
					open={goOfflineOpen}
					onClose={() => setGoOfflineOpen(false)}
				/>
			)}
			{changeAccountOpen && (
				<DialogChangeAccount
					open={changeAccountOpen}
					onClose={() => setChangeAccountOpen(false)}
				/>
			)}
			{createDatastoreOpen && (
				<CreateDatastoresDialog
					{...props}
					open={createDatastoreOpen}
					onClose={() => {
						setCreateDatastoreOpen(false);
						reloadDatastoreOverview();
					}}
				/>
			)}
		</AppBar>
	);
};

Topbar.propTypes = {
	mobileOpen: PropTypes.bool.isRequired,
	setMobileOpen: PropTypes.func.isRequired,
};

export default Topbar;
