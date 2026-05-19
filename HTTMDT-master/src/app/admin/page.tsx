"use client";

import { useEffect, useState } from "react";
import { Building2, CalendarCheck, ShieldAlert, BadgeCheck, Loader2, DatabaseZap } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart } from "recharts";
import { AdminTaskSummary } from "@/components/admin/AdminTaskSummary";

interface TimeSeriesData {
    date: string;
    posts: number;
    gmv: number;
}

interface DashboardData {
    o2oConversion: {
        listings: number;
        appointments: number;
        ratePercentage: string;
    };
    moderationAlerts: {
        fraudulentListingsLast24h: number;
    };
    verificationStatus: {
        verified: number;
        unverified: number;
        verifiedRatioPercentage: string;
    };
    heatmapLocations: {
        _id: string; // Tên khu vực
        appointmentCount: number;
    }[];
    timeSeries: TimeSeriesData[];
}

const COLORS = ['#00C49F', '#FF8042'];

export default function AdminDashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);

    // Default 30 days range
    const [startDate, setStartDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    const fetchData = () => {
        setLoading(true);
        fetch(`/api/admin/dashboard?startDate=${startDate}&endDate=${endDate}`)
            .then((res) => res.json())
            .then((json) => {
                if (json.success) setData(json.data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleGenerateData = async () => {
        if (!confirm("Hành động này sẽ Xóa các Lịch hẹn Demo cũ và sinh dữ liệu MỚI (Tin đăng & Lịch hẹn). Ban có chắc chắn?")) return;
        setSeeding(true);
        try {
            const res = await fetch("/api/admin/seed-demo", { method: "POST" });
            if (res.ok) {
                alert("Đã sinh dữ liệu ảo (GMV và Trạm Kiểm duyệt) thành công!");
                fetchData();
            } else {
                alert("Lỗi khi sinh dữ liệu!");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSeeding(false);
        }
    };

    if (loading && !data) {
        return <div className="w-full h-96 flex flex-col items-center justify-center gap-3"><Loader2 className="w-8 h-8 animate-spin text-primary" /> Đang tổng hợp dữ liệu...</div>;
    }

    if (!data) {
        return <div>Không có dữ liệu Aggregation.</div>;
    }

    // Transform heatmap data for Recharts
    const heatmapRecharts = data.heatmapLocations.map(item => ({
        name: item._id || "Chưa xác định",
        Appointments: item.appointmentCount
    }));

    // Transform verification data for PieChart
    const pieData = [
        { name: 'Đã xác thực (Verified)', value: data.verificationStatus.verified },
        { name: 'Chưa xác thực (Pending)', value: data.verificationStatus.unverified },
    ];

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">PropTech Analytics</h2>
                    <p className="text-sm text-muted-foreground mt-1">Báo cáo hiệu suất thực địa thời gian thực</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white rounded-lg border p-1 shadow-sm">
                        <input
                            type="date"
                            className="text-sm px-2 py-1 outline-none text-slate-700"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span className="text-muted-foreground text-xs">-</span>
                        <input
                            type="date"
                            className="text-sm px-2 py-1 outline-none text-slate-700"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                        <button
                            onClick={fetchData}
                            className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded font-medium hover:bg-slate-800"
                        >
                            Lọc
                        </button>
                    </div>

                    <button
                        onClick={handleGenerateData}
                        disabled={seeding}
                        className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                        title="Tạo Dữ liệu Mẫu (Tin đăng + GMV) cho bộ lọc hoạt động"
                    >
                        {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <DatabaseZap className="w-4 h-4" />}
                        <span className="hidden sm:inline">Sinh Data Mẫu</span>
                    </button>
                </div>
            </div>

            <AdminTaskSummary />

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Tổng số Tin đăng</h3>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold">{data.o2oConversion.listings}</div>
                    <p className="text-xs text-muted-foreground mt-1">Toàn thời gian toàn Database</p>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 relative overflow-hidden">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-primary">Tỉ lệ chuyển đổi (Listing → Appointment)</h3>
                        <CalendarCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-primary">{data.o2oConversion.ratePercentage}%</div>
                    <p className="text-xs text-muted-foreground mt-1">{data.o2oConversion.appointments} lượt dẫn khách xem thực tế</p>
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full -z-10 blur-xl" />
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 text-red-900 shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Cảnh báo Tin Ảo (24h)</h3>
                        <ShieldAlert className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">{data.moderationAlerts.fraudulentListingsLast24h}</div>
                    <p className="text-xs text-red-600/70 mt-1">Lượng BĐS bị Report lừa đảo</p>
                </div>

                <div className="rounded-xl border border-green-200 bg-green-50 text-green-900 shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Tỉ lệ Sạch (Verified)</h3>
                        <BadgeCheck className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">{data.verificationStatus.verifiedRatioPercentage}%</div>
                    <p className="text-xs text-green-600/70 mt-1">Dựa trên cơ sở xác minh hệ thống</p>
                </div>
            </div>

            {/* Doanh số & Lượt đăng */}
            <div className="rounded-xl border bg-card shadow-sm mt-6">
                <div className="p-6 border-b flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold leading-none tracking-tight text-lg mb-1">BIểu đồ Doanh số (GMV) & Số tin đăng mới</h3>
                        <p className="text-sm text-muted-foreground">Chỉ tính giá trị nhà qua các lịch hẹn trạng thái 'completed' (Thành công).</p>
                    </div>
                </div>
                <div className="p-6 h-[400px]">
                    {data.timeSeries.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data.timeSeries} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                                <YAxis yAxisId="left" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => (v / 1e9) + 'B'} />
                                <YAxis yAxisId="right" orientation="right" fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip
                                    cursor={{ fill: 'transparent', stroke: '#ccc', strokeWidth: 1, strokeDasharray: '3 3' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any, name: any) => [name === 'gmv' ? (value / 1e9).toFixed(2) + ' Tỷ' : value, name === 'gmv' ? 'Doanh số GMV' : 'Tin đăng Mới']}
                                    labelFormatter={(label) => `Ngày ${label}`}
                                />
                                <Legend />
                                <Bar yAxisId="right" dataKey="posts" name="Lượt đăng tin mới" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                <Line yAxisId="left" type="monotone" name="Doanh số (GMV)" dataKey="gmv" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground opacity-50">Chưa có dữ liệu cho bộ lọc này. Bấm nút Sinh mẫu.</div>
                    )}
                </div>
            </div>

            {/* Additional Charts */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Heatmap Bar Chart */}
                <div className="col-span-4 rounded-xl border bg-card shadow-sm">
                    <div className="p-6 border-b">
                        <h3 className="font-semibold leading-none tracking-tight">Top khu vực nóng</h3>
                        <p className="text-sm text-muted-foreground mt-2">Dựa trên tần suất hẹn.</p>
                    </div>
                    <div className="p-6 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={heatmapRecharts} layout="vertical" margin={{ left: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="Appointments" name="Số cuộc hẹn" fill="#f97316" radius={[0, 4, 4, 0]} barSize={25} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart Verification Score */}
                <div className="col-span-3 rounded-xl border bg-card shadow-sm">
                    <div className="p-6 border-b">
                        <h3 className="font-semibold leading-none tracking-tight">Tỉ lệ Sạch Database</h3>
                        <p className="text-sm text-muted-foreground mt-2">Tỉ lệ phân bổ mức độ uy tín của tin đăng.</p>
                    </div>
                    <div className="p-6 h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
