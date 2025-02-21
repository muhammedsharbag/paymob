const axios = require('axios');

async function getAuthToken() {
  try {
    const response = await axios.post('https://accept.paymob.com/api/auth/tokens', {
      username: process.env.PAYMOB_USERNAME,
      password: process.env.PAYMOB_PASSWORD,
    });
    console.log("Auth token response:", response.data);
    return response.data.token;
  } catch (error) {
    console.error("Error getting auth token:", error.response ? error.response.data : error.message);
    throw error;
  }
}

async function createOrder(authToken, totalAmount) {
  try {
    const response = await axios.post('https://accept.paymob.com/api/ecommerce/orders', {
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: totalAmount * 100, // convert to cents
      currency: 'EGP',
      merchant_order_id: `order_${Date.now()}`,
      items: [],
    });
    console.log("Order creation response:", response.data);
    return response.data.id;
  } catch (error) {
    console.error("Error creating order:", error.response ? error.response.data : error.message);
    throw error;
  }
}

async function getPaymentKey(authToken, orderId, amount, billingData) {
  try {
    const response = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', {
      auth_token: authToken,
      amount_cents: amount * 100,
      expiration: 3600,
      order_id: orderId,
      currency: 'EGP',
      integration_id: process.env.PAYMOB_INTEGRATION_ID,
      billing_data: billingData,
    });
    console.log("Payment key response:", response.data);
    return response.data.token;
  } catch (error) {
    console.error("Error getting payment key:", error.response ? error.response.data : error.message);
    throw error;
  }
}

exports.paymobCheckout = async (req, res, next) => {
  try {
    // Extract necessary data from the request body
    const { amount, billingData } = req.body;
    if (!amount || !billingData) {
      return res.status(400).json({ message: 'Missing amount or billing data' });
    }

    // 1. Authenticate with PayMob using username and password
    const authToken = await getAuthToken();

    // 2. Create order on PayMob
    const orderId = await createOrder(authToken, amount);

    // 3. Generate a payment key using the orderId and billing data
    const paymentKey = await getPaymentKey(authToken, orderId, amount, billingData);

    // 4. Construct the checkout URL
    const checkoutUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

    // Return the checkout URL to the client
    return res.status(200).json({ status: 'success', checkoutUrl });
  } catch (error) {
    console.error('Error during PayMob checkout:', error.response ? error.response.data : error.message);
    return res.status(500).json({ message: 'Payment processing failed' });
  }
};
