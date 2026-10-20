/**
 * Cá nhân hóa món quà tại đây. Tên từ ?to=...&from=... được ưu tiên khi có.
 * Để backgroundMusic trống để dùng giai điệu piano tự tạo, không cần tải MP3.
 */
const giftConfig = {
  recipientName: 'Người đặc biệt',
  senderName: 'Một người luôn mong bạn hạnh phúc',
  occasion: '20/10',
  greetingMessage: `Chúc mừng ngày Phụ nữ Việt Nam 20/10! 🌷

Nhân ngày đặc biệt này, chúc bạn luôn xinh đẹp, rạng rỡ, vui vẻ và hạnh phúc.

Mong rằng mỗi ngày trôi qua đều mang đến cho bạn thật nhiều niềm vui, những điều bất ngờ và những khoảnh khắc đáng nhớ.

Chúc bạn luôn tự tin, mạnh mẽ, được yêu thương, trân trọng và có đủ dũng khí để theo đuổi những điều mình mong muốn.

Hy vọng rằng nụ cười sẽ luôn hiện diện trên môi bạn, không chỉ hôm nay mà còn trong tất cả những ngày phía trước.

Cảm ơn vì bạn đã xuất hiện và khiến thế giới này trở nên đẹp hơn theo cách rất riêng của mình.

Happy Vietnamese Women's Day! ❤️`,
  backgroundMusic: '',
};

function cleanName(value) {
  if (typeof value !== 'string') return '';

  const normalized = value
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
    .replace(/\s+/gu, ' ')
    .trim();

  // Count code points so that a name ending with an emoji is never split.
  return Array.from(normalized).slice(0, 80).join('').trim();
}

export function resolveGiftConfig(search = '') {
  const params = new URLSearchParams(typeof search === 'string' ? search : '');
  const recipientName = cleanName(params.get('to'));
  const senderName = cleanName(params.get('from'));

  // These values are text. Render them through React, never innerHTML.
  return {
    ...giftConfig,
    recipientName: recipientName || giftConfig.recipientName,
    senderName: senderName || giftConfig.senderName,
  };
}

export default giftConfig;
