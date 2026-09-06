/* Contact capture, talking straight to Supabase.
 *
 * Adapted from the copy on anthonyjctsg.com. The game tracking is gone —
 * track() and the site() helper it depended on only existed for the arcade,
 * and game_events has a check constraint that would reject a row from this
 * domain anyway. What is left is the two paths this site needs: a short
 * name+email capture for the header popover, and a full inquiry with a
 * message body for the call-to-action form.
 *
 * The key below is the publishable one and is meant to ship in public source.
 * Row Level Security grants the anon role insert-only access, so the worst a
 * reader of this file can do is add a row — not read the inquiries back out.
 *
 * No SDK on purpose: a CDN <script> would be a third-party dependency and an
 * extra request on every page, and this is about forty lines of fetch. */
(function (global) {
    'use strict';

    var URL_BASE = 'https://tgpifrhkksycjtwymoxx.supabase.co';
    var API_KEY = 'sb_publishable_nc5cZW4r3Cp3VcL0DqwZSQ_vcIW2prZ';

    /* Duplicates are left to the unique indexes and handled by the 409 below.
     * PostgREST's resolution=ignore-duplicates looks like the tidier option but
     * is rejected by RLS on an insert-only table, so this is the working path. */
    function insert(table, row) {
        return fetch(URL_BASE + '/rest/v1/' + table, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY,
                'Authorization': 'Bearer ' + API_KEY,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(row)
        }).then(function (res) {
            /* 409 means the unique index caught a repeat. For someone who has
             * already been in touch that is the expected outcome, not an error. */
            if (res.ok || res.status === 409) { return { ok: true, duplicate: res.status === 409 }; }
            return res.text().then(function (body) {
                throw new Error('Supabase ' + res.status + ': ' + body);
            });
        });
    }

    global.CTSG = {
        /* Header popover: the low-commitment path. Shares the signups table
         * with anthonyjctsg.com, which is why the source tag matters — it is
         * the only thing distinguishing a firm-site lead from a personal-site
         * one once both rows are in the same table. */
        signUp: function (email, name, source) {
            return insert('signups', {
                email: email,
                name: name || null,
                source: source || null
            });
        },

        /* Call-to-action form: a real inquiry with a message body.
         *
         * Deliberately not recruiter_inquiries — that table exists for inbound
         * hiring interest on the personal site, and mixing prospective clients
         * into it would make both piles useless to read. */
        inquiry: function (fields) {
            return insert('client_inquiries', {
                name: fields.name,
                email: fields.email,
                company: fields.company || null,
                message: fields.message || null,
                source: fields.source || null
            });
        }
    };
}(window));
