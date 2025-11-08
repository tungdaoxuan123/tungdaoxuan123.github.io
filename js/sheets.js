// Google Sheets integration

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
      const data = parseCSV(csv);
      
      // Filter out empty rows and "NO POSITIONS" entries
      return data.filter(row => 
        row.Symbol && 
        row.Symbol.trim() !== 'NO POSITIONS' && 
        row.Symbol.trim() !== ''
      );
    } catch (error) {
      console.error('Error fetching positions:', error);
      return [];
    }
  },

  async fetchMarketResearch() {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEETS_CONFIG.spreadsheetId}/export?format=csv&gid=${SHEETS_CONFIG.marketResearchGid}`;
      const response = await fetch(url);
      const csv = await response.text();
      return parseCSV(csv);
    } catch (error) {
      console.error('Error fetching market research:', error);
      return [];
    }
  }
};

// Make sure SheetsAPI is accessible globally
window.SheetsAPI = SheetsAPI;
