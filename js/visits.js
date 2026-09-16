/* ===========================================================================
   Visitor dashboard — stats + map + recent-visit list
   ---------------------------------------------------------------------------
   Renders into any page containing the #vs-map / #vs-rows elements, so the
   same code drives both the homepage section and the standalone /visits page.

   Reads from Supabase when js/visitor-config.js is filled in; otherwise falls
   back to a demo dataset so the layout can be reviewed before setup.

   No IP addresses are stored or displayed.
   =========================================================================== */

(function () {
  var cfg = window.VISITOR_CONFIG || {};
  var TABLE = 'visits';

  if (!document.getElementById('vs-map') && !document.getElementById('vs-rows')) return;

  /* ---------- demo data (used only when Supabase is not configured) ------ */

  var DEMO = [
    ['2026-09-16T07:41:00Z', 'Los Angeles', 'California', 'United States', 'US', 34.05, -118.24, '/'],
    ['2026-09-16T06:12:00Z', "Xi'an", 'Shaanxi', 'China', 'CN', 34.34, 108.94, '/publications'],
    ['2026-09-16T03:55:00Z', 'Urbana', 'Illinois', 'United States', 'US', 40.11, -88.20, '/'],
    ['2026-09-15T22:18:00Z', 'Waterloo', 'Ontario', 'Canada', 'CA', 43.46, -80.52, '/visits'],
    ['2026-09-15T19:02:00Z', 'Tokyo', 'Tokyo', 'Japan', 'JP', 35.68, 139.69, '/'],
    ['2026-09-15T15:47:00Z', 'Daejeon', 'Daejeon', 'South Korea', 'KR', 36.35, 127.38, '/'],
    ['2026-09-15T11:30:00Z', 'Zurich', 'Zurich', 'Switzerland', 'CH', 47.37, 8.54, '/'],
    ['2026-09-15T08:21:00Z', 'Cambridge', 'Massachusetts', 'United States', 'US', 42.37, -71.11, '/'],
    ['2026-09-14T20:09:00Z', 'Shanghai', 'Shanghai', 'China', 'CN', 31.23, 121.47, '/'],
    ['2026-09-14T13:44:00Z', 'Manchester', 'England', 'United Kingdom', 'GB', 53.48, -2.24, '/'],
    ['2026-09-14T09:15:00Z', 'Singapore', 'Singapore', 'Singapore', 'SG', 1.35, 103.82, '/'],
    ['2026-09-13T17:03:00Z', 'Beijing', 'Beijing', 'China', 'CN', 39.90, 116.41, '/'],
    ['2026-09-13T10:38:00Z', 'Dublin', 'Leinster', 'Ireland', 'IE', 53.35, -6.26, '/'],
    ['2026-09-12T21:50:00Z', 'Sydney', 'New South Wales', 'Australia', 'AU', -33.87, 151.21, '/'],
    ['2026-09-12T16:26:00Z', 'Berlin', 'Berlin', 'Germany', 'DE', 52.52, 13.40, '/'],
  ].map(function (r) {
    return {
      created_at: r[0], city: r[1], region: r[2], country: r[3],
      country_code: r[4], lat: r[5], lon: r[6], path: r[7],
    };
  });

  /* ---------- helpers ---------------------------------------------------- */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function configured() {
    return typeof cfg.supabaseUrl === 'string' &&
           typeof cfg.supabaseKey === 'string' &&
           cfg.supabaseUrl.indexOf('http') === 0 &&
           cfg.supabaseKey.length > 20;
  }

  function fmtTime(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return iso || '';
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
           ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function flag(code) {
    if (!code || code.length !== 2) return '';
    return String.fromCodePoint(
      0x1F1E6 + code.toUpperCase().charCodeAt(0) - 65,
      0x1F1E6 + code.toUpperCase().charCodeAt(1) - 65
    );
  }

  /* ---------- stats ------------------------------------------------------ */

  function computeStats(rows) {
    var countries = {}, cities = {}, cutoff = Date.now() - 864e5, recent = 0;
    rows.forEach(function (r) {
      if (r.country) countries[r.country] = 1;
      if (r.city) cities[r.city] = 1;
      if (r.created_at && new Date(r.created_at).getTime() > cutoff) recent++;
    });
    return {
      total: rows.length,
      countries: Object.keys(countries).length,
      cities: Object.keys(cities).length,
      recent: recent,
    };
  }

  function renderStats(s) {
    var map = { 'vs-total': s.total, 'vs-countries': s.countries,
                'vs-cities': s.cities, 'vs-today': s.recent };
    Object.keys(map).forEach(function (id) {
      var n = document.getElementById(id);
      if (n) n.textContent = map[id];
    });
  }

  /* ---------- map -------------------------------------------------------- */

  function renderMap(rows) {
    var box = document.getElementById('vs-map');
    if (!box) return;

    if (typeof L === 'undefined') {
      box.appendChild(el('p', 'vs-map-fallback',
        'The map could not load. The list below still works.'));
      box.classList.add('is-fallback');
      return;
    }

    var map = L.map(box, { scrollWheelZoom: false, attributionControl: true })
      .setView([25, 10], 2);

    // Esri "World Light Gray Canvas" — no API key, and light enough to match
    // the rest of the page. Note the ArcGIS {z}/{y}/{x} ordering.
    // (CARTO's basemaps now render an "API KEY REQUIRED" watermark.)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/' +
      'World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16,
      }
    ).addTo(map);

    // aggregate by rounded coordinates so repeat visitors stack up
    var cells = {};
    rows.forEach(function (r) {
      if (typeof r.lat !== 'number' || typeof r.lon !== 'number') return;
      var key = r.lat.toFixed(1) + ',' + r.lon.toFixed(1);
      if (!cells[key]) cells[key] = { lat: r.lat, lon: r.lon, n: 0, place: [] };
      cells[key].n++;
      var label = [r.city, r.country].filter(Boolean).join(', ');
      if (label && cells[key].place.indexOf(label) === -1) cells[key].place.push(label);
    });

    var points = Object.keys(cells).map(function (k) { return cells[k]; });
    var max = points.reduce(function (m, p) { return Math.max(m, p.n); }, 1);

    points.forEach(function (p) {
      var radius = 2.5 + 6 * Math.sqrt(p.n / max);   // 2.5px … 8.5px
      L.circleMarker([p.lat, p.lon], {
        radius: radius,
        color: '#1f6fb2',
        weight: 1,
        opacity: 0.75,
        fillColor: '#1f6fb2',
        fillOpacity: 0.22,
      }).addTo(map).bindPopup(
        '<b>' + p.place.slice(0, 3).join(' · ') + '</b><br>' +
        p.n + ' visit' + (p.n > 1 ? 's' : '')
      );
    });

    if (points.length) {
      map.fitBounds(points.map(function (p) { return [p.lat, p.lon]; }),
                    { padding: [34, 34], maxZoom: 4 });
    }
  }

  /* ---------- table ------------------------------------------------------ */

  function renderTable(rows) {
    var body = document.getElementById('vs-rows');
    if (!body) return;
    body.textContent = '';

    var limit = Math.min(rows.length, 60);
    for (var i = 0; i < limit; i++) {
      var r = rows[i];
      var tr = document.createElement('tr');
      tr.appendChild(el('td', 'vs-td-time', fmtTime(r.created_at)));

      var place = [r.city, r.region, r.country].filter(Boolean).join(', ');
      var tdPlace = el('td', 'vs-td-place');
      tdPlace.appendChild(el('span', 'vs-flag', flag(r.country_code)));
      tdPlace.appendChild(document.createTextNode(' ' + (place || '—')));
      tr.appendChild(tdPlace);

      body.appendChild(tr);
    }

    if (!rows.length) {
      var tr2 = document.createElement('tr');
      var td = el('td', 'vs-empty', 'No visits recorded yet.');
      td.colSpan = 2;
      tr2.appendChild(td);
      body.appendChild(tr2);
    }
  }

  /* ---------- boot ------------------------------------------------------- */

  function note(text, warn) {
    var n = document.getElementById('vs-note');
    if (!n) return;
    n.textContent = text;
    if (warn) n.className = 'vs-note is-warn';
  }

  function start(rows, demo) {
    renderStats(computeStats(rows));
    renderMap(rows);
    renderTable(rows);
    note(demo
      ? 'Demo data — tracking is not configured yet. Add your Supabase URL and anon key to js/visitor-config.js to go live.'
      : 'Showing the most recent ' + Math.min(rows.length, 60) + ' of ' + rows.length + ' recorded visits.',
      demo);
  }

  if (!configured()) { start(DEMO, true); return; }

  var url = cfg.supabaseUrl.replace(/\/+$/, '') + '/rest/v1/' + TABLE +
            '?select=created_at,city,region,country,country_code,lat,lon,path' +
            '&order=created_at.desc&limit=' + (cfg.fetchLimit || 1000);

  fetch(url, {
    headers: {
      'apikey': cfg.supabaseKey,
      'Authorization': 'Bearer ' + cfg.supabaseKey,
    },
  })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (rows) { start(Array.isArray(rows) ? rows : [], false); })
    .catch(function (e) {
      start([], false);
      note('Could not reach the visit database (' + e.message + '). Showing an empty list.', true);
    });
})();
