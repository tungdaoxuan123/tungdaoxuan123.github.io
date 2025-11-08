// Chart management

const ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', cryptoId: 'bitcoin', color: '#f7931a', lineColor: '#f7931a' },
  { symbol: 'ETH', name: 'Ethereum', cryptoId: 'ethereum', color: '#627eea', lineColor: '#627eea' },
  { symbol: 'SOL', name: 'Solana', cryptoId: 'solana', color: '#00d4aa', lineColor: '#14f195' },
  { symbol: 'GOOGL', name: 'Google', type: 'stock', color: '#4285f4', lineColor: '#4285f4' },
  { symbol: 'TSLA', name: 'Tesla', type: 'stock', color: '#e82127', lineColor: '#ff6b6b' },
  { symbol: 'AMZN', name: 'Amazon', type: 'stock', color: '#ff9900', lineColor: '#ffa500' }
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
    const labels = historicalData.map(d => new Date(d.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const prices = historicalData.map(d => d.price);

    if (this.charts[asset.symbol]) {
      this.charts[asset.symbol].destroy();
    }

    // Determine if price is trending up or down
    const isUptrend = prices[prices.length - 1] > prices[0];
    const lineColor = isUptrend ? '#3fb950' : '#f85149';
    const fillColor = isUptrend ? '#3fb95015' : '#f8514915';

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: `${asset.symbol}`,
          data: prices,
          borderColor: lineColor,
          backgroundColor: fillColor,
          borderWidth: 2.5,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: lineColor,
          pointBorderColor: '#0d1117',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: lineColor,
          pointHoverBorderColor: '#161b22',
          pointHoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#161b22',
            titleColor: '#58a6ff',
            bodyColor: '#c9d1d9',
            borderColor: '#30363d',
            borderWidth: 1,
            padding: 10,
            titleFont: {
              family: "'IBM Plex Sans', sans-serif",
              size: 12,
              weight: '600'
            },
            bodyFont: {
              family: "'IBM Plex Mono', monospace",
              size: 11,
              weight: '500'
            },
            callbacks: {
              label: function(context) {
                let label = '';
                if (context.parsed.y !== null) {
                  label = '$' + context.parsed.y.toFixed(2);
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              color: '#8b949e',
              font: {
                family: "'IBM Plex Mono', monospace",
                size: 11,
                weight: '500'
              },
              callback: function(value) {
                return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
              }
            },
            grid: {
              color: '#21262d',
              drawBorder: false
            }
          },
          x: {
            ticks: {
              color: '#8b949e',
              font: {
                family: "'IBM Plex Mono', monospace",
                size: 10,
                weight: '500'
              },
              maxTicksLimit: 5
            },
            grid: {
              display: false,
              drawBorder: false
            }
          }
        }
      }
    });

    this.charts[asset.symbol] = chart;
  }
};

// Export globally
window.ChartManager = ChartManager;
