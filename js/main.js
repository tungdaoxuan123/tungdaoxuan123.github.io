// Main application logic

async function renderPositions(positions) {
  const tbody = document.getElementById('positions-body');
  
  if (!positions || positions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="position-empty">— No open positions —</td></tr>';
    console.log('ℹ️  No active positions to display');
    return;
  }

  console.log(`Rendering ${positions.length} positions...`);
  
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
    container.innerHTML = '<p style="color: #8b949e;">📭 No market research data available</p>';
    console.log('ℹ️  No market research data');
    return;
  }

  console.log(`Rendering ${data.length} rows of market research...`);
  
  let html = '';
  let currentTable = [];
  let inTable = false;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    // Get first non-empty value
    let content = '';
    for (const key in row) {
      if (row[key] && row[key].toString().trim().length > 0) {
        content = row[key].toString().trim();
        break;
      }
    }

    if (!content) continue;

    // Section headers (##)
    if (content.includes('##')) {
      // Flush any open table
      if (inTable && currentTable.length > 0) {
        html += renderTable(currentTable);
        currentTable = [];
        inTable = false;
      }
      
      const header = content.replace(/##/g, '').replace(/#/g, '').trim();
      if (header) {
        html += `<h4>${header}</h4>`;
      }
    }

    // Table rows (pipe-separated)
    else if (content.includes('|') && content.split('|').length > 2) {
      inTable = true;
      
      const cells = content.split('|')
        .map(c => c.trim())
        .filter(c => c && c !== '---' && !c.match(/^-+$/));
      
      if (cells.length > 0) {
        currentTable.push(cells);
      }
    }

    // Bullet points
    else if (content.startsWith('-') && !content.match(/^-+$/)) {
      if (inTable && currentTable.length > 0) {
        html += renderTable(currentTable);
        currentTable = [];
        inTable = false;
      }
      
      const bulletContent = content.substring(1).trim();
      if (bulletContent.length > 0) {
        html += `<p>• ${bulletContent}</p>`;
      }
    }

    // Regular paragraphs (longer than 10 chars)
    else if (content.length > 10 && !content.match(/^-+$/)) {
      if (inTable && currentTable.length > 0) {
        html += renderTable(currentTable);
        currentTable = [];
        inTable = false;
      }
      
      html += `<p>${content}</p>`;
    }
  }

  // Finish any remaining table
  if (inTable && currentTable.length > 0) {
    html += renderTable(currentTable);
  }

  container.innerHTML = html || '<p style="color: #8b949e;">📭 No formatted content</p>';
  console.log(`✓ Market research rendered`);
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
    rows[i].forEach((cell, idx) => {
      html += `<td>${cell}</td>`;
    });
    html += '</tr>';
  }

  html += '</tbody></table>';
  return html;
}

async function refreshAllData() {
  const statusEl = document.getElementById('status');
  statusEl.textContent = '⏳ Refreshing data...';
  statusEl.className = 'status loading';
  
  console.log('\n➜ REFRESH START ➜➜➜➜➜➜➜➜➜➜➜➜➜➜➜➜');
  
  try {
    // Fetch all data
    const { positions, marketResearch } = await SheetsAPI.fetchAllData();
    
    // Render positions
    renderPositions(positions);
    
    // Render market research
    renderMarketResearch(marketResearch);
    
    // Render charts
    await ChartManager.renderCharts();
    
    statusEl.textContent = '✅ Data loaded successfully';
    statusEl.className = 'status';
    document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
    
    console.log('✓ REFRESH COMPLETE ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓\n');
  } catch (error) {
    console.error('✗ ERROR:', error);
    statusEl.textContent = '❌ Error loading data';
    statusEl.className = 'status error';
  }
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Dashboard initialized');
  refreshAllData();
  
  // Auto-refresh every 5 minutes
  setInterval(refreshAllData, 5 * 60 * 1000);
});
