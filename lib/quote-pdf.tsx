import { createElement } from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { renderToBuffer } from "@react-pdf/renderer";
import { formatPenceAsGBP } from "@/lib/currency";
import { calculateLineItemTotal, calculateQuoteTotals } from "@/lib/quote";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  companyName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  muted: {
    color: "#666666",
    marginBottom: 2,
  },
  rightAlign: {
    textAlign: "right",
  },
  quoteTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  table: {
    marginTop: 8,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 6,
  },
  tableHeaderCell: {
    color: "#666666",
    fontFamily: "Helvetica-Bold",
  },
  colDescription: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colUnit: { flex: 1 },
  colUnitPrice: { flex: 1.3, textAlign: "right" },
  colTotal: { flex: 1.3, textAlign: "right" },
  totalsBlock: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    marginBottom: 4,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    paddingTop: 6,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontFamily: "Helvetica-Bold",
  },
  grandTotalValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  notesBlock: {
    marginTop: 28,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 12,
  },
  notesLabel: {
    color: "#666666",
    marginBottom: 4,
  },
});

function formatPdfDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export type QuotePdfLineItem = {
  description: string;
  quantity: number;
  unit: string | null;
  unitPrice: number;
};

export type QuotePdfSettings = {
  companyName: string;
  addressLine1: string;
  addressLine2: string | null;
  phone: string;
  email: string;
  vatNumber: string | null;
} | null;

export type QuotePdfProps = {
  quoteNumber: string;
  issuedAt: Date;
  validUntil: Date | null;
  vatEnabled: boolean;
  vatRate: number;
  notes: string | null;
  lineItems: QuotePdfLineItem[];
  customer: {
    name: string;
    address: string;
    phone: string;
    email: string | null;
  };
  settings: QuotePdfSettings;
};

export function QuoteDocument({
  quoteNumber,
  issuedAt,
  validUntil,
  vatEnabled,
  vatRate,
  notes,
  lineItems,
  customer,
  settings,
}: QuotePdfProps) {
  const { subtotal, vatAmount, total } = calculateQuoteTotals(
    lineItems,
    vatEnabled,
    vatRate
  );

  return (
    <Document title={quoteNumber}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>
              {settings?.companyName ?? "Company name not set"}
            </Text>
            {settings?.addressLine1 && (
              <Text style={styles.muted}>{settings.addressLine1}</Text>
            )}
            {settings?.addressLine2 && (
              <Text style={styles.muted}>{settings.addressLine2}</Text>
            )}
            {settings?.phone && <Text style={styles.muted}>{settings.phone}</Text>}
            {settings?.email && <Text style={styles.muted}>{settings.email}</Text>}
            {settings?.vatNumber && (
              <Text style={styles.muted}>VAT {settings.vatNumber}</Text>
            )}
          </View>
          <View style={styles.rightAlign}>
            <Text style={styles.quoteTitle}>{quoteNumber}</Text>
            <Text style={styles.muted}>{customer.name}</Text>
            <Text style={styles.muted}>{customer.address}</Text>
            <Text style={styles.muted}>{customer.phone}</Text>
            {customer.email && <Text style={styles.muted}>{customer.email}</Text>}
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.muted}>Issued {formatPdfDate(issuedAt)}</Text>
          {validUntil && (
            <Text style={styles.muted}>
              Valid until {formatPdfDate(validUntil)}
            </Text>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colDescription, styles.tableHeaderCell]}>
              Description
            </Text>
            <Text style={[styles.colQty, styles.tableHeaderCell]}>Qty</Text>
            <Text style={[styles.colUnit, styles.tableHeaderCell]}>Unit</Text>
            <Text style={[styles.colUnitPrice, styles.tableHeaderCell]}>
              Unit price
            </Text>
            <Text style={[styles.colTotal, styles.tableHeaderCell]}>
              Total
            </Text>
          </View>
          {lineItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{item.unit ?? ""}</Text>
              <Text style={styles.colUnitPrice}>
                {formatPenceAsGBP(item.unitPrice)}
              </Text>
              <Text style={styles.colTotal}>
                {formatPenceAsGBP(
                  calculateLineItemTotal(item.quantity, item.unitPrice)
                )}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>{formatPenceAsGBP(subtotal)}</Text>
          </View>
          {vatEnabled && (
            <View style={styles.totalsRow}>
              <Text style={styles.muted}>VAT ({vatRate}%)</Text>
              <Text>{formatPenceAsGBP(vatAmount)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>
              {formatPenceAsGBP(total)}
            </Text>
          </View>
        </View>

        {notes && (
          <View style={styles.notesBlock}>
            <Text style={styles.notesLabel}>Notes / terms</Text>
            <Text>{notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

// @react-pdf/renderer types renderToBuffer as accepting only a
// ReactElement<DocumentProps>, but the documented pattern is to pass a
// wrapper component that renders <Document> internally (as QuoteDocument
// does) — hence the assertion.
export async function renderQuotePdfBuffer(
  props: QuotePdfProps
): Promise<Buffer> {
  const element = createElement(
    QuoteDocument,
    props
  ) as unknown as Parameters<typeof renderToBuffer>[0];

  return renderToBuffer(element);
}
