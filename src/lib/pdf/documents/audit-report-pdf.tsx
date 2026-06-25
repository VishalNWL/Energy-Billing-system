import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles, COLORS } from "../pdf-styles";
import type { EnergyRecommendation, AuditScore } from "@/lib/electrical/energy-audit";

interface AuditReportProps {
  consumerName: string;
  consumerNumber: string;
  consumerType: string;
  auditDate: string;
  totalUnits: number;
  avgMonthlyUnits: number;
  maxDemandKW: number;
  loadFactor: number;
  avgPF: number;
  hasSolar: boolean;
  score: AuditScore;
  recommendations: EnergyRecommendation[];
  monthlyConsumption: { month: string; units: number; amount: number }[];
}

const GRADE_COLOR: Record<string, string> = {
  A: COLORS.accent,
  B: COLORS.primary,
  C: COLORS.warning,
  D: "#ea580c",
  F: COLORS.danger,
};

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: COLORS.danger,
  MEDIUM: COLORS.warning,
  LOW: COLORS.primary,
};

export function AuditReportPDF({
  consumerName,
  consumerNumber,
  consumerType,
  auditDate,
  totalUnits,
  avgMonthlyUnits,
  maxDemandKW,
  loadFactor,
  avgPF,
  hasSolar,
  score,
  recommendations,
  monthlyConsumption,
}: AuditReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Energy Audit Report</Text>
            <Text style={styles.headerSubtitle}>
              {consumerNumber} — {consumerName}
            </Text>
            <Text style={styles.headerSubtitle}>
              Audit Date: {auditDate}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.headerBadge, { fontSize: 18, padding: "6 14" }]}>
              Grade {score.grade}
            </Text>
            <Text style={[styles.headerSubtitle, { marginTop: 4 }]}>
              Score: {score.total}/100
            </Text>
          </View>
        </View>

        {/* KPI Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
          <View style={styles.row}>
            {[
              { label: "Total Consumption", value: `${totalUnits.toFixed(0)} kWh` },
              { label: "Avg Monthly", value: `${avgMonthlyUnits.toFixed(0)} kWh` },
              { label: "Peak Demand", value: maxDemandKW > 0 ? `${maxDemandKW} kW` : "N/A" },
              { label: "Load Factor", value: loadFactor > 0 ? String(loadFactor) : "N/A" },
            ].map(({ label, value }) => (
              <View key={label} style={styles.statBox}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={[styles.statValue, { fontSize: 11 }]}>{value}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.row, { marginTop: 8 }]}>
            {[
              { label: "Avg Power Factor", value: String(avgPF), color: avgPF >= 0.9 ? COLORS.accent : COLORS.danger },
              { label: "Solar Installed", value: hasSolar ? "Yes" : "No", color: hasSolar ? COLORS.accent : COLORS.muted },
              { label: "Consumer Type", value: consumerType, color: COLORS.primary },
              { label: "Audit Grade", value: score.grade, color: GRADE_COLOR[score.grade] },
            ].map(({ label, value, color }) => (
              <View key={label} style={styles.statBox}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={[styles.statValue, { fontSize: 14, color }]}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Score breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audit Score Breakdown</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              {["Category", "Score", "Max", "Status"].map((h) => (
                <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
              ))}
            </View>
            {[
              { cat: "Load Factor", score: score.loadFactorScore, max: 20 },
              { cat: "Power Factor", score: score.powerFactorScore, max: 20 },
              { cat: "Solar Adoption", score: score.solarScore, max: 20 },
              { cat: "Demand Management", score: score.demandScore, max: 20 },
              { cat: "Distribution Loss", score: Math.max(0, score.total - score.loadFactorScore - score.powerFactorScore - score.solarScore - score.demandScore), max: 20 },
            ].map(({ cat, score: s, max }, i) => (
              <View key={cat} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={styles.tableCell}>{cat}</Text>
                <Text style={[styles.tableCell, { fontFamily: "Helvetica-Bold" }]}>{s}</Text>
                <Text style={styles.tableCell}>{max}</Text>
                <Text style={[styles.tableCell, {
                  color: s === max ? COLORS.accent : s >= max * 0.6 ? COLORS.primary : COLORS.danger,
                  fontFamily: "Helvetica-Bold",
                }]}>
                  {s === max ? "✓ Full Marks" : s >= max * 0.6 ? "Acceptable" : "Needs Work"}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL SCORE</Text>
              <Text style={styles.totalValue}>{score.total}/100 — Grade {score.grade}</Text>
            </View>
          </View>
        </View>

        {/* Monthly consumption table */}
        {monthlyConsumption.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly Consumption History</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                {["Month", "Units (kWh)", "Bill Amount (₹)"].map((h) => (
                  <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
                ))}
              </View>
              {monthlyConsumption.map((m, i) => (
                <View key={m.month} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={styles.tableCell}>{m.month}</Text>
                  <Text style={styles.tableCell}>{m.units}</Text>
                  <Text style={[styles.tableCell, { fontFamily: "Helvetica-Bold" }]}>
                    {m.amount.toLocaleString("en-IN")}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Smart Energy Management & Billing System</Text>
          <Text>Energy Audit Report — {auditDate}</Text>
          <Text render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          } />
        </View>
      </Page>

      {/* Page 2: Recommendations */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Energy Saving Recommendations</Text>
            <Text style={styles.headerSubtitle}>
              {consumerNumber} — {consumerName}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerBadge}>
              {recommendations.length} ACTIONS
            </Text>
          </View>
        </View>

        {recommendations.map((rec, i) => (
          <View
            key={rec.id}
            style={{
              marginBottom: 12,
              padding: 10,
              border: `1px solid ${PRIORITY_COLOR[rec.priority]}`,
              borderRadius: 4,
              backgroundColor: rec.priority === "HIGH" ? "#fef2f2" : "#f9fafb",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: PRIORITY_COLOR[rec.priority] }}>
                {i + 1}. [{rec.priority}] {rec.title}
              </Text>
              <Text style={{ fontSize: 9, color: COLORS.accent, fontFamily: "Helvetica-Bold" }}>
                ~{rec.estimatedSavingsPercent}% savings
              </Text>
            </View>
            <Text style={{ fontSize: 8, color: COLORS.muted, marginBottom: 4 }}>
              Category: {rec.category}
            </Text>
            <Text style={{ fontSize: 9, color: COLORS.secondary, lineHeight: 1.5 }}>
              {rec.description}
            </Text>
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>Smart Energy Management & Billing System</Text>
          <Text>Recommendations — {auditDate}</Text>
          <Text render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  );
}