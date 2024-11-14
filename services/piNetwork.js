const axios = require('axios');
require('dotenv').config();

class PiNetworkService {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.PLATFORM_API_URL,
      timeout: 20000,
      headers: { 'Authorization': `Key ${process.env.PI_API_KEY}` }
    });
  }

  async verifyPayment(paymentId) {
    const response = await this.client.get(`/v2/payments/${paymentId}`);
    return response.data;
  }

  async completePayment(paymentId, txid) {
    return this.client.post(`/v2/payments/${paymentId}/complete`, { txid });
  }

  async verifyUser(accessToken) {
    return this.client.get('/v2/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  }
}

module.exports = new PiNetworkService();