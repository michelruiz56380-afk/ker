(function(){
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) root.classList.add("pin");
  function $(s, c){ return (c || document).querySelector(s); }
  function $$(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  /* ---------- Mesure : convention d'événements (aucun traceur chargé) ---------- */
  window.dataLayer = window.dataLayer || [];
  function track(event, data){
    var o = {event: event}; if (data) for (var k in data) o[k] = data[k];
    window.dataLayer.push(o);
  }
  document.addEventListener("click", function(e){
    var a = e.target.closest("[data-cta]"); if (!a) return;
    var where = a.getAttribute("data-cta");
    track(where === "hero" ? "hero_cta_click" : "cta_click", {cta_location: where, href: a.getAttribute("href")});
  });

  /* ---------- Menu mobile ---------- */
  var menuBtn = $(".menu-btn"), nav = $("#nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function(){
      var open = nav.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function(e){
      if (e.target.closest("a")) { nav.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- Section active (page d'accueil) ---------- */
  var stickyCta = $("#sticky-cta"), seen = {};
  function setChapter(id){
    $$(".chapters a").forEach(function(a){ a.setAttribute("aria-current", a.dataset.ch === id ? "true" : "false"); });
    $$(".nav a").forEach(function(a){ a.setAttribute("aria-current", a.dataset.nav === id ? "true" : "false"); });
    if (stickyCta) stickyCta.classList.toggle("is-on", id !== "top" && id !== "demo");
    if (!seen[id]) { seen[id] = true; track("chapter_view", {chapter: id}); }
  }
  var chapters = $$("[data-chapter]");
  if (chapters.length && "IntersectionObserver" in window) {
    var chIO = new IntersectionObserver(function(en){
      en.forEach(function(e){ if (e.isIntersecting) setChapter(e.target.dataset.chapter); });
    }, {rootMargin: "-45% 0px -50% 0px"});
    chapters.forEach(function(s){ chIO.observe(s); });
  } else if (stickyCta) {
    stickyCta.classList.add("is-on");
  }

  /* ---------- Problème : situation fragmentée / partagée ---------- */
  var net = $("#net"), netMode = "auto";
  function setNet(mode){
    if (!net) return;
    net.classList.toggle("is-whole", mode === "whole");
    $$("[data-net]").forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.net === mode ? "true" : "false"); });
    $$("[data-side]").forEach(function(s){ s.classList.toggle("is-on", s.dataset.side === mode); });
  }
  $$("[data-net]").forEach(function(b){ b.addEventListener("click", function(){ netMode = "manual"; setNet(b.dataset.net); }); });
  $$("[data-side]").forEach(function(s){
    ["mouseenter", "focus"].forEach(function(ev){ s.addEventListener(ev, function(){ netMode = "manual"; setNet(s.dataset.side); }); });
  });
  setNet("frag");

  /* ---------- Phrase de transition : les mots s'allument ---------- */
  var words = [];
  $$("[data-words]").forEach(function(p){
    var nodes = Array.prototype.slice.call(p.childNodes); p.textContent = "";
    nodes.forEach(function(n){
      var key = n.nodeType === 1;
      n.textContent.split(/(\s+)/).forEach(function(part){
        if (!part) return;
        if (/^\s+$/.test(part)) { p.appendChild(document.createTextNode(part)); return; }
        var sp = document.createElement("span"); sp.className = "w" + (key ? " k" : ""); sp.textContent = part;
        p.appendChild(sp); words.push(sp);
      });
    });
  });

  /* ---------- Ville qui s'éteint (étude de cas panne) ---------- */
  var city = (function(){
    var cv = $("#city"); if (!cv || !cv.getContext) return null;
    var ctx = cv.getContext("2d"), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var seed = 7; function rnd(){ seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var lights = [], ep = {x: .2, y: .58}, target = 0, cur = 0, raf = 0, visible = false;
    for (var gx = 0; gx < 26; gx++) for (var gy = 0; gy < 12; gy++) {
      var bx = gx / 26 + rnd() * .012, by = gy / 12 + rnd() * .02;
      if (Math.abs(by - (.35 + Math.sin(bx * 5) * .08)) < .045) continue;
      var k = 2 + Math.floor(rnd() * 6);
      for (var i = 0; i < k; i++) lights.push({x: bx + rnd() * .03, y: by + rnd() * .06, s: .6 + rnd() * 1.6, w: rnd() < .78, ph: rnd() * 6.28});
    }
    lights.forEach(function(l){ var dx = (l.x - ep.x) * 1.6, dy = l.y - ep.y; l.d = Math.sqrt(dx * dx + dy * dy); });
    var maxD = Math.max.apply(null, lights.map(function(l){ return l.d; }));
    function size(){ var r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function draw(now){
      cur += (target - cur) * .06; if (Math.abs(target - cur) < .002) cur = target;
      var R = cur / 5 * maxD * .72, t = (now || 0) / 1000;
      var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0b1824"); g.addColorStop(1, "#04090e");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(60,90,115,.35)"; ctx.lineWidth = 10; ctx.beginPath();
      for (var x = 0; x <= W; x += 8) { var y = (.35 + Math.sin(x / W * 5) * .08) * H + 14; if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke();
      lights.forEach(function(l){
        var off = l.d < R, edge = Math.abs(l.d - R) < .05 && cur > 0 && cur < 5;
        var px = l.x * W, py = l.y * H, a = off ? .06 : .55 + .35 * Math.sin(t * 1.5 + l.ph) * (edge ? 1 : .15);
        if (edge && Math.sin(t * 22 + l.ph * 9) > .2) a = .1;
        ctx.fillStyle = off ? "rgba(90,110,130," + a + ")" : (l.w ? "rgba(255,178,92," + a.toFixed(3) + ")" : "rgba(255,230,190," + a.toFixed(3) + ")");
        ctx.fillRect(px, py, l.s * 1.6, l.s * 1.6);
        if (!off && l.s > 1.7) { ctx.fillStyle = "rgba(255,150,60,.08)"; ctx.beginPath(); ctx.arc(px, py, 6, 0, 6.283); ctx.fill(); }
      });
      if (cur > .02) {
        ctx.strokeStyle = "rgba(244,90,10,.75)"; ctx.lineWidth = 1.5; ctx.setLineDash([6, 6]);
        ctx.beginPath(); ctx.ellipse(ep.x * W, ep.y * H, Math.max(1, R / 1.6 * W), Math.max(1, R * H), 0, 0, 6.283); ctx.stroke(); ctx.setLineDash([]);
      }
      var pr = 6 + (Math.sin(t * 3) + 1) * 4;
      ctx.strokeStyle = "rgba(244,90,10,.9)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ep.x * W, ep.y * H, pr, 0, 6.283); ctx.stroke();
      ctx.fillStyle = "#f45a0a"; ctx.beginPath(); ctx.arc(ep.x * W, ep.y * H, 3.5, 0, 6.283); ctx.fill();
      if (!reduce && visible) raf = requestAnimationFrame(draw);
    }
    size(); draw(0);
    window.addEventListener("resize", function(){ size(); draw(performance.now()); });
    if ("IntersectionObserver" in window && !reduce) new IntersectionObserver(function(en){ visible = en[0].isIntersecting; cancelAnimationFrame(raf); if (visible) raf = requestAnimationFrame(draw); }).observe(cv);
    var names = ["situation normale", "énergie coupée", "télécoms touchées", "accès et mobilité touchés", "équipes terrain sous tension", "soins à prioriser"];
    var status = $("#city-status");
    return {set: function(n){ n = clamp(n, 0, 5); if (n === target) return; target = n; if (status) status.innerHTML = "<b>Étage " + n + " / 5</b> · " + names[n]; if (reduce) { cur = n; draw(0); } }};
  })();
  var tiers = $$(".tier");

  /* ---------- Progression au scroll ---------- */
  var progSections = $$("[data-progress]"), readbar = $(".readbar"), ticking = false;
  function progressOf(el){
    var r = el.getBoundingClientRect(), vh = window.innerHeight;
    return clamp((vh - r.top) / (vh + r.height), 0, 1);
  }
  function onScroll(){
    ticking = false;
    var vh = window.innerHeight;
    progSections.forEach(function(s){
      var p = progressOf(s);
      s.style.setProperty("--p", p.toFixed(3));
      if (s.id === "probleme" && netMode === "auto") setNet(p < 0.45 ? "frag" : "whole");
    });
    if (words.length) {
      var m = $("#manifeste"), r = m.getBoundingClientRect();
      var n = Math.round(clamp((vh * .85 - r.top) / (r.height * .9), 0, 1) * words.length * 1.1);
      words.forEach(function(w, i){ w.classList.toggle("on", i < n); });
    }
    if (tiers.length) {
      var c = $(".city"), cr = (c || tiers[0]).getBoundingClientRect();
      var k = clamp(Math.floor((vh * .78 - cr.top) / (vh * .95) * 6), 0, 5);
      tiers.forEach(function(t, i){ t.classList.toggle("is-hit", i < k); });
      if (city) city.set(k);
    }
    if (readbar) {
      var h = document.documentElement.scrollHeight - vh;
      readbar.style.setProperty("--read", h > 0 ? (window.scrollY / h).toFixed(4) : 0);
    }
  }
  if (!reduce) {
    window.addEventListener("scroll", function(){ if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, {passive: true});
    window.addEventListener("resize", onScroll);
    onScroll();
  } else {
    tiers.forEach(function(t){ t.classList.add("is-hit"); });
    if (city) city.set(5);
  }

  /* ---------- Onglets accessibles (motif ARIA tabs) ---------- */
  function tabs(list, onChange){
    var t = $$("[role=tab]", list);
    var vertical = list.getAttribute("aria-orientation") === "vertical";
    function select(tab, focus){
      t.forEach(function(x){ var on = x === tab; x.setAttribute("aria-selected", on ? "true" : "false"); x.tabIndex = on ? 0 : -1; });
      if (focus) tab.focus();
      onChange(tab, t.indexOf(tab));
    }
    t.forEach(function(tab, i){
      tab.addEventListener("click", function(){ select(tab, false); });
      tab.addEventListener("keydown", function(e){
        var k = e.key, n = null, next = vertical ? "ArrowDown" : "ArrowRight", prev = vertical ? "ArrowUp" : "ArrowLeft";
        if (k === next) n = t[Math.min(i + 1, t.length - 1)]; else if (k === prev) n = t[Math.max(i - 1, 0)];
        else if (k === "Home") n = t[0]; else if (k === "End") n = t[t.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    return {select: select, tabs: t};
  }
  function showPanels(scope, tab){
    $$("[role=tabpanel]", scope).forEach(function(p){ p.hidden = p.id !== tab.getAttribute("aria-controls"); });
  }

  /* ---------- 03 : les cinq étapes, toujours dans l'ordre ---------- */
  var stepList = $("#steptabs");
  if (stepList) {
    var panelWrap = $(".steppanel"), prev = $("#step-prev"), next = $("#step-next"), count = $("#step-count"), bar = $("#stepbar");
    var st = tabs(stepList, function(tab, i){
      showPanels(panelWrap, tab);
      $$(".stepnav .phases span").forEach(function(ph){ ph.classList.toggle("is-on", ph.dataset.ph === tab.dataset.phase); });
      prev.disabled = i === 0; next.disabled = i === st.tabs.length - 1;
      count.textContent = "Étape " + (i + 1) + " sur " + st.tabs.length;
      bar.style.width = ((i + 1) / st.tabs.length * 100) + "%";
      track("step_view", {step: i + 1});
    });
    function cur(){ return st.tabs.findIndex(function(x){ return x.getAttribute("aria-selected") === "true"; }); }
    // Suivant / Précédent avancent d'une seule étape : impossible de passer de 02 à 04 sans afficher 03.
    prev.addEventListener("click", function(){ var i = cur(); if (i > 0) st.select(st.tabs[i - 1], false); });
    next.addEventListener("click", function(){ var i = cur(); if (i < st.tabs.length - 1) st.select(st.tabs[i + 1], false); });
    st.select(st.tabs[0], false);
  }

  /* ---------- 04 : galerie de la plateforme ---------- */
  var gallery = $('[data-tabs="gallery"]');
  if (gallery) {
    var g = tabs(gallery, function(tab){ showPanels(gallery.parentElement, tab); track("gallery_view", {view: tab.dataset.key}); });
  }
  var zoom = $("#zoom");
  if (zoom) {
    var zones = {"0": [50, 50, 1], "1": [50, 17, 1.9], "2": [50, 37, 1.9]};
    $$("[data-zone]").forEach(function(b){
      b.addEventListener("click", function(){
        var z = b.dataset.zone, c = zones[z];
        zoom.style.setProperty("--ox", c[0] + "%"); zoom.style.setProperty("--oy", c[1] + "%"); zoom.style.setProperty("--z", c[2]);
        zoom.classList.toggle("zoomed", z !== "0");
        $$(".shot__tools [data-zone]").forEach(function(x){ x.setAttribute("aria-pressed", x.dataset.zone === z ? "true" : "false"); });
      });
    });
  }

  /* ---------- Étude de cas canicule : chronologie ---------- */
  var railItems = $$("[data-rail]");
  if (railItems.length && "IntersectionObserver" in window) {
    var rIO = new IntersectionObserver(function(en){ en.forEach(function(e){ if (e.isIntersecting) railItems.forEach(function(r){ r.classList.toggle("is-on", r.dataset.rail === e.target.dataset.chap); }); }); }, {rootMargin: "-40% 0px -55% 0px"});
    $$("[data-chap]").forEach(function(c){ rIO.observe(c); });
  }

  /* ---------- Lightbox ---------- */
  var SHOTS = {
    pilotage: ["img/pilotage.webp", "Pilotage groupe : sites, ressources, situation en cours et synthèse. Capture du produit, données de démonstration."],
    synthese: ["img/synthese.webp", "Synthèse de situation paramétrable : sites et informations choisis par l'utilisateur. Données de démonstration."],
    tableau: ["img/tableau.webp", "Main courante et suivi de crise. Aperçu basse définition, données de démonstration."],
    workflow: ["img/workflow.webp", "Workflow : étapes séquencées et validations. Aperçu basse définition, données de démonstration."],
    sitrep: ["img/sitrep.webp", "SITREP : faits établis, actions réalisées, prochaines étapes, arbitrages. Aperçu basse définition."],
    retex: ["img/retex.webp", "RETEX : points positifs, points négatifs, recommandations. Aperçu basse définition."]
  };
  var lb = $("#lb");
  if (lb) {
    var lbImg = $("#lb-img"), lbCap = $("#lb-cap"), lbFrom = null;
    $$("[data-lightbox]").forEach(function(b){
      b.addEventListener("click", function(){
        var s = SHOTS[b.dataset.lightbox]; if (!s) return; lbFrom = b;
        lbImg.src = s[0]; lbImg.alt = s[1]; lbCap.textContent = s[1];
        if (lb.showModal) lb.showModal(); else lb.setAttribute("open", "");
        track("screenshot_open", {screen: b.dataset.lightbox});
      });
    });
    var closeLb = function(){ if (lb.close) lb.close(); else lb.removeAttribute("open"); };
    $("#lb-close").addEventListener("click", closeLb);
    lb.addEventListener("click", function(e){ if (e.target === lb) closeLb(); });
    lb.addEventListener("close", function(){ if (lbFrom) lbFrom.focus(); });
  }

  /* ---------- Apparitions au scroll ---------- */
  if (!reduce && "IntersectionObserver" in window) {
    var sel = ".band h2, .band .lede, .band .eyebrow, .claim, .side, .duo__map, .conclusion, .engine2, .engine-end, .panel__grid, .case, .sector, .trust3, .chap, .tier, .city, .demo-note, .form, .caseend";
    var rv = new IntersectionObserver(function(en){ en.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add("is-in"); rv.unobserve(e.target); } }); }, {rootMargin: "0px 0px -8% 0px"});
    $$(sel).forEach(function(el){
      if (el.closest(".hero") || el.closest(".casehero") || el.closest("[hidden]")) return;
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty("--rd", Math.min(sib, 4) * .08 + "s");
      el.classList.add("rv"); rv.observe(el);
    });
  }

  /* ---------- 07 : formulaire de démonstration ---------- */
  var form = $("#demo-form");
  if (!form) return;
  var sel2 = $("#f-secteur"), msg = $("#f-msg"), started = false;
  function syncChips(){ $$(".vchip").forEach(function(c){ c.setAttribute("aria-pressed", c.dataset.sector === sel2.value ? "true" : "false"); }); }
  $$(".vchip").forEach(function(c){ c.addEventListener("click", function(){ sel2.value = c.dataset.sector; syncChips(); }); });
  sel2.addEventListener("change", syncChips);
  // Les boutons des cartes secteurs préremplissent le formulaire.
  $$("[data-sector-cta]").forEach(function(a){
    a.addEventListener("click", function(){
      sel2.value = a.dataset.sectorCta; syncChips();
      if (a.dataset.notify && !msg.value) msg.value = "Je souhaite être informé(e) du lancement de KER " + a.dataset.notify + ".";
      track("vertical_selected", {vertical: a.dataset.sectorCta});
    });
  });
  form.addEventListener("input", function(){ if (!started) { started = true; track("demo_form_start"); } });
  var FREE = /@(gmail|googlemail|yahoo|hotmail|outlook|live|msn|icloud|me|aol|gmx|orange|wanadoo|free|sfr|laposte|neuf|bbox|proton|protonmail)\./i;
  $("#f-email").addEventListener("blur", function(){
    var v = this.value.trim();
    $("#h-email").textContent = v && FREE.test(v) ? "Cette adresse semble personnelle. Une adresse professionnelle nous aide à préparer la démonstration, mais vous pouvez continuer." : "";
  });
  var rules = [
    ["f-prenom", "e-prenom", "Indiquez votre prénom."],
    ["f-nom", "e-nom", "Indiquez votre nom."],
    ["f-fonction", "e-fonction", "Indiquez votre fonction."],
    ["f-org", "e-org", "Indiquez votre organisation."],
    ["f-email", "e-email", "Indiquez un e-mail valide, par exemple nom@organisation.fr."],
    ["f-secteur", "e-secteur", "Choisissez un secteur."],
    ["f-consent", "e-consent", "Cochez cette case pour que nous puissions vous répondre."]
  ];
  var submit = $("#f-submit"), errBox = $("#form-error");
  form.addEventListener("submit", function(e){
    e.preventDefault();
    errBox.textContent = "";
    var first = null;
    rules.forEach(function(r){
      var f = document.getElementById(r[0]), err = document.getElementById(r[1]);
      var ok = f.type === "checkbox" ? f.checked : (f.type === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value.trim()) : f.value.trim() !== "");
      f.setAttribute("aria-invalid", ok ? "false" : "true"); err.textContent = ok ? "" : r[2];
      if (!ok && !first) first = f;
    });
    if (first) { first.focus(); track("demo_form_error", {reason: "validation"}); return; }
    // Envoi réel vers Netlify Forms ; le message de succès n'apparaît qu'après une réponse positive.
    var body = new URLSearchParams(new FormData(form)).toString();
    submit.setAttribute("aria-busy", "true"); submit.disabled = true;
    fetch("/", {method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"}, body: body})
      .then(function(res){
        if (!res.ok) throw new Error("HTTP " + res.status);
        track("demo_form_submit", {sector: sel2.value});
        $("#form-body").hidden = true;
        var done = $("#form-done"); done.hidden = false; done.focus();
      })
      .catch(function(){
        track("demo_form_error", {reason: "network"});
        errBox.textContent = "Votre demande n'a pas pu être transmise. Vérifiez votre connexion et réessayez. Vos informations sont conservées dans le formulaire.";
      })
      .then(function(){ submit.removeAttribute("aria-busy"); submit.disabled = false; });
  });
  /* ---------- Secteurs : une seule image partagée entre les trois blocs ---------- */
  var pano = document.querySelector(".sectors[data-pano]");
  if (pano) {
    var layoutPano = function(){
      var cards = pano.querySelectorAll(".sector");
      var on = window.innerWidth > 1000 && cards.length && cards[1].offsetTop === cards[0].offsetTop;
      pano.classList.toggle("is-pano", !!on);
      if (!on) return;
      var sw = pano.clientWidth, ih = cards[0].querySelector(".sector__img").offsetHeight;
      var h = sw * 941 / 1672, iy = -Math.min(h * .27, Math.max(0, h - ih));
      pano.style.setProperty("--sw", sw + "px");
      pano.style.setProperty("--ih", ih + "px");
      pano.style.setProperty("--iy", iy + "px");
      Array.prototype.forEach.call(cards, function(c){ c.style.setProperty("--x", c.offsetLeft + "px"); });
    };
    layoutPano();
    window.addEventListener("resize", layoutPano);
    window.addEventListener("load", layoutPano);
  }
})();
