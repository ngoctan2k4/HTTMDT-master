"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Loader2, RefreshCw, Search, XCircle } from "lucide-react";

type Payment = {
  _id: string;
  orderCode: string;
  packageName: string;
  amount: number;
  originalPrice: number;
  finalPrice: number;
  status: "pending" | "success" | "failed" | "expired";
  confirmedBy?: string;
  bankReference?: string;
  createdAt: string;
  paidAt?: string | null;
  userId?: { name?: string; email?: string };
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "d";
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: "10",
        search,
      });
      if (status) qs.set("status", status);
      const res = await fetch(`/api/admin/payments?${qs.toString()}`);
      const data = await res.json();
      setPayments(data.payments || []);
      setTotalPages(data.totalPages || 1);
      setTotalPayments(data.totalPayments || 0);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const timer = setTimeout(fetchPayments, 300);
    return () => clearTimeout(timer);
  }, [fetchPayments]);

  async function updatePayment(id: string, action: "confirm" | "fail") {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error || "Khong the cap nhat giao dich");
      await fetchPayments();
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Giao dich V-Coin</h2>
          <p className="text-muted-foreground mt-1">Tong cong {totalPayments} giao dich nap luot dang tin</p>
        </div>
        <button
          onClick={fetchPayments}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Tai lai
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tim ma giao dich..."
            className="h-10 w-full rounded-md border bg-background pl-9 pr-4 text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Tat ca trang thai</option>
          <option value="pending">Dang cho</option>
          <option value="success">Thanh cong</option>
          <option value="failed">That bai</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Ma</th>
              <th className="px-4 py-3 text-left font-semibold">Khach hang</th>
              <th className="px-4 py-3 text-left font-semibold">Goi</th>
              <th className="px-4 py-3 text-left font-semibold">So tien</th>
              <th className="px-4 py-3 text-left font-semibold">Trang thai</th>
              <th className="px-4 py-3 text-center font-semibold">Thao tac</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-muted-foreground">Khong co giao dich.</td>
              </tr>
            ) : payments.map((payment) => (
              <tr key={payment._id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-mono font-bold text-slate-800">{payment.orderCode}</div>
                  <div className="text-xs text-muted-foreground">{new Date(payment.createdAt).toLocaleString("vi-VN")}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{payment.userId?.name || "Khach hang"}</div>
                  <div className="text-xs text-muted-foreground">{payment.userId?.email || ""}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{payment.packageName}</div>
                  <div className="text-xs text-muted-foreground">+{payment.amount} luot dang</div>
                </td>
                <td className="px-4 py-3 font-bold text-emerald-700">{formatCurrency(payment.finalPrice)}</td>
                <td className="px-4 py-3">
                  <span className={[
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold",
                    payment.status === "success" ? "bg-green-100 text-green-700" : "",
                    payment.status === "pending" ? "bg-amber-100 text-amber-700" : "",
                    payment.status === "failed" ? "bg-red-100 text-red-700" : "",
                    payment.status === "expired" ? "bg-slate-100 text-slate-700" : "",
                  ].join(" ")}>
                    {payment.status === "success" ? `Thanh cong ${payment.confirmedBy ? `(${payment.confirmedBy})` : ""}` : null}
                    {payment.status === "pending" ? "Dang cho" : null}
                    {payment.status === "failed" ? "That bai" : null}
                    {payment.status === "expired" ? "Het han" : null}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {payment.status === "pending" ? (
                    <div className="flex justify-center gap-2">
                      <button
                        disabled={actionLoading === payment._id}
                        onClick={() => updatePayment(payment._id, "confirm")}
                        className="inline-flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Xac nhan
                      </button>
                      <button
                        disabled={actionLoading === payment._id}
                        onClick={() => updatePayment(payment._id, "fail")}
                        className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" />
                        Huy
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-xs text-muted-foreground">
                      {payment.paidAt ? new Date(payment.paidAt).toLocaleString("vi-VN") : "-"}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border px-3 py-1 text-sm disabled:opacity-50">Truoc</button>
          <span className="text-sm text-muted-foreground">Trang {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md border px-3 py-1 text-sm disabled:opacity-50">Tiep</button>
        </div>
      )}
    </div>
  );
}
