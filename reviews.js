/* Client reviews: the homepage list and the /review.html form.
 *
 * Self-contained on purpose (same publishable key and no-SDK fetch approach as ctsg-data.js), so
 * it works on any page that carries #reviews or #review-form and does nothing on the rest.
 *
 * Reading: only public.client_reviews_public, a view that returns approved rows and never the
 * email. If the view does not exist yet, or there are no approved rows, the Reviews section and
 * its nav link simply stay hidden. Nothing here ever shows a review that was not approved by hand.
 *
 * Writing: an insert into public.client_reviews. Row Level Security and the column grant make it
 * insert-only, and every row lands as 'pending' (see ops/reviews.sql).
 *
 * All text is set with textContent, never innerHTML, so a review cannot inject markup. */
(function () {
    'use strict';

    var URL_BASE = 'https://tgpifrhkksycjtwymoxx.supabase.co';
    var API_KEY = 'sb_publishable_nc5cZW4r3Cp3VcL0DqwZSQ_vcIW2prZ';

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) { node.className = className; }
        if (text) { node.textContent = text; }
        return node;
    }

    function initials(name) {
        var parts = String(name).trim().split(/\s+/).filter(Boolean);
        if (!parts.length) { return '?'; }
        var first = parts[0].charAt(0);
        var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
        return (first + last).toUpperCase();
    }

    /* ---------- homepage list ---------- */
    function renderCard(review, index, isFeatured) {
        var card = el('figure', 'review-card' + (isFeatured ? ' is-featured' : ''));
        card.style.setProperty('--i', (index * 0.1) + 's');

        var stars = el('div', 'review-stars', new Array(review.rating + 1).join('★'));
        stars.setAttribute('role', 'img');
        stars.setAttribute('aria-label', review.rating + ' out of 5 stars');
        card.appendChild(stars);

        var quote = el('blockquote', 'review-quote');
        quote.appendChild(el('p', '', review.quote));
        card.appendChild(quote);

        var who = el('figcaption', 'review-who');
        who.appendChild(el('span', 'review-avatar', initials(review.display_name)));
        var text = el('span', 'review-person');
        text.appendChild(el('strong', 'review-name', review.display_name));
        var meta = [review.business, review.city].filter(Boolean).join(' · ');
        if (meta) { text.appendChild(el('span', 'review-meta', meta)); }
        who.appendChild(text);
        card.appendChild(who);
        return card;
    }

    function show(rows) {
        var section = document.getElementById('reviews');
        var list = document.getElementById('review-list');
        var navLink = document.getElementById('nav-reviews');
        if (!section || !list || !rows.length) { return; }
        list.textContent = '';
        /* Columns follow the number of regular cards, so two or three fill the row evenly. */
        var regular = rows.length - ((rows[0].featured || rows.length === 1) ? 1 : 0);
        list.style.setProperty('--cols', Math.min(Math.max(regular, 1), 3));
        rows.forEach(function (review, index) {
            var featured = index === 0 && (review.featured || rows.length === 1);
            list.appendChild(renderCard(review, index, featured));
        });
        section.hidden = false;
        if (navLink) { navLink.hidden = false; }
    }

    function initList() {
        if (!document.getElementById('reviews')) { return; }

        /* Layout preview for design review only. It works on a local address and nowhere else, so
         * a real visitor can never trigger it. The text is obvious filler, not a real review. */
        var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
        if (local && /[?&]demo=reviews/.test(location.search)) {
            var filler = 'Sample text so you can judge the layout. A real client review will appear here once it is approved.';
            show([
                { rating: 5, quote: filler + ' ' + filler, display_name: 'Sample Client', business: 'Sample Co.', city: 'Sugar Land', featured: true },
                { rating: 5, quote: filler, display_name: 'Sample Owner', business: 'Sample Plumbing', city: 'Katy' },
                { rating: 5, quote: filler, display_name: 'Sample Manager', business: 'Sample Roofing', city: 'Houston' }
            ]);
            return;
        }

        fetch(URL_BASE + '/rest/v1/client_reviews_public?select=id,display_name,business,city,rating,quote,featured' +
            '&order=featured.desc,created_at.desc&limit=9', {
            headers: { 'apikey': API_KEY, 'Authorization': 'Bearer ' + API_KEY }
        }).then(function (res) {
            if (!res.ok) { throw new Error('reviews ' + res.status); }
            return res.json();
        }).then(function (rows) {
            if (Array.isArray(rows)) { show(rows); }
        }).catch(function () { /* stay hidden */ });
    }

    /* ---------- /review.html form ---------- */
    function initForm() {
        var form = document.getElementById('review-form');
        if (!form) { return; }

        var status = document.getElementById('review-status');
        var submit = form.querySelector('button[type="submit"]');
        var honeypot = document.getElementById('review-website');

        function value(id) { return document.getElementById(id).value.trim(); }

        function fail(message, focusId) {
            status.textContent = message;
            status.className = 'form-status is-error';
            if (focusId) { document.getElementById(focusId).focus(); }
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            /* Bots fill every field. Pretend it worked and drop it. */
            if (honeypot.value) {
                form.hidden = true;
                status.textContent = 'Thank you. Your review has been received.';
                status.className = 'form-status is-ok';
                return;
            }

            var name = value('review-name');
            var email = value('review-email');
            var quote = value('review-quote');
            var rated = form.querySelector('input[name="rating"]:checked');

            if (!name) { return fail('Please add your name.', 'review-name'); }
            if (email.indexOf('@') < 1 || email.indexOf('.', email.indexOf('@')) < 0) {
                return fail('That does not look like an email address.', 'review-email');
            }
            if (!rated) { return fail('Please choose a star rating.'); }
            if (quote.length < 20) { return fail('Please write a little more, at least a sentence or two.', 'review-quote'); }
            if (!document.getElementById('review-consent').checked) {
                return fail('Please confirm you are happy for the review to be published.', 'review-consent');
            }

            submit.disabled = true;
            status.textContent = 'Sending...';
            status.className = 'form-status';

            fetch(URL_BASE + '/rest/v1/client_reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': API_KEY,
                    'Authorization': 'Bearer ' + API_KEY,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    display_name: name,
                    business: value('review-business') || null,
                    city: value('review-city') || null,
                    email: email,
                    rating: Number(rated.value),
                    quote: quote,
                    consent: true,
                    source: 'review-page'
                })
            }).then(function (res) {
                if (!res.ok) { throw new Error('review ' + res.status); }
                form.hidden = true;
                status.textContent = 'Thank you. Your review has been received and will appear on the site once I have read it.';
                status.className = 'form-status is-ok';
            }).catch(function () {
                submit.disabled = false;
                fail('Something went wrong sending that. Please try again, or email charles2025business@gmail.com.');
            });
        });
    }

    initList();
    initForm();
}());
