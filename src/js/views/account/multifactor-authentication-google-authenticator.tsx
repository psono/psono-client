import CheckIcon from "@mui/icons-material/Check";
import type { TableColumn, TableOptions } from "../../../types/table";
import type { AccountDialogProps, FactorRow } from "../../../types/account-ui";
import type { FactorEnrollment } from "../../../types/auth";
import DeleteIcon from "@mui/icons-material/Delete";
import { CircularProgress, Grid, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import GridContainerErrors from "../../components/grid-container-errors";
import Table from "../../components/table";
import TextFieldPassword from "../../components/text-field/password";
import TextFieldQrCode from "../../components/text-field/qr";
import googleAuthenticator from "../../services/google-authenticator";
import SecondFactorOverview from "./second-factor-overview";

const useStyles = makeStyles((theme) => ({
	textField: {
		width: "100%",
	},
}));
const MultifactorAuthenticatorGoogleAuthenticator = (
	props: AccountDialogProps,
) => {
	const { open, onClose } = props;
	const { t } = useTranslation();
	const classes = useStyles();
	const [title, setTitle] = React.useState("");
	const [code, setCode] = React.useState("");
	const [uri, setUri] = React.useState("");
	const [newGa, setNewGa] = React.useState<Partial<FactorEnrollment>>({});
	const [view, setView] = React.useState<
		"default" | "create_step0" | "create_step1"
	>("default");
	const [generating, setGenerating] = useState(false);
	const [googleAuthenticators, setGoogleAuthenticators] = React.useState<
		FactorRow[] | null
	>(null);
	const [listError, setListError] = useState(false);
	const [errors, setErrors] = useState<string[]>([]);

	React.useEffect(() => {
		loadGoogleAuthenticators();
	}, []);

	const loadGoogleAuthenticators = () => {
		googleAuthenticator.readGa().then(
			(authenticators) => {
				setListError(false);
				setGoogleAuthenticators(
					authenticators!.map((authenticator): FactorRow => {
						return [
							authenticator.id,
							authenticator.title,
							authenticator.active,
						];
					}),
				);
			},
			(error) => {
				setListError(true);
				console.log(error);
			},
		);
	};
	const generate = () => {
		setErrors([]);
		setGenerating(true);

		googleAuthenticator.createGa(title).then(
			(ga) => {
				setGenerating(false);
				if (!ga?.id || !ga.uri) {
					setErrors(["TOTP_SETUP_GENERATION_FAILED"]);
					return;
				}
				setNewGa(ga);
				setTitle("");
				setCode("");
				setUri(ga.uri);
				setView("create_step1");
			},
			(error) => {
				console.log(error);
				setGenerating(false);
				setErrors(["TOTP_SETUP_GENERATION_FAILED"]);
			},
		);
	};
	const validate = () => {
		setErrors([]);

		const onSuccess = (successful: boolean) => {
			if (successful) {
				setNewGa({});
				setCode("");
				setUri("");
				setGoogleAuthenticators(null);
				setView("default");
				loadGoogleAuthenticators();
			} else {
				setErrors(["CODE_INCORRECT"]);
			}
		};

		const onError = (error: unknown) => {
			console.log(error);
		};

		return googleAuthenticator
			.activateGa(newGa.id!, code)
			.then(onSuccess, onError);
	};
	const onDelete = (rowData: FactorRow) => {
		setErrors([]);

		const onSuccess = () => {
			loadGoogleAuthenticators();
		};

		const onError = (error: unknown) => {
			console.log(error);
		};

		return googleAuthenticator.deleteGa(rowData[0]).then(onSuccess, onError);
	};
	const onCreate = () => {
		setView("create_step0");
	};

	const columns: TableColumn<FactorRow>[] = [
		{ name: t("ID"), options: { display: false } },
		{ name: t("TOTP_TITLE") },
		{
			name: t("ACTIVE"),
			options: {
				filter: true,
				sort: true,
				empty: false,
				customBodyRender: (value, tableMeta, updateValue) => {
					return <span>{tableMeta.rowData[2] && <CheckIcon />}</span>;
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
								onDelete(tableMeta.rowData);
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
			onClose={() => {
				setView("default");
				onClose();
			}}
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
		>
			<DialogTitle id="alert-dialog-title">{t("TOTP")}</DialogTitle>
			{view === "default" && (
				<SecondFactorOverview
					rows={googleAuthenticators}
					loadError={listError}
					onCreate={onCreate}
				>
					<Table
						data={googleAuthenticators || []}
						columns={columns}
						options={options}
						onCreate={onCreate}
					/>
				</SecondFactorOverview>
			)}
			{view === "create_step0" && (
				<DialogContent>
					<Grid container>
						<Grid item xs={12} sm={12} md={12}>
							<TextField
								className={classes.textField}
								variant="outlined"
								margin="dense"
								size="small"
								id="title"
								label={t("TITLE")}
								name="title"
								autoComplete="off"
								required
								value={title}
								onChange={(event) => {
									setTitle(event.target.value);
								}}
							/>
						</Grid>
						<Grid item xs={12} sm={12} md={12}>
							<Button
								variant="contained"
								color="primary"
								onClick={generate}
								disabled={!title || generating}
								startIcon={
									generating ? (
										<CircularProgress size={16} color="inherit" />
									) : undefined
								}
							>
								{t("GENERATE")}
							</Button>
						</Grid>
						<GridContainerErrors errors={errors} setErrors={setErrors} />
					</Grid>
				</DialogContent>
			)}
			{view === "create_step1" && (
				<DialogContent>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<Typography variant="h6" component="h3" gutterBottom>
								{t("TOTP_SETUP_STEP_1_TITLE")}
							</Typography>
							<Typography color="textSecondary">
								{t("TOTP_SETUP_STEP_1_DESCRIPTION")}
							</Typography>
						</Grid>
						<Grid item xs={12} sm={12} md={12}>
							<TextFieldQrCode
								className={classes.textField}
								variant="outlined"
								margin="dense"
								size="small"
								value={uri}
							/>
						</Grid>
						<Grid item xs={12} sm={12} md={12}>
							<TextFieldPassword
								className={classes.textField}
								variant="outlined"
								margin="dense"
								size="small"
								id="uri"
								label={"URI"}
								name="uri"
								autoComplete="off"
								value={uri}
								InputProps={{ readOnly: true }}
							/>
						</Grid>
						<Grid item xs={12}>
							<Typography variant="h6" component="h3" gutterBottom>
								{t("TOTP_SETUP_STEP_2_TITLE")}
							</Typography>
							<Typography color="textSecondary">
								{t("TOTP_SETUP_STEP_2_DESCRIPTION")}
							</Typography>
						</Grid>
						<Grid item xs={12} sm={12} md={12}>
							<TextField
								className={classes.textField}
								variant="outlined"
								margin="dense"
								size="small"
								id="code"
								label={t("TOTP_CODE")}
								name="code"
								autoComplete="one-time-code"
								inputProps={{ inputMode: "numeric" }}
								required
								value={code}
								onChange={(event) => {
									setCode(event.target.value);
								}}
							/>
						</Grid>
						<GridContainerErrors errors={errors} setErrors={setErrors} />
						<Grid item xs={12} sm={12} md={12}>
							<Button
								variant="contained"
								color="primary"
								onClick={validate}
								disabled={!newGa.id || code.length < 6}
							>
								{t("ACTIVATE")}
							</Button>
						</Grid>
					</Grid>
				</DialogContent>
			)}
			<DialogActions>
				<Button
					onClick={() => {
						setView("default");
						onClose();
					}}
					autoFocus
				>
					{t("CLOSE")}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

MultifactorAuthenticatorGoogleAuthenticator.propTypes = {
	onClose: PropTypes.func.isRequired,
	open: PropTypes.bool.isRequired,
};

export default MultifactorAuthenticatorGoogleAuthenticator;
