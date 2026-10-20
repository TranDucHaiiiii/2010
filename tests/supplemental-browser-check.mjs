import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.GIFT_BASE_URL || 'http://127.0.0.1:5173';
const artifacts = path.resolve('artifacts');
await mkdir(artifacts, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
const errors = [];
const ignored = [];

async function newPage(label, { imageFailure = false } = {}) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const isExpectedFailure = url =>
    /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//.test(url) ||
    (imageFailure && new URL(url).pathname.endsWith('/images/rose-bouquet.png'));

  page.on('pageerror', error => errors.push(`${label}: ${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const url = message.location().url;
    const detail = `${label}: ${message.text()} ${url}`.trim();
    if (url && isExpectedFailure(url)) ignored.push(detail);
    else errors.push(detail);
  });
  page.on('requestfailed', request => {
    const detail = `${label}: ${request.failure()?.errorText} ${request.url()}`;
    if (isExpectedFailure(request.url())) ignored.push(detail);
    else errors.push(detail);
  });

  return { context, page };
}

async function readyScene(page, selector) {
  await expect(page.locator(selector)).toBeVisible({ timeout: 15000 });
  await expect(page.locator(selector)).toHaveCSS('opacity', '1');
}

async function personalizationAndFocus() {
  const { context, page } = await newPage('personalization-and-focus');
  try {
    const original = new URL(baseURL);
    original.search = new URLSearchParams({ kept: 'a value & more', to: 'Lan', from: 'Hai' });
    original.hash = 'with-love';
    await page.goto(original.href, { waitUntil: 'domcontentloaded' });
    await readyScene(page, '.scene-0');

    const trigger = page.getByRole('button', { name: 'Cá nhân hóa món quà' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: /Một món quà\.[\s\S]*Một người đặc biệt\./ });
    await expect(dialog).toBeVisible();
    await expect.poll(() => dialog.evaluate(element => element.contains(document.activeElement)), {
      message: 'Opening the modal moves keyboard focus inside it',
    }).toBe(true);

    const recipient = 'Nguyễn Hà 🌷';
    const sender = 'Hải & Ánh';
    await dialog.getByLabel('Dành tặng', { exact: true }).fill(recipient);
    await dialog.getByLabel('Từ người gửi', { exact: true }).fill(sender);
    await dialog.getByRole('button', { name: 'Tạo liên kết món quà' }).click();
    const generated = new URL(await dialog.getByLabel('Liên kết món quà', { exact: true }).inputValue());
    expect(generated.origin).toBe(original.origin);
    expect(generated.pathname).toBe(original.pathname);
    expect(generated.hash).toBe(original.hash);
    expect(generated.searchParams.get('kept')).toBe('a value & more');
    expect(generated.searchParams.get('to')).toBe(recipient);
    expect(generated.searchParams.get('from')).toBe(sender);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await page.goto(generated.href, { waitUntil: 'domcontentloaded' });
    await readyScene(page, '.scene-0');
    await expect(page.locator('.recipient-note strong')).toHaveText(recipient);
    await page.locator('.scene-0 .primary-button').click();
    await readyScene(page, '.scene-1');
    await expect(page.locator('.scene-1 h1')).toBeFocused();
    await page.locator('.scene-1 .primary-button').click();
    await readyScene(page, '.scene-2');
    await expect(page.locator('.scene-2 h1')).toBeFocused();
    await page.locator('.envelope').click();
    await readyScene(page, '.reading-scene');
    await expect(page.locator('.reading-scene h1')).toBeFocused();
    await expect(page.locator('.letter-paper h2')).toHaveText(`Gửi ${recipient},`);
    await expect(page.locator('.letter-signature strong')).toHaveText(sender);

    results.push('Named personalization dialog, Unicode share link, URL preservation, Escape/focus return, and scene-heading focus passed.');
    console.log(results.at(-1));
  } catch (error) {
    await page.screenshot({ path: path.join(artifacts, 'supplemental-dialog-failure.png'), fullPage: true });
    throw error;
  } finally {
    await context.close();
  }
}

async function bouquetImageFallback() {
  const { context, page } = await newPage('bouquet-image-fallback', { imageFailure: true });
  let imageAborted = false;
  try {
    await page.route('**/images/rose-bouquet.png', async route => {
      imageAborted = true;
      await route.abort('failed');
    });
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await readyScene(page, '.scene-0');
    await page.locator('.scene-0 .primary-button').click();
    await readyScene(page, '.scene-1');
    await expect(page.locator('.bouquet-interaction').getByRole('img', {
      name: 'Một trái tim lớn kết từ những bông hoa hồng đỏ và hồng phấn',
    })).toBeVisible();
    expect(imageAborted).toBe(true);
    await expect(page.locator('.bouquet-interaction img')).toHaveCount(0);
    await expect(page.locator('.scene-1 .primary-button')).toBeEnabled();
    await page.locator('.scene-1 .primary-button').click();
    await readyScene(page, '.scene-2');
    results.push('Aborted bouquet image is replaced with accessible rose-heart artwork and the journey remains usable.');
    console.log(results.at(-1));
  } catch (error) {
    await page.screenshot({ path: path.join(artifacts, 'supplemental-image-failure.png'), fullPage: true });
    throw error;
  } finally {
    await context.close();
  }
}

try {
  await personalizationAndFocus();
  await bouquetImageFallback();
  expect(errors, 'No unexpected browser console, page, or request errors').toEqual([]);
  console.log('All supplemental browser checks passed.');
} finally {
  await writeFile(path.join(artifacts, 'supplemental-browser-check-results.json'), JSON.stringify({ results, errors, ignored }, null, 2));
  await browser.close();
}
