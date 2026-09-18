import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import { Avatar, Grid } from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ClientConfiguration } from "../../../types/browser";
import type { SharingUser, UserSearchRow } from "../../../types/sharing-ui";
import type { TableColumn, TableOptions } from "../../../types/table";
import browserClient from "../../services/browser-client";
import cryptoLibrary from "../../services/crypto-library";
import datastoreUserService from "../../services/datastore-user";
import helperService from "../../services/helper";
import { getStore } from "../../services/store";
import GridContainerErrors from "../grid-container-errors";
import Table from "../table";

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
	avatar: {
		width: 150,
		height: 150,
		marginTop: "8px",
	},
	avatarPlaceholder: {
		width: 150,
		height: 150,
		fontSize: "11rem",
		backgroundColor: theme.palette.primary.main,
		paddingTop: "20px",
		marginTop: "8px",
		color: "white",
	},
	avatarPlaceholderText: {
		position: "absolute",
		bottom: "30px",
		color: theme.palette.greyText.main,
		fontSize: "0.8rem",
	},
	uncheckedIcon: {
		width: "0px",
		height: "0px",
		padding: "9px",
		border: `1px solid ${theme.palette.greyText.main}`,
		borderRadius: "3px",
	},
	inputAdornment: {
		color: theme.palette.lightGreyText.main,
	},
}));

export interface DialogNewUserProps {
	open: boolean;
	onClose: () => void;
	onCreate: (user: SharingUser) => void;
}

const DialogNewUser = (props: DialogNewUserProps) => {
	const { open, onClose } = props;
	const { t } = useTranslation();
	const classes = useStyles();
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [domain, setDomain] = useState<string | null | undefined>("");
	const allowUserSearchByUsernamePartial =
		getStore().getState().server.allowUserSearchByUsernamePartial;
	const allowUserSearchByEmail =
		getStore().getState().server.allowUserSearchByEmail;
	const serverUrl = getStore().getState().server.url;
	const [errors, setErrors] = useState<string[]>([]);
	const [visualUsername, setVisualUsername] = useState("");
	const [foundUsername, setFoundUsername] = useState("");
	const [foundUserId, setFoundUserId] = useState("");
	const [profilePic, setProfilePic] = useState("");
	const [foundPublicKey, setFoundPublicKey] = useState("");
	const [users, setUsers] = useState<UserSearchRow[]>([]);

	let isSubscribed = true;
	React.useEffect(() => {
		const onError = (data: unknown) => {
			console.log(data);
		};

		browserClient.getConfig().then(onNewConfigLoaded, onError);
		return () => {
			isSubscribed = false;
		};
	}, []);

	const onNewConfigLoaded = (configJson: ClientConfiguration) => {
		if (!isSubscribed) {
			return;
		}
		let domain = configJson["backend_servers"][0]["domain"];

		if (domain === "psono.pw" && serverUrl !== "https://www.psono.pw/server") {
			domain = helperService.getDomainWithoutWww(serverUrl);
		}

		setDomain(domain);
	};

	const showUser = (
		...[userId, username, publicKey, avatarId]: UserSearchRow
	) => {
		setUsers([]);
		setFoundUserId(userId);
		setFoundUsername(username);
		setFoundPublicKey(publicKey);
		if (avatarId) {
			const path = "/avatar-image/" + userId + "/" + avatarId + "/";
			setProfilePic(getStore().getState().server.url + path);
		} else {
			setProfilePic("");
		}
	};

	const onSearch = () => {
		setErrors([]);
		setVisualUsername("");
		setFoundUserId("");
		setFoundUsername("");
		setFoundPublicKey("");

		let searchUsername = username;
		const searchEmail = email;

		if (!allowUserSearchByUsernamePartial) {
			searchUsername = helperService.formFullUsername(searchUsername, domain);
		}

		const onSuccess = (
			response: Awaited<ReturnType<typeof datastoreUserService.searchUser>>,
		) => {
			const data = response.data;
			if (Array.isArray(data)) {
				setUsers(
					data.map((user) => {
						return [user.id, user.username, user.public_key, user.avatar_id];
					}),
				);
			} else {
				showUser(data.id, data.username, data.public_key, data.avatar_id);
			}
		};

		const onError = () => {
			setErrors(["USER_NOT_FOUND"]);
		};
		datastoreUserService
			.searchUser(searchUsername, searchEmail)
			.then(onSuccess, onError);
	};

	const onCreate = () => {
		const userObject: SharingUser = {
			id: cryptoLibrary.generateUuid(),
			type: "user",
			name: "",
			data: {
				user_id: foundUserId,
				user_public_key: foundPublicKey,
				user_username: foundUsername,
			},
		};
		if (visualUsername) {
			userObject["data"]["user_name"] = visualUsername;
		}

		if (userObject.data.user_name) {
			userObject.name += userObject.data.user_name;
		} else {
			userObject.name += userObject.data.user_username;
		}
		userObject.name += " (" + userObject.data.user_public_key + ")";

		props.onCreate(userObject);
	};

	if (users.length > 0) {
		const columns: TableColumn<UserSearchRow>[] = [
			{ name: t("ID"), options: { display: false } },
			{
				name: t("SELECTED"),
				options: {
					filter: false,
					sort: false,
					empty: false,
					customHeadLabelRender: () => null,
					customBodyRender: (value, tableMeta, updateValue) => {
						return (
							<IconButton
								onClick={() => {
									showUser(
										tableMeta.rowData[0],
										tableMeta.rowData[1],
										tableMeta.rowData[2],
										tableMeta.rowData[3],
									);
								}}
								size="large"
							>
								<CheckBoxOutlineBlankIcon />
							</IconButton>
						);
					},
				},
			},
			{
				name: t("USERNAME"),
				options: {
					filter: true,
					sort: true,
					empty: false,
					customBodyRender: (value, tableMeta, updateValue) => {
						let username = tableMeta.rowData[1].substring(0, 20);
						if (tableMeta.rowData[1].length > 20) {
							username = username + "...";
						}
						return username;
					},
				},
			},
			{
				name: t("PUBLIC_KEY"),
				options: {
					filter: true,
					sort: true,
					empty: false,
					customBodyRender: (value, tableMeta, updateValue) => {
						let publicKey = tableMeta.rowData[2].substring(0, 50);
						if (tableMeta.rowData[2].length > 50) {
							publicKey = publicKey + "...";
						}
						return publicKey;
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
					setUsers([]);
				}}
				aria-labelledby="alert-dialog-title"
				aria-describedby="alert-dialog-description"
			>
				<DialogTitle id="alert-dialog-title">{t("PICK_USER")}</DialogTitle>
				<DialogContent>
					<Table data={users} columns={columns} options={options} />
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							setUsers([]);
						}}
					>
						{t("CLOSE")}
					</Button>
				</DialogActions>
			</Dialog>
		);
	} else {
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
				<DialogTitle id="alert-dialog-title">
					{foundUserId ? t("VERIFY_IDENTITY") : t("SEARCH_USER")}
				</DialogTitle>
				<DialogContent>
					<Grid container>
						{!foundUserId && (
							<Grid item xs={12} sm={12} md={12}>
								<TextField
									className={classes.textField}
									variant="outlined"
									margin="dense"
									size="small"
									id="username"
									label={t("USERNAME")}
									InputProps={{
										endAdornment:
											domain &&
											!allowUserSearchByUsernamePartial &&
											!username.includes("@") ? (
												<InputAdornment position="end">
													<span className={classes.inputAdornment}>
														{"@" + domain}
													</span>
												</InputAdornment>
											) : null,
									}}
									name="username"
									autoComplete="off"
									value={username}
									onChange={(event) => {
										setUsername(event.target.value);
									}}
								/>
							</Grid>
						)}
						{!foundUserId && allowUserSearchByEmail && (
							<Grid item xs={12} sm={12} md={12}>
								<TextField
									className={classes.textField}
									variant="outlined"
									margin="dense"
									size="small"
									error={Boolean(email) && !helperService.isValidEmail(email)}
									id="email"
									label={t("EMAIL")}
									name="email"
									autoComplete="off"
									value={email}
									onChange={(event) => {
										setEmail(event.target.value);
									}}
								/>
							</Grid>
						)}
						{!foundUserId && (
							<Grid item xs={12} sm={12} md={12}>
								<MuiAlert
									severity="info"
									style={{
										marginBottom: "5px",
										marginTop: "5px",
									}}
								>
									{t("SEARCH_USER_EXPLAINED")}
								</MuiAlert>
							</Grid>
						)}

						{Boolean(foundUserId) && (
							<Grid item xs={12} sm={12} md={12}>
								<Grid container>
									<Grid item xs={12} sm={4} md={4}>
										{React.createElement(
											"center",
											null,
											profilePic ? (
												<Avatar
													alt="Profile Picture"
													src={profilePic}
													className={classes.avatar}
												/>
											) : (
												<Avatar className={classes.avatarPlaceholder}>
													<i className="fa fa-user" aria-hidden="true"></i>
													<span className={classes.avatarPlaceholderText}>
														{t("NO_IMAGE")}
													</span>
												</Avatar>
											),
										)}
									</Grid>
									<Grid item xs={12} sm={8} md={8}>
										<Grid container>
											<Grid item xs={12} sm={12} md={12}>
												<TextField
													className={classes.textField}
													variant="outlined"
													margin="dense"
													size="small"
													id="visualUsername"
													label={t("NAME_OPTIONAL")}
													name="visualUsername"
													autoComplete="off"
													value={visualUsername}
													onChange={(event) => {
														setVisualUsername(event.target.value);
													}}
												/>
											</Grid>
											<Grid item xs={12} sm={12} md={12}>
												<TextField
													className={classes.textField}
													variant="outlined"
													margin="dense"
													size="small"
													id="foundUsername"
													label={t("USERNAME")}
													name="foundUsername"
													autoComplete="off"
													value={foundUsername}
													disabled
												/>
											</Grid>
											<Grid item xs={12} sm={12} md={12}>
												<TextField
													className={classes.textField}
													variant="outlined"
													margin="dense"
													size="small"
													id="foundPublicKey"
													label={t("PUBLIC_KEY")}
													name="foundPublicKey"
													autoComplete="off"
													helperText={t("TO_VERIFY_PUBLIC_KEY")}
													value={foundPublicKey}
													disabled
												/>
											</Grid>
										</Grid>
									</Grid>
								</Grid>
							</Grid>
						)}
						{!!foundUserId && (
							<Grid item xs={12} sm={12} md={12}>
								<MuiAlert
									severity="info"
									style={{
										marginBottom: "5px",
										marginTop: "5px",
									}}
								>
									{t("VERIFY_USER_IDENTITY_EXPLAINED")}
								</MuiAlert>
							</Grid>
						)}
					</Grid>
					<GridContainerErrors errors={errors} setErrors={setErrors} />
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							onClose();
						}}
					>
						{t("CLOSE")}
					</Button>
					{users.length == 0 && !foundUserId && (
						<Button
							onClick={onSearch}
							variant="contained"
							color="primary"
							disabled={
								(!username && !email) ||
								(Boolean(email) && !helperService.isValidEmail(email))
							}
						>
							{t("SEARCH")}
						</Button>
					)}
					{Boolean(foundUserId && foundUsername && foundPublicKey) && (
						<Button
							onClick={() => {
								onCreate();
							}}
							variant="contained"
							color="primary"
						>
							{t("ADD")}
						</Button>
					)}
				</DialogActions>
			</Dialog>
		);
	}
};

export default DialogNewUser;
