(function () {
  var stored = null;
  try {
    stored = localStorage.getItem("print-with-zwe-theme");
  } catch (_) {}
  var dark = stored !== "light";
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#0a0f1a" : "#f8fafc");
})();