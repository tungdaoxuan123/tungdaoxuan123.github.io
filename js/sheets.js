// Google Sheets Integration - Complete Hybrid System
// Updated: November 11, 2025
// Maintains original simplicity while adding advanced features
// Copy this entire file to: /js/sheets.js

const SHEETS_CONFIG = {
  spreadsheetId: '1NADCWY48TpJU4jBrw0Bow1TEGxHBBwsTxwEstHDQPyU',
  positionsGid: '1658667671',           // First sheet (All Positions)
  marketResearchGid: '615736256'        // Second sheet (Market Research)
};

// ==================== CSV PARSER ====================
function parseCSV(csv) {
  const lines = csv.split('\n');
  const headers = parseCSVLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = parseCSVLine(lines[i]);
    const row = {};
    
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] ? values[index].trim() : '';
    });
    
    if (Object.values(row).some(v => v !== '')) {
      data.push(row);
    }
  }

  return data;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

// ==================== CACHING SYSTEM ====================
const Cache = {
  store: new Map(),
  timestamps: new Map(),
  expiry: 5 * 60 * 1000, // 5 minutes

  set(key, data) {
    this.store.set(key, data);
    this.timestamps.set(key, Date.now());
    console.log(`📦 Cache set: ${key}`);
  },

  get(key) {
    if (!this.store.has(key)) return null;
    
    const timestamp = this.timestamps.get(key);
    const isValid = Date.now() - timestamp < this.expiry;
    
    if (!isValid) {
      this.store.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    
    console.log(`✅ Cache hit: ${key}`);
    return this.store.get(key);
  },

  clear(key = null) {
    if (key) {
      this.store.delete(key);
      this.timestamps.delete(key);
      console.log(`🗑️  Cache cleared: ${key}`);
    } else {
      this.store.clear();
      this.timestamps.clear();
      console.log(`🗑️  All cache cleared`);
    }
  }
};

// ==================== MAIN CLASS ====================
class SheetsAPI {
  constructor(config = {}) {
    this.config = config.spreadsheetId ? config : SHEETS_CONFIG;
    this.spreadsheetId = config.spreadsheetId || SHEETS_CONFIG.spreadsheetId;
    this.positionsGid = config.positionsGid || SHEETS_CONFIG.positionsGid;
    this.marketResearchGid = config.marketResearchGid || SHEETS_CONFIG.marketResearchGid;
    
    this.cache = config.cache !== false;
    this.debug = config.debug !== false;
    this.autoRefresh = config.autoRefresh || false;
    this.refreshInterval = config.refreshInterval || 60000;
    
    this.listeners = {
      onLoad: [],
      onError: [],
      onRefresh: []
    };
    
    if (this.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  log(message, data = null) {
    if (this.debug) {
      if (data) {
        console.log(`[SheetsAPI] ${message}`, data);
      } else {
        console.log(`[SheetsAPI] ${message}`);
      }
    }
  }

  error(message, err = null) {
    if (this.debug) {
      if (err) {
        console.error(`[SheetsAPI ERROR] ${message}`, err);
      } else {
        console.error(`[SheetsAPI ERROR] ${message}`);
      }
    }
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
      this.log(`Listener added: ${event}`);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.error(`Error in ${event} listener`, error);
        }
      });
    }
  }

  // ==================== FETCH METHODS ====================
  async fetchPositions(useCache = true) {
    if (useCache) {
      const cached = Cache.get('positions');
      if (cached) {
        this.emit('onLoad', { type: 'positions', count: cached.length, fromCache: true });
        return cached;
      }
    }

    try {
      const url = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv&gid=${this.positionsGid}&t=${Date.now()}`;
      
      this.log('📥 Fetching positions...');
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const csv = await response.text();
      this.log('✓ Positions CSV received');
      
      const data = parseCSV(csv);
      
      const filtered = data.filter(row => 
        row && 
        row.Symbol && 
        row.Symbol.trim() !== 'NO POSITIONS' && 
        row.Symbol.trim() !== '' &&
        Object.keys(row).some(key => row[key] && row[key].trim() !== '')
      );
      
      this.log(`✓ Found ${filtered.length} active positions`);
      
      if (this.cache) {
        Cache.set('positions', filtered);
      }
      
      this.emit('onLoad', { type: 'positions', count: filtered.length, fromCache: false });
      
      return filtered;
    } catch (error) {
      this.error('Failed to fetch positions', error);
      this.emit('onError', { type: 'positions', error });
      return [];
    }
  }

  async fetchMarketResearch(useCache = true) {
    if (useCache) {
      const cached = Cache.get('marketResearch');
      if (cached) {
        this.emit('onLoad', { type: 'marketResearch', count: cached.length, fromCache: true });
        return cached;
      }
    }

    try {
      const url = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=csv&gid=${this.marketResearchGid}&t=${Date.now()}`;
      
      this.log('📥 Fetching market research...');
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const csv = await response.text();
      this.log('✓ Market Research CSV received');
      
      const lines = csv.split('\n').filter(line => line.trim().length > 0);
      this.log(`✓ Market Research: ${lines.length} lines processed`);
      
      const data = parseCSV(csv);
      
      const filtered = data.filter(row =>
        row && Object.keys(row).some(key => row[key] && row[key].trim() !== '')
      );
      
      this.log(`✓ Parsed ${filtered.length} rows from Market Research`);
      
      if (this.cache) {
        Cache.set('marketResearch', filtered);
      }
      
      this.emit('onLoad', { type: 'marketResearch', count: filtered.length, fromCache: false });
      
      return filtered;
    } catch (error) {
      this.error('Failed to fetch market research', error);
      this.emit('onError', { type: 'marketResearch', error });
      return [];
    }
  }

  async fetchAllData(useCache = true) {
    this.log('🔄 Fetching all sheets...');
    
    try {
      const [positions, marketResearch] = await Promise.all([
        this.fetchPositions(useCache),
        this.fetchMarketResearch(useCache)
      ]);
      
      this.log(`✓ Fetch complete: ${positions.length} positions, ${marketResearch.length} research rows`);
      
      return { positions, marketResearch };
    } catch (error) {
      this.error('Failed to fetch all data', error);
      this.emit('onError', { type: 'all', error });
      return { positions: [], marketResearch: [] };
    }
  }

  // ==================== FILTERING ====================
  filterBySymbol(data, symbol) {
    return data.filter(row => row.Symbol === symbol);
  }

  filterByStatus(data, status) {
    return data.filter(row => row.Signal?.toLowerCase() === status.toLowerCase());
  }

  filterBySentiment(data, sentiment) {
    return data.filter(row => row.Sentiment?.toLowerCase() === sentiment.toLowerCase());
  }

  // ==================== STATISTICS ====================
  calculateStats(positions) {
    if (!positions || positions.length === 0) {
      return {
        totalPositions: 0,
        bullishCount: 0,
        bearishCount: 0,
        neutralCount: 0,
        buySignals: 0,
        sellSignals: 0,
        holdSignals: 0,
        averageConfidence: 0,
        topAsset: null,
        worstAsset: null
      };
    }

    let bullishCount = 0;
    let bearishCount = 0;
    let neutralCount = 0;
    let buySignals = 0;
    let sellSignals = 0;
    let holdSignals = 0;
    let confidenceSum = 0;
    let maxValue = -Infinity;
    let minValue = Infinity;
    let topAsset = null;
    let worstAsset = null;

    positions.forEach(pos => {
      const sentiment = pos.Sentiment?.toLowerCase();
      if (sentiment === 'bullish') bullishCount++;
      else if (sentiment === 'bearish') bearishCount++;
      else neutralCount++;

      const signal = pos.Signal?.toLowerCase();
      if (signal === 'buy') buySignals++;
      else if (signal === 'sell') sellSignals++;
      else if (signal === 'hold') holdSignals++;

      const confidence = parseFloat(pos['Confidence %'] || 0);
      if (!isNaN(confidence)) confidenceSum += confidence;

      const change = parseFloat(pos['24h Change %'] || 0);
      if (change > maxValue) {
        maxValue = change;
        topAsset = pos.Symbol;
      }
      if (change < minValue) {
        minValue = change;
        worstAsset = pos.Symbol;
      }
    });

    return {
      totalPositions: positions.length,
      bullishCount,
      bearishCount,
      neutralCount,
      buySignals,
      sellSignals,
      holdSignals,
      averageConfidence: (confidenceSum / positions.length).toFixed(2),
      topAsset,
      worstAsset
    };
  }

  // ==================== EXPORT ====================
  exportToCSV(data, filename = 'export.csv') {
    if (!data || data.length === 0) {
      this.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const value = row[h] || '';
          return `"${value.toString().replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    this.log(`✓ Exported ${data.length} rows to ${filename}`);
  }

  exportToJSON(data, filename = 'export.json') {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      this.error('No data to export');
      return;
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    this.log(`✓ Exported to ${filename}`);
  }

  // ==================== CACHE MANAGEMENT ====================
  clearCache(key = null) {
    Cache.clear(key);
  }

  getCacheStatus() {
    return {
      cacheSize: Cache.store.size,
      cacheExpiry: Cache.expiry,
      items: Array.from(Cache.store.keys())
    };
  }

  // ==================== AUTO REFRESH ====================
  autoRefreshTimer: null,
  autoRefreshInterval: 60000,

  startAutoRefresh(interval = 60000) {
    if (this.autoRefreshTimer) {
      this.log('Auto-refresh already running');
      return;
    }

    this.autoRefreshInterval = interval;
    this.log(`Auto-refresh started (${interval}ms)`);

    this.autoRefreshTimer = setInterval(async () => {
      const { positions, marketResearch } = await this.fetchAllData(false);
      this.emit('onRefresh', { 
        timestamp: new Date(),
        positions: positions.length,
        research: marketResearch.length
      });
    }, this.autoRefreshInterval);
  }

  stopAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
      this.log('Auto-refresh stopped');
    }
  }

  // ==================== UTILITY ====================
  getMetadata() {
    return {
      spreadsheetId: this.spreadsheetId,
      positionsGid: this.positionsGid,
      marketResearchGid: this.marketResearchGid,
      cacheEnabled: this.cache,
      debugEnabled: this.debug,
      cacheStatus: this.getCacheStatus()
    };
  }

  configure(options = {}) {
    if (options.debug !== undefined) this.debug = options.debug;
    if (options.cache !== undefined) this.cache = options.cache;
    if (options.cacheExpiry !== undefined) Cache.expiry = options.cacheExpiry;
    this.log('Configuration updated', options);
  }

  reset() {
    this.stopAutoRefresh();
    Cache.clear();
    this.listeners = {
      onLoad: [],
      onError: [],
      onRefresh: []
    };
    this.log('SheetsAPI reset');
  }
}

// ==================== GLOBAL EXPORT ====================
window.SheetsAPI = SheetsAPI;
window.parseCSV = parseCSV;
window.Cache = Cache;

console.log('✓ SheetsAPI loaded and ready');
console.log('Usage: const api = new SheetsAPI({debug: false, autoRefresh: true});');
