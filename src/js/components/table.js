import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/styles";

import MUIDataTable from "mui-datatables";
import { compose } from "redux";
import { withTranslation } from "react-i18next";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import AddIcon from "@material-ui/icons/Add";
import EditIcon from "@material-ui/icons/Edit";
import RadioButtonUnchecked from "@material-ui/icons/RadioButtonUnchecked";
import PeopleIcon from "@material-ui/icons/People";
import DeleteIcon from "@material-ui/icons/Delete";

const styles = (theme) => ({});

class Table extends Component {
    state = {
        count: 1,
        data: [],
    };
    componentDidMount() {
        if (this.props.dataFunction) {
            let rowsPerPage = 10;
            if (this.props.options.hasOwnProperty("rowsPerPage")) {
                rowsPerPage = this.props.options["rowsPerPage"];
            }
            this.props
                .dataFunction({
                    page: 0,
                    page_size: rowsPerPage,
                })
                .then(
                    (data) => {
                        this.setState({
                            count: data.count,
                            data: data.results,
                        });
                    },
                    (response) => {
                        console.log(response);
                        this.setState({ data: [] });
                    }
                );
        }
    }

    render() {
        const { classes, title, data, columns, onCreate, onDelete, onRowClick, onEdit, onSelect, onUsers, options, dataFunction, t } = this.props;

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
            defaultOptions["count"] = this.state.count;
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
                if (["changePage", "sort", "search", "changeRowsPerPage", "changePage", "filterChange"].includes(action)) {
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
                            this.setState({
                                count: data.count,
                                data: data.results,
                            });
                        },
                        (response) => {
                            console.log(response);
                            this.setState({ data: [] });
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
                        <IconButton onClick={onCreate}>
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
                            >
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
                    customBodyRender: (value, tableMeta, updateValue) => {
                        return (
                            <IconButton
                                onClick={() => {
                                    onEdit(tableMeta.rowData);
                                }}
                            >
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
                            >
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
                    customBodyRender: (value, tableMeta, updateValue) => {
                        return (
                            <IconButton
                                onClick={() => {
                                    onDelete(tableMeta.rowData);
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        );
                    },
                },
            });
        }

        return <MUIDataTable title={title} data={data || this.state.data} columns={modifiedColumns} options={Object.assign({}, defaultOptions, options)} />;
    }
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

export default compose(withTranslation(), withStyles(styles))(Table);
