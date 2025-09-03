// Professional Blog Editor v2.0 - External JavaScript
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
        console.log('Initializing AdvancedBlogEditor...');
        if (!this.checkAuthentication()) {
            return;
        }
        this.checkLibraries();
        this.initializeEditor();
        this.bindEvents();
        this.initializeTabs();
        this.setupAutoSave();
        this.checkForEditMode();
        console.log('AdvancedBlogEditor initialized successfully!');
    }

    checkForEditMode() {
        const urlParams = new URLSearchParams(window.location.search);
        const editSlug = urlParams.get('edit');
        
        if (editSlug) {
            console.log('Edit mode detected, loading post:', editSlug);
            this.loadPostForEditing(editSlug);
        } else {
            this.loadDraftIfExists();
        }
    }

    async loadPostForEditing(slug) {
        try {
            this.showNotification('Loading post for editing...', 'info');
            
            const response = await fetch(`/api/posts/load?slug=${slug}`);
            const result = await response.json();
            
            if (result.success) {
                const post = result.post;
                
                // Load data into form fields
                document.getElementById('postTitle').value = post.title || '';
                document.getElementById('postSlug').value = post.slug || '';
                document.getElementById('postAuthor').value = post.author || '';
                document.getElementById('authorBio').value = post.authorBio || '';
                document.getElementById('postCategory').value = post.category || '';
                document.getElementById('postTags').value = post.tags || '';
                document.getElementById('metaDescription').value = post.metaDescription || '';
                document.getElementById('focusKeywords').value = post.focusKeywords || '';
                document.getElementById('canonicalURL').value = post.canonicalURL || '';
                document.getElementById('robotsMeta').value = post.robotsMeta || 'index,follow';
                document.getElementById('ogTitle').value = post.ogTitle || '';
                document.getElementById('ogDescription').value = post.ogDescription || '';
                document.getElementById('ogImage').value = post.ogImage || '';
                document.getElementById('schemaType').value = post.schemaType || 'Article';
                document.getElementById('publisherName').value = post.publisherName || '';
                document.getElementById('publisherLogo').value = post.publisherLogo || '';
                document.getElementById('publishStatus').value = post.publishStatus || 'draft';
                
                // Load content into editor
                if (post.content) {
                    this.quill.root.innerHTML = post.content;
                }
                
                // Set featured image if exists
                if (post.featuredImage) {
                    this.setFeaturedImage(post.featuredImage);
                }
                
                // Update analytics
                this.updateContentAnalytics();
                this.updateTitleAnalytics();
                this.updateSEOAnalysis();
                this.generateSchema();
                
                this.showNotification('Post loaded for editing', 'success');
            } else {
                this.showNotification('Failed to load post: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error loading post for editing:', error);
            this.showNotification('Error loading post: ' + error.message, 'error');
        }
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

        console.log('Library availability check:');
        libraries.forEach(lib => {
            const available = lib.check();
            console.log(`${lib.name}: ${available ? '✅ Available' : '❌ Missing'}`);
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
            authContainer?.classList.remove('hidden');
            return false;
        }

        try {
            const sessionData = JSON.parse(session);
            if (!sessionData.authenticated || Date.now() >= sessionData.expires) {
                authContainer?.classList.remove('hidden');
                return false;
            }
            editorContainer?.classList.remove('hidden');
            return true;
        } catch (error) {
            authContainer?.classList.remove('hidden');
            return false;
        }
    }

    initializeEditor() {
        console.log('Initializing Quill editor...');
        
        // Register ImageResize module if available
        if (typeof ImageResize !== 'undefined') {
            Quill.register('modules/imageResize', ImageResize.default || ImageResize);
        }
        
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
                    ['clean']
                ],
                imageResize: typeof ImageResize !== 'undefined' ? {
                    displayStyles: {
                        backgroundColor: 'black',
                        border: 'none',
                        color: 'white'
                    },
                    modules: ['Resize', 'DisplaySize']
                } : false
            }
        });

        this.quill.on('text-change', () => {
            console.log('Content changed, updating analytics...');
            this.updateContentAnalytics();
            this.updateSEOAnalysis();
            this.generateSchema();
            
            if (this.autoSaveEnabled) {
                this.debouncedAutoSave();
            }
        });
        console.log('Quill editor initialized successfully!');
    }

    bindEvents() {
        console.log('Binding events...');
        
        // Tab navigation
        const tabBtns = document.querySelectorAll('.tab-btn');
        console.log('Found tab buttons:', tabBtns.length);
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('Tab clicked:', e.target.dataset.tab);
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Form field events
        const postTitle = document.getElementById('postTitle');
        if (postTitle) {
            postTitle.addEventListener('input', (e) => {
                console.log('Title changed:', e.target.value);
                this.editorData.title = e.target.value;
                this.updateTitleAnalytics();
                this.generateSlug();
            });
        }

        const postSlug = document.getElementById('postSlug');
        if (postSlug) {
            postSlug.addEventListener('input', (e) => {
                this.editorData.slug = e.target.value;
            });
        }

        // Action buttons (header)
        const saveBtn = document.getElementById('saveBtn');
        const publishBtn = document.getElementById('publishBtn');
        const previewBtn = document.getElementById('previewBtn');

        // Action buttons (sidebar)
        const sidebarSaveBtn = document.getElementById('sidebarSaveBtn');
        const sidebarPublishBtn = document.getElementById('sidebarPublishBtn');
        const sidebarPreviewBtn = document.getElementById('sidebarPreviewBtn');

        // Bind header buttons
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                console.log('Save button clicked');
                this.saveDraft();
            });
        }

        if (publishBtn) {
            publishBtn.addEventListener('click', () => {
                console.log('Publish button clicked');
                this.publishPost();
            });
        }

        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                console.log('Preview button clicked');
                this.previewPost();
            });
        }

        // Bind sidebar buttons
        if (sidebarSaveBtn) {
            sidebarSaveBtn.addEventListener('click', () => {
                console.log('Sidebar save button clicked');
                this.saveDraft();
            });
        }

        if (sidebarPublishBtn) {
            sidebarPublishBtn.addEventListener('click', () => {
                console.log('Sidebar publish button clicked');
                this.publishPost();
            });
        }

        if (sidebarPreviewBtn) {
            sidebarPreviewBtn.addEventListener('click', () => {
                console.log('Sidebar preview button clicked');
                this.previewPost();
            });
        }

        // Import/Export events
        const importFile = document.getElementById('importFile');
        if (importFile) {
            importFile.addEventListener('change', (e) => {
                console.log('File import:', e.target.files[0]);
                this.handleFileImport(e.target.files[0]);
            });
        }

        const exportMarkdown = document.getElementById('exportMarkdown');
        if (exportMarkdown) {
            exportMarkdown.addEventListener('click', () => {
                console.log('Export markdown clicked');
                this.exportContent('markdown');
            });
        }

        const exportHTML = document.getElementById('exportHTML');
        if (exportHTML) {
            exportHTML.addEventListener('click', () => {
                console.log('Export HTML clicked');
                this.exportContent('html');
            });
        }

        // Meta fields
        const metaDescription = document.getElementById('metaDescription');
        if (metaDescription) {
            metaDescription.addEventListener('input', (e) => {
                this.editorData.metaDescription = e.target.value;
                this.updateMetaDescriptionStats();
            });
        }

        // Image upload events
        this.bindImageUploads();
        
        // HTML embed functionality
        this.bindHTMLEmbedEvents();
        
        // Form field synchronization
        this.bindFormFields();
        console.log('Events bound successfully!');
    }

    bindImageUploads() {
        // Featured image upload
        const featuredImageInput = document.getElementById('featuredImageInput');
        const imageDropZone = document.getElementById('imageDropZone');
        
        if (featuredImageInput) {
            featuredImageInput.addEventListener('change', (e) => {
                this.handleImageUpload(e.target.files[0], 'featured');
            });
        }

        if (imageDropZone) {
            // Drag and drop for featured image
            imageDropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                imageDropZone.classList.add('border-blue-400', 'bg-blue-50');
            });

            imageDropZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                imageDropZone.classList.remove('border-blue-400', 'bg-blue-50');
            });

            imageDropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                imageDropZone.classList.remove('border-blue-400', 'bg-blue-50');
                
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                    this.handleImageUpload(files[0], 'featured');
                }
            });
        }

        // Gallery upload
        const galleryInput = document.getElementById('galleryInput');
        if (galleryInput) {
            galleryInput.addEventListener('change', (e) => {
                Array.from(e.target.files).forEach(file => {
                    this.handleImageUpload(file, 'gallery');
                });
            });
        }

        // Add image upload to Quill toolbar
        if (this.quill) {
            const toolbar = this.quill.getModule('toolbar');
            toolbar.addHandler('image', () => {
                this.selectLocalImage();
            });
        }
    }

    async handleImageUpload(file, type = 'featured') {
        if (!file || !file.type.startsWith('image/')) {
            this.showNotification('Please select a valid image file', 'error');
            return;
        }

        // Show upload progress
        this.showNotification('Uploading image...', 'info');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Image uploaded successfully!', 'success');
                
                if (type === 'featured') {
                    this.setFeaturedImage(result.url);
                } else if (type === 'gallery') {
                    this.addToGallery(result.url);
                }

                return result.url;
            } else {
                this.showNotification('Upload failed: ' + result.error, 'error');
                return null;
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification('Upload failed: ' + error.message, 'error');
            return null;
        }
    }

    setFeaturedImage(imageUrl) {
        this.editorData.featuredImage = imageUrl;
        
        const preview = document.getElementById('featuredImagePreview');
        const img = document.getElementById('featuredImageImg');
        
        if (preview && img) {
            img.src = imageUrl;
            preview.classList.remove('hidden');
        }

        // Update OG image if not set
        const ogImageInput = document.getElementById('ogImage');
        if (ogImageInput && !ogImageInput.value) {
            ogImageInput.value = imageUrl;
            this.editorData.ogImage = imageUrl;
        }
    }

    addToGallery(imageUrl) {
        this.editorData.galleryImages.push(imageUrl);
        
        const galleryPreview = document.getElementById('galleryPreview');
        if (galleryPreview) {
            galleryPreview.classList.remove('hidden');
            
            const imageDiv = document.createElement('div');
            imageDiv.className = 'relative group';
            imageDiv.innerHTML = `
                <img src="${imageUrl}" class="w-full h-24 object-cover rounded-lg" alt="">
                <button onclick="this.parentElement.remove()" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
            `;
            galleryPreview.appendChild(imageDiv);
        }
    }

    selectLocalImage() {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                const imageUrl = await this.handleImageUpload(file, 'content');
                if (imageUrl) {
                    // Insert image into Quill editor
                    const range = this.quill.getSelection(true);
                    this.quill.insertEmbed(range.index, 'image', imageUrl);
                    this.quill.setSelection(range.index + 1);
                }
            }
        };
    }

    initializeTabs() {
        console.log('Initializing tabs...');
        const tabContents = document.querySelectorAll('.tab-content');
        console.log('Found tab contents:', tabContents.length);
        tabContents.forEach(content => {
            if (!content.id.includes('content-tab')) {
                content.classList.add('hidden');
            }
        });
    }

    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
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

    updateContentAnalytics() {
        try {
            console.log('Updating content analytics...');
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
            
            console.log('Analytics:', {wordCount, charCount, readTime, sentenceCount, paragraphs});
            
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
        } else {
            console.warn(`Element not found: ${id}`);
        }
    }

    updateReadabilityAnalysis(text, words, sentences) {
        try {
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
            this.updateElement('fleschScore', Math.round(fleschScore));
            this.updateElement('readabilityGrade', readabilityGrade);
            this.updateElement('gradeLevel', gradeLevel + 'th Grade');
            this.updateElement('avgSentenceLength', Math.round(avgSentenceLength) + ' words');
            
            // Overall readability score for header
            this.updateElement('readabilityScore', readabilityGrade);
        } catch (error) {
            console.error('Error updating readability analysis:', error);
        }
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
        const titleElement = document.getElementById('postTitle');
        if (!titleElement) return;
        
        const title = titleElement.value;
        const length = title.length;
        
        this.updateElement('titleLength', length);
        
        let seoScore = 'Poor';
        if (length >= 50 && length <= 60) seoScore = 'Excellent';
        else if (length >= 40 && length <= 70) seoScore = 'Good';
        else if (length >= 30 && length <= 80) seoScore = 'Fair';
        
        this.updateElement('titleSEOScore', seoScore);
        
        const scoreElement = document.getElementById('titleSEOScore');
        if (scoreElement) {
            scoreElement.className = 'font-medium ' + 
                (seoScore === 'Excellent' ? 'text-green-600' : 
                 seoScore === 'Good' ? 'text-blue-600' : 
                 seoScore === 'Fair' ? 'text-yellow-600' : 'text-red-600');
        }
    }

    generateSlug() {
        const titleElement = document.getElementById('postTitle');
        const slugElement = document.getElementById('postSlug');
        
        if (!titleElement || !slugElement) return;
        
        const title = titleElement.value;
        if (title && !slugElement.value) {
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
            slugElement.value = slug;
            this.editorData.slug = slug;
        }
    }

    updateMetaDescriptionStats() {
        const metaDescElement = document.getElementById('metaDescription');
        if (!metaDescElement) return;
        
        const metaDesc = metaDescElement.value;
        const length = metaDesc.length;
        
        this.updateElement('metaDescLength', length);
        
        const lengthIndicator = document.getElementById('metaDescLength')?.parentElement;
        if (lengthIndicator) {
            lengthIndicator.className = 'mt-2 flex items-center justify-between text-sm ' + 
                (length >= 150 && length <= 160 ? 'text-green-600' : 
                 length >= 120 && length <= 180 ? 'text-yellow-600' : 'text-red-500');
        }
    }

    updateSEOAnalysis() {
        try {
            const title = document.getElementById('postTitle')?.value || '';
            const content = this.quill.getText();
            const htmlContent = this.quill.root.innerHTML;
            const metaDesc = document.getElementById('metaDescription')?.value || '';
            const keywords = document.getElementById('focusKeywords')?.value || '';
            const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
            
            // More comprehensive SEO checks with proper scoring
            const seoChecks = [
                { 
                    name: 'Title length (50-60 chars optimal)', 
                    passed: title.length >= 50 && title.length <= 60,
                    weight: 10,
                    score: this.getTitleScore(title.length)
                },
                { 
                    name: 'Meta description (150-160 chars optimal)', 
                    passed: metaDesc.length >= 150 && metaDesc.length <= 160,
                    weight: 10,
                    score: this.getMetaDescScore(metaDesc.length)
                },
                { 
                    name: 'Focus keywords in title', 
                    passed: keywords && this.checkKeywordsInText(title.toLowerCase(), keywords),
                    weight: 15,
                    score: keywords ? (this.checkKeywordsInText(title.toLowerCase(), keywords) ? 100 : 0) : 0
                },
                { 
                    name: 'Focus keywords in content', 
                    passed: keywords && this.checkKeywordsInText(content.toLowerCase(), keywords),
                    weight: 15,
                    score: keywords ? (this.getKeywordDensityScore(content.toLowerCase(), keywords)) : 0
                },
                { 
                    name: 'Content length (300+ words)', 
                    passed: wordCount >= 300,
                    weight: 10,
                    score: this.getContentLengthScore(wordCount)
                },
                { 
                    name: 'Has proper heading structure', 
                    passed: htmlContent.includes('<h1>') || htmlContent.includes('<h2>') || htmlContent.includes('<h3>'),
                    weight: 10,
                    score: this.getHeadingScore(htmlContent)
                },
                { 
                    name: 'Featured image set', 
                    passed: this.editorData.featuredImage !== null,
                    weight: 8,
                    score: this.editorData.featuredImage ? 100 : 0
                },
                { 
                    name: 'Internal/External links present', 
                    passed: htmlContent.includes('<a ') || htmlContent.includes('href='),
                    weight: 5,
                    score: (htmlContent.includes('<a ') || htmlContent.includes('href=')) ? 100 : 0
                },
                { 
                    name: 'Title is unique and descriptive', 
                    passed: title.length > 20,
                    weight: 7,
                    score: this.getTitleQualityScore(title)
                },
                { 
                    name: 'Meta description is descriptive', 
                    passed: metaDesc.length > 50,
                    weight: 10,
                    score: this.getMetaQualityScore(metaDesc)
                }
            ];
            
            // Calculate weighted SEO score
            const totalWeight = seoChecks.reduce((sum, check) => sum + check.weight, 0);
            const weightedScore = seoChecks.reduce((sum, check) => sum + (check.score * check.weight), 0);
            const seoScore = Math.round(weightedScore / totalWeight);
            
            // Update SEO score displays
            this.updateElement('overallSEOScore', seoScore + '%');
            this.updateElement('sidebarSEOScore', seoScore + '%');
            
            // Update SEO score color
            const scoreColor = seoScore >= 90 ? 'text-green-600' : 
                              seoScore >= 70 ? 'text-blue-600' : 
                              seoScore >= 50 ? 'text-yellow-600' : 'text-red-600';
            
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

    getTitleScore(length) {
        if (length >= 50 && length <= 60) return 100;
        if (length >= 40 && length <= 70) return 80;
        if (length >= 30 && length <= 80) return 60;
        if (length >= 20) return 40;
        return 20;
    }

    getMetaDescScore(length) {
        if (length >= 150 && length <= 160) return 100;
        if (length >= 120 && length <= 180) return 80;
        if (length >= 100 && length <= 200) return 60;
        if (length >= 50) return 40;
        return 20;
    }

    getKeywordDensityScore(content, keywords) {
        if (!keywords || !content) return 0;
        
        const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
        const words = content.split(/\s+/);
        let keywordCount = 0;
        
        keywordList.forEach(keyword => {
            const regex = new RegExp(keyword, 'gi');
            const matches = content.match(regex);
            keywordCount += matches ? matches.length : 0;
        });
        
        const density = (keywordCount / words.length) * 100;
        
        // Optimal keyword density is 1-3%
        if (density >= 1 && density <= 3) return 100;
        if (density >= 0.5 && density <= 4) return 80;
        if (density > 0 && density <= 5) return 60;
        return keywordCount > 0 ? 40 : 0;
    }

    getContentLengthScore(wordCount) {
        if (wordCount >= 800) return 100;
        if (wordCount >= 500) return 90;
        if (wordCount >= 300) return 80;
        if (wordCount >= 200) return 60;
        if (wordCount >= 100) return 40;
        return 20;
    }

    getHeadingScore(htmlContent) {
        let score = 0;
        if (htmlContent.includes('<h1>')) score += 40;
        if (htmlContent.includes('<h2>')) score += 40;
        if (htmlContent.includes('<h3>')) score += 20;
        return Math.min(score, 100);
    }

    getTitleQualityScore(title) {
        if (!title) return 0;
        let score = 0;
        if (title.length >= 20) score += 30;
        if (title.length >= 40) score += 20;
        if (title.includes('?') || title.includes('!')) score += 10;
        if (/\d/.test(title)) score += 15; // Contains numbers
        if (title.split(' ').length >= 4) score += 25; // Multiple words
        return Math.min(score, 100);
    }

    getMetaQualityScore(metaDesc) {
        if (!metaDesc) return 0;
        let score = 0;
        if (metaDesc.length >= 100) score += 40;
        if (metaDesc.includes('learn') || metaDesc.includes('discover') || metaDesc.includes('guide')) score += 20;
        if (metaDesc.includes('?') || metaDesc.includes('!')) score += 10;
        if (metaDesc.split(' ').length >= 15) score += 30; // Descriptive length
        return Math.min(score, 100);
    }

    checkKeywordsInText(text, keywords) {
        if (!keywords) return false;
        const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
        return keywordList.some(keyword => text.toLowerCase().includes(keyword));
    }

    updateSEOChecklist(checks) {
        const container = document.getElementById('seoChecklist');
        if (!container) return;
        
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
        
        const previewElement = document.getElementById('schemaPreview');
        if (previewElement) {
            previewElement.value = JSON.stringify(schema, null, 2);
        }
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
                    if (elementId === 'focusKeywords') {
                        this.updateSEOAnalysis();
                    }
                    if (elementId === 'schemaType' || elementId === 'publisherName' || elementId === 'publisherLogo') {
                        this.generateSchema();
                    }
                });
            }
        });
    }

    setupAutoSave() {
        this.debouncedAutoSave = this.debounce(() => {
            this.saveDraft(true);
        }, 2000);
    }

    getPostData() {
        return {
            ...this.editorData,
            title: document.getElementById('postTitle')?.value || '',
            slug: document.getElementById('postSlug')?.value || '',
            content: this.quill.root.innerHTML,
            author: document.getElementById('postAuthor')?.value || '',
            authorBio: document.getElementById('authorBio')?.value || '',
            category: document.getElementById('postCategory')?.value || '',
            tags: document.getElementById('postTags')?.value || ''
        };
    }

    async saveDraft(isAutoSave = false) {
        console.log('Saving draft...');
        const postData = {
            ...this.getPostData(),
            status: 'draft',
            savedAt: new Date().toISOString()
        };
        
        try {
            // Save to localStorage as backup
            localStorage.setItem('snapskillz_draft_post', JSON.stringify(postData));
            
            // Save to backend
            const response = await fetch('/api/posts/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                if (!isAutoSave) {
                    this.showNotification(result.message, 'success');
                }
                // Update last saved indicator
                const now = new Date();
                this.updateElement('lastSaved', now.toLocaleTimeString());
                
                // Clear localStorage backup since it's saved to backend
                localStorage.removeItem('snapskillz_draft_post');
            } else {
                if (!isAutoSave) {
                    this.showNotification('Failed to save: ' + result.error, 'error');
                }
            }
        } catch (error) {
            console.error('Error saving draft:', error);
            if (!isAutoSave) {
                this.showNotification('Error saving draft: ' + error.message, 'error');
            }
        }
    }

    async publishPost() {
        console.log('Publishing post...');
        const postData = this.getPostData();
        
        if (!postData.title || !postData.author) {
            this.showNotification('Please fill in title and author before publishing', 'error');
            return;
        }
        
        if (confirm('Are you ready to publish this post? This will make it live on your website.')) {
            const publishData = {
                ...postData,
                status: 'published',
                publishedAt: new Date().toISOString(),
                schema: this.generateSchemaJSON()
            };
            
            try {
                const response = await fetch('/api/posts/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(publishData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Clear draft
                    localStorage.removeItem('snapskillz_draft_post');
                    this.showNotification('Post published successfully! 🎉', 'success');
                    
                    // Optionally redirect to manage posts
                    setTimeout(() => {
                        if (confirm('Would you like to view all posts?')) {
                            window.location.href = '/admin/posts';
                        }
                    }, 2000);
                } else {
                    this.showNotification('Failed to publish: ' + result.error, 'error');
                }
            } catch (error) {
                console.error('Error publishing post:', error);
                this.showNotification('Error publishing post: ' + error.message, 'error');
            }
        }
    }

    previewPost() {
        console.log('Opening preview...');
        const postData = this.getPostData();
        const htmlContent = this.convertToHTML();
        
        const previewWindow = window.open('', '_blank', 'width=1200,height=800');
        previewWindow.document.write(htmlContent);
        previewWindow.document.close();
    }

    convertToHTML() {
        const data = this.getPostData();
        const schema = this.generateSchemaJSON();
        
        const canonicalLink = data.canonicalURL ? `<link rel="canonical" href="${data.canonicalURL}">` : '';
        const ogImage = data.ogImage ? `<meta property="og:image" content="${data.ogImage}">` : '';
        const twitterImage = data.ogImage ? `<meta name="twitter:image" content="${data.ogImage}">` : '';
        const tags = data.tags ? `<p><strong>Tags:</strong> ${data.tags}</p>` : '';
        const authorBio = data.authorBio ? `
        <aside class="author-bio">
            <h3>About the Author</h3>
            <p>${data.authorBio}</p>
        </aside>` : '';
        
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
    ${canonicalLink}
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="${data.ogTitle || data.title}">
    <meta property="og:description" content="${data.ogDescription || data.metaDescription}">
    ${ogImage}
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${data.ogTitle || data.title}">
    <meta name="twitter:description" content="${data.ogDescription || data.metaDescription}">
    ${twitterImage}
    
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
            ${tags}
        </header>
        <main>
            ${data.content}
        </main>
        ${authorBio}
    </article>
</body>
</html>`;
    }

    exportContent(format) {
        console.log('Exporting content as:', format);
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

    handleFileImport(file) {
        if (!file) {
            this.showNotification('No file selected', 'error');
            return;
        }

        console.log('Importing file:', file.name);
        const fileType = file.name.split('.').pop().toLowerCase();
        
        // Handle DOCX files differently
        if (fileType === 'docx') {
            this.importDocx(file);
            return;
        }
        
        const reader = new FileReader();

        reader.onerror = () => {
            this.showNotification('Error reading file', 'error');
        };

        reader.onload = (e) => {
            try {
                const content = e.target.result;

                switch (fileType) {
                    case 'md':
                        this.importMarkdown(content);
                        break;
                    case 'txt':
                        this.importPlainText(content);
                        break;
                    case 'html':
                        this.importHTML(content);
                        break;
                    default:
                        this.showNotification(`Unsupported file format: .${fileType}`, 'error');
                }
            } catch (error) {
                console.error('Error processing file:', error);
                this.showNotification('Error processing file', 'error');
            }
        };

        reader.readAsText(file);
    }

    importMarkdown(content) {
        try {
            console.log('Importing markdown content...');
            
            const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
            
            if (frontMatterMatch) {
                const frontMatter = frontMatterMatch[1];
                const bodyContent = frontMatterMatch[2];
                
                // Parse front matter
                const lines = frontMatter.split('\n');
                lines.forEach(line => {
                    if (!line.includes(':')) return;
                    
                    const [key, ...valueParts] = line.split(':');
                    const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
                    
                    if (!key || !value) return;
                    
                    switch (key.trim()) {
                        case 'title':
                            const titleElement = document.getElementById('postTitle');
                            if (titleElement) titleElement.value = value;
                            break;
                        case 'author':
                            const authorElement = document.getElementById('postAuthor');
                            if (authorElement) authorElement.value = value;
                            break;
                        case 'category':
                            const categoryElement = document.getElementById('postCategory');
                            if (categoryElement) categoryElement.value = value;
                            break;
                        case 'tags':
                            const tagsElement = document.getElementById('postTags');
                            if (tagsElement) tagsElement.value = value;
                            break;
                        case 'description':
                        case 'meta_description':
                            const descElement = document.getElementById('metaDescription');
                            if (descElement) descElement.value = value;
                            break;
                    }
                });
                
                // Use marked.js for better markdown conversion if available
                let htmlContent;
                if (typeof marked !== 'undefined') {
                    try {
                        htmlContent = marked.parse(bodyContent);
                    } catch (error) {
                        console.warn('Marked.js conversion failed, using fallback:', error);
                        htmlContent = this.convertMarkdownToHTML(bodyContent);
                    }
                } else {
                    htmlContent = this.convertMarkdownToHTML(bodyContent);
                }
                
                this.quill.root.innerHTML = htmlContent;
            } else {
                // Use marked.js for better markdown conversion if available
                let htmlContent;
                if (typeof marked !== 'undefined') {
                    try {
                        htmlContent = marked.parse(content);
                    } catch (error) {
                        console.warn('Marked.js conversion failed, using fallback:', error);
                        htmlContent = this.convertMarkdownToHTML(content);
                    }
                } else {
                    htmlContent = this.convertMarkdownToHTML(content);
                }
                
                this.quill.root.innerHTML = htmlContent;
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
        this.updateTitleAnalytics();
        this.updateSEOAnalysis();
        this.showNotification('Text file imported successfully', 'success');
    }

    loadDraftIfExists() {
        const draft = localStorage.getItem('snapskillz_draft_post');
        if (!draft) return;
        
        try {
            const data = JSON.parse(draft);
            
            // Load data into form fields
            if (data.title) {
                const titleElement = document.getElementById('postTitle');
                if (titleElement) titleElement.value = data.title;
            }
            
            if (data.slug) {
                const slugElement = document.getElementById('postSlug');
                if (slugElement) slugElement.value = data.slug;
            }
            
            if (data.author) {
                const authorElement = document.getElementById('postAuthor');
                if (authorElement) authorElement.value = data.author;
            }
            
            if (data.category) {
                const categoryElement = document.getElementById('postCategory');
                if (categoryElement) categoryElement.value = data.category;
            }
            
            if (data.tags) {
                const tagsElement = document.getElementById('postTags');
                if (tagsElement) tagsElement.value = data.tags;
            }
            
            // Load content into editor
            if (data.content) {
                this.quill.root.innerHTML = data.content;
            }
            
            this.updateContentAnalytics();
            this.showNotification('Draft loaded successfully', 'info');
        } catch (error) {
            console.error('Error loading draft:', error);
        }
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

    convertMarkdownToHTML(markdown) {
        return markdown
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
            .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
            .replace(/^###### (.*$)/gm, '<h6>$1</h6>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>')
            .replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1">')
            .replace(/^\\* (.+)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/^\d+\. (.+)/gm, '<li>$1</li>')
            .replace(/^> (.+)/gm, '<blockquote>$1</blockquote>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(?!<[^>]+>)(.+)$/gm, '<p>$1</p>')
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<[^>]+>.*<\/[^>]+>)<\/p>/g, '$1');
    }

    importHTML(content) {
        try {
            console.log('Importing HTML content...');
            
            // Extract title from HTML if available
            const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (titleMatch) {
                const titleElement = document.getElementById('postTitle');
                if (titleElement && !titleElement.value) {
                    titleElement.value = titleMatch[1].trim();
                }
            }
            
            // Extract meta description
            const metaDescMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["'][^>]*>/i);
            if (metaDescMatch) {
                const descElement = document.getElementById('metaDescription');
                if (descElement && !descElement.value) {
                    descElement.value = metaDescMatch[1].trim();
                }
            }
            
            // Extract body content or use full content if no body tag
            let bodyContent = content;
            const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            if (bodyMatch) {
                bodyContent = bodyMatch[1];
            }
            
            // Clean up and sanitize HTML
            bodyContent = bodyContent
                .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove scripts
                .replace(/<style[\s\S]*?<\/style>/gi, '') // Remove inline styles
                .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
                .replace(/<meta[^>]*>/gi, '') // Remove meta tags
                .replace(/<head[\s\S]*?<\/head>/gi, '') // Remove head
                .replace(/<title[\s\S]*?<\/title>/gi, '') // Remove title
                .trim();
            
            // Set content in Quill editor
            this.quill.root.innerHTML = bodyContent;
            
            this.updateContentAnalytics();
            this.updateTitleAnalytics();
            this.updateSEOAnalysis();
            this.generateSchema();
            this.showNotification('HTML file imported successfully', 'success');
        } catch (error) {
            console.error('Error importing HTML:', error);
            this.showNotification('Error importing HTML file: ' + error.message, 'error');
        }
    }

    async importDocx(file) {
        try {
            console.log('Importing DOCX file...');
            this.showNotification('Processing DOCX file...', 'info');
            
            if (typeof mammoth === 'undefined') {
                this.showNotification('DOCX import library not loaded', 'error');
                return;
            }
            
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
            
            if (result.value) {
                // Set the HTML content in the editor
                this.quill.root.innerHTML = result.value;
                
                // Show any conversion messages/warnings
                if (result.messages && result.messages.length > 0) {
                    console.log('DOCX conversion messages:', result.messages);
                }
                
                this.updateContentAnalytics();
                this.updateTitleAnalytics();
                this.updateSEOAnalysis();
                this.generateSchema();
                this.showNotification('DOCX file imported successfully', 'success');
            } else {
                this.showNotification('Failed to extract content from DOCX file', 'error');
            }
        } catch (error) {
            console.error('Error importing DOCX:', error);
            this.showNotification('Error importing DOCX file: ' + error.message, 'error');
        }
    }

    bindHTMLEmbedEvents() {
        const embedBtn = document.getElementById('embedHTMLBtn');
        const modal = document.getElementById('htmlEmbedModal');
        const closeBtn = document.getElementById('closeEmbedModal');
        const cancelBtn = document.getElementById('cancelEmbed');
        const insertBtn = document.getElementById('insertEmbed');
        const previewBtn = document.getElementById('previewEmbedBtn');
        const validateBtn = document.getElementById('validateEmbedBtn');
        const codeTextarea = document.getElementById('htmlEmbedCode');

        // Open modal
        if (embedBtn) {
            embedBtn.addEventListener('click', () => {
                modal?.classList.remove('hidden');
                document.body.classList.add('overflow-hidden');
            });
        }

        // Close modal
        const closeModal = () => {
            modal?.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
            if (codeTextarea) codeTextarea.value = '';
            this.hideEmbedPreview();
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        // Template buttons
        const templateBtns = document.querySelectorAll('.embed-template');
        templateBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const template = btn.dataset.template;
                this.loadEmbedTemplate(template);
            });
        });

        // Preview functionality
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.previewEmbed();
            });
        }

        // Validation
        if (validateBtn) {
            validateBtn.addEventListener('click', () => {
                this.validateEmbed();
            });
        }

        // Insert embed
        if (insertBtn) {
            insertBtn.addEventListener('click', () => {
                this.insertHTMLEmbed();
            });
        }

        // Close on outside click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        }
    }

    loadEmbedTemplate(template) {
        const codeTextarea = document.getElementById('htmlEmbedCode');
        if (!codeTextarea) return;

        const templates = {
            iframe: `<iframe 
    src="https://example.com" 
    width="100%" 
    height="400" 
    frameborder="0" 
    allowfullscreen>
</iframe>`,
            codepen: `<p class="codepen" data-height="400" data-theme-id="dark" data-default-tab="html,result" data-slug-hash="SLUG_HASH" data-user="USERNAME">
    <span>See the Pen <a href="https://codepen.io/USERNAME/pen/SLUG_HASH">Pen Name</a> by USERNAME</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>`,
            quiz: `<div class="interactive-quiz" style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="color: #374151; margin-bottom: 15px;">Quick Quiz</h3>
    <div class="question" data-answer="2">
        <p><strong>What is 2 + 2?</strong></p>
        <label><input type="radio" name="q1" value="1"> 3</label><br>
        <label><input type="radio" name="q1" value="2"> 4</label><br>
        <label><input type="radio" name="q1" value="3"> 5</label><br>
        <button onclick="checkAnswer(this)" style="margin-top: 10px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Check Answer</button>
        <div class="result" style="margin-top: 10px; display: none;"></div>
    </div>
</div>
<script>
function checkAnswer(btn) {
    const question = btn.closest('.question');
    const selected = question.querySelector('input[name="q1"]:checked');
    const result = question.querySelector('.result');
    const correct = question.dataset.answer;
    
    if (!selected) {
        alert('Please select an answer');
        return;
    }
    
    result.style.display = 'block';
    if (selected.value === correct) {
        result.innerHTML = '✅ Correct!';
        result.style.color = '#10b981';
    } else {
        result.innerHTML = '❌ Incorrect. The answer is 4.';
        result.style.color = '#ef4444';
    }
}
</script>`,
            chart: `<div class="chart-container" style="width: 100%; height: 400px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <canvas id="myChart"></canvas>
</div>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
const ctx = document.getElementById('myChart').getContext('2d');
new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
            label: 'Sales',
            data: [12, 19, 3, 5, 2],
            backgroundColor: 'rgba(59, 130, 246, 0.8)'
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false
    }
});
</script>`,
            timeline: `<div class="timeline" style="max-width: 800px; margin: 20px 0;">
    <div class="timeline-item" style="display: flex; margin-bottom: 20px; padding: 15px; border-left: 3px solid #3b82f6; background: #f8fafc;">
        <div class="timeline-date" style="min-width: 100px; font-weight: bold; color: #3b82f6;">2024</div>
        <div class="timeline-content">
            <h4 style="margin: 0 0 8px 0; color: #374151;">Project Launch</h4>
            <p style="margin: 0; color: #6b7280;">Started development of the new platform</p>
        </div>
    </div>
    <div class="timeline-item" style="display: flex; margin-bottom: 20px; padding: 15px; border-left: 3px solid #10b981; background: #f0fdf4;">
        <div class="timeline-date" style="min-width: 100px; font-weight: bold; color: #10b981;">2024</div>
        <div class="timeline-content">
            <h4 style="margin: 0 0 8px 0; color: #374151;">Beta Release</h4>
            <p style="margin: 0; color: #6b7280;">First beta version released to select users</p>
        </div>
    </div>
</div>`,
            custom: `<!-- Your custom HTML goes here -->
<div style="padding: 20px; border: 2px dashed #d1d5db; border-radius: 8px; text-align: center; margin: 20px 0;">
    <h3>Custom Interactive Element</h3>
    <p>Add your own HTML, CSS, and JavaScript here</p>
    <button onclick="alert('Hello from your custom embed!')" style="padding: 10px 20px; background: #8b5cf6; color: white; border: none; border-radius: 4px; cursor: pointer;">Click Me</button>
</div>

<style>
/* Your custom CSS */
</style>

<script>
// Your custom JavaScript
console.log('Custom embed loaded');
</script>`
        };

        codeTextarea.value = templates[template] || '';
        this.validateEmbed();
    }

    previewEmbed() {
        const codeTextarea = document.getElementById('htmlEmbedCode');
        const previewContainer = document.getElementById('embedPreview');
        const previewContent = document.getElementById('embedPreviewContent');
        
        if (!codeTextarea || !previewContainer || !previewContent) return;
        
        const htmlCode = codeTextarea.value.trim();
        if (!htmlCode) {
            this.showNotification('Please enter HTML code to preview', 'error');
            return;
        }
        
        try {
            previewContent.innerHTML = htmlCode;
            previewContainer.classList.remove('hidden');
            
            // Execute any scripts in the preview
            const scripts = previewContent.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                if (script.src) {
                    newScript.src = script.src;
                } else {
                    newScript.textContent = script.textContent;
                }
                document.head.appendChild(newScript);
                setTimeout(() => document.head.removeChild(newScript), 100);
            });
        } catch (error) {
            console.error('Preview error:', error);
            this.showNotification('Error rendering preview: ' + error.message, 'error');
        }
    }

    hideEmbedPreview() {
        const previewContainer = document.getElementById('embedPreview');
        const previewContent = document.getElementById('embedPreviewContent');
        
        if (previewContainer) previewContainer.classList.add('hidden');
        if (previewContent) previewContent.innerHTML = '';
    }

    validateEmbed() {
        const codeTextarea = document.getElementById('htmlEmbedCode');
        const resultDiv = document.getElementById('embedValidationResult');
        
        if (!codeTextarea || !resultDiv) return;
        
        const htmlCode = codeTextarea.value.trim();
        if (!htmlCode) {
            resultDiv.classList.add('hidden');
            return;
        }
        
        const issues = [];
        const warnings = [];
        
        // Basic validation
        if (htmlCode.includes('<script') && !htmlCode.includes('</script>')) {
            issues.push('Unclosed script tag detected');
        }
        
        if (htmlCode.includes('<style') && !htmlCode.includes('</style>')) {
            issues.push('Unclosed style tag detected');
        }
        
        // Security checks
        if (htmlCode.includes('javascript:')) {
            issues.push('JavaScript URLs detected - potential security risk');
        }
        
        if (htmlCode.includes('onclick') || htmlCode.includes('onload') || htmlCode.includes('onerror')) {
            warnings.push('Inline event handlers detected - consider using external scripts');
        }
        
        if (htmlCode.includes('eval(')) {
            issues.push('eval() usage detected - security risk');
        }
        
        // Display results
        resultDiv.classList.remove('hidden');
        
        let resultHTML = '';
        if (issues.length === 0 && warnings.length === 0) {
            resultHTML = '<span class="text-green-600">✅ Code looks good!</span>';
        } else {
            if (issues.length > 0) {
                resultHTML += '<div class="text-red-600">❌ Issues: ' + issues.join(', ') + '</div>';
            }
            if (warnings.length > 0) {
                resultHTML += '<div class="text-yellow-600">⚠️ Warnings: ' + warnings.join(', ') + '</div>';
            }
        }
        
        resultDiv.innerHTML = resultHTML;
    }

    insertHTMLEmbed() {
        const codeTextarea = document.getElementById('htmlEmbedCode');
        if (!codeTextarea) return;
        
        const htmlCode = codeTextarea.value.trim();
        if (!htmlCode) {
            this.showNotification('Please enter HTML code to insert', 'error');
            return;
        }
        
        try {
            // Get current selection in Quill
            const range = this.quill.getSelection(true);
            
            // Wrap the HTML in a container for better handling
            const wrappedHTML = `<div class="embedded-content" style="margin: 20px 0; padding: 10px; border: 1px dashed #e5e7eb; border-radius: 8px;">${htmlCode}</div>`;
            
            // Insert the HTML at current cursor position
            this.quill.clipboard.dangerouslyPasteHTML(range.index, wrappedHTML);
            
            // Move cursor after the inserted content
            this.quill.setSelection(range.index + wrappedHTML.length);
            
            // Close modal
            const modal = document.getElementById('htmlEmbedModal');
            modal?.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
            
            // Clear the textarea
            codeTextarea.value = '';
            this.hideEmbedPreview();
            
            this.showNotification('HTML embed inserted successfully!', 'success');
            
            // Update analytics
            this.updateContentAnalytics();
        } catch (error) {
            console.error('Error inserting embed:', error);
            this.showNotification('Error inserting embed: ' + error.message, 'error');
        }
    }
}

// Initialize the advanced blog editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing AdvancedBlogEditor...');
    setTimeout(() => {
        new AdvancedBlogEditor();
    }, 100);
});