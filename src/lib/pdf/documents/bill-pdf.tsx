import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { styles, COLORS } from "../pdf-styles";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface BillPDFProps {
  bill: {
    id: string;
    billingMonth: number;
    billingYear: number;
    unitsConsumed: number;
    energyCharge: number;
    fixedCharge: number;
    demandCharge: number;
    powerFactorPenalty: number;
    solarAdjustment: number;
    taxAmount: number;
    totalAmount: number;
    status: string;
    dueDate: Date | null;
    paidAt: Date | null;
    consumer: {
      consumerNumber: string;
      consumerType: string;
      address: string;
      sanctionedLoad: number;
      user: { name: string; email: string };
      meter: { meterNumber: string } | null;
      transformer: {
        transformerName: string;
        feeder: { feederName: string };
      } | null;
    };
  };
}

export function BillPDF({ bill }: BillPDFProps) {
  const { consumer } = bill;

  const lineItems = [
    {
      description: "Energy Charge (Units Consumed)",
      units: `${bill.unitsConsumed} kWh`,
      amount: bill.energyCharge,
    },
    {
      description: "Fixed Charge",
      units: "Monthly",
      amount: bill.fixedCharge,
    },
    ...(bill.demandCharge > 0
      ? [{ description: "Demand Charge", units: "kVA", amount: bill.demandCharge }]
      : []),
    ...(bill.powerFactorPenalty > 0
      ? [{ description: "Power Factor Penalty", units: "PF < 0.9", amount: bill.powerFactorPenalty }]
      : []),
    ...(bill.solarAdjustment > 0
      ? [{ description: "Solar Net Metering Adjustment", units: "kWh", amount: -bill.solarAdjustment }]
      : []),
    { description: "Electricity Duty (5%)", units: "Tax", amount: bill.taxAmount },
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>⚡ Smart Energy Management</Text>
            <Text style={styles.headerSubtitle}>
              Electricity Bill — {MONTH_NAMES[bill.billingMonth - 1]} {bill.billingYear}
            </Text>
            <Text style={[styles.headerSubtitle, { marginTop: 4 }]}>
              Bill No: {bill.id.slice(0, 12).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerBadge}>{bill.status}</Text>
            {bill.dueDate && (
              <Text style={[styles.headerSubtitle, { marginTop: 6 }]}>
                Due: {new Date(bill.dueDate).toLocaleDateString("en-IN")}
              </Text>
            )}
          </View>
        </View>

        {/* Consumer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consumer Details</Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              {[
                ["Consumer Name", consumer.user.name],
                ["Consumer Number", consumer.consumerNumber],
                ["Consumer Type", consumer.consumerType],
                ["Email", consumer.user.email],
              ].map(([label, value]) => (
                <View key={label} style={styles.kvRow}>
                  <Text style={styles.kvLabel}>{label}</Text>
                  <Text style={styles.kvValue}>{value}</Text>
                </View>
              ))}
            </View>
            <View style={{ width: 20 }} />
            <View style={styles.col2}>
              {[
                ["Meter Number", consumer.meter?.meterNumber ?? "—"],
                ["Sanctioned Load", `${consumer.sanctionedLoad} kW`],
                ["Transformer", consumer.transformer?.transformerName ?? "—"],
                ["Feeder", consumer.transformer?.feeder.feederName ?? "—"],
              ].map(([label, value]) => (
                <View key={label} style={styles.kvRow}>
                  <Text style={styles.kvLabel}>{label}</Text>
                  <Text style={styles.kvValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Address</Text>
            <Text style={styles.kvValue}>{consumer.address}</Text>
          </View>
        </View>

        {/* Bill Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Breakdown</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              {["Description", "Details", "Amount (₹)"].map((h) => (
                <Text key={h} style={styles.tableHeaderCell}>{h}</Text>
              ))}
            </View>
            {lineItems.map((item, i) => (
              <View
                key={i}
                style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={styles.tableCell}>{item.description}</Text>
                <Text style={styles.tableCell}>{item.units}</Text>
                <Text style={[styles.tableCell, {
                  color: item.amount < 0 ? COLORS.accent : COLORS.secondary,
                  fontFamily: "Helvetica-Bold",
                }]}>
                  {item.amount < 0 ? `(${Math.abs(item.amount).toFixed(2)})` : item.amount.toFixed(2)}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.totalValue}>
                ₹{bill.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Summary stat boxes */}
        <View style={[styles.row, { marginBottom: 20 }]}>
          {[
            { label: "Units Consumed", value: `${bill.unitsConsumed} kWh` },
            { label: "Energy Charge", value: `₹${bill.energyCharge}` },
            { label: "Tax (5%)", value: `₹${bill.taxAmount}` },
            { label: "Net Payable", value: `₹${bill.totalAmount}` },
          ].map(({ label, value }) => (
            <View key={label} style={styles.statBox}>
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={[styles.statValue, { fontSize: 12 }]}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Payment status */}
        {bill.status === "PAID" && bill.paidAt ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              ✓ PAID on {new Date(bill.paidAt).toLocaleDateString("en-IN")}
            </Text>
          </View>
        ) : bill.status === "OVERDUE" ? (
          <View style={styles.alertBox}>
            <Text style={styles.alertText}>
              ⚠ OVERDUE — Please pay immediately to avoid disconnection.
            </Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Smart Energy Management & Billing System</Text>
          <Text>
            Generated: {new Date().toLocaleDateString("en-IN")} | Bill ID: {bill.id.slice(0, 8).toUpperCase()}
          </Text>
          <Text render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  );
}