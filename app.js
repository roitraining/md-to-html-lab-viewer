document.addEventListener('DOMContentLoaded', () => {
    const contentDiv = document.getElementById('content');
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenu = document.getElementById('close-menu');
    const sideMenu = document.getElementById('side-menu');
    const tocList = document.getElementById('toc-list');
    const fontDecrease = document.getElementById('font-decrease');
    const fontIncrease = document.getElementById('font-increase');
    const themeToggle = document.getElementById('theme-toggle');
    const exportDocxBtn = document.getElementById('export-docx-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
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

    const EXPAND_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/></svg>`;
    const RESTORE_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4"/><path d="M15 4v5h5"/><path d="M9 20v-5H4"/><path d="M15 20v-5h5"/></svg>`;

    function setImageZoomState(wrap, expanded) {
        const btn = wrap.querySelector('.lab-image-zoom-btn');
        const img = wrap.querySelector('img');
        wrap.classList.toggle('is-expanded', expanded);
        if (!btn) return;
        const alt = img && img.alt ? img.alt : '';
        if (expanded) {
            btn.innerHTML = RESTORE_ICON;
            btn.title = 'Restore image';
            btn.setAttribute('aria-label', alt ? `Restore image: ${alt}` : 'Restore image');
        } else {
            btn.innerHTML = EXPAND_ICON;
            btn.title = 'Expand image';
            btn.setAttribute('aria-label', alt ? `Expand image: ${alt}` : 'Expand image');
        }
    }

    function collapseExpandedLabImages(exceptWrap = null) {
        contentDiv.querySelectorAll('.lab-image-wrap.is-expanded').forEach((wrap) => {
            if (exceptWrap && wrap === exceptWrap) return;
            setImageZoomState(wrap, false);
        });
    }

    function setupLabImageZoom() {
        contentDiv.querySelectorAll('img').forEach((img) => {
            if (img.closest('.lab-image-wrap')) return;

            const wrap = document.createElement('div');
            wrap.className = 'lab-image-wrap';
            img.parentNode.insertBefore(wrap, img);
            wrap.appendChild(img);

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'lab-image-zoom-btn';
            btn.innerHTML = EXPAND_ICON;
            btn.title = 'Expand image';
            btn.setAttribute('aria-label', img.alt ? `Expand image: ${img.alt}` : 'Expand image');
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const willExpand = !wrap.classList.contains('is-expanded');
                if (willExpand) collapseExpandedLabImages(wrap);
                setImageZoomState(wrap, willExpand);
            });
            wrap.appendChild(btn);
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (!contentDiv.querySelector('.lab-image-wrap.is-expanded')) return;
        event.preventDefault();
        collapseExpandedLabImages();
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
                labUrl += 'lab.md';
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
        setupLabImageZoom();

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
        const firstH1 = contentDiv.querySelector('h1');
        const slugTitle = firstH1 && firstH1.textContent.trim()
            ? firstH1.textContent
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            : '';
        document.title = slugTitle || 'lab-viewer';
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
    if (exportDocxBtn) exportDocxBtn.addEventListener('click', exportLabToDocx);
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', prepareAndPrintPdf);
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

    let savedCodeState = [];
    let isPrinting = false;

    function expandTabsInElement(root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        let node = walker.nextNode();
        while (node) {
            if (node.nodeValue && node.nodeValue.includes('\t')) {
                textNodes.push(node);
            }
            node = walker.nextNode();
        }
        const originals = [];
        textNodes.forEach((textNode) => {
            originals.push({ node: textNode, value: textNode.nodeValue });
            textNode.nodeValue = textNode.nodeValue.replace(/\t/g, '    ');
        });
        return originals;
    }

    function preparePrintCodeBlocks() {
        savedCodeState = [];
        const preBlocks = contentDiv.querySelectorAll('pre');
        preBlocks.forEach((pre) => {
            const codeEl = pre.querySelector('code') || pre;
            const textRestores = expandTabsInElement(codeEl);
            if (textRestores.length) {
                savedCodeState.push({ textRestores });
            }
        });
    }

    function cleanupPrintState() {
        savedCodeState.forEach(({ textRestores }) => {
            textRestores.forEach(({ node, value }) => {
                node.nodeValue = value;
            });
        });
        savedCodeState = [];
        if (exportPdfBtn) exportPdfBtn.textContent = '🖨️';
        isPrinting = false;
    }

    async function prepareAndPrintPdf() {
        if (isPrinting || !contentDiv) return;
        isPrinting = true;
        if (exportPdfBtn) exportPdfBtn.textContent = '⏳';

        collapseExpandedLabImages();
        sideMenu.classList.remove('open');

        const images = Array.from(contentDiv.querySelectorAll('img'));
        images.forEach((img) => {
            const src = img.getAttribute('src');
            if (src) {
                try {
                    img.src = new URL(src, window.location.href).href;
                } catch (_) {
                    // Keep current src if resolution fails
                }
            }
            img.loading = 'eager';
            img.decoding = 'sync';
        });

        const imagePromises = images.map((img) => {
            if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
            return new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        });

        await Promise.all(imagePromises);
        await new Promise((resolve) => setTimeout(resolve, 100));

        preparePrintCodeBlocks();

        if (exportPdfBtn) exportPdfBtn.textContent = '🖨️';
        window.print();
    }

    window.addEventListener('afterprint', cleanupPrintState);

    document.addEventListener('keydown', (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key && event.key.toLowerCase() === 'p') {
            event.preventDefault();
            prepareAndPrintPdf();
        }
    });

    const DOCX_ICON = exportDocxBtn ? exportDocxBtn.innerHTML : '';
    let isExportingDocx = false;

    const ALERT_COLORS = {
        note: '0969DA',
        tip: '1A7F37',
        important: '8250DF',
        warning: '9A6700',
        caution: 'CF222E'
    };

    async function rasterizeImageToPng(img) {
        const src = img.currentSrc || img.src;
        if (!src) return null;

        const isSvg = /\.svg(\?|#|$)/i.test(src) || /^data:image\/svg\+xml/i.test(src);

        if (!isSvg) {
            try {
                const resp = await fetch(src, { mode: 'cors' });
                if (resp.ok) {
                    const contentType = (resp.headers.get('content-type') || '').toLowerCase();
                    if (contentType.includes('png') || contentType.includes('jpeg') || contentType.includes('jpg') || contentType.includes('gif')) {
                        const buf = await resp.arrayBuffer();
                        const type = contentType.includes('png')
                            ? 'png'
                            : (contentType.includes('gif') ? 'gif' : 'jpg');
                        return {
                            data: new Uint8Array(buf),
                            type,
                            width: img.naturalWidth || img.width || 560,
                            height: img.naturalHeight || img.height || 320
                        };
                    }
                }
            } catch (_) {
                // Fall back to canvas rasterization
            }
        }

        return new Promise((resolve) => {
            const probe = new Image();
            probe.crossOrigin = 'anonymous';
            probe.onload = () => {
                try {
                    const natW = probe.naturalWidth || probe.width || 600;
                    const natH = probe.naturalHeight || probe.height || 360;
                    const scale = 2;
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(natW * scale);
                    canvas.height = Math.round(natH * scale);
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(probe, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob(async (blob) => {
                        if (!blob) {
                            resolve(null);
                            return;
                        }
                        const buf = await blob.arrayBuffer();
                        resolve({
                            data: new Uint8Array(buf),
                            type: 'png',
                            width: natW,
                            height: natH
                        });
                    }, 'image/png');
                } catch (_) {
                    resolve(null);
                }
            };
            probe.onerror = () => resolve(null);
            probe.src = src;
        });
    }

    async function exportLabToDocx() {
        if (isExportingDocx || !contentDiv || !window.docx) return;
        isExportingDocx = true;
        if (exportDocxBtn) {
            exportDocxBtn.disabled = true;
            exportDocxBtn.textContent = '⏳';
        }

        try {
            const {
                Document,
                Packer,
                Paragraph,
                TextRun,
                HeadingLevel,
                Table,
                TableRow,
                TableCell,
                WidthType,
                BorderStyle,
                ShadingType,
                ImageRun,
                ExternalHyperlink,
                AlignmentType,
                LevelFormat,
                convertInchesToTwip
            } = window.docx;

            // Ensure all images in #content have absolute URLs and are loaded
            const images = Array.from(contentDiv.querySelectorAll('img'));
            images.forEach((img) => {
                const src = img.getAttribute('src');
                if (src) {
                    try {
                        img.src = new URL(src, window.location.href).href;
                    } catch (_) {
                        // Keep current src
                    }
                }
            });

            await Promise.all(images.map((img) => {
                if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            function buildInlineRuns(node, style = {}) {
                const runs = [];
                node.childNodes.forEach((child) => {
                    if (child.nodeType === Node.TEXT_NODE) {
                        const raw = child.nodeValue || '';
                        const normalized = raw.replace(/\s+/g, ' ');
                        if (!normalized) return;
                        runs.push(new TextRun({
                            text: normalized,
                            bold: !!style.bold,
                            italics: !!style.italics,
                            font: style.code ? 'Consolas' : 'Calibri',
                            size: style.size || (style.code ? 20 : 22),
                            color: style.color || '24292F',
                            shading: style.code
                                ? { type: ShadingType.CLEAR, color: 'auto', fill: 'EFF1F3' }
                                : undefined
                        }));
                        return;
                    }
                    if (child.nodeType !== Node.ELEMENT_NODE) return;

                    const tag = child.tagName.toLowerCase();
                    if (tag === 'button' || child.classList.contains('copy-btn') || child.classList.contains('lab-image-zoom-btn') || tag === 'svg') {
                        return;
                    }
                    if (tag === 'br') {
                        runs.push(new TextRun({ text: '', break: 1 }));
                        return;
                    }
                    if (tag === 'strong' || tag === 'b') {
                        runs.push(...buildInlineRuns(child, { ...style, bold: true }));
                        return;
                    }
                    if (tag === 'em' || tag === 'i') {
                        runs.push(...buildInlineRuns(child, { ...style, italics: true }));
                        return;
                    }
                    if (tag === 'code') {
                        const codeText = child.textContent || '';
                        runs.push(new TextRun({
                            text: codeText,
                            bold: !!style.bold,
                            italics: !!style.italics,
                            font: 'Consolas',
                            size: style.size ? Math.max(18, style.size - 2) : 20,
                            color: style.color || '24292F',
                            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'EFF1F3' }
                        }));
                        return;
                    }
                    if (tag === 'a') {
                        const href = child.getAttribute('href') || '';
                        const linkChildren = buildInlineRuns(child, {
                            ...style,
                            color: '0969DA'
                        });
                        if (href && /^https?:\/\//i.test(href) && linkChildren.length) {
                            runs.push(new ExternalHyperlink({
                                link: href,
                                children: linkChildren
                            }));
                        } else {
                            runs.push(...linkChildren);
                        }
                        return;
                    }
                    runs.push(...buildInlineRuns(child, style));
                });
                return runs;
            }

            function buildCodeBlockTable(preEl, indentTwip = 0) {
                const codeEl = preEl.querySelector('code');
                const rawText = (codeEl ? codeEl.textContent : preEl.textContent) || '';
                const cleanText = rawText
                    .replace(/\r\n/g, '\n')
                    .replace(/\r/g, '\n')
                    .replace(/\t/g, '    ')
                    .replace(/\n$/, '');

                const lines = cleanText.split('\n');
                const codeParagraphs = lines.map((lineText) => new Paragraph({
                    spacing: { before: 0, after: 0, line: 260 },
                    children: [
                        new TextRun({
                            text: lineText,
                            font: 'Consolas',
                            size: 19, // 9.5pt monospace so long lines fit comfortably and copy verbatim
                            color: '1F2328'
                        })
                    ]
                }));

                return new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    indent: indentTwip > 0 ? { size: indentTwip, type: WidthType.DXA } : undefined,
                    margins: {
                        top: 140,
                        bottom: 140,
                        left: 180,
                        right: 180
                    },
                    rows: [
                        new TableRow({
                            cantSplit: true,
                            children: [
                                new TableCell({
                                    shading: {
                                        type: ShadingType.CLEAR,
                                        color: 'auto',
                                        fill: 'F6F8FA'
                                    },
                                    borders: {
                                        top: { style: BorderStyle.SINGLE, size: 6, color: 'D0D7DE' },
                                        bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D0D7DE' },
                                        left: { style: BorderStyle.SINGLE, size: 6, color: 'D0D7DE' },
                                        right: { style: BorderStyle.SINGLE, size: 6, color: 'D0D7DE' }
                                    },
                                    children: codeParagraphs
                                })
                            ]
                        })
                    ]
                });
            }

            async function buildImageParagraph(imgEl, indentTwip = 0) {
                const asset = await rasterizeImageToPng(imgEl);
                if (!asset) return null;

                const maxW = 540;
                const scale = asset.width > maxW ? maxW / asset.width : 1;
                const width = Math.max(40, Math.round(asset.width * scale));
                const height = Math.max(24, Math.round(asset.height * scale));

                return new Paragraph({
                    indent: indentTwip > 0 ? { left: indentTwip } : undefined,
                    spacing: { before: 140, after: 180 },
                    children: [
                        new ImageRun({
                            data: asset.data,
                            type: asset.type,
                            transformation: { width, height }
                        })
                    ]
                });
            }

            async function buildAlertBlock(bqEl, indentTwip = 0) {
                let alertType = null;
                Object.keys(ALERT_COLORS).forEach((type) => {
                    if (bqEl.classList.contains(`markdown-alert-${type}`)) {
                        alertType = type;
                    }
                });
                const borderColor = (alertType && ALERT_COLORS[alertType]) || 'D0D7DE';
                const fillHex = alertType ? 'F8FAFC' : 'FFFFFF';

                const cellChildren = [];
                for (const child of Array.from(bqEl.children)) {
                    if (child.classList.contains('markdown-alert-title')) {
                        const label = child.textContent.trim() || (alertType ? alertType.toUpperCase() : 'Note');
                        cellChildren.push(new Paragraph({
                            spacing: { before: 40, after: 80 },
                            children: [
                                new TextRun({
                                    text: label,
                                    bold: true,
                                    font: 'Calibri',
                                    size: 22,
                                    color: borderColor
                                })
                            ]
                        }));
                        continue;
                    }
                    const nested = await convertElement(child, { indentTwip: 0 });
                    cellChildren.push(...nested);
                }

                if (!cellChildren.length) return [];

                return [
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        indent: indentTwip > 0 ? { size: indentTwip, type: WidthType.DXA } : undefined,
                        margins: {
                            top: 100,
                            bottom: 100,
                            left: 180,
                            right: 160
                        },
                        rows: [
                            new TableRow({
                                cantSplit: true,
                                children: [
                                    new TableCell({
                                        shading: {
                                            type: ShadingType.CLEAR,
                                            color: 'auto',
                                            fill: fillHex
                                        },
                                        borders: {
                                            left: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
                                            top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                                            bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                                            right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
                                        },
                                        children: cellChildren
                                    })
                                ]
                            })
                        ]
                    }),
                    new Paragraph({ spacing: { before: 0, after: 120 }, children: [] })
                ];
            }

            function buildMarkdownTable(tableEl, indentTwip = 0) {
                const trEls = Array.from(tableEl.querySelectorAll('tr'));
                if (!trEls.length) return [];

                const rows = trEls.map((tr, rowIndex) => {
                    const cells = Array.from(tr.querySelectorAll('th, td'));
                    const isHeader = rowIndex === 0 && tr.querySelector('th');
                    return new TableRow({
                        tableHeader: !!isHeader,
                        cantSplit: true,
                        children: cells.map((cell) => new TableCell({
                            shading: isHeader
                                ? { type: ShadingType.CLEAR, color: 'auto', fill: 'EAECEF' }
                                : (rowIndex % 2 === 0
                                    ? { type: ShadingType.CLEAR, color: 'auto', fill: 'F6F8FA' }
                                    : undefined),
                            margins: { top: 80, bottom: 80, left: 120, right: 120 },
                            borders: {
                                top: { style: BorderStyle.SINGLE, size: 4, color: 'D0D7DE' },
                                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D0D7DE' },
                                left: { style: BorderStyle.SINGLE, size: 4, color: 'D0D7DE' },
                                right: { style: BorderStyle.SINGLE, size: 4, color: 'D0D7DE' }
                            },
                            children: [
                                new Paragraph({
                                    spacing: { before: 20, after: 20 },
                                    children: buildInlineRuns(cell, { bold: !!isHeader })
                                })
                            ]
                        }))
                    });
                });

                return [
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        indent: indentTwip > 0 ? { size: indentTwip, type: WidthType.DXA } : undefined,
                        rows
                    }),
                    new Paragraph({ spacing: { before: 0, after: 140 }, children: [] })
                ];
            }

            async function convertListItem(liEl, listKind, level, itemNumber) {
                const blocks = [];
                const indentTwip = (level + 1) * 360;
                const prefixText = listKind === 'ol' ? `${itemNumber}. ` : '• ';
                let prefixUsed = false;

                let inlineBucket = [];
                async function flushInlineBucket() {
                    if (!inlineBucket.length) return;
                    const wrapper = document.createElement('span');
                    inlineBucket.forEach((n) => wrapper.appendChild(n.cloneNode(true)));
                    inlineBucket = [];
                    const runs = buildInlineRuns(wrapper);
                    if (!runs.length) return;
                    const prefixRun = !prefixUsed
                        ? [new TextRun({ text: prefixText, bold: listKind === 'ol', font: 'Calibri', size: 22, color: '24292F' })]
                        : [];
                    prefixUsed = true;
                    blocks.push(new Paragraph({
                        indent: { left: indentTwip, hanging: prefixRun.length ? 220 : 0 },
                        spacing: { before: 60, after: 80 },
                        children: [...prefixRun, ...runs]
                    }));
                }

                for (const child of Array.from(liEl.childNodes)) {
                    if (child.nodeType === Node.TEXT_NODE) {
                        if (child.nodeValue && child.nodeValue.trim()) {
                            inlineBucket.push(child);
                        }
                        continue;
                    }
                    if (child.nodeType !== Node.ELEMENT_NODE) continue;

                    const tag = child.tagName.toLowerCase();
                    const isBlock = ['p', 'pre', 'blockquote', 'ul', 'ol', 'table', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag);
                    if (!isBlock) {
                        inlineBucket.push(child);
                        continue;
                    }

                    await flushInlineBucket();

                    if (tag === 'p') {
                        const imgInP = child.querySelector('img');
                        if (imgInP && child.textContent.trim() === '') {
                            const imgPara = await buildImageParagraph(imgInP, indentTwip);
                            if (imgPara) blocks.push(imgPara);
                            continue;
                        }
                        const runs = buildInlineRuns(child);
                        if (runs.length) {
                            const prefixRun = !prefixUsed
                                ? [new TextRun({ text: prefixText, bold: listKind === 'ol', font: 'Calibri', size: 22, color: '24292F' })]
                                : [];
                            prefixUsed = true;
                            blocks.push(new Paragraph({
                                indent: { left: indentTwip, hanging: prefixRun.length ? 220 : 0 },
                                spacing: { before: 60, after: 80 },
                                children: [...prefixRun, ...runs]
                            }));
                        }
                        continue;
                    }

                    if (tag === 'ul' || tag === 'ol') {
                        const subItems = Array.from(child.children).filter((c) => c.tagName && c.tagName.toLowerCase() === 'li');
                        for (let idx = 0; idx < subItems.length; idx++) {
                            const subBlocks = await convertListItem(subItems[idx], tag, level + 1, idx + 1);
                            blocks.push(...subBlocks);
                        }
                        continue;
                    }

                    const converted = await convertElement(child, { indentTwip });
                    if (converted.length) {
                        blocks.push(...converted);
                    }
                }

                await flushInlineBucket();
                return blocks;
            }

            async function convertElement(el, options = {}) {
                const indentTwip = options.indentTwip || 0;
                const tag = el.tagName ? el.tagName.toLowerCase() : '';

                if (!tag || tag === 'button' || tag === 'script' || tag === 'style') {
                    return [];
                }

                if (/^h[1-6]$/.test(tag)) {
                    const levelNum = parseInt(tag.substring(1), 10);
                    const headingMap = {
                        1: HeadingLevel.HEADING_1,
                        2: HeadingLevel.HEADING_2,
                        3: HeadingLevel.HEADING_3,
                        4: HeadingLevel.HEADING_4,
                        5: HeadingLevel.HEADING_5,
                        6: HeadingLevel.HEADING_6
                    };
                    const sizeMap = { 1: 36, 2: 28, 3: 24, 4: 22, 5: 20, 6: 20 };
                    return [
                        new Paragraph({
                            heading: headingMap[levelNum],
                            keepNext: true,
                            spacing: { before: levelNum === 1 ? 120 : 240, after: 120 },
                            children: buildInlineRuns(el, {
                                bold: true,
                                size: sizeMap[levelNum],
                                color: '003865'
                            })
                        })
                    ];
                }

                if (tag === 'p') {
                    const imgs = Array.from(el.querySelectorAll('img'));
                    if (imgs.length && el.textContent.trim() === '') {
                        const out = [];
                        for (const img of imgs) {
                            const p = await buildImageParagraph(img, indentTwip);
                            if (p) out.push(p);
                        }
                        return out;
                    }
                    const runs = buildInlineRuns(el);
                    const out = [];
                    if (runs.length) {
                        out.push(new Paragraph({
                            indent: indentTwip > 0 ? { left: indentTwip } : undefined,
                            spacing: { before: 60, after: 120 },
                            children: runs
                        }));
                    }
                    for (const img of imgs) {
                        const p = await buildImageParagraph(img, indentTwip);
                        if (p) out.push(p);
                    }
                    return out;
                }

                if (tag === 'div' && el.classList.contains('lab-image-wrap')) {
                    const img = el.querySelector('img');
                    if (!img) return [];
                    const p = await buildImageParagraph(img, indentTwip);
                    return p ? [p] : [];
                }

                if (tag === 'img') {
                    const p = await buildImageParagraph(el, indentTwip);
                    return p ? [p] : [];
                }

                if (tag === 'pre') {
                    return [
                        buildCodeBlockTable(el, indentTwip),
                        new Paragraph({ spacing: { before: 0, after: 120 }, children: [] })
                    ];
                }

                if (tag === 'blockquote') {
                    return buildAlertBlock(el, indentTwip);
                }

                if (tag === 'table') {
                    return buildMarkdownTable(el, indentTwip);
                }

                if (tag === 'ul' || tag === 'ol') {
                    const out = [];
                    const items = Array.from(el.children).filter((c) => c.tagName && c.tagName.toLowerCase() === 'li');
                    for (let idx = 0; idx < items.length; idx++) {
                        const itemBlocks = await convertListItem(items[idx], tag, 0, idx + 1);
                        out.push(...itemBlocks);
                    }
                    return out;
                }

                const out = [];
                for (const child of Array.from(el.children)) {
                    const childBlocks = await convertElement(child, options);
                    out.push(...childBlocks);
                }
                return out;
            }

            const docChildren = [];
            for (const child of Array.from(contentDiv.children)) {
                const blocks = await convertElement(child);
                docChildren.push(...blocks);
            }

            const doc = new Document({
                sections: [
                    {
                        properties: {
                            page: {
                                margin: {
                                    top: convertInchesToTwip(0.6),
                                    bottom: convertInchesToTwip(0.6),
                                    left: convertInchesToTwip(0.65),
                                    right: convertInchesToTwip(0.65)
                                }
                            }
                        },
                        children: docChildren
                    }
                ]
            });

            const blob = await Packer.toBlob(doc);
            const filename = `${document.title || 'lab'}.docx`;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        } catch (err) {
            console.error('Error exporting Word document:', err);
            window.alert(`Failed to export Word document: ${err.message || err}`);
        } finally {
            if (exportDocxBtn) {
                exportDocxBtn.disabled = false;
                exportDocxBtn.innerHTML = DOCX_ICON;
            }
            isExportingDocx = false;
        }
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
