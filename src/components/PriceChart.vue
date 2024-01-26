<template>
  <div class="chart-container" :key="chartKey">
    <chart-line :data="chartData" :options="options"></chart-line>
  </div>
</template>

<script lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import { defineComponent, ref, onMounted } from 'vue';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Line } from 'vue-chartjs';

ChartJS.register(...registerables);

export default defineComponent({
  name: 'PriceChart',
  components: { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, ChartLine: Line },
  setup() {
    const chartData = ref({
      labels: [],
      datasets: [
        {
          label: 'ADA / USD',
          backgroundColor: '#f87979',
          data: []
        }
      ]
    });

    const options = ref({
      responsive: true,
      maintainAspectRatio: false
    });

    const chartKey = ref(0);

    onMounted(() => {
      loadData();
    });

    const loadData = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/cardano/market_chart?vs_currency=usd&days=10');
        if (!response.ok) {
          throw new Error('Erro na resposta da rede');
        }
        const data = await response.json();

        chartData.value.labels = data.prices.map((price: [number, number]) => {
          let date = new Date(price[0]);
          return date.toLocaleDateString();
        });

        chartData.value.datasets[0].data = data.prices.map((price: [number, number]) => price[1]);

        chartKey.value++;
      } catch (error) {
        console.error('Erro ao buscar dados da API:', error);
      }
    };

    return { chartData, options, chartKey };
  }
});
</script>

<style>
.chart-container {
  position: relative;
  height: 40vh;
  background-color: #FFF;
}
</style>