import test from 'node:test';
import assert from 'node:assert/strict';
import giftConfig, { resolveGiftConfig } from '../src/config.js';

test('the default gift includes all greeting paragraphs and editable settings', () => {
  const resolved = resolveGiftConfig();

  assert.deepEqual(resolved, giftConfig);
  assert.notStrictEqual(resolved, giftConfig);
  assert.equal(resolved.recipientName, 'Người đặc biệt');
  assert.equal(resolved.senderName, 'Một người luôn mong bạn hạnh phúc');
  assert.equal(resolved.occasion, '20/10');
  assert.equal(resolved.greetingMessage.split('\n\n').length, 7);
  assert.ok(resolved.greetingMessage.startsWith('Chúc mừng ngày Phụ nữ Việt Nam 20/10! 🌷'));
  assert.ok(resolved.greetingMessage.endsWith("Happy Vietnamese Women's Day! ❤️"));
  assert.equal(resolved.backgroundMusic, '');
});

test('URL names support Vietnamese, Unicode, percent encoding, and plus spaces', () => {
  const params = new URLSearchParams({ to: '  Nguyễn  Hà 🌷  ', from: 'Hải Đăng' });
  const resolved = resolveGiftConfig(`?${params}`);

  assert.equal(resolved.recipientName, 'Nguyễn Hà 🌷');
  assert.equal(resolved.senderName, 'Hải Đăng');
});

test('blank URL names retain each configured default independently', () => {
  assert.equal(resolveGiftConfig('?to=&from=%20%09%0A').recipientName, giftConfig.recipientName);
  assert.equal(resolveGiftConfig('?to=&from=%20%09%0A').senderName, giftConfig.senderName);
  assert.equal(resolveGiftConfig('?to=Lan').senderName, giftConfig.senderName);
  assert.equal(resolveGiftConfig('?from=Hai').recipientName, giftConfig.recipientName);
});

test('control characters are normalized without joining name parts', () => {
  const resolved = resolveGiftConfig('?to=Lan%00%0AHoa&from=%09H%E1%BA%A3i%7FAnh%20');

  assert.equal(resolved.recipientName, 'Lan Hoa');
  assert.equal(resolved.senderName, 'Hải Anh');
});

test('HTML-like URL content stays literal text for safe React rendering', () => {
  const literal = '<img src=x onerror=alert(1)>';
  const resolved = resolveGiftConfig(`?${new URLSearchParams({ to: literal })}`);

  assert.equal(resolved.recipientName, literal);
  assert.equal(typeof resolved.recipientName, 'string');
  assert.equal(resolved.greetingMessage, giftConfig.greetingMessage);
});

test('URL names are capped at 80 Unicode code points without splitting emoji', () => {
  const params = new URLSearchParams({ to: '🌷'.repeat(100), from: 'Đ'.repeat(81) });
  const resolved = resolveGiftConfig(`?${params}`);

  assert.equal(Array.from(resolved.recipientName).length, 80);
  assert.equal(resolved.recipientName, '🌷'.repeat(80));
  assert.equal(resolved.senderName, 'Đ'.repeat(80));
});

test('personalization does not mutate defaults or accept arbitrary config keys', () => {
  const resolved = resolveGiftConfig('?to=Lan&from=Hai&backgroundMusic=https://invalid.example/music');

  assert.equal(resolved.recipientName, 'Lan');
  assert.equal(resolved.senderName, 'Hai');
  assert.equal(resolved.backgroundMusic, giftConfig.backgroundMusic);
  assert.equal(giftConfig.recipientName, 'Người đặc biệt');
  assert.equal(resolveGiftConfig().recipientName, 'Người đặc biệt');
});
