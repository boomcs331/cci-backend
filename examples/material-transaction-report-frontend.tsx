import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Types
interface MaterialTransactionReport {
  materialId: number;
  materialCode: string;
  materialName: string;
  transactionDate: string;
  received: number;
  issued: number;
  balance: number;
}

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  materialId?: number;
}

// API Service
const API_BASE_URL = 'http://localhost:3000/api';

export const materialReportService = {
  getTransactionReport: async (filters: ReportFilters) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.materialId) params.append('materialId', filters.materialId.toString());
    
    const response = await axios.get(
      `${API_BASE_URL}/materials/transactions/report/transactions?${params.toString()}`
    );
    return response.data.data;
  }
};

// React Component
export const MaterialTransactionReportPage: React.FC = () => {
  const [report, setReport] = useState<MaterialTransactionReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: '',
    endDate: '',
    materialId: undefined
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await materialReportService.getTransactionReport(filters);
      setReport(data);
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">รายงานการรับเข้า-จ่ายออกวัตถุดิบ</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">วันที่เริ่มต้น</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">วันที่สิ้นสุด</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">รหัสวัตถุดิบ</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              placeholder="ทั้งหมด"
              value={filters.materialId || ''}
              onChange={(e) => setFilters({ ...filters, materialId: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'กำลังโหลด...' : 'ค้นหา'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">วันที่</th>
              <th className="px-4 py-3 text-left">รหัสวัตถุดิบ</th>
              <th className="px-4 py-3 text-left">ชื่อวัตถุดิบ</th>
              <th className="px-4 py-3 text-right">รับเข้า</th>
              <th className="px-4 py-3 text-right">จ่ายออก</th>
              <th className="px-4 py-3 text-right">คงเหลือ</th>
            </tr>
          </thead>
          <tbody>
            {report.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              report.map((item, index) => (
                <tr key={`${item.materialId}-${item.transactionDate}-${index}`} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{item.transactionDate}</td>
                  <td className="px-4 py-3">{item.materialCode}</td>
                  <td className="px-4 py-3">{item.materialName}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">
                    {item.received.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">
                    {item.issued.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {item.balance.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {report.length > 0 && (
            <tfoot className="bg-gray-100 font-bold">
              <tr>
                <td colSpan={3} className="px-4 py-3">รวมทั้งหมด</td>
                <td className="px-4 py-3 text-right text-green-600">
                  {report.reduce((sum, item) => sum + item.received, 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-red-600">
                  {report.reduce((sum, item) => sum + item.issued, 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {report.reduce((sum, item) => sum + item.balance, 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default MaterialTransactionReportPage;
