/**
 * theme-init - 最初の描画の前にテーマを決める。<head> で同期読み込みする。
 *
 * style.css の既定はライトで、ダークは <html> の dark-mode クラスで切り替える。
 * この判定を </body> 直前の script.js で行うと、ライトで描いたあとにダークへ
 * 切り替わって見える（保存した人だけに起きる）。
 *
 * 保存した選択（localStorage の darkMode が 'true' または 'false'）だけを使う。
 * 保存がなければライトのまま（OS の設定には従わない）。
 * localStorage が読めない環境でも落ちないよう try/catch で囲む。
 */
(function (global) {
  'use strict';

  try {
    var savedDarkMode = global.localStorage.getItem('darkMode');
    if (savedDarkMode === 'true' || savedDarkMode === 'false') {
      global.document.documentElement.classList.toggle('dark-mode', savedDarkMode === 'true');
    }
  } catch (e) {
    // Storage is optional: the page stays light without persistence.
  }
})(typeof window !== 'undefined' ? window : globalThis);
