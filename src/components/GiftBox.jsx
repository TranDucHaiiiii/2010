import { forwardRef } from 'react';

const GiftBox = forwardRef(function GiftBox({ opening = false }, ref) {
  return (
    <div className={`gift-art ${opening ? 'is-opening' : ''}`} ref={ref}>
      <svg className="gift-svg" viewBox="0 0 660 620" role="img" aria-label="Hộp quà màu hồng hoa hồng với chiếc nơ lụa màu champagne">
        <defs>
          <linearGradient id="boxFront" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d9798d"/><stop offset=".45" stopColor="#cb607b"/><stop offset="1" stopColor="#a83c5d"/></linearGradient>
          <linearGradient id="boxSide"><stop stopColor="#a03857"/><stop offset="1" stopColor="#bd5572"/></linearGradient>
          <linearGradient id="lidTop" x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#edabc0"/><stop offset="1" stopColor="#d57995"/></linearGradient>
          <linearGradient id="lidFront" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#e795ad"/><stop offset="1" stopColor="#ca647f"/></linearGradient>
          <linearGradient id="silk" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#d9b59e"/><stop offset=".22" stopColor="#f9e4cf"/><stop offset=".5" stopColor="#fff0dd"/><stop offset=".8" stopColor="#d8ac92"/><stop offset="1" stopColor="#f8e2c9"/></linearGradient>
          <linearGradient id="silkLoop" x1="0" y1="0" x2=".4" y2="1"><stop stopColor="#fff0db"/><stop offset=".4" stopColor="#f4dcc1"/><stop offset=".66" stopColor="#c99c83"/><stop offset=".86" stopColor="#f6dec6"/><stop offset="1" stopColor="#e4bfa2"/></linearGradient>
          <linearGradient id="silkInner"><stop stopColor="#bd8f78"/><stop offset="1" stopColor="#f3d6b9"/></linearGradient>
          <radialGradient id="giftShadow"><stop stopColor="#7e3f4a" stopOpacity=".26"/><stop offset="1" stopColor="#7e3f4a" stopOpacity="0"/></radialGradient>
          <radialGradient id="giftLight"><stop stopColor="#fff8dc"/><stop offset=".35" stopColor="#ffe0ab" stopOpacity=".6"/><stop offset="1" stopColor="#ffc0bd" stopOpacity="0"/></radialGradient>
          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
        </defs>
        <ellipse className="box-shadow" cx="349" cy="529" rx="218" ry="40" fill="url(#giftShadow)"/>
        <g className="box-body">
          <path d="M180 284 414 314 414 505 180 469Z" fill="url(#boxFront)"/>
          <path d="M414 314 532 247 532 434 414 505Z" fill="url(#boxSide)"/>
          <path d="M180 284 299 219 532 247 414 314Z" fill="#9a3b57"/>
          <path d="M270 295 317 301 317 490 270 483Z" fill="url(#silk)"/>
          <path d="M461 287 488 272 488 460 461 477Z" fill="url(#silkInner)" opacity=".78"/>
          <path d="M183 467 412 502" stroke="#ecafbe" strokeOpacity=".35"/>
          <path d="M416 316 416 501" stroke="#f1b7c7" strokeOpacity=".35"/>
        </g>
        <ellipse className="gift-opening-light" cx="350" cy="260" rx="235" ry="190" fill="url(#giftLight)" opacity="0"/>
        <g className="box-lid">
          <path d="M165 251 296 182 544 216 413 289Z" fill="url(#lidTop)"/>
          <path d="M165 251 413 285 413 329 165 291Z" fill="url(#lidFront)"/>
          <path d="M413 285 544 216 544 255 413 329Z" fill="#bb5775"/>
          <path d="M165 291 413 329 544 255" fill="none" stroke="#8b2e4e" strokeOpacity=".2" strokeWidth="3"/>
          <path d="M261 264 308 271 438 201 394 195Z" fill="url(#silk)"/>
          <path d="M261 264 308 271 308 312 261 305Z" fill="url(#silk)"/>
          <path d="M218 224 248 209 496 242 468 257Z" fill="url(#silkLoop)"/>
          <path d="M468 257 496 242 496 282 468 298Z" fill="url(#silkInner)"/>
          <path d="M165 251 413 285 544 216" fill="none" stroke="#f9ccda" strokeOpacity=".5" strokeWidth="1.2"/>
          <g className="gift-bow">
            <path d="M350 221C306 196 259 172 249 134 236 83 302 94 326 125 349 154 352 187 350 221Z" fill="url(#silkLoop)"/>
            <path d="M340 207C312 186 271 159 265 137 260 117 280 119 299 132 325 150 337 183 340 207Z" fill="url(#silkInner)"/>
            <path d="M349 220C363 169 393 110 435 112 479 113 468 158 444 177 418 197 379 213 349 220Z" fill="url(#silkLoop)"/>
            <path d="M362 209C385 165 410 131 433 131 455 132 438 155 426 166 407 184 381 198 362 209Z" fill="url(#silkInner)"/>
            <path d="M349 211C319 234 292 264 300 312L325 298 343 317C330 274 353 246 365 227Z" fill="url(#silkLoop)"/>
            <path d="M356 215C384 226 403 254 424 281L436 260 461 266C430 234 402 215 367 207Z" fill="url(#silkLoop)"/>
            <path d="M337 199Q352 193 369 207L369 227Q350 234 334 219Z" fill="url(#silk)"/>
            <path d="M342 201 339 218M364 208 363 224" stroke="#fff2dd" strokeOpacity=".65" strokeWidth="2"/>
          </g>
        </g>
        <g className="gift-tag" transform="rotate(12 450 360)">
          <path d="M474 294Q501 339 462 351" fill="none" stroke="#d3b392" strokeWidth="1.5"/>
          <rect x="414" y="339" width="84" height="108" rx="3" fill="#fff6e9"/>
          <rect x="420" y="345" width="72" height="96" rx="1" fill="none" stroke="#dfc9b5" strokeWidth=".7"/>
          <circle cx="456" cy="347" r="2.5" fill="#cfb59d"/>
          <text x="456" y="375" textAnchor="middle" fontFamily="Cormorant Garamond,serif" fontStyle="italic" fontSize="15" fill="#98676a">just</text>
          <text x="456" y="395" textAnchor="middle" fontFamily="Cormorant Garamond,serif" fontStyle="italic" fontSize="20" fill="#98676a">for you</text>
          <path d="M456 420s-10-6-10-12c0-5 8-6 10-1 3-5 10-4 10 1 0 6-10 12-10 12" fill="#b97481"/>
        </g>
      </svg>
    </div>
  );
});

export default GiftBox;
