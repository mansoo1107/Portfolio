/* =========================================================
 * 跑地图：整站横向长卷，Mae 固定在屏幕上随滚动奔跑
 * 素材：assets/mae/ 手绘 PNG（idle / walk1-6 / star / back / sit），
 *       缺失时自动回退到代码画的线条猫 SVG。
 * ========================================================= */
(function () {
  var hero = document.getElementById('hero');
  if (!hero) return;
  var maeEl = document.getElementById('mae'),
      maeIn = maeEl.querySelector('.mae-in'),
      sayEl = document.getElementById('say'),
      heroTitle = document.querySelector('.hero-title');

  /* ---------- 星空与树林（森林段） ---------- */
  var stars = hero.querySelector('.stars'), i;
  for (i = 0; i < 44; i++) {
    var s = document.createElement('i');
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 60 + '%';
    s.style.animationDelay = (Math.random() * 4).toFixed(1) + 's';
    s.style.animationDuration = (2.5 + Math.random() * 3).toFixed(1) + 's';
    stars.appendChild(s);
  }
  [80, 300, 620, 800, 1150, 1330, 1620, 1780, 1950, 2230].forEach(function (tx, n) {
    var t = document.createElement('div');
    t.className = 'tree t' + (n % 3 + 1);
    t.style.left = tx + 'px';
    hero.appendChild(t);
  });

  /* ---------- Mae 素材：手绘 PNG 优先，SVG 兜底 ---------- */
  var V = '?v=4'; // 素材版本号：重新提取后 +1，强制浏览器更新缓存
  var PNG = {
    idle: 'assets/mae/idle.png' + V,
    star: 'assets/mae/star.png' + V,
    back: 'assets/mae/back.png' + V,
    sit: 'assets/mae/crouch1.png' + V,
    walk: ['assets/mae/walk1.png' + V, 'assets/mae/walk2.png' + V, 'assets/mae/walk3.png' + V,
           'assets/mae/walk4.png' + V, 'assets/mae/walk5.png' + V, 'assets/mae/walk6.png' + V],
  };
  function svgCat(l1, l2) {
    return '<svg viewBox="0 0 80 90" fill="none" stroke="#efe9db" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="M30 52 Q26 30 40 26 Q54 30 50 52 Z"/>'
      + '<path d="M28 26 L24 12 L36 20 Z"/><path d="M52 26 L56 12 L44 20 Z"/>'
      + '<circle cx="34" cy="24" r="2.4" fill="#f2c230" stroke="none"/>'
      + '<circle cx="46" cy="24" r="2.4" fill="#f2c230" stroke="none"/>'
      + '<path d="M50 46 Q66 44 62 28"/>'
      + '<path d="M34 52 ' + l1 + '"/><path d="M46 52 ' + l2 + '"/></svg>';
  }
  var SVG_IDLE = svgCat('L34 66', 'L46 66'),
      SVG_W1 = svgCat('L30 66', 'L50 64'),
      SVG_W2 = svgCat('L38 66', 'L42 64');

  var imgMode = false, maeImg = null, lastSvg = null;
  function setFrame(f) {
    if (imgMode) {
      if (!maeImg) { maeImg = document.createElement('img'); maeImg.alt = 'Mae'; maeIn.innerHTML = ''; maeIn.appendChild(maeImg); }
      if (maeImg.getAttribute('src') !== f) maeImg.src = f;
    } else if (lastSvg !== f) {
      maeIn.innerHTML = f; lastSvg = f;
    }
  }
  function walkFrame(n) { return imgMode ? PNG.walk[n] : (n % 2 ? SVG_W2 : SVG_W1); }
  function idleFrame() { return imgMode ? PNG.idle : SVG_IDLE; }

  var probe = new Image();
  probe.onload = function () {
    imgMode = true;
    [PNG.idle, PNG.star, PNG.back, PNG.sit].concat(PNG.walk).forEach(function (u) { new Image().src = u; });
    setFrame(PNG.idle);
  };
  probe.src = PNG.idle;

  /* ---------- 互动物件（森林段） ---------- */
  var objs = Array.prototype.map.call(document.querySelectorAll('.obj'), function (el) {
    var o = { el: el, x: +el.dataset.x };
    el.style.left = o.x + 'px';
    el.addEventListener('pointerdown', function (e) { e.preventDefault(); trigger(o); });
    return o;
  });

  function trigger(o) {
    var id = o.el.id;
    if (id === 'obj-neon') {
      say(o.el.classList.toggle('lit') ? '看，她的名字会发光。' : '灯先留着吧，省电。');
    } else if (id === 'obj-fire') {
      if (!o.el.classList.contains('lit')) {
        o.el.classList.add('lit');
        fireflies(o.x);
        say('篝火暖起来了，故事也快开始了。');
      }
    } else if (id === 'obj-star') {
      shoot();
      if (imgMode) { specialPose(PNG.star, 2400); }
      say('今晚的星星，也在跟你打招呼。');
    } else if (id === 'obj-door') {
      if (imgMode) { specialPose(PNG.back, 1500); }
      say('走，带她走出森林——');
      setTimeout(function () {
        var first = document.getElementById('p-lintong');
        if (first) scrollTo({ left: first.offsetLeft, behavior: 'smooth' });
      }, 700);
    }
  }

  var specialTimer = null;
  function specialPose(src, ms) {
    setFrame(src);
    clearTimeout(specialTimer);
    specialTimer = setTimeout(function () { setFrame(idleFrame()); }, ms);
  }

  var sayTimer = null;
  function say(text) {
    sayEl.textContent = 'Mae：' + text;
    sayEl.hidden = false;
    clearTimeout(sayTimer);
    sayTimer = setTimeout(function () { sayEl.hidden = true; }, 3600);
  }

  function fireflies(ox) {
    for (var n = 0; n < 10; n++) {
      var f = document.createElement('i');
      f.className = 'firefly';
      f.style.left = (ox - 60 + Math.random() * 120) + 'px';
      f.style.bottom = (16 + Math.random() * 14) + '%';
      f.style.animationDelay = (Math.random() * 2).toFixed(1) + 's';
      hero.appendChild(f);
    }
  }
  function shoot() {
    var st = document.createElement('i');
    st.className = 'shooting';
    st.style.top = (6 + Math.random() * 20) + 'vh';
    hero.appendChild(st);
    st.addEventListener('animationend', function () { st.remove(); });
  }

  /* ---------- 物件靠近提示（Mae 固定在 left:30vw 处） ---------- */
  function checkNear() {
    var mx = scrollX + innerWidth * 0.3 + 40, best = null, bd = 1e9;
    objs.forEach(function (o) {
      var d = Math.abs(mx - o.x);
      if (d < bd) { bd = d; best = o; }
    });
    objs.forEach(function (o) { o.el.classList.toggle('near', o === best && bd < 170); });
  }

  /* ---------- 驻足判断：视口中心是否停在某个项目面板 ---------- */
  function atProject() {
    var panels = document.querySelectorAll('.panel.proj'),
        mid = scrollX + innerWidth * 0.5;
    for (var k = 0; k < panels.length; k++) {
      var p = panels[k];
      if (mid >= p.offsetLeft && mid <= p.offsetLeft + p.offsetWidth) return true;
    }
    return false;
  }

  /* ---------- 滚动驱动：Mae 跑地图 ---------- */
  var face = 1, frameN = 0, distAcc = 0, lastX = scrollX,
      stopTimer = null, sitTimer = null, started = false;

  function firstMove() {
    if (!started) {
      started = true;
      heroTitle.classList.add('dim');
      say('跟我来，往右跑。');
    }
  }

  addEventListener('scroll', function () {
    var sx = scrollX, dx = sx - lastX; lastX = sx;
    if (Math.abs(dx) < 0.5) return;
    face = dx > 0 ? 1 : -1;
    maeIn.style.transform = 'scaleX(' + face + ')';
    firstMove();
    distAcc += Math.abs(dx);
    if (distAcc > 26) { distAcc = 0; frameN = (frameN + 1) % 6; setFrame(walkFrame(frameN)); }
    clearTimeout(stopTimer);
    clearTimeout(sitTimer);
    stopTimer = setTimeout(function () { setFrame(idleFrame()); }, 170);
    // 驻足：停在项目面板前约 1 秒，Mae 坐下来看作品
    sitTimer = setTimeout(function () {
      if (imgMode && atProject()) setFrame(PNG.sit);
    }, 1000);
    checkNear();
  }, { passive: true });

  /* ---------- 滚轮纵转横（带滑行，目标限幅 ±700px） ---------- */
  var target = null, gliding = false;
  function glide() {
    if (target === null) { gliding = false; return; }
    gliding = true;
    var d = target - scrollX;
    if (Math.abs(d) < 1) { target = null; gliding = false; return; }
    scrollTo({ left: scrollX + d * 0.18, behavior: 'instant' });
    requestAnimationFrame(glide);
  }
  addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      if (target === null) target = scrollX;
      target = Math.max(scrollX - 700, Math.min(scrollX + 700, target + e.deltaY));
      target = Math.max(0, target);
      if (!gliding) requestAnimationFrame(glide);
    }
  }, { passive: false });

  /* ---------- 键盘辅助（← → 浏览器原生横滚；A/D 手动） ---------- */
  function typing(e) { return e.target && /INPUT|TEXTAREA/.test(e.target.tagName); }
  addEventListener('keydown', function (e) {
    if (typing(e)) return;
    target = null;
    var k = e.key.toLowerCase();
    if (k === 'a') scrollBy(-90, 0);
    if (k === 'd') scrollBy(90, 0);
  });
  addEventListener('touchstart', function () { target = null; }, { passive: true });
  // 点击页面任意处 = 暂停滑行（暂停权交给用户）
  addEventListener('pointerdown', function () { target = null; }, { passive: true });

  /* ---------- 首次素材 ---------- */
  setFrame(SVG_IDLE);
  checkNear();
})();
