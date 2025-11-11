// Main Application Logic
// Integrates Google Sheets data with portfolio tracking
// Updated: November 11, 2025

// Initialize SheetsAPI instance
const api = new SheetsAPI({
  debug: true,
  cache: true,
  autoRefresh: false
});

// Format currency
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Format percent
function formatPercent(value) {
  const num = parseFloat(value || 0);
  const formatted = num.toFixed(2);
  return num >= 0 ? `+${formatted}%` : `${formatted}%`;
}

// ==================== PORTFOLIO CALCULATIONS ====================

function calculatePortfolioMetrics(positions) {
  if (!positions || positions.length === 0) {
    return {
      totalBalance: 0,
      totalCostBasis: 0,
      totalPnl: 0,
      totalPnlPercent: 0
    };
  }

  let totalBalance = 0;
  let totalCostBasis = 0;

  positions.forEach(pos => {
    const quantity = parseFloat(pos['Quantity'] || pos['Size'] || 0) || 0;
    const entryPrice = parseFloat(pos['Entry Price'] || 0) || 0;
    const currentPrice = parseFloat(pos['Mark Price'] || pos['Current Price'] || 0) || 0;

    totalBalance += quantity * currentPrice;
    totalCostBasis += quantity * entryPrice;
  });

  const totalPnl = totalBalance - totalCostBasis;
  const totalPnlPercent = totalCostBasis !== 0 ? ((totalPnl / totalCostBasis) * 100) : 0;

  return {
    totalBalance,
    totalCostBasis,
    totalPnl,
    totalPnlPercent
  };
}

// ==================== RENDER FUNCTIONS ====================

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

function updatePortfolioPanel(positions) {
  const metrics = calculatePortfolioMetrics(positions);
  
  const balanceEl = document.getElementById('total-balance');
  const pnlEl = document.getElementById('total-pnl');
  const pnlPctEl = document.getElementById('total-pnl-pct');

  if (balanceEl) {
    balanceEl.textContent = formatCurrency(metrics.totalBalance);
    balanceEl.className = metrics.totalPnl >= 0 ? 'positive' : 'negative';
  }

  if (pnlEl) {
    pnlEl.textContent = formatCurrency(metrics.totalPnl);
    pnlEl.className = metrics.totalPnl >= 0 ? 'positive' : 'negative';
  }

  if (pnlPctEl) {
    pnlPctEl.textContent = formatPercent(metrics.totalPnlPercent);
    pnlPctEl.className = metrics.totalPnl >= 0 ? 'positive' : 'negative';
  }

  console.log('✓ Portfolio panel updated:', metrics);
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
        html += `<h4 style="margin-top: 12px; color: #58a6ff;">${header}</h4>`;
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
        html += `<p style="margin: 8px 0; color: #c9d1d9;">• ${bulletContent}</p>`;
      }
    }

    // Regular paragraphs (longer than 10 chars)
    else if (content.length > 10 && !content.match(/^-+$/)) {
      if (inTable && currentTable.length > 0) {
        html += renderTable(currentTable);
        currentTable = [];
        inTable = false;
      }
      
      html += `<p style="margin: 8px 0; color: #c9d1d9;">${content}</p>`;
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

  let html = '<table style="width: 100%; margin: 12px 0; border-collapse: collapse; font-size: 0.9em;"><thead><tr>';
  
  const headerRow = rows[0];
  headerRow.forEach(cell => {
    html += `<th style="padding: 8px; text-align: left; border-bottom: 1px solid #30363d; color: #58a6ff; font-weight: 600;">${cell}</th>`;
  });
  html += '</tr></thead><tbody>';

  for (let i = 1; i < rows.length; i++) {
    html += '<tr>';
    rows[i].forEach((cell) => {
      html += `<td style="padding: 6px 8px; border-bottom: 1px solid #21262d; color: #c9d1d9;">${cell}</td>`;
    });
    html += '</tr>';
  }

  html += '</tbody></table>';
  return html;
}

// ==================== MAIN REFRESH FUNCTION ====================

async function refreshAllData() {
  const statusEl = document.getElementById('status');
  const refreshBtn = document.querySelector('.refresh-btn');
  
  statusEl.textContent = '⏳ Refreshing data...';
  statusEl.className = 'status loading';
  if (refreshBtn) refreshBtn.disabled = true;
  
  console.log('\n➜ REFRESH START ➜➜➜➜➜➜➜➜➜➜➜➜➜➜➜➜');
  
  try {
    // Fetch all data from Google Sheets
    const { positions, marketResearch } = await api.fetchAllData();
    
    // Update portfolio panel
    updatePortfolioPanel(positions);
    
    // Render positions table
    renderPositions(positions);
    
    // Render market research
    renderMarketResearch(marketResearch);
    
    // Render charts
    if (window.ChartManager) {
      await window.ChartManager.renderCharts();
    } else {
      console.warn('⚠️  ChartManager not loaded');
    }
    
    // Update status
    statusEl.textContent = '✅ Data loaded successfully';
    statusEl.className = 'status success';
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      second: '2-digit'
    });
    
    document.getElementById('last-update').textContent = timeString;
    
    console.log('✓ REFRESH COMPLETE ✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓\n');
  } catch (error) {
    console.error('✗ ERROR:', error);
    statusEl.textContent = '❌ Error loading data';
    statusEl.className = 'status error';
  } finally {
    if (refreshBtn) refreshBtn.disabled = false;
  }
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Dashboard initialized');
  console.log('✓ SheetsAPI instance created');
  console.log('📊 Spreadsheet:', api.spreadsheetId);
  console.log('📄 Sheets config:', api.sheets);
  
  // Initial data load
  refreshAllData();
  
  // Auto-refresh every 5 minutes
  setInterval(refreshAllData, 5 * 60 * 1000);
  console.log('🔄 Auto-refresh set: every 5 minutes');
});

// Listen to API events
api.on('onLoad', (data) => {
  console.log(`📦 Loaded: ${data.type} (${data.count} items) - Cache: ${data.fromCache ? 'Yes' : 'No'}`);
});

api.on('onError', (data) => {
  console.error(`❌ Error loading ${data.type}:`, data.error);
});

// Export for debugging
window.refreshAllData = refreshAllData;
window.api = api;
window.calculatePortfolioMetrics = calculatePortfolioMetrics;