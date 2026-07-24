import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2563EB'
    },
    subtitle: {
        fontSize: 10,
        color: '#666666',
        marginTop: 5
    },
    section: {
        margin: 10,
        padding: 10,
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        paddingVertical: 8,
        alignItems: 'center'
    },
    label: {
        width: '30%',
        fontSize: 10,
        color: '#666666',
        fontWeight: 'bold'
    },
    value: {
        width: '70%',
        fontSize: 10,
        color: '#333333'
    },
    totalRow: {
        flexDirection: 'row',
        marginTop: 20,
        paddingTop: 10,
        borderTopWidth: 2,
        borderTopColor: '#2563EB',
        justifyContent: 'flex-end'
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        marginRight: 10
    },
    totalValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2563EB'
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        color: '#999999',
        fontSize: 8,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        paddingTop: 10
    }
});

// Create Document Component
const InvoiceDocument = ({ transaction }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>INVOICE</Text>
                    <Text style={styles.subtitle}>Public Infrastructure Issue Reporting System</Text>
                </View>
                <View>
                    <Text style={{ fontSize: 10, color: '#666' }}>TXN-#{transaction.id}</Text>
                    <Text style={{ fontSize: 10, color: '#666' }}>Date: {new Date(transaction.date).toLocaleDateString()}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>Bill To:</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Customer Name</Text>
                    <Text style={styles.value}>{transaction.userName || transaction.user}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Email Address</Text>
                    <Text style={styles.value}>{transaction.userEmail || 'N/A'}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>Transaction Details:</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Deiscription</Text>
                    <Text style={styles.value}>{transaction.type || 'Subscription Payment'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Status</Text>
                    <Text style={styles.value}>{transaction.status}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Payment Method</Text>
                    <Text style={styles.value}>Credit/Debit Card</Text>
                </View>
            </View>

            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalValue}>{transaction.amount} BDT</Text>
            </View>

            <Text style={styles.footer}>
                Thank you for your payment. This is a computer-generated invoice and requires no signature.
                For support, contact support@issuesystem.gov.bd
            </Text>
        </Page>
    </Document>
);

export default InvoiceDocument;
