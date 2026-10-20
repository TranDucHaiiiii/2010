import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Heart, Link, X } from 'lucide-react';

export default function PersonalizeDialog({ config, onClose }) {
  const dialog = useRef(null);
  const [to, setTo] = useState(config.recipientName);
  const [from, setFrom] = useState(config.senderName);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => { dialog.current.showModal(); }, []);
  function createLink(event) {
    event.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.set('to', to.trim());
    url.searchParams.set('from', from.trim());
    setLink(url.href); setCopied(false); setNotice('');
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setNotice('Đã sao chép. Hãy gửi chút yêu thương này đến người bạn quý mến.'); }
    catch { setNotice('Bạn có thể chọn và sao chép liên kết bên dưới.'); }
  }
  return <dialog ref={dialog} className="personalize-dialog" aria-labelledby="personalize-heading" onClose={onClose} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
    <button className="dialog-close icon-button" aria-label="Đóng" onClick={() => dialog.current.close()}><X size={20}/></button>
    <span className="dialog-icon"><Heart size={23}/></span>
    <p className="eyebrow">GÓI GHÉM YÊU THƯƠNG</p>
    <h2 id="personalize-heading">Một món quà.<br/><em>Một người đặc biệt.</em></h2>
    <p className="dialog-description">Thêm tên của hai người để tạo một liên kết dành riêng.</p>
    <form onSubmit={createLink}>
      <label>Dành tặng<input autoFocus required maxLength={80} value={to} onChange={event => {setTo(event.target.value);setLink('');}} placeholder="Tên người nhận" autoComplete="off"/></label>
      <label>Từ người gửi<input required maxLength={80} value={from} onChange={event => {setFrom(event.target.value);setLink('');}} placeholder="Tên của bạn" autoComplete="off"/></label>
      <button type="submit" className="primary-button"><Link size={17}/> Tạo liên kết món quà</button>
    </form>
    {link && <div className="share-result"><label>Liên kết của bạn<input aria-label="Liên kết món quà" readOnly value={link} onFocus={event=>event.target.select()}/></label><button className="secondary-button" onClick={copyLink}>{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? 'Đã sao chép' : 'Sao chép liên kết'}</button></div>}
    <p role="status" className="share-notice">{notice}</p>
  </dialog>;
}
