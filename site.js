/* TSC public site behaviour. No private keys live here. */
(function(){
"use strict";
var CFG = window.TSC_CONFIG || {}, CNT = window.TSC_CONTENT || {}, PLAN = window.TSC_PLAN, LESSONS = window.TSC_LESSONS || [];
var TZ = CFG.timezone || "Africa/Lagos";
var SB = !!(CFG.supabase && CFG.supabase.url && CFG.supabase.anonKey);
var SET = {};            // settings loaded from the database (override config.js)
var PAGE = document.body.getAttribute("data-page") || "";

/* ---------- helpers ---------- */
function h(tag, attrs, kids){
  var el = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach(function(k){ var v = attrs[k]; if (v === null || v === undefined || v === false) return; if (k === "text") el.textContent = v; else el.setAttribute(k, v === true ? "" : v); });
  (kids || []).forEach(function(c){ if (c === null || c === undefined) return; el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
  return el;
}
function $(sel, root){ return (root || document).querySelector(sel); }
function $$(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function clear(el){ while (el && el.firstChild) el.removeChild(el.firstChild); }
function cfg(key){ return SET[key] !== undefined && SET[key] !== null && SET[key] !== "" ? SET[key] : (key === "address" ? CFG.location.address : key === "map_url" ? CFG.location.mapUrl : key === "location_note" ? CFG.location.note : key === "service_times" ? CFG.serviceTimes : CFG[key]); }
function store(k, v){ try { if (v === undefined) return window.localStorage.getItem(k); if (v === null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch(e){} return null; }
function toast(msg){ var t = $("#toast"); if (!t) { t = h("div", { "class": "toast", id: "toast", role: "status", "aria-live": "polite" }); document.body.appendChild(t); } t.textContent = msg; t.classList.add("show"); setTimeout(function(){ t.classList.remove("show"); }, 2400); }
function waUrl(msg, number){ return "https://wa.me/" + (number || cfg("whatsapp")) + (msg ? "?text=" + encodeURIComponent(msg) : ""); }
function mailUrl(subject, body){ return "mailto:" + cfg("email") + "?subject=" + encodeURIComponent(subject || "Hello from the TSC website") + "&body=" + encodeURIComponent(body || ""); }
function pageUrl(file, qs){ var base = (CFG.siteUrl || location.origin).replace(/\/$/, ""); return base + "/" + file + (qs ? "?" + qs : ""); }
function param(k){ return new URLSearchParams(location.search).get(k); }
function dateOnly(s, opts){ return new Date(s + "T12:00:00Z").toLocaleDateString("en-GB", Object.assign({ timeZone: "UTC" }, opts || { weekday: "long", day: "numeric", month: "long", year: "numeric" })); }
function dt(iso, opts){ return new Date(iso).toLocaleString("en-GB", Object.assign({ timeZone: TZ }, opts)); }
function timeRange(a, b){ var o = { hour: "numeric", minute: "2-digit", hour12: true }; var s = dt(a, o); return b ? s + " to " + dt(b, o) : s; }
function trim(s, n){ s = (s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "\u2026" : s; }
function genRef(){ var c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", s = "TSC-"; var a = new Uint8Array(8); (window.crypto || {}).getRandomValues ? window.crypto.getRandomValues(a) : a.forEach(function(_, i){ a[i] = Math.floor(Math.random() * 256); }); for (var i = 0; i < 8; i++) s += c[a[i] % c.length]; return s; }
function today(){ return PLAN.now().then(function(d){ return { date: d, ymd: PLAN.ymd(PLAN.lagosParts(d, TZ)), idx: PLAN.dayIndexFor(d, TZ) }; }); }
function emptyBox(title, text, actions){ return h("div", { "class": "empty" }, [h("h3", { text: title }), h("p", { text: text }), actions ? h("div", { "class": "hero-cta", style: "justify-content:flex-start" }, actions) : null]); }
function btn(text, href, cls, ext){ return h("a", { "class": "btn " + (cls || "btn-navy"), href: href, target: ext ? "_blank" : null, rel: ext ? "noopener" : null, text: text }); }

/* ---------- icons ---------- */
var ICONS = {"youtube":"M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z","facebook":"M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z","x":"M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z","tiktok":"M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z","telegram":"M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z","whatsapp":"M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"};
var NS = "http://www.w3.org/2000/svg";
function svgEl(tag, attrs){ var e = document.createElementNS(NS, tag); Object.keys(attrs).forEach(function(k){ e.setAttribute(k, attrs[k]); }); return e; }
function icon(key){
  var s = svgEl("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" });
  if (key === "instagram") {
    s.appendChild(svgEl("rect", { x: "3", y: "3", width: "18", height: "18", rx: "5.2", fill: "none", stroke: "currentColor", "stroke-width": "2.1" }));
    s.appendChild(svgEl("circle", { cx: "12", cy: "12", r: "4.1", fill: "none", stroke: "currentColor", "stroke-width": "2.1" }));
    s.appendChild(svgEl("circle", { cx: "17.4", cy: "6.6", r: "1.25", fill: "currentColor" }));
  } else s.appendChild(svgEl("path", { d: ICONS[key] }));
  return s;
}
function waBtn(text, msg, cls){ var a = h("a", { "class": "btn " + (cls || "btn-wa"), href: waUrl(msg), target: "_blank", rel: "noopener" }); a.appendChild(icon("whatsapp")); a.appendChild(document.createTextNode(text)); return a; }

/* ---------- data layer ---------- */
function sbFetch(path, opts){
  opts = opts || {};
  var headers = { apikey: CFG.supabase.anonKey }; if (String(CFG.supabase.anonKey).indexOf("eyJ") === 0) headers.Authorization = "Bearer " + CFG.supabase.anonKey; Object.assign(headers, opts.headers || {});
  return fetch(CFG.supabase.url.replace(/\/$/, "") + "/rest/v1/" + path, { method: opts.method || "GET", headers: headers, body: opts.body }).then(function(r){
    if (!r.ok) return r.text().then(function(t){ var e = new Error(t || ("HTTP " + r.status)); e.status = r.status; throw e; });
    if (r.status === 204) return null;
    return (r.headers.get("content-type") || "").indexOf("json") > -1 ? r.json() : r.text();
  });
}
function dbList(table, query, fallback){ if (!SB) return Promise.resolve(fallback || []); return sbFetch(table + "?" + query); }
function dbInsert(table, row){ return sbFetch(table, { method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(row) }); }
function dbRpc(fn, args){ return sbFetch("rpc/" + fn, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args || {}) }); }
function loadSettings(){
  if (!SB) return Promise.resolve();
  return sbFetch("site_settings?select=key,value").then(function(rows){ (rows || []).forEach(function(r){ SET[r.key] = r.value; }); }).catch(function(){});
}
function errBox(el, what){ clear(el); el.appendChild(emptyBox("We could not load " + what + " right now", "Please check your connection and try again in a moment.", null)); }

/* ---------- chrome: menus, contact bindings, social, floating WhatsApp ---------- */
function initChrome(){
  var mb = $("#menuBtn"), mn = $("#mobileNav");
  function setMenu(o){ mb.setAttribute("aria-expanded", o ? "true" : "false"); mb.setAttribute("aria-label", o ? "Close menu" : "Open menu"); mn.classList.toggle("open", o); document.body.style.overflow = o ? "hidden" : ""; }
  if (mb && mn) { mb.addEventListener("click", function(){ setMenu(mb.getAttribute("aria-expanded") !== "true"); }); $$("a", mn).forEach(function(a){ a.addEventListener("click", function(){ setMenu(false); }); }); }
  $$(".nav .dd > button").forEach(function(b){ b.addEventListener("click", function(e){ e.stopPropagation(); var d = b.parentNode, o = !d.classList.contains("open"); $$(".nav .dd").forEach(function(x){ x.classList.remove("open"); $("button", x).setAttribute("aria-expanded", "false"); }); if (o) { d.classList.add("open"); b.setAttribute("aria-expanded", "true"); } }); });
  document.addEventListener("click", function(){ $$(".nav .dd").forEach(function(x){ x.classList.remove("open"); }); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape") { if (mb) setMenu(false); $$(".nav .dd").forEach(function(x){ x.classList.remove("open"); }); } });
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  var fl = $("#waFloat"); if (!fl) { fl = h("a", { id: "waFloat", "class": "wa-float", target: "_blank", rel: "noopener", "aria-label": "Chat with TSC on WhatsApp" }); fl.appendChild(icon("whatsapp")); document.body.appendChild(fl); }
}
function bindChrome(){
  var wa = cfg("whatsapp"), em = cfg("email");
  var fl = $("#waFloat"); if (fl) { if (wa) { fl.href = waUrl(CFG.whatsappDefault); fl.hidden = false; } else fl.hidden = true; }
  $$("[data-bind=email]").forEach(function(e){ if (!em) { e.hidden = true; return; } if (e.tagName === "A") e.href = "mailto:" + em; e.textContent = em; });
  $$("[data-bind=whatsapp]").forEach(function(e){ if (!wa) { e.hidden = true; return; } e.href = waUrl(e.getAttribute("data-msg") || CFG.whatsappDefault); e.hidden = false; });
  $$("[data-bind=whatsapp-text]").forEach(function(e){ e.textContent = wa ? ("+" + wa.replace(/^(\d{3})(\d{3})(\d{3})(\d+)$/, "$1 $2 $3 $4")) : ""; });
  $$("[data-mail]").forEach(function(a){ a.href = mailUrl(a.getAttribute("data-subject"), a.getAttribute("data-mail")); });
  $$("[data-social]").forEach(function(box){
    clear(box); var style = box.getAttribute("data-social");
    (CFG.social || []).forEach(function(s){
      var b = h("span", { "class": "sbadge", style: "background:" + s.color + (style === "footer" ? ";width:32px;height:32px;border-radius:9px" : "") }); b.appendChild(icon(s.key));
      if (style === "grid") { var a = h("a", { href: s.url, target: "_blank", rel: "noopener" }, [b, h("div", null, [h("strong", { text: s.name }), h("span", { text: s.handle })])]); box.appendChild(a); }
      else if (style === "footer") { var li = h("li"); var a2 = h("a", { href: s.url, target: "_blank", rel: "noopener", style: "display:inline-flex;gap:.6rem;align-items:center" }, [b, s.name]); li.appendChild(a2); box.appendChild(li); }
      else { var a3 = h("a", { href: s.url, target: "_blank", rel: "noopener", "aria-label": s.name, title: s.name }); a3.appendChild(b); box.appendChild(a3); }
    });
  });
  $$("[data-bind=location]").forEach(function(e){ var a = cfg("address"); e.textContent = a ? a : (CFG.location.city + ", " + CFG.location.country); });
  $$("[data-bind=location-note]").forEach(function(e){ e.textContent = cfg("location_note"); });
  var an = SET.announcement; var bar = $("#announce");
  if (bar) { clear(bar); if (an && an.text) { bar.hidden = false; if (an.link) bar.appendChild(h("a", { href: an.link, text: an.text })); else bar.textContent = an.text; } else bar.hidden = true; }
  var info = $("#devo-share-base"); if (info) info.textContent = CFG.siteUrl;
}

/* ---------- forms ---------- */
function showStatus(form, kind, text, extra){
  var s = $(".status", form.parentNode) || $(".status", form);
  if (!s) { s = h("div", { "class": "status", role: "status", "aria-live": "polite" }); form.parentNode.insertBefore(s, form); }
  s.className = "status " + kind; clear(s); s.hidden = false; s.appendChild(document.createTextNode(text)); if (extra) { s.appendChild(document.createElement("br")); s.appendChild(extra); }
  s.scrollIntoView({ behavior: "smooth", block: "center" });
}
function formData(form){ var o = {}; $$("input,select,textarea", form).forEach(function(el){ if (!el.name || el.name === "website") return; if (el.type === "checkbox") { if (el.hasAttribute("data-multi")) { o[el.name] = o[el.name] || []; if (el.checked) o[el.name].push(el.value); } else o[el.name] = el.checked; } else if (el.type === "radio") { if (el.checked) o[el.name] = el.value; } else o[el.name] = el.value.trim(); }); return o; }
function bindForm(form, o){
  if (!form) return;
  var honey = h("div", { "class": "hp", "aria-hidden": "true" }, [h("label", { text: "Leave this empty" }), h("input", { name: "website", tabindex: "-1", autocomplete: "off" })]);
  form.appendChild(honey);
  form.addEventListener("submit", function(e){
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if ($("input[name=website]", form).value) return;                      // bot
    var last = +store("tsc_last_" + o.key) || 0; if (Date.now() - last < 15000) { showStatus(form, "info", "Please wait a few seconds before sending again."); return; }
    var fd = formData(form), built = o.build(fd); if (!built) return;
    var submit = $("[type=submit]", form); submit.disabled = true; var label = submit.textContent; submit.textContent = "Sending\u2026";
    function done(){ submit.disabled = false; submit.textContent = label; }
    if (SB && o.table) {
      dbInsert(o.table, built.row).then(function(){ store("tsc_last_" + o.key, String(Date.now())); form.reset(); done(); if (o.onSuccess) o.onSuccess(built, fd); showStatus(form, "ok", o.success || "Thank you. Your submission has been received.", built.extra ? built.extra() : null); })
      .catch(function(err){ done(); var dup = /duplicate|23505/.test(err.message || ""); var cap = /capacity|full|closed|not open/i.test(err.message || ""); showStatus(form, "err", dup ? "It looks like you have already submitted this. If you need to change something, please contact us." : cap ? "Sorry, registration is closed or full for this programme." : "We could not send your submission right now. Please try again, or contact us by email or WhatsApp."); });
    } else {
      done(); store("tsc_last_" + o.key, String(Date.now()));
      var body = built.mailBody || Object.keys(built.row).map(function(k){ var v = built.row[k]; return k.replace(/_/g, " ") + ": " + (typeof v === "object" ? JSON.stringify(v) : v); }).join("\n");
      window.location.href = mailUrl(o.subject, body);
      showStatus(form, "info", "Online storage is not connected yet, so we opened your email app with your message ready. Please press send in your email app to complete it.");
    }
  });
}

/* ---------- shared renderers ---------- */
function eventDateBox(iso){ return h("div", { "class": "date-box" }, [h("b", { text: String(new Date(iso).toLocaleString("en-GB", { timeZone: TZ, day: "numeric" })) }), h("span", { text: dt(iso, { month: "short", year: "numeric" }) })]); }
function progStatus(p, now){
  var open = !p.registration_required ? null : (!p.registration_open_at || new Date(p.registration_open_at) <= now) && (!p.registration_close_at || new Date(p.registration_close_at) >= now);
  if (!p.registration_required) return { text: "No registration needed", cls: "" };
  if (p.registration_open_at && new Date(p.registration_open_at) > now) return { text: "Registration opens " + dt(p.registration_open_at, { day: "numeric", month: "short" }), cls: "" };
  return open ? { text: "Registration open", cls: "ok" } : { text: "Registration closed", cls: "closed" };
}
function progCard(p){
  var st = progStatus(p, new Date()), where = [p.venue_name, p.venue_address].filter(Boolean).join(", ") || "Venue to be announced";
  var actions = [btn("View details", "programme.html?id=" + encodeURIComponent(p.id), "btn-ghost btn-sm")];
  if (p.registration_required && st.cls === "ok") actions.push(btn("Register now", "programme.html?id=" + encodeURIComponent(p.id) + "#register", "btn-navy btn-sm"));
  return h("article", { "class": "card" }, [
    h("div", { "class": "event-row" }, [eventDateBox(p.start_at), h("div", null, [h("h3", { text: p.title }), h("p", { "class": "meta", text: dt(p.start_at, { weekday: "short", day: "numeric", month: "long" }) + ", " + timeRange(p.start_at, p.end_at) })])]),
    h("p", { text: "Venue: " + where }), h("p", { text: trim(p.description, 150) }),
    h("div", null, [h("span", { "class": "badge " + st.cls, text: st.text })]),
    h("div", { "class": "actions" }, actions)
  ]);
}
function upcoming(list){ var now = new Date(); return (list || []).filter(function(p){ return new Date(p.end_at || p.start_at) >= now; }).sort(function(a, b){ return new Date(a.start_at) - new Date(b.start_at); }); }
function getProgrammes(){ return dbList("programmes", "status=eq.published&select=*&order=start_at.asc", (CNT.programmes || []).filter(function(p){ return p.status !== "draft"; })); }
function getDevos(ymd){ return dbList("devotionals", "status=eq.published&publish_date=lte." + ymd + "&select=*&order=publish_date.desc&limit=400", (CNT.devotionals || []).filter(function(d){ return d.publish_date <= ymd; }).sort(function(a, b){ return a.publish_date < b.publish_date ? 1 : -1; })); }
function getSermons(){ return dbList("sermons", "status=eq.published&select=*&order=preached_on.desc&limit=200", (CNT.sermons || []).slice().sort(function(a, b){ return a.preached_on < b.preached_on ? 1 : -1; })); }
function getGallery(){ return dbList("gallery_items", "status=eq.published&select=*&order=sort.asc,event_date.desc&limit=300", CNT.gallery || []); }
function youtubeId(u){ var m = (u || "").match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/); return m ? m[1] : null; }
function sermonCard(s){
  var yid = youtubeId(s.video_url), kids = [];
  if (yid) kids.push(h("div", { "class": "video" }, [h("iframe", { src: "https://www.youtube-nocookie.com/embed/" + yid, title: s.title, loading: "lazy", allow: "accelerometer; encrypted-media; picture-in-picture", allowfullscreen: "" })]));
  kids.push(h("div", null, [h("span", { "class": "badge", text: s.category || "Message" })]));
  kids.push(h("h3", { text: s.title }));
  kids.push(h("p", { "class": "meta", text: [s.speaker, s.preached_on ? dateOnly(s.preached_on, { day: "numeric", month: "long", year: "numeric" }) : ""].filter(Boolean).join(", ") }));
  if (s.scripture_refs) kids.push(h("p", { text: "Scripture: " + s.scripture_refs }));
  if (s.description) kids.push(h("p", { text: trim(s.description, 180) }));
  var act = []; if (s.video_url && !yid) act.push(btn("Watch", s.video_url, "btn-navy btn-sm", true)); if (s.audio_url) act.push(btn("Listen", s.audio_url, "btn-ghost btn-sm", true));
  if (act.length) kids.push(h("div", { "class": "actions" }, act));
  if (s.transcript) kids.push(h("details", null, [h("summary", { text: "Read transcript" }), h("p", { text: s.transcript, style: "white-space:pre-wrap;margin-top:.6rem" })]));
  return h("article", { "class": "card" }, kids);
}

/* ---------- HOME ---------- */
function pageHome(){
  var up = $("#home-programmes"), dv = $("#home-devo"), bd = $("#home-reading"), sm = $("#home-sermons"), gl = $("#home-gallery");
  getProgrammes().then(function(l){ var u = upcoming(l).slice(0, 3); clear(up); if (!u.length) up.appendChild(emptyBox("New programmes will be announced here", "We are preparing our upcoming gatherings. Please check back soon, or follow our channels for updates.", [btn("Follow our channels", "contact.html#channels", "btn-navy btn-sm")])); else { var g = h("div", { "class": "grid c3" }); u.forEach(function(p){ g.appendChild(progCard(p)); }); up.appendChild(g); } }).catch(function(){ errBox(up, "programmes"); });
  today().then(function(t){
    getDevos(t.ymd).then(function(l){ clear(dv); var d = l[0]; if (!d) { dv.appendChild(emptyBox("The next devotional is on its way", "No devotional has been published yet. Please check back soon.", [btn("Open the devotional page", "devotional.html", "btn-navy btn-sm")])); return; }
      var isToday = d.publish_date === t.ymd; var msg = d.title + " (" + dateOnly(d.publish_date, { day: "numeric", month: "long", year: "numeric" }) + ")\n" + pageUrl("devotional.html", "date=" + d.publish_date);
      dv.appendChild(h("div", { "class": "devo-card" }, [h("p", { "class": "meta", text: (isToday ? "Today, " : "Latest, ") + dateOnly(d.publish_date) }), h("h3", { text: d.title }), h("p", { "class": "meta", text: d.scripture_ref || "" }), h("p", { text: trim(d.message, 220) }),
        h("div", { "class": "hero-cta", style: "justify-content:flex-start" }, [btn("Read today's devotional", "devotional.html?date=" + d.publish_date, "btn-navy"), h("a", { "class": "btn btn-wa", href: "https://wa.me/?text=" + encodeURIComponent(msg), target: "_blank", rel: "noopener" }, [icon("whatsapp"), "Share on WhatsApp"])])])); }).catch(function(){ errBox(dv, "the devotional"); });
    dbList("reading_plan_overrides", "active=eq.true&select=*", []).then(function(o){ PLAN.setOverrides(o); }).catch(function(){}).then(function(){
      var r = PLAN.get(t.idx); clear(bd);
      bd.appendChild(h("div", { "class": "card" }, [h("p", { "class": "meta", text: "Day " + (t.idx + 1) + " of 365" }), h("h3", { text: "Old Testament: " + r.otText }), h("h3", { text: r.otherText }), h("p", { text: "Read slowly, pray over what you read, and write down one thing to obey today." }), h("div", { "class": "actions" }, [btn("Continue today's reading", "bible-plan.html", "btn-navy")])]));
    });
  });
  getSermons().then(function(l){ clear(sm); if (!l.length) { sm.appendChild(emptyBox("Messages will appear here", "Approved sermons and teachings will be added soon.", [btn("Visit our YouTube channel", (CFG.social.filter(function(s){ return s.key === "youtube"; })[0] || {}).url || "#", "btn-navy btn-sm", true)])); return; } var g = h("div", { "class": "grid c3" }); l.slice(0, 3).forEach(function(s){ g.appendChild(sermonCard(s)); }); sm.appendChild(g); }).catch(function(){ errBox(sm, "messages"); });
  getGallery().then(function(l){ clear(gl); if (!l.length) { gl.appendChild(emptyBox("Our gallery is being prepared", "Photographs from our gatherings will be shared here as they are approved.", null)); return; } var g = h("div", { "class": "gal" }); l.slice(0, 8).forEach(function(i){ g.appendChild(h("a", { href: "gallery.html", "aria-label": i.caption || "Gallery photograph", style: "display:block;aspect-ratio:1;border-radius:12px;overflow:hidden" }, [h("img", { src: i.image_url, alt: i.alt_text || i.caption || "TSC ministry photograph", loading: "lazy", style: "width:100%;height:100%;object-fit:cover" })])); }); gl.appendChild(g); }).catch(function(){ errBox(gl, "the gallery"); });
}

/* ---------- PLAN YOUR VISIT ---------- */
function pageVisit(){
  var st = $("#visit-times"), times = cfg("service_times") || [];
  clear(st);
  if (times.length) times.forEach(function(s){ st.appendChild(h("p", { text: s.name + ": " + s.day + ", " + s.time + (s.venue ? " (" + s.venue + ")" : "") })); });
  else st.appendChild(h("p", { text: "Service times and venues are announced with each gathering. Please check the Programmes page or ask us before you come." }));
  var pg = $("#visit-next");
  getProgrammes().then(function(l){ var u = upcoming(l).slice(0, 2); clear(pg); if (!u.length) { pg.appendChild(h("p", { text: "No gathering has been scheduled yet. Message us and we will tell you as soon as one is confirmed." })); return; } var g = h("div", { "class": "grid c2" }); u.forEach(function(p){ g.appendChild(progCard(p)); }); pg.appendChild(g); }).catch(function(){ errBox(pg, "programmes"); });
  var progSel = $("#v-programme"); if (progSel) getProgrammes().then(function(l){ upcoming(l).forEach(function(p){ progSel.appendChild(h("option", { value: p.title, text: p.title })); }); }).catch(function(){});
  bindForm($("#visitor-form"), { key: "visitor", table: "visitors", subject: "First-time visitor", success: "Thank you for letting us know. We look forward to welcoming you.", build: function(f){ return { row: { full_name: f.full_name, phone: f.phone || null, email: f.email || null, programme_text: f.programme_text || null, first_visit: f.first_visit === "yes", wants_info: !!f.wants_info, message: f.message || null, consent: !!f.consent } }; } });
}

/* ---------- PROGRAMMES ---------- */
function pageProgrammes(){
  var box = $("#programmes-list");
  getProgrammes().then(function(l){ var u = upcoming(l); clear(box); if (!u.length) { box.appendChild(emptyBox("No programmes are scheduled yet", "When a gathering is confirmed it will appear here with its date, time and venue. You can follow our channels or message us to be told first.", [waBtn("Ask on WhatsApp", "Hello TSC, please tell me about upcoming programmes."), btn("Follow our channels", "contact.html#channels", "btn-ghost")])); return; } var g = h("div", { "class": "grid c3" }); u.forEach(function(p){ g.appendChild(progCard(p)); }); box.appendChild(g); }).catch(function(){ errBox(box, "programmes"); });
}
function icsFor(p){
  function f(d){ return new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
  var esc = function(s){ return (s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;"); };
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//TSC//Website//EN", "BEGIN:VEVENT", "UID:" + p.id + "@tsc", "DTSTAMP:" + f(new Date()), "DTSTART:" + f(p.start_at), "DTEND:" + f(p.end_at || new Date(new Date(p.start_at).getTime() + 7200000)), "SUMMARY:" + esc(p.title), "LOCATION:" + esc([p.venue_name, p.venue_address].filter(Boolean).join(", ")), "DESCRIPTION:" + esc(trim(p.description, 300)), "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
function pageProgramme(){
  var box = $("#programme-detail"), id = param("id");
  if (!id) { clear(box); box.appendChild(emptyBox("Programme not found", "Please choose a programme from the list.", [btn("View programmes", "programmes.html")])); return; }
  getProgrammes().then(function(l){
    var p = l.filter(function(x){ return String(x.id) === id; })[0]; clear(box);
    if (!p) { box.appendChild(emptyBox("Programme not found", "This programme may have ended or been unpublished.", [btn("View programmes", "programmes.html")])); return; }
    document.title = p.title + " | Tabernacle of Solace Church";
    var st = progStatus(p, new Date()), where = [p.venue_name, p.venue_address].filter(Boolean).join(", ") || "Venue to be announced";
    var kids = [];
    if (p.banner_url) kids.push(h("img", { "class": "banner", src: p.banner_url, alt: p.title + " banner" }));
    kids.push(h("span", { "class": "badge " + st.cls, text: st.text }), h("h1", { text: p.title, style: "margin:.6rem 0 1rem;font-size:clamp(2.2rem,5vw,3.4rem)" }));
    var d = h("dl", { "class": "defs" }); [["Date", dt(p.start_at, { weekday: "long", day: "numeric", month: "long", year: "numeric" })], ["Time", timeRange(p.start_at, p.end_at)], ["Venue", where], ["Cost", p.is_paid ? (p.price_text || "Paid programme") : "Free"], ["Contact", p.contact_info || ""]].forEach(function(r){ if (r[1]) d.appendChild(h("div", null, [h("dt", { text: r[0] }), h("dd", { text: r[1] })])); });
    kids.push(d);
    if (p.map_url) kids.push(h("p", { style: "margin-top:1rem" }, [btn("Open map or directions", p.map_url, "btn-ghost btn-sm", true)]));
    kids.push(h("h2", { text: "About this programme", style: "font-size:1.8rem;margin:2rem 0 .6rem" }), h("p", { text: p.description || "", style: "white-space:pre-wrap" }));
    var cal = h("button", { "class": "btn btn-ghost btn-sm", type: "button", text: "Add to calendar" });
    cal.addEventListener("click", function(){ var b = new Blob([icsFor(p)], { type: "text/calendar" }); var a = h("a", { href: URL.createObjectURL(b), download: "tsc-programme.ics" }); document.body.appendChild(a); a.click(); a.remove(); });
    kids.push(h("div", { "class": "hero-cta", style: "justify-content:flex-start;margin-top:1.4rem" }, [cal, waBtn("Ask on WhatsApp", "Hello TSC, I have a question about: " + p.title)]));
    box.appendChild(h("div", null, kids));
    var reg = $("#register-wrap"); clear(reg);
    if (!p.registration_required) { reg.appendChild(h("p", { text: "No registration is needed for this programme. Just come." })); return; }
    reg.appendChild(h("h2", { text: "Register", id: "register", style: "font-size:2rem;margin-bottom:1rem" }));
    if (st.cls !== "ok") { reg.appendChild(h("div", { "class": "status info", text: st.text + "." })); return; }
    var qs = Array.isArray(p.custom_questions) ? p.custom_questions : [];
    var form = h("form", { "class": "card-form", id: "reg-form" }, [
      h("div", { "class": "row2" }, [h("div", { "class": "field" }, [h("label", { "for": "r_name", text: "Full name" }), h("input", { id: "r_name", name: "full_name", required: true, autocomplete: "name" })]), h("div", { "class": "field" }, [h("label", { "for": "r_phone", text: "Phone number" }), h("input", { id: "r_phone", name: "phone", type: "tel", required: true, pattern: "[0-9+\\s()-]{7,20}", autocomplete: "tel" })])]),
      h("div", { "class": "row2" }, [h("div", { "class": "field" }, [h("label", { "for": "r_email", text: "Email (optional)" }), h("input", { id: "r_email", name: "email", type: "email", autocomplete: "email" })]), h("div", { "class": "field" }, [h("label", { "for": "r_n", text: "Number of attendees" }), h("input", { id: "r_n", name: "attendees", type: "number", min: "1", max: "20", value: "1", required: true })])])
    ]);
    qs.forEach(function(q, i){ var lab = (typeof q === "string" ? q : q.label); var req = typeof q === "object" && q.required; form.appendChild(h("div", { "class": "field" }, [h("label", { "for": "q" + i, text: lab + (req ? "" : " (optional)") }), h("input", { id: "q" + i, name: "q" + i, "data-q": lab, required: req || null })])); });
    form.appendChild(h("label", { "class": "check" }, [h("input", { type: "checkbox", name: "consent", required: true }), h("span", { text: "I agree to be contacted by TSC about this programme, and I have read the Privacy Policy." })]));
    form.appendChild(h("button", { "class": "btn btn-navy", type: "submit", text: "Complete registration" }));
    reg.appendChild(form);
    if (SB && p.capacity) dbRpc("programme_spots", { pid: p.id }).then(function(n){ if (typeof n === "number") reg.insertBefore(h("p", { "class": "meta", text: n > 0 ? n + " places remaining" : "This programme is full" }), form); }).catch(function(){});
    var lastRef = "";
    bindForm(form, { key: "reg", table: "registrations", subject: "Registration: " + p.title, success: "Your registration has been received.",
      build: function(f){ var ans = {}; $$("[data-q]", form).forEach(function(i){ if (i.value.trim()) ans[i.getAttribute("data-q")] = i.value.trim(); }); lastRef = genRef(); return { row: { programme_id: p.id, reference: lastRef, full_name: f.full_name, phone: f.phone, email: f.email || null, attendees: parseInt(f.attendees, 10) || 1, answers: ans, consent: !!f.consent }, mailBody: "Programme: " + p.title + "\nName: " + f.full_name + "\nPhone: " + f.phone + "\nEmail: " + (f.email || "") + "\nAttendees: " + f.attendees + "\n" + Object.keys(ans).map(function(k){ return k + ": " + ans[k]; }).join("\n"), extra: function(){ return h("span", null, ["Your reference: ", h("strong", { text: lastRef }), ". Venue: " + where + ". Date: " + dt(p.start_at, { weekday: "long", day: "numeric", month: "long" }) + ", " + timeRange(p.start_at, p.end_at) + "."]); } }; } });
  }).catch(function(){ errBox(box, "this programme"); });
}

/* ---------- DEVOTIONAL ---------- */
function devoArticle(d, t){
  var url = pageUrl("devotional.html", "date=" + d.publish_date), msg = d.title + "\n" + url;
  var k = [h("p", { "class": "meta", text: dateOnly(d.publish_date) + (d.category ? ", " + d.category : "") }), h("h1", { text: d.title, style: "font-size:clamp(2.2rem,5vw,3.4rem);margin:.4rem 0 1rem" })];
  if (d.scripture_ref) k.push(h("p", { "class": "meta", text: "Key Scripture: " + d.scripture_ref }), h("p", null, [btn("Open " + d.scripture_ref + " in a Bible reader", PLAN.bibleUrl(d.scripture_ref, "KJV"), "btn-ghost btn-sm", true)]));
  if (d.scripture_text) k.push(h("blockquote", { "class": "scripture", text: d.scripture_text }));
  function sec(title, txt){ if (!txt) return; k.push(h("h2", { text: title })); String(txt).split(/\n{2,}/).forEach(function(p){ k.push(h("p", { text: p, style: "white-space:pre-wrap" })); }); }
  sec("Today's message", d.message); sec("Practical application", d.application); sec("Reflection question", d.reflection);
  if (d.prayer) k.push(h("div", { "class": "prayer-box" }, [h("h2", { text: "Closing prayer" }), h("p", { text: d.prayer, style: "white-space:pre-wrap;margin:0" })]));
  if (d.related_reading) { k.push(h("h2", { text: "Related reading" })); k.push(h("p", null, [btn(d.related_reading, PLAN.bibleUrl(d.related_reading, "KJV"), "btn-ghost btn-sm", true)])); }
  var copy = h("button", { "class": "btn btn-ghost", type: "button", text: "Copy link" }); copy.addEventListener("click", function(){ if (navigator.clipboard) navigator.clipboard.writeText(url).then(function(){ toast("Link copied"); }); });
  k.push(h("div", { "class": "hero-cta", style: "justify-content:flex-start;margin-top:2rem" }, [h("a", { "class": "btn btn-wa", href: "https://wa.me/?text=" + encodeURIComponent(msg), target: "_blank", rel: "noopener" }, [icon("whatsapp"), "Share on WhatsApp"]), copy]));
  return h("article", { "class": "article" }, k);
}
function pageDevotional(){
  var box = $("#devo-main"), arch = $("#devo-archive"), q = $("#devo-search");
  today().then(function(t){
    getDevos(t.ymd).then(function(list){
      clear(box); var want = param("date"), d = want ? list.filter(function(x){ return x.publish_date === want; })[0] : null;
      if (want && !d) { box.appendChild(emptyBox("No devotional was published for " + dateOnly(want, { day: "numeric", month: "long", year: "numeric" }), "Please choose another day from the archive below.", null)); }
      else if (!want) { d = list.filter(function(x){ return x.publish_date === t.ymd; })[0]; if (!d) { if (list[0]) box.appendChild(h("div", { "class": "status info", text: "No devotional has been published for today yet. Here is the latest one." })); else box.appendChild(emptyBox("No devotional has been published yet", "Please check back soon. Devotionals are published by the TSC team.", null)); d = list[0]; } }
      if (d) { box.appendChild(devoArticle(d, t)); document.title = d.title + " | TSC Daily Devotional"; }
      function drawArchive(){ clear(arch); var term = (q.value || "").toLowerCase(); var items = list.filter(function(x){ return !term || (x.title + " " + (x.scripture_ref || "") + " " + (x.category || "") + " " + x.publish_date).toLowerCase().indexOf(term) > -1; }).slice(0, 60); if (!items.length) { arch.appendChild(h("p", { "class": "loading", text: list.length ? "No devotionals match your search." : "The archive will fill as devotionals are published." })); return; } var ul = h("ul", { "class": "rows" }); items.forEach(function(x){ ul.appendChild(h("li", null, [h("div", null, [h("strong", { text: x.title, style: "font-family:var(--serif);font-size:1.4rem;color:var(--navy)" }), h("br"), h("span", { "class": "meta", text: dateOnly(x.publish_date, { day: "numeric", month: "long", year: "numeric" }) })]), h("p", null, [h("a", { "class": "textlink", href: "devotional.html?date=" + x.publish_date, text: x.scripture_ref || "Read" })])])); }); arch.appendChild(ul); }
      drawArchive(); q.addEventListener("input", drawArchive);
    }).catch(function(){ errBox(box, "the devotional"); });
  });
}

/* ---------- BIBLE PLAN ---------- */
function pageBible(){
  var el = $("#plan"), jump = $("#dayjump"), ver = store("tsc_ver") || "KJV", view = 0, todayIdx = 0, read = [];
  try { read = JSON.parse(store("tsc_read") || "[]"); } catch(e){ read = []; }
  function save(){ store("tsc_read", JSON.stringify(read)); }
  today().then(function(t){
    todayIdx = t.idx; view = todayIdx;
    dbList("reading_plan_overrides", "active=eq.true&select=*", []).catch(function(){ return []; }).then(function(o){ PLAN.setOverrides(o); draw(t); });
  });
  function draw(t){
    var g = PLAN.get(view), date = new Date(t.date.getTime() + (view - todayIdx) * 86400000), isToday = view === todayIdx; clear(el);
    var sel = h("select", { id: "verSel", "aria-label": "Bible version" }); ["KJV", "NKJV", "NIV", "ESV", "NLT"].forEach(function(v){ var o = h("option", { value: v, text: v }); if (v === ver) o.selected = true; sel.appendChild(o); }); sel.addEventListener("change", function(){ ver = sel.value; store("tsc_ver", ver); draw(t); });
    el.appendChild(h("div", { "class": "plan-head" }, [h("div", null, [h("p", { "class": "plan-date", text: (isToday ? "Today, " : "") + date.toLocaleDateString("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }) }), h("p", { "class": "plan-day", text: "Day " + (view + 1) + " of 365" })]), h("label", { "class": "meta", "for": "verSel", style: "display:flex;gap:.6rem;align-items:center" }, ["Bible version", sel])]));
    function block(l, text, q){ return h("div", { "class": "read" }, [h("p", { "class": "label", text: l }), h("p", { "class": "ref-big", text: text }), btn("Open reading", PLAN.bibleUrl(q, ver), "btn-navy", true)]); }
    el.appendChild(h("div", { "class": "reads" }, [block("Old Testament", g.otText, g.otQuery), block("Psalms, Proverbs and New Testament", g.otherText, g.otherQuery)]));
    var done = read.indexOf(view + 1) > -1;
    var prev = h("button", { "class": "btn btn-ghost btn-sm", type: "button", text: "Previous day" }), next = h("button", { "class": "btn btn-ghost btn-sm", type: "button", text: "Next day" });
    prev.disabled = view === 0; next.disabled = view === 364;
    prev.addEventListener("click", function(){ view--; draw(t); }); next.addEventListener("click", function(){ view++; draw(t); });
    var mark = h("button", { "class": "btn btn-sm " + (done ? "btn-navy" : "btn-gold"), type: "button", "aria-pressed": done ? "true" : "false", text: done ? "Completed" : "Mark as completed" });
    mark.addEventListener("click", function(){ var i = read.indexOf(view + 1); if (i > -1) read.splice(i, 1); else read.push(view + 1); save(); draw(t); });
    var msg = "Today's Bible reading (Day " + (view + 1) + "): " + g.otText + "; " + g.otherText + "\n" + pageUrl("bible-plan.html");
    var acts = [prev, next]; if (!isToday) { var bk = h("button", { "class": "btn btn-ghost btn-sm", type: "button", text: "Back to today" }); bk.addEventListener("click", function(){ view = todayIdx; draw(t); }); acts.push(bk); }
    acts.push(h("a", { "class": "btn btn-wa btn-sm", href: "https://wa.me/?text=" + encodeURIComponent(msg), target: "_blank", rel: "noopener" }, [icon("whatsapp"), "Share reading"]), h("span", { "class": "sp" }), mark);
    el.appendChild(h("div", { "class": "plan-actions" }, acts));
    var uniq = read.filter(function(n, i){ return n >= 1 && n <= 365 && read.indexOf(n) === i; }), pct = Math.round(uniq.length / 365 * 100), fill = h("i"); fill.style.width = pct + "%";
    var rs = h("button", { "class": "linkbtn", type: "button", text: "Reset my progress" }); rs.addEventListener("click", function(){ if (confirm("Reset your reading progress on this device?")) { read = []; save(); draw(t); } });
    el.appendChild(h("div", { "class": "plan-foot" }, [h("div", { "class": "bar", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "365", "aria-valuenow": String(uniq.length), "aria-label": "Reading progress" }, [fill]), h("div", { "class": "between" }, [h("span", { text: uniq.length + " days completed, " + (365 - uniq.length) + " remaining (" + pct + "%)" }), rs]), h("p", { "class": "help", text: "Your progress is saved on this device only." })]));
    clear(jump); for (var i = 0; i < 365; i++) (function(i){ var b = h("button", { type: "button", text: String(i + 1), "aria-label": "Go to day " + (i + 1) }); if (read.indexOf(i + 1) > -1) b.className = "done"; if (i === todayIdx) b.className += " today"; if (i === view) b.className += " cur"; b.addEventListener("click", function(){ view = i; draw(t); el.scrollIntoView({ behavior: "smooth", block: "start" }); }); jump.appendChild(b); })(i);
  }
}

/* ---------- NEW BELIEVERS ---------- */
function refLinks(refs){ var w = h("div", { "class": "refs" }); refs.forEach(function(r){ w.appendChild(h("a", { href: PLAN.bibleUrl(r, "KJV"), target: "_blank", rel: "noopener", text: r })); }); return w; }
function pageBelievers(){
  var box = $("#nb-main"), done = []; try { done = JSON.parse(store("tsc_lessons") || "[]"); } catch(e){}
  var n = parseInt(param("lesson"), 10), L = LESSONS.filter(function(x){ return x.n === n; })[0];
  function saveDone(){ store("tsc_lessons", JSON.stringify(done)); }
  clear(box);
  if (!L) {
    var list = h("div", { "class": "lesson-list" });
    LESSONS.forEach(function(x){ list.appendChild(h("a", { href: "new-believers.html?lesson=" + x.n }, [h("span", { "class": "n", text: String(x.n) }), h("div", null, [h("strong", { text: x.title }), h("span", { "class": "s", text: x.summary })]), h("span", { "class": "tick" + (done.indexOf(x.n) > -1 ? " done" : ""), "aria-label": done.indexOf(x.n) > -1 ? "Completed" : "Not completed" })])); });
    box.appendChild(h("p", { "class": "meta", text: done.length + " of " + LESSONS.length + " lessons completed (saved on this device)" })); box.appendChild(list); return;
  }
  document.title = "Lesson " + L.n + ": " + L.title + " | TSC New Believers' Centre";
  var k = [h("p", { "class": "meta", text: "Lesson " + L.n + " of " + LESSONS.length }), h("h1", { text: L.title, style: "font-size:clamp(2.2rem,5vw,3.4rem);margin:.3rem 0 1rem" }), h("p", { "class": "lede", text: L.summary })];
  k.push(h("h2", { text: "What you will learn" }), h("ul", null, L.objectives.map(function(o){ return h("li", { text: o }); })));
  k.push(h("h2", { text: "Scripture to read" }), refLinks(L.scripture));
  k.push(h("h2", { text: "Teaching" })); L.teaching.forEach(function(p){ if (typeof p === "string") k.push(h("p", { text: p })); else k.push(h("blockquote", { "class": "quote" }, [p.quote, h("cite", { text: p.ref })])); });
  k.push(h("h2", { text: "Practical examples" }), h("ul", null, L.examples.map(function(o){ return h("li", { text: o }); })));
  k.push(h("h2", { text: "Reflection questions" }), h("ol", null, L.reflection.map(function(o){ return h("li", { text: o }); })));
  k.push(h("div", { "class": "prayer-box" }, [h("h2", { text: "A short prayer" }), h("p", { text: L.prayer, style: "margin:0" })]));
  k.push(h("h2", { text: "Check your understanding (optional)" }));
  var qwrap = h("div"); L.quiz.forEach(function(q, qi){ var why = h("p", { "class": "why", "aria-live": "polite" }); var opts = q.options.map(function(o, oi){ var r = h("input", { type: "radio", name: "q" + qi, value: String(oi) }); r.addEventListener("change", function(){ var ok = oi === q.answer; why.className = "why " + (ok ? "good" : "bad"); why.textContent = (ok ? "Correct. " : "Not quite. ") + q.why; }); return h("label", null, [r, o]); }); qwrap.appendChild(h("div", { "class": "quiz-q" }, [h("p", { text: (qi + 1) + ". " + q.q })].concat(opts, [why]))); }); k.push(qwrap);
  var isDone = done.indexOf(L.n) > -1, mk = h("button", { "class": "btn " + (isDone ? "btn-navy" : "btn-gold"), type: "button", text: isDone ? "Completed" : "Mark lesson as completed" });
  mk.addEventListener("click", function(){ var i = done.indexOf(L.n); if (i > -1) done.splice(i, 1); else done.push(L.n); saveDone(); pageBelievers(); window.scrollTo(0, 0); });
  k.push(h("p", { style: "margin-top:1.6rem" }, [mk]));
  var pg = h("div", { "class": "pager" }, [L.n > 1 ? btn("Previous lesson", "new-believers.html?lesson=" + (L.n - 1), "btn-ghost") : h("span"), btn("All lessons", "new-believers.html", "btn-ghost"), L.n < LESSONS.length ? btn("Next lesson", "new-believers.html?lesson=" + (L.n + 1), "btn-navy") : h("span")]);
  k.push(pg);
  box.appendChild(h("div", { "class": "lesson article" }, k));
}
function bindWalk(){
  bindForm($("#walk-form"), { key: "walk", table: "new_believer_requests", subject: "I would like someone to walk with me", success: "Thank you. A TSC team member will reach out to you.", build: function(f){ return { row: { full_name: f.full_name, phone: f.phone || null, email: f.email || null, preferred_contact: f.preferred_contact || null, request_types: f.request_types || [], message: f.message || null, consent: !!f.consent } }; } });
}

/* ---------- SERMONS ---------- */
function pageSermons(){
  var box = $("#sermons-list"), chips = $("#sermon-cats"), q = $("#sermon-search"), cat = "";
  getSermons().then(function(l){
    function draw(){ clear(box); var term = (q.value || "").toLowerCase(); var items = l.filter(function(s){ return (!cat || s.category === cat) && (!term || (s.title + " " + (s.speaker || "") + " " + (s.scripture_refs || "") + " " + (s.description || "")).toLowerCase().indexOf(term) > -1); }); if (!items.length) { box.appendChild(l.length ? h("p", { "class": "loading", text: "No messages match your search." }) : emptyBox("Messages will be added soon", "Approved sermons and teachings will appear here. In the meantime, you can follow our channels.", [btn("Our channels", "contact.html#channels", "btn-navy btn-sm")])); return; } var g = h("div", { "class": "grid c3" }); items.forEach(function(s){ g.appendChild(sermonCard(s)); }); box.appendChild(g); }
    var cats = []; l.forEach(function(s){ if (s.category && cats.indexOf(s.category) < 0) cats.push(s.category); });
    clear(chips); if (cats.length) { ["All"].concat(cats).forEach(function(c){ var b = h("button", { "class": "chip", type: "button", text: c, "aria-pressed": (c === "All" && !cat) ? "true" : "false" }); b.addEventListener("click", function(){ cat = c === "All" ? "" : c; $$(".chip", chips).forEach(function(x){ x.setAttribute("aria-pressed", x.textContent === c ? "true" : "false"); }); draw(); }); chips.appendChild(b); }); }
    q.addEventListener("input", draw); draw();
  }).catch(function(){ errBox(box, "messages"); });
}

/* ---------- GALLERY ---------- */
function pageGallery(){
  var box = $("#gallery-grid"), chips = $("#gallery-cats"), cat = "", items = [], cur = 0;
  var lb = h("div", { "class": "lightbox", role: "dialog", "aria-modal": "true", "aria-label": "Photograph viewer" });
  var img = h("img", { alt: "" }), cap = h("figcaption"), fig = h("figure", { style: "margin:0;text-align:center" }, [img, cap]);
  var prev = h("button", { "class": "lb-btn lb-prev", type: "button", "aria-label": "Previous photograph", text: "\u2039" }), next = h("button", { "class": "lb-btn lb-next", type: "button", "aria-label": "Next photograph", text: "\u203A" }), close = h("button", { "class": "lb-btn lb-close", type: "button", "aria-label": "Close", text: "\u00D7" });
  [fig, prev, next, close].forEach(function(x){ lb.appendChild(x); }); document.body.appendChild(lb);
  function show(i){ cur = (i + items.length) % items.length; var it = items[cur]; img.src = it.image_url; img.alt = it.alt_text || it.caption || "TSC ministry photograph"; cap.textContent = [it.caption, it.event_name, it.event_date ? dateOnly(it.event_date, { day: "numeric", month: "long", year: "numeric" }) : ""].filter(Boolean).join(" | "); lb.classList.add("open"); close.focus(); }
  function hide(){ lb.classList.remove("open"); }
  prev.addEventListener("click", function(){ show(cur - 1); }); next.addEventListener("click", function(){ show(cur + 1); }); close.addEventListener("click", hide); lb.addEventListener("click", function(e){ if (e.target === lb) hide(); });
  document.addEventListener("keydown", function(e){ if (!lb.classList.contains("open")) return; if (e.key === "Escape") hide(); if (e.key === "ArrowLeft") show(cur - 1); if (e.key === "ArrowRight") show(cur + 1); });
  getGallery().then(function(all){
    function draw(){ clear(box); items = all.filter(function(i){ return !cat || i.category === cat; }); if (!items.length) { box.appendChild(emptyBox("Our gallery is being prepared", "Authentic photographs from TSC gatherings and ministry activities will be added here after they are approved.", null)); return; } var g = h("div", { "class": "gal" }); items.forEach(function(it, i){ var b = h("button", { type: "button", "aria-label": "Open photograph: " + (it.caption || it.alt_text || "TSC") }, [h("img", { src: it.thumb_url || it.image_url, alt: it.alt_text || it.caption || "TSC ministry photograph", loading: "lazy" })]); b.addEventListener("click", function(){ show(i); }); g.appendChild(b); }); box.appendChild(g); }
    var cats = []; all.forEach(function(i){ if (i.category && cats.indexOf(i.category) < 0) cats.push(i.category); });
    clear(chips); if (cats.length) ["All"].concat(cats).forEach(function(c){ var b = h("button", { "class": "chip", type: "button", text: c, "aria-pressed": (c === "All" && !cat) ? "true" : "false" }); b.addEventListener("click", function(){ cat = c === "All" ? "" : c; $$(".chip", chips).forEach(function(x){ x.setAttribute("aria-pressed", x.textContent === c ? "true" : "false"); }); draw(); }); chips.appendChild(b); });
    draw();
  }).catch(function(){ errBox(box, "the gallery"); });
}

/* ---------- MEMBERSHIP ---------- */
function pageMembership(){
  var dbox = $("#dept-checks");
  dbList("departments", "active=eq.true&select=name&order=name.asc", (CNT.departments || []).map(function(n){ return { name: n }; })).catch(function(){ return []; }).then(function(rows){
    clear(dbox); if (!rows.length) { dbox.appendChild(h("p", { "class": "help", text: "Departments will be listed here when TSC publishes them. You can mention an area of interest in the message box." })); return; }
    rows.forEach(function(r){ dbox.appendChild(h("label", { "class": "check" }, [h("input", { type: "checkbox", name: "departments", value: r.name, "data-multi": "1" }), h("span", { text: r.name })])); });
  });
  bindForm($("#member-form"), { key: "member", table: "members", subject: "Membership registration", success: "Thank you. Your membership registration has been received. A TSC representative will contact you.",
    build: function(f){ return { row: { full_name: f.full_name, phone: f.phone, email: f.email || null, area: f.area || null, preferred_contact: f.preferred_contact || null, faith_status: f.faith_status || null, interest_departments: (f.departments || []).join(", ") || null, message: f.message || null, consent: !!f.consent }, extra: function(){ return waBtn("Message us on WhatsApp", "Hello TSC, I have just registered as a member on your website."); } }; } });
}

/* ---------- PRAYER / TESTIMONY / CONTACT / GIVE ---------- */
function pagePrayer(){
  bindForm($("#prayer-form"), { key: "prayer", table: "prayer_requests", subject: "Prayer Request", success: "Thank you. Your prayer request has been received and will be handled privately by our pastoral team.",
    build: function(f){ return { row: { name: f.name || null, contact_method: f.contact_method || null, contact_detail: f.contact_detail || null, request: f.request, may_contact: !!f.may_contact, consent: !!f.consent }, mailBody: (f.name ? "Name: " + f.name + "\n" : "") + (f.contact_detail ? "Contact (" + (f.contact_method || "") + "): " + f.contact_detail + "\n" : "") + "\nPrayer request:\n" + f.request }; } });
}
function pageTestimony(){
  bindForm($("#testimony-form"), { key: "testimony", table: "testimonies", subject: "Testimony submission", success: "Thank you for sharing. Your testimony will be reviewed by our team. It will not be published without approval.",
    build: function(f){ if (!f.permission_publish) return null; return { row: { display_name: f.display_name || null, attribution: f.attribution || "anonymous", testimony: f.testimony, contact_detail: f.contact_detail || null, permission_publish: !!f.permission_publish }, mailBody: "Display name: " + (f.display_name || "") + "\nAttribution: " + (f.attribution || "") + "\nContact: " + (f.contact_detail || "") + "\n\nTestimony:\n" + f.testimony }; } });
  var box = $("#testimony-list"); if (!box) return;
  dbList("public_testimonies", "select=*&order=created_at.desc&limit=30", (CNT.testimonies || [])).then(function(l){ clear(box); if (!l.length) { box.appendChild(h("p", { "class": "help", text: "Approved testimonies will appear here." })); return; } l.forEach(function(x){ box.appendChild(h("blockquote", { "class": "quote" }, [x.text, h("cite", { text: x.author || "Anonymous" })])); }); }).catch(function(){ clear(box); });
}
function pageContact(){
  bindForm($("#contact-form"), { key: "contact", table: "contact_enquiries", subject: "Website enquiry", success: "Thank you. Your message has been received.", build: function(f){ return { row: { name: f.name, phone: f.phone || null, email: f.email || null, subject: f.subject || null, message: f.message, consent: !!f.consent } }; } });
}
function pageGive(){
  var g = CFG.giving || {}, box = $("#give-box"), rows = [["Bank", g.bankName], ["Account name", g.accountName], ["Account number", g.accountNumber]].filter(function(r){ return r[1]; });
  clear(box);
  if (rows.length) { var dl = h("dl"); rows.forEach(function(r){ var isNum = r[0] === "Account number", dd = h("dd", isNum ? { "class": "acct" } : null, [r[1]]); if (isNum) { var c = h("button", { "class": "copy", type: "button", text: "Copy" }); c.addEventListener("click", function(){ if (navigator.clipboard) navigator.clipboard.writeText(r[1]).then(function(){ toast("Account number copied"); }); }); dd.appendChild(c); } dl.appendChild(h("div", null, [h("dt", { text: r[0] }), dd])); }); box.appendChild(h("div", { "class": "give-box" }, [dl])); }
  if (g.onlineLink) box.appendChild(h("p", { style: "margin-top:1.4rem" }, [btn("Give online", g.onlineLink, "btn-gold", true)]));
  var cl = $("#give-cats"); clear(cl); (g.categories || []).forEach(function(c){ cl.appendChild(h("li", { text: c })); });
  var rc = $("#receipt"); clear(rc); if (cfg("whatsapp")) rc.appendChild(waBtn("Share your receipt on WhatsApp", "Hello, I have sent my giving to Tabernacle of Solace Church. Please find my receipt below."));
  bindForm($("#partner-form"), { key: "partner", table: "partnership_enquiries", subject: "Partnership enquiry", success: "Thank you. We will respond to your partnership enquiry.", build: function(f){ return { row: { full_name: f.full_name, phone: f.phone || null, email: f.email || null, interest: f.interest || null, message: f.message || null, consent: !!f.consent } }; } });
}

/* ---------- boot ---------- */
var pages = { home: pageHome, visit: pageVisit, programmes: pageProgrammes, programme: pageProgramme, devotional: pageDevotional, bible: pageBible, believers: function(){ pageBelievers(); bindWalk(); }, sermons: pageSermons, gallery: pageGallery, membership: pageMembership, prayer: pagePrayer, testimony: pageTestimony, contact: pageContact, give: pageGive };
initChrome(); bindChrome();
loadSettings().then(function(){ bindChrome(); if (pages[PAGE]) pages[PAGE](); }).catch(function(){ if (pages[PAGE]) pages[PAGE](); });
})();
