(function() {
    'use strict';

    const CONFIG = {
        clickbaitPhrases: /(OMG|IM|DONT|CANT|SHES|IVE|GRAPE|UNALIVE|UNALIVED|SHOCKING|SECRET|HIDDEN|INSANE|COPS|GONE WRONG|RUINED MY LIFE|LIFE\.\.\.|YOU PROBABLY NEVER|YOU'VE NEVER|BREAKS REALITY|PROBABLY NEVER KNEW|EVERYTHING IS CHANGING|THE TRUTH ABOUT|I'M LEAVING|FINALLY HAPPENED)/i,
        capsThreshold: 0.5,
        minTitleLength: 10
    };

    const isClickbait = (title) => {
        if (!title) return false;

        // 1. Phrase Match
        if (CONFIG.clickbaitPhrases.test(title)) return true;

        // 2. Screamer Logic
        const letters = title.replace(/[^a-zA-Z]/g, '');
        if (letters.length > CONFIG.minTitleLength) {
            const caps = letters.replace(/[^A-Z]/g, '').length;
            if (caps / letters.length > CONFIG.capsThreshold) return true;
        }

        // 3. Excessive Punctuation (Catching ... or !!!)
        if (/[!?.]{3,}/.test(title)) return true;

        return false;
    };

    const processNode = (node) => {
        const titleEl = node.querySelector('#video-title, #video-title-link, yt-formatted-string.ytd-video-renderer');

        if (!titleEl || !titleEl.innerText.trim()) {
            if (!node.dataset.retried) {
                node.dataset.retried = "true";
                setTimeout(() => processNode(node), 200);
            }
            return;
        }

        const titleText = titleEl.innerText.trim();

        if (isClickbait(titleText)) {
            console.log(`[YouTube Clickbait Remover] Removed: "${titleText}"`);
            const container = node.closest('ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer');
            if (container) {
                container.style.display = 'none';
                container.remove();
                // Trigger a reflow to help YouTube's layout engine
                window.scrollBy(0, 1);
                window.scrollBy(0, -1);
            }
        }
    };

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    if (node.matches('ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-video-renderer')) {
                        processNode(node);
                    } else {
                        node.querySelectorAll('ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-video-renderer').forEach(processNode);
                    }
                }
            });
        }
    });

    const init = () => {
        const target = document.querySelector('ytd-app') || document.body;
        if (!target) {
            setTimeout(init, 500);
            return;
        }
        
        observer.observe(target, { childList: true, subtree: true });
        document.querySelectorAll('ytd-rich-item-renderer, ytd-compact-video-renderer, ytd-video-renderer').forEach(processNode);
        
        console.log('[YouTube Clickbait Remover] Extension loaded and active');
    };

    // Wait for page to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Re-run when YouTube navigates (SPA)
    window.addEventListener('yt-navigate-finish', init);
})();