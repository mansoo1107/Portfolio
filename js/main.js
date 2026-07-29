/* =========================================================
 * 站点渲染与交互（内容来自 js/content.js，便签来自 js/notes.js）
 * 横向跑地图版 + 猫爪光标 + 爪印 + 迷你地图
 * ========================================================= */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  // 列表图：assets/web/pN.jpg（优化版）；字符串路径直接用
  function src(p) { return typeof p === 'number' ? 'assets/web/p' + p + '.jpg' : p; }
  // 放大原图：localFull 里的页码用本地派生版（已打码/处理），其余用远程图床
  function full(p) {
    if (typeof p !== 'number') return p.replace('assets/web/', 'assets/derived/');
    return SITE.localFull.indexOf(p) > -1 ? 'assets/derived/p' + p + '.jpg'
                                          : SITE.imgBase + '排版' + p + '.jpg';
  }

  /* ---------- 作品板块（渲染为地图面板） ---------- */
  $('#project-list').innerHTML = PROJECTS.map(function (p) {
    return '<section class="panel paper proj reveal" id="p-' + p.id + '">'
      + '<header><span class="num">' + p.num + '</span>'
      + '<div><h3>' + p.title + '</h3><p class="sub">' + p.sub + '</p></div></header>'
      + '<p class="bubble"><b>Mae 说</b>' + p.narration + '</p>'
      + '<div class="shots">' + p.pages.map(function (pg) {
          return '<figure><img loading="lazy" src="' + src(pg) + '" alt="' + p.title + '" data-full="' + full(pg) + '"></figure>';
        }).join('') + '</div></section>';
  }).join('');

  /* ---------- 手绘画廊 ---------- */
  $('#gallery-list').innerHTML = GALLERY.map(function (g) {
    return '<figure><img loading="lazy" src="' + src(g.img) + '" alt="' + g.label + '" data-full="' + full(g.img) + '">'
      + '<figcaption>' + g.label + '</figcaption></figure>';
  }).join('');

  /* ---------- 完整作品入口（GitHub 图床） ---------- */
  $('#pdf-link').href = SITE.gallery;

  /* ---------- 便签墙 ---------- */
  $('#notes-wall').innerHTML = NOTES.map(function (n) {
    return '<div class="note ' + n.color + '"><p>' + n.text + '</p><span>—— ' + n.name + '</span></div>';
  }).join('');

  /* ---------- 关于 ---------- */
  $('#about-tag').textContent = SITE.profile.tagline;
  $('#skills').innerHTML = SITE.profile.skills.map(function (s) {
    return '<div class="skill"><span>' + s[0] + '</span><div class="bar"><i style="--w:' + s[1] + '%"></i></div></div>';
  }).join('');

  /* ---------- 留言表单（Formspree，ID 未配置时显示“开通中”） ---------- */
  var form = $('#note-form');
  if (!SITE.formspreeId) {
    form.classList.add('off');
    form.insertAdjacentHTML('beforebegin', '<p class="form-off">留言板开通中，主人还在配置～</p>');
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!SITE.formspreeId) return;
    var btn = form.querySelector('button');
    btn.disabled = true;
    fetch('https://formspree.io/f/' + SITE.formspreeId, {
      method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' },
    }).then(function (r) {
      form.reset();
      toast(r.ok ? '便签已寄出！她精选后就会上墙～' : '寄送失败，稍后再试试');
    }).catch(function () {
      toast('网络开小差了，稍后再试试');
    }).finally(function () {
      btn.disabled = false;
    });
  });
  var toastTimer;
  function toast(t) {
    var el = $('#board-toast');
    if (!el) { el = document.createElement('p'); el.id = 'board-toast'; document.body.appendChild(el); }
    el.textContent = t;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 3200);
  }

  /* ---------- 图片放大 ---------- */
  var lb = $('#lightbox'), lbImg = lb.querySelector('img');
  document.getElementById('map').addEventListener('click', function (e) {
    if (e.target.matches('figure img')) {
      lbImg.src = e.target.dataset.full || e.target.src;
      lb.hidden = false;
    }
  });
  lb.addEventListener('click', function () { lb.hidden = true; });

  /* ---------- 滚动显现（横向滚动同样触发） ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- 导航：跑过森林段再出现 ---------- */
  var nav = $('#nav');
  addEventListener('scroll', function () {
    nav.classList.toggle('show', scrollX > innerWidth * 0.7);
  }, { passive: true });

  /* ---------- 锚点直链：面板由 JS 渲染，渲染后再跳一次 ---------- */
  if (location.hash) {
    var target = document.querySelector(location.hash);
    if (target) {
      setTimeout(function () {
        scrollTo({ left: target.offsetLeft, behavior: 'instant' });
      }, 60);
    }
  }

  /* ---------- 迷你地图：整段旅程的进度条 ---------- */
  (function minimap() {
    var map = document.getElementById('map');
    var mini = document.createElement('div');
    mini.id = 'minimap';
    document.body.appendChild(mini);
    var total = map.scrollWidth;
    Array.prototype.forEach.call(map.querySelectorAll('.panel'), function (p) {
      var seg = document.createElement('div');
      seg.className = 'seg ' + (p.id === 'hero' || p.classList.contains('night') ? 'night'
                              : p.classList.contains('dawn') ? 'dawn' : 'paper');
      seg.style.width = (p.offsetWidth / total * 100) + '%';
      mini.appendChild(seg);
    });
    var dot = document.createElement('img');
    dot.src = 'assets/mae/face1.png?v=4'; // v=4 防浏览器缓存旧图
    dot.alt = '';
    mini.appendChild(dot);
    var max = total - innerWidth;
    function update() {
      dot.style.left = (max > 0 ? Math.min(1, scrollX / max) * 100 : 0) + '%';
    }
    addEventListener('scroll', update, { passive: true });
    update();
  })();

  /* ---------- 猫爪光标 + 点击爪印 ---------- */
  if (matchMedia('(hover:hover)').matches) {
    var paw = document.createElement('div');
    paw.id = 'paw';
    document.body.appendChild(paw);
    var mx = innerWidth / 2, my = innerHeight / 2, px = mx, py = my, rot = 0, down = false;
    addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
    (function follow() {
      requestAnimationFrame(follow);
      var dx = mx - px;
      px += dx * 0.22;
      py += (my - py) * 0.22;
      rot += (Math.max(-18, Math.min(18, dx * 1.2)) - rot) * 0.2;
      paw.style.left = (px - 4) + 'px';
      paw.style.top = (py - 2) + 'px';
      paw.style.transform = 'rotate(' + rot.toFixed(1) + 'deg)' + (down ? ' scale(.82)' : '');
    })();
    // 连续快速点击（700ms 内 3 次）→ 弹出 Mae 的表情并淡出
    var clicks = [], lastPop = 0;
    addEventListener('pointerdown', function (e) {
      down = true;
      if (e.target.closest('input,textarea,button,a,#lightbox')) return;
      var now = performance.now();
      clicks = clicks.filter(function (t) { return now - t < 700; });
      clicks.push(now);
      if (clicks.length >= 3 && now - lastPop > 1500) {
        lastPop = now;
        clicks = [];
        var mood = document.createElement('img');
        mood.className = 'mae-mood';
        mood.src = 'assets/mae/face' + (1 + Math.floor(Math.random() * 6)) + '.png?v=4';
        mood.alt = '';
        mood.style.left = (e.clientX - 36) + 'px';
        mood.style.top = (e.clientY - 84) + 'px';
        document.body.appendChild(mood);
        setTimeout(function () { mood.remove(); }, 1300);
      }
    });
    addEventListener('pointerup', function () { down = false; });
  }
})();
