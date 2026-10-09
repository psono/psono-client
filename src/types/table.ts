import type {
	MUIDataTableColumn,
	MUIDataTableColumnOptions,
	MUIDataTableMeta,
	MUIDataTableOptions,
	MUIDataTableState,
} from "mui-datatables";
import type { MouseEventHandler, ReactNode } from "react";

export type TableRow = readonly unknown[];

export type TableMeta<Row extends TableRow = unknown[]> = Omit<
	MUIDataTableMeta,
	"rowData"
> & { rowData: Row };

export type TableColumnOptions<Row extends TableRow = unknown[]> = Omit<
	MUIDataTableColumnOptions,
	"customBodyRender" | "sortCompare"
> & {
	customBodyRender?: (
		value: Row[number],
		tableMeta: TableMeta<Row>,
		updateValue: (value: string) => void,
	) => ReactNode;
	sortCompare?: (
		order: "asc" | "desc",
	) => (
		a: { data: Row[number]; rowData: Row },
		b: { data: Row[number]; rowData: Row },
	) => number;
};

export type TableColumn<Row extends TableRow = unknown[]> = Omit<
	MUIDataTableColumn,
	"options"
> & {
	/** Server-side ordering field carried through by mui-datatables. */
	id?: string;
	options?: TableColumnOptions<Row>;
};

export type TableOptions = MUIDataTableOptions;

export type TableState = Omit<MUIDataTableState, "columns"> & {
	columns: (MUIDataTableState["columns"][number] & { id?: string })[];
};

export interface TableDataParams {
	page: number;
	page_size: number | undefined;
	ordering?: string;
	search?: string;
}

export interface TableDataResult<Data> {
	count: number;
	results: Data[];
}

export interface TableProps<
	Row extends TableRow = unknown[],
	Data extends object = Row,
> {
	title?: string;
	data?: Data[] | null;
	columns: TableColumn<Row>[];
	options: TableOptions;
	dataFunction?: (params: TableDataParams) => Promise<TableDataResult<Data>>;
	onCreate?: MouseEventHandler<HTMLButtonElement> | null;
	onDelete?: (row: Row) => void;
	/** mui-datatables supplies display data here, unlike the raw action rows. */
	onRowClick?: MUIDataTableOptions["onRowClick"];
	onSelect?: (row: Row) => void;
	onEdit?: (row: Row) => void;
	onUsers?: (row: Row) => void;
}
