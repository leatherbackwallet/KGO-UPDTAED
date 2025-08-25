const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API test endpoint working!' });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Test it with: curl http://localhost:${PORT}/api/test`);
});


