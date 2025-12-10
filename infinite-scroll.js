
document.addEventListener("DOMContentLoaded", function () {
    // --- 1. Global Setup ---
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    const articleOrder = ["index", "ExchangeRate", "LearningPython", "STMP", "AI", "GME"];
    const excludedPages = ["about", "more"];

    // Detect Language & Current Page
    const path = window.location.pathname;
    let filename = path.split("/").pop();
    if (filename === "") filename = "index.html";

    let baseName = filename.replace(".html", "");
    let langSuffix = "";

    if (baseName.endsWith("_bn")) {
        langSuffix = "_bn";
        baseName = baseName.replace("_bn", "");
    } else if (baseName.endsWith("_ur")) {
        langSuffix = "_ur";
        baseName = baseName.replace("_ur", "");
    }

    if (excludedPages.includes(baseName)) return;

    let currentIndex = articleOrder.indexOf(baseName);
    if (currentIndex === -1) return;

    // --- 2. State & DOM Elements ---
    let isLoading = false;
    const mainContainer = document.querySelector('main');
    if (!mainContainer) return;

    // TOC Setup. Edit according to your need if you don't want TOC or want some other functionality
    const tocContainer = document.querySelector('#TOC') || document.querySelector('nav[role="doc-toc"]');
    const tocMap = {};
    if (tocContainer) {
        tocMap[currentIndex] = tocContainer.innerHTML;
    }

    // Wrap initial content
    const originalWrapper = document.createElement('div');
    originalWrapper.className = 'infinite-article';
    originalWrapper.dataset.index = currentIndex;
    originalWrapper.dataset.baseName = baseName;
    originalWrapper.dataset.langSuffix = langSuffix;

    // Move all children to wrapper
    while (mainContainer.firstChild) {
        originalWrapper.appendChild(mainContainer.firstChild);
    }
    mainContainer.appendChild(originalWrapper);

    // Container for subsequent articles
    const scrollContainer = document.createElement('div');
    scrollContainer.id = 'infinite-scroll-container';
    mainContainer.appendChild(scrollContainer);

    // Sentinel for loading
    const sentinel = document.createElement('div');
    sentinel.id = 'infinite-scroll-sentinel';
    sentinel.style.height = '10px';
    sentinel.style.marginBottom = '200px';
    mainContainer.appendChild(sentinel);

    // Loading Indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'infinite-scroll-loading';
    loadingIndicator.innerHTML = '<div class="spinner"></div>';
    mainContainer.appendChild(loadingIndicator);

    // A. URL & TOC Updater Observer (edit things according to your project need
    // Triggers when an article occupies > 50% of viewport OR is intersecting
    const activeArticleObserver = new IntersectionObserver((entries) => {
        // Find the entry with the largest intersection ratio
        let maxRatio = 0;
        let bestEntry = null;

        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                maxRatio = entry.intersectionRatio;
                bestEntry = entry;
            }
        });


        checkActiveArticle();

    }, { threshold: [0.1, 0.5] }); // Fire at start and half way

    activeArticleObserver.observe(originalWrapper);

    function checkActiveArticle() {
        const articles = document.querySelectorAll('.infinite-article');
        let activeArticle = null;

        // Center Line Logic: The article that crosses the middle of the viewport is "active".
        const viewportHeight = window.innerHeight;
        const centerLine = viewportHeight / 2;

        for (const article of articles) {
            const rect = article.getBoundingClientRect();

            // Check if the article covers the center line
            if (rect.top <= centerLine && rect.bottom >= centerLine) {
                activeArticle = article;
                break;
            }
        }

        // Fallback: If no article covers the center
        if (!activeArticle && articles.length > 0) {
            let minDistance = Infinity;
            articles.forEach(article => {
                const rect = article.getBoundingClientRect();
                const articleCenter = (rect.top + rect.bottom) / 2;
                const dist = Math.abs(articleCenter - centerLine);
                if (dist < minDistance) {
                    minDistance = dist;
                    activeArticle = article;
                }
            });
        }

        if (activeArticle) {
            updateActiveState(activeArticle);
        }
    }

    // Throttled scroll checker for active state (backup to Observer)
    let isTicking = false;
    window.addEventListener('scroll', () => {
        if (!isTicking) {
            window.requestAnimationFrame(() => {
                checkActiveArticle();
                isTicking = false;
            });
            isTicking = true;
        }
    });


    let lastActiveIndex = currentIndex;

    function updateActiveState(article) {
        const rawIndex = article.dataset.index;
        const entryBaseName = article.dataset.baseName;
        const entryLangSuffix = article.dataset.langSuffix;
        const newIndex = parseInt(rawIndex, 10);

        if (newIndex === lastActiveIndex) return;

        // 1. Update TOC
        if (tocContainer && tocMap[newIndex]) {
            tocContainer.innerHTML = tocMap[newIndex];
        }

        // 2. Update URL
        const newUrl = entryBaseName + entryLangSuffix + ".html";
        const currentPath = window.location.pathname.split("/").pop() || "index.html";

        if (currentPath !== newUrl) {
            // Defensive approach for URL update instead of aggressive
            try {
                history.pushState(null, '', newUrl);

                // Notify other components (Language Switcher)
                const event = new CustomEvent('articleChanged', {
                    detail: {
                        baseName: entryBaseName,
                        langSuffix: entryLangSuffix
                    }
                });
                document.dispatchEvent(event);

            } catch (e) { console.error(e); }
        }

        lastActiveIndex = newIndex;
    }

    const loadObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading) {
            loadNextArticle();
        }
    }, { rootMargin: '200px' }); // Preload 200px before reaching sentinel

    loadObserver.observe(sentinel);


    function loadNextArticle() {
        if (currentIndex >= articleOrder.length - 1) {
            // End of content
            loadObserver.disconnect();
            sentinel.remove();
            return;
        }

        isLoading = true;
        loadingIndicator.classList.add('visible');

        const nextIndex = currentIndex + 1;
        const nextBase = articleOrder[nextIndex];
        const nextUrl = nextBase + langSuffix + ".html";

        fetch(nextUrl)
            .then(res => {
                if (!res.ok) throw new Error("Status " + res.status);
                return res.text();
            })
            .then(html => {
                processNewContent(html, nextIndex, nextBase);
                isLoading = false;
                loadingIndicator.classList.remove('visible');

                // Prefetch the one after that
                prefetchNext(nextIndex + 1);
            })
            .catch(err => {
                console.error("Error loading article:", err);
                isLoading = false;
                loadingIndicator.classList.remove('visible');
            });
    }

    function processNewContent(html, index, base) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract Main Content
        let newContent = doc.querySelector('#quarto-document-content');
        if (!newContent) newContent = doc.querySelector('main');
        if (!newContent) return;

        // Extract TOC
        const newToc = doc.querySelector('#TOC') || doc.querySelector('nav[role="doc-toc"]');
        if (newToc) {
            tocMap[index] = newToc.innerHTML;
        } else {
            tocMap[index] = "";
        }

        // Create Wrapper
        const articleWrapper = document.createElement('div');
        articleWrapper.className = 'infinite-article fade-in';
        articleWrapper.dataset.index = index;
        articleWrapper.dataset.baseName = base;
        articleWrapper.dataset.langSuffix = langSuffix;

        // CSS Stlying (Parity with previous)
        articleWrapper.style.marginTop = '4rem';
        articleWrapper.style.borderTop = '1px solid rgba(255,255,255,0.1)';
        articleWrapper.style.paddingTop = '2rem';

        articleWrapper.innerHTML = newContent.innerHTML;

        // Append
        scrollContainer.appendChild(articleWrapper);

        // Update Current Index State
        currentIndex = index;

        // Move Sentinel to bottom again
        mainContainer.appendChild(sentinel);
        mainContainer.appendChild(loadingIndicator); // Keep indicator at very bottom

        // Observe new article for URL updates
        activeArticleObserver.observe(articleWrapper);

        // Optimize Images
        if (typeof optimizeImages === 'function') {
            optimizeImages(articleWrapper);
        } else {
            // Local fallback
            optimizeImagesLocal(articleWrapper);
        }

        // Re-execute Scripts (CRITICAL for lazy loaded things)
        executeScripts(articleWrapper);

        // As another bell and whistle, I am adding an animation tigger so that if you want some form of transition, it will work. Trigger fade in.
        requestAnimationFrame(() => {
            articleWrapper.classList.add('visible');
        });
    }

    async function executeScripts(container) {
        const scripts = Array.from(container.querySelectorAll('script'));

        for (const oldScript of scripts) {
            // Create replacement script
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));

            // Swap
            oldScript.parentNode.replaceChild(newScript, oldScript);

            // If external, wait for load to preserve order (important for dependencies)
            if (newScript.src) {
                await new Promise((resolve) => {
                    newScript.onload = resolve;
                    newScript.onerror = resolve; // Continue on error
                });
            }
        }

        // Dispatch resize to trigger any graphical library like Plotly redraws
        window.dispatchEvent(new Event('resize'));
    }



    function prefetchNext(index) {
        if (index >= articleOrder.length) return;
        const nextBase = articleOrder[index];
        const nextUrl = nextBase + langSuffix + ".html";
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = nextUrl;
        document.head.appendChild(link);
    }

    function optimizeImagesLocal(container) {
        const images = container.querySelectorAll('img');
        images.forEach(img => {
            if (img.classList.contains('lazy-processed')) return;
            img.classList.add('lazy-processed');
            img.loading = 'lazy';
            img.classList.add('fade-in-image');

            if (img.complete) {
                img.classList.add('visible');
            } else {
                img.onload = () => img.classList.add('visible');
                img.onerror = () => img.classList.add('visible');
            }
        });
    }

    // If you don't need image optimization, you can remove this function segment
    optimizeImagesLocal(document);

    // Replace the things you want to be lazy loaded here ( I am just lazy loading plotly, since my website requires so. If you don't want that, you can delete this.
    window.addEventListener('load', function () {
        setTimeout(function () {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = 'https://cdn.plot.ly/plotly-3.3.0.min.js';
            document.head.appendChild(link);
        }, 2000);
    });

});
