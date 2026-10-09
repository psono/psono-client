import { Grid } from "@mui/material";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import { makeStyles } from "@mui/styles";
import React, { useState } from "react";

const useStyles = makeStyles((theme) => ({
	chipContainer: {
		display: "flex",
		flexWrap: "wrap",
		gap: theme.spacing(1),
		marginTop: theme.spacing(1),
	},
	textField: {
		width: "100%",
	},
}));

export interface TagInputProps {
	tags?: string[];
	onChange: (tags: string[]) => void;
	readOnly?: boolean;
}

const TagInput = ({ tags = [], onChange, readOnly = false }: TagInputProps) => {
	const classes = useStyles();
	const [inputValue, setInputValue] = useState("");
	const [showInput, setShowInput] = useState(false);

	const handleDelete = (tagToDelete: string) => {
		onChange(tags.filter((tag) => tag !== tagToDelete));
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (readOnly) return;

		if (event.key === "Enter" || event.key === ",") {
			event.preventDefault();
			const newTag = inputValue.trim();

			if (newTag && !tags.includes(newTag)) {
				onChange([...tags, newTag]);
				setInputValue("");
			}
		}
	};

	return (
		<Grid container spacing={1}>
			{tags.length > 0 && (
				<Grid item xs={12}>
					<div className={classes.chipContainer}>
						{tags.map((tag, index) => (
							<Chip
								key={index}
								label={tag}
								onDelete={readOnly ? undefined : () => handleDelete(tag)}
							/>
						))}
					</div>
				</Grid>
			)}
			{!readOnly && (
				<Grid item xs={12}>
					{showInput ? (
						<TextField
							className={classes.textField}
							variant="outlined"
							margin="dense"
							size="small"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Type and press Enter to add tags"
							InputProps={{ readOnly }}
							autoFocus
						/>
					) : (
						<button onClick={() => setShowInput(true)}>Add Tags</button>
					)}
				</Grid>
			)}
		</Grid>
	);
};

export default TagInput;
