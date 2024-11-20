async function captureScreenshot(url, identifier) {
    const screenshotDir = path.join(__dirname, 'public', 'prototypes', identifier);
    const screenshotPath = path.join(screenshotDir, 'screenshot.png');
  
    // Create directory if it doesn't exist
    await fsPromises.mkdir(screenshotDir, { recursive: true });
  
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for Render
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
  