# A Little Gift For You — 20/10

Một món quà tương tác dành cho ngày Phụ nữ Việt Nam: mở hộp quà 3D, nhận bó hoa hồng, mở thư và khám phá trái tim hoa hồng. Giao diện dùng tông kem, hồng phấn, đỏ hoa hồng và champagne, ưu tiên màn hình điện thoại.

## Chạy trên máy

Cài Node.js 22 hoặc 24 và npm, sau đó mở terminal trong thư mục `a-little-gift`:

```sh
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal, mặc định là `http://127.0.0.1:5173`. Có thể xem trên điện thoại cùng mạng bằng `npm run dev -- --host 0.0.0.0`, sau đó truy cập địa chỉ IP nội bộ của máy tính và cổng được hiển thị.

Tạo bản phát hành và xem thử:

```sh
npm test
npm run build
npm run preview
```

File xuất nằm trong `dist/`. Bản xem thử mặc định ở `http://127.0.0.1:4173`; `preview` dành cho kiểm tra trên máy. Xem [hướng dẫn build và triển khai của Vite](https://vite.dev/guide/static-deploy.html).

Trên PowerShell, nếu Windows chặn `npm.ps1`, dùng `npm.cmd` thay cho `npm`, ví dụ `npm.cmd run dev`.

Kiểm tra trình duyệt với Google Chrome đã cài trên máy và máy chủ Vite đang chạy:

```sh
npm run test:browser
npm run test:browser:extra
```

Các bài kiểm tra này đi qua bốn cảnh ở màn hình 1440, 390 và 320 px, chế độ giảm chuyển động, bật/tắt nhạc, xem lại quà, hiển thị tên an toàn, hộp thoại tạo liên kết, điều khiển bàn phím và phương án dự phòng khi ảnh lỗi. Ảnh chụp và báo cáo được lưu vào `artifacts/` (không đưa vào Git).

## Cá nhân hóa

Sửa `src/config.js`:

```js
recipientName: 'Người đặc biệt',
senderName: 'Một người luôn mong bạn hạnh phúc',
occasion: '20/10',
greetingMessage: `Lời chúc của bạn...`,
backgroundMusic: '',
```

`greetingMessage` giữ xuống dòng; để một dòng trống giữa các đoạn thư. Lời chúc mặc định chứa toàn bộ nội dung tiếng Việt trong yêu cầu.

Tên cũng có thể thay đổi bằng đường dẫn:

```text
https://ten-mien-cua-ban/?to=Lan&from=Hai
https://ten-mien-cua-ban/?to=Nguy%E1%BB%85n%20H%C3%A0&from=H%E1%BA%A3i
```

Khi tạo link bằng JavaScript, dùng `URLSearchParams` để mã hóa tên có dấu:

```js
const link = new URL('https://ten-mien-cua-ban/');
link.search = new URLSearchParams({ to: 'Nguyễn Hà', from: 'Hải' });
console.log(link.href);
```

Tên được chuẩn hóa khoảng trắng, bỏ ký tự điều khiển và giới hạn 80 ký tự Unicode. Tham số trống giữ tên trong cấu hình. Chỉ `to` và `from` được lấy từ URL; React hiển thị tên dưới dạng văn bản, không chèn HTML từ tham số.

## Nhạc nền và hình ảnh

Mặc định `backgroundMusic: ''` dùng giai điệu piano tự tạo bằng Web Audio, không cần MP3 hay dịch vụ nhạc bên ngoài. Nhạc chỉ bắt đầu sau thao tác mở quà, có nút bật/tắt và duy trì khi chuyển cảnh.

Để đổi nhạc, đặt bản nhạc bạn có quyền sử dụng vào `public/music/background.mp3`, rồi đặt `backgroundMusic: '/music/background.mp3'`. Đường dẫn nội bộ được giải quyết theo base của website. Nếu MP3 tải lỗi, nhạc tích hợp tiếp tục phục vụ trải nghiệm; nếu trình duyệt không hỗ trợ âm thanh, website vẫn dùng được. Xem thêm `public/music/README.md`.

Bó hoa nằm trong `public/images/rose-bouquet.png`, kèm ghi chú tài nguyên trong `public/images/ASSET-NOTES.md`. Các chi tiết trang trí còn lại dùng CSS, SVG và Canvas để hạn chế tài nguyên ngoài.

## Cấu trúc mã nguồn

```text
a-little-gift/
├── public/
│   ├── images/                 # Bó hoa và ghi chú tài nguyên
│   ├── music/                  # MP3 tùy chọn
│   └── favicon.svg
├── src/
│   ├── components/             # Hộp quà, bó hoa, thư, trái tim, hiệu ứng
│   ├── hooks/                  # Âm thanh và hành vi dùng chung
│   ├── App.jsx                 # Điều phối bốn trải nghiệm
│   ├── config.js               # Tên, ngày, lời chúc và nhạc
│   ├── main.jsx                # Điểm khởi chạy React
│   └── styles.css              # Tailwind và giao diện
├── tests/
│   ├── config.test.mjs          # Cá nhân hóa, Unicode, giới hạn và dữ liệu URL
│   ├── browser-check.mjs        # Hành trình desktop, mobile và giảm chuyển động
│   └── supplemental-browser-check.mjs # Hộp thoại, focus và ảnh dự phòng
├── .github/workflows/deploy-pages.yml
├── index.html
├── package.json
└── vite.config.js
```

React + Vite xử lý ứng dụng; Tailwind CSS và CSS tạo giao diện; Framer Motion điều phối chuyển cảnh; GSAP xử lý hoạt cảnh mở quà; Canvas vẽ cánh hoa và ánh sáng; Lucide React cung cấp biểu tượng. Hộp quà dùng SVG phối cảnh với các lớp nắp, nơ và thân hộp chuyển động độc lập để giữ ứng dụng nhẹ.

## Khả năng tiếp cận và hiệu năng

Các thao tác chính dùng nút, hỗ trợ bàn phím, có nhãn và trạng thái focus. Website tôn trọng `prefers-reduced-motion`: giảm chuyển động nền, hoạt cảnh và hiệu ứng gõ chữ. Người nhận vẫn đọc được đầy đủ thư và đi qua bốn trải nghiệm.

Các lớp trang trí không cản thao tác. Hiệu ứng nền dùng Canvas và `requestAnimationFrame`; ưu tiên `transform` và `opacity` cho chuyển động. Âm thanh cần thao tác người dùng và có phương án dự phòng. Khi thay ảnh hoặc nhạc, nên thử lại trên điện thoại và bản build.

## Đưa website lên mạng

Vite đã đặt `base: './'` để tài nguyên tương đối hoạt động cả ở tên miền gốc và thư mục dự án. Ứng dụng dùng tham số URL, không cần cấu hình chuyển hướng cho các trang con.

### Vercel

Đẩy mã lên Git, import repository trong Vercel, chọn thư mục chứa `package.json`, preset **Vite**, lệnh build `npm run build` và thư mục xuất `dist`, rồi Deploy. Xem [Vite trên Vercel](https://vite.dev/guide/static-deploy.html#vercel).

### Netlify

Import repository, đặt base directory về thư mục chứa `package.json`, build command `npm run build`, publish directory `dist`. Hoặc build trên máy và tải thư mục `dist` qua giao diện triển khai thủ công. Xem [Vite trên Netlify](https://vite.dev/guide/static-deploy.html#netlify).

### GitHub Pages

Đưa nội dung thư mục này vào gốc repository, kèm `package-lock.json`. Trong **Settings → Pages → Build and deployment**, chọn **GitHub Actions**. Workflow có sẵn sẽ cài phụ thuộc, chạy test, build và triển khai khi đẩy lên nhánh `main`; có thể chạy thủ công tại tab Actions. Nếu dùng nhánh khác, sửa `branches` trong workflow. Xem [hướng dẫn workflow GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Sau khi triển khai, thử link `?to=Lan&from=Hai`, mở quà, chuyển qua đủ bốn màn hình, kiểm tra nhạc và nút xem lại trên điện thoại.
