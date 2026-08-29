const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the root directory (index.html, styles.css, app.js, and public folder)
app.use(express.static(__dirname));

// For routing, since it's a SPA-like client-side setup,
// redirect all other routes to index.html if needed,
// but for static file hosting, just serving the root dir is enough.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  Windows 98 VTuber Fan Page Dev Server is running`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
