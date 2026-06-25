import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles, COLORS } from "../pdf-styles";
import type { TransformerLoadingResult } from "@/lib/electrical/transformer-loading";

interface TransformerReportProps {
  transformers: TransformerLoadingResult[];
}

const STATUS_COLOR: Record<string, string> = {
  UNDER_UTILIZED: COLORS.accent,
  NORMAL: COLORS.primary,
  HIGH_LOAD: COLORS.warning,
  OVERLOADED: COLORS.danger,
};

export function TransformerReportPDF({ transformers }: TransformerReportProps) {
  const overloaded = transformers.filter((t) => t.status === "OVERLOADED");
  const totalCapacity = transformers.reduce((s, t) => s + t.capacityKVA, 0);
  const totalLoad = transformers.reduce((s, t) => s + t.totalConnectedLoadKVA, 0);
  const avgLoading =
    transformers.length > 0
      ? parseFloat((totalLoad / totalCapacity * 100).toFixed(1))
      : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Transformer Loading Report</Text>
            <Text style={styles.headerSubtitle}>
              Distribution Network Analysis — {new Date().toLocaleDateString("en-IN")}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerBadge}>
              {transformers.length} TRANSFORMERS
            </Text>
          </View>
        </View>

        {/* Alert */}
        {overloaded.length > 0 && (
          <View style={styles.alertBox}>
            <Text style={styles.alertText}>
              ⚠ ALERT: {overloaded.length} transformer(s) are OVERLOADED:{" "}
              {overloaded.map((t) => t.transformerName).join(", ")}
            </Text>
          </View>
        )}

        {/* System summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.row}>
            {[
              { label: "Total Transformers", value: String(transformers.length) },
              { label: "Total Capacity", value: `${totalCapacity} kVA` },
              { label: "Total Connected Load", value: `${totalLoad.toFixed(1)} kVA` },
              { label: "Avg System Loading", value: `${avgLoading}%` },
            ].map(({ label, value }) => (
              <View key={label} style={styles.statBox}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={[styles.statValue, { fontSize: 11 }]}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Transformer table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transformer Register</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              {[
                "Transformer",
                "Feeder",
                "Capacity (kVA)",
                "Load (kVA)",
                "Loading %",
                "Consumers",
                "Status",
              ].map((h) => (
                <Text key={h} style={[styles.tableHeaderCell, { fontSize: 7 }]}>
                  {h}
                </Text>
              ))}
            </View>
            {transformers.map((t, i) => (
              <View
                key={t.transformerId}
                style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={[styles.tableCell, { fontFamily: "Helvetica-Bold" }]}>
                  {t.transformerName}
                </Text>
                <Text style={styles.tableCell}>{t.feederName}</Text>
                <Text style={styles.tableCell}>{t.capacityKVA}</Text>
                <Text style={styles.tableCell}>{t.totalConnectedLoadKVA}</Text>
                <Text style={[styles.tableCell, {
                  color: STATUS_COLOR[t.status],
                  fontFamily: "Helvetica-Bold",
                }]}>
                  {t.loadingPercent}%
                </Text>
                <Text style={styles.tableCell}>{t.consumerCount}</Text>
                <Text style={[styles.tableCell, {
                  color: STATUS_COLOR[t.status],
                  fontSize: 7,
                }]}>
                  {t.status.replace("_", " ")}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Smart Energy Management & Billing System</Text>
          <Text>Transformer Report — {new Date().toLocaleDateString("en-IN")}</Text>
          <Text render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  );
}