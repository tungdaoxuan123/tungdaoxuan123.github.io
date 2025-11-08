// API calls to external services

const API = {
  // CoinGecko API for crypto
  async getCryptoPrice(cryptoId) {
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd&include_24hr_change=true`;
      const response = await fetch(url);
      const data = await response.json();
      return data[cryptoId];
    } catch (error) {
      console.error(`Error fetching ${cryptoId}:`, error);
      return null;
    }
  },

  async getCryptoHistorical(cryptoId, days = 7) {
    try {
      const url = `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=${days}`;
      const response = await fetch(url);
      const data = await response.json();
      return data.prices.map(p => ({ time: p[0], price: p[1] }));
    } catch (error) {
      console.error(`Error fetching historical data for ${cryptoId}:`, error);
      return [];
    }
  }
};
