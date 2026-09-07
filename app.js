document.addEventListener('DOMContentLoaded', () => {
    const contentDiv = document.getElementById('content');
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenu = document.getElementById('close-menu');
    const sideMenu = document.getElementById('side-menu');
    const tocList = document.getElementById('toc-list');
    const fontDecrease = document.getElementById('font-decrease');
    const fontIncrease = document.getElementById('font-increase');
    const themeToggle = document.getElementById('theme-toggle');
    const openLabBtn = document.getElementById('open-lab-btn');
    const openLabModal = document.getElementById('open-lab-modal');
    const openLabClose = document.getElementById('open-lab-close');
    const openLabCancel = document.getElementById('open-lab-cancel');
    const openLabSubmit = document.getElementById('open-lab-submit');
    const githubLabUrl = document.getElementById('github-lab-url');
    const openLabStatus = document.getElementById('open-lab-status');

    const savedTheme = localStorage.getItem('lab-viewer-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
    }

    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('lab-viewer-theme', isDark ? 'dark' : 'light');
    });

    menuToggle.addEventListener('click', () => sideMenu.classList.add('open'));
    closeMenu.addEventListener('click', () => sideMenu.classList.remove('open'));

    let currentFontSize = 100;
    fontDecrease.addEventListener('click', () => {
        currentFontSize = Math.max(70, currentFontSize - 10);
        document.body.style.fontSize = `${currentFontSize}%`;
    });

    fontIncrease.addEventListener('click', () => {
        currentFontSize = Math.min(200, currentFontSize + 10);
        document.body.style.fontSize = `${currentFontSize}%`;
    });

    marked.setOptions({
        highlight: function (code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        },
        langPrefix: 'hljs language-'
    });

    function setOpenStatus(message, isError = false) {
        if (!openLabStatus) return;
        openLabStatus.textContent = message || '';
        openLabStatus.classList.toggle('is-error', !!isError);
    }

    function openOpenLabModal(prefill = '') {
        if (!openLabModal) return;
        openLabModal.hidden = false;
        openLabModal.setAttribute('aria-hidden', 'false');
        setOpenStatus('');
        if (githubLabUrl) {
            githubLabUrl.value = prefill || githubLabUrl.value || '';
            setTimeout(() => githubLabUrl.focus(), 0);
        }
    }

    function closeOpenLabModal() {
        if (!openLabModal) return;
        openLabModal.hidden = true;
        openLabModal.setAttribute('aria-hidden', 'true');
    }

    function isAllowedGitHubLabUrl(url) {
        const trimmed = String(url || '').trim();
        if (!trimmed) return false;
        try {
            const u = new URL(trimmed);
            const host = u.hostname.toLowerCase();
            return host === 'github.com' || host === 'www.github.com' || host === 'raw.githubusercontent.com';
        } catch (_) {
            return false;
        }
    }

    /** Normalize GitHub blob/tree/raw URLs to a fetchable raw Markdown URL. */
    function normalizeLabUrl(inputUrl) {
        let labUrl = String(inputUrl || '').trim();
        if (!labUrl) {
            throw new Error('Enter a GitHub URL.');
        }
        if (!isAllowedGitHubLabUrl(labUrl)) {
            throw new Error('Only GitHub URLs are supported (github.com or raw.githubusercontent.com).');
        }

        if (/^https?:\/\/(www\.)?github\.com\//i.test(labUrl)) {
            labUrl = labUrl
                .replace(/^https?:\/\/(www\.)?github\.com\//i, 'https://raw.githubusercontent.com/')
                .replace('/blob/', '/')
                .replace('/tree/', '/');

            if (!/\.(md|markdown)$/i.test(labUrl)) {
                if (!labUrl.endsWith('/')) labUrl += '/';
                labUrl += 'README.md';
            }
        }

        return labUrl;
    }

    function updateBrowserLabQuery(shareUrl) {
        const url = new URL(window.location.href);
        if (shareUrl) {
            url.searchParams.set('lab', shareUrl);
        } else {
            url.searchParams.delete('lab');
        }
        history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }

    function renderLabMarkdown(markdown, labUrl) {
        const html = marked.parse(markdown);
        contentDiv.innerHTML = html;

        const blockquotes = contentDiv.querySelectorAll('blockquote');
        blockquotes.forEach((bq) => {
            const firstP = bq.querySelector('p');
            if (!firstP) return;
            const match = firstP.innerHTML.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
            if (!match) return;

            const type = match[1].toLowerCase();
            bq.classList.add('markdown-alert', `markdown-alert-${type}`);
            firstP.innerHTML = firstP.innerHTML.substring(match[0].length).replace(/^<br\s*\/?>\s*/i, '');

            const title = document.createElement('div');
            title.className = 'markdown-alert-title';
            const icons = {
                note: '<svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path></svg>',
                tip: '<svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.75.75 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path></svg>',
                important: '<svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>',
                warning: '<svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.397c.65 1.222-.236 2.711-1.621 2.711H1.996C.61 15.155-.276 13.666.375 12.444Zm1.764 1.252a.25.25 0 0 0-.442 0L1.696 13.696a.25.25 0 0 0 .221.359h12.166a.25.25 0 0 0 .221-.359ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-.25-5.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0Z"></path></svg>',
                caution: '<svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>'
            };
            title.innerHTML = `${icons[type]} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
            bq.insertBefore(title, bq.firstChild);
        });

        const baseUrl = labUrl.substring(0, labUrl.lastIndexOf('/') + 1);
        contentDiv.querySelectorAll('img').forEach((img) => {
            const src = img.getAttribute('src');
            if (!src || src.startsWith('http') || src.startsWith('data:')) return;
            let cleanSrc = src;
            if (cleanSrc.startsWith('./')) cleanSrc = cleanSrc.substring(2);
            else if (cleanSrc.startsWith('/')) cleanSrc = cleanSrc.substring(1);
            img.src = baseUrl + cleanSrc;
        });

        contentDiv.querySelectorAll('a').forEach((link) => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#')) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });

        contentDiv.querySelectorAll('pre').forEach((pre) => {
            const btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.textContent = 'Copy';
            btn.addEventListener('click', () => {
                const codeElement = pre.querySelector('code');
                const textToCopy = codeElement ? codeElement.textContent : pre.textContent;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    btn.textContent = 'Copied!';
                    setTimeout(() => {
                        btn.textContent = 'Copy';
                    }, 2000);
                }).catch((err) => {
                    console.error('Error copying text:', err);
                    btn.textContent = 'Error';
                });
            });
            pre.appendChild(btn);
        });

        const headings = contentDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        tocList.innerHTML = '';
        headings.forEach((heading, index) => {
            if (!heading.id) {
                const baseId = heading.textContent
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
                heading.id = baseId || `heading-${index}`;
            }
            const li = document.createElement('li');
            const level = parseInt(heading.tagName.substring(1), 10);
            const a = document.createElement('a');
            a.href = '#' + heading.id;
            a.textContent = heading.textContent;
            a.style.paddingLeft = `${16 + (level - 1) * 12}px`;
            a.addEventListener('click', () => sideMenu.classList.remove('open'));
            li.appendChild(a);
            tocList.appendChild(li);
        });
    }

    async function loadLabFromInput(inputUrl, { shareUrl = null } = {}) {
        const rawUrl = normalizeLabUrl(inputUrl);
        const share = shareUrl || String(inputUrl || '').trim();

        contentDiv.innerHTML = '<p class="muted-prompt">Loading lab…</p>';
        setOpenStatus('Loading lab…');

        const response = await fetch(rawUrl, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} loading ${rawUrl}`);
        }
        const markdown = await response.text();
        renderLabMarkdown(markdown, rawUrl);
        updateBrowserLabQuery(share);
        closeOpenLabModal();
        setOpenStatus('');
    }

    async function submitOpenLab() {
        const value = githubLabUrl ? githubLabUrl.value.trim() : '';
        try {
            await loadLabFromInput(value);
        } catch (err) {
            console.error(err);
            setOpenStatus(err.message || String(err), true);
            contentDiv.innerHTML = `<div class="error">
                <strong>Failed to load lab:</strong><br>
                ${err.message || String(err)}
            </div>`;
        }
    }

    if (openLabBtn) openLabBtn.addEventListener('click', () => openOpenLabModal());
    if (openLabClose) openLabClose.addEventListener('click', closeOpenLabModal);
    if (openLabCancel) openLabCancel.addEventListener('click', closeOpenLabModal);
    if (openLabSubmit) openLabSubmit.addEventListener('click', submitOpenLab);
    if (openLabModal) {
        openLabModal.addEventListener('click', (e) => {
            if (e.target === openLabModal) closeOpenLabModal();
        });
    }
    if (githubLabUrl) {
        githubLabUrl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitOpenLab();
            }
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const initialLab = urlParams.get('lab');

    if (!initialLab) {
        openOpenLabModal();
        return;
    }

    if (!isAllowedGitHubLabUrl(initialLab)) {
        contentDiv.innerHTML = `<div class="error">
            <strong>Only GitHub lab URLs are supported.</strong><br><br>
            Use a github.com or raw.githubusercontent.com link.
        </div>`;
        openOpenLabModal(initialLab);
        return;
    }

    loadLabFromInput(initialLab).catch((error) => {
        console.error('Error fetching lab:', error);
        contentDiv.innerHTML = `<div class="error">
            <strong>Failed to load lab from URL:</strong><br>
            ${initialLab}<br><br>
            <strong>Error:</strong> ${error.message}
        </div>`;
        openOpenLabModal(initialLab);
        setOpenStatus(error.message || String(error), true);
    });
});
