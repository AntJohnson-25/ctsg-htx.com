/* Both contact paths on the site.
 *
 * Combines the two working patterns from anthonyjctsg.com: the header popover
 * from nav-contact.js, and the validate-then-submit flow from the recruiter
 * form on professional.html. They live in one file because this site is two
 * pages and both pages carry both, so splitting them would only add a request.
 *
 * Neither handler binds anything if CTSG is missing, so a failed load of
 * ctsg-data.js degrades to an inert form rather than a console error. */
(function () {
    'use strict';

    /* ---------- header popover: name + email, low commitment ---------- */
    document.querySelectorAll('.nav-contact-item').forEach(function (item) {
        var toggle = item.querySelector('.nav-contact-toggle');
        var panel = item.querySelector('.nav-contact-panel');
        var form = item.querySelector('form');
        var status = item.querySelector('.nav-contact-status');
        var emailField = item.querySelector('input[type="email"]');
        var nameField = item.querySelector('input[type="text"]');
        var submit = form.querySelector('button[type="submit"]');

        function close() {
            panel.hidden = true;
            toggle.setAttribute('aria-expanded', 'false');
        }

        function open() {
            panel.hidden = false;
            toggle.setAttribute('aria-expanded', 'true');
            emailField.focus();
        }

        toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            if (panel.hidden) { open(); } else { close(); }
        });

        document.addEventListener('click', function (e) {
            if (!panel.hidden && !item.contains(e.target)) { close(); }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !panel.hidden) {
                close();
                toggle.focus();
            }
        });

        if (!window.CTSG) { return; }

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var email = emailField.value.trim();
            if (email.indexOf('@') < 1 || email.indexOf('.', email.indexOf('@')) < 0) {
                status.textContent = 'That does not look like an email address.';
                status.className = 'nav-contact-status is-error';
                emailField.focus();
                return;
            }

            submit.disabled = true;
            status.textContent = 'Sending...';
            status.className = 'nav-contact-status';

            CTSG.signUp(email, nameField.value.trim(), 'ctsg-htx-nav')
                .then(function (result) {
                    form.hidden = true;
                    status.textContent = result.duplicate
                        ? 'Already have your info - I will be in touch.'
                        : 'Thanks - I will be in touch.';
                    status.className = 'nav-contact-status is-ok';
                })
                .catch(function () {
                    submit.disabled = false;
                    status.textContent = 'Something went wrong. Please try again in a moment.';
                    status.className = 'nav-contact-status is-error';
                });
        });
    });

    /* ---------- call to action: the real inquiry ---------- */
    (function () {
        var form = document.getElementById('inquiry-form');
        if (!form || !window.CTSG) { return; }

        var status = document.getElementById('inquiry-status');
        var submit = form.querySelector('button[type="submit"]');
        var honeypot = document.getElementById('inquiry-website');

        function value(id) { return document.getElementById(id).value.trim(); }

        function fail(message, focusId) {
            status.textContent = message;
            status.className = 'form-status is-error';
            if (focusId) { document.getElementById(focusId).focus(); }
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            /* Bots fill every field they find. Pretend it worked and drop it -
             * telling a scraper it was caught only teaches it to try again. */
            if (honeypot.value) {
                form.hidden = true;
                status.textContent = 'Thanks - your message has been sent.';
                status.className = 'form-status is-ok';
                return;
            }

            var name = value('inquiry-name');
            var email = value('inquiry-email');

            if (!name) { return fail('Please add your name.', 'inquiry-name'); }
            if (email.indexOf('@') < 1 || email.indexOf('.', email.indexOf('@')) < 0) {
                return fail('That does not look like an email address.', 'inquiry-email');
            }

            submit.disabled = true;
            status.textContent = 'Sending...';
            status.className = 'form-status';

            /* Message is deliberately not required. Someone who wants a call
             * and has nothing to type should still reach you. */
            CTSG.inquiry({
                name: name,
                email: email,
                company: value('inquiry-company'),
                message: value('inquiry-message'),
                source: form.getAttribute('data-source') || 'ctsg-htx-cta'
            }).then(function () {
                form.hidden = true;
                status.textContent = 'Thanks - I will reply to ' + email + ' within one business day.';
                status.className = 'form-status is-ok';
            }).catch(function () {
                submit.disabled = false;
                /* No fallback address to offer: the branded mailbox does not
                 * exist yet, and sending someone to a bouncing inbox is worse
                 * than asking them to retry. */
                fail('Something went wrong sending that. Please try again in a moment.');
            });
        });
    }());
}());
