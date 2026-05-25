"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Loader2, Star, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type AppointmentActionButtonsProps = {
    appointmentId: string;
    status: string;
    isBuyer: boolean;
    isSeller: boolean;
    appointmentDate: string;
};

export function AppointmentActionButtons({
    appointmentId,
    status,
    isBuyer,
    isSeller,
    appointmentDate,
}: AppointmentActionButtonsProps) {
    const router = useRouter();
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const hasReachedAppointmentTime = useMemo(() => {
        return new Date(appointmentDate).getTime() <= Date.now();
    }, [appointmentDate]);

    const patchAppointment = async (action: "confirm" | "cancel") => {
        const confirmMessage =
            action === "confirm"
                ? "Xác nhận lịch hẹn này với khách?"
                : "Bạn có chắc chắn muốn hủy lịch hẹn này?";
        if (!confirm(confirmMessage)) return;

        setLoadingAction(action);
        try {
            const res = await fetch(`/api/appointments/${appointmentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(data.error || "Không thể xử lý lịch hẹn.");
                return;
            }
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Không thể xử lý lịch hẹn.");
        } finally {
            setLoadingAction(null);
        }
    };

    const completeAppointment = async () => {
        if (!hasReachedAppointmentTime) {
            alert("Chưa tới giờ hẹn nên chưa thể xác nhận đã xem nhà.");
            return;
        }

        const ratingRaw = prompt("Bạn chấm buổi xem nhà mấy điểm? Nhập từ 1 đến 5.", "5");
        if (ratingRaw === null) return;

        const rating = Number(ratingRaw);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            alert("Điểm đánh giá phải là số nguyên từ 1 đến 5.");
            return;
        }

        const notes = prompt("Ghi chú thêm sau buổi xem nhà (có thể bỏ trống):", "") || "";
        const isFraud = confirm("Bạn có muốn báo cáo tin này là sai sự thật/lừa đảo sau buổi xem không?");

        setLoadingAction("complete");
        try {
            const res = await fetch(`/api/appointments/${appointmentId}/complete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating, notes, isFraud }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(data.error || "Không thể hoàn tất lịch hẹn.");
                return;
            }
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Không thể hoàn tất lịch hẹn.");
        } finally {
            setLoadingAction(null);
        }
    };

    if (status === "completed") {
        return <span className="text-sm font-medium text-green-600">Lịch hẹn đã hoàn tất.</span>;
    }

    if (status === "cancelled") {
        return <span className="text-sm font-medium text-red-600">Lịch hẹn đã bị hủy.</span>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {isSeller && status === "pending" && (
                <button
                    type="button"
                    onClick={() => patchAppointment("confirm")}
                    disabled={loadingAction !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
                >
                    {loadingAction === "confirm" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Xác nhận lịch
                </button>
            )}

            {((isBuyer && ["pending", "confirmed"].includes(status)) || (isSeller && status === "pending")) && (
                <button
                    type="button"
                    onClick={() => patchAppointment("cancel")}
                    disabled={loadingAction !== null}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
                >
                    {loadingAction === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    {isSeller ? "Từ chối lịch" : "Hủy lịch"}
                </button>
            )}

            {isBuyer && status === "confirmed" && (
                <button
                    type="button"
                    onClick={completeAppointment}
                    disabled={loadingAction !== null || !hasReachedAppointmentTime}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                    title={!hasReachedAppointmentTime ? "Chưa tới giờ hẹn" : "Xác nhận đã xem nhà"}
                >
                    {loadingAction === "complete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                    Đã xem nhà
                </button>
            )}

            {isSeller && status === "confirmed" && (
                <span className="text-sm font-medium text-blue-600">Đã xác nhận, chờ khách tới xem.</span>
            )}
        </div>
    );
}
