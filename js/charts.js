// Chart management

const ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', cryptoId: 'bitcoin', color: '#A41F13' },
  { symbol: 'ETH', name: 'Ethereum', cryptoId: 'ethereum', color: '#292F36' },
  { symbol: 'SOL', name: 'Solana', cryptoId: 'solana', color: '#8F7A6E' },
  { symbol: 'GOOGL', name: 'Google', type: 'stock', color: '#A41F13' },
  { symbol: 'TSLA', name: 'Tesla', type: 'stock', color: '#292F36' },
  { symbol: 'AMZN', name: 'Amazon', type: 'stock', color: '#8F7A6E' }
];

const ChartManager = {
  charts: {},

  async renderCharts() {
    const container = document.getElementById('charts-container');
    container.innerHTML = '';

    for (const asset of ASSETS) {
      if (asset.type === 'stock') continue; // Skip stocks for now

      const historicalData = await API.getCryptoHistorical(asset.cryptoId, 7);
      if (historicalData.length > 0) {
        this.createChart(asset, historicalData);
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  },

  createChart(asset, historicalData) {
    const container = document.getElementById('charts-container');
    
    const chartDiv = document.createElement('div');
    chartDiv.className = 'asset-card';
    chartDiv.innerHTML = `
      <div class="asset-title">${asset.symbol} - ${asset.name}</div>
      <div class="chart-container">
        <canvas id="chart-${asset.symbol}"></canvas>
      </div>
    `;
    container.appendChild(chartDiv);

    const ctx = document.getElementById(`chart-${asset.symbol}`);
    const labels = historicalData.map(d => new Date(d.time).toLocaleDateString());
    const prices = historicalData.map(d => d.price);

    if (this.charts[asset.symbol]) {
      this.charts[asset.symbol].destroy();
    }

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `${asset.symbol} Price`,
          data: prices,
          borderColor: asset.color,
          backgroundColor: asset.color + '15',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: { color: '#8F7A6E' },
            grid: { color: '#E0DBD8' }
          },
          x: {
            ticks: { color: '#8F7A6E', maxTicksLimit: 4 },
            grid: { color: '#E0DBD8' }
          }
        }
      }
    });

    this.charts[asset.symbol] = chart;
  }
};
