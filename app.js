const express = require('express');
const path = require('path');
const puppeteer = require('puppeteer');
const fs = require('fs');
const fsPromises = require('fs').promises;
const cron = require('node-cron');

const app = express();
const port = process.env.PORT || 3000; // Use dynamic port for deployment

// Set EJS as templating engine
app.set('view engine', 'ejs');

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/public', express.static(path.join(__dirname, 'public')));

let browser;

// Function to launch Puppeteer with retry logic if it fails
const launchBrowser = async () => {
  try {
    // Attempt to launch Puppeteer using system-installed Chromium
    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      headless: "new"
    });
    console.log('Puppeteer browser launched successfully');
  } catch (error) {
    console.error('Error launching Puppeteer browser:', error.message);
    process.exit(1);
  }
};

// Launch browser at the start of the server
launchBrowser();

// Render the input form
app.get('/', (req, res) => {
  res.render('index');
});

// Generate prototype and redirect directly
app.post('/generate-prototype', async (req, res) => {
  const url = req.body.url;
  const identifier = req.body.identifier;

  try {
    // Step 1: Capture Screenshot
    const screenshotPath = await captureScreenshot(url, identifier);

    // Step 2: Generate Prototype Page
    await generatePrototypePage(identifier, screenshotPath);

    // Step 3: Redirect to the prototype page after creation
    const prototypeUrl = `${req.protocol}://${req.get('host')}/public/prototypes/${identifier}/index.html`;
    res.redirect(prototypeUrl);  // Redirect directly to the prototype page
  } catch (error) {
    console.error('Error generating prototype:', error.message);
    res.status(500).send('An error occurred while generating the prototype.');
  }
});

// Function to capture screenshot using the shared browser instance
async function captureScreenshot(url, identifier) {
  const screenshotDir = path.join(__dirname, 'public', 'prototypes', identifier);
  const screenshotPath = path.join(screenshotDir, 'screenshot.png');

  // Create directory if it doesn't exist
  await fsPromises.mkdir(screenshotDir, { recursive: true });

  if (!browser) {
    throw new Error('Puppeteer browser is not initialized');
  }

  const page = await browser.newPage(); // Use the shared browser instance to create a new page
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
    await page.close(); // Close the page but keep the browser instance open
  }

  return screenshotPath;
}

// Function to generate the prototype page
async function generatePrototypePage(identifier, screenshotPath) {
  const prototypeDir = path.join(__dirname, 'public', 'prototypes', identifier);
  const prototypeFile = path.join(prototypeDir, 'index.html');

  // Relative path for the screenshot in the HTML file
  const screenshotRelativePath = `/public/prototypes/${identifier}/screenshot.png`;

  // Your chat widget code
  const chatWidgetCode = `
    <script>
        // Helper function to load the chat widget once
        const loadChatWidget = () => {
            if (!document.querySelector("script[src='https://app.weply.chat/widget/9930edb31407e5ba09a5f1df560478ae']")) {
                const chatScript = document.createElement("script");
                chatScript.src = "https://app.weply.chat/widget/9930edb31407e5ba09a5f1df560478ae";
                chatScript.async = true;
                document.body.appendChild(chatScript);
                console.log("Chat widget loaded.");
            }
        };
        loadChatWidget();
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

// Function to delete all prototype directories
async function deleteAllPrototypes() {
  const prototypesDir = path.join(__dirname, 'public', 'prototypes');

  try {
    if (fs.existsSync(prototypesDir)) {
      const files = await fsPromises.readdir(prototypesDir);

      for (const file of files) {
        const currentPath = path.join(prototypesDir, file);
        await fsPromises.rm(currentPath, { recursive: true, force: true });
      }

      console.log('All prototype directories deleted successfully.');
    }
  } catch (error) {
    console.error('Error deleting prototype directories:', error.message);
  }
}

// Schedule job to delete all pages at 18:00 Danish time every day
cron.schedule('0 18 * * *', () => {
  console.log('Running daily cleanup task at 18:00 Danish time...');
  deleteAllPrototypes();
}, {
  timezone: "Europe/Copenhagen"
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
