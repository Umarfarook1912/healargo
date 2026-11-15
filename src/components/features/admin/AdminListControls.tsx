"use client";

import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_LIST, ADMIN_PAGE_SIZES } from "@/constants/admin-list";
import { cn } from "@/lib/utils/cn";
import type { AdminListControlsState } from "@/types/admin-list";

const fieldClass =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-dark transition-colors hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/12";

const labelClass = "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted";

export function AdminListControls({ list }: { list: AdminListControlsState }) {
  const filtering = Boolean(list.query.trim()) || list.filters.some((filter) => filter.value);

  function clearFilters() {
    list.setQuery("");
    list.filters.forEach((filter) => {
      if (filter.value) filter.setValue("");
    });
  }

  return (
    <div className="mb-4 surface-card p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className={labelClass}>{ADMIN_LIST.search}</span>
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={list.query}
              onChange={(event) => list.setQuery(event.target.value)}
              placeholder={ADMIN_LIST.searchPlaceholder}
              aria-label={ADMIN_LIST.search}
              className="pl-9"
            />
          </span>
        </label>
        {list.filters.map((filter) => (
          <label key={filter.id} className="flex w-full flex-col gap-1.5 lg:w-44">
            <span className={labelClass}>{filter.label}</span>
            <select
              aria-label={filter.label}
              className={cn(fieldClass, filter.value && "border-primary bg-primary-soft")}
              value={filter.value}
              onChange={(event) => filter.setValue(event.target.value)}
            >
              <option value="">{filter.allLabel}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="flex w-full flex-col gap-1.5 lg:w-28">
          <span className={labelClass}>{ADMIN_LIST.rows}</span>
          <select
            aria-label={ADMIN_LIST.show}
            className={fieldClass}
            value={list.pageSize}
            onChange={(event) => list.setPageSize(Number(event.target.value))}
          >
            {ADMIN_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        {filtering ? (
          <Button type="button" variant="outline" className="h-11" onClick={clearFilters}>
            <X className="h-4 w-4" />
            {ADMIN_LIST.clear}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function AdminListPagination({ list }: { list: AdminListControlsState }) {
  const pages = pageWindow(list.page, list.pageCount);

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">{ADMIN_LIST.range(list.from, list.to, list.total)}</p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-9 w-9"
          aria-label={ADMIN_LIST.previous}
          disabled={list.page <= 1}
          onClick={() => list.setPage(list.page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((page) => (
          <Button
            key={page}
            type="button"
            size="sm"
            variant={page === list.page ? "default" : "outline"}
            aria-current={page === list.page ? "page" : undefined}
            onClick={() => list.setPage(page)}
          >
            {page}
          </Button>
        ))}
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-9 w-9"
          aria-label={ADMIN_LIST.next}
          disabled={list.page >= list.pageCount}
          onClick={() => list.setPage(list.page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function pageWindow(page: number, pageCount: number) {
  const width = ADMIN_LIST.pageWindow;
  const end = Math.min(pageCount, Math.max(page + 2, width));
  const start = Math.max(1, end - width + 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
