import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import giftConfig from '../src/config.js';

const baseURL = process.env.GIFT_BASE_URL || 'http://127.0.0.1:5173';
const artifacts = path.resolve('artifacts');
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
const errors = [];
const externalRequests = [];

async function readyScene(page, selector) {
  await expect(page.locator(selector)).toBeVisible({ timeout: 15000 });
  await expect(page.locator(selector)).toHaveCSS('opacity', '1');
}

async function noHorizontalOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(dimensions.document, `${label}: document overflow`).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.body, `${label}: body overflow`).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(artifacts, name), fullPage: true, animations: 'disabled' });
  console.log(`Screenshot saved: ${name}`);
}

async function newPage(options, label) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`${label}: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`${label}: ${message.text()} ${message.location().url}`.trim());
  });
  page.on('requestfailed', request => console.log(`Request failed (${label}): ${request.url()} ${request.failure()?.errorText}`));
  page.on('request', request => {
    const url = new URL(request.url());
    if (/^https?:$/.test(url.protocol) && url.origin !== new URL(baseURL).origin) externalRequests.push(`${label}: ${url.href}`);
  });
  return { context, page };
}

async function journey({ label, viewport, isMobile = false, reducedMotion = 'no-preference' }) {
  const { page, context } = await newPage({ viewport, isMobile, hasTouch: isMobile, reducedMotion }, label);
  try {
    await page.goto(`${baseURL}/?to=Lan&from=Hai`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await readyScene(page, '.scene-0');
    await expect(page.locator('.recipient-note strong')).toHaveText('Lan');
    const music = page.locator('.music-toggle');
    await expect(music).toHaveAttribute('aria-pressed', 'false');
    await noHorizontalOverflow(page, `${label} gift`);
    if (label === 'desktop' || label === 'mobile' || label === 'narrow-mobile') await screenshot(page, `${label}-gift.png`);

    // Music starts only after a trusted user interaction, and can be muted.
    await music.click();
    await expect(music).toHaveAttribute('aria-pressed', 'true');
    await music.click();
    await expect(music).toHaveAttribute('aria-pressed', 'false');

    await page.locator('.scene-0 .primary-button').click();
    await readyScene(page, '.scene-1');
    await expect(music).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.bouquet-interaction img')).toBeVisible();
    expect(await page.locator('.bouquet-interaction img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await noHorizontalOverflow(page, `${label} bouquet`);
    await page.locator('.bouquet-interaction').click();
    if (label === 'desktop') await screenshot(page, 'bouquet.png');
    if (label === 'mobile') await screenshot(page, 'mobile-bouquet.png');

    // Regression: returning to the first scene must leave the gift usable.
    await page.locator('.scene-1 .back-link').click();
    await readyScene(page, '.scene-0');
    await expect(page.locator('.scene-0 .primary-button')).toBeEnabled();
    await page.locator('.scene-0 .primary-button').click();
    await readyScene(page, '.scene-1');
    await page.locator('.scene-1 .primary-button').click();
    await readyScene(page, '.scene-2');
    await noHorizontalOverflow(page, `${label} envelope`);
    if (label === 'desktop') await screenshot(page, 'envelope.png');
    await page.locator('.envelope').click();
    await readyScene(page, '.reading-scene');
    const reveal = page.locator('.reveal-letter');
    if (await reveal.isVisible()) await reveal.click();
    await expect(page.locator('.letter-body')).toContainText(giftConfig.greetingMessage);
    await expect(page.locator('.letter-paper h2')).toHaveText('Gửi Lan,');
    await expect(page.locator('.letter-signature strong')).toHaveText('Hai');
    await expect(page.locator('.letter-next')).toBeVisible();
    await noHorizontalOverflow(page, `${label} letter`);
    if (label === 'desktop') await screenshot(page, 'letter.png');
    if (label === 'mobile') await screenshot(page, 'mobile-letter.png');
    await page.locator('.letter-next').click();
    await readyScene(page, '.scene-3');
    await expect(page.locator('.final-occasion')).toContainText('20/10', { timeout: 7000 });
    const heartGeometry = await page.locator('.final-stage .rose-heart-art').evaluate(art => {
      const svg = art.querySelector('svg').getBoundingClientRect();
      const roses = art.querySelector('.heart-flower-field').getBoundingClientRect();
      return { svg: { x: svg.x, y: svg.y, right: svg.right, bottom: svg.bottom }, roses: { x: roses.x, y: roses.y, right: roses.right, bottom: roses.bottom } };
    });
    expect(heartGeometry.roses.x, `${label}: roses stay within heart artwork`).toBeGreaterThanOrEqual(heartGeometry.svg.x - 8);
    expect(heartGeometry.roses.right).toBeLessThanOrEqual(heartGeometry.svg.right + 8);
    expect(heartGeometry.roses.y).toBeGreaterThanOrEqual(heartGeometry.svg.y - 8);
    expect(heartGeometry.roses.bottom).toBeLessThanOrEqual(heartGeometry.svg.bottom + 8);
    if (label === 'mobile') await screenshot(page, 'mobile-finale-before-hearts.png');
    await page.locator('.final-actions .primary-button').click();
    await expect(page.locator('.heart-confirmation')).toContainText('đã được gửi');
    await noHorizontalOverflow(page, `${label} finale`);
    if (label === 'desktop') await screenshot(page, 'finale.png');
    if (label === 'mobile') await screenshot(page, 'mobile-finale.png');
    if (label === 'narrow-mobile') await screenshot(page, 'narrow-mobile-finale.png');
    await page.locator('.final-actions .secondary-button').click();
    await readyScene(page, '.scene-0');
    await expect(page.locator('.scene-0 .primary-button')).toBeEnabled();
    await expect(page.locator('.journey-step').nth(1)).toBeDisabled();
    await expect(page.locator('.journey-step').nth(3)).toBeDisabled();
    if (reducedMotion === 'reduce') await expect(page.locator('.gift-experience')).toHaveClass(/reduced-motion/);
    results.push(`${label}: complete journey, reopening, personalization, music, overflow, hearts, replay passed`);
    console.log(results.at(-1));
  } catch (error) {
    await screenshot(page, `${label}-failure.png`);
    throw error;
  } finally {
    await context.close();
  }
}

async function htmlSafety() {
  const { page, context } = await newPage({ reducedMotion: 'reduce' }, 'literal-HTML');
  try {
    const recipient = '<img src=x onerror=window.__giftInjection=1>';
    const sender = '<svg onload=window.__giftInjection=2>';
    const params = new URLSearchParams({ to: recipient, from: sender });
    await page.goto(`${baseURL}/?${params}`, { waitUntil: 'networkidle' });
    await expect(page.locator('.recipient-note strong')).toHaveText(recipient);
    await expect(page.locator('.recipient-note strong img')).toHaveCount(0);
    await page.locator('.scene-0 .primary-button').click();
    await readyScene(page, '.scene-1');
    await page.locator('.scene-1 .primary-button').click();
    await readyScene(page, '.scene-2');
    await page.locator('.envelope').click();
    await readyScene(page, '.reading-scene');
    await expect(page.locator('.letter-paper h2')).toHaveText(`Gửi ${recipient},`);
    await expect(page.locator('.letter-signature strong')).toHaveText(sender);
    await expect(page.locator('.letter-signature strong svg')).toHaveCount(0);
    expect(await page.evaluate(() => window.__giftInjection)).toBeUndefined();
    results.push('literal-HTML: recipient and sender remain inert text');
    console.log(results.at(-1));
  } finally { await context.close(); }
}

try {
  const requested = (process.env.GIFT_QA_SCENARIOS || 'desktop,mobile,reduced-motion,narrow-mobile,literal-HTML').split(',');
  if (requested.includes('desktop')) await journey({ label: 'desktop', viewport: { width: 1440, height: 1000 } });
  if (requested.includes('mobile')) await journey({ label: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true });
  if (requested.includes('reduced-motion')) await journey({ label: 'reduced-motion', viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  if (requested.includes('narrow-mobile')) await journey({ label: 'narrow-mobile', viewport: { width: 320, height: 740 }, isMobile: true, reducedMotion: 'reduce' });
  if (requested.includes('literal-HTML')) await htmlSafety();
  expect(errors, 'No browser console or page errors').toEqual([]);
  expect(externalRequests, 'The gift has no external asset dependencies').toEqual([]);
  console.log('All browser checks passed.');
} finally {
  await writeFile(path.join(artifacts, 'browser-check-results.json'), JSON.stringify({ results, errors, externalRequests }, null, 2));
  await browser.close();
}
