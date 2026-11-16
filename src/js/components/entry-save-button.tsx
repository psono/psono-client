import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SaveIcon from "@mui/icons-material/Save";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const EntrySaveButton = ({
	disabled,
	onSave,
	menuItems = [],
	menuDisabled,
}: {
	disabled?: boolean;
	onSave?: (close: boolean) => void;
	menuItems?: React.ReactNode[];
	menuDisabled?: boolean;
}) => {
	const { t } = useTranslation();
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const dropdownDisabled = menuDisabled || (disabled && !menuItems.length);
	return (
		<>
			<ButtonGroup variant="contained" color="primary">
				{onSave && (
					<Button
						disabled={disabled}
						onClick={() => onSave(false)}
						type="submit"
					>
						{t("SAVE")}
					</Button>
				)}
				<Button
					size="small"
					disabled={dropdownDisabled}
					aria-label={t(onSave ? "SAVE_AND_CLOSE" : "MORE")}
					aria-haspopup="menu"
					aria-controls={anchorEl ? "entry-save-menu" : undefined}
					aria-expanded={Boolean(anchorEl)}
					onClick={(event) => setAnchorEl(event.currentTarget)}
				>
					<ArrowDropDownIcon />
				</Button>
			</ButtonGroup>
			<Menu
				id="entry-save-menu"
				anchorEl={anchorEl}
				open={Boolean(anchorEl) && !dropdownDisabled}
				onClose={() => setAnchorEl(null)}
				onClick={() => setAnchorEl(null)}
			>
				{onSave && (
					<MenuItem disabled={disabled} onClick={() => onSave(true)}>
						<ListItemIcon sx={{ minWidth: (theme) => theme.spacing(4) }}>
							<SaveIcon sx={{ fontSize: "18px" }} fontSize="small" />
						</ListItemIcon>
						<Typography variant="body2" noWrap>
							{t("SAVE_AND_CLOSE")}
						</Typography>
					</MenuItem>
				)}
				{onSave && menuItems.length > 0 && <Divider />}
				{menuItems}
			</Menu>
		</>
	);
};

export default EntrySaveButton;
