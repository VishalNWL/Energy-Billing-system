import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles, COLORS } from "../pdf-styles";

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

const BILL_STATUS_COLOR: Record<string, string> = {
  PAID: COLORS.accent,
  PENDING: COLORS.warning,
  OVERDUE: COLORS.danger,
};

interface ConsumerReportProps {
  consumer: {
    consumerNumber: string;
    consumerType: string;
    address: string;
    sanctionedLoad: number;
    contractedDemand: number | null;
    user: { name: string; email: string };
    meter: { meterNumber: string; isActive: boolean } | null;
    transformer: {
      transformerName: string;
      feeder: { feederName: string };
    } | null;
    solarPlant: { installedCapacityKW: number; generatedUnits: number } | null;
    bills: {
      billingMonth: number;
      billingYear: number;
      unitsConsumed: number;
      totalAmount: number;
      status: string;
    }[];
  };
  totalUnits: number;
  totalBilled: number;
  avgMonthlyUnits: number;
}

export function ConsumerReportPDF({
  consumer,
  totalUnits,
  totalBilled,
  avgMonthlyUnits,
}: ConsumerReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Consumer Report</Text>
            <Text style={styles.headerSubtitle}>
              {consumer.consumerNumber} — {consumer.user.name}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerBadge}>{consumer.consumerType}</Text>
            <Text style={[styles.headerSubtitle, { marginTop: 6 }]}>
              {new Date().toLocaleDateString("en-IN")}
            </Text>
          </View>
        </View>

        {/* Consumer info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consumer Information</Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              {[
                ["Name", consumer.user.name],
                ["Email", consumer.user.email],
                ["Consumer #", consumer.consumerNumber],
                ["Type", consumer.consumerType],
              ].map(([l, v]) => (
                <View key={l} style={styles.kvRow}>
                  <Text style={styles.kvLabel}>{l}</Text>
                  <Text style={styles.kvValue}>{v}</Text>
                </View>
              ))}
            </View>
            <View style={{ width: 20 }} />
            <View style={styles.col2}>
              {[
                ["Meter #", consumer.meter?.meterNumber ?? "—"],
                ["Sanctioned Load", `${consumer.sanctionedLoad} kW`],
                ["Contracted Demand", consumer.contractedDemand ? `${consumer.contractedDemand} kVA` : "N/A"],
                ["Solar Plant", consumer.solarPlant ? `${consumer.solarPlant.installedCapacityKW} kW` : "None"],
              ].map(([l, v]) => (
                <View key={l} style={styles.kvRow}>
                  <Text style={styles.kvLabel}>{l}</Text>
                  <Text style={styles.kvValue}>{v}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Address</Text>
            <Text style={styles.kvValue}>{consumer.address}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Transformer / Feeder</Text>
            <Text style={styles.kvValue}>
              {consumer.transformer
                ? `${consumer.transformer.transformerName} → ${consumer.transformer.feeder.feederName}`
                : "Unassigned"}
            </Text>
          </View>
        </View>

        {/* Summary stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consumption Summary</Text>
          <View style={styles.row}>
            {[
              { label: "Total Units", value: `${totalUnits.toFixed(0)} kWh` },
              { label: "Total Billed", value: `₹${totalBilled.toLocaleString("en-IN")}` },
              { label: "Avg Monthly", value: `${avgMonthlyUnits.toFixed(0)} kWh` },
              { label: "Bills Count", value: String(consumer.bills.length) },
            ].map(({ label, value }) => (
              <View key={label} style={styles.statBox}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={[styles.statValue, { fontSize: 11 }]}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bill history */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing History</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              {["Month/Year", "Units (kWh)", "Amount (₹)", "Status"].map((h) => (
                <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
              ))}
            </View>
            {consumer.bills.map((bill, i) => (
              <View
                key={i}
                style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={styles.tableCell}>
                  {MONTH_NAMES[bill.billingMonth - 1]} {bill.billingYear}
                </Text>
                <Text style={styles.tableCell}>{bill.unitsConsumed}</Text>
                <Text style={[styles.tableCell, { fontFamily: "Helvetica-Bold" }]}>
                  {bill.totalAmount.toLocaleString("en-IN")}
                </Text>
                <Text style={[styles.tableCell, {
                  color: BILL_STATUS_COLOR[bill.status] ?? COLORS.secondary,
                  fontFamily: "Helvetica-Bold",
                }]}>
                  {bill.status}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>
                ₹{totalBilled.toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Smart Energy Management & Billing System</Text>
          <Text>Consumer Report — {new Date().toLocaleDateString("en-IN")}</Text>
          <Text render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  );
}