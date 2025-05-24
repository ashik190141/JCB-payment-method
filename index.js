require("dotenv").config();
const express = require("express");
const axios = require("axios");
const app = express();
const PORT = 3000;

const ASSERT_URL =
    "https://test.saferpay.com/api/Payment/v1/PaymentPage/Assert";
  
app.get("/pay", async (req, res) => {
  try {
    const response = await axios.post(
      `${process.env.SAFERPAY_API_URL}/Payment/v1/PaymentPage/Initialize`,
      {
        RequestHeader: {
          SpecVersion: "1.10",
          CustomerId: process.env.CUSTOMER_ID,
          RequestId: "req-" + new Date().getTime(),
          RetryIndicator: 0,
        },
        TerminalId: process.env.TERMINAL_ID,
        Payment: {
          Amount: {
            Value: 1000, // In smallest currency unit (e.g., 1000 = 10.00)
            CurrencyCode: "CHF",
          },
          OrderId: "order-" + new Date().getTime(),
          Description: "Test JCB Payment",
        },
        ReturnUrls: {
          Success: "http://localhost:3000/success",
          Fail: "http://localhost:3000/fail",
        },
      },
      {
        auth: {
          username: process.env.SAFERPAY_USERNAME,
          password: process.env.SAFERPAY_PASSWORD,
        },
      }
    );

    console.log(response.data.RedirectUrl);
    const redirectUrl = response.data.RedirectUrl;
    res.json({
      redirectUrl,
    });
  } catch (error) {
    console.error("Payment Init Error:", error.response?.data || error.message);
    res.status(500).send("Payment initialization failed.");
  }
});

app.get("/success", async (req, res) => {
  const { token } = req.query;
  try {
    const assertPayload = {
      RequestHeader: {
        SpecVersion: "1.13",
        CustomerId: CUSTOMER_ID,
        RequestId: new Date().getTime().toString(),
        RetryIndicator: 0,
      },
      Token: token,
    };

    const { data } = await axios.post(ASSERT_URL, assertPayload, {
      auth: {
        username: process.env.SAFERPAY_USERNAME,
        password: process.env.SAFERPAY_PASSWORD,
      },
    });

    console.log("Payment success:", data);
    res.send("Payment successful! ✅");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error asserting payment");
  }
});

app.get("/fail", (req, res) => {
  res.send("Payment failed or canceled ❌");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
