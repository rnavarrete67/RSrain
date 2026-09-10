/**
 * Address autocomplete for the Elementor Pro lead forms on rsraingutters.com.
 *
 * Attaches a Google Places (New) suggestion dropdown to every "Address" field.
 * Picking a suggestion fills Address, City and ZIP. Typing without picking still
 * works exactly as before, so the existing fields, validation and Turnstile are
 * untouched. Google is only loaded the first time someone focuses an Address field.
 *
 * Install: Elementor > Custom Code > Add New. Location "body end",
 * condition "Entire Site". Wrap this file in an opening and closing script tag.
 * (Never write the closing script tag literally anywhere in this file,
 * including comments: the browser would end the script there.)
 * Replace GOOGLE_KEY with the API key (restricted to rsraingutters.com,
 * APIs: Maps JavaScript API + Places API (New)).
 */
(function () {
  var GOOGLE_KEY = 'PASTE_YOUR_GOOGLE_API_KEY_HERE';
  var BIAS = { center: { lat: 43.60, lng: -116.39 }, radius: 50000 }; // Treasure Valley, 50 km (Google max)
  var SEL = {
    address: 'input[name="form_fields[address]"]',
    city: 'input[name="form_fields[city]"]',
    zip: 'input[name="form_fields[zip]"]'
  };

  /* ---------- 1. Browser autofill hints (free, no Google needed) ---------- */
  var hints = {
    'form_fields[name]': 'name', 'form_fields[phone]': 'tel', 'form_fields[email]': 'email',
    'form_fields[phone_email]': 'on', 'form_fields[address]': 'street-address',
    'form_fields[city]': 'address-level2', 'form_fields[zip]': 'postal-code'
  };
  Object.keys(hints).forEach(function (n) {
    document.querySelectorAll('input[name="' + n + '"]').forEach(function (el) { el.setAttribute('autocomplete', hints[n]); });
  });

  /* ---------- 2. Google Places suggestions ---------- */
  var loading = null, places = null;
  function report(where) { return function (err) { if (window.console) console.error('[address-autocomplete] ' + where + ':', err); }; }
  function loadGoogle() {
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      if (window.google && google.maps && google.maps.importLibrary) return resolve();
      var s = document.createElement('script');
      s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(GOOGLE_KEY) + '&v=weekly&loading=async&libraries=places';
      s.async = true; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    }).then(function () { return google.maps.importLibrary('places'); }).then(function (lib) { places = lib; return lib; }, function (err) { loading = null; throw err; });
    return loading;
  }

  var css = document.createElement('style');
  css.textContent =
    '.rs-ac{position:absolute;z-index:99999;background:#fff;border:1px solid #d9d9d9;border-radius:6px;box-shadow:0 6px 20px rgba(0,0,0,.12);margin-top:4px;overflow:hidden;font:15px/1.4 inherit;text-align:left}' +
    '.rs-ac div[role=option]{padding:10px 12px;cursor:pointer;color:#222}' +
    '.rs-ac div[role=option].is-active,.rs-ac div[role=option]:hover{background:#f2f2f2}' +
    '.rs-ac .rs-ac-main{font-weight:600}.rs-ac .rs-ac-sub{font-size:13px;color:#666}' +
    '.rs-ac .rs-ac-google{padding:6px 12px;border-top:1px solid #eee;text-align:right}' +
    '.rs-ac .rs-ac-google img{height:14px;vertical-align:middle}';
  document.head.appendChild(css);

  function setValue(input, value) {
    if (!input) return;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function attach(addressInput) {
    if (addressInput.dataset.rsAc) return;
    addressInput.dataset.rsAc = '1';
    var form = addressInput.closest('form');
    var cityInput = form && form.querySelector(SEL.city);
    var zipInput = form && form.querySelector(SEL.zip);
    var box = null, items = [], active = -1, timer = null, lastQuery = '';

    function close() { if (box) { box.remove(); box = null; } items = []; active = -1; }
    function position() {
      var r = addressInput.getBoundingClientRect();
      box.style.left = (r.left + window.scrollX) + 'px';
      box.style.top = (r.bottom + window.scrollY) + 'px';
      box.style.width = r.width + 'px';
    }
    function render(suggestions) {
      close();
      if (!suggestions.length) return;
      box = document.createElement('div'); box.className = 'rs-ac'; box.setAttribute('role', 'listbox');
      items = suggestions.map(function (s) {
        var p = s.placePrediction, row = document.createElement('div');
        row.setAttribute('role', 'option');
        row.innerHTML = '<div class="rs-ac-main"></div><div class="rs-ac-sub"></div>';
        row.firstChild.textContent = p.mainText ? p.mainText.text : p.text.text;
        row.lastChild.textContent = p.secondaryText ? p.secondaryText.text : '';
        row.addEventListener('mousedown', function (e) { e.preventDefault(); choose(s); });
        box.appendChild(row);
        return row;
      });
      var g = document.createElement('div'); g.className = 'rs-ac-google';
      g.innerHTML = '<img alt="Powered by Google" src="https://developers.google.com/static/maps/documentation/images/google_on_white.png">';
      box.appendChild(g);
      document.body.appendChild(box); position();
    }
    function highlight(i) {
      items.forEach(function (el, k) { el.classList.toggle('is-active', k === i); });
      active = i;
    }
    function choose(s) {
      var place = s.placePrediction.toPlace();
      close();
      place.fetchFields({ fields: ['addressComponents'] }).then(function () {
        var c = {};
        (place.addressComponents || []).forEach(function (comp) {
          comp.types.forEach(function (t) { if (!c[t]) c[t] = comp; });
        });
        var num = c.street_number ? c.street_number.longText : '';
        var street = c.route ? c.route.longText : '';
        var line1 = (num + ' ' + street).trim() || s.placePrediction.mainText.text;
        if (c.subpremise) line1 += ' #' + c.subpremise.longText;
        var city = (c.locality || c.postal_town || c.sublocality || c.administrative_area_level_3 || c.neighborhood || {}).longText || '';
        var zip = c.postal_code ? c.postal_code.longText : '';
        setValue(addressInput, line1);
        if (city) setValue(cityInput, city);
        if (zip) setValue(zipInput, zip);
        var next = zipInput && !zipInput.value ? zipInput : (cityInput && !cityInput.value ? cityInput : null);
        if (next) next.focus();
      }).catch(report('place details'));
    }
    function search(q) {
      var lib = places || (window.google && google.maps && google.maps.places);
      if (!lib || !lib.AutocompleteSuggestion) { report('suggestions')('Places library not available'); return; }
      var req = { input: q, includedRegionCodes: ['us'], locationBias: BIAS, includedPrimaryTypes: ['street_address', 'premise', 'subpremise'] };
      lib.AutocompleteSuggestion.fetchAutocompleteSuggestions(req).then(function (res) {
        if (q !== lastQuery) return; // a newer keystroke won
        render((res && res.suggestions) || []);
      }).catch(function (err) { close(); report('suggestions')(err); });
    }

    addressInput.addEventListener('focus', function () { loadGoogle().catch(report('loading Google')); });
    addressInput.addEventListener('input', function () {
      var q = addressInput.value.trim(); lastQuery = q;
      clearTimeout(timer);
      if (q.length < 3) return close();
      timer = setTimeout(function () { loadGoogle().then(function () { search(q); }).catch(function (err) { close(); report('loading Google')(err); }); }, 250);
    });
    addressInput.addEventListener('keydown', function (e) {
      if (!box) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); highlight(Math.min(active + 1, items.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(Math.max(active - 1, 0)); }
      else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); items[active].dispatchEvent(new MouseEvent('mousedown')); }
      else if (e.key === 'Escape') close();
    });
    addressInput.addEventListener('blur', function () { setTimeout(close, 150); });
    window.addEventListener('resize', function () { if (box) position(); });
    window.addEventListener('scroll', function () { if (box) position(); }, true);
  }

  function init() { document.querySelectorAll(SEL.address).forEach(attach); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  // Elementor popups / lazy sections
  if (window.jQuery) jQuery(window).on('elementor/frontend/init', function () { setTimeout(init, 500); });
  new MutationObserver(function () { init(); }).observe(document.documentElement, { childList: true, subtree: true });
})();
