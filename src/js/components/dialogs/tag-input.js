import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { makeStyles } from '@mui/styles';
import TextField from "@mui/material/TextField";
import { Grid } from "@mui/material";
import Chip from '@mui/material/Chip';

const useStyles = makeStyles((theme) => ({
    chipContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: theme.spacing(1),
        marginTop: theme.spacing(1),
    },
    textField: {
        width: '100%',
    },
}));

const TagInput = ({ tags, onChange, readOnly }) => {
    const classes = useStyles();
    const [inputValue, setInputValue] = useState('');
    const [showInput, setShowInput] = useState(false);

    const handleDelete = (tagToDelete) => {
        onChange(tags.filter((tag) => tag !== tagToDelete));
    };

    const handleKeyDown = (event) => {
        if (readOnly) return;
        
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            const newTag = inputValue.trim();
            
            if (newTag && !tags.includes(newTag)) {
                onChange([...tags, newTag]);
                setInputValue('');
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
                        <button onClick={() => setShowInput(true)}>
                            Add Tags
                        </button>
                    )}
                </Grid>
            )}
        </Grid>
    );
};

TagInput.defaultProps = {
    tags: [],
    readOnly: false,
};

TagInput.propTypes = {
    tags: PropTypes.arrayOf(PropTypes.string),
    onChange: PropTypes.func.isRequired,
    readOnly: PropTypes.bool,
};

export default TagInput; 