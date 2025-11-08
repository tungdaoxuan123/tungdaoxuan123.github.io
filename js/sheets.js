// Google Sheets integration - Optimized CSV parsing

const SHEETS_CONFIG = {
  spreadsheetId: '1NADCWY48TpJU4jBrw0Bow1TEGxHBBwsTxwEstHDQPyU',
  positionsGid: '0',           // First sheet (All Positions)
  marketResearchGid: '615736256' // Second sheet (Market Research)
};

const SheetsAPI = {
  async fetchPositions() {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEETS_CONFIG.spreadsheetId}/export?format=csv&gid=${SHEETS_CONFIG.positionsGid}`;
      
      const response = await fetch(url);
      const csv = await response.text();
      
      console.log('📥 Positions CSV fetched');
      
      const data = parseCSV(csv);
      
      // Filter empty rows and NO POSITIONS entries
      const filtered = data.filter(row => 
        row && 
        row.Symbol && 
        row.Symbol.trim() !== 'NO POSITIONS' && 
        row.Symbol.trim() !== '' &&
        Object.keys(row).some(key => row[key] && row[key].trim() !== '')
      );
      
      console.log(`✓ Found ${filtered.length} active positions`);
      return filtered;
    } catch (error) {
      console.error('❌ Error fetching positions:', error);
      return [];
    }
  },

  async fetchMarketResearch() {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEETS_CONFIG.spreadsheetId}/export?format=csv&gid=${SHEETS_CONFIG.marketResearchGid}`;
      
      console.log('📥 Market Research CSV fetching...');
      
      const response = await fetch(url);
      const csv = await response.text();
      
      // Remove empty lines and clean data
      const lines = csv.split('\n').filter(line => line.trim().length > 0);
      console.log(`✓ Market Research: ${lines.length} lines fetched`);
      
      const data = parseCSV(csv);
      
      console.log(`✓ Parsed ${data.length} rows from Market Research`);
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching market research:', error);
      return [];
    }
  },

  async fetchAllData() {
    console.log('🔄 Fetching all sheets...');
    
    try {
      const [positions, marketResearch] = await Promise.all([
        this.fetchPositions(),
        this.fetchMarketResearch()
      ]);
      
      console.log(`✓ Fetch complete: ${positions.length} positions, ${marketResearch.length} research rows`);
      
      return { positions, marketResearch };
    } catch (error) {
      console.error('❌ Error fetching all data:', error);
      return { positions: [], marketResearch: [] };
    }
  }
};

// Export globally
window.SheetsAPI = SheetsAPI;
