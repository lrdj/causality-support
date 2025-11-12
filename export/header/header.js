// Minimal JS to power the mobile menu toggle without GOV.UK JS
(function () {
  const toggle = document.querySelector('.govuk-service-navigation__toggle');
  if (!toggle) return;

  const controlsId = toggle.getAttribute('aria-controls');
  const list = document.getElementById(controlsId);
  if (!list) return;

  const setState = (expanded) => {
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    if (expanded) {
      list.removeAttribute('hidden');
    } else {
      list.setAttribute('hidden', '');
    }
  };

  // Ensure initial state matches markup
  setState(toggle.getAttribute('aria-expanded') === 'true');

  toggle.addEventListener('click', () => {
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    setState(!isExpanded);
  });
})();

