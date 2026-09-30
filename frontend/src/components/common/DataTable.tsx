'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Settings2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

function shouldIgnoreRowClick(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      [
        '[role="dialog"]',
        '[data-row-click-ignore]',
        'button',
        'a',
        'input',
        'textarea',
        'select',
        '[role="button"]',
        '[role="tab"]',
        '[role="combobox"]',
        '[data-radix-popper-content-wrapper]',
      ].join(',')
    )
  );
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalCount?: number;
  pageIndex?: number;
  pageSize?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  isLoading?: boolean;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (rows: TData[]) => void;
  selectedRows?: RowSelectionState;
  onSelectionChange?: (selection: RowSelectionState) => void;
  toolbar?: React.ReactNode;
  toolbarActions?: React.ReactNode;
  emptyState?: React.ReactNode;
  getRowClassName?: (row: TData) => string | undefined;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalCount = 0,
  pageIndex = 0,
  pageSize = 10,
  pageCount = 1,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  isLoading,
  enableRowSelection,
  onRowSelectionChange,
  selectedRows: controlledRowSelection,
  onSelectionChange: controlledOnSelectionChange,
  toolbar,
  toolbarActions,
  emptyState,
  getRowClassName,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});
  const rowSelection = controlledRowSelection ?? internalRowSelection;
  const setRowSelection = controlledOnSelectionChange ?? setInternalRowSelection;

  const selectionColumn: ColumnDef<TData, unknown> = {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  };

  const tableColumns = enableRowSelection ? [selectionColumn, ...columns] : columns;

  const table = useReactTable({
    data,
    columns: tableColumns,
    manualPagination: true,
    manualSorting: true,
    pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex, pageSize },
    },
    enableRowSelection,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(newSelection);
      if (onRowSelectionChange) {
        const selectedRows = Object.keys(newSelection)
          .filter((k) => newSelection[k])
          .map((k) => data[parseInt(k)]);
        onRowSelectionChange(selectedRows);
      }
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
      if (newSorting.length > 0 && onSortChange) {
        onSortChange(newSorting[0].id, newSorting[0].desc ? 'desc' : 'asc');
      }
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      {(toolbar || toolbarActions || columnVisibility !== undefined) && (
        <div className="crm-table-toolbar flex flex-wrap items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{toolbar}</div>
          <div className="flex shrink-0 items-center gap-2">
            {toolbarActions}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="crm-select-trigger h-9 cursor-pointer gap-1.5 rounded-lg border-border/80 px-3">
                  <Settings2 className="h-3.5 w-3.5" />
                  Columns
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize text-xs"
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  >
                    {col.id.replace(/_/g, ' ')}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      )}

      {/* Selection info */}
      {enableRowSelection && selectedCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 border border-primary/20 px-3 py-2 rounded-lg">
          <span className="font-medium text-primary">{selectedCount}</span> row{selectedCount > 1 ? 's' : ''} selected
        </div>
      )}

      {/* Table */}
      <div className="crm-table-wrap overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
                {headerGroup.headers.map((header) => {
                  const size = header.getSize();
                  const minSize = header.column.columnDef.minSize;
                  const maxSize = header.column.columnDef.maxSize;
                  return (
                    <TableHead
                      key={header.id}
                      className="text-xs font-semibold uppercase tracking-wide text-muted-foreground h-11 whitespace-nowrap px-3"
                      style={{
                        width: size !== 150 ? size : undefined,
                        minWidth: minSize,
                        maxWidth: maxSize,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && data.length === 0 ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {tableColumns.map((col, j) => {
                    const size = col.size;
                    const minSize = col.minSize;
                    return (
                      <TableCell
                        key={j}
                        className="py-3 px-3"
                        style={{
                          width: size !== 150 ? size : undefined,
                          minWidth: minSize,
                        }}
                      >
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, idx) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={(event) => {
                    if (shouldIgnoreRowClick(event.target)) return;
                    onRowClick?.(row.original);
                  }}
                  className={cn(
                    'transition-colors',
                    idx % 2 === 0 ? 'bg-background' : 'bg-muted/30 dark:bg-muted/15',
                    'hover:bg-muted/50 dark:hover:bg-muted/30',
                    onRowClick && 'cursor-pointer',
                    row.getIsSelected() && 'bg-primary/10',
                    getRowClassName?.(row.original)
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const size = cell.column.getSize();
                    const minSize = cell.column.columnDef.minSize;
                    const maxSize = cell.column.columnDef.maxSize;
                    return (
                      <TableCell
                        key={cell.id}
                        className="py-2.5 px-3 align-middle"
                        style={{
                          width: size !== 150 ? size : undefined,
                          minWidth: minSize,
                          maxWidth: maxSize,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tableColumns.length} className="h-48 p-0">
                  {emptyState || (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      No results found
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="text-muted-foreground">
          Showing{' '}
          <span className="font-medium text-foreground">
            {totalCount === 0 ? 0 : pageIndex * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-medium text-foreground">
            {Math.min((pageIndex + 1) * pageSize, totalCount)}
          </span>{' '}
          of{' '}
          <span className="font-medium text-foreground">{totalCount}</span> results
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Rows:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange?.(Number(v))}
            >
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((s) => (
                  <SelectItem key={s} value={String(s)} className="text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange?.(0)}
              disabled={pageIndex === 0}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange?.(pageIndex - 1)}
              disabled={pageIndex === 0}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-3 py-1 text-xs font-medium">
              {pageIndex + 1} / {Math.max(1, pageCount)}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange?.(pageIndex + 1)}
              disabled={pageIndex >= pageCount - 1}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange?.(pageCount - 1)}
              disabled={pageIndex >= pageCount - 1}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
