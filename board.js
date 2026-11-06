// Hero demo board. All values are real engine output recorded on the test devices.
(function () {
  var COLS = 'ABCDEFGHIJKLMNO';
  var OPENING = ['H8', 'G9', 'G7', 'I9', 'F7', 'F9', 'E9', 'I8'];

  var MODES = {
    rapfi: {
      moves: OPENING,
      evals: [['H9', '425', true], ['J9', '269'], ['I10', '196'], ['I7', '-303']],
      reading: '<b>Rapfi · 深度 24</b>黑方最佳点 H9，估值 425。主要路线：H9 G8 I6 E10 D11 I10 I11 G12',
    },
    katago: {
      moves: OPENING,
      heat: [
        ['H9', '81.0%', '483', 1], ['J9', '72.3%', '321', 2], ['I10', '73.8%', '17', 3],
        ['F8', '10.7%', '1', 4], ['I7', '24.7%', '1', 5], ['E8', '3.3%', '1', 6],
        ['H6', '6.1%', '1', 7], ['H7', '2.5%', '1', 8], ['E7', '3.1%', '1', 9],
      ],
      reading: '<b>KataGo · 862 visits</b>第一候选 H9，黑方胜率 81.0%。圆点内是胜率和 visits。',
    },
    forbid: {
      moves: ['G8', 'A1', 'H8', 'A3', 'I9', 'A5', 'I10', 'C1'],
      forbid: ['I8'],
      reading: '<b>有禁手规则</b>黑棋走 I8 会形成双三，棋盘显示 ✕，点击时弹窗提示，不会落子。',
    },
    kill: {
      moves: ['H8', 'A15', 'I8', 'A14', 'J8', 'G8'],
      kill: [['H7', '+M13']],
      reading: '<b>分析数据库</b>黑棋走 H7，数据库已证明 13 手内必胜。下次遇到这个局面直接显示。',
    },
  };

  var CELL = 40;
  var ORIGIN = 40;
  var SIZE = 640;

  function pt(name) {
    return {
      x: ORIGIN + COLS.indexOf(name[0]) * CELL,
      y: ORIGIN + (15 - Number(name.slice(1))) * CELL,
    };
  }

  function grid() {
    var s = '';
    for (var i = 0; i < 15; i++) {
      var p = ORIGIN + i * CELL;
      var edge = i === 0 || i === 14 ? 2 : 1;
      s += '<line x1="' + p + '" y1="40" x2="' + p + '" y2="600" stroke-width="' + edge + '"/>';
      s += '<line x1="40" y1="' + p + '" x2="600" y2="' + p + '" stroke-width="' + edge + '"/>';
    }
    var stars = ['D12', 'L12', 'H8', 'D4', 'L4'];
    var dots = stars.map(function (n) {
      var c = pt(n);
      return '<circle cx="' + c.x + '" cy="' + c.y + '" r="3.5" fill="#2b2113" stroke="none"/>';
    }).join('');
    var labels = '';
    for (var k = 0; k < 15; k++) {
      labels += '<text x="' + (ORIGIN + k * CELL) + '" y="625" class="coord">' + COLS[k] + '</text>';
      labels += '<text x="17" y="' + (ORIGIN + k * CELL + 4) + '" class="coord">' + (15 - k) + '</text>';
    }
    return '<g class="lines" stroke="#2b2113">' + s + '</g>' + dots + labels;
  }

  function stones(moves) {
    return moves.map(function (m, i) {
      var c = pt(m);
      var black = i % 2 === 0;
      var last = i === moves.length - 1;
      return '<circle cx="' + c.x + '" cy="' + c.y + '" r="18.5" fill="url(#' + (black ? 'sb' : 'sw') + ')" filter="url(#stone-shadow)"/>' +
        '<text x="' + c.x + '" y="' + (c.y + 5) + '" class="num" fill="' + (last ? '#d9432f' : black ? '#fff' : '#111') + '">' + (i + 1) + '</text>';
    }).join('');
  }

  function overlay(mode) {
    var out = '';
    (mode.evals || []).forEach(function (e) {
      var c = pt(e[0]);
      out += '<rect x="' + (c.x - 19) + '" y="' + (c.y - 13) + '" width="38" height="26" rx="4" fill="#e3b768"/>' +
        '<text x="' + c.x + '" y="' + (c.y + 5) + '" class="eval" fill="' + (e[2] ? '#c8301d' : '#2b48c9') + '">' + e[1] + '</text>';
    });
    (mode.heat || []).forEach(function (h) {
      var c = pt(h[0]);
      var best = h[3] === 1;
      out += '<circle cx="' + c.x + '" cy="' + c.y + '" r="18.5" fill="' + (best ? '#35b9d5' : '#9ae62b') + '"/>' +
        '<text x="' + c.x + '" y="' + (c.y - 1) + '" class="heat" fill="#10220a">' + h[1] + '</text>' +
        '<text x="' + c.x + '" y="' + (c.y + 10) + '" class="heat" fill="#10220a">' + h[2] + '</text>' +
        '<circle cx="' + (c.x - 13) + '" cy="' + (c.y - 13) + '" r="7.5" fill="#18202a"/>' +
        '<text x="' + (c.x - 13) + '" y="' + (c.y - 9.5) + '" class="rank" fill="#fff">' + h[3] + '</text>';
    });
    (mode.forbid || []).forEach(function (f) {
      var c = pt(f);
      out += '<g stroke="#d9432f" stroke-width="5" stroke-linecap="round">' +
        '<line x1="' + (c.x - 10) + '" y1="' + (c.y - 10) + '" x2="' + (c.x + 10) + '" y2="' + (c.y + 10) + '"/>' +
        '<line x1="' + (c.x + 10) + '" y1="' + (c.y - 10) + '" x2="' + (c.x - 10) + '" y2="' + (c.y + 10) + '"/></g>';
    });
    (mode.kill || []).forEach(function (k) {
      var c = pt(k[0]);
      out += '<rect x="' + (c.x - 22) + '" y="' + (c.y - 15) + '" width="44" height="30" rx="4" fill="#f4dfa6"/>' +
        '<text x="' + c.x + '" y="' + (c.y + 5.5) + '" class="eval" fill="#d31a0c">' + k[1] + '</text>';
    });
    return out;
  }

  var DEFS = '<defs>' +
    '<radialGradient id="sb" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#5a6266"/><stop offset="0.45" stop-color="#1b1f21"/><stop offset="1" stop-color="#050606"/></radialGradient>' +
    '<radialGradient id="sw" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#eeece6"/><stop offset="1" stop-color="#c4c0b6"/></radialGradient>' +
    '<linearGradient id="wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ecc77a"/><stop offset="0.55" stop-color="#e0b566"/><stop offset="1" stop-color="#d3a551"/></linearGradient>' +
    '<filter id="stone-shadow" x="-30%" y="-30%" width="170%" height="170%"><feDropShadow dx="1.5" dy="2.5" stdDeviation="2" flood-color="#3a2a10" flood-opacity="0.55"/></filter>' +
    '</defs>';

  var board = document.getElementById('board');
  var reading = document.getElementById('reading');
  var buttons = document.querySelectorAll('.demo-tabs button');

  function show(name) {
    var mode = MODES[name];
    board.innerHTML = '<svg viewBox="0 0 ' + SIZE + ' ' + SIZE + '" role="img" aria-label="棋盘演示">' + DEFS +
      '<rect width="' + SIZE + '" height="' + SIZE + '" rx="10" fill="url(#wood)"/>' + grid() + stones(mode.moves) +
      '<g class="overlay">' + overlay(mode) + '</g></svg>';
    reading.innerHTML = mode.reading;
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === name)); });
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { show(b.dataset.mode); });
  });
  show('rapfi');
})();
