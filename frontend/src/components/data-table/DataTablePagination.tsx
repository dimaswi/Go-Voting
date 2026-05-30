import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const totalRows = table.getFilteredRowModel().rows.length
  const firstRow = Math.min(pageIndex * pageSize + 1, Math.max(1, totalRows))
  const lastRow = Math.min((pageIndex + 1) * pageSize, totalRows)
  const pageCount = table.getPageCount()
  const pages = Array.from({ length: pageCount }, (_, i) => i)

  return (
    <div className="flex items-center justify-between px-2 pt-4">
      <div className="flex-1 text-sm text-muted-foreground">
        Showing {totalRows > 0 ? `${firstRow}-${lastRow}` : '0'} of {totalRows} results
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">Rows</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px] bg-transparent border-muted">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            className="h-8 px-2 lg:px-3 text-muted-foreground hover:text-foreground"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          
          {pages.map(i => (
            <Button
              key={i}
              variant={pageIndex === i ? "default" : "ghost"}
              className={cn(
                "h-8 w-8 p-0",
                pageIndex === i ? "" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => table.setPageIndex(i)}
            >
              {i + 1}
            </Button>
          ))}

          <Button
            variant="ghost"
            className="h-8 px-2 lg:px-3 text-muted-foreground hover:text-foreground"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
