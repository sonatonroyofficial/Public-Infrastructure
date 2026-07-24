import { useState, useEffect } from 'react';
import { userAPI } from '../utils/api';
import { FaMoneyBillWave, FaSearch, FaFilter, FaFileInvoice } from 'react-icons/fa';
import { PDFDownloadLink } from '@react-pdf/renderer';
import InvoiceDocument from '../components/InvoiceDocument';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        try {
            const response = await userAPI.getPayments();
            setPayments(response.data.payments);
        } catch (error) {
            console.error('Error loading payments:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-10">Loading payments...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <FaMoneyBillWave className="text-green-600" /> Payment History
                </h1>
                <p className="text-gray-600">Track all incoming transaction records.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Transaction Info</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">User</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Invoice</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {payments.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{p.type}</div>
                                    <div className="text-xs text-gray-500">TXN-#{p.id}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">{p.user}</td>
                                <td className="px-6 py-4 font-mono font-medium text-gray-900">{p.amount} tk</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(p.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 uppercase">
                                        {p.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <PDFDownloadLink
                                        document={<InvoiceDocument transaction={p} />}
                                        fileName={`invoice_${p.id}.pdf`}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                                    >
                                        {({ loading }) => (
                                            loading ? 'Generating...' : <><FaFileInvoice /> Download</>
                                        )}
                                    </PDFDownloadLink>
                                </td>
                            </tr>
                        ))}
                        {payments.length === 0 && (
                            <tr><td colSpan="5" className="text-center py-8 text-gray-500">No payments found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Payments;
