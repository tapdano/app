<template>
  <div class="chart-container" :key="chartKey">
    <chart-line :data="chartData" :options="options"></chart-line>
  </div>
</template>

<script lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import { defineComponent, ref, onMounted } from 'vue';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Storage } from '@ionic/storage';
import { Line } from 'vue-chartjs';
import { ChartOptions } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const storage = new Storage();
storage.create();

export default defineComponent({
  name: 'PriceChart',
  components: { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, ChartLine: Line },
  setup() {
    const chartData = ref({
      labels: [],
      datasets: [
        {
          label: 'ADA / USD',
          borderColor: '#f87979',
          backgroundColor: '#f87979',
          data: []
        }
      ]
    });

    const options = ref<ChartOptions<'line'>>({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 7,
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        y: {
          ticks: {
            callback: function(value) {
              return (typeof value === 'number') ? value.toFixed(2) : value;
            },
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      }
    });

    const chartKey = ref(0);

    const CACHE_KEY = 'ADA-USD_CachedData';
    const CACHE_TIME = 3600000; // 1 hour in milliseconds

    onMounted(() => {
      checkCache();
    });

    const checkCache = async () => {
      const cachedData = await storage.get(CACHE_KEY);
      const now = new Date().getTime();

      if (cachedData && (now - cachedData.timestamp) < CACHE_TIME) {
        updateChartData(cachedData.data);
      } else {
        loadData();
      }
    };

    const updateChartData = (data: any) => {
      const pricesByDate: Record<string, number[]> = {};
      data.prices.forEach((price: [number, number]) => {
        const date = new Date(price[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!pricesByDate[date]) {
          pricesByDate[date] = [];
        }
        pricesByDate[date].push(price[1]);
      });

      const averagePrices: number[] = [];
      const labels: string[] = [];
      for (const [date, prices] of Object.entries(pricesByDate)) {
        const sum = prices.reduce((acc, p) => acc + p, 0);
        const average = sum / prices.length;
        averagePrices.push(average);
        labels.push(date);
      }

      chartData.value.labels = labels as any;
      chartData.value.datasets[0].data = averagePrices as any;
      chartKey.value++;
    };

    const loadData = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/cardano/market_chart?vs_currency=usd&days=30');
        if (!response.ok) {
          throw new Error('network error');
        }
        const data = await response.json();
        const now = new Date().getTime();

        await storage.set(CACHE_KEY, { timestamp: now, data: data });

        updateChartData(data);
      } catch (error) {
        console.error(error);
      }
    };

    return { chartData, options, chartKey };
  }
});
</script>

<style>
.chart-container {
  position: relative;
  height: 20vh;
  background-color: #222;
  color: #fff;
}

.tooltip {
  background: #555;
  color: #fff;
  border: none;
  border-radius: 3px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16);
}

.chartjs-render-monitor {
  color: #fff;
  background-color: #444;
}

.line {
  border-color: #fff;
}
</style>