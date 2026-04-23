"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startNewSewaPeriodAction } from "@/lib/actions/sewa";

export function SewaStartTahapButton() {
  const [pending, start] = useTransition();

  const handleStart = () => {
    if (!confirm("Yakin ingin memulai tahap sewa baru? Ledger saat ini akan diarsipkan.")) return;
    
    start(async () => {
      const res = await startNewSewaPeriodAction();
      if ("error" in res) {
        alert(res.error);
      }
    });
  };

  return (
    <Button 
      className="btn btn--primary" 
      onClick={handleStart} 
      disabled={pending}
    >
      {pending ? <Loader2 className="btn__icon animate-spin" /> : <Plus className="btn__icon" />}
      Mulai tahap baru
    </Button>
  );
}
