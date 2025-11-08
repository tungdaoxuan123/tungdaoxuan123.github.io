// Main application logic

async function renderPositions(positions) {
  const tbody = document.getElementById('positions-body');
  
  if (!positions || positions.length === 0) {
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

function renderMarketResearch(data) {
  const container = document.getElementById('market-research');
  
  if (!data || data.length === 0) {
    container.innerHTML = '<p style="color: #8b949e;">No market research data</p>';
    return;
  }

  let html = '';
  let inTable = false;
  let tableRows = [];

  for (let row of data) {
    // Get first meaningful value from row
    const content = Object.values(row).find(v => v && v.toString().trim().length > 0);
    
    if (!content) continue;

    const text = content.toString().trim();

    // Section headers (##)
    if (text.includes('##')) {
      // Finish any open table
      if (inTable && tableRows.length > 0) {
        html += renderTable(tableRows);
        tableRows = [];
        inTable = false;
      }
      
      const header = text.replace(/##/g, '').trim();
      html += `<h4>${header}</h4>`;
    }

    // Table rows (starts with |)
    else if (text.startsWith('|')) {
      inTable = true;
      const cells = text.split('|')
        .map(c => c.trim())
        .filter(c => c && c !== '---' && !c.match(/^-+$/));
      
      if (cells.length > 0) {
        tableRows.push(cells);
      }
    }

    // Bullet points
    else if (text.startsWith('-')) {
      if (inTable && tableRows.length > 0) {
        html += renderTable(tableRows);
        tableRows = [];
        inTable = false;
      }
      
      const content = text.substring(1).trim();
      if (content.length > 0) {
        html += `<p>• ${content}</p>`;
      }
    }

    // Regular paragraphs
    else if (text.length > 15) {
      if (inTable && tableRows.length > 0) {
        html += renderTable(tableRows);
        tableRows = [];
        inTable = false;
      }
      
      html += `<p>${text}</p>`;
    }
  }

  // Finish any remaining table
  if (inTable && tableRows.length > 0) {
    html += renderTable(tableRows);
  }

  container.innerHTML = html || '<p style="color: #8b949e;">No formatted data</p>';
}

function renderTable(rows) {
  if (rows.length === 0) return '';

  let html = '<table><thead><tr>';
  
  // Header row
  const headerRow = rows[0];
  headerRow.forEach(cell => {
    html += `<th>${cell}</th>`;
  });
  html += '</tr></thead><tbody>';

  // Data rows
  for (let i = 1; i < rows.length; i++) {
    html += '<tr>';
    rows[i].forEach(cell => {
      html += `<td>${cell}</td>`;
    });
    html += '</tr>';
  }

  html += '</tbody></table>';
  return html;
}

async function refreshAllData() {
  console.log('➜ Refreshing all data...');
  
  try {
    // Fetch all data
    const { positions, marketResearch } = await SheetsAPI.fetchAllData();
    
    // Render positions
    console.log(`Rendering ${positions.length} positions`);
    renderPositions(positions);
    
    // Render market research
    console.log(`Rendering market research with ${marketResearch.length} rows`);
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
