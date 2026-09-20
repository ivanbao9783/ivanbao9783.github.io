// 知识星图交互：tooltip + 主题切换（羊皮纸 paper / 深空 space）
(function () {
  'use strict';

  var STORAGE_KEY = 'starmap-theme';
  var page = document.getElementById('starmap-page');
  var toggle = document.getElementById('starmap-theme-toggle');
  var tooltip = document.getElementById('starmap-tooltip');

  // 主题：localStorage 记忆 > 数据文件默认（初始 class 由 Liquid 输出）
  function setTheme(theme) {
    page.classList.remove('theme-paper', 'theme-space');
    page.classList.add('theme-' + theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* 隐私模式下忽略 */ }
  }
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'paper' || saved === 'space') setTheme(saved);
  } catch (e) { /* 忽略 */ }

  if (toggle) {
    toggle.addEventListener('click', function () {
      setTheme(page.classList.contains('theme-space') ? 'paper' : 'space');
    });
  }

  // tooltip：跟随鼠标，显示 领域名 · 所属星团 · N 篇博文
  if (tooltip) {
    document.querySelectorAll('.starmap-node').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        var count = el.getAttribute('data-posts') || '0';
        var word = count === '0' ? '暂无博文，规划中' : count + ' 篇博文';
        tooltip.textContent = el.getAttribute('data-title') + ' · ' + el.getAttribute('data-cluster') + ' · ' + word;
        tooltip.style.display = 'block';
      });
      el.addEventListener('mousemove', function (ev) {
        tooltip.style.left = (ev.clientX + 14) + 'px';
        tooltip.style.top = (ev.clientY + 14) + 'px';
      });
      el.addEventListener('mouseleave', function () {
        tooltip.style.display = 'none';
      });
    });
  }
})();
