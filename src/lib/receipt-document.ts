import { formatDateTime, formatINR, methodLabel } from "./format";
import type { Payment, Receipt, School, Student } from "./types";

export type ReceiptLineItem = {
  name: string;
  amount: number;
};

export type ReceiptDocumentInput = {
  school: School;
  student: Student;
  receipt: Receipt;
  payment: Payment;
  parentName?: string;
  lineItems?: ReceiptLineItem[];
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildReceiptHtml(input: ReceiptDocumentInput): string {
  const { school, student, receipt, payment, parentName, lineItems } = input;
  const items =
    lineItems && lineItems.length > 0
      ? lineItems
      : [{ name: "School fee payment", amount: receipt.amount }];
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.name)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatINR(item.amount)}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Fee Receipt ${escapeHtml(receipt.receiptNo)}</title>
  <style>
    body { font-family: "IBM Plex Sans", Arial, sans-serif; color: #0a0c10; margin: 0; background: #f4f6f8; }
    .sheet { max-width: 720px; margin: 32px auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
    .head { background: #0a0c10; color: #fff; padding: 28px 32px; }
    .head h1 { margin: 0; font-size: 28px; letter-spacing: -0.04em; }
    .head p { margin: 8px 0 0; opacity: 0.65; font-size: 14px; }
    .body { padding: 28px 32px 36px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 0 0 4px; }
    .value { margin: 0; font-size: 15px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    .total { display: flex; justify-content: space-between; align-items: baseline; margin-top: 20px; padding-top: 16px; border-top: 2px solid #0a0c10; }
    .stamp { margin-top: 28px; display: inline-block; padding: 8px 14px; border: 2px solid #00a67e; color: #00a67e; font-weight: 700; border-radius: 8px; letter-spacing: 0.04em; }
    .foot { margin-top: 28px; font-size: 12px; color: #64748b; line-height: 1.5; }
    @media print {
      body { background: #fff; }
      .sheet { margin: 0; border: none; border-radius: 0; }
      .actions { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <h1>${escapeHtml(school.name)}</h1>
      <p>Official fee receipt · ${escapeHtml(school.city)} · GSTIN ${escapeHtml(school.gstin)}</p>
    </div>
    <div class="body">
      <div class="meta">
        <div>
          <p class="label">Receipt no.</p>
          <p class="value">${escapeHtml(receipt.receiptNo)}</p>
        </div>
        <div>
          <p class="label">Issued</p>
          <p class="value">${formatDateTime(receipt.issuedAt)}</p>
        </div>
        <div>
          <p class="label">Student</p>
          <p class="value">${escapeHtml(student.name)}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#64748b;">${escapeHtml(student.admissionNo)} · ${escapeHtml(student.className)}-${escapeHtml(student.section)}</p>
        </div>
        <div>
          <p class="label">Paid by</p>
          <p class="value">${escapeHtml(parentName || student.parentName)}</p>
        </div>
        <div>
          <p class="label">Transaction</p>
          <p class="value">${escapeHtml(payment.transactionId)}</p>
        </div>
        <div>
          <p class="label">Method</p>
          <p class="value">${escapeHtml(methodLabel(payment.method))} · ${escapeHtml(String(payment.gateway))}</p>
        </div>
      </div>

      <p class="label">Fee particulars</p>
      <table>
        <tbody>${rows}</tbody>
      </table>

      <div class="total">
        <div>
          <p class="label">GST component</p>
          <p class="value">${formatINR(receipt.gstAmount)}</p>
        </div>
        <div style="text-align:right;">
          <p class="label">Amount paid</p>
          <p style="margin:0;font-size:28px;font-weight:800;letter-spacing:-0.04em;">${formatINR(receipt.amount)}</p>
        </div>
      </div>

      <div class="stamp">PAID</div>
      <p class="foot">
        This is a computer-generated fee receipt from EduFee360. Keep it for your records.
        Academic session ${escapeHtml(school.academicSession)}.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function downloadFeeReceipt(input: ReceiptDocumentInput) {
  const html = buildReceiptHtml(input);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${input.receipt.receiptNo}-fee-receipt.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function openFeeReceipt(input: ReceiptDocumentInput, autoPrint = false) {
  const html = buildReceiptHtml(input);
  const win = window.open("", "_blank", "noopener,noreferrer,width=820,height=900");
  if (!win) {
    downloadFeeReceipt(input);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  if (autoPrint) {
    win.focus();
    window.setTimeout(() => win.print(), 350);
  }
}
