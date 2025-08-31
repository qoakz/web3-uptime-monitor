const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Test health endpoint'
  });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
