// Main application logic

async function renderPositions(positions) {
  const tbody = document.getElementById('positions-body');
  
  if (positions.length === 0 || (positions[0]['Symbol'] && positions[0]['Symbol'].includes('NO POSITIONS'))) {
    tbody.innerHTML = '<tr><td colspan="5" class="position-empty">No open positions</td></tr>';
    return;
  }

  tbody.innerHTML = positions.map(pos => `
    <tr>
      <td><strong>${pos['Symbol'] || 'N/A'}</strong></td>
      <td>${pos['Side'] || 'N/A'}</td>
      <td>${formatCurrency(parseFloat(pos['Entry Price'] || 0))}</td>
      <td>${formatCurrency(parseFloat(pos['Mark Price'] || 0))}</td>
      <td style="color: ${parseFloat(pos['P&L %'] || 0) >= 0 ? '#A41F13' : '#8F7A6E'}">
        ${formatPercent(pos['P&L %'] || 0)}
      </td>
    </tr>
  `).join('');
}

function renderMarketResearch(data) {
  let analysisHTML = '<div>';
  for (let row of data) {
    const content = Object.values(row).join(' ').trim();
    if (content && content.length > 0) {
      if (content.includes('##')) {
        analysisHTML += `<h4>${content.replace(/##/g, '').trim()}</h4>`;
      } else if (content.includes('-')) {
        analysisHTML += `<p>${content}</p>`;
      } else if (content.length > 20) {
        analysisHTML += `<p>${content}</p>`;
      }
    }
  }
  analysisHTML += '</div>';
  
  document.getElementById('market-research').innerHTML = analysisHTML;
}

async function refreshAllData() {
  console.log('Refreshing all data...');
  
  // Fetch positions
  const positions = await SheetsAPI.fetchPositions();
  renderPositions(positions);
  
  // Fetch market research
  const marketResearch = await SheetsAPI.fetchMarketResearch();
  renderMarketResearch(marketResearch);
  
  // Render charts
  await ChartManager.renderCharts();
  
  console.log('Data refresh complete');
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  refreshAllData();
});

// Auto-refresh every 5 minutes
setInterval(refreshAllData, 5 * 60 * 1000);
