import React, {useState} from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@mui/styles";

import MUIDataTable from "mui-datatables";
import { useTranslation } from "react-i18next";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";
import PeopleIcon from "@mui/icons-material/People";
import DeleteIcon from "@mui/icons-material/Delete";

const useStyles = makeStyles((theme) => ({
    muiDataTable: {
        "& .MuiToolbar-gutters": {
            padding: 0,
        },
        "& .MuiTableCell-footer": {
            padding: 0,
        },
    }

}));

function Table(props) {
    const classes = useStyles();
    const { t } = useTranslation();
    const [count, setCount] = useState(1);
    const [loadedData, setLoadedData] = useState([]);

    const {
        title,
        data,
        columns,
        onCreate,
        onDelete,
        onRowClick,
        onEdit,
        onSelect,
        onUsers,
        options,
        dataFunction,
    } = props;

    React.useEffect(() => {
        if (dataFunction) {
            let rowsPerPage = 10;
            if (options.hasOwnProperty("rowsPerPage")) {
                rowsPerPage = options["rowsPerPage"];
            }
            dataFunction({
                    page: 0,
                    page_size: rowsPerPage,
                })
                .then(
                    (data) => {
                        setCount(data.count)
                        setLoadedData(data.results)
                    },
                    (response) => {
                        console.log(response);
                        setLoadedData([])
                    }
                );
        }
    }, []);

    let defaultOptions = {
        textLabels: {
            body: {
                noMatch: t("TABLE_BODY_NO_MATCH"),
                toolTip: t("TABLE_BODY_TOOL_TIP"),
                columnHeaderTooltip: (column) => t("TABLE_BODY_COLUMN_HEADER_TOOLTIP") + " " + column.label,
            },
            pagination: {
                next: t("TABLE_PAGINATION_NEXT"),
                previous: t("TABLE_PAGINATION_PREVIOUS"),
                rowsPerPage: t("TABLE_PAGINATION_ROWS_PER_PAGE"),
                displayRows: t("TABLE_PAGINATION_DISPLAY_ROWS"),
            },
            toolbar: {
                search: t("TABLE_TOOLBAR_SEARCH"),
                downloadCsv: t("TABLE_TOOLBAR_DOWNLOAD_CSV"),
                print: t("TABLE_TOOLBAR_PRINT"),
                viewColumns: t("TABLE_TOOLBAR_VIEW_COLUMNS"),
                filterTable: t("TABLE_TOOLBAR_FILTER_TABLE"),
            },
            filter: {
                all: t("TABLE_FILTER_ALL"),
                title: t("TABLE_FILTER_TITLE"),
                reset: t("TABLE_FILTER_RESET"),
            },
            viewColumns: {
                title: t("TABLE_VIEW_COLUMNS_TITLE"),
                titleAria: t("TABLE_VIEW_COLUMNS_TITLE_ARIA"),
            },
            selectedRows: {
                text: t("TABLE_SELECTED_ROWS_TEXT"),
                delete: t("TABLE_SELECTED_ROWS_DELETE"),
                deleteAria: t("TABLE_SELECTED_ROWS_DELETE_ARIA"),
            },
        },
        filter: false,
        print: false,
        download: false,
        selectableRows: "none",
        setTableProps: () => {
            return {
                padding: "none",
                size: "small",
            };
        },
        onRowClick: onRowClick,
    };

    if (dataFunction) {
        defaultOptions["serverSide"] = true;
        defaultOptions["count"] = count;
        defaultOptions["onTableChange"] = (action, tableState) => {
            let ordering;
            if (tableState.sortOrder.hasOwnProperty("name")) {
                for (let i = 0; i < tableState.columns.length; i++) {
                    if (tableState.columns[i].name === tableState.sortOrder["name"]) {
                        if (tableState.sortOrder["direction"] === "asc") {
                            ordering = tableState.columns[i].id;
                        } else {
                            ordering = "-" + tableState.columns[i].id;
                        }
                        break;
                    }
                }
            }
            if (
                ["changePage", "sort", "search", "changeRowsPerPage", "changePage", "filterChange"].includes(action)
            ) {
                const params = {
                    page: tableState.page,
                    page_size: tableState.rowsPerPage,
                };
                if (ordering) {
                    params["ordering"] = ordering;
                }
                if (tableState.searchText) {
                    params["search"] = tableState.searchText;
                }
                dataFunction(params).then(
                    (data) => {
                        setCount(data.count);
                        setLoadedData(data.results);
                    },
                    (response) => {
                        console.log(response);
                        setLoadedData([]);
                    }
                );
            } else {
                //console.log("action not handled.", action);
            }
        };
    }

    if (onCreate) {
        defaultOptions["customToolbar"] = () => {
            return (
                <Tooltip title={t("CREATE")}>
                    <IconButton onClick={onCreate} size="large">
                        <AddIcon />
                    </IconButton>
                </Tooltip>
            );
        };
    }

    let modifiedColumns = columns;

    if (onSelect) {
        modifiedColumns.push({
            name: t("SELECT"),
            options: {
                filter: true,
                sort: false,
                empty: true,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                onSelect(tableMeta.rowData);
                            }}
                            size="large">
                            <RadioButtonUnchecked />
                        </IconButton>
                    );
                },
            },
        });
    }

    if (onEdit) {
        modifiedColumns.push({
            name: t("EDIT"),
            options: {
                filter: true,
                sort: false,
                empty: true,
                customHeadLabelRender: () => null,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                onEdit(tableMeta.rowData);
                            }}
                            size="large">
                            <EditIcon />
                        </IconButton>
                    );
                },
            },
        });
    }

    if (onUsers) {
        modifiedColumns.push({
            name: t("USERS"),
            options: {
                filter: true,
                sort: false,
                empty: true,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                onUsers(tableMeta.rowData);
                            }}
                            size="large">
                            <PeopleIcon />
                        </IconButton>
                    );
                },
            },
        });
    }

    if (onDelete) {
        modifiedColumns.push({
            name: t("DELETE"),
            options: {
                filter: true,
                sort: false,
                empty: true,
                customHeadLabelRender: () => null,
                customBodyRender: (value, tableMeta, updateValue) => {
                    return (
                        <IconButton
                            onClick={() => {
                                onDelete(tableMeta.rowData);
                            }}
                            size="large">
                            <DeleteIcon />
                        </IconButton>
                    );
                },
            },
        });
    }

    return (
        <MUIDataTable
            className={classes.muiDataTable}
            title={title}
            data={data || loadedData}
            columns={modifiedColumns}
            options={Object.assign({}, defaultOptions, options)}
        />
    );

}

Table.propTypes = {
    title: PropTypes.string,
    data: PropTypes.array,
    columns: PropTypes.array.isRequired,
    options: PropTypes.object.isRequired,
    dataFunction: PropTypes.func,
    onCreate: PropTypes.func,
    onDelete: PropTypes.func,
    onRowClick: PropTypes.func,
    onSelect: PropTypes.func,
    onEdit: PropTypes.func,
    onUsers: PropTypes.func,
};

export default Table;
