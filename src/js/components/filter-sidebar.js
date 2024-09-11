import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer, IconButton, Typography, Checkbox, FormControlLabel, List, ListItem, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme) => ({
    drawerPaper: {
        width: 300,
        paddingLeft: theme.spacing(2),
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
        overflowY: 'auto',
        transition: 'none',
    },
    header: {
        fontSize: "14px",
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing(1.5),
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
    list: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
    title: {
        fontWeight: 'bold',
    },
    sectionTitle: {
        marginTop: theme.spacing(1.5),
        marginBottom: theme.spacing(0.5),
        color: '#666',
    },
    listItem: {
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
    },
    formControlLabel: {
        fontSize: "14px",
    },
}));

const FilterSideBar = ({ open, onClose, filters, selectedFilters, toggleFilter }) => {
    const classes = useStyles();
    const { t } = useTranslation();
    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            classes={{ paper: classes.drawerPaper }}
            variant="persistent"
            transitionDuration={0}
            ModalProps={{
                keepMounted: true,
            }}
            sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                height: '100%',
                width: open ? '300px' : '0',
                zIndex: 1300,
                transition: 'none',
                '& .MuiDrawer-paper': {
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    height: '100%',
                    width: open ? 300 : 0,
                    transition: 'none',
                    paddingLeft: 0,
                },
            }}
        >
            <div className={classes.header}>
                <Typography variant="h6" className={classes.title}>
                    {t("FILTERS")}
                </Typography>
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </div>
            <Divider />
            <List className={classes.list}>
                {filters.map((section) => (
                    <div key={section.label}>
                        <Typography variant="body2" className={classes.sectionTitle}>
                            {section.label}
                        </Typography>
                        {section.options.sort((a, b) => t(a.label).localeCompare(t(b.label))).map((option) => (
                            <ListItem key={option.key} className={classes.listItem}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={!!selectedFilters[option.key]}
                                            onChange={() => toggleFilter(option.key)}
                                        />
                                    }
                                    label={<Typography className={classes.formControlLabel}>{option.label}</Typography>}
                                />
                            </ListItem>
                        ))}
                    </div>
                ))}
            </List>
        </Drawer>
    );
};

export default FilterSideBar;