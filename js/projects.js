/* ===========================================================================
   Projects — rendered live from the GitHub API
   ---------------------------------------------------------------------------
   The cards already in the HTML are a static fallback. If the API call
   succeeds they are replaced with the real repository list (forks excluded,
   most-starred first, then most recently pushed).

   GitHub's unauthenticated API allows 60 requests/hour per IP, so on a busy
   shared address the fallback may be what visitors see. That is why the
   fallback is kept as real content rather than a placeholder.
   =========================================================================== */

(function () {
  var box = document.getElementById('site-projects');
  if (!box) return;

  var USER = 'GladiolusZhang';
  var MAX = 6;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function month(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.getFullYear() + '.' + ('0' + (d.getMonth() + 1)).slice(-2);
  }

  function card(repo) {
    var a = el('a', 'site-project');
    a.href = repo.html_url;
    a.target = '_blank';
    a.rel = 'noopener';

    a.appendChild(el('span', 'site-project-name', repo.name));
    if (repo.description) {
      a.appendChild(el('span', 'site-project-desc', repo.description));
    }

    var bits = [];
    if (repo.language) bits.push(repo.language);
    if (repo.stargazers_count) bits.push('★ ' + repo.stargazers_count);
    bits.push('updated ' + month(repo.pushed_at));
    a.appendChild(el('span', 'site-project-meta', bits.join(' · ')));

    return a;
  }

  fetch('https://api.github.com/users/' + USER + '/repos?per_page=100&sort=pushed', {
    headers: { 'Accept': 'application/vnd.github+json' },
  })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (repos) {
      if (!Array.isArray(repos)) throw new Error('unexpected payload');

      var list = repos
        .filter(function (r) { return !r.fork && !r.archived; })
        .sort(function (a, b) {
          var s = (b.stargazers_count || 0) - (a.stargazers_count || 0);
          if (s !== 0) return s;
          return new Date(b.pushed_at) - new Date(a.pushed_at);
        })
        .slice(0, MAX);

      if (!list.length) return;          // keep the fallback

      box.textContent = '';
      list.forEach(function (r) { box.appendChild(card(r)); });
    })
    .catch(function () { /* keep the static fallback already in the HTML */ });
})();
