import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Grid } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";
import HKP from "@openpgp/hkp-client";
import * as openpgp from "openpgp";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Datastore, GpgUser } from "../../../types/datastore";
import { isDialogRecord } from "../../../types/dialogs";
import type {
	DialogProps,
	GpgRecipientSelection,
} from "../../../types/dialogs";
import type { TableColumn, TableOptions } from "../../../types/table";
import cryptoLibraryService from "../../services/crypto-library";
import datastoreService from "../../services/datastore";
import datastoreGpgUserService from "../../services/datastore-gpg-user";
import helper from "../../services/helper";
import { getStore } from "../../services/store";
import Table from "../table";

const useStyles = makeStyles((theme) => ({
	textField: {
		width: "100%",
	},
	fingerprint: {
		marginTop: theme.spacing(2),
	},
}));

export interface DialogGpgAddressBookProps extends DialogProps {
	onSelect: (recipient: GpgRecipientSelection) => void;
}

type AddressRow = [id: string, email: string];
type PublicKeyRow = [index: number, fingerprint: string];

function isGpgUser(value: unknown): value is GpgUser {
	return (
		isDialogRecord(value) &&
		typeof value.id === "string" &&
		typeof value.email === "string" &&
		Array.isArray(value.public_keys) &&
		value.public_keys.every((key: unknown) => typeof key === "string")
	);
}

const DialogGpgAddressBook = (props: DialogGpgAddressBookProps) => {
	const { open, onClose, onSelect } = props;
	const { t } = useTranslation();
	const classes = useStyles();
	const [view, setView] = useState("default");
	const [editingUser, setEditingUser] = useState<Partial<GpgUser>>({});
	const [
		editingUserPublicKeyFingerprints,
		setEditingUserPublicKeyFingerprints,
	] = useState<string[]>([]);
	const [email, setEmail] = useState("");
	const [newPublicKey, setNewPublicKey] = useState("");
	const [fingerprint, setFingerprint] = useState("");
	const [defaultFingerprint, setDefaultFingerprint] = useState("");
	const [addresses, setAddresses] = useState<AddressRow[]>([]);
	const [errors, setErrors] = useState<string[]>([]);
	const [userDict, setUserDict] = useState<Record<string, GpgUser>>({});

	let isSubscribed = true;
	React.useEffect(() => {
		loadGpgUsers();
		return () => {
			isSubscribed = false;
		};
	}, []);

	const loadGpgUsers = () => {
		const onSuccess = (datastore: Datastore | undefined) => {
			if (!isSubscribed) {
				return;
			}
			const parsedAddresses: AddressRow[] = [];
			const newUserDict: Record<string, GpgUser> = {};
			datastoreService.filter(datastore, (user) => {
				if (!isGpgUser(user)) return;
				newUserDict[user.id] = user;
				parsedAddresses.push([user.id, user.email]);
			});
			setUserDict(newUserDict);
			setAddresses(parsedAddresses);
		};
		const onError = () => {
			alert("Error, should not happen.");
		};
		return datastoreGpgUserService
			.getGpgUserDatastore()
			.then(onSuccess, onError);
	};

	const searchPublicKeyServer = (searchEmail: string) => {
		setErrors([]);

		const hkp = new HKP(
			getStore().getState().settingsDatastore.gpgHkpKeyServer,
		);
		const options = {
			query: searchEmail,
		};

		hkp.lookup(options).then(
			async (publicKey) => {
				if (typeof publicKey !== "undefined") {
					setNewPublicKey(publicKey);
					setFingerprint(
						await datastoreGpgUserService.getGpgFingerprint(publicKey),
					);
				} else {
					setErrors(["NO_PUBLIC_KEY_FOUND_FOR_EMAIL"]);
					setNewPublicKey("");
					setFingerprint("");
				}
			},
			(error) => {
				console.log(error);
			},
		);
	};

	const addNewRecipient = async () => {
		setErrors([]);

		const publicKeyUnArmored = await openpgp.readKey({
			armoredKey: newPublicKey,
		});

		const user = {
			id: cryptoLibraryService.generateUuid(),
			email: email,
			public_keys: [publicKeyUnArmored.armor()],
		};

		const onSuccess = (
			user: Awaited<ReturnType<typeof datastoreGpgUserService.addUser>>,
		) => {
			if (!user) return;
			if (Object.hasOwn(user, "error") && typeof user.error === "string") {
				setErrors([user.error]);
			} else {
				onClose();
				if (onSelect) {
					onSelect({ user: user, public_key: user.default_public_key });
				}
			}
		};

		const onError = (data: unknown) => {
			if (
				isDialogRecord(data) &&
				Object.hasOwn(data, "error") &&
				typeof data.error === "string"
			) {
				setErrors([data.error]);
			} else {
				console.log(data);
				alert("Error, should not happen.");
			}
		};

		datastoreGpgUserService.addUser(user).then(onSuccess, onError);
	};

	const addNewGpgKey = async () => {
		setErrors([]);
		if (!isGpgUser(editingUser)) return;

		const onSuccess = async (
			data: Awaited<ReturnType<typeof datastoreGpgUserService.addPublicKey>>,
		) => {
			if (!data) return;
			if (Object.hasOwn(data, "error") && typeof data.error === "string") {
				setErrors([data.error]);
			} else if (isGpgUser(data)) {
				editingUser.public_keys = data.public_keys;
				setEditingUser(editingUser);
				const fingerprints = Array<string>(editingUser.public_keys.length);
				await Promise.all(
					editingUser.public_keys.map(async (key, index) => {
						fingerprints[index] =
							await datastoreGpgUserService.getGpgFingerprint(key);
					}),
				);

				setEditingUserPublicKeyFingerprints(fingerprints);
				backToEditingAddress();
			}
		};

		const onError = (data: unknown) => {
			if (
				isDialogRecord(data) &&
				Object.hasOwn(data, "error") &&
				typeof data.error === "string"
			) {
				setErrors([data.error]);
			} else {
				console.log(data);
				alert("Error, should not happen.");
			}
		};

		datastoreGpgUserService
			.addPublicKey(editingUser, [newPublicKey])
			.then(onSuccess, onError);
	};

	const back = () => {
		setEmail("");
		setFingerprint("");
		setNewPublicKey("");
		setView("default");
	};

	const backToEditingAddress = () => {
		setEmail("");
		setFingerprint("");
		setNewPublicKey("");
		setView("editing_address");
	};
	const editRecipient = async (userId: string) => {
		const user = userDict[userId];
		setEditingUser(user);
		const fingerprints = Array<string>(user.public_keys.length);
		await Promise.all(
			user.public_keys.map(async (key, index) => {
				fingerprints[index] =
					await datastoreGpgUserService.getGpgFingerprint(key);
			}),
		);

		setEditingUserPublicKeyFingerprints(fingerprints);
		setDefaultFingerprint(
			await datastoreGpgUserService.getGpgFingerprint(user.default_public_key),
		);
		setView("editing_address");
	};

	const deleteRecipient = (userId: string) => {
		const onSuccess = () => {
			loadGpgUsers();
		};
		const onError = (data: unknown) => {
			// pass
			console.log(data);
		};

		datastoreGpgUserService
			.deleteUser(userDict[userId])
			.then(onSuccess, onError);
	};

	const selectRecipient = (rowData: AddressRow) => {
		const user = userDict[rowData[0]];
		onClose();
		if (onSelect) {
			onSelect({ user: user, public_key: user.default_public_key });
		}
	};

	const chooseKeyAsDefault = async (keyId: number) => {
		if (!isGpgUser(editingUser)) return;
		const publicKey = editingUser.public_keys[keyId];
		setDefaultFingerprint(
			await datastoreGpgUserService.getGpgFingerprint(publicKey),
		);
		datastoreGpgUserService.chooseAsDefaultKey(editingUser, publicKey);
	};

	const deleteKey = (keyId: number) => {
		if (!isGpgUser(editingUser)) return;
		const publicKey = editingUser.public_keys[keyId];

		const onSuccess = () => {
			const newEditingUser = helper.duplicateObject(editingUser);
			newEditingUser.public_keys.splice(keyId, 1);
			setEditingUser(newEditingUser);
			setEditingUserPublicKeyFingerprints(
				editingUserPublicKeyFingerprints.filter(
					(value, index) => index !== keyId,
				),
			);
		};

		const onError = (data: unknown) => {
			if (
				isDialogRecord(data) &&
				Object.hasOwn(data, "error") &&
				typeof data.error === "string"
			) {
				setErrors([data.error]);
			} else {
				console.log(data);
				alert("Error, should not happen.");
			}
		};

		datastoreGpgUserService
			.removePublicKey(editingUser, [publicKey])
			.then(onSuccess, onError);
	};

	const columns: TableColumn<AddressRow>[] = [
		{ name: t("ID"), options: { display: false } },
		{ name: t("EMAIL") },
		{
			name: t("EDIT"),
			options: {
				filter: false,
				sort: false,
				empty: false,
				customHeadLabelRender: () => null,
				customBodyRender: (value, tableMeta, updateValue) => {
					return (
						<IconButton
							onClick={() => {
								editRecipient(tableMeta.rowData[0]);
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
				filter: false,
				sort: false,
				empty: false,
				customHeadLabelRender: () => null,
				customBodyRender: (value, tableMeta, updateValue) => {
					return (
						<IconButton
							onClick={() => {
								deleteRecipient(tableMeta.rowData[0]);
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

	const columnsEditUser: TableColumn<PublicKeyRow>[] = [
		{ name: t("ID"), options: { display: false } },
		{ name: t("FINGERPRINT") },
		{
			name: t("DEFAULT"),
			options: {
				filter: false,
				sort: false,
				empty: false,
				customBodyRender: (value, tableMeta, updateValue) => {
					const isDefault = defaultFingerprint === tableMeta.rowData[1];
					return (
						<IconButton
							onClick={() => {
								chooseKeyAsDefault(tableMeta.rowData[0]);
							}}
							disabled={isDefault}
							size="large"
						>
							{isDefault ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
						</IconButton>
					);
				},
			},
		},
		{
			name: t("DELETE"),
			options: {
				filter: false,
				sort: false,
				empty: false,
				customHeadLabelRender: () => null,
				customBodyRender: (value, tableMeta, updateValue) => {
					return (
						<IconButton
							onClick={() => {
								deleteKey(tableMeta.rowData[0]);
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
		<Dialog
			fullWidth
			maxWidth={"sm"}
			open={open}
			onClose={onClose}
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
		>
			<DialogTitle id="alert-dialog-title">{t("ADDRESS_BOOK")}</DialogTitle>
			{view === "default" && (
				<DialogContent>
					<Grid container>
						<Grid item xs={12} sm={12} md={12}>
							<Table<AddressRow>
								data={addresses}
								columns={columns}
								options={options}
								onCreate={() => setView("adding_address")}
								onSelect={selectRecipient}
							/>
						</Grid>
					</Grid>
				</DialogContent>
			)}
			{view === "editing_address" && isGpgUser(editingUser) && (
				<DialogContent>
					<Grid container>
						<Grid item xs={12} sm={12} md={12}>
							<TextField
								className={classes.textField}
								variant="outlined"
								margin="dense"
								size="small"
								id="email"
								label={t("EMAIL")}
								name="email"
								autoComplete="off"
								value={editingUser.email}
								required
								disabled
							/>
						</Grid>
						<Grid item xs={12} sm={12} md={12}>
							<Table<PublicKeyRow>
								data={editingUserPublicKeyFingerprints.map((key, index) => [
									index,
									key,
								])}
								columns={columnsEditUser}
								options={options}
								onCreate={() => setView("adding_gpg_key")}
								onSelect={(rowData: PublicKeyRow) => {
									onClose();
									onSelect({
										user: editingUser,
										public_key: editingUser.public_keys[rowData[0]],
									});
								}}
							/>
						</Grid>
					</Grid>
				</DialogContent>
			)}
			{view === "adding_address" && (
				<DialogContent>
					<Grid container>
						<Grid item xs={12} sm={12} md={12}>
							<TextField
								className={classes.textField}
								variant="outlined"
								margin="dense"
								size="small"
								id="email"
								label={t("EMAIL")}
								name="email"
								autoComplete="off"
								value={email}
								required
								error={Boolean(email) && !helper.isValidEmail(email)}
								onChange={(event) => {
									setEmail(event.target.value);
								}}
							/>
						</Grid>
						<Grid item xs={12} sm={12} md={12}>
							<TextField
								className={classes.textField}
								variant="outlined"
								margin="dense"
								size="small"
								id="newPublicKey"
								label={t("PUBLIC_KEY")}
								name="newPublicKey"
								autoComplete="off"
								value={newPublicKey}
								required
								onChange={async (event) => {
									setNewPublicKey(event.target.value);
									setFingerprint(
										await datastoreGpgUserService.getGpgFingerprint(
											event.target.value,
										),
									);
								}}
								helperText={t(
									"USE_HKP_OR_PROVIDE_THE_PUBLIC_KEY_MANUALLY_INCLUDING",
								)}
								error={Boolean(newPublicKey) && !fingerprint}
								multiline
								minRows={3}
								maxRows={10}
							/>
						</Grid>
						{!fingerprint && (
							<Grid item xs={12} sm={12} md={12}>
								<Button
									onClick={() => {
										searchPublicKeyServer(email);
									}}
									disabled={!email || !helper.isValidEmail(email)}
									variant="contained"
								>
									{t("SEARCH_PUBLIC_KEY_SERVER")}
								</Button>
							</Grid>
						)}
						{fingerprint && (
							<Grid
								item
								xs={12}
								sm={12}
								md={12}
								className={classes.fingerprint}
							>
								<TextField
									className={classes.textField}
									variant="outlined"
									margin="dense"
									size="small"
									id="fingerprint"
									label={t("FINGERPRINT")}
									name="fingerprint"
									autoComplete="off"
									value={fingerprint}
								/>
							</Grid>
						)}
					</Grid>
				</DialogContent>
			)}
			{view === "adding_gpg_key" && isGpgUser(editingUser) && (
				<DialogContent>
					<Grid container>
						<Grid item xs={12} sm={12} md={12}>
							<TextField
								className={classes.textField}
								variant="outlined"
								margin="dense"
								size="small"
								id="email"
								label={t("EMAIL")}
								name="email"
								autoComplete="off"
								value={editingUser.email}
								required
								disabled
							/>
						</Grid>
						<Grid item xs={12} sm={12} md={12}>
							<TextField
								className={classes.textField}
								variant="outlined"
								margin="dense"
								size="small"
								id="newPublicKey"
								label={t("PUBLIC_KEY")}
								name="newPublicKey"
								autoComplete="off"
								value={newPublicKey}
								required
								onChange={async (event) => {
									setNewPublicKey(event.target.value);
									setFingerprint(
										await datastoreGpgUserService.getGpgFingerprint(
											event.target.value,
										),
									);
								}}
								helperText={t(
									"USE_HKP_OR_PROVIDE_THE_PUBLIC_KEY_MANUALLY_INCLUDING",
								)}
								error={Boolean(newPublicKey) && !fingerprint}
								multiline
								minRows={3}
								maxRows={10}
							/>
						</Grid>
						{!fingerprint && (
							<Grid item xs={12} sm={12} md={12}>
								<Button
									onClick={() => {
										searchPublicKeyServer(editingUser.email);
									}}
									variant="contained"
								>
									{t("SEARCH_PUBLIC_KEY_SERVER")}
								</Button>
							</Grid>
						)}
						{fingerprint && (
							<Grid
								item
								xs={12}
								sm={12}
								md={12}
								className={classes.fingerprint}
							>
								<TextField
									className={classes.textField}
									variant="outlined"
									margin="dense"
									size="small"
									id="fingerprint"
									label={t("FINGERPRINT")}
									name="fingerprint"
									autoComplete="off"
									value={fingerprint}
								/>
							</Grid>
						)}
					</Grid>
				</DialogContent>
			)}
			{view === "default" && (
				<DialogActions>
					<Button onClick={onClose}>{t("CLOSE")}</Button>
				</DialogActions>
			)}
			{view === "adding_address" && (
				<DialogActions>
					<Button
						onClick={addNewRecipient}
						disabled={!fingerprint || !email || !helper.isValidEmail(email)}
						variant="contained"
						color="primary"
					>
						{t("ADD")}
					</Button>
					<Button onClick={back}>{t("BACK")}</Button>
				</DialogActions>
			)}
			{view === "editing_address" && (
				<DialogActions>
					<Button onClick={back}>{t("BACK")}</Button>
				</DialogActions>
			)}
			{view === "adding_gpg_key" && (
				<DialogActions>
					<Button
						onClick={addNewGpgKey}
						disabled={!fingerprint}
						variant="contained"
						color="primary"
					>
						{t("ADD")}
					</Button>
					<Button onClick={backToEditingAddress}>{t("BACK")}</Button>
				</DialogActions>
			)}
		</Dialog>
	);
};

export default DialogGpgAddressBook;
