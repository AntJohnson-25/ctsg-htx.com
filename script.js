(() => {
  'use strict';
  const stories = {
    estimates: {
      kicker: 'The estimate that went quiet',
      preview: 'Find the quotes worth following up, with the reason behind each score.',
      title: "A quote isn't always\nthe end of the conversation.",
      summary: 'Some open estimates deserve a second look. I rank them by value and likelihood to close, with the reason behind each score.',
      actionTitle: 'Follow up with the strongest prospects first.',
      actionCopy: 'You approve the campaign. I build it, send it, and track which follow-ups turn into paid work.'
    },
    dormant: {
      kicker: 'The customer who is due for service',
      preview: 'Use service intervals, prior spend, and the home to find customers worth reaching again.',
      title: 'A good customer.\nA long time between visits.',
      summary: "I find customers past their normal service interval, then look at prior spend and the age of the home to put the right people on the list.",
      actionTitle: 'Give them a relevant reason to book again.',
      actionCopy: "A timely reminder starts with their history. You approve the campaign, and I track the response against a holdout group."
    },
    plans: {
      kicker: 'The repeat customer without a plan',
      preview: 'Find repeat customers whose service history and home make a maintenance plan worth discussing.',
      title: 'They keep calling.\nA plan may make sense.',
      summary: 'I identify repeat customers without a maintenance plan and rank the opportunity using their job history and property details.',
      actionTitle: 'Offer a plan to the customers it fits.',
      actionCopy: 'Reach the right homes with a maintenance offer you approve, then measure the response alongside the rest of the campaign work.'
    }
  };
  const controls = [...document.querySelectorAll('[data-opportunity]')];
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panel = document.getElementById('opportunity-detail');
  const sceneNote = document.getElementById('scene-note');
  const neighborhood = document.querySelector('.neighborhood');
  function selectStory(key, fromPin = false) {
    const story = stories[key];
    if (!story) return;
    controls.forEach(control => {
      const active = control.dataset.opportunity === key;
      control.classList.toggle('is-active', active);
      if (control.getAttribute('role') === 'tab') {
        control.setAttribute('aria-selected', String(active));
        control.tabIndex = active ? 0 : -1;
      } else {
        control.setAttribute('aria-pressed', String(active));
      }
    });
    const title = document.getElementById('opportunity-title');
    title.replaceChildren();
    story.title.split('\n').forEach((line, index) => {
      if (index) title.append(document.createElement('br'));
      title.append(document.createTextNode(line));
    });
    document.getElementById('opportunity-kicker').textContent = story.kicker;
    document.getElementById('opportunity-summary').textContent = story.summary;
    document.getElementById('opportunity-action-title').textContent = story.actionTitle;
    document.getElementById('opportunity-action-copy').textContent = story.actionCopy;
    panel.setAttribute('aria-labelledby', 'tab-' + key);
    // Per-story accent colour, and a short re-entry animation on the new copy.
    panel.closest('.opportunity-workspace').dataset.active = key;
    panel.classList.remove('swap');
    void panel.offsetWidth;
    panel.classList.add('swap');
    if (fromPin) {
      document.getElementById('scene-note-title').textContent = story.kicker;
      document.getElementById('scene-note-copy').textContent = story.preview;
      sceneNote.hidden = false;
      neighborhood.classList.add('is-inspecting');
    }
  }
  document.querySelector('.scene-close').addEventListener('click', () => {
    sceneNote.hidden = true;
    neighborhood.classList.remove('is-inspecting');
    document.querySelector('.home-pin.is-active').focus({preventScroll:true});
  });
  controls.forEach(control => control.addEventListener('click', () => selectStory(control.dataset.opportunity, control.classList.contains('home-pin'))));
  tabs.forEach((tab, index) => tab.addEventListener('keydown', event => {
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    selectStory(tabs[next].dataset.opportunity);
    tabs[next].focus();
  }));
  const menu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('main-nav');
  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    menu.querySelector('span').textContent = '+';
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    menu.querySelector('span').textContent = open ? '−' : '+';
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !sceneNote.hidden) {
      sceneNote.hidden = true;
      neighborhood.classList.remove('is-inspecting');
      document.querySelector('.home-pin.is-active').focus({preventScroll:true});
    }
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 640) closeMenu(); });
  // Phone-only call button (CSS shows it at 640px and under): appears once the hero
  // button has scrolled away and leaves again when the contact section arrives.
  const sticky = document.querySelector('.sticky-cta');
  const contact = document.getElementById('contact');
  const heroButton = document.querySelector('.hero-content .button');
  if (sticky && contact && heroButton) {
    const placeSticky = () => {
      const pastHero = heroButton.getBoundingClientRect().bottom < 0;
      const atContact = contact.getBoundingClientRect().top < window.innerHeight - 80;
      sticky.hidden = !pastHero || atContact || nav.classList.contains('is-open');
    };
    window.addEventListener('scroll', placeSticky, {passive: true});
    window.addEventListener('resize', placeSticky);
    menu.addEventListener('click', placeSticky);
    placeSticky();
  }
  // Colour + motion layer: scroll progress bar, header shadow, current-section nav link, and
  // fade-up reveals for things below the fold. All purely visual; skipped for reduced motion.
  const header = document.querySelector('.site-header');
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.prepend(bar);
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
      header.classList.toggle('is-stuck', window.scrollY > 8);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, {passive: true});
  onScroll();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window) {
    const navLinks = [...nav.querySelectorAll('a[href^="#"]:not(.nav-cta)')];
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => link.classList.toggle('is-current', link.getAttribute('href') === '#' + entry.target.id));
      });
    }, {rootMargin: '-35% 0px -55% 0px'});
    navLinks.forEach(link => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) spy.observe(target);
    });
    if (!reduceMotion) {
      const groups = [
        '.section-intro', '.opportunity-workspace', '.example-note', '.approach-intro', '.rhythm-step',
        '.wider-layout>div', '.service-rows details', '.pricing-top', '.ledger-label', '.price-item',
        '.trade-footer', '.pricing-cta', '.contact-intro', '.inquiry-form'
      ];
      const reveal = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          reveal.unobserve(entry.target);
        });
      }, {rootMargin: '0px 0px -8% 0px', threshold: 0.08});
      groups.forEach(selector => {
        document.querySelectorAll(selector).forEach((el, index) => {
          if (el.getBoundingClientRect().top < window.innerHeight) return;
          el.style.setProperty('--d', Math.min(index, 4) * 0.08 + 's');
          el.classList.add('reveal');
          reveal.observe(el);
        });
      });
    }
  }
  document.getElementById('year').textContent = String(new Date().getFullYear());
})();
