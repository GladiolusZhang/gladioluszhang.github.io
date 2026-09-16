/* ===========================================================================
   Visitor tracking
   ---------------------------------------------------------------------------
   1. resolves the visitor's rough location from a public IP service
      (ipwho.is, falling back to ipinfo.io)
   2. renders a small "Your location" readout in the footer
   3. records the visit in Supabase, if configured

   The IP address itself is never stored — it is only used to look up the
   city/country, and is discarded as soon as that lookup returns.

   Everything is defensive: if anything fails the page carries on untouched.
   =========================================================================== */

(function () {
  var cfg = window.VISITOR_CONFIG || {};
  var TABLE = 'visits';

  function isConfigured() {
    return typeof cfg.supabaseUrl === 'string' &&
           typeof cfg.supabaseKey === 'string' &&
           cfg.supabaseUrl.indexOf('http') === 0 &&
           cfg.supabaseKey.length > 20;
  }

  /* ---------- 1 + 2. resolve and render ---------- */

  function render(place) {
    var el = document.getElementById('site-visitor');
    if (!el || !place) return;
    el.textContent = '';

    var label = document.createElement('span');
    label.className = 'site-visitor-label';
    label.textContent = 'Your location';
    el.appendChild(label);
    el.appendChild(document.createTextNode(' '));

    var value = document.createElement('b');
    value.textContent = place;
    el.appendChild(value);

    el.hidden = false;
  }

  function record(geo) {
    if (!isConfigured()) return;
    var payload = {
      city: geo.city || null,
      region: geo.region || null,
      country: geo.country || null,
      country_code: geo.country_code || null,
      lat: typeof geo.lat === 'number' ? geo.lat : null,
      lon: typeof geo.lon === 'number' ? geo.lon : null,
      path: location.pathname + location.hash,
      referrer: document.referrer || null,
      ua: navigator.userAgent || null,
    };

    fetch(cfg.supabaseUrl.replace(/\/+$/, '') + '/rest/v1/' + TABLE, {
      method: 'POST',
      headers: {
        'apikey': cfg.supabaseKey,
        'Authorization': 'Bearer ' + cfg.supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(function () { /* never surface a tracking failure */ });
  }

  function fromIpinfo() {
    fetch('https://ipinfo.io/json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d) return;
        var loc = (d.loc || '').split(',');
        var geo = {
          city: d.city, region: d.region, country: d.country,
          country_code: d.country,
          lat: loc.length === 2 ? parseFloat(loc[0]) : null,
          lon: loc.length === 2 ? parseFloat(loc[1]) : null,
        };
        render([d.city, d.country].filter(Boolean).join(', '));
        record(geo);
      })
      .catch(function () {});
  }

  if (typeof fetch === 'function') {
    fetch('https://ipwho.is/', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.success) { fromIpinfo(); return; }
        var geo = {
          city: d.city, region: d.region, country: d.country,
          country_code: d.country_code, lat: d.latitude, lon: d.longitude,
        };
        render([d.city, d.country].filter(Boolean).join(', '));
        record(geo);
      })
      .catch(fromIpinfo);
  }
})();
