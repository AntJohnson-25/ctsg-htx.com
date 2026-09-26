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
  document.getElementById('year').textContent = String(new Date().getFullYear());
})();
