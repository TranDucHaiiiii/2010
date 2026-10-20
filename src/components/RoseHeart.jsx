import { useMemo } from 'react';

function Rose({ x, y, scale, rotation, shade, index }) {
  return <g className="heart-rose" style={{ '--rose-delay': `${0.8 + index * 0.008}s` }} transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}>
    <circle r="15" fill={shade ? '#c06c87' : '#9e264c'}/>
    <path d="M-13-2Q-10-18 3-12Q16-15 14-2Q18 10 4 13Q-10 18-13 5Z" fill={shade ? '#e29bb0' : '#c6496c'}/>
    <path d="M-9-7Q5-15 10-2Q14 6 2 10Q-11 12-9-1Q-7-10 2-7Q11-7 7 3Q2 10-3 5Q-9-2-2-3Q4-5 4 2" fill="none" stroke={shade ? '#f5c4cc' : '#f28da3'} strokeWidth="3" strokeLinecap="round"/>
    <path d="M-5-1Q2-6 5 0L1 5Z" fill={shade ? '#ba5d7e' : '#912145'}/>
  </g>;
}

export default function RoseHeart({ reducedMotion }) {
  const roses = useMemo(() => {
    const points = [];
    let index = 0;
    for (let y = -1.25; y < 1.3; y += .17) {
      for (let x = -1.3; x < 1.3; x += .17) {
        const a = x * x + y * y - 1;
        if (a * a * a - x * x * y * y * y < 0) {
          points.push({ x: 250 + x * 155 + Math.sin(index * 32) * 5, y: 275 - y * 155 + Math.cos(index * 28) * 4, scale: .9 + (Math.sin(index * 24) + 1) * .17, rotation: index * 137.5, shade: index % 5 === 0, index });
          index++;
        }
      }
    }
    return points;
  }, []);
  return <div className={`rose-heart-art ${reducedMotion ? 'still' : ''}`}>
    <div className="heart-aura" />
    <svg viewBox="0 0 500 520" role="img" aria-label="Một trái tim lớn kết từ những bông hoa hồng đỏ và hồng phấn">
      <defs><filter id="heartGlow"><feGaussianBlur stdDeviation="14"/></filter></defs>
      <path className="initial-heart" d="M250 400C130 320 65 265 83 180 103 95 214 103 250 176 288 103 398 95 417 180 438 265 370 320 250 400Z" fill="#e47e9a" filter="url(#heartGlow)"/>
      <g className="heart-flower-field">{roses.map((rose, index) => <Rose key={index} {...rose}/>)}</g>
    </svg>
    <span className="heart-twinkle one">✧</span><span className="heart-twinkle two">✦</span><span className="heart-twinkle three">✧</span>
  </div>;
}
