const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const fs = require('fs');
const fsPromises = require('fs').promises;

const app = express();
const port = process.env.PORT || 3000;

// Set EJS as templating engine
app.set('view engine', 'ejs');

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Render the input form
app.get('/', (req, res) => {
  res.render('index');
});

// Render prototype on dynamic URL /name
app.get('/:name', (req, res) => {
  const identifier = req.params.name;

  const prototypeDir = path.join(__dirname, 'public', 'prototypes', identifier);
  const prototypeFile = path.join(prototypeDir, 'index.html');

  if (fs.existsSync(prototypeFile)) {
    res.sendFile(prototypeFile);
  } else {
    res.status(404).send('Prototype not found.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

app.post('/generate-prototype', async (req, res) => {
  const url = req.body.url;
  const identifier = req.body.identifier;

  try {
    // Step 1: Capture Screenshot
    const screenshotPath = await captureScreenshot(url, identifier);

    // Step 2: Generate Prototype Page
    await generatePrototypePage(identifier, screenshotPath);

    // Step 3: Provide the URL to the Sales Team
    const prototypeUrl = `${req.protocol}://${req.get('host')}/${identifier}`;

    // Redirect with a 10-second delay
    res.render('redirect', { prototypeUrl });
  } catch (error) {
    console.error('Error generating prototype:', error.message);
    res.status(500).send('An error occurred while generating the prototype.');
  }
});

async function captureScreenshot(url, identifier) {
  const screenshotDir = path.join(__dirname, 'public', 'prototypes', identifier);
  const screenshotPath = path.join(screenshotDir, 'screenshot.png');

  // Create directory if it doesn't exist
  await fsPromises.mkdir(screenshotDir, { recursive: true });

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  try {
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Capture screenshot
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch (error) {
    console.error(`Error capturing screenshot for ${url}:`, error.message);
    throw new Error('Failed to capture screenshot.');
  } finally {
    await browser.close();
  }

  return screenshotPath;
}

async function generatePrototypePage(identifier, screenshotPath) {
  const prototypeDir = path.join(__dirname, 'public', 'prototypes', identifier);
  const prototypeFile = path.join(prototypeDir, 'index.html');

  // Relative path for the screenshot in the HTML file
  const screenshotRelativePath = `/public/prototypes/${identifier}/screenshot.png`;

  // Your chat widget code
  const chatWidgetCode = `
    <!-- Replace this with your actual chat widget script -->
    <script>
      console.log('Chat widget would be here.');
    </script>
  `;

  // HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Prototype for ${identifier}</title>
      <style>
        body, html { margin: 0; padding: 0; height: 100%; }
        .background { 
            background-image: url('${screenshotRelativePath}'); 
            background-size: cover; 
            height: 100%; 
            position: relative;
        }
        .chat-widget { 
            position: absolute; 
            bottom: 0; 
            right: 0; 
        }
      </style>
    </head>
    <body>
      <div class="background">
        <div class="chat-widget">
          ${chatWidgetCode}
        </div>
      </div>
    </body>
    </html>
  `;

  // Write the HTML file
  await fsPromises.writeFile(prototypeFile, htmlContent);
}
