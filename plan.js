/* 365-day Bible reading plan. Covers all 1,189 chapters exactly once.
   Track 1: Old Testament (without Psalms and Proverbs).
   Track 2: New Testament interleaved with Psalms and Proverbs.
   Dates use Africa/Lagos and, where possible, the web server's clock rather than the visitor's device clock. */
window.TSC_PLAN = (function(){
  var OT = [["Genesis",50],["Exodus",40],["Leviticus",27],["Numbers",36],["Deuteronomy",34],["Joshua",24],["Judges",21],["Ruth",4],["1 Samuel",31],["2 Samuel",24],["1 Kings",22],["2 Kings",25],["1 Chronicles",29],["2 Chronicles",36],["Ezra",10],["Nehemiah",13],["Esther",10],["Job",42],["Ecclesiastes",12],["Song of Solomon",8],["Isaiah",66],["Jeremiah",52],["Lamentations",5],["Ezekiel",48],["Daniel",12],["Hosea",14],["Joel",3],["Amos",9],["Obadiah",1],["Jonah",4],["Micah",7],["Nahum",3],["Habakkuk",3],["Zephaniah",3],["Haggai",2],["Zechariah",14],["Malachi",4]];
  var NT = [["Matthew",28],["Mark",16],["Luke",24],["John",21],["Acts",28],["Romans",16],["1 Corinthians",16],["2 Corinthians",13],["Galatians",6],["Ephesians",6],["Philippians",4],["Colossians",4],["1 Thessalonians",5],["2 Thessalonians",3],["1 Timothy",6],["2 Timothy",4],["Titus",3],["Philemon",1],["Hebrews",13],["James",5],["1 Peter",5],["2 Peter",3],["1 John",5],["2 John",1],["3 John",1],["Jude",1],["Revelation",22]];
  var WIS = [["Psalm",150],["Proverbs",31]];
  function chapters(list){ var out = []; list.forEach(function(b){ for (var c = 1; c <= b[1]; c++) out.push([b[0], c]); }); return out; }
  var T1 = chapters(OT), N = chapters(NT), W = chapters(WIS);
  var DAYS = 365, days = [], nPtr = 0, wPtr = 0, aIndex = 0;
  var extra = W.length - (DAYS - N.length);
  for (var d = 0; d < DAYS; d++) {
    var t1 = T1.slice(Math.floor(d * T1.length / DAYS), Math.floor((d + 1) * T1.length / DAYS));
    var hasN = Math.floor((d + 1) * N.length / DAYS) > Math.floor(d * N.length / DAYS);
    var t2 = [];
    if (hasN) {
      t2.push(N[nPtr++]);
      var hasW = Math.floor((aIndex + 1) * extra / N.length) > Math.floor(aIndex * extra / N.length);
      aIndex++;
      if (hasW) t2.push(W[wPtr++]);
    } else { t2.push(W[wPtr++]); }
    days.push({ ot: t1, other: t2 });
  }
  function group(items){
    var out = [];
    items.forEach(function(it){
      var last = out[out.length - 1];
      if (last && last.book === it[0] && last.to + 1 === it[1]) last.to = it[1];
      else out.push({ book: it[0], from: it[1], to: it[1] });
    });
    return out;
  }
  function label(items, sep){
    return group(items).map(function(g){
      var name = (g.book === "Psalm" && g.from !== g.to) ? "Psalms" : g.book;
      return name + " " + (g.from === g.to ? g.from : g.from + sep + g.to);
    }).join("; ");
  }
  var overrides = {};
  function get(i){
    var x = days[i], o = overrides[i + 1];
    var r = { otText: label(x.ot, "\u2013"), otQuery: label(x.ot, "-"), otherText: label(x.other, "\u2013"), otherQuery: label(x.other, "-"), custom: false };
    if (o) {
      if (o.ot_text) { r.otText = o.ot_text; r.otQuery = o.ot_text.replace(/\u2013/g, "-"); r.custom = true; }
      if (o.other_text) { r.otherText = o.other_text; r.otherQuery = o.other_text.replace(/\u2013/g, "-"); r.custom = true; }
    }
    return r;
  }
  function lagosParts(date, tz){
    var p = new Intl.DateTimeFormat("en-CA", { timeZone: tz || "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    var o = {}; p.forEach(function(x){ o[x.type] = x.value; });
    return { y: +o.year, m: +o.month, d: +o.day };
  }
  function ymd(p){ return p.y + "-" + (p.m < 10 ? "0" : "") + p.m + "-" + (p.d < 10 ? "0" : "") + p.d; }
  function dayIndexFor(date, tz){
    var p = lagosParts(date, tz);
    var doy = Math.round((Date.UTC(p.y, p.m - 1, p.d) - Date.UTC(p.y, 0, 1)) / 86400000);
    return Math.min(DAYS - 1, doy);
  }
  var trusted = null;
  function now(){
    if (trusted) return Promise.resolve(new Date(Date.now() + trusted));
    if (typeof fetch !== "function") return Promise.resolve(new Date());
    return fetch(String(location.href || "").split("#")[0], { method: "HEAD", cache: "no-store" }).then(function(r){
      var h = r.headers.get("Date"); var t = h ? new Date(h).getTime() : NaN;
      if (!isNaN(t)) { trusted = t - Date.now(); return new Date(t); }
      return new Date();
    }).catch(function(){ return new Date(); });
  }
  return {
    total: DAYS, counts: { ot: T1.length, nt: N.length, wis: W.length },
    get: get, setOverrides: function(rows){ overrides = {}; (rows || []).forEach(function(r){ if (r.active !== false) overrides[r.day] = r; }); },
    lagosParts: lagosParts, ymd: ymd, dayIndexFor: dayIndexFor, now: now,
    bibleUrl: function(q, ver){ return "https://www.biblegateway.com/passage/?search=" + encodeURIComponent(q) + "&version=" + encodeURIComponent(ver || "KJV"); }
  };
})();
