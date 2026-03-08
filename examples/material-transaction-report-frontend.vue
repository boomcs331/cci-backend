<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">รายงานการรับเข้า-จ่ายออกวัตถุดิบ</h1>

    <!-- Filters -->
    <div class="bg-white p-4 rounded shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">วันที่เริ่มต้น</label>
          <input
            v-model="filters.startDate"
            type="date"
            class="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">วันที่สิ้นสุด</label>
          <input
            v-model="filters.endDate"
            type="date"
            class="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">รหัสวัตถุดิบ</label>
          <input
            v-model.number="filters.materialId"
            type="number"
            class="w-full border rounded px-3 py-2"
            placeholder="ทั้งหมด"
          />
        </div>
        <div class="flex items-end">
          <button
            @click="fetchReport"
            :disabled="loading"
            class="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {{ loading ? 'กำลังโหลด...' : 'ค้นหา' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Report Table -->
    <div class="bg-white rounded shadow overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-4 py-3 text-left">วันที่</th>
            <th class="px-4 py-3 text-left">รหัสวัตถุดิบ</th>
            <th class="px-4 py-3 text-left">ชื่อวัตถุดิบ</th>
            <th class="px-4 py-3 text-right">รับเข้า</th>
            <th class="px-4 py-3 text-right">จ่ายออก</th>
            <th class="px-4 py-3 text-right">คงเหลือ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="report.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-gray-500">
              ไม่พบข้อมูล
            </td>
          </tr>
          <tr
            v-for="(item, index) in report"
            :key="`${item.materialId}-${item.transactionDate}-${index}`"
            class="border-t hover:bg-gray-50"
          >
            <td class="px-4 py-3">{{ item.transactionDate }}</td>
            <td class="px-4 py-3">{{ item.materialCode }}</td>
            <td class="px-4 py-3">{{ item.materialName }}</td>
            <td class="px-4 py-3 text-right text-green-600 font-medium">
              {{ formatNumber(item.received) }}
            </td>
            <td class="px-4 py-3 text-right text-red-600 font-medium">
              {{ formatNumber(item.issued) }}
            </td>
            <td class="px-4 py-3 text-right font-bold">
              {{ formatNumber(item.balance) }}
            </td>
          </tr>
        </tbody>
        <tfoot v-if="report.length > 0" class="bg-gray-100 font-bold">
          <tr>
            <td colspan="3" class="px-4 py-3">รวมทั้งหมด</td>
            <td class="px-4 py-3 text-right text-green-600">
              {{ formatNumber(totalReceived) }}
            </td>
            <td class="px-4 py-3 text-right text-red-600">
              {{ formatNumber(totalIssued) }}
            </td>
            <td class="px-4 py-3 text-right">{{ formatNumber(totalBalance) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

interface MaterialTransactionReport {
  materialId: number;
  materialCode: string;
  materialName: string;
  transactionDate: string;
  received: number;
  issued: number;
  balance: number;
}

const API_BASE_URL = 'http://localhost:3000/api';

const report = ref<MaterialTransactionReport[]>([]);
const loading = ref(false);
const filters = ref({
  startDate: '',
  endDate: '',
  materialId: undefined as number | undefined
});

const totalReceived = computed(() => 
  report.value.reduce((sum, item) => sum + item.received, 0)
);

const totalIssued = computed(() => 
  report.value.reduce((sum, item) => sum + item.issued, 0)
);

const totalBalance = computed(() => 
  report.value.reduce((sum, item) => sum + item.balance, 0)
);

const formatNumber = (num: number) => num.toLocaleString();

const fetchReport = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (filters.value.startDate) params.append('startDate', filters.value.startDate);
    if (filters.value.endDate) params.append('endDate', filters.value.endDate);
    if (filters.value.materialId) params.append('materialId', filters.value.materialId.toString());
    
    const response = await axios.get(
      `${API_BASE_URL}/materials/transactions/report/transactions?${params.toString()}`
    );
    report.value = response.data.data;
  } catch (error) {
    console.error('Error fetching report:', error);
    alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchReport();
});
</script>
