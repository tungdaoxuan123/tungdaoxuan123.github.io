// Main application logic

async function renderPositions(positions) {
  const tbody = document.getElementById('positions-body');
  
  if (positions.length === 0 || (positions[0]?.Symbol && positions[0].Symbol.includes('NO POSITIONS'))) {
    tbody.innerHTML = '<tr><td colspan="5" class="position-empty">— No open positions —</td></tr>';
    return;
  }

  tbody.innerHTML = positions.map(pos => {
    const pnlValue = parseFloat(pos['P&L %'] || 0);
    const pnlClass = pnlValue >= 0 ? 'positive' : 'negative';
    
    return `
      <tr>
        <td><strong>${pos['Symbol'] || 'N/A'}</strong></td>
        <td>${pos['Side'] || 'N/A'}</td>
        <td class="number">$${parseFloat(pos['Entry Price'] || 0).toFixed(2)}</td>
        <td class="number">$${parseFloat(pos['Mark Price'] || 0).toFixed(2)}</td>
        <td class="${pnlClass} number">${formatPercent(pos['P&L %'] || 0)}</td>
      </tr>
    `;
  }).join('');
}

function renderMarketResearch(rawData) {
  let analysisHTML = '';
  
  // If data is array of objects, get all values
  if (Array.isArray(rawData)) {
    for (let row of rawData) {
      // Get all values from the row
      const values = Object.values(row).filter(v => v && v.trim().length > 0);
      
      for (let content of values) {
        content = content.trim();
        
        if (!content || content.length === 0) continue;
        
        // Skip separator lines and metadata
        if (content.includes('---') || content === '|' || content.match(/^[|\s-]+$/)) {
          continue;
        }
        
        // Headings with ##
        if (content.includes('##')) {
          const heading = content.replace(/##/g, '').trim();
          if (heading.length > 0) {
            analysisHTML += `<h4>${heading}</h4>`;
          }
        }
        // Bullet points and paragraphs
        else if (content.startsWith('-')) {
          const text = content.substring(1).trim();
          analysisHTML += `<p>• ${text}</p>`;
        }
        // Regular paragraphs
        else if (content.length > 15) {
          analysisHTML += `<p>${content}</p>`;
        }
      }
    }
  }
  
  const marketResearchDiv = document.getElementById('market-research');
  if (analysisHTML.trim().length === 0) {
    marketResearchDiv.innerHTML = '<p style="color: #8b949e;">No market research data available</p>';
  } else {
    marketResearchDiv.innerHTML = analysisHTML;
  }
}

async function refreshAllData() {
  console.log('➜ Refreshing all data...');
  
  try {
    // Fetch positions
    const positions = await SheetsAPI.fetchPositions();
    renderPositions(positions);
    
    // Fetch market research
    const marketResearch = await SheetsAPI.fetchMarketResearch();
    console.log('Market Research Raw Data:', marketResearch);
    renderMarketResearch(marketResearch);
    
    // Render charts
    await ChartManager.renderCharts();
    
    console.log('✓ Data refresh complete');
  } catch (error) {
    console.error('✗ Error refreshing data:', error);
  }
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  refreshAllData();
  // Auto-refresh every 5 minutes
  setInterval(refreshAllData, 5 * 60 * 1000);
});
