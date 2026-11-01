// js/premium.js: theme micro-interactions (header state + scroll reveal)
(function () {
    var root = document.documentElement;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function init() {
        // Header gains a soft shadow once the page is scrolled
        var header = document.querySelector('.main-header.container');
        if (header) {
            var onScroll = function () {
                header.classList.toggle('is-scrolled', window.scrollY > 40);
            };
            onScroll();
            window.addEventListener('scroll', onScroll, { passive: true });
        }

        // Smooth scroll only for links to a section on the same page (e.g. "Browse categories").
        // Page-level jumps to the top stay instant.
        document.addEventListener('click', function (e) {
            var link = e.target.closest('a[href^="#"]');
            if (!link || link.getAttribute('href').length < 2) return;
            var target = document.getElementById(link.getAttribute('href').slice(1));
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        });

        // Gentle reveal-on-scroll for key blocks
        if (reduceMotion || !('IntersectionObserver' in window)) return;

        var selectors = [
            '.shop-by-category h1',
            '.category-card',
            '.lux-value',
            '.title-with-link',
            'main .product-grid',
            '.product-carousel',
            '.related-products-section h2',
            '.about-section'
        ];
        var targets = document.querySelectorAll(selectors.join(','));
        if (!targets.length) return;

        root.classList.add('lux-js');

        // Reveal elements as they scroll into view. When the user scrolls back up and an
        // element drops below the bottom of the screen, it is hidden again, so the
        // animation replays every time the user scrolls down to it.
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                } else if (entry.boundingClientRect.top > 0) {
                    entry.target.classList.remove('is-visible');
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

        targets.forEach(function (el) {
            el.classList.add('lux-reveal');
            // Stagger siblings in a row (category tiles, value items)
            if (el.classList.contains('category-card') || el.classList.contains('lux-value')) {
                var index = Array.prototype.indexOf.call(el.parentNode.children, el);
                el.style.transitionDelay = (index * 0.09) + 's';
            }
            observer.observe(el);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
