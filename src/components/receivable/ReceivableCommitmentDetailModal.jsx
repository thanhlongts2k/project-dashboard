import { useState, useMemo, useEffect } from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import CustomSelect from "../common/CustomSelect";
import { fetchOverdueCustomers } from "../../api/agingApi";

function getStatusBadge(status, statusTone) {
  let bg = "#f1f5f9";
  let color = "#475569";
  let border = "#cbd5e1";

  if (statusTone === "good") {
    bg = "#dcfce7";
    color = "#166534";
    border = "#bbf7d0";
  } else if (statusTone === "warn") {
    bg = "#fef3c7";
    color = "#92400e";
    border = "#fde68a";
  } else if (statusTone === "danger") {
    bg = "#fee2e2";
    color = "#991b1b";
    border = "#fecaca";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: "6px",
        fontSize: "11px",
        fontWeight: 600,
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

function getSegmentBadge(segmentKey) {
  if (segmentKey === "deep") {
    return {
      bg: "#fee2e2",
      color: "#991b1b",
      border: "#fecaca",
      label: "🚨 Quá hạn sâu (> 60 ngày)",
    };
  }
  if (segmentKey === "30days") {
    return {
      bg: "#faf5ff",
      color: "#7e22ce",
      border: "#e9d5ff",
      label: "🗓️ 30-60 ngày",
    };
  }
  if (segmentKey === "15days") {
    return {
      bg: "#f0fdf4",
      color: "#15803d",
      border: "#bbf7d0",
      label: "📅 15-30 ngày",
    };
  }
  return {
    bg: "#eff6ff",
    color: "#1d4ed8",
    border: "#bfdbfe",
    label: "⚡ Trong tuần (1-14 ngày)",
  };
}

export default function ReceivableCommitmentDetailModal({
  isOpen,
  onClose,
  date = "",
  reportDate = "",
  buCode = "all",
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [selectedBu, setSelectedBu] = useState("all");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useBodyScrollLock(isOpen);

  // Đồng bộ selectedBu khi Modal mở hoặc buCode thay đổi
  useEffect(() => {
    if (isOpen) {
      setSelectedBu(buCode || "all");
    }
  }, [isOpen, buCode]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    const queryDate = date || reportDate;
    console.log('[DEBUG Modal API] Bắt đầu gọi API khách hàng quá hạn:', { date: queryDate, reportDate });

    fetchOverdueCustomers({ date: queryDate })
      .then((res) => {
        if (!isMounted) return;
        console.log('[DEBUG Modal API] Nhận kết quả từ Backend:', { date: queryDate, response: res });
        if (Array.isArray(res?.customers)) {
          const mapped = res.customers.map((c) => ({
            id: c.id,
            customerCode: c.customer_code,
            customerName: c.customer_name,
            buCode: c.bu_code,
            buName: c.bu_name,
            commitmentAmount: Number(c.overdue_amount || 0),
            commitmentAmountFormatted: Number(c.overdue_amount || 0).toLocaleString("vi-VN"),
            dueDate: c.due_date,
            segment: c.age_bucket,
            segmentKey: c.segment_key,
            assignedStaff: c.sales_name || "Chưa phân công",
            status: c.segment_key === "deep" ? "Quá hạn sâu" : "Quá hạn",
            statusTone: c.segment_key === "deep" ? "danger" : c.segment_key === "30days" ? "warn" : "good",
            note: c.note,
          }));
          setCustomers(mapped);
        } else {
          setCustomers([]);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('[DEBUG Modal API] Lỗi khi gọi API:', err);
          setCustomers([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, date, reportDate]);

  const buSelectOptions = useMemo(() => {
    const buMap = new Map();
    customers.forEach((c) => {
      if (c.buCode && !buMap.has(c.buCode)) {
        buMap.set(c.buCode, c.buName || c.buCode);
      }
    });

    const options = [
      { value: "all", label: "Tất cả Đơn vị BU", icon: "🏢" },
    ];
    buMap.forEach((name, code) => {
      const displayLabel = code && name && code !== name ? `[${code}] ${name}` : (code ? `[${code}]` : name);
      options.push({
        value: code,
        label: displayLabel,
        icon: "🏢",
      });
    });
    return options;
  }, [customers]);

  const filteredCommitments = useMemo(() => {
    return customers.filter((item) => {
      // 1. Lọc theo search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = item.customerName?.toLowerCase().includes(query);
        const matchCode = item.customerCode?.toLowerCase().includes(query);
        const matchStaff = item.assignedStaff?.toLowerCase().includes(query);
        const matchBu = item.buName?.toLowerCase().includes(query) || item.buCode?.toLowerCase().includes(query);
        if (!matchName && !matchCode && !matchStaff && !matchBu) return false;
      }

      // 2. Lọc theo Phân khúc
      if (selectedSegment !== "all" && item.segmentKey !== selectedSegment) {
        return false;
      }

      // 3. Lọc theo BU
      if (selectedBu !== "all") {
        const isMatch =
          item.buCode === selectedBu ||
          item.buName === selectedBu ||
          (selectedBu.startsWith("BU_") && item.buCode?.replace("BU_", "") === selectedBu.replace("BU_", ""));
        if (!isMatch) return false;
      }

      return true;
    });
  }, [customers, searchTerm, selectedSegment, selectedBu]);

  const totalAmount = useMemo(() => {
    return filteredCommitments.reduce((sum, item) => sum + (item.commitmentAmount || 0), 0);
  }, [filteredCommitments]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      <div
        className="modal-panel"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "1000px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#f8fafc",
          }}
        >
          <div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
              <span>📋</span>
              <span>Chi Tiết Tiến Độ Cam Kết Thu Nợ Theo Khách Hàng</span>
            </div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
              Cập nhật mốc theo dõi: <strong>{reportDate || "Hiện tại"}</strong> | Tổng số: <strong>{filteredCommitments.length}</strong> khách hàng
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {/* Filters Bar */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Search Box */}
          <div style={{ flex: "1 1 240px", minWidth: "200px" }}>
            <input
              type="text"
              placeholder="🔍 Tìm theo Tên KH, Mã KH, Phụ trách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Phân khúc filter pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {[
              { key: "all", label: "Tất cả" },
              { key: "week", label: "Trong tuần (1-14 ngày)" },
              { key: "15days", label: "15-30 ngày" },
              { key: "30days", label: "31-60 ngày" },
              { key: "deep", label: "🚨 Quá hạn sâu (> 60 ngày)" },
            ].map((tab) => {
              const active = selectedSegment === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedSegment(tab.key)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: active ? 700 : 500,
                    backgroundColor: active ? "#185fa5" : "#f1f5f9",
                    color: active ? "#ffffff" : "#475569",
                    border: active ? "1px solid #185fa5" : "1px solid #e2e8f0",
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* BU Filter */}
          {buSelectOptions.length > 2 && (
            <div>
              <CustomSelect
                value={selectedBu}
                onChange={(newBu) => setSelectedBu(newBu)}
                options={buSelectOptions}
                placeholder="Chọn đơn vị BU"
                triggerStyle={{
                  fontSize: 12,
                  minWidth: 185,
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                }}
              />
            </div>
          )}
        </div>

        {/* Summary Card */}
        <div
          style={{
            padding: "10px 20px",
            backgroundColor: "#eff6ff",
            borderBottom: "1px solid #dbeafe",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            fontSize: "13px",
          }}
        >
          <div style={{ color: "#1e40af" }}>
            Số khách hàng cam kết: <strong>{filteredCommitments.length}</strong>
          </div>
          <div style={{ color: "#1e40af", fontSize: "14px" }}>
            Tổng số tiền cam kết: <strong style={{ color: "#185fa5", fontSize: "15px" }}>{totalAmount.toLocaleString("vi-VN")} VND</strong>
          </div>
        </div>

        {/* Table Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "auto",
            padding: "16px 20px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#185fa5" }}>
              <div style={{ fontSize: "28px", animation: "spin 1s linear infinite", display: "inline-block", marginBottom: "12px" }}>⏳</div>
              <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b" }}>Đang tải danh sách khách hàng nợ quá hạn từ máy chủ...</div>
            </div>
          ) : filteredCommitments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔍</div>
              <div style={{ fontWeight: 600, fontSize: "14px" }}>Không có dữ liệu nợ quá hạn phù hợp</div>
              <div style={{ fontSize: "12px", marginTop: "4px" }}>Vui lòng thay đổi từ khóa tìm kiếm hoặc bộ lọc phân khúc.</div>
            </div>
          ) : (
            <table className="bt" style={{ width: "100%", minWidth: "750px" }}>
              <thead>
                <tr>
                  <th style={{ width: "40px", textAlign: "center" }}>STT</th>
                  <th style={{ textAlign: "left" }}>Khách Hàng</th>
                  <th style={{ textAlign: "left" }}>Đơn Vị BU</th>
                  <th style={{ textAlign: "right" }}>Số tiền cam kết (VND)</th>
                  <th style={{ textAlign: "center" }}>Hạn Thanh Toán</th>
                  <th style={{ textAlign: "center" }}>Phân Khúc</th>
                  <th style={{ textAlign: "left" }}>Nhân Sự Phụ Trách</th>
                  <th style={{ textAlign: "center" }}>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommitments.map((row, idx) => {
                  const seg = getSegmentBadge(row.segmentKey);
                  return (
                    <tr key={row.id || `${row.customerCode}-${idx}`}>
                      <td style={{ textAlign: "center", color: "#64748b", fontSize: "12px" }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#1e293b" }}>{row.customerName}</div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>{row.customerCode}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", fontWeight: 500, color: "#334155" }}>
                          {row.buCode && row.buName && row.buCode !== row.buName ? (
                            <>
                              <strong style={{ color: "#185fa5", marginRight: 4 }}>[{row.buCode}]</strong>
                              <span>{row.buName}</span>
                            </>
                          ) : (
                            row.buCode ? `[${row.buCode}]` : (row.buName || "—")
                          )}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#185fa5" }}>
                        {(row.commitmentAmount || 0).toLocaleString("vi-VN")}
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 500, color: "#0f172a" }}>
                        {row.dueDate}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 600,
                            backgroundColor: seg.bg,
                            color: seg.color,
                            border: `1px solid ${seg.border}`,
                          }}
                        >
                          {row.segment}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: "#334155" }}>{row.assignedStaff}</div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {getStatusBadge(row.status, row.statusTone)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              backgroundColor: "#1e293b",
              color: "#ffffff",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
