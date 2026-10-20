# Nhạc nền tùy chọn

Mặc định, website phát giai điệu piano tự tạo bằng Web Audio sau khi người nhận mở quà; không cần tải file nhạc.

Để dùng bản nhạc riêng:

1. Đặt file MP3 bạn có quyền sử dụng vào `public/music/background.mp3`.
2. Đổi `backgroundMusic` trong `src/config.js` thành `'/music/background.mp3'`.
3. Chạy lại bản xem trước và mở món quà để kiểm tra âm thanh.

Đường dẫn nhạc nội bộ được xử lý theo base của website nên dùng được cả khi triển khai ở thư mục con trên GitHub Pages. Nếu tải nhạc bị lỗi, website dùng giai điệu tích hợp; nếu trình duyệt không hỗ trợ âm thanh, người nhận vẫn tiếp tục toàn bộ trải nghiệm.

Không có MP3 đính kèm trong thư mục này. Nhạc chỉ bắt đầu sau thao tác của người dùng; có nút bật/tắt trên giao diện.
