import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Building2,
  DollarSign,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  BedDouble,
  Utensils,
  AlertCircle,
  Loader2,
  PieChart as PieIcon,
  BarChart3,
  Award,
  Wallet,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { billingApi, branchesApi } from '../api';
import type { RevenueAnalyticsResponse, BranchRevenueReport } from '../api';
import type { Branch } from '../types';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Chart Palette Constants
const BRANCH_COLORS = [
  { bg: 'rgba(217, 119, 6, 0.85)', border: '#d97706', label: 'Amber / Gold' },
  { bg: 'rgba(16, 185, 129, 0.85)', border: '#10b981', label: 'Emerald' },
  { bg: 'rgba(14, 165, 233, 0.85)', border: '#0ea5e9', label: 'Sky Blue' },
  { bg: 'rgba(168, 85, 247, 0.85)', border: '#a855f7', label: 'Purple' },
  { bg: 'rgba(244, 63, 94, 0.85)', border: '#f43f5e', label: 'Rose' },
];

export const AdminRevenuePage: React.FC = () => {
  // Filters
  const currentYear = new Date().getFullYear();
  const availableYears = useMemo(() => {
    return Array.from(new Set([2026, currentYear, currentYear - 1, currentYear - 2])).sort((a, b) => b - a);
  }, [currentYear]);
  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  // Data states
  const [data, setData] = useState<RevenueAnalyticsResponse | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchBranches = async () => {
    try {
      const res = await branchesApi.getAll();
      const list = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      setBranches(list);
    } catch {
      // Fallback
    }
  };

  const fetchAnalytics = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const res = await billingApi.getAnalytics({
        year: selectedYear,
        month: selectedMonth,
        branch_id: selectedBranchId,
      });

      setData(res.data);
    } catch (err: any) {
      setError('Không thể tải dữ liệu báo cáo doanh thu. Vui lòng kiểm tra kết nối backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedYear, selectedMonth, selectedBranchId]);

  const formatCurrency = (val?: number | null) => {
    if (val === undefined || val === null) return '0 đ';
    return Number(val).toLocaleString('vi-VN') + ' đ';
  };

  const formatShortCurrency = (val: number) => {
    if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1) + ' tỷ';
    if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + ' tr';
    if (val >= 1_000) return (val / 1_000).toFixed(0) + ' k';
    return String(val);
  };

  // ==========================================
  // CHART 1: Grouped Bar Chart (Doanh thu so sánh giữa các Chi nhánh theo tháng)
  // ==========================================
  const branchComparisonBarData = useMemo(() => {
    if (!data?.monthly_trend) return null;

    const labels = data.monthly_trend.map((m) => m.label);
    const activeBranchesList = data.branch_reports || [];

    // If specific branch is selected, show room vs service of that branch
    if (selectedBranchId !== 'all') {
      return {
        labels,
        datasets: [
          {
            label: 'Tiền Phòng',
            data: data.monthly_trend.map((m) => m.room_revenue),
            backgroundColor: 'rgba(217, 119, 6, 0.85)',
            borderColor: '#d97706',
            borderRadius: 6,
          },
          {
            label: 'Tiền Dịch Vụ',
            data: data.monthly_trend.map((m) => m.service_revenue),
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            borderColor: '#10b981',
            borderRadius: 6,
          },
        ],
      };
    }

    // Otherwise show dataset per branch
    const datasets = activeBranchesList.map((branch, idx) => {
      const color = BRANCH_COLORS[idx % BRANCH_COLORS.length];
      const branchValues = data.monthly_trend.map(
        (m) => m.by_branch[String(branch.branch_id)] || 0
      );

      return {
        label: branch.branch_name,
        data: branchValues,
        backgroundColor: color.bg,
        borderColor: color.border,
        borderRadius: 6,
      };
    });

    return { labels, datasets };
  }, [data, selectedBranchId]);

  // ==========================================
  // CHART 2: Smooth Line Chart (Xu hướng Doanh thu tổng & Phòng vs Dịch vụ)
  // ==========================================
  const trendLineData = useMemo(() => {
    if (!data?.monthly_trend) return null;

    const labels = data.monthly_trend.map((m) => m.label);
    const totalData = data.monthly_trend.map((m) => m.total_revenue);
    const roomData = data.monthly_trend.map((m) => m.room_revenue);
    const serviceData = data.monthly_trend.map((m) => m.service_revenue);

    return {
      labels,
      datasets: [
        {
          label: 'Tổng Doanh Thu',
          data: totalData,
          borderColor: '#d97706',
          backgroundColor: 'rgba(217, 119, 6, 0.12)',
          fill: true,
          tension: 0.38,
          pointBackgroundColor: '#d97706',
          pointBorderColor: '#ffffff',
          pointHoverRadius: 7,
          pointRadius: 4,
          borderWidth: 3,
        },
        {
          label: 'Doanh Thu Phòng',
          data: roomData,
          borderColor: '#2563eb',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.35,
          pointBackgroundColor: '#2563eb',
          pointRadius: 3,
          borderWidth: 2,
        },
        {
          label: 'Doanh Thu Dịch Vụ',
          data: serviceData,
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          tension: 0.35,
          pointBackgroundColor: '#10b981',
          pointRadius: 3,
          borderWidth: 2,
        },
      ],
    };
  }, [data]);

  // ==========================================
  // CHART 3: Doughnut Chart (Tỷ trọng Doanh thu giữa các Chi nhánh)
  // ==========================================
  const branchDoughnutData = useMemo(() => {
    if (!data?.branch_reports || data.branch_reports.length === 0) return null;

    const labels = data.branch_reports.map((b) => b.branch_name);
    const values = data.branch_reports.map((b) => b.total_revenue);
    const bgColors = data.branch_reports.map(
      (_, idx) => BRANCH_COLORS[idx % BRANCH_COLORS.length].bg
    );
    const borderColors = data.branch_reports.map(
      (_, idx) => BRANCH_COLORS[idx % BRANCH_COLORS.length].border
    );

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    };
  }, [data]);

  // ==========================================
  // CHART 4: Doughnut Chart (Cơ cấu Dịch vụ theo Danh mục)
  // ==========================================
  const serviceDoughnutData = useMemo(() => {
    if (!data?.service_categories || data.service_categories.length === 0) return null;

    const labels = data.service_categories.map((c) => c.category_name);
    const values = data.service_categories.map((c) => c.amount);

    const palette = [
      '#f59e0b', // Amber (F&B)
      '#3b82f6', // Blue (Laundry)
      '#10b981', // Emerald (Spa)
      '#8b5cf6', // Violet (Transport)
      '#ec4899', // Pink (Amenities)
      '#64748b', // Slate (Other)
    ];

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: palette.slice(0, labels.length),
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    };
  }, [data]);

  // Common Chart Options
  const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: { family: 'inherit', size: 12, weight: 600 },
          color: '#44403c',
          boxWidth: 14,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#1c1917',
        titleFont: { size: 13, weight: 700 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 10,
        boxPadding: 6,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || context.label || '';
            const val = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
            return ` ${label}: ${Number(val).toLocaleString('vi-VN')} đ`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: {
          font: { size: 11 },
          color: '#78716c',
          callback: (val: any) => formatShortCurrency(val),
        },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#78716c' },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { family: 'inherit', size: 11, weight: 500 },
          color: '#44403c',
          padding: 12,
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: '#1c1917',
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const val = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
            return ` ${label}: ${Number(val).toLocaleString('vi-VN')} đ (${pct}%)`;
          },
        },
      },
    },
    cutout: '68%',
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-stone-900">
      {/* ========================================================
          1. HEADER & CONTROL FILTER BAR
      ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-stone-900">
              Báo cáo & Phân tích Doanh thu
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 font-light mt-1 pl-10">
            Thống kê tổng doanh thu toàn chuỗi, chi tiết từng chi nhánh và cơ cấu nguồn thu (tiền phòng & dịch vụ tiện ích).
          </p>
        </div>

        {/* Filters Controls */}
        <div className="flex flex-wrap items-center gap-2.5 bg-white p-2 rounded-2xl border border-stone-200 shadow-xs">
          {/* Year selector */}
          <div className="flex items-center gap-1.5 pl-2 text-xs font-semibold text-stone-600">
            <Calendar className="h-3.5 w-3.5 text-amber-700" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent py-1.5 pr-2 font-bold text-stone-900 focus:outline-hidden cursor-pointer"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-stone-200" />

          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent py-1.5 px-2 text-xs font-semibold text-stone-800 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Toàn bộ 12 tháng</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>

          <div className="h-4 w-px bg-stone-200" />

          {/* Branch selector */}
          <div className="flex items-center gap-1.5 pr-2">
            <Building2 className="h-3.5 w-3.5 text-amber-700" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent py-1.5 pr-2 text-xs font-semibold text-stone-800 focus:outline-hidden cursor-pointer max-w-[170px] truncate"
            >
              <option value="all">Tất cả chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing || loading}
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-50"
            title="Làm mới số liệu"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================
          2. KEY METRIC SUMMARY CARDS (KPIs)
      ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-500/10 via-[#FFFDF9] to-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Tổng Doanh Thu Toàn Chuỗi
            </span>
            <div className="p-2 rounded-2xl bg-amber-500/15 text-amber-800 border border-amber-500/25">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              {loading ? (
                <div className="h-8 w-32 bg-stone-200 animate-pulse rounded-lg" />
              ) : (
                formatCurrency(data?.total_revenue)
              )}
            </div>
            <p className="mt-1 text-xs text-stone-500 flex items-center gap-1.5">
              <span className="font-semibold text-emerald-700 flex items-center">
                <ArrowUpRight className="h-3.5 w-3.5" />
                {data?.invoices_count || 0} hóa đơn
              </span>
              <span>• Năm {selectedYear}</span>
            </p>
          </div>
        </div>

        {/* Card 2: Room Revenue */}
        <div className="relative overflow-hidden rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-500/5 via-[#FAFBFD] to-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              Doanh Thu Tiền Phòng
            </span>
            <div className="p-2 rounded-2xl bg-blue-500/15 text-blue-700 border border-blue-500/25">
              <BedDouble className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-blue-950">
              {loading ? (
                <div className="h-8 w-32 bg-stone-200 animate-pulse rounded-lg" />
              ) : (
                formatCurrency(data?.room_revenue)
              )}
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Chiếm{' '}
              <strong className="font-semibold text-blue-800">
                {data?.total_revenue
                  ? Math.round(((data.room_revenue || 0) / data.total_revenue) * 100)
                  : 0}
                %
              </strong>{' '}
              tổng doanh thu
            </p>
          </div>
        </div>

        {/* Card 3: Service Revenue */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-500/5 via-[#FAFCFB] to-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Doanh Thu Dịch Vụ & Menu
            </span>
            <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-700 border border-emerald-500/25">
              <Utensils className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-emerald-950">
              {loading ? (
                <div className="h-8 w-32 bg-stone-200 animate-pulse rounded-lg" />
              ) : (
                formatCurrency(data?.service_revenue)
              )}
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Ẩm thực, Spa, Giặt là, Tour đưa đón...
            </p>
          </div>
        </div>

        {/* Card 4: Paid Amount / Collection Rate */}
        <div className="relative overflow-hidden rounded-3xl border border-purple-200/70 bg-gradient-to-br from-purple-500/5 via-[#FDFBFE] to-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
              Thực Thu / Tỷ Lệ Thu Hồi
            </span>
            <div className="p-2 rounded-2xl bg-purple-500/15 text-purple-700 border border-purple-500/25">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-purple-950">
              {loading ? (
                <div className="h-8 w-32 bg-stone-200 animate-pulse rounded-lg" />
              ) : (
                formatCurrency(data?.paid_amount)
              )}
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Đạt{' '}
              <strong className="font-semibold text-purple-800">
                {data?.total_revenue
                  ? Math.round(((data.paid_amount || 0) / data.total_revenue) * 100)
                  : 0}
                %
              </strong>{' '}
              {data?.remaining_amount ? `(còn nợ: ${formatShortCurrency(data.remaining_amount)})` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. MAIN CHARTS SECTION (Chart.js Powered)
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Branch Revenue Comparison Bar Chart (2 columns span) */}
        <div className="lg:col-span-2 rounded-3xl border border-stone-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-amber-700" />
                <h2 className="font-serif text-lg font-bold tracking-tight text-stone-900">
                  {selectedBranchId === 'all'
                    ? 'So sánh Doanh thu Giữa các Chi nhánh theo Tháng'
                    : 'Doanh thu Phòng vs Dịch vụ theo Từng Tháng'}
                </h2>
              </div>
              <p className="text-xs text-stone-500 font-light mt-0.5">
                Đơn vị tính: VNĐ • Dữ liệu tính theo các tháng trong năm {selectedYear}
              </p>
            </div>

            {/* Quick status pill */}
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {selectedBranchId === 'all' ? 'Toàn bộ Chi nhánh' : 'Đang lọc chi nhánh'}
            </span>
          </div>

          <div className="h-80 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
              </div>
            ) : branchComparisonBarData ? (
              <Bar data={branchComparisonBarData} options={baseChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-stone-400">
                Chưa có dữ liệu giao dịch trong kỳ này.
              </div>
            )}
          </div>
        </div>

        {/* Side Chart: Doughnut Chart of Branch Contribution */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-amber-700" />
                <h2 className="font-serif text-lg font-bold tracking-tight text-stone-900">
                  Tỷ trọng theo Chi nhánh
                </h2>
              </div>
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                % Đóng góp
              </span>
            </div>
            <p className="text-xs text-stone-500 font-light mb-4">
              Tỷ lệ doanh thu đóng góp vào quỹ tổng chuỗi khách sạn.
            </p>
          </div>

          <div className="h-64 relative flex items-center justify-center">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
            ) : branchDoughnutData ? (
              <Doughnut data={branchDoughnutData} options={doughnutOptions} />
            ) : (
              <div className="text-xs text-stone-400">Chưa có dữ liệu</div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
            <span>Cơ sở dẫn đầu:</span>
            <span className="font-bold text-amber-800">
              {data?.branch_reports?.[0]?.branch_name || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          4. SECOND ROW: LINE TREND & SERVICE BREAKDOWN
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Line Chart (2 columns) */}
        <div className="lg:col-span-2 rounded-3xl border border-stone-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-700" />
                <h3 className="font-serif text-lg font-bold tracking-tight text-stone-900">
                  Xu hướng Tăng trưởng Doanh thu Toàn Chuỗi
                </h3>
              </div>
              <p className="text-xs text-stone-500 font-light mt-0.5">
                Biểu đồ đường mượt thể hiện tổng doanh thu, phân tách tiền phòng và dịch vụ.
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
              </div>
            ) : trendLineData ? (
              <Line data={trendLineData} options={baseChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-stone-400">
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </div>

        {/* Doughnut: Service Breakdown */}
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-amber-700" />
                <h3 className="font-serif text-lg font-bold tracking-tight text-stone-900">
                  Cơ cấu Doanh thu Dịch vụ
                </h3>
              </div>
            </div>
            <p className="text-xs text-stone-500 font-light mb-4">
              Phân bổ nguồn thu từ F&B, giặt sấy, spa trị liệu và tour xe đưa đón.
            </p>
          </div>

          <div className="h-64 relative flex items-center justify-center">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
            ) : serviceDoughnutData ? (
              <Doughnut data={serviceDoughnutData} options={doughnutOptions} />
            ) : (
              <div className="text-xs text-stone-400 text-center px-4">
                Chưa phát sinh dịch vụ trong kỳ này.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
            <span>Tổng tiền dịch vụ:</span>
            <span className="font-bold text-emerald-800">
              {formatCurrency(data?.service_revenue)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          5. DETAILED BRANCH REVENUE TABLE
      ======================================================== */}
      <div className="rounded-3xl border border-stone-200 bg-white shadow-xs overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-700" />
              Bảng Tổng hợp Doanh thu Chi tiết theo Từng Chi nhánh
            </h3>
            <p className="text-xs text-stone-500 font-light mt-0.5">
              So sánh tỷ trọng, doanh thu phòng, dịch vụ và tình trạng thu hồi công nợ từng cơ sở.
            </p>
          </div>

          {selectedBranchId !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedBranchId('all')}
              className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline cursor-pointer"
            >
              Hủy lọc, xem tất cả chi nhánh
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-stone-600 uppercase tracking-wider font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3.5 px-6">Thứ hạng & Chi nhánh</th>
                <th className="py-3.5 px-4 text-right">Tổng Doanh Thu</th>
                <th className="py-3.5 px-4 text-right">Tiền Phòng</th>
                <th className="py-3.5 px-4 text-right">Tiền Dịch Vụ</th>
                <th className="py-3.5 px-4 text-right">Đã Thu Thực Tế</th>
                <th className="py-3.5 px-4 text-center">Số Hóa Đơn</th>
                <th className="py-3.5 px-6">Tỷ trọng đóng góp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-700 mb-2" />
                    Đang tính toán số liệu doanh thu...
                  </td>
                </tr>
              ) : !data?.branch_reports || data.branch_reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    Chưa có số liệu phát sinh trong kỳ lọc này.
                  </td>
                </tr>
              ) : (
                data.branch_reports.map((b: BranchRevenueReport, index: number) => {
                  const isTop1 = index === 0 && b.total_revenue > 0;
                  const isSelected = String(b.branch_id) === String(selectedBranchId);

                  return (
                    <tr
                      key={b.branch_id}
                      onClick={() =>
                        setSelectedBranchId(
                          String(b.branch_id) === selectedBranchId ? 'all' : String(b.branch_id)
                        )
                      }
                      className={`hover:bg-amber-50/40 transition-colors cursor-pointer ${
                        isSelected ? 'bg-amber-50/70 font-medium' : ''
                      }`}
                    >
                      {/* Name & Rank */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-bold shrink-0 ${
                              isTop1
                                ? 'bg-amber-400 text-stone-950 shadow-xs'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {isTop1 ? <Award className="h-4 w-4" /> : `#${index + 1}`}
                          </span>
                          <div>
                            <div className="font-bold text-stone-900 flex items-center gap-1.5">
                              <span>{b.branch_name}</span>
                              {isTop1 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900">
                                  Top 1 Doanh thu
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-stone-400">
                              Mã: {b.branch_code}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Total Revenue */}
                      <td className="py-4 px-4 text-right font-bold text-stone-900 text-sm">
                        {formatCurrency(b.total_revenue)}
                      </td>

                      {/* Room Revenue */}
                      <td className="py-4 px-4 text-right text-stone-700">
                        {formatCurrency(b.room_revenue)}
                      </td>

                      {/* Service Revenue */}
                      <td className="py-4 px-4 text-right text-emerald-800 font-medium">
                        {formatCurrency(b.service_revenue)}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-4 px-4 text-right font-medium text-purple-900">
                        {formatCurrency(b.paid_amount)}
                        {b.remaining_amount > 0 && (
                          <div className="text-[10px] text-rose-600 font-normal">
                            Nợ: {formatShortCurrency(b.remaining_amount)}
                          </div>
                        )}
                      </td>

                      {/* Invoices Count */}
                      <td className="py-4 px-4 text-center text-stone-600 font-semibold">
                        {b.invoices_count}
                      </td>

                      {/* Percentage Bar */}
                      <td className="py-4 px-6 min-w-[180px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-stone-600 font-semibold">
                            <span>{b.percentage}%</span>
                            <span className="text-stone-400">toàn chuỗi</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(2, b.percentage))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRevenuePage;
