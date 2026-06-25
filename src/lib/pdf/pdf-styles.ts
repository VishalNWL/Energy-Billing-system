import { StyleSheet, Font } from "@react-pdf/renderer";

export const COLORS = {
  primary: "#1e40af",    // blue-800
  secondary: "#374151",  // gray-700
  accent: "#16a34a",     // green-600
  danger: "#dc2626",     // red-600
  warning: "#ca8a04",    // yellow-600
  muted: "#6b7280",      // gray-500
  border: "#e5e7eb",     // gray-200
  background: "#f9fafb", // gray-50
  white: "#ffffff",
};

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.secondary,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: `2px solid ${COLORS.primary}`,
  },
  headerLeft: { flex: 1 },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
  },
  headerRight: { alignItems: "flex-end" },
  headerBadge: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    padding: "4 10",
    borderRadius: 4,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  // Sections
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  // Grid layout
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  col2: { flex: 1 },
  // Key-value pairs
  kvRow: {
    flexDirection: "row",
    marginBottom: 5,
    paddingVertical: 3,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  kvLabel: {
    width: 140,
    color: COLORS.muted,
    fontSize: 9,
  },
  kvValue: {
    flex: 1,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  // Table
  table: { marginBottom: 12 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    padding: "6 8",
    borderRadius: "3 3 0 0",
  },
  tableHeaderCell: {
    color: COLORS.white,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    padding: "5 8",
    borderBottom: `1px solid ${COLORS.border}`,
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: "5 8",
    borderBottom: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.background,
  },
  tableCell: { flex: 1, fontSize: 8 },
  // Stat boxes
  statBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 4,
    padding: 10,
    marginRight: 8,
    alignItems: "center",
  },
  statLabel: { fontSize: 8, color: COLORS.muted, marginBottom: 3 },
  statValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
  },
  // Total row
  totalRow: {
    flexDirection: "row",
    padding: "8 8",
    backgroundColor: COLORS.primary,
    borderRadius: "0 0 3 3",
    marginTop: 1,
  },
  totalLabel: {
    flex: 1,
    color: COLORS.white,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  totalValue: {
    color: COLORS.white,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    color: COLORS.muted,
    fontSize: 8,
    borderTop: `1px solid ${COLORS.border}`,
    paddingTop: 8,
  },
  // Alert box
  alertBox: {
    padding: 10,
    borderRadius: 4,
    marginBottom: 12,
    border: `1px solid ${COLORS.danger}`,
    backgroundColor: "#fef2f2",
  },
  alertText: { fontSize: 9, color: COLORS.danger },
  // Success box
  successBox: {
    padding: 10,
    borderRadius: 4,
    marginBottom: 12,
    border: `1px solid ${COLORS.accent}`,
    backgroundColor: "#f0fdf4",
  },
  successText: { fontSize: 9, color: COLORS.accent },
});