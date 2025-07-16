/**
 * Minimal test server for static file serving
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Simple API endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API works' });
});

// Serve static files from frontend build
const frontendBuildPath = path.join(__dirname, '../frontend/dist');
console.log('Serving static files from:', frontendBuildPath);
app.use(express.static(frontendBuildPath));

// Handle React Router routes - serve index.html for non-API routes
app.get('*', (req, res) => {
  console.log('Serving index.html for route:', req.path);
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
});
