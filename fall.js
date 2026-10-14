/* Fall leaves. Keep this file byte-identical in anthonyjctsg.com and ctsg-htx.com.
 *
 * The inline script in each page's <head> adds html.fall from Oct 1 to Nov 30
 * (or with ?season=fall, and never with ?season=off), and the site's stylesheet
 * holds the fall colours. This only adds a few leaves that drift down once when
 * the page opens and then remove themselves, so nothing keeps animating.
 *
 * Each leaf moves in three layers: the outer span falls and drifts with the
 * wind, the middle one swings side to side like a pendulum, and the svg itself
 * flutters in 3D (a full flip for some leaves, a rock back and forth for the
 * rest). Smaller leaves read as farther away, so they are fainter and slower. */
(function () {
    'use strict';
    var root = document.documentElement;
    if (!root.classList.contains('fall')) { return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }

    // Drawn in a 24x24 box with the stem running down to the bottom edge.
    var LEAVES = [
        { // maple
            blade: 'M12 1.5L13.3 5.2 15.2 4.2 14.7 8.6 17.6 6.2 18.4 8 21.6 7.4 20.4 10.6 22.5 11.6 18.6 14.6 19.4 16.6 14.6 15.9 14.9 18 12.5 17.2 12.5 18.5 11.5 18.5 11.5 17.2 9.1 18 9.4 15.9 4.6 16.6 5.4 14.6 1.5 11.6 3.6 10.6 2.4 7.4 5.6 8 6.4 6.2 9.3 8.6 8.8 4.2 10.7 5.2Z',
            veins: 'M12 17.5V4.5M12 13.5L19.5 8.5M12 13.5L4.5 8.5M12 15.2L17.5 15.6M12 15.2L6.5 15.6',
            stem: 'M12 18.5V23'
        },
        { // oak
            blade: 'M12 1.2C13.6 1.2 14.8 2.4 14.4 3.8 14.2 4.6 13.6 5 13.4 5.4 15.2 4.6 17.4 5.2 17.2 6.8 17 7.8 15.6 8.2 14.8 8.6 17 8.4 19.2 9 18.8 10.8 18.5 12 16.6 12.2 15.6 12.5 17.4 13 18.2 14.2 17.4 15.2 16.6 16.2 15.2 15.8 14.4 15.8 15.4 16.8 15 18 13.8 18.4 13.2 18.6 12.6 18.8 12.4 19.3L11.6 19.3C11.4 18.8 10.8 18.6 10.2 18.4 9 18 8.6 16.8 9.6 15.8 8.8 15.8 7.4 16.2 6.6 15.2 5.8 14.2 6.6 13 8.4 12.5 7.4 12.2 5.5 12 5.2 10.8 4.8 9 7 8.4 9.2 8.6 8.4 8.2 7 7.8 6.8 6.8 6.6 5.2 8.8 4.6 10.6 5.4 10.4 5 9.8 4.6 9.6 3.8 9.2 2.4 10.4 1.2 12 1.2Z',
            veins: 'M12 19V2.8M12 8.2L16.2 6.9M12 8.2L7.8 6.9M12 12L17.6 10.8M12 12L6.4 10.8M12 15.8L16.4 15.1M12 15.8L7.6 15.1',
            stem: 'M12 19.3V23'
        },
        { // elm
            blade: 'M12 1.5C17 5 18.6 10.5 17 15 15.8 18.4 13.6 19.6 12 20 10.4 19.6 8.2 18.4 7 15 5.4 10.5 7 5 12 1.5Z',
            veins: 'M12 19.5V3M12 8L15 6.2M12 8L9 6.2M12 11.5L16 9.5M12 11.5L8 9.5M12 15L15.6 13.4M12 15L8.4 13.4',
            stem: 'M12 20V23'
        }
    ];
    // Light and dark tone of each colour; the blade fades from one to the other.
    var COLORS = [
        ['#ee8c3a', '#b4471c'],
        ['#e6b13c', '#a8661b'],
        ['#d0492b', '#7f2414'],
        ['#c27434', '#6e3a18'],
        ['#f0c457', '#b97d22']
    ];

    var css =
        '.fall-leaves{position:fixed;inset:0;z-index:15;overflow:hidden;pointer-events:none}' +
        '.fall-leaves>span{position:absolute;top:-56px;will-change:transform,opacity}' +
        '.fall-leaves i{display:block;width:100%;height:100%;perspective:240px}' +
        '.fall-leaves svg{display:block;width:100%;height:100%;overflow:visible}' +
        '@keyframes fall-drop{0%{transform:translate3d(0,0,0);opacity:0}6%{opacity:1}88%{opacity:1}' +
            '100%{transform:translate3d(var(--drift),calc(100vh + 112px),0);opacity:0}}' +
        '@keyframes fall-sway{from{transform:translateX(calc(var(--sway) * -1)) rotate(calc(var(--swing) * -1))}' +
            'to{transform:translateX(var(--sway)) rotate(var(--swing))}}' +
        '@keyframes fall-flip{from{transform:rotate3d(1,var(--axis),0,0deg)}to{transform:rotate3d(1,var(--axis),0,360deg)}}' +
        '@keyframes fall-rock{from{transform:rotate3d(1,var(--axis),0,-55deg)}to{transform:rotate3d(1,var(--axis),0,55deg)}}';

    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var layer = document.createElement('div');
    layer.className = 'fall-leaves';
    layer.setAttribute('aria-hidden', 'true');

    function rand(min, max) { return min + Math.random() * (max - min); }

    var count = window.innerWidth < 640 ? 5 : 9;
    var longest = 0;
    var html = '';
    for (var i = 0; i < count; i++) {
        var depth = Math.random(); // 0 = far away, 1 = close up
        var size = Math.round(18 + depth * 22);
        var dur = rand(11, 13) - depth * 4;
        var delay = rand(0, 3);
        // Spread across the width in even slots, jittered, so leaves never bunch.
        var x = ((i + 0.2 + Math.random() * 0.6) / count) * 100;
        // A light wind, mostly to the right.
        var drift = Math.round(rand(-50, 110) * (0.6 + depth * 0.6));
        var swayDur = rand(1.8, 3.2);
        var flips = Math.random() < 0.45;
        var flutterDur = flips ? rand(1.4, 3) : rand(1.1, 2);
        var leaf = LEAVES[i % LEAVES.length];
        var c = COLORS[i % COLORS.length];
        var id = 'fall-g' + i;
        longest = Math.max(longest, dur + delay);

        html += '<span style="left:' + x.toFixed(1) + '%;width:' + size + 'px;height:' + size + 'px;' +
                '--drift:' + drift + 'px;animation:fall-drop ' + dur.toFixed(2) + 's linear ' + delay.toFixed(2) + 's both">' +
            '<i style="opacity:' + (0.6 + depth * 0.4).toFixed(2) + ';' +
                '--sway:' + Math.round(rand(16, 40)) + 'px;--swing:' + Math.round(rand(22, 50)) + 'deg;' +
                'animation:fall-sway ' + swayDur.toFixed(2) + 's ease-in-out ' + delay.toFixed(2) + 's ' +
                Math.ceil(dur / swayDur) + ' alternate both">' +
            '<svg viewBox="0 0 24 24" style="--axis:' + rand(-0.6, 0.6).toFixed(2) + ';animation:' +
                (flips ? 'fall-flip ' : 'fall-rock ') + flutterDur.toFixed(2) + 's ' +
                (flips ? 'linear ' : 'ease-in-out ') + delay.toFixed(2) + 's ' +
                Math.ceil(dur / flutterDur) + (flips ? '' : ' alternate') + ' both">' +
            '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
                '<stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/>' +
            '</linearGradient></defs>' +
            '<path d="' + leaf.blade + '" fill="url(#' + id + ')" stroke="' + c[1] + '" stroke-width=".5" stroke-linejoin="round"/>' +
            '<path d="' + leaf.veins + '" fill="none" stroke="' + c[1] + '" stroke-width=".7" stroke-linecap="round" opacity=".75"/>' +
            '<path d="' + leaf.stem + '" fill="none" stroke="' + c[1] + '" stroke-width="1.1" stroke-linecap="round"/>' +
            '</svg></i></span>';
    }
    layer.innerHTML = html;
    document.body.appendChild(layer);

    setTimeout(function () {
        layer.remove();
        style.remove();
    }, (longest + 0.5) * 1000);
}());
