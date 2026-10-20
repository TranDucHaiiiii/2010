import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import { ArrowDown, ArrowLeft, ArrowRight, Check, ChevronRight, Gift, Heart, Mail, Music2, RotateCcw, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { resolveGiftConfig } from './config.js';
import Atmosphere, { burstAt } from './components/Atmosphere.jsx';
import useGiftAudio from './hooks/useGiftAudio.js';
import GiftBox from './components/GiftBox.jsx';
import Typewriter from './components/Typewriter.jsx';
import RoseHeart from './components/RoseHeart.jsx';
import PersonalizeDialog from './components/PersonalizeDialog.jsx';

const steps = [{ label: 'Món quà nhỏ', icon: Gift }, { label: 'Một bó yêu thương', icon: Heart }, { label: 'Lời nhắn gửi', icon: Mail }, { label: 'Điều đặc biệt', icon: Sparkles }];
const config = resolveGiftConfig(window.location.search);
const [occasionDay, occasionMonth] = config.occasion.split('/').map(part => part.trim());
const letterDate = occasionMonth ? `${occasionDay} THÁNG ${occasionMonth}` : config.occasion;
const musicSource = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(config.backgroundMusic)
  ? config.backgroundMusic
  : config.backgroundMusic ? `${import.meta.env.BASE_URL}${config.backgroundMusic.replace(/^\/+/, '')}` : '';

function SceneHeading({ eyebrow, children, description, headingRef }) {
  return <>
    <div className="eyebrow-line"><span/><p className="eyebrow">{eyebrow}</p></div>
    <h1 ref={headingRef} tabIndex={-1}>{children}</h1>
    {description && <p className="scene-description">{description}</p>}
  </>;
}

function Envelope({ opened, onOpen, disabled }) {
  return <button className={`envelope ${opened ? 'opened' : ''}`} onClick={onOpen} disabled={disabled} aria-label="Mở phong thư dành riêng cho bạn">
    <span className="envelope-back"/>
    <span className="envelope-letter"><Heart size={27} strokeWidth={1.2}/><span>A note for you</span><i/><i/><i/></span>
    <span className="envelope-flap"/>
    <span className="envelope-front"/>
    <span className="wax-seal"><Heart size={25} strokeWidth={1.2}/></span>
    <span className="envelope-address">To: {config.recipientName}</span>
  </button>;
}

export default function App() {
  const reducedMotion = !!useReducedMotion();
  const [scene, setScene] = useState(0);
  const [unlocked, setUnlocked] = useState(0);
  const [opening, setOpening] = useState(false);
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [reading, setReading] = useState(false);
  const [letterDone, setLetterDone] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const [heartsSent, setHeartsSent] = useState(false);
  const [finalTitle, setFinalTitle] = useState(false);
  const [bouquetFailed, setBouquetFailed] = useState(false);
  const giftRef = useRef(null);
  const glowRef = useRef(null);
  const headingRef = useRef(null);
  const timelineRef = useRef(null);
  const timers = useRef([]);
  const shouldFocusHeading = useRef(false);
  const { isPlaying, toggle, start, notice } = useGiftAudio(musicSource);
  const markLetterDone = useCallback(() => setLetterDone(true), []);

  useEffect(() => () => { timelineRef.current?.kill(); timers.current.forEach(clearTimeout); }, []);
  useEffect(() => {
    if (reducedMotion || !window.matchMedia('(pointer: fine)').matches) return;
    let frame = 0;
    const followPointer = event => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (glowRef.current) glowRef.current.style.transform = `translate3d(${event.clientX - window.innerWidth * .68}px, ${event.clientY - window.innerHeight * .45}px, 0)`;
      });
    };
    window.addEventListener('pointermove', followPointer, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('pointermove', followPointer); };
  }, [reducedMotion]);
  useEffect(() => {
    if (scene > 0) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [scene, reading]);
  useEffect(() => {
    if (scene !== 3) return;
    const center = { x: window.innerWidth * .65, y: window.innerHeight * .45 };
    const timer = setTimeout(() => burstAt(center.x, center.y, 'celebration'), reducedMotion ? 100 : 1300);
    const titleTimer = setTimeout(() => setFinalTitle(true), reducedMotion ? 100 : 4500);
    return () => {clearTimeout(timer);clearTimeout(titleTimer);};
  }, [scene, reducedMotion]);

  function goTo(next) {
    if (next === scene) return;
    if (next === 0) {
      timelineRef.current?.kill();
      setOpening(false);
    }
    if (scene === 2 && envelopeOpen && !reading) {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setEnvelopeOpen(false);
    }
    shouldFocusHeading.current = true;
    setScene(next); setUnlocked(current => Math.max(current, next));
  }
  function openGift() {
    if (opening) return;
    setOpening(true); start();
    if (reducedMotion) { timers.current.push(setTimeout(() => goTo(1), 250)); return; }
    const art = giftRef.current;
    const bounds = art.getBoundingClientRect();
    const timeline = gsap.timeline({ onComplete: () => goTo(1) });
    timelineRef.current = timeline;
    timeline.to(art, { rotation: -2, duration: .09, repeat: 5, yoyo: true, ease: 'sine.inOut' })
      .to(art.querySelector('.gift-bow'), { y: -36, scale: 1.07, opacity: 0, transformOrigin: 'center', duration: .55, ease: 'power2.inOut' })
      .to(art.querySelector('.box-lid'), { y: -165, x: 12, rotation: -12, transformOrigin: 'center', duration: 1, ease: 'power3.out' }, '-=.12')
      .to(art.querySelector('.gift-tag'), { rotation: 15, opacity: 0, duration: .5 }, '<')
      .to(art.querySelector('.gift-opening-light'), { opacity: 1, scale: 1.8, transformOrigin: 'center', duration: .8 }, '<')
      .call(() => burstAt(bounds.left + bounds.width * .54, bounds.top + bounds.height * .42, 'celebration'), [], '-=.6')
      .to(art, { scale: 1.09, y: -10, duration: .6, ease: 'power2.inOut' }, '-=.25')
      .to(art, { opacity: 0, duration: .35 });
  }
  function openEnvelope() {
    if (envelopeOpen) return;
    setEnvelopeOpen(true);
    timers.current.push(setTimeout(() => {
      shouldFocusHeading.current = true;
      setReading(true);
    }, reducedMotion ? 50 : 1300));
  }
  function replay() {
    timelineRef.current?.kill(); timers.current.forEach(clearTimeout); timers.current = [];
    setOpening(false); setEnvelopeOpen(false); setReading(false); setLetterDone(false); setShowAll(false); setHeartsSent(false); setFinalTitle(false); setUnlocked(0); setScene(0);
    window.scrollTo({ top: 0, behavior: 'instant' });
    shouldFocusHeading.current = true;
  }
  function bouquetMove(event) {
    if (reducedMotion || event.pointerType === 'touch') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    event.currentTarget.style.setProperty('--tilt-x', `${-y * 8}deg`);
    event.currentTarget.style.setProperty('--tilt-y', `${x * 10}deg`);
  }

  return <div className={`gift-experience ${scene === 3 ? 'finale-theme' : ''} ${reducedMotion ? 'reduced-motion' : ''}`}>
    <Atmosphere dark={scene === 3} reducedMotion={reducedMotion}/>
    <div className="cursor-glow" ref={glowRef} aria-hidden="true"/>
    <header className="site-header">
      <a className="wordmark" href="#" onClick={event => { event.preventDefault(); if(scene > 0) replay(); }} aria-label="A little gift — về món quà đầu tiên"><span className="brand-flower"><Heart size={18} strokeWidth={1.3}/></span>a little gift<span className="wordmark-dot">.</span></a>
      <span className="header-dedication">MỘT NGÀY ĐẶC BIỆT. MỘT NGƯỜI ĐẶC BIỆT.</span>
      <div className="header-actions"><span className="date-badge">{occasionDay} {occasionMonth && <><span>/</span> {occasionMonth}</>} <i/> <span className="date-word">VIETNAMESE WOMEN’S DAY</span></span><button className={`music-toggle ${isPlaying ? 'playing' : ''}`} onClick={toggle} aria-label={isPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'} aria-pressed={isPlaying} title={isPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}>{isPlaying ? <Volume2 size={17}/> : <VolumeX size={17}/>}<span className="sound-bars" aria-hidden="true"><i/><i/><i/></span></button></div>
    </header>

    <main id="main-content">
      <AnimatePresence mode="wait">
        <motion.section key={scene === 2 && reading ? 'letter-reading' : scene} className={`scene scene-${scene} ${reading && scene === 2 ? 'reading-scene' : ''}`} variants={{ hidden: { opacity: 0, y: reducedMotion ? 0 : 16, filter: reducedMotion ? 'none' : 'blur(5px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)' }, exit: { opacity: 0, y: reducedMotion ? 0 : -12, filter: reducedMotion ? 'none' : 'blur(4px)' } }} initial="hidden" animate="visible" exit="exit" onAnimationComplete={variant => { if (variant === 'visible' && shouldFocusHeading.current) { shouldFocusHeading.current = false; headingRef.current?.focus({ preventScroll: true }); } }} transition={{ duration: reducedMotion ? .12 : .48 }} aria-label={`Phần ${scene + 1}: ${steps[scene].label}`}>
          {scene === 0 && <>
            <div className="scene-copy">
              <SceneHeading eyebrow="HAPPY VIETNAMESE WOMEN’S DAY" headingRef={headingRef}>Một chút<br/><em>yêu thương,</em><br/>dành riêng cho bạn<span className="title-period">.</span></SceneHeading>
              <p className="scene-description intro-description"><Typewriter text="Có một món quà nhỏ dành riêng cho bạn..." reducedMotion={reducedMotion}/><br/><span>Vì bạn xứng đáng với những điều thật đẹp.</span></p>
              <button className="primary-button" onClick={openGift} disabled={opening}><Gift size={18} strokeWidth={1.5}/><span>{opening ? 'Đang mở chút yêu thương...' : 'Mở món quà'}</span>{!opening && <ArrowRight size={17}/>}</button>
              <p className="button-note"><Music2 size={12}/> Một chút nhạc, một chút bất ngờ</p>
              <div className="recipient-note"><span className="fine-line"/><span>Dành tặng</span><strong>{config.recipientName}</strong><Heart size={13}/></div>
            </div>
            <div className="scene-art gift-stage">
              <div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/>
              <span className="art-star star-one">✧</span><span className="art-star star-two">✦</span><span className="art-star star-three">✧</span>
              <span className="handwritten gift-caption">a little something,<br/>just for you</span>
              <svg className="caption-arrow" viewBox="0 0 90 70" aria-hidden="true"><path d="M5 4Q75-5 69 52M57 43 69 55 80 43"/></svg>
              <GiftBox ref={giftRef} opening={opening}/>
              <span className="art-footnote">GÓI GHÉM BẰNG CẢ TẤM LÒNG</span>
            </div>
          </>}

          {scene === 1 && <>
            <div className="scene-copy">
              <SceneHeading eyebrow="MỘT BÓ HOA, NGÀN ĐIỀU MUỐN NÓI" headingRef={headingRef}>Gửi bạn<br/><em>một bó</em><br/>yêu thương<span className="title-period">.</span></SceneHeading>
              <p className="scene-description">Tặng bạn một bó hoa thật đẹp,<br/>cùng những lời chúc ngọt ngào nhất!<br/><span>Chúc bạn luôn rực rỡ theo cách của riêng mình.</span></p>
              <button className="primary-button" onClick={()=>goTo(2)}><Mail size={18} strokeWidth={1.5}/> Khám phá lời chúc <ArrowRight size={17}/></button>
              <p className="button-note"><Heart size={12}/> Có một lời nhắn đang chờ bạn</p>
              <button className="text-button back-link" onClick={()=>goTo(0)}><ArrowLeft size={13}/> Về món quà nhỏ</button>
            </div>
            <div className="scene-art bouquet-stage"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><span className="bouquet-date">{config.occasion.replace('/', ' / ')}</span>
              <motion.button className="bouquet-interaction" aria-label="Chạm vào bó hoa để những cánh hoa bay lên" onPointerMove={bouquetMove} onPointerLeave={event=>{event.currentTarget.style.setProperty('--tilt-x','0deg');event.currentTarget.style.setProperty('--tilt-y','0deg');}} onClick={event=>{const b=event.currentTarget.getBoundingClientRect();burstAt(b.left+b.width/2,b.top+b.height*.35,'petals');}} initial={{y: reducedMotion ? 0 : 100, opacity: 0, scale: reducedMotion ? 1 : .85}} animate={{y:0,opacity:1,scale:1}} transition={{duration: reducedMotion ? .1 : 1.2, ease:[.2,.65,.2,1]}}>
                {bouquetFailed ? <RoseHeart reducedMotion={reducedMotion}/> : <img src={`${import.meta.env.BASE_URL}images/rose-bouquet.png`} alt="Bó hoa hồng đỏ và hồng pastel, hoa baby, gói trong giấy kem và thắt nơ lụa hồng" onError={()=>setBouquetFailed(true)} width="1254" height="1254"/>}
              </motion.button><span className="handwritten bouquet-caption">flowers for your soul</span><p className="art-footnote"><Sparkles size={12}/> Chạm vào bó hoa để nhận thêm chút dịu dàng</p>
            </div>
          </>}

          {scene === 2 && !reading && <>
            <div className="scene-copy"><SceneHeading eyebrow="NHỮNG ĐIỀU TỪ TRÁI TIM" headingRef={headingRef}>Có những lời,<br/><em>chỉ muốn gửi</em><br/>riêng bạn<span className="title-period">.</span></SceneHeading><p className="scene-description">Giữa những bộn bề của cuộc sống,<br/>mong bạn dành một phút thật chậm<br/>để nhận lấy những lời chúc dịu dàng này.</p><button className="primary-button" onClick={openEnvelope} disabled={envelopeOpen}><Mail size={18}/>{envelopeOpen ? 'Lời nhắn đang được mở...' : 'Mở bức thư của bạn'}<ArrowRight size={17}/></button><p className="button-note">Được viết bằng tất cả sự chân thành</p><button className="text-button back-link" onClick={()=>goTo(1)}><ArrowLeft size={13}/> Về bó hoa của bạn</button></div>
            <div className="scene-art envelope-stage"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><span className="handwritten envelope-caption">sealed with love</span><Envelope opened={envelopeOpen} disabled={envelopeOpen} onOpen={openEnvelope}/><span className="art-footnote">MỘT BỨC THƯ. THẬT NHIỀU THƯƠNG MẾN.</span></div>
          </>}

          {scene === 2 && reading && <>
            <div className="letter-side"><div className="eyebrow-line"><span/><p className="eyebrow">DÀNH RIÊNG CHO BẠN</p></div><h1 tabIndex={-1} ref={headingRef}>Vài lời<br/><em>thương mến.</em></h1><p className="scene-description">Một lời chúc nhỏ,<br/>cho những niềm vui thật lớn.</p><span className="handwritten letter-side-sign">with all my heart</span><button className="text-button back-link" onClick={()=>goTo(1)}><ArrowLeft size={13}/> Về bó hoa của bạn</button></div>
            <article className="letter-paper"><div className="letter-topline"><span>{letterDate}</span><Heart size={18} strokeWidth={1.2}/><span>MỘT NGÀY THẬT ĐẸP</span></div><h2>Gửi {config.recipientName},</h2><div className="letter-body">{showAll ? config.greetingMessage : <Typewriter text={config.greetingMessage} speed={10} reducedMotion={reducedMotion} onComplete={markLetterDone}/>}</div>{!letterDone && !showAll && <button className="text-button reveal-letter" onClick={()=>{setShowAll(true);setLetterDone(true);}}>Hiện toàn bộ lời chúc <ArrowDown size={12}/></button>}<div className={`letter-signature ${letterDone || showAll ? 'signature-visible' : ''}`}><p>Thương mến,</p><strong>{config.senderName}</strong><span>From someone who wishes you happiness</span><Heart size={18} strokeWidth={1}/></div>{(letterDone || showAll) && <motion.button initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="primary-button letter-next" onClick={()=>goTo(3)}><Sparkles size={16}/><span>Vẫn còn một điều bất ngờ dành cho bạn</span><ArrowRight size={16}/></motion.button>}</article>
          </>}

          {scene === 3 && <>
            <div className="scene-copy"><SceneHeading eyebrow="MONG BẠN LUÔN NHỚ RẰNG" headingRef={headingRef}><span className="final-english">You are</span><br/><em>so special.</em><span className="title-period">♡</span></SceneHeading><div className="final-message"><p className="final-occasion">{finalTitle ? `CHÚC MỪNG NGÀY PHỤ NỮ VIỆT NAM ${config.occasion}` : 'YOU ARE SPECIAL'}</p><p className="scene-description">Mong những điều tốt đẹp nhất<br/>sẽ luôn đến với bạn.<br/><span>Hôm nay, ngày mai và thật nhiều ngày sau nữa.</span></p></div><div className="final-actions"><button className="primary-button" onClick={event=>{const b=event.currentTarget.getBoundingClientRect();burstAt(b.left+b.width/2,b.top,'hearts');setHeartsSent(true);}}><Heart size={17}/> Gửi một trái tim <ArrowUpHeart/></button><button className="secondary-button" onClick={replay}><RotateCcw size={16}/> Xem lại món quà</button></div><p className="button-note heart-confirmation" role="status">{heartsSent ? 'Một chút yêu thương đã được gửi vào khoảnh khắc này.' : 'Một ngày thật đẹp, dành cho một người thật đáng quý.'}</p></div>
            <div className="scene-art final-stage"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><RoseHeart reducedMotion={reducedMotion}/><span className="handwritten final-caption">the world is lovelier with you</span><span className="art-footnote">HAPPY VIETNAMESE WOMEN’S DAY</span></div>
          </>}
        </motion.section>
      </AnimatePresence>
    </main>

    <footer className="site-footer"><div className="journey"><span className="journey-label">CHÚT YÊU THƯƠNG CỦA BẠN</span><nav className="journey-steps" aria-label="Hành trình món quà">{steps.map((step,index)=><div className="journey-item" key={step.label}><button className={`journey-step ${scene===index?'active':''} ${scene>index?'completed':''}`} aria-current={scene===index?'step':undefined} disabled={index>unlocked || opening && scene===0} onClick={()=>goTo(index)} aria-label={`Phần ${index+1}: ${step.label}`}><span className="step-number">{index<scene?<Check size={12}/>:String(index+1).padStart(2,'0')}</span><span className="step-label">{step.label}</span></button>{index<3&&<span className="step-connector"/>}</div>)}</nav></div><div className="footer-signoff"><span>Made with a little love <Heart size={12}/></span><button className="text-button personalize-link" onClick={()=>setPersonalizeOpen(true)}>Cá nhân hóa món quà <ChevronRight size={12}/></button></div></footer>
    <div className="sr-only" role="status">{notice}</div>
    {personalizeOpen&&<PersonalizeDialog config={config} onClose={()=>setPersonalizeOpen(false)}/>}
  </div>;
}

function ArrowUpHeart(){return <span className="button-tiny-heart" aria-hidden="true">♡</span>;}
