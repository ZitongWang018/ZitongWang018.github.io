/* A tiny, self-contained SVG neighborhood. No network requests or dependencies. */
(() => {
  'use strict';
  const root = document.querySelector('.street-walk');
  if (!root) return;
  const svg = root.querySelector('svg');
  const frame = root.querySelector('.street-walk__frame');
  const status = root.querySelector('.street-walk__status');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let date = new Date();
  let today = date.getDate();
  let days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const step = 224;
  const widths = [178, 194, 170, 186, 194, 172, 198];
  // The reference's alternating rooflines and pastel facades, repeated for a full month.
  const facades = {
    11: [278, '#e0c6a1', 'triangle'], 12: [265, '#c1c9a8', 'hip'],
    13: [284, '#e8e1cc', 'triangle'], 14: [368, '#eeebde', 'flat'],
    15: [387, '#dcd7c6', 'triangle'], 16: [400, '#c1c9a8', 'triangle'],
    17: [270, '#c1c9a8', 'hip'], 18: [279, '#c1c9a8', 'triangle'],
    19: [387, '#d5bc85', 'hip'], 20: [286, '#c0cbd0', 'triangle'],
    21: [378, '#d3a68e', 'triangle'], 22: [378, '#d5bc85', 'hip'],
    23: [260, '#c1c9a8', 'flat'], 24: [388, '#e4d5b5', 'triangle'],
    25: [285, '#c1c9a8', 'hip'], 26: [286, '#d3a68e', 'triangle'],
    27: [279, '#c0cbd0', 'triangle']
  };
  const doorPosition = day => (day - 1) * step + (day % 2 ? widths[day % 7] - 48 : 50) + 23;
  let viewWidth = 1932, camera = 0, cameraTarget = 0;
  let position = doorPosition(1), destination = position;
  let direction = 1, rainy = false, walking = false, hidden = false;
  let lastTime = 0, phase = 0, animation = 0, inView = true;
  let selected = 1, focusBeforeExpand = null, previousOverflow = '';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rect = (x, y, w, h, fill, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
  const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
  const ellipse = (x, y, rx, ry, fill, extra = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
  const line = (x, y, xx, yy, color, width = 3) => `<path d="M${x} ${y}L${xx} ${yy}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
  const cloud = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${path('M0 35C-3 11 25 1 44 12C59 -12 92 -7 102 17C124 9 140 21 140 35Z', '#f3f8fa')}</g>`;
  function windowShape(x, y, arch = false, balcony = false, flowers = false) {
    let out = path(arch ? `M${x} ${y + 60}V${y + 23}a23 23 0 0 1 46 0v37Z` : `M${x} ${y}h46v60h-46Z`, '#7e8e9d', 'stroke="#f4f2e5" stroke-width="4"');
    out += line(x + 23, y + (arch ? 22 : 1), x + 23, y + 60, '#f4f2e5');
    out += line(x + 1, y + 29, x + 45, y + 29, '#f4f2e5');
    out += rect(x - 5, y + 59, 56, 6, '#efefdc');
    if (balcony) {
      out += line(x - 10, y + 45, x + 56, y + 45, '#343d41', 4);
      for (let k = 0; k < 7; k++) out += line(x - 7 + k * 10, y + 45, x - 7 + k * 10, y + 79, '#343d41', 3);
    }
    if (flowers) {
      out += rect(x - 2, y + 65, 50, 11, '#b97550');
      for (let k = 0; k < 6; k++) out += ellipse(x + 3 + k * 8, y + 63, 4, 4, k % 2 ? '#fff8de' : '#d88869');
    }
    return out;
  }
  function cat(x, y, flip = false) {
    return `<g transform="translate(${x} ${y}) scale(${flip ? -1 : 1} 1)">${ellipse(14, -8, 21, 12, '#bd8b4b')}${path('M-7 -8Q-18 -11 -14 -29L-8 -23L0 -30L2 -13Z', '#bd8b4b')}${line(-11, -17, -8, -17, '#5c5b4c', 2)}${line(-4, -17, -1, -17, '#5c5b4c', 2)}${path('M28 -6q19 13 -15 10', 'none', 'stroke="#bd8b4b" stroke-width="5" stroke-linecap="round"')}<text x="7" y="-53" fill="#e8e6ca" font-size="15" font-family="Arial">z</text></g>`;
  }
  function plant(x, y, type) {
    let out = path(`M${x - 13} ${y - 22}h26l-4 22h-18Z`, '#ab7451');
    out += type ? ellipse(x, y - 52, 15, 29, '#bb9154') : ellipse(x, y - 42, 17, 17, '#c19759');
    if (!type) for (let k = 0; k < 4; k++) out += ellipse(x - 8 + k * 5, y - 46 + (k % 2) * 12, 4, 5, '#bd6756');
    return out;
  }
  function house(day) {
    const x = (day - 1) * step;
    const kind = day % 7;
    const tops = [279, 262, 388, 263, 285, 395, 334];
    const colors = ['#c1c8a8', '#d4b883', '#eeebde', '#c1c9a8', '#e4d5b5', '#d3a68e', '#c0cbd0'];
    const preset = facades[day] || [tops[kind], colors[kind], kind === 2 ? 'flat' : (kind === 1 || kind === 5 ? 'hip' : 'triangle')];
    const w = widths[kind], [top, body, roofType] = preset;
    const flat = roofType === 'flat';
    let out = rect(18, top, w, 553 - top, body);
    out += rect(18 + w - 12, top, 12, 553 - top, '#6e705b', 'opacity=".17"');
    out += rect(18, 540, w, 13, '#9f9c82', 'opacity=".35"');
    if (top < 340) out += rect(18, 397, w, 5, '#949c81', 'opacity=".3"');
    if (day % 3 !== 0 && !flat) {
      const chimneyX = day % 2 ? 47 : w - 26;
      out += rect(chimneyX, top - 94, 22, 61, '#ac6447') + rect(chimneyX - 3, top - 100, 28, 7, '#7e7c70');
    }
    if (flat) out += rect(12, top - 10, w + 12, 9, '#ad6243');
    else {
      const roof = kind % 2 ? '#b87850' : '#99553e';
      out += path(roofType === 'hip' ? `M8 ${top}l33 -66h${w - 44}l32 66Z` : `M8 ${top}L${18 + w / 2} ${top - 56}L${w + 28} ${top}Z`, roof);
      for (let k = 1; k < 5; k++) {
        const inset = roofType === 'hip' ? k * 6 : k * (w + 20) * 6 / 56;
        out += line(14 + inset, top - k * 12, w + 21 - inset, top - k * 12, '#d6a17e', 2.5);
      }
      out += rect(8, top - 1, w + 20, 6, '#6d6b60', 'opacity=".6"');
    }
    if (top < 340) {
      const double = kind === 0 || day === 23 || day === 18;
      out += windowShape(double ? 38 : 18 + w / 2 - 23, top + 38, !double && (kind === 1 || kind === 6), !double, day % 4 === 1);
      if (double) out += windowShape(w - 42, top + 38);
    }
    const doorX = day % 2 ? w - 48 : 50;
    out += windowShape(doorX > 75 ? 43 : w - 38, 425, day % 3 === 0);
    const doorColor = ['#597e83', '#7b4533', '#4d6652', '#415d7b', '#bd9d49', '#597c81', '#607363'][kind];
    const arch = kind === 1 || kind === 6;
    out += path(arch ? `M${doorX} 552v-55a23 23 0 0 1 46 0v55Z` : `M${doorX} 552v-78h46v78Z`, doorColor, 'stroke="#f2efdb" stroke-width="5" class="sw-focus"');
    out += rect(doorX + 8, 501, 29, 44, 'none', 'stroke="#394d42" stroke-width="2" opacity=".55"');
    out += ellipse(doorX + 35, 516, 2.7, 3, '#d9c578', 'class="sw-doorknob"');
    out += rect(doorX - 5, 548, 57, 6, '#d0cbb7');
    const boxX = doorX > 75 ? doorX - 53 : doorX + 60;
    out += rect(boxX, 490, 31, 38, '#45604e', 'rx="5"') + rect(boxX + 5, 499, 21, 5, '#2f483d', 'rx="1"');
    if (day % 3 === 2) out += rect(doorX - 12, 453, 4, 39, '#596155') + rect(doorX - 12, 453, 22, 13, '#b65e47');
    // Enamel number plate: double cream border, just like the reference.
    const plateX = doorX - 30;
    out += rect(plateX, 420, 78, 46, '#34517f', 'rx="5" class="sw-plaque"');
    out += rect(plateX + 4, 424, 70, 38, 'none', 'rx="3" stroke="#f1edda" stroke-width="2"');
    out += `<text x="${plateX + 39}" y="456" fill="#f7f4e8" text-anchor="middle" font-family="Georgia, serif" font-size="42" font-weight="bold">${day}</text>`;
    if (day % 4 === 0 || day === 14 || day === 17 || day === 19) out += cat(18 + w / 2, top - (flat ? 14 : roofType === 'hip' ? 70 : 60));
    if (day % 5 === 0) out += plant(w + 13, 553, 1);
    if (day % 5 === 2) out += plant(21, 553, 0);
    if (day % 3 === 1) {
      out += line(22, 550, 22, 405, '#a18550', 4);
      for (let k = 0; k < 15; k++) out += ellipse(20 + Math.sin(k * 1.9) * 5, 545 - k * 10, 9, 11, '#bd9250');
    }
    const future = day > today;
    return `<g class="sw-house${future ? ' sw-future' : ''}" data-day="${day}" transform="translate(${x} 0)" role="button" tabindex="0" aria-label="Walk to house ${day}" aria-current="${day === selected}">${rect(5, top - 105, 215, 658 - top, 'transparent')}${future ? `<g class="sw-blueprint" fill="none" stroke="#6386b4" stroke-width="1.6" stroke-dasharray="5 5">${out}</g>` : out}</g>`;
  }
  const segments = {
    0: 'abcedf', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc',
    5: 'afgcd', 6: 'afgecd', 7: 'abc', 8: 'abcdefg', 9: 'abfgcd'
  };
  function digitalDate() {
    const value = `'${String(date.getFullYear()).slice(-2)} ${String(date.getMonth() + 1).padStart(2, '0')} ${String(selected).padStart(2, '0')}`;
    const coords = { a: [3, 0, 15, 0], b: [17, 3, 17, 13], c: [17, 19, 17, 29], d: [2, 32, 14, 32], e: [0, 19, 0, 29], f: [0, 3, 0, 13], g: [2, 16, 15, 16] };
    let out = '', x = 0;
    for (const ch of value) {
      if (ch === "'") out += line(x + 2, 0, x, 7, '#f7b467', 3);
      else if (ch !== ' ') for (const s of segments[ch]) out += line(coords[s][0] + x, coords[s][1], coords[s][2] + x, coords[s][3], '#f7b467', 3.5);
      x += ch === ' ' || ch === "'" ? 10 : 24;
    }
    return `<g transform="translate(${viewWidth - 180} 688) skewX(-8)" stroke-linecap="round">${out}</g>`;
  }
  function build() {
    svg.innerHTML = `<defs>
      <linearGradient id="sw-sky" x2="0" y2="1"><stop stop-color="#c2d5e3"/><stop offset="1" stop-color="#dce5e9"/></linearGradient>
      <style>.sw-blueprint rect:not([fill="transparent"]),.sw-blueprint path,.sw-blueprint ellipse{fill:none;stroke:#6386b4;stroke-width:1.6;opacity:1}.sw-blueprint text{fill:#6386b4;stroke:none}.sw-blueprint [fill="transparent"]{stroke:none}</style>
      </defs>
      ${rect(0, 0, viewWidth, 724, 'url(#sw-sky)')}
      <g id="sw-sky-decor">${ellipse(viewWidth - 176, 108, 58, 58, '#f9f6dc', 'opacity=".3"')}${ellipse(viewWidth - 176, 108, 37, 37, '#fff8df')}${cloud(370, 68)}${cloud(790, 172, .8)}${cloud(1360, 67)}${cloud(1690, 171, .8)}</g>
      <g id="sw-hills">${path(`M0 441Q130 382 290 435Q460 363 650 439Q860 357 1030 432Q1200 386 1330 453Q1440 359 1620 433Q1790 370 ${viewWidth} 437V560H0Z`, '#b6c4be')}${path(`M0 507Q220 466 420 505T820 510T1220 500T1620 500T2020 498V557H0Z`, '#afbeb7')}</g>
      <g id="sw-world">${Array.from({ length: days }, (_, i) => house(i + 1)).join('')}</g>
      ${rect(0, 553, viewWidth, 76, '#d8d4c6')}${rect(0, 626, viewWidth, 10, '#ece7da')}${rect(0, 636, viewWidth, 88, '#8f8d85')}${rect(0, 636, viewWidth, 5, '#73736c')}
      <g id="sw-pavement"></g>
      <g id="sw-walker"><g id="sw-facing">
        ${ellipse(-2, 32, 23, 4, '#73736b', 'opacity=".6"')}${ellipse(57, 34, 25, 4, '#73736b', 'opacity=".5"')}
        <g id="sw-person">
          <g id="sw-leg-left">${path('M-8 1h8l-2 29h-8Z', '#26374f')}${path('M-10 27h11l5 4q0 4 -16 3Z', '#222b35')}</g>
          <g id="sw-leg-right">${path('M1 1h8l3 29H2Z', '#344363')}${path('M2 28h10l7 3q1 4 -17 3Z', '#222b35')}</g>
          ${path('M-9 -39l15 -2 9 45h-28Z', '#2e3f61')}${path('M-4 -40l7 1 -4 14Z', '#d8b975')}
          ${ellipse(0, -56, 12, 15, '#ddbc8b')}${path('M7 -60l10 8 -8 3Z', '#ddbc8b')}${path('M-12 -63l-3 14 6 3 1 -12Z', '#826944')}${ellipse(7, -57, 1.5, 1.5, '#394042')}
          ${path('M-15 -67q5 -12 27 -4l1 9h-29Z', '#334c76')}${ellipse(-1, -66, 3, 3, '#d9b66d')}${path('M-17 -62h33l7 3h-36Z', '#263f63')}
          ${line(-9, -35, 13, -12, '#b2945f', 3)}${rect(1, -20, 25, 19, '#aa8247', 'rx="3"')}${rect(6, -25, 13, 8, 'none', 'rx="3" stroke="#aa8247" stroke-width="4"')}${ellipse(13, -11, 2, 2, '#e8c777')}
          <g id="sw-arm">${path('M6 -32l7 3 5 20 -8 2Z', '#2e3f61')}${ellipse(15, -8, 5, 5, '#ddbc8b')}</g>
          ${ellipse(0, -25, 1.5, 1.5, '#d9bc78')}${ellipse(2, -16, 1.5, 1.5, '#d9bc78')}
          <g id="sw-umbrella" visibility="hidden">${line(-3, -32, -3, -114, '#5b6258', 3)}${path('M-44 -98Q-6 -142 37 -98q-12 -7 -21 1q-12 -9 -22 0q-12 -8 -20 0q-10 -8 -18 -1Z', '#b95444')}</g>
        </g>
        <path id="sw-leash" d="M15 -8Q39 5 44 3" fill="none" stroke="#735f46" stroke-width="2"/>
        <g id="sw-dog">
          <g id="sw-dog-back-legs">${line(46, 15, 43, 31, '#ac7e46', 5)}${line(68, 15, 70, 31, '#ac7e46', 5)}</g>
          ${rect(36, -4, 40, 21, '#bc8d51', 'rx="8"')}${path('M71 1q16 -2 13 -18', 'none', 'stroke="#bc8d51" stroke-width="5" stroke-linecap="round"')}
          <g id="sw-dog-front-legs">${line(41, 14, 42, 32, '#c1975e', 5)}${line(64, 14, 61, 32, '#c1975e', 5)}</g>
          ${path('M43 6L39 -13Q32 -22 22 -14L19 -5q2 7 17 5l2 9Z', '#c1975e')}${ellipse(37, -11, 5, 9, '#805a36')}${ellipse(21, -10, 2.5, 3, '#3f3f32')}${ellipse(29, -13, 1.5, 1.5, '#3f3f32')}${line(39, -1, 44, 3, '#aa5341', 3)}
        </g>
      </g></g>
      <g id="sw-weather" pointer-events="none"></g><g id="sw-date" aria-hidden="true">${digitalDate()}</g>`;
    refs = Object.fromEntries(['world', 'walker', 'facing', 'person', 'dog', 'leash', 'leg-left', 'leg-right', 'dog-back-legs', 'dog-front-legs', 'umbrella', 'weather', 'pavement', 'date'].map(id => [id, svg.querySelector(`#sw-${id}`)]));
    let pavement = '';
    for (let x = -78; x < viewWidth + 80; x += 78) pavement += line(x, 556, x, 624, '#c2c0b3', 2.5);
    for (let x = -20; x < viewWidth + 232; x += 232) pavement += path(`M${x} 678h62`, 'none', 'stroke="#eeece1" stroke-width="6" stroke-linecap="round"');
    refs.pavement.innerHTML = pavement;
    setWeather(rainy);
  }
  let refs = {};
  function setWeather(value) {
    rainy = value;
    root.querySelector('[data-street-action="weather"]').setAttribute('aria-label', rainy ? 'Switch to sunny weather' : 'Switch to rainy weather');
    refs.umbrella.setAttribute('visibility', rainy ? 'visible' : 'hidden');
    if (rainy) {
      let drops = rect(0, 0, viewWidth, 724, '#415778', 'opacity=".23"');
      for (let i = 0; i < 85; i++) {
        const x = (i * 271.7) % (viewWidth + 80), y = (i * 113.3) % 820 - 50;
        drops += `<path class="sw-drop" d="M${x} ${y}l-6 21" stroke="#7189a7" stroke-width="2" opacity=".55"/>`;
      }
      refs.weather.innerHTML = drops;
    } else {
      let leaves = '';
      for (let i = 0; i < 9; i++) leaves += ellipse((i * 271 + 50) % viewWidth, (i * 139 + 20) % 530, 6, 3, '#ba7843', 'class="sw-leaf"');
      refs.weather.innerHTML = leaves;
    }
    wake();
  }
  function resize() {
    viewWidth = Math.max(850, frame.clientWidth / Math.max(1, frame.clientHeight) * 724);
    svg.setAttribute('viewBox', `0 0 ${viewWidth} 724`);
    cameraTarget = clamp(position - viewWidth / 2, -45, days * step - viewWidth + 45);
    camera = cameraTarget;
    build();
    wake();
  }
  function walkTo(day) {
    selected = clamp(day, 1, days);
    destination = doorPosition(selected);
    if (destination !== position) direction = destination > position ? 1 : -1;
    walking = destination !== position;
    svg.querySelectorAll('.sw-house').forEach(el => el.setAttribute('aria-current', String(Number(el.dataset.day) === selected)));
    refs.date.innerHTML = digitalDate();
    status.textContent = `Walking to house ${selected}.`;
    if (motion.matches) { position = destination; walking = false; arrived(); }
    cameraTarget = clamp(destination - viewWidth / 2, -45, days * step - viewWidth + 45);
    wake();
  }
  function arrived() { status.textContent = `Arrived at house ${selected}.`; }
  function render(time) {
    animation = 0;
    if (hidden || !inView || document.hidden) { lastTime = 0; return; }
    const dt = Math.min((time - (lastTime || time)) / 1000, .05);
    lastTime = time;
    if (walking) {
      const delta = destination - position;
      const travel = Math.min(Math.abs(delta), dt * 185);
      position += Math.sign(delta) * travel;
      phase += dt * 11;
      if (Math.abs(destination - position) < .2) { position = destination; walking = false; arrived(); }
      // Keep the pair on screen throughout long trips, then settle at the door.
      cameraTarget = clamp(position - viewWidth / 2, -45, days * step - viewWidth + 45);
    }
    camera += (cameraTarget - camera) * (motion.matches ? 1 : 1 - Math.exp(-dt * 5));
    refs.world.setAttribute('transform', `translate(${-camera} 0)`);
    refs.pavement.setAttribute('transform', `translate(${-((camera % 78) + 78) % 78} 0)`);
    refs.walker.setAttribute('transform', `translate(${position - camera} 557)`);
    refs.facing.setAttribute('transform', `scale(${direction} 1)`);
    const gait = walking && !motion.matches ? Math.sin(phase) : 0;
    refs.person.setAttribute('transform', `translate(0 ${-Math.abs(gait) * 1.5})`);
    refs['leg-left'].setAttribute('transform', `rotate(${gait * 19} -4 2)`);
    refs['leg-right'].setAttribute('transform', `rotate(${-gait * 19} 5 2)`);
    refs.dog.setAttribute('transform', `translate(0 ${walking ? -Math.abs(Math.cos(phase)) * 2 : 0})`);
    refs['dog-back-legs'].setAttribute('transform', `translate(${gait * 4} 0)`);
    refs['dog-front-legs'].setAttribute('transform', `translate(${-gait * 4} 0)`);
    refs.leash.setAttribute('d', `M15 ${-8 - Math.abs(gait)}Q35 ${9 + gait * 2} 42 1`);
    if (!motion.matches) {
      if (rainy) refs.weather.querySelectorAll('.sw-drop').forEach((el, i) => el.setAttribute('transform', `translate(${-((time * .07 + i * 7) % 60)} ${(time * .3 + i * 11) % 100})`));
      else refs.weather.querySelectorAll('.sw-leaf').forEach((el, i) => el.setAttribute('transform', `translate(${Math.sin(time / 2400 + i) * 25} ${(time / 40 + i * 40) % 180})`));
    }
    if (!motion.matches || walking || Math.abs(camera - cameraTarget) > .1) animation = requestAnimationFrame(render);
    else lastTime = 0;
  }
  function wake() { if (!animation && !hidden && inView && !document.hidden) animation = requestAnimationFrame(render); }
  function expand(value) {
    const isExpanded = root.classList.contains('is-expanded');
    if (value === isExpanded) return;
    root.classList.toggle('is-expanded', value);
    const button = root.querySelector('[data-street-action="expand"]');
    button.setAttribute('aria-expanded', String(value));
    button.setAttribute('aria-label', value ? 'Reduce street view' : 'Expand street view');
    if (value) {
      focusBeforeExpand = document.activeElement;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.querySelector('[data-street-action="close"]').focus();
    } else {
      document.body.style.overflow = previousOverflow;
      root.removeAttribute('role');
      root.removeAttribute('aria-modal');
      if (focusBeforeExpand) focusBeforeExpand.focus();
    }
    resize();
  }
  svg.addEventListener('click', event => { const h = event.target.closest('[data-day]'); if (h) walkTo(Number(h.dataset.day)); });
  svg.addEventListener('keydown', event => {
    const h = event.target.closest('[data-day]');
    if (h && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); walkTo(Number(h.dataset.day)); }
    if (h && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      const day = clamp(Number(h.dataset.day) + (event.key === 'ArrowRight' ? 1 : -1), 1, days);
      svg.querySelector(`[data-day="${day}"]`).focus({ preventScroll: true });
      cameraTarget = clamp((day - 1) * step + 155 - viewWidth / 2, -45, days * step - viewWidth + 45);
      wake();
    }
  });
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-street-action]');
    if (!button) return;
    switch (button.dataset.streetAction) {
      case 'weather': setWeather(!rainy); break;
      case 'today': walkTo(today); break;
      case 'expand': expand(!root.classList.contains('is-expanded')); break;
      case 'prev': case 'next':
        cameraTarget = clamp(cameraTarget + (button.dataset.streetAction === 'prev' ? -1 : 1) * step * 3, -45, days * step - viewWidth + 45); wake(); break;
      case 'close':
        if (root.classList.contains('is-expanded')) expand(false);
        else {
          hidden = true;
          frame.hidden = true;
          root.querySelector('.street-walk__caption').hidden = true;
          root.querySelector('.street-walk__hint').hidden = true;
          root.querySelector('.street-walk__reopen').hidden = false;
          root.querySelector('.street-walk__reopen').focus();
        }
        break;
      case 'open':
        hidden = false;
        frame.hidden = false;
        root.querySelector('.street-walk__caption').hidden = false;
        root.querySelector('.street-walk__hint').hidden = false;
        button.hidden = true;
        resize(); root.querySelector('[data-street-action="expand"]').focus(); break;
    }
  });
  document.addEventListener('keydown', event => {
    if (!root.classList.contains('is-expanded')) return;
    if (event.key === 'Escape') expand(false);
    if (event.key === 'Tab') {
      const focusable = [...root.querySelectorAll('button:not([hidden]), [tabindex="0"]')].filter(el => el.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('visibilitychange', wake);
  // Refresh at the next visit/visibility change, including a month boundary.
  document.addEventListener('visibilitychange', () => {
    const now = new Date();
    if (!document.hidden && now.toDateString() !== date.toDateString()) {
      date = now; today = date.getDate();
      days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      selected = 1; position = destination = doorPosition(1); walking = false; resize();
    }
  });
  new ResizeObserver(() => { if (!hidden) resize(); }).observe(frame);
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting; if (inView) wake(); }, { rootMargin: '100px' }).observe(root);
  motion.addEventListener('change', wake);
  resize();
})();
