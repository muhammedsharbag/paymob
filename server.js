const express = require('express');
const { paymobCheckout } = require('./services/paymentService');
const app = express();
require('dotenv').config();


app.use(express.json());

app.post('/api/paymob/checkout', paymobCheckout);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
