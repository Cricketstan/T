const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

const FAN_CODE_URL = 'https://www.fancode.com/cricket/schedule';

async function scrapeSchedule() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox','--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  await page.goto(FAN_CODE_URL, { waitUntil: 'networkidle2' });

  // Wait for schedule container to load
  await page.waitForSelector('div[class*="sc-jTzLTM"]', {timeout: 10000});

  // Extract matches
  const matchesData = await page.evaluate(() => {
    // Grab all match cards (class name may change, update accordingly)
    const cards = document.querySelectorAll('div[class*="sc-ebFjAB"]');

    let data = [];
    cards.forEach(card => {
      const titleEl = card.querySelector('h2');
      const timeEl = card.querySelector('time');
      const formatEl = card.querySelector('div[class*="sc-kvZOFW"]');

      data.push({
        title: titleEl ? titleEl.textContent.trim() : null,
        time: timeEl ? timeEl.getAttribute('datetime') : null,
        format: formatEl ? formatEl.textContent.trim() : null,
      });
    });

    return data;
  });

  await browser.close();
  return matchesData;
}

app.get('/api/schedule', async (req, res) => {
  try {
    const matches = await scrapeSchedule();
    res.json({ matches });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to scrape schedule' });
  }
});

app.get('/', (req, res) => {
  res.send('<h1>FanCode Cricket Schedule Scraper API</h1><p>Go to <a href="/api/schedule">/api/schedule</a> to get JSON data</p>');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
