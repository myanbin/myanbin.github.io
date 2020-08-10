/**
 * Author: Ma Yanbin <myanbin@gmail.com>
 * https://github.com/myanbin
 */

console.log("%c  ", "background-image: url('https://mayanbin.com/public/images/source-code.png'); background-repeat: no-repeat; background-size: 300px 300px; font-size: 300px");

$(function() {

  /**
   * dark mode
   */
  document.getElementById("_dark-mode").addEventListener("click", function (e) {
    e.preventDefault();
    if (document.body.classList.contains("dark-mode")) {
      document.body.classList.remove("dark-mode");
    } else {
      document.body.classList.add("dark-mode");
    }
  });

  /**
   * 在 Windows 平台上使用更窄的滚动条
   */
  if (navigator.platform.match(/win32/i)) {
    var cssId = '_webkit-scrollbar';
    if (!document.getElementById(cssId)) {
      var head = document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.id = cssId;
      style.innerText = `
        ::-webkit-scrollbar { width: 6px; height: 6px; background-color: #fff; }
        ::-webkit-scrollbar-track { background-color: #fff; }
        ::-webkit-scrollbar-thumb { background-color: #ccc; border: 1px solid #ddd; }
        `;
      head.appendChild(style);
    }
  }

  /**
   * 注册 Service Worker
   */
  // Check that service workers are supported
  if ('serviceWorker' in navigator) {
    // Use the window load event to keep the page load performant
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js');
    });
  }
});