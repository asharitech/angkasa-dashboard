import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DASHBOARD_CARD_SHELL_SOFT,
  DASHBOARD_PLACEHOLDER_SHELL,
} from "@/lib/dashboard-card-shell";
import { cn } from "@/lib/utils";

type CellAlign = "left" | "right" | "center" | undefined;

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: CellAlign;
  className?: string;
  headerClassName?: string;
  /** Default true; set false for long text / descriptions. */
  nowrap?: boolean;
};

/** @alias DataTableColumn */
export type Column<T> = DataTableColumn<T>;

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  empty?: ReactNode;
  minWidth?: number;
  className?: string;
  bleedMobile?: boolean;
  framed?: boolean;
  compact?: boolean;
  caption?: ReactNode;
  footer?: ReactNode;
  /** Extra classes on each body row (e.g. muted row when data missing). */
  getRowClassName?: (row: T, index: number) => string | undefined;
  /** Body colspan row when `rows` is empty and `empty` is not set (still renders table shell). */
  emptyRowsLabel?: ReactNode;
};

function headAlignClass(align: CellAlign): string {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

function cellAlignClass(align: CellAlign): string {
  if (align === "right") return "text-right tabular-nums";
  if (align === "center") return "text-center";
  return "text-left";
}

/**
 * Declarative data table on shared UI primitives — reuse on any page that needs tabular data.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  minWidth = 640,
  className,
  bleedMobile = true,
  framed = false,
  compact = false,
  caption,
  footer,
  getRowClassName,
  emptyRowsLabel = "Tidak ada baris.",
}: DataTableProps<T>) {
  if (rows.length === 0 && empty != null) {
    return (
      <div
        className={cn(
          DASHBOARD_PLACEHOLDER_SHELL,
          "flex min-h-[12rem] items-center justify-center px-4 py-8",
          bleedMobile && "-mx-4 md:mx-0",
          framed && "shadow-sm",
          className,
        )}
      >
        {empty}
      </div>
    );
  }

  const headCell = compact ? "h-9 px-3 py-2 text-[11px]" : "h-11 px-3 py-2.5 text-xs";
  const bodyCell = compact ? "px-3 py-2" : "px-3 py-2.5";

  const table = (
    <Table className="w-full text-sm" style={{ minWidth: `${minWidth}px` }}>
      {caption != null ? (
        <caption className="border-b border-border/50 bg-muted/30 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
          {caption}
        </caption>
      ) : null}
      <TableHeader>
        <TableRow className="border-border/60 hover:bg-transparent">
          {columns.map((c) => (
            <TableHead
              key={c.key}
              className={cn(
                headCell,
                "bg-muted/45 font-semibold tracking-wide text-muted-foreground",
                headAlignClass(c.align),
                c.nowrap !== false && "whitespace-nowrap",
                c.headerClassName,
              )}
            >
              {c.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
              {emptyRowsLabel}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, idx) => (
            <TableRow
              key={rowKey(row, idx)}
              className={cn(
                "border-border/50 transition-colors hover:bg-muted/35",
                getRowClassName?.(row, idx),
              )}
            >
              {columns.map((c) => (
                <TableCell
                  key={c.key}
                  className={cn(
                    bodyCell,
                    "align-middle text-foreground",
                    cellAlignClass(c.align),
                    c.nowrap !== false && "whitespace-nowrap",
                    c.className,
                  )}
                >
                  {c.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
      {footer != null ? (
        <TableFooter className="border-t border-border/60 bg-muted/25 font-medium">{footer}</TableFooter>
      ) : null}
    </Table>
  );

  return (
    <div
      className={cn(
        bleedMobile && "-mx-4 md:mx-0",
        framed && cn(DASHBOARD_CARD_SHELL_SOFT, "overflow-hidden"),
        className,
      )}
    >
      {table}
    </div>
  );
}
