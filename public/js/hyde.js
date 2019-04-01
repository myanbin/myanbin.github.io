/**
 * Author: Ma Yanbin <myanbin@gmail.com>
 * https://github.com/myanbin
 */

console.log("This Jekyll theme's author is Ma Yanbin <myanbin@gmail.com>");

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
  })
});