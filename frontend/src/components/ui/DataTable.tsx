import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  sortable?: boolean
  className?: string
  /** Hide below this breakpoint to keep tables usable on small screens. */
  hideBelow?: 'md' | 'lg'
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  onRowClick?: (row: T) => void
  caption: string
}

const hide = { md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' }

export function DataTable<T>({ columns, rows, rowKey, sortKey, sortDir, onSort, onRowClick, caption }: Props<T>) {
  return (
    <div className="glass overflow-hidden rounded-3xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-white/8 text-xs uppercase tracking-wider text-slate-400">
              {columns.map((c) => {
                const active = sortKey === c.key
                return (
                  <th key={c.key} scope="col" aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined} className={cn('px-4 py-3.5 font-medium', c.hideBelow && hide[c.hideBelow], c.className)}>
                    {c.sortable && onSort ? (
                      <button onClick={() => onSort(c.key)} className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-white">
                        {c.header}
                        {active ? sortDir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ChevronsUpDown className="size-3 opacity-50" />}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={rowKey(r)}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cn('border-b border-white/5 last:border-0 transition-colors hover:bg-white/[.04]', onRowClick && 'cursor-pointer')}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-4 py-3.5 text-slate-200', c.hideBelow && hide[c.hideBelow], c.className)}>
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
