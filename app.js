const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Set EJS as templating engine
app.set('view engine', 'ejs');

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/prototypes', express.static(path.join(__dirname, 'public', 'prototypes')));

// Render the input form
app.get('/', (req, res) => {
  res.render('index');
});

// Start the server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

const puppeteer = require('puppeteer');
const fs = require('fs');
const fsPromises = require('fs').promises;

app.post('/generate-prototype', async (req, res) => {
  const url = req.body.url;
  const identifier = req.body.identifier;

  try {
    // Step 1: Capture Screenshot
    const screenshotPath = await captureScreenshot(url, identifier);

    // Step 2: Generate Prototype Page
    await generatePrototypePage(identifier, screenshotPath);

    // Step 3: Provide the URL to the Sales Team
    const prototypeUrl = `http://localhost:${port}/prototypes/${identifier}`;
    res.send(`Prototype generated! Access it here: <a href="${prototypeUrl}" target="_blank">${prototypeUrl}</a>`);
  } catch (error) {
    console.error(error);
    res.send('An error occurred while generating the prototype.');
  }
});

async function captureScreenshot(url, identifier) {
    const screenshotDir = path.join(__dirname, 'public', 'prototypes', identifier);
    const screenshotPath = path.join(screenshotDir, 'screenshot.png');
  
    // Create directory if it doesn't exist
    await fsPromises.mkdir(screenshotDir, { recursive: true });
  
    // Launch Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
  
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2' });
  
    // Capture screenshot
    await page.screenshot({ path: screenshotPath, fullPage: true });
  
    // Close the browser
    await browser.close();
  
    return screenshotPath;
  }

  async function generatePrototypePage(identifier, screenshotPath) {
    const prototypeDir = path.join(__dirname, 'public', 'prototypes', identifier);
    const prototypeFile = path.join(prototypeDir, 'index.html');
  
    // Relative path for the screenshot in the HTML file
    const screenshotRelativePath = 'screenshot.png';
  
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
  