import { formatCompactMoney, formatPercent } from "./numberFormat";
import { MOCK_STAFF_LIST } from "./agingMockData";

export { MOCK_STAFF_LIST };

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function mapAgingCustomer(raw = {}) {
  const due_0_7 = num(raw.due_0_7);
  const due_8_14 = num(raw.due_8_14);
  const due_15_21 = num(raw.due_15_21);
  const due_22_28 = num(raw.due_22_28);
  const due_29_60 = num(raw.due_29_60);
  const due_over_60 = num(raw.due_above_60 ?? raw.due_over_60);
  const calcBeforeDue = due_0_7 + due_8_14 + due_15_21 + due_22_28 + due_29_60 + due_over_60;
  const totalBeforeDue = num(raw.due_total ?? raw.totalBeforeDue) || calcBeforeDue;

  const overdue_1_14 = num(raw.overdue_0_14 ?? raw.overdue_1_14);
  const overdue_15_30 = num(raw.overdue_15_30);
  const overdue_31_45 = num(raw.overdue_31_45);
  const overdue_46_60 = num(raw.overdue_46_60);
  const overdue_61_90 = num(raw.overdue_61_90);
  const overdue_91_120 = num(raw.overdue_91_120);
  const overdue_over_120 = num(raw.overdue_above_120 ?? raw.overdue_over_120);
  const calcOverdue = overdue_1_14 + overdue_15_30 + overdue_31_45 + overdue_46_60 + overdue_61_90 + overdue_91_120 + overdue_over_120;
  const totalOverdue = num(raw.overdue_total ?? raw.totalOverdue) || calcOverdue;

  const totalDebt = num(raw.total_debt ?? raw.receivable_total ?? raw.totalDebt) || (totalBeforeDue + totalOverdue);
  const overduePercent = totalDebt > 0 ? (totalOverdue / totalDebt) * 100 : 0;

  return {
    id: raw.customer_code || raw.id || "KH",
    name: raw.customer_name || raw.name || "Khách hàng",
    due_0_7, due_8_14, due_15_21, due_22_28, due_29_60, due_over_60, totalBeforeDue,
    overdue_1_14, overdue_15_30, overdue_31_45, overdue_46_60, overdue_61_90, overdue_91_120, overdue_over_120,
    totalOverdue, totalDebt, overduePercent,
  };
}

export function mapAgingStaffGroup(rawGroup = {}) {
  const rawCustomers = rawGroup.customers || rawGroup.customer_list || [];
  const customers = rawCustomers.map(mapAgingCustomer);
  const totalBeforeDue = customers.reduce((sum, c) => sum + c.totalBeforeDue, 0);
  const totalOverdue = customers.reduce((sum, c) => sum + c.totalOverdue, 0);
  const totalDebt = customers.reduce((sum, c) => sum + c.totalDebt, 0);
  const overduePercent = totalDebt > 0 ? (totalOverdue / totalDebt) * 100 : 0;

  const code = String(rawGroup.employee_code || rawGroup.code || rawGroup.id || rawGroup.staff_id || "STAFF");
  const name = rawGroup.employee_name || rawGroup.name || rawGroup.staff_name || "Chưa đặt tên";
  const title = rawGroup.title || rawGroup.job_title || "Nhân viên kinh doanh";
  const role = rawGroup.role || (title.toLowerCase().includes("trưởng") ? "BU_HEAD" : title.toLowerCase().includes("giám đốc") ? "CCO" : title.toLowerCase().includes("quản lý") ? "MANAGER" : "SALES");
  const customerCount = rawGroup.customer_count || customers.length;

  return {
    id: code, code, name, title, role, customers,
    totalBeforeDue, totalOverdue, totalDebt, overduePercent, customerCount,
  };
}

export function mapAgingDrilldownResponse(rawResponse = {}, selectedStaffCode = "ALL") {
  const tier1 = rawResponse?.tier_1_bu || {};
  const tier23 = rawResponse?.tier_2_and_3 || {};

  let rawGroups = [];
  if (Array.isArray(tier23.bu_teams)) rawGroups.push(...tier23.bu_teams);
  if (tier23.key_accounts_summary && Array.isArray(tier23.key_accounts_summary.customers)) {
    const ka = tier23.key_accounts_summary;
    rawGroups.unshift({
      employee_code: ka.employee_code || "2001",
      employee_name: ka.employee_name || "NGÔ ĐÌNH TRUNG TÂN",
      title: ka.title || "Giám đốc kinh doanh (CCO)",
      role: ka.role || "CCO",
      customers: ka.customers,
    });
  }

  const isApiLoaded = Boolean(
    rawResponse &&
      (rawResponse.tier_1_bu ||
        rawResponse.tier_2_and_3 ||
        rawResponse.period ||
        rawResponse.reconciliation)
  );

  if (rawGroups.length === 0 && !isApiLoaded) {
    rawGroups = MOCK_STAFF_LIST;
  }

  let staffList = rawGroups.map(mapAgingStaffGroup);
  const isSingleStaff = selectedStaffCode && selectedStaffCode !== "ALL" && selectedStaffCode !== "all" && selectedStaffCode !== "Tất cả";
  if (isSingleStaff) {
    staffList = staffList.filter((st) => st.code === selectedStaffCode || st.name === selectedStaffCode || st.id === selectedStaffCode);
  }

  const grandTotalBeforeDue = isSingleStaff
    ? staffList.reduce((sum, st) => sum + st.totalBeforeDue, 0)
    : (num(tier1.due_total) || staffList.reduce((sum, st) => sum + st.totalBeforeDue, 0));

  const grandTotalOverdue = isSingleStaff
    ? staffList.reduce((sum, st) => sum + st.totalOverdue, 0)
    : (num(tier1.overdue_total) || staffList.reduce((sum, st) => sum + st.totalOverdue, 0));

  const grandTotalDebt = isSingleStaff
    ? (grandTotalBeforeDue + grandTotalOverdue)
    : (num(tier1.receivable_total) || (grandTotalBeforeDue + grandTotalOverdue));

  const grandOverduePercent = grandTotalDebt > 0 ? (grandTotalOverdue / grandTotalDebt) * 100 : (isSingleStaff ? 0 : num(tier1.overdue_rate));
  const inDuePercent = grandTotalDebt > 0 ? (grandTotalBeforeDue / grandTotalDebt) * 100 : 0;

  const kpiCards = [
    {
      accent: "blue", label: "Tổng công nợ phải thu", valueText: formatCompactMoney(grandTotalDebt),
      rawNumber: grandTotalDebt,
      targetText: isSingleStaff ? `1 nhân sự · ${staffList[0]?.customerCount || 0} KH phụ trách` : `${staffList.length} nhóm nhân sự · ${staffList.reduce((s, st) => s + st.customerCount, 0)} KH`,
      percent: 100, percentText: "100%", progressColor: "blue",
    },
    {
      accent: "teal", label: "Nợ trong hạn", valueText: formatCompactMoney(grandTotalBeforeDue),
      rawNumber: grandTotalBeforeDue, targetText: `Chiếm ${formatPercent(inDuePercent)}`,
      percent: inDuePercent, percentText: formatPercent(inDuePercent), progressColor: "teal",
    },
    {
      accent: "amber", label: "Nợ quá hạn", valueText: formatCompactMoney(grandTotalOverdue),
      rawNumber: grandTotalOverdue, targetText: `Chiếm ${formatPercent(grandOverduePercent)}`,
      percent: grandOverduePercent, percentText: formatPercent(grandOverduePercent), progressColor: "amber",
    },
    {
      accent: grandOverduePercent > 20 ? "rose" : "teal", label: "Tỷ lệ quá hạn",
      valueText: formatPercent(grandOverduePercent), rawNumber: grandOverduePercent,
      targetText: grandOverduePercent > 20 ? "⚠️ Vượt hạn mức an toàn (20%)" : "✓ Mức an toàn",
      percent: grandOverduePercent, percentText: grandOverduePercent > 20 ? "Cảnh báo" : "An toàn",
      progressColor: grandOverduePercent > 20 ? "danger" : "teal",
    },
  ];

  return {
    staffGroups: staffList, kpiCards,
    grandTotals: { totalBeforeDue: grandTotalBeforeDue, totalOverdue: grandTotalOverdue, totalDebt: grandTotalDebt, overduePercent: grandOverduePercent, inDuePercent },
    buInfo: { code: tier1.bu_code || "BU_ELEVATOR", name: tier1.bu_name || tier1.name || "Thang máy" },
  };
}

export function mapAgingMatrixData(rawStaffList = MOCK_STAFF_LIST, selectedStaffName = "ALL") {
  return mapAgingDrilldownResponse({ tier_2_and_3: { bu_teams: rawStaffList } }, selectedStaffName);
}
