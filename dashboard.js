/* global TrelloPowerUp, WALKER_FIELDS */
var t = TrelloPowerUp.iframe();
var FIELDS = window.WALKER_FIELDS || {};

function money(n) {
  if (n == null || n === "" || isNaN(Number(n))) return "—";
  return "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseDue(iso) {
  if (!iso) return { text: "—", cls: "" };
  var d = new Date(iso);
  var txt = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  var now = new Date();
  var days = (d - now) / 86400000;
  if (days < 0) return { text: txt, cls: "due-over" };
  if (days <= 2) return { text: txt, cls: "due-soon" };
  return { text: txt, cls: "" };
}

function fieldMap(items) {
  var out = {};
  (items || []).forEach(function (it) {
    out[it.idCustomField] = it;
  });
  return out;
}

function outcomeOf(map) {
  var item = map[FIELDS.outcome];
  if (!item) return "";
  if (item.idValue && FIELDS.outcomeOptions[item.idValue]) return FIELDS.outcomeOptions[item.idValue];
  return (item.value && (item.value.text || item.value)) || "";
}

function quoteOf(map) {
  var item = map[FIELDS.quote];
  if (!item || !item.value) return null;
  return item.value.number != null ? item.value.number : item.value;
}

function clientOf(map) {
  var item = map[FIELDS.client];
  if (!item || !item.value) return "";
  return item.value.text || "";
}

function hideGuide(listName, cardName) {
  if (listName === "Guide") return true;
  if (cardName === "How this board works" || cardName === "Pricing dashboard") return true;
  return false;
}

function chip(label, value) {
  return '<div class="chip"><b>' + value + "</b><span>" + label + "</span></div>";
}

function draw(boardName, lists, cards, source) {
  var listName = {};
  (lists || []).forEach(function (l) {
    listName[l.id] = l.name || l.listName;
  });
  var rows = (cards || []).filter(function (c) {
    var stage = listName[c.idList] || c.listName || "";
    return !hideGuide(stage, c.name);
  });
  var totals = { count: 0, quote: 0, byOutcome: {} };
  var html = rows
    .map(function (c) {
      var map = fieldMap(c.customFieldItems);
      var stage = listName[c.idList] || c.listName || "";
      var outcome = c.outcome || outcomeOf(map) || (stage === "Submitted" ? "Submitted" : "Open");
      var quote = c.quote != null ? c.quote : quoteOf(map);
      var client = c.client || clientOf(map);
      var due = parseDue(c.due);
      totals.count += 1;
      if (quote != null) totals.quote += Number(quote);
      totals.byOutcome[outcome] = (totals.byOutcome[outcome] || 0) + 1;
      return (
        "<tr>" +
        '<td><a href="' + (c.url || "#") + '" target="_blank" rel="noreferrer">' + c.name + "</a></td>" +
        "<td>" + stage + "</td>" +
        '<td class="out-' + outcome + '">' + outcome + "</td>" +
        '<td class="num">' + money(quote) + "</td>" +
        '<td class="' + due.cls + '">' + due.text + "</td>" +
        "<td>" + (client || "—") + "</td>" +
        "</tr>"
      );
    })
    .join("");
  document.getElementById("rows").innerHTML = html || '<tr><td colspan="6" class="empty">No live jobs on this board.</td></tr>';
  document.getElementById("stamp").textContent = boardName + " · " + totals.count + " jobs" + (source ? " · " + source : "");
  var chips = [chip("Jobs", String(totals.count)), chip("Quoted", money(totals.quote))];
  ["Open", "Submitted", "Won", "Lost", "Cashed", "Declined"].forEach(function (k) {
    if (totals.byOutcome[k]) chips.push(chip(k, String(totals.byOutcome[k])));
  });
  document.getElementById("chips").innerHTML = chips.join("");
}

function snapshot() {
  return fetch("./data.json?v=3")
    .then(function (r) {
      if (!r.ok) throw new Error("snapshot " + r.status);
      return r.json();
    })
    .then(function (data) {
      draw(data.board || "Walker Tenders", data.lists || [], data.cards || [], "snapshot");
    });
}

function live() {
  return Promise.all([
    t.board("id", "name"),
    t.lists("id", "name"),
    t.cards("id", "name", "idList", "due", "url", "shortUrl"),
  ]).then(function (parts) {
    draw((parts[0] && parts[0].name) || "Walker Tenders", parts[1], parts[2], "live");
    return t
      .cards("id", "name", "idList", "due", "url", "shortUrl", "customFieldItems")
      .then(function (cards) {
        draw((parts[0] && parts[0].name) || "Walker Tenders", parts[1], cards, "live");
      })
      .catch(function () {
        return null;
      });
  });
}

function go() {
  return live()
    .catch(function () {
      return snapshot();
    })
    .then(function () {
      return t.sizeTo("body").catch(function () {
        return null;
      });
    })
    .catch(function (err) {
      var msg = (err && (err.message || String(err))) || "unknown error";
      document.getElementById("stamp").textContent = "Could not read the board";
      document.getElementById("rows").innerHTML =
        '<tr><td colspan="6" class="empty error">Could not load jobs (' +
        String(msg).replace(/[<>]/g, "") +
        ").</td></tr>";
    });
}

if (t.render) {
  t.render(go);
} else {
  go();
}
