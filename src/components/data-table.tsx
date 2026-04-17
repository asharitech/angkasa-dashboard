import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  headerClassName?: string;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  minWidth = 640,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, idx: number) => string;
  empty?: React.ReactNode;
  minWidth?: number;
  className?: string;
}) {
  if (rows.length === 0 && empty) {
    return <div className="py-6">{empty}</div>;
  }
  return (
    <div className={cn("-mx-4 overflow-x-auto md:mx-0", className)}>
      <table
        className="w-full text-sm"
        style={{ minWidth: `${minWidth}px` }}
      >
        <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "px-3 py-2 font-medium",
                  c.align === "right" && "text-right",
                  c.align === "center" && "text-center",
                  c.align !== "right" && c.align !== "center" && "text-left",
                  c.headerClassName,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, idx) => (
            <tr key={rowKey(row, idx)} className="hover:bg-muted/30">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "px-3 py-2 align-top",
                    c.align === "right" && "text-right tabular-nums",
                    c.align === "center" && "text-center",
                    c.className,
                  )}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
