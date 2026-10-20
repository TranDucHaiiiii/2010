import { useEffect, useState } from 'react';

export default function Typewriter({ text, speed = 35, reducedMotion = false, className = '', onComplete }) {
  const [count, setCount] = useState(reducedMotion ? text.length : 0);
  useEffect(() => {
    if (reducedMotion) { setCount(text.length); onComplete?.(); return; }
    setCount(0);
    let index = 0;
    const timer = setInterval(() => {
      index += speed < 15 ? 3 : 1;
      setCount(Math.min(index, text.length));
      if (index >= text.length) { clearInterval(timer); onComplete?.(); }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, reducedMotion, onComplete]);
  return <span className={`typewriter ${className}`}><span className="sr-only">{text}</span><span aria-hidden="true">{text.slice(0, count)}{count < text.length && <span className="type-caret" />}</span></span>;
}
