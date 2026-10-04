/* GOAT Scoop · goatscoop.com · pre-launch. Same sign-up code pattern as the hub pages. No innerHTML (Trusted Types). */
(function () {
"use strict";
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function h(tag, attrs, kids) {
  var e = document.createElement(tag);
  for (var k in (attrs || {})) { if (attrs[k] === true) e.setAttribute(k, ""); else if (attrs[k] !== false) e.setAttribute(k, attrs[k]); }
  (kids || []).forEach(function (c) { e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
  return e;
}
function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }

/* ---------- sign-up: email first, then an optional name ---------- */
var API = "https://acp9reat3l.execute-api.us-east-1.amazonaws.com/signal/request-link";
var SITE = "goatscoop.com";
var LANDING_RE = /^\/[A-Za-z0-9._~!$&'()*+,;=:@%\/-]{0,199}$/;
var EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[A-Za-z]{2,}$/;
function payload(email, hp, profile) {
  var b = { email: email, hp: hp || "", site: SITE };
  if (LANDING_RE.test(location.pathname)) b.landing_path = location.pathname;
  try { var tz = Intl.DateTimeFormat().resolvedOptions().timeZone; if (tz && tz.length <= 40) b.tz = tz; } catch (e) { /* optional */ }
  var q = location.search;
  if (q && q.length <= 2048 && /[?&](utm_[a-z]+|ref)=/i.test(q)) b.query = q;
  if (profile) b.profile = profile;
  return b;
}
function post(body) {
  var ctl = window.AbortController ? new AbortController() : null, timer = ctl ? window.setTimeout(function () { ctl.abort(); }, 15000) : 0;
  return fetch(API, { method: "POST", mode: "cors", credentials: "omit", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined })
    .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { window.clearTimeout(timer); return { status: r.status, code: j && j.error }; }); },
          function () { window.clearTimeout(timer); return { status: 0, code: "network" }; });
}
function errText(res) {
  var s = res.status, c = res.code;
  if (s === 400 && c === "invalid_email") return "That email address doesn't look right. Check it for a typo?";
  if (s === 400 && c === "invalid_profile") return "We couldn't save that. Letters, spaces, hyphens and apostrophes work best in a name.";
  if (s === 400) return "Something in the form didn't go through. Please try again.";
  if (s === 415) return "Your browser sent the form in a format we can't read. Refresh the page and try again.";
  if (s === 429) return "Lots of sign-ups from your network just now. Wait a minute, then try again.";
  if (s === 403) return "Sign-up only works on our own site. Open goatscoop.com and try again.";
  if (s >= 500) return "Our sign-up desk hit a snag. Please try again in a moment.";
  return "We couldn't reach the sign-up desk. Check your connection and try again.";
}
function validEmail(v) { return v.length <= 254 && EMAIL_RE.test(v); }

$$(".js-join").forEach(function (form, n) {
  var em = form.querySelector('input[type="email"]'), hp = form.querySelector('input[name="website"]'), err = $(".js-err", form);
  var btn = form.querySelector('button[type="submit"]'), flow = $(".js-flow", form.parentNode), busy = false;
  em.addEventListener("blur", function () {
    var v = em.value.trim();
    if (v && !validEmail(v)) { err.textContent = "That email address doesn't look right yet."; em.setAttribute("aria-invalid", "true"); }
  });
  em.addEventListener("input", function () { if (em.getAttribute("aria-invalid") && validEmail(em.value.trim())) { err.textContent = ""; em.removeAttribute("aria-invalid"); } });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (busy) return;
    var v = em.value.trim();
    if (!validEmail(v)) { err.textContent = "Please enter your email address, like name@example.com."; em.setAttribute("aria-invalid", "true"); em.focus(); return; }
    busy = true; btn.disabled = true; var label = btn.textContent; btn.textContent = "Sending…"; err.textContent = "";
    post(payload(v, hp ? hp.value : "")).then(function (res) {
      busy = false; btn.disabled = false; btn.textContent = label;
      if (res.status === 200) { form.hidden = true; stepProfile(flow, v, n); return; }
      err.textContent = errText(res);
      if (res.code === "invalid_email") { em.setAttribute("aria-invalid", "true"); em.focus(); }
    });
  });
});

function stepProfile(flow, email, n) {
  flow.hidden = false; clear(flow);
  var head = h("h3", { tabindex: "-1" }, ["You're in the preview."]);
  var name = h("input", { id: "nm" + n, name: "name", type: "text", autocomplete: "given-name", maxlength: "40" });
  var cad = [["weekly", "Weekly board"], ["daily", "Every weekday"]].map(function (c) {
    return h("label", { class: "chk" }, [h("input", { type: "radio", name: "cadence" + n, value: c[0] }), h("span", {}, [c[1]])]);
  });
  var perr = h("p", { class: "err", role: "alert" });
  var save = h("button", { class: "btn sm", type: "submit" }, ["Save my choices"]);
  var skip = h("button", { class: "notnow", type: "button" }, ["Not now"]);
  var f = h("form", { novalidate: true }, [
    h("div", { class: "f-grid" }, [
      h("div", {}, [h("label", { for: "nm" + n }, ["First name"]), name]),
      h("fieldset", { class: "seg-pick" }, [h("legend", { class: "f-l" }, ["How often"])].concat(cad))
    ]),
    perr,
    h("div", { class: "f-actions" }, [save, skip])
  ]);
  flow.appendChild(h("p", { class: "ok-line", role: "status" }, ["Check your inbox: we sent a link to confirm ", h("b", {}, [email]), ". Tap it to finish joining."]));
  flow.appendChild(head);
  flow.appendChild(h("p", { class: "small" }, ["All optional. Skip anything."]));
  flow.appendChild(f);
  head.focus();
  function done(saved) {
    clear(flow);
    flow.appendChild(h("p", { class: "ok-line", role: "status" }, [saved ? "Saved. " : "", "We'll email you when the first board goes out. Know someone who loves a good scoop? Send them goatscoop.com."]));
  }
  skip.addEventListener("click", function () { done(false); });
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var prof = {}, nm = name.value.trim(), c = f.querySelector('input[name="cadence' + n + '"]:checked');
    if (nm) prof.name = nm;
    if (c) prof.cadence = c.value;
    if (!Object.keys(prof).length) { done(false); return; }
    if (/[<>]/.test(nm)) { perr.textContent = "Please leave out < and > in your name."; return; }
    save.disabled = true; perr.textContent = "";
    post(payload(email, "", prof)).then(function (res) {
      save.disabled = false;
      if (res.status === 200) done(true); else perr.textContent = errText(res);
    });
  });
}

/* ---------- reservation + purchase preview: one screen, fixed order ---------- */
var INSIDER = "Reservation holders are insiders: first access to new features, products and prices, sneak peeks by email, and notes from the build room.";
var TIERS = {
  pro: { n: "Pro", dep: "$9.99", get: ["Full detail on every scoop", "Your personalised brief", "The full hourly radio-style brief"], list: "$9.99/mo", found: "$7.99/mo", yr: "$99/yr at launch, $79/yr founding", save: "$2/mo · $24/yr · 20%" },
  max: { n: "MAX", dep: "$29", get: ["Everything in Pro, every lane in full text", "Morning and evening deep dives", "All 24 white papers and the member forum"], list: "$19.99/mo", found: "$14.99/mo", yr: "$199/yr at launch, $149/yr founding", save: "$5/mo · $60/yr · 25%" },
  ultra: { n: "Ultra", dep: "$99", get: ["Everything in MAX", "The 21-book library and training by job title", "The full Defense Playbook and the insider circle"], list: "$99.99/mo", found: "$69.99/mo", yr: "$999/yr at launch, $699/yr founding", save: "$30/mo · $360/yr · 30%" }
};
var dlg = $("#checkout"), lastBtn = null;
function openDlg() { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); }
function closeDlg() { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); }
function fill(list) { var g = clear($("#coGet")); list.forEach(function (x) { g.appendChild(h("li", {}, [x])); }); $("#coStatus").textContent = ""; }
$$(".js-reserve").forEach(function (b) {
  b.addEventListener("click", function () {
    var T = TIERS[b.getAttribute("data-tier")]; lastBtn = b; fill(T.get);
    $("#co-h").textContent = "Reserve " + T.n;
    var pr = clear($("#coPrice"));
    pr.appendChild(document.createTextNode("Launch price " + T.list + " · founding ")); pr.appendChild(h("b", {}, [T.found]));
    pr.appendChild(document.createTextNode(", locked while you stay subscribed. ")); pr.appendChild(h("span", { class: "small" }, [T.yr]));
    $("#coSave").textContent = T.save;
    $("#coPay").textContent = "Reserve for " + T.dep;
    $("#coRefund").textContent = "Refundable on request before launch only. This " + T.dep + " deposit reserves the founding price; it is not a subscription payment. The price shown is the price you pay at checkout.";
    $("#coInsider").textContent = INSIDER; $("#coInsider").hidden = false;
    openDlg();
  });
});
var buy = $(".js-buy");
if (buy) buy.addEventListener("click", function () {
  lastBtn = this; fill(["100-page PDF", "The full audio version", "Delivered right away"]);
  $("#co-h").textContent = "Buy the AI-Era Defense Playbook";
  var pr = clear($("#coPrice")); pr.appendChild(h("b", {}, ["$49"])); pr.appendChild(document.createTextNode(", one-time purchase, all-in"));
  $("#coSave").textContent = "No discount. It's a finished product at its normal price.";
  $("#coPay").textContent = "Buy for $49";
  $("#coRefund").textContent = "A finished digital product, delivered right away. See the refund terms before you pay.";
  $("#coInsider").hidden = true;
  openDlg();
});
$("#coPay").addEventListener("click", function () { /* pay-wired */ var u = lastBtn && lastBtn.getAttribute("data-pay-url"); if (!u) { $("#coStatus").textContent = "Checkout is not open yet. Please try again shortly."; return; } $("#coStatus").textContent = "Opening secure checkout..."; window.location.assign(u); });
$("#coClose").addEventListener("click", closeDlg);
dlg.addEventListener("close", function () { if (lastBtn) lastBtn.focus(); });

/* ---------- fact / rumor filter (any page with .js-filter) ---------- */
$$(".js-filter").forEach(function (bar) {
  var items = $$(bar.getAttribute("data-target") ? bar.getAttribute("data-target") : ".story");
  var out = $(".js-count", bar.parentNode);
  $$("button", bar).forEach(function (b) {
    b.addEventListener("click", function () {
      var want = b.getAttribute("data-f"), shown = 0;
      $$("button", bar).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      items.forEach(function (it) { var on = want === "all" || it.getAttribute("data-kind") === want; it.hidden = !on; if (on) shown++; });
      if (out) out.textContent = "Showing " + shown + " example " + (shown === 1 ? "story" : "stories") + ".";
    });
  });
});

/* ---------- read it aloud with the browser's own voice (any .js-speak button) ---------- */
$$(".js-speak").forEach(function (b) {
  if (!("speechSynthesis" in window)) { b.hidden = true; return; }
  var label = b.textContent;
  b.addEventListener("click", function () {
    var ss = window.speechSynthesis;
    if (ss.speaking) { ss.cancel(); b.textContent = label; b.setAttribute("aria-pressed", "false"); return; }
    var src = document.getElementById(b.getAttribute("data-say"));
    if (!src) return;
    var u = new SpeechSynthesisUtterance(src.textContent.replace(/\s+/g, " ").trim());
    u.lang = "en-US"; u.rate = 0.95;
    u.onend = u.onerror = function () { b.textContent = label; b.setAttribute("aria-pressed", "false"); };
    b.textContent = "Stop reading"; b.setAttribute("aria-pressed", "true");
    ss.speak(u);
  });
});
})();
