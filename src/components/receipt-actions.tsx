"use client";

import { Download, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui";
import {
  downloadFeeReceipt,
  openFeeReceipt,
  type ReceiptDocumentInput,
} from "@/lib/receipt-document";

export function ReceiptActions({
  document,
  size = "sm",
  emphasize,
}: {
  document: ReceiptDocumentInput | null;
  size?: "sm" | "md" | "lg";
  emphasize?: boolean;
}) {
  if (!document) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size={size}
        variant={emphasize ? "primary" : "soft"}
        onClick={() => openFeeReceipt(document)}
      >
        <FileText className="h-4 w-4" />
        Generate receipt
      </Button>
      <Button size={size} variant="soft" onClick={() => downloadFeeReceipt(document)}>
        <Download className="h-4 w-4" />
        Download
      </Button>
      <Button size={size} variant="ghost" onClick={() => openFeeReceipt(document, true)}>
        <Printer className="h-4 w-4" />
        Print / PDF
      </Button>
    </div>
  );
}
