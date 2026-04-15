"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X, AlertTriangle } from "lucide-react";
import { formatStatusLabel } from "@/lib/names";
import type { Obligation } from "@/lib/types";

interface ObligationSearchProps {
  obligations: Obligation[];
  onFilteredChange: (filtered: Obligation[]) => void;
  duplicateAmounts?: number[];
}

export function ObligationSearch({
  obligations,
  onFilteredChange,
  duplicateAmounts = []
}: ObligationSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [requestorFilter, setRequestorFilter] = useState<string>("all");
  const [amountRange, setAmountRange] = useState<string>("all");
  const [showDuplicates, setShowDuplicates] = useState(false);

  const categories = useMemo(() => {
    const unique = new Set(obligations.map(o => o.category).filter(Boolean));
    return Array.from(unique).sort();
  }, [obligations]);

  const requestors = useMemo(() => {
    const unique = new Set(obligations.map(o => o.requestor).filter(Boolean));
    return Array.from(unique).sort();
  }, [obligations]);

  const statuses = useMemo(() => {
    const unique = new Set(obligations.map(o => o.status).filter(Boolean));
    return Array.from(unique).sort();
  }, [obligations]);

  const filteredObligations = useMemo(() => {
    let filtered = obligations;

    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.item?.toLowerCase().includes(term) ||
        o.requestor?.toLowerCase().includes(term) ||
        o.category?.toLowerCase().includes(term) ||
        o.sumber_dana?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(o => o.category === categoryFilter);
    }

    // Requestor filter
    if (requestorFilter !== "all") {
      filtered = filtered.filter(o => o.requestor === requestorFilter);
    }

    // Amount range filter
    if (amountRange !== "all") {
      filtered = filtered.filter(o => {
        const amount = o.amount ?? 0;
        switch (amountRange) {
          case "small": return amount < 1000000; // < 1M
          case "medium": return amount >= 1000000 && amount < 10000000; // 1M - 10M
          case "large": return amount >= 10000000; // >= 10M
          default: return true;
        }
      });
    }

    // Duplicate filter
    if (showDuplicates && duplicateAmounts.length > 0) {
      filtered = filtered.filter(o =>
        duplicateAmounts.includes(o.amount ?? 0)
      );
    }

    return filtered;
  }, [obligations, searchTerm, statusFilter, categoryFilter, requestorFilter, amountRange, showDuplicates, duplicateAmounts]);

  // Update parent component when filtered results change
  useMemo(() => {
    onFilteredChange(filteredObligations);
  }, [filteredObligations, onFilteredChange]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setRequestorFilter("all");
    setAmountRange("all");
    setShowDuplicates(false);
  };

  const activeFiltersCount = [
    searchTerm,
    statusFilter !== "all" ? statusFilter : null,
    categoryFilter !== "all" ? categoryFilter : null,
    requestorFilter !== "all" ? requestorFilter : null,
    amountRange !== "all" ? amountRange : null,
    showDuplicates ? "duplicates" : null
  ].filter(Boolean).length;

  const duplicateWarning = duplicateAmounts.length > 0;

  return (
    <div className="space-y-4">
      {/* Warning for duplicates */}
      {duplicateWarning && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">
                  Duplikasi Terdeteksi
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Ditemukan {duplicateAmounts.length} jumlah yang sama.
                  <Button
                    variant="link"
                    size="sm"
                    className="text-amber-700 p-0 h-auto underline font-semibold ml-1"
                    onClick={() => setShowDuplicates(!showDuplicates)}
                  >
                    {showDuplicates ? "Sembunyikan" : "Lihat"} duplikasi
                  </Button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari item, requestor, kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || "all")}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>
                {formatStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category filter */}
        <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value || "all")}>
          <SelectTrigger>
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Requestor filter */}
        <Select value={requestorFilter} onValueChange={(value) => setRequestorFilter(value || "all")}>
          <SelectTrigger>
            <SelectValue placeholder="Requestor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Requestor</SelectItem>
            {requestors.map(requestor => (
              <SelectItem key={requestor} value={requestor}>
                {requestor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Amount range filter */}
        <Select value={amountRange} onValueChange={(value) => setAmountRange(value || "all")}>
          <SelectTrigger>
            <SelectValue placeholder="Rentang Jumlah" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Jumlah</SelectItem>
            <SelectItem value="small">{"< Rp 1,000,000"}</SelectItem>
            <SelectItem value="medium">Rp 1,000,000 - 10,000,000</SelectItem>
            <SelectItem value="large">{"> Rp 10,000,000"}</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear filters button */}
        {activeFiltersCount > 0 && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Hapus Filter ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Results summary */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Menampilkan {filteredObligations.length} dari {obligations.length} pengajuan
        </span>
        {showDuplicates && (
          <Badge variant="outline" className="text-amber-700 border-amber-300">
            Hanya Duplikasi
          </Badge>
        )}
      </div>
    </div>
  );
}