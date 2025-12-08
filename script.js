// ================================
// Haichii LP - script.js (final)
// ================================

// 1) 年号（存在チェック込み）
(() => {
  const y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
})();

// 2) スムーススクロール（固定ヘッダー分オフセット対応）
(() => {
  const header = document.querySelector('.header');
  const headerH = () => (header ? parseFloat(getComputedStyle(header).height) || 0 : 0);

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const tgt = document.querySelector(id);
      if (!tgt) return;

      e.preventDefault();
      const top = tgt.getBoundingClientRect().top + window.scrollY - headerH() - 8;
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });
})();

// 3) スクロールリビール（IntersectionObserver）
(() => {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    targets.forEach(el => io.observe(el));
  } else {
    targets.forEach(el => el.classList.add('is-visible'));
  }
})();

// 4) ヘッダーナビ：ハンバーガー開閉（属性駆動 + 外側クリック/ESC）
(() => {
  const ham = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav');
  if (!ham || !nav) return;

  // 初期属性
  ham.setAttribute('aria-controls', 'site-nav');
  ham.setAttribute('aria-expanded', 'false');

  // CSSと合わせて 1080px をブレークポイントに統一
  const mq = window.matchMedia('(min-width:1080px)');

  const open = () => {
    nav.style.display = 'flex';
    ham.setAttribute('aria-expanded', 'true');
  };
  const close = () => {
    nav.style.display = 'none';
    ham.setAttribute('aria-expanded', 'false');
  };
  const isOpen = () => ham.getAttribute('aria-expanded') === 'true';

  ham.addEventListener('click', () => (isOpen() ? close() : open()));

  // 画面幅がデスクトップに戻ったらインラインstyleをリセット
  const syncDisplay = () => {
    if (mq.matches) {
      nav.style.display = ''; // デスクトップはCSSに委譲
      ham.setAttribute('aria-expanded', 'false');
    } else {
      // モバイルは初期閉
      nav.style.display = 'none';
    }
  };
  mq.addEventListener ? mq.addEventListener('change', syncDisplay) : mq.addListener(syncDisplay);
  syncDisplay();

  // 外側クリックで閉じる
  document.addEventListener('click', (e) => {
    if (!isOpen()) return;
    if (!e.target.closest('.nav, .hamburger')) close();
  });

  // Escキーで閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) close();
  });

  // モバイル時：ナビ内リンクを押したら閉じる
  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    if (!mq.matches) close();
  });

  // ×マークで閉じる
  const closeBtn = document.querySelector('.nav__close');
  if (closeBtn) {
    closeBtn.addEventListener('click', close);
  }
})();

// 5) Before/After スライダー（ドラッグ/スワイプ/キー対応 + ヒント自動非表示）
(() => {
  const ba = document.querySelector('.ba');
  if (!ba) return;

  const after  = ba.querySelector('.ba__after');
  const handle = ba.querySelector('.ba__handle span') || ba.querySelector('.ba__handle');
  const hint   = ba.querySelector('.ba__hint');
  if (!after || !handle) return;

  // a11y
  ba.setAttribute('tabindex', '0');
  ba.setAttribute('role', 'slider');
  ba.setAttribute('aria-valuemin', '0');
  ba.setAttribute('aria-valuemax', '100');
  ba.setAttribute('aria-label', 'Before / After 比較スライダー');

  const setSplit = (ratio) => {
    const r = Math.max(0.03, Math.min(0.97, ratio)); // 端の余白
    after.style.clipPath = `inset(0 0 0 ${r * 100}%)`;
    handle.style.left = `${r * 100}%`;
    ba.setAttribute('aria-valuenow', String(Math.round(r * 100)));
  };

  const setPos = (clientX) => {
    const rect = ba.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    setSplit(x);
  };

  // 初期位置（中央）
  requestAnimationFrame(() => {
    const rect = ba.getBoundingClientRect();
    setPos(rect.left + rect.width / 2);
  });

  let dragging = false;
  let touchStartX = 0;
  let isTouch = false;

  const hideHint = () => { 
    if (hint) {
      // スマホ版ではヒントを非表示にしない
      const isMobile = window.matchMedia('(max-width: 640px)').matches;
      if (!isMobile) {
        hint.style.display = 'none';
      }
    }
  };

  // タッチイベント（スマホ最適化）
  ba.addEventListener('touchstart', (e) => {
    isTouch = true;
    dragging = true;
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    setPos(touch.clientX);
    hideHint();
    e.preventDefault(); // スクロールを防ぐ
  }, { passive: false });

  ba.addEventListener('touchmove', (e) => {
    if (dragging && isTouch) {
      const touch = e.touches[0];
      setPos(touch.clientX);
      e.preventDefault(); // スクロールを防ぐ
    }
  }, { passive: false });

  ba.addEventListener('touchend', (e) => {
    if (isTouch) {
      dragging = false;
      isTouch = false;
    }
  }, { passive: true });

  ba.addEventListener('touchcancel', (e) => {
    if (isTouch) {
      dragging = false;
      isTouch = false;
    }
  }, { passive: true });

  // ポインターイベント（マウス・ペン対応）
  ba.addEventListener('pointerdown', (e) => {
    if (isTouch) return; // タッチイベントが優先
    dragging = true;
    ba.setPointerCapture && ba.setPointerCapture(e.pointerId);
    setPos(e.clientX);
    hideHint();
  });

  ba.addEventListener('pointermove', (e) => {
    if (isTouch) return; // タッチイベントが優先
    if (dragging) {
      setPos(e.clientX);
    } else if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      // ホバー可能環境ではマウス追従の微調整（好みでオフ可）
      setPos(e.clientX);
    }
  });

  const stopDrag = () => { 
    if (!isTouch) {
      dragging = false;
    }
  };
  ba.addEventListener('pointerup', stopDrag);
  ba.addEventListener('pointercancel', stopDrag);

  // クリックでジャンプ（タッチイベントの後に処理）
  ba.addEventListener('click', (e) => {
    if (isTouch) return; // タッチイベントの場合はクリックを無視
    setPos(e.clientX); 
    hideHint(); 
  });

  // キーボード操作 ← → / Home / End
  ba.addEventListener('keydown', (e) => {
    const m = after.style.clipPath.match(/inset\(0 0 0 ([\d.]+)%\)/);
    let r = m ? parseFloat(m[1]) / 100 : 0.5;
    const step = e.shiftKey ? 0.10 : 0.05;
    if (e.key === 'ArrowLeft')  r = Math.max(0, r - step);
    if (e.key === 'ArrowRight') r = Math.min(1, r + step);
    if (e.key === 'Home')       r = 0;
    if (e.key === 'End')        r = 1;
    setSplit(r);
    hideHint();
  });

  // リサイズで割合維持
  window.addEventListener('resize', () => {
    const m = after.style.clipPath.match(/inset\(0 0 0 ([\d.]+)%\)/);
    const r = m ? parseFloat(m[1]) / 100 : 0.5;
    setSplit(r);
  }, { passive: true });

  // 放置でもヒント自動非表示（スマホ版では無効）
  if (hint) {
    const isMobile = window.matchMedia('(max-width: 640px)').matches;
    if (!isMobile) {
      setTimeout(hideHint, 12000);
    }
  }
})();

// 6) ヒーローを過ぎたらヘッダーにガラス背景を付与
(() => {
  const header = document.querySelector('.header');
  const hero   = document.querySelector('.hero');
  if (!header || !hero) return;

  const headerH = () => parseFloat(getComputedStyle(header).height) || 80;

  const setGlass = () => {
    const heroBottom = hero.getBoundingClientRect().bottom;
    const pastHero   = heroBottom <= headerH();
    header.classList.toggle('header--glass', pastHero);
  };

  setGlass(); // 初期チェック
  window.addEventListener('scroll', setGlass, { passive: true });
  window.addEventListener('resize', setGlass);
})();

// =========================================================
// 成果セクションスライダー（スマホ版）
// =========================================================
(function() {
  const track = document.getElementById('results-slider-track');
  const prevBtn = document.getElementById('results-prev');
  const nextBtn = document.getElementById('results-next');
  const dotsContainer = document.getElementById('results-dots');
  
  if (!track || !prevBtn || !nextBtn || !dotsContainer) return;
  
  let currentSlide = 0;
  const totalSlides = 4;
  
  // ドットを生成
  function createDots() {
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement('div');
      dot.className = 'slider__dot';
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    }
  }
  
  // スライドを移動
  function goToSlide(slideIndex) {
    currentSlide = slideIndex;
    const translateX = -slideIndex * 25; // 25%ずつ移動
    track.style.transform = `translateX(${translateX}%)`;
    
    // ドットの状態を更新
    const dots = dotsContainer.querySelectorAll('.slider__dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === slideIndex);
    });
    
    // ボタンの状態を更新
    prevBtn.disabled = slideIndex === 0;
    nextBtn.disabled = slideIndex === totalSlides - 1;
  }
  
  // 前のスライド
  function prevSlide() {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }
  
  // 次のスライド
  function nextSlide() {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    }
  }
  
  // イベントリスナーを追加
  prevBtn.addEventListener('click', prevSlide);
  nextBtn.addEventListener('click', nextSlide);
  
  // 初期化
  createDots();
  goToSlide(0);
  
  // 自動スライド機能（3秒間隔）
  let autoSlideInterval = setInterval(() => {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    } else {
      goToSlide(0); // 最後のスライドの後は最初に戻る
    }
  }, 3000);
  
  // ページが非表示になったら自動スライドを停止
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(autoSlideInterval);
    } else {
      autoSlideInterval = setInterval(() => {
        if (currentSlide < totalSlides - 1) {
          goToSlide(currentSlide + 1);
        } else {
          goToSlide(0);
        }
      }, 3000);
    }
  });
  
  // タッチスワイプ対応
  let startX = 0;
  let startY = 0;
  let isDragging = false;
  
  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
  });
  
  track.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
  });
  
  track.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = startX - endX;
    const diffY = startY - endY;
    
    // 横スワイプが縦スワイプより大きい場合のみ処理
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        nextSlide(); // 左にスワイプ = 次のスライド
      } else {
        prevSlide(); // 右にスワイプ = 前のスライド
      }
    }
  });
})();


