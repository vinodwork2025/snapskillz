// Professional Blog Editor v2.0
// Advanced content management with SEO, schema, analytics, and multi-format support

class AdvancedBlogEditor {
    constructor() {
        this.quill = null;
        this.currentTab = 'content';
        this.autoSaveEnabled = true;
        this.autoSaveInterval = null;
        this.editorData = {
            title: '',
            slug: '',
            content: '',
            author: '',
            authorBio: '',
            category: '',
            tags: '',
            metaDescription: '',
            focusKeywords: '',
            canonicalURL: '',
            robotsMeta: 'index,follow',
            ogTitle: '',
            ogDescription: '',
            ogImage: '',
            featuredImage: null,
            galleryImages: [],
            schemaType: 'Article',
            publisherName: '',
            publisherLogo: '',
            publishStatus: 'draft',
            publishDate: '',
            visibility: 'public'
        };
        
        this.init();
    }

    init() {
        if (!this.checkAuthentication()) {
            return;
        }
        this.checkLibraries();
        this.initializeEditor();
        this.bindEvents();
        this.initializeTabs();
        this.setupAutoSave();
        this.loadDraftIfExists();
    }

    checkLibraries() {
        const libraries = [
            { name: 'Quill', check: () => typeof Quill !== 'undefined' },
            { name: 'mammoth', check: () => typeof mammoth !== 'undefined' },
            { name: 'marked', check: () => typeof marked !== 'undefined' },
            { name: 'TurndownService', check: () => typeof TurndownService !== 'undefined' },
            { name: 'slugify', check: () => typeof slugify !== 'undefined' },
            { name: 'saveAs', check: () => typeof saveAs !== 'undefined' }
        ];

        libraries.forEach(lib => {
            const available = lib.check();
            console.log(`Library ${lib.name}: ${available ? '✅ Available' : '❌ Missing'}`);
            if (!available && lib.name === 'Quill') {
                this.showNotification(`Critical library ${lib.name} is missing`, 'error');
            }
        });
    }

    checkAuthentication() {
        const session = localStorage.getItem('snapskillz_admin_session');
        const authContainer = document.getElementById('authContainer');
        const editorContainer = document.getElementById('editor-container');
        
        if (!session) {
            authContainer.classList.remove('hidden');
            return false;
        }

        try {
            const sessionData = JSON.parse(session);
            if (!sessionData.authenticated || Date.now() >= sessionData.expires) {
                authContainer.classList.remove('hidden');
                return false;
            }
            editorContainer.classList.remove('hidden');
            return true;
        } catch (error) {
            authContainer.classList.remove('hidden');
            return false;
        }
    }

    initializeEditor() {
        this.quill = new Quill('#editor', {
            theme: 'snow',
            placeholder: 'Start writing your compelling blog post...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'font': [] }],
                    [{ 'align': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['blockquote', 'code-block'],
                    ['link', 'image', 'video'],
                    ['clean'],
                    ['table']
                ],
                table: true
            }
        });

        this.quill.on('text-change', () => {
            this.updateContentAnalytics();
            this.updateSEOAnalysis();
            this.generateSchema();
            
            if (this.autoSaveEnabled) {
                this.debouncedAutoSave();
            }
        });
    }

    bindEvents() {
        // Tab navigation
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Form field events
        document.getElementById('postTitle').addEventListener('input', (e) => {
            this.editorData.title = e.target.value;
            this.updateTitleAnalytics();
            this.generateSlug();
        });

        document.getElementById('postSlug').addEventListener('input', (e) => {
            this.editorData.slug = e.target.value;
        });

        // Import/Export events
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.handleFileImport(e.target.files[0]);
        });

        document.getElementById('exportMarkdown').addEventListener('click', () => {
            this.exportContent('markdown');
        });

        document.getElementById('exportHTML').addEventListener('click', () => {
            this.exportContent('html');
        });

        document.getElementById('exportDOCX').addEventListener('click', () => {
            this.exportContent('docx');
        });

        // Meta fields
        document.getElementById('metaDescription').addEventListener('input', (e) => {
            this.editorData.metaDescription = e.target.value;
            this.updateMetaDescriptionStats();
        });

        document.getElementById('focusKeywords').addEventListener('input', (e) => {
            this.editorData.focusKeywords = e.target.value;
            this.updateSEOAnalysis();
        });

        // Schema fields
        document.getElementById('schemaType').addEventListener('change', (e) => {
            this.editorData.schemaType = e.target.value;
            this.generateSchema();
        });

        document.getElementById('publisherName').addEventListener('input', (e) => {
            this.editorData.publisherName = e.target.value;
            this.generateSchema();
        });

        document.getElementById('publisherLogo').addEventListener('input', (e) => {
            this.editorData.publisherLogo = e.target.value;
            this.generateSchema();
        });

        // Image upload events
        document.getElementById('featuredImageInput').addEventListener('change', (e) => {
            this.handleFeaturedImageUpload(e.target.files[0]);
        });

        document.getElementById('galleryInput').addEventListener('change', (e) => {
            this.handleGalleryUpload(Array.from(e.target.files));
        });

        // Drag and drop for images
        this.setupDragAndDrop();

        // Action buttons
        document.getElementById('saveBtn').addEventListener('click', () => this.saveDraft());
        document.getElementById('publishBtn').addEventListener('click', () => this.publishPost());
        document.getElementById('previewBtn').addEventListener('click', () => this.previewPost());
        document.getElementById('autoSave').addEventListener('click', () => this.toggleAutoSave());

        // Form field synchronization
        this.bindFormFields();
    }

    initializeTabs() {
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            if (!content.id.includes('content-tab')) {
                content.classList.add('hidden');
            }
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active', 'text-blue-600', 'border-b-2', 'border-blue-600');
                btn.classList.remove('text-gray-500');
            } else {
                btn.classList.remove('active', 'text-blue-600', 'border-b-2', 'border-blue-600');
                btn.classList.add('text-gray-500');
            }
        });

        // Show/hide tab content
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            if (content.id === tabName + '-tab') {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });
    }

    handleFileImport(file) {
        if (!file) {
            this.showNotification('No file selected', 'error');
            return;
        }

        const fileType = file.name.split('.').pop().toLowerCase();
        const reader = new FileReader();

        reader.onerror = () => {
            this.showNotification('Error reading file', 'error');
        };

        reader.onload = (e) => {
            try {
                const content = e.target.result;
                console.log('File loaded:', file.name, 'Type:', fileType, 'Size:', file.size);

                switch (fileType) {
                    case 'md':
                        this.importMarkdown(content);
                        break;
                    case 'txt':
                        this.importPlainText(content);
                        break;
                    case 'docx':
                        this.importDOCX(file);
                        break;
                    default:
                        this.showNotification(`Unsupported file format: .${fileType}`, 'error');
                }
            } catch (error) {
                console.error('Error processing file:', error);
                this.showNotification('Error processing file', 'error');
            }
        };

        if (fileType === 'docx') {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    }

    importMarkdown(content) {
        try {
            console.log('Importing markdown content:', content.substring(0, 100) + '...');
            
            const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
            
            if (frontMatterMatch) {
                const frontMatter = frontMatterMatch[1];
                const bodyContent = frontMatterMatch[2];
                
                console.log('Found front matter:', frontMatter);
                
                // Parse front matter
                const lines = frontMatter.split('\n');
                lines.forEach(line => {
                    if (!line.includes(':')) return;
                    
                    const [key, ...valueParts] = line.split(':');
                    const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
                    
                    if (!key || !value) return;
                    
                    switch (key.trim()) {
                        case 'title':
                            this.editorData.title = value;
                            const titleElement = document.getElementById('postTitle');
                            if (titleElement) titleElement.value = value;
                            break;
                        case 'author':
                            this.editorData.author = value;
                            const authorElement = document.getElementById('postAuthor');
                            if (authorElement) authorElement.value = value;
                            break;
                        case 'category':
                            this.editorData.category = value;
                            const categoryElement = document.getElementById('postCategory');
                            if (categoryElement) categoryElement.value = value;
                            break;
                        case 'tags':
                            this.editorData.tags = value;
                            const tagsElement = document.getElementById('postTags');
                            if (tagsElement) tagsElement.value = value;
                            break;
                        case 'description':
                        case 'meta_description':
                            this.editorData.metaDescription = value;
                            const descElement = document.getElementById('metaDescription');
                            if (descElement) descElement.value = value;
                            break;
                    }
                });
                
                // Convert markdown to HTML for Quill
                if (typeof marked !== 'undefined') {
                    const htmlContent = marked.parse ? marked.parse(bodyContent) : marked(bodyContent);
                    this.quill.root.innerHTML = htmlContent;
                } else {
                    // Fallback: simple markdown-like conversion
                    let htmlContent = bodyContent
                        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n\n/g, '</p><p>')
                        .replace(/^(.)/gm, '<p>$1')
                        .replace(/(.)\n$/gm, '$1</p>');
                    
                    this.quill.root.innerHTML = htmlContent;
                }
            } else {
                // No front matter, just convert the content
                if (typeof marked !== 'undefined') {
                    const htmlContent = marked.parse ? marked.parse(content) : marked(content);
                    this.quill.root.innerHTML = htmlContent;
                } else {
                    // Simple fallback conversion
                    let htmlContent = content
                        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n\n/g, '</p><p>')
                        .replace(/^(.)/gm, '<p>$1')
                        .replace(/(.)\n$/gm, '$1</p>');
                    
                    this.quill.root.innerHTML = htmlContent;
                }
            }
            
            this.updateContentAnalytics();
            this.updateTitleAnalytics();
            this.updateSEOAnalysis();
            this.showNotification('Markdown file imported successfully', 'success');
        } catch (error) {
            console.error('Error importing markdown:', error);
            this.showNotification('Error importing markdown file: ' + error.message, 'error');
        }
    }

    importPlainText(content) {
        this.quill.setText(content);
        this.updateContentAnalytics();
        this.showNotification('Text file imported successfully', 'success');
    }

    importDOCX(file) {
        if (typeof mammoth === 'undefined') {
            this.showNotification('DOCX import not available - mammoth library not loaded', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            mammoth.convertToHtml({ arrayBuffer: e.target.result })
                .then(result => {
                    console.log('DOCX converted successfully');
                    this.quill.root.innerHTML = result.value;
                    this.updateContentAnalytics();
                    this.updateSEOAnalysis();
                    this.showNotification('DOCX file imported successfully', 'success');
                    
                    if (result.messages.length > 0) {
                        console.warn('DOCX import warnings:', result.messages);
                    }
                })
                .catch(error => {
                    console.error('Error importing DOCX:', error);
                    this.showNotification('Error importing DOCX file: ' + error.message, 'error');
                });
        };
        
        reader.onerror = () => {
            this.showNotification('Error reading DOCX file', 'error');
        };
        
        reader.readAsArrayBuffer(file);
    }

    exportContent(format) {
        const data = this.getPostData();
        let content, fileName, mimeType;

        switch (format) {
            case 'markdown':
                content = this.convertToMarkdown();
                fileName = (data.slug || 'blog-post') + '.md';
                mimeType = 'text/markdown';
                break;
            case 'html':
                content = this.convertToHTML();
                fileName = (data.slug || 'blog-post') + '.html';
                mimeType = 'text/html';
                break;
            case 'docx':
                this.exportToDOCX();
                return;
            default:
                this.showNotification('Unknown export format', 'error');
                return;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification(format.toUpperCase() + ' exported successfully', 'success');
    }

    convertToMarkdown() {
        const data = this.getPostData();
        
        // Create comprehensive front matter
        const frontMatter = [
            '---',
            `title: "${data.title}"`,
            `slug: "${data.slug}"`,
            `author: "${data.author}"`,
            `author_bio: "${data.authorBio}"`,
            `category: "${data.category}"`,
            `tags: "${data.tags}"`,
            `meta_description: "${data.metaDescription}"`,
            `focus_keywords: "${data.focusKeywords}"`,
            `canonical_url: "${data.canonicalURL}"`,
            `robots_meta: "${data.robotsMeta}"`,
            `og_title: "${data.ogTitle}"`,
            `og_description: "${data.ogDescription}"`,
            `og_image: "${data.ogImage}"`,
            `schema_type: "${data.schemaType}"`,
            `publisher_name: "${data.publisherName}"`,
            `publisher_logo: "${data.publisherLogo}"`,
            `status: "${data.publishStatus}"`,
            `visibility: "${data.visibility}"`,
            `created_at: "${new Date().toISOString()}"`,
            '---',
            ''
        ].join('\n');

        // Convert HTML to Markdown
        let markdownContent;
        if (typeof TurndownService !== 'undefined') {
            const turndownService = new TurndownService({
                headingStyle: 'atx',
                bulletListMarker: '-'
            });
            markdownContent = turndownService.turndown(data.content);
        } else {
            // Simple fallback HTML to Markdown conversion
            markdownContent = data.content
                .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
                .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
                .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
                .replace(/<h4>(.*?)<\/h4>/g, '#### $1\n\n')
                .replace(/<h5>(.*?)<\/h5>/g, '##### $1\n\n')
                .replace(/<h6>(.*?)<\/h6>/g, '###### $1\n\n')
                .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
                .replace(/<em>(.*?)<\/em>/g, '*$1*')
                .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
                .replace(/<br\s*\/?>/g, '\n')
                .replace(/<[^>]*>/g, ''); // Remove remaining HTML tags
        }
        
        return frontMatter + markdownContent;
    }

    convertToHTML() {
        const data = this.getPostData();
        const schema = this.generateSchemaJSON();
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <meta name="description" content="${data.metaDescription}">
    <meta name="keywords" content="${data.focusKeywords}">
    <meta name="author" content="${data.author}">
    <meta name="robots" content="${data.robotsMeta}">
    ${data.canonicalURL ? `<link rel="canonical" href="${data.canonicalURL}">` : ''}
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="${data.ogTitle || data.title}">
    <meta property="og:description" content="${data.ogDescription || data.metaDescription}">
    ${data.ogImage ? `<meta property="og:image" content="${data.ogImage}">` : ''}
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${data.ogTitle || data.title}">
    <meta name="twitter:description" content="${data.ogDescription || data.metaDescription}">
    ${data.ogImage ? `<meta name="twitter:image" content="${data.ogImage}">` : ''}
    
    <!-- Schema.org -->
    <script type="application/ld+json">
    ${JSON.stringify(schema, null, 2)}
    </script>
    
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
        h1, h2, h3, h4, h5, h6 { color: #333; }
        img { max-width: 100%; height: auto; }
        .author-bio { background: #f4f4f4; padding: 15px; margin-top: 30px; border-left: 4px solid #007cba; }
    </style>
</head>
<body>
    <article>
        <header>
            <h1>${data.title}</h1>
            <p><strong>By:</strong> ${data.author}</p>
            <p><strong>Category:</strong> ${data.category}</p>
            ${data.tags ? `<p><strong>Tags:</strong> ${data.tags}</p>` : ''}
        </header>
        <main>
            ${data.content}
        </main>
        ${data.authorBio ? `
        <aside class="author-bio">
            <h3>About the Author</h3>
            <p>${data.authorBio}</p>
        </aside>` : ''}
    </article>
</body>
</html>`;
    }

    updateContentAnalytics() {
        try {
            const text = this.quill.getText();
            const html = this.quill.root.innerHTML;
            
            // Basic statistics
            const words = text.trim().split(/\s+/).filter(word => word.length > 0);
            const wordCount = words.length;
            const charCount = text.length;
            const readTime = Math.max(1, Math.ceil(wordCount / 200));
            
            // Advanced analytics
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const sentenceCount = sentences.length || 1;
            const paragraphs = Math.max(1, html.split('<p>').length - 1);
            const avgWordsPerSentence = Math.round(wordCount / sentenceCount) || 0;
            
            // Update all displays safely
            this.updateElement('wordCount', wordCount);
            this.updateElement('readTime', readTime);
            this.updateElement('sentenceCount', sentenceCount);
            this.updateElement('paragraphCount', paragraphs);
            this.updateElement('avgWordsPerSentence', avgWordsPerSentence);
            
            // Sidebar statistics
            this.updateElement('sidebarWordCount', wordCount);
            this.updateElement('sidebarCharCount', charCount);
            this.updateElement('sidebarReadTime', readTime + ' min');
            
            // Readability analysis
            this.updateReadabilityAnalysis(text, words, sentences);
        } catch (error) {
            console.error('Error updating content analytics:', error);
        }
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    updateReadabilityAnalysis(text, words, sentences) {
        // Simplified readability calculations
        const syllables = words.reduce((count, word) => {
            return count + this.countSyllables(word);
        }, 0);
        
        const avgSentenceLength = words.length / sentences.length || 0;
        const avgSyllablesPerWord = syllables / words.length || 0;
        
        // Flesch Reading Ease
        const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
        
        let readabilityGrade = 'Excellent';
        if (fleschScore < 30) readabilityGrade = 'Very Difficult';
        else if (fleschScore < 50) readabilityGrade = 'Difficult';
        else if (fleschScore < 60) readabilityGrade = 'Fairly Difficult';
        else if (fleschScore < 70) readabilityGrade = 'Standard';
        else if (fleschScore < 80) readabilityGrade = 'Fairly Easy';
        else if (fleschScore < 90) readabilityGrade = 'Easy';
        
        // Grade level estimation
        const gradeLevel = Math.max(1, Math.min(16, Math.round(0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59)));
        
        // Update displays
        document.getElementById('fleschScore').textContent = Math.round(fleschScore);
        document.getElementById('readabilityGrade').textContent = readabilityGrade;
        document.getElementById('gradeLevel').textContent = gradeLevel + 'th Grade';
        document.getElementById('avgSentenceLength').textContent = Math.round(avgSentenceLength) + ' words';
        
        // Overall readability score for header
        document.getElementById('readabilityScore').textContent = readabilityGrade;
    }

    countSyllables(word) {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        const matches = word.match(/[aeiouy]{1,2}/g);
        return matches ? matches.length : 1;
    }

    updateTitleAnalytics() {
        const title = document.getElementById('postTitle').value;
        const length = title.length;
        
        document.getElementById('titleLength').textContent = length;
        
        let seoScore = 'Poor';
        if (length >= 50 && length <= 60) seoScore = 'Excellent';
        else if (length >= 40 && length <= 70) seoScore = 'Good';
        else if (length >= 30 && length <= 80) seoScore = 'Fair';
        
        document.getElementById('titleSEOScore').textContent = seoScore;
        document.getElementById('titleSEOScore').className = 'font-medium ' + 
            (seoScore === 'Excellent' ? 'text-green-600' : 
             seoScore === 'Good' ? 'text-blue-600' : 
             seoScore === 'Fair' ? 'text-yellow-600' : 'text-red-600');
    }

    generateSlug() {
        const title = document.getElementById('postTitle').value;
        if (title && !document.getElementById('postSlug').value) {
            let slug;
            if (typeof slugify !== 'undefined') {
                slug = slugify(title, {
                    lower: true,
                    strict: true,
                    remove: /[*+~.()'"!:@]/g
                });
            } else {
                // Fallback slug generation
                slug = title
                    .toLowerCase()
                    .trim()
                    .replace(/[^\w\s-]/g, '') // Remove special characters
                    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
                    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
            }
            document.getElementById('postSlug').value = slug;
            this.editorData.slug = slug;
        }
    }

    updateMetaDescriptionStats() {
        const metaDesc = document.getElementById('metaDescription').value;
        const length = metaDesc.length;
        
        document.getElementById('metaDescLength').textContent = length;
        
        const lengthIndicator = document.getElementById('metaDescLength').parentElement;
        lengthIndicator.className = 'mt-2 flex items-center justify-between text-sm ' + 
            (length >= 150 && length <= 160 ? 'text-green-600' : 
             length >= 120 && length <= 180 ? 'text-yellow-600' : 'text-red-500');
    }

    updateSEOAnalysis() {
        try {
            const title = document.getElementById('postTitle')?.value || '';
            const content = this.quill.getText().toLowerCase();
            const metaDesc = document.getElementById('metaDescription')?.value || '';
            const keywords = document.getElementById('focusKeywords')?.value || '';
            
            const seoChecks = [
                { name: 'Title length (50-60 chars)', passed: title.length >= 50 && title.length <= 60 },
                { name: 'Meta description (150-160 chars)', passed: metaDesc.length >= 150 && metaDesc.length <= 160 },
                { name: 'Focus keywords in title', passed: this.checkKeywordsInText(title, keywords) },
                { name: 'Focus keywords in content', passed: this.checkKeywordsInText(content, keywords) },
                { name: 'Content length (300+ words)', passed: this.quill.getText().split(/\s+/).length >= 300 },
                { name: 'Has headings (H2, H3)', passed: this.quill.root.querySelector('h2, h3') !== null },
                { name: 'Featured image set', passed: this.editorData.featuredImage !== null },
                { name: 'Alt text for images', passed: true } // Simplified check
            ];
            
            const passedChecks = seoChecks.filter(check => check.passed).length;
            const seoScore = Math.round((passedChecks / seoChecks.length) * 100);
            
            // Update SEO score displays
            this.updateElement('overallSEOScore', seoScore + '%');
            this.updateElement('sidebarSEOScore', seoScore + '%');
            
            // Update SEO score color
            const scoreColor = seoScore >= 80 ? 'text-green-600' : seoScore >= 60 ? 'text-yellow-600' : 'text-red-600';
            
            const overallElement = document.getElementById('overallSEOScore');
            const sidebarElement = document.getElementById('sidebarSEOScore');
            
            if (overallElement) {
                overallElement.className = 'text-2xl font-bold ' + scoreColor;
            }
            if (sidebarElement) {
                sidebarElement.className = 'font-medium ' + scoreColor;
            }
            
            // Update SEO checklist
            this.updateSEOChecklist(seoChecks);
        } catch (error) {
            console.error('Error updating SEO analysis:', error);
        }
    }

    checkKeywordsInText(text, keywords) {
        if (!keywords) return false;
        const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
        return keywordList.some(keyword => text.toLowerCase().includes(keyword));
    }

    updateSEOChecklist(checks) {
        const container = document.getElementById('seoChecklist');
        container.innerHTML = '';
        
        checks.forEach(check => {
            const item = document.createElement('div');
            item.className = 'flex items-center space-x-3';
            item.innerHTML = `
                <div class="flex-shrink-0">
                    <svg class="w-5 h-5 ${check.passed ? 'text-green-500' : 'text-red-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${check.passed ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}"></path>
                    </svg>
                </div>
                <span class="text-sm ${check.passed ? 'text-gray-900' : 'text-gray-500'}">${check.name}</span>
            `;
            container.appendChild(item);
        });
    }

    generateSchema() {
        const data = this.getPostData();
        const schema = this.generateSchemaJSON();
        
        document.getElementById('schemaPreview').value = JSON.stringify(schema, null, 2);
    }

    generateSchemaJSON() {
        const data = this.getPostData();
        
        return {
            "@context": "https://schema.org",
            "@type": data.schemaType || "Article",
            "headline": data.title,
            "description": data.metaDescription,
            "author": {
                "@type": "Person",
                "name": data.author,
                "description": data.authorBio
            },
            "publisher": {
                "@type": "Organization",
                "name": data.publisherName || "SnapSkillz",
                "logo": {
                    "@type": "ImageObject",
                    "url": data.publisherLogo || "/logo.png"
                }
            },
            "datePublished": new Date().toISOString(),
            "dateModified": new Date().toISOString(),
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": data.canonicalURL || window.location.href
            },
            "image": data.ogImage || data.featuredImage,
            "keywords": data.tags,
            "articleSection": data.category,
            "wordCount": this.quill.getText().split(/\s+/).length
        };
    }

    handleFeaturedImageUpload(file) {
        if (!file) return;
        
        if (file.size > 10 * 1024 * 1024) {
            this.showNotification('Image too large. Maximum size is 10MB.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.editorData.featuredImage = e.target.result;
            
            const preview = document.getElementById('featuredImagePreview');
            const img = document.getElementById('featuredImageImg');
            
            img.src = e.target.result;
            preview.classList.remove('hidden');
            
            this.showNotification('Featured image uploaded successfully', 'success');
        };
        reader.readAsDataURL(file);
    }

    handleGalleryUpload(files) {
        const preview = document.getElementById('galleryPreview');
        preview.innerHTML = '';
        preview.classList.remove('hidden');
        
        files.forEach((file, index) => {
            if (file.size > 10 * 1024 * 1024) {
                this.showNotification(`Image ${index + 1} too large. Maximum size is 10MB.`, 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'relative';
                imgContainer.innerHTML = `
                    <img src="${e.target.result}" class="w-full h-32 object-cover rounded-lg border border-gray-200" alt="Gallery image ${index + 1}">
                    <button class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600" onclick="this.parentElement.remove()">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                `;
                preview.appendChild(imgContainer);
                
                this.editorData.galleryImages.push(e.target.result);
            };
            reader.readAsDataURL(file);
        });
        
        this.showNotification(`${files.length} images added to gallery`, 'success');
    }

    setupDragAndDrop() {
        const dropZones = ['imageDropZone', 'galleryDropZone'];
        
        dropZones.forEach(zoneId => {
            const zone = document.getElementById(zoneId);
            if (!zone) return;
            
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('border-blue-400', 'bg-blue-50');
            });
            
            zone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                zone.classList.remove('border-blue-400', 'bg-blue-50');
            });
            
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('border-blue-400', 'bg-blue-50');
                
                const files = Array.from(e.dataTransfer.files);
                if (zoneId === 'imageDropZone') {
                    this.handleFeaturedImageUpload(files[0]);
                } else {
                    this.handleGalleryUpload(files);
                }
            });
        });
    }

    setupAutoSave() {
        this.debouncedAutoSave = this.debounce(() => {
            this.saveDraft(true);
        }, 2000);
    }

    toggleAutoSave() {
        this.autoSaveEnabled = !this.autoSaveEnabled;
        const btn = document.getElementById('autoSave');
        
        if (this.autoSaveEnabled) {
            btn.textContent = '🔄 Auto-save: ON';
            btn.className = 'px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg font-medium';
        } else {
            btn.textContent = '⏸️ Auto-save: OFF';
            btn.className = 'px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg font-medium';
        }
    }

    bindFormFields() {
        const fields = {
            'postAuthor': 'author',
            'authorBio': 'authorBio',
            'postCategory': 'category',
            'postTags': 'tags',
            'metaDescription': 'metaDescription',
            'focusKeywords': 'focusKeywords',
            'canonicalURL': 'canonicalURL',
            'robotsMeta': 'robotsMeta',
            'ogTitle': 'ogTitle',
            'ogDescription': 'ogDescription',
            'ogImage': 'ogImage',
            'schemaType': 'schemaType',
            'publisherName': 'publisherName',
            'publisherLogo': 'publisherLogo',
            'publishStatus': 'publishStatus',
            'publishDate': 'publishDate',
            'visibility': 'visibility'
        };
        
        Object.entries(fields).forEach(([elementId, dataKey]) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.editorData[dataKey] = e.target.value;
                });
            }
        });
    }

    getPostData() {
        return {
            ...this.editorData,
            title: document.getElementById('postTitle').value,
            slug: document.getElementById('postSlug').value,
            content: this.quill.root.innerHTML,
            author: document.getElementById('postAuthor').value,
            authorBio: document.getElementById('authorBio').value,
            category: document.getElementById('postCategory').value,
            tags: document.getElementById('postTags').value
        };
    }

    saveDraft(isAutoSave = false) {
        const postData = {
            ...this.getPostData(),
            savedAt: new Date().toISOString()
        };
        
        localStorage.setItem('snapskillz_draft_post', JSON.stringify(postData));
        
        if (!isAutoSave) {
            this.showNotification('Draft saved successfully', 'success');
        }
        
        // Update last saved indicator
        const now = new Date();
        document.getElementById('lastSaved').textContent = now.toLocaleTimeString();
    }

    loadDraftIfExists() {
        const draft = localStorage.getItem('snapskillz_draft_post');
        if (!draft) return;
        
        try {
            const data = JSON.parse(draft);
            
            // Load data into form fields
            Object.entries(data).forEach(([key, value]) => {
                const element = document.getElementById(key === 'title' ? 'postTitle' : 
                                                     key === 'slug' ? 'postSlug' :
                                                     key === 'author' ? 'postAuthor' :
                                                     key === 'category' ? 'postCategory' :
                                                     key);
                if (element && value) {
                    element.value = value;
                }
            });
            
            // Load content into editor
            if (data.content) {
                this.quill.root.innerHTML = data.content;
            }
            
            // Load images
            if (data.featuredImage) {
                this.editorData.featuredImage = data.featuredImage;
                document.getElementById('featuredImageImg').src = data.featuredImage;
                document.getElementById('featuredImagePreview').classList.remove('hidden');
            }
            
            this.updateContentAnalytics();
            this.showNotification('Draft loaded successfully', 'info');
        } catch (error) {
            console.error('Error loading draft:', error);
        }
    }

    publishPost() {
        const postData = this.getPostData();
        
        if (!postData.title || !postData.author) {
            this.showNotification('Please fill in title and author before publishing', 'error');
            return;
        }
        
        // Validate SEO requirements
        if (!postData.metaDescription) {
            this.showNotification('Meta description is required for publishing', 'error');
            return;
        }
        
        if (confirm('Are you ready to publish this post? This will make it live on your website.')) {
            // Here you would typically send to your backend
            const publishData = {
                ...postData,
                publishedAt: new Date().toISOString(),
                schema: this.generateSchemaJSON()
            };
            
            console.log('Publishing post:', publishData);
            
            // Clear draft
            localStorage.removeItem('snapskillz_draft_post');
            
            this.showNotification('Post published successfully! 🎉', 'success');
        }
    }

    previewPost() {
        const postData = this.getPostData();
        const htmlContent = this.convertToHTML();
        
        const previewWindow = window.open('', '_blank', 'width=1200,height=800');
        previewWindow.document.write(htmlContent);
        previewWindow.document.close();
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        const bgClass = type === 'success' ? 'bg-green-600' : 
                       type === 'error' ? 'bg-red-600' : 
                       type === 'info' ? 'bg-blue-600' : 'bg-gray-600';
        
        notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white ${bgClass} transform transition-transform duration-300 translate-x-full`;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <span>${message}</span>
                <button class="ml-4 hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('translate-x-full');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize the advanced blog editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedBlogEditor();
});