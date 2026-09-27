/*
 * Language selection and DOM translation.
 * The dictionary itself lives in cdn-messages.js; only the choice of language lives here,
 * so script.js keeps its two localStorage accesses for the theme alone.
 * apply() overwrites textContent and attributes unconditionally, so anything whose text or
 * attribute depends on interactive state stays out of data-i18n and is rebuilt by script.js
 * on the language-change event instead.
 */
const CdnI18n = (() => {
  'use strict';

  const STORAGE_KEY = 'cdn-trainer-language';
  const ATTRIBUTES = Object.freeze(['aria-label', 'title', 'placeholder', 'alt']);
  const EVENT = 'language-change';

  function isLanguage(value) {
    return CdnMessages.LANGUAGES.includes(value);
  }

  function readLanguage() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return isLanguage(value) ? value : null;
    } catch {
      // Storage is optional: the toggle still works without persistence.
      return null;
    }
  }

  function writeLanguage(value) {
    if (!isLanguage(value)) return;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Language changes still work if storage access is denied.
    }
  }

  function initialLanguage(search = '', navigatorLanguage = '') {
    const requested = new URLSearchParams(String(search).replace(/^\?/, '')).get('lang');
    if (isLanguage(requested)) return requested;
    return readLanguage() ?? (String(navigatorLanguage).toLowerCase().startsWith('ja') ? 'ja' : 'en');
  }

  function translate(root = document) {
    for (const node of root.querySelectorAll('[data-i18n]')) {
      node.textContent = CdnMessages.t(node.dataset.i18n);
    }
    for (const attribute of ATTRIBUTES) {
      for (const node of root.querySelectorAll(`[data-i18n-${attribute}]`)) {
        node.setAttribute(attribute, CdnMessages.t(node.getAttribute(`data-i18n-${attribute}`)));
      }
    }
  }

  // Changes the language in place: form controls, scroll offsets and open panels are untouched.
  function apply(value) {
    CdnMessages.setLanguage(value);
    document.documentElement.lang = value;
    translate();
    document.dispatchEvent(new Event(EVENT));
  }

  function setLanguage(value) {
    apply(value);
    writeLanguage(value);
  }

  function toggle() {
    setLanguage(CdnMessages.getLanguage() === 'ja' ? 'en' : 'ja');
  }

  // Called before the first render so that generated text starts in the right language.
  function init(search = location.search, navigatorLanguage = navigator.language) {
    apply(initialLanguage(search, navigatorLanguage));
    return CdnMessages.getLanguage();
  }

  return Object.freeze({
    STORAGE_KEY, EVENT, ATTRIBUTES,
    readLanguage, writeLanguage, initialLanguage, translate, apply, setLanguage, toggle, init
  });
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CdnI18n;
}
