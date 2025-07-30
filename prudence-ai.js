// Prudence AI - The Collective Mind
// Interactive JavaScript functionality

class PrudenceAI {
    constructor() {
        this.selectedModels = new Set();
        this.chatHistory = [];
        this.currentChat = null;
        this.maxSelectedModels = 3;
        this.attachments = [];
        this.sidebarCollapsed = false;
        this.originalPrompt = '';
        this.isOptimizerOpen = false;
        
        this.initializeEventListeners();
        this.loadChatHistory();
    }

    initializeEventListeners() {
        // New Chat Button
        const newChatBtn = document.querySelector('.new-chat-btn');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => this.startNewChat());
        }

        // Send Message
        const sendBtn = document.querySelector('.send-btn');
        const messageInput = document.querySelector('.message-input');
        
        if (sendBtn && messageInput) {
            sendBtn.addEventListener('click', () => this.sendMessage());
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        // Attachment functionality
        const attachmentBtn = document.querySelector('.attachment-btn');
        if (attachmentBtn) {
            attachmentBtn.addEventListener('click', () => this.openFileSelector());
        }

        // Sidebar toggle functionality
        const sidebarToggle = document.querySelector('#sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Model Selection Dropdown
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const dropdownContent = document.querySelector('.dropdown-content');
        const modelOptions = document.querySelectorAll('.model-option');
        
        if (dropdownToggle && dropdownContent) {
            dropdownToggle.addEventListener('click', () => this.toggleDropdown());
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.model-dropdown')) {
                    this.closeDropdown();
                }
            });
        }
        
        modelOptions.forEach(option => {
            option.addEventListener('click', () => this.toggleModelSelection(option));
        });

        // Chat History Items
        const chatItems = document.querySelectorAll('.chat-item');
        chatItems.forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-btn')) {
                    this.loadChat(item.dataset.chatId);
                }
            });
        });

        // Delete Chat Buttons
        const deleteBtns = document.querySelectorAll('.delete-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteChat(btn.closest('.chat-item').dataset.chatId);
            });
        });

        // Expand Buttons
        const expandBtns = document.querySelectorAll('.expand-btn');
        expandBtns.forEach(btn => {
            btn.addEventListener('click', () => this.expandResponse(btn));
        });

        // Theme Toggle
        const themeBtn = document.querySelector('.theme-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Settings
        const settingsBtn = document.querySelector('.settings-btn');
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }

        // Logout
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Prompt Optimizer
        const optimizeBtn = document.querySelector('.optimize-btn');
        const closeOptimizer = document.querySelector('.close-optimizer');
        const quickOptBtns = document.querySelectorAll('.quick-opt-btn');
        const resetBtn = document.querySelector('.reset-btn');
        const applyBtn = document.querySelector('.apply-btn');
        const optimizedPromptText = document.querySelector('.optimized-prompt-text');

        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', () => this.openPromptOptimizer());
        }

        if (closeOptimizer) {
            closeOptimizer.addEventListener('click', () => this.closePromptOptimizer());
        }

        quickOptBtns.forEach(btn => {
            btn.addEventListener('click', () => this.applyQuickOptimization(btn.dataset.action));
        });

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetOptimization());
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyOptimization());
        }

        if (optimizedPromptText) {
            optimizedPromptText.addEventListener('input', () => this.handleManualOptimization());
        }
    }

    startNewChat() {
        this.currentChat = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            timestamp: new Date()
        };
        
        this.clearChatArea();
        this.updateChatHistory();
        this.saveChatHistory();
        
        // Add visual feedback
        const newChatBtn = document.querySelector('.new-chat-btn');
        newChatBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            newChatBtn.style.transform = 'scale(1)';
        }, 150);
    }

    sendMessage() {
        const messageInput = document.querySelector('.message-input');
        const message = messageInput.value.trim();
        
        if (!message && this.attachments.length === 0) return;
        
        if (!this.currentChat) {
            this.startNewChat();
        }

        // Add user message with attachments
        this.addMessageToChat('user', message);
        
        // Clear input and attachments
        messageInput.value = '';
        this.clearAttachments();
        
        // Collapse sidebar after first message if models are selected
        if (this.selectedModels.size > 0 && !this.sidebarCollapsed) {
            this.collapseSidebar();
        }
        
        // Simulate AI responses
        this.simulateAIResponses(message);
        
        // Update chat title if it's the first message
        if (this.currentChat.messages.length === 1) {
            this.currentChat.title = message.substring(0, 20) + (message.length > 20 ? '...' : '');
            this.updateChatHistory();
        }
        
        this.saveChatHistory();
    }

    addMessageToChat(sender, content) {
        const message = {
            id: Date.now().toString(),
            sender: sender,
            content: content,
            timestamp: new Date(),
            models: sender === 'ai' ? Array.from(this.selectedModels) : []
        };
        
        this.currentChat.messages.push(message);
        this.displayMessage(message);
    }

    displayMessage(message) {
        const messagesContainer = document.querySelector('.messages');
        
        if (message.sender === 'user') {
            const userMessageHTML = `
                <div class="message user-message" data-message-id="${message.id}">
                    <div class="message-content">${this.escapeHTML(message.content)}</div>
                    <div class="message-time">${this.formatTime(message.timestamp)}</div>
                </div>
            `;
            messagesContainer.insertAdjacentHTML('beforeend', userMessageHTML);
        } else {
            // AI response with multiple models
            const aiResponsesHTML = `
                <div class="ai-responses" data-message-id="${message.id}">
                    ${this.generateAIResponseHTML(message)}
                </div>
            `;
            messagesContainer.insertAdjacentHTML('beforeend', aiResponsesHTML);
        }
        
        // Scroll to bottom
        this.scrollToBottom();
    }

    generateAIResponseHTML(message) {
        // Only show responses for selected models
        const selectedModelIds = Array.from(this.selectedModels);
        
        if (selectedModelIds.length === 0) {
            // Default to showing all models if none selected
            selectedModelIds.push('llama', 'gemini', 'qwen');
        }
        
        const models = selectedModelIds.map(modelId => {
            const modelInfo = this.getModelInfo(modelId);
            if (!modelInfo) return null;
            
            return {
                name: modelInfo.name,
                icon: modelInfo.icon,
                iconClass: modelInfo.iconClass,
                response: this.generateResponseForModel(modelId, message.content)
            };
        }).filter(Boolean);

        return models.map(model => `
            <div class="ai-response">
                <div class="response-header">
                    <div class="model-info">
                        <div class="model-icon ${model.iconClass}">
                            ${model.icon === 'qwen-svg' ? 
                                '<svg xmlns="http://www.w3.org/2000/svg" height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em"><title>Qwen</title><path d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z" fill="url(#qwen-gradient-${Date.now()})" fill-rule="nonzero"/><defs><linearGradient id="qwen-gradient-${Date.now()}" x1="0%" x2="100%" y1="0%" y2="0%"><stop offset="0%" stop-color="#6336E7" stop-opacity=".84"/><stop offset="100%" stop-color="#6F69F7" stop-opacity=".84"/></linearGradient></defs></svg>' :
                                model.icon === 'llama-svg' ? 
                                '<svg xmlns="http://www.w3.org/2000/svg" height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em"><title>Meta</title><path d="M6.897 4h-.024l-.031 2.615h.022c1.715 0 3.046 1.357 5.94 6.246l.175.297.012.02 1.62-2.438-.012-.019a48.763 48.763 0 00-1.098-1.716 28.01 28.01 0 00-1.175-1.629C10.413 4.932 8.812 4 6.896 4z" fill="url(#meta-fill-0-${Date.now()})"/><path d="M6.873 4C4.95 4.01 3.247 5.258 2.02 7.17a4.352 4.352 0 00-.01.017l2.254 1.231.011-.017c.718-1.083 1.61-1.774 2.568-1.785h.021L6.896 4h-.023z" fill="url(#meta-fill-1-${Date.now()})"/><path d="M2.019 7.17l-.011.017C1.2 8.447.598 9.995.274 11.664l-.005.022 2.534.6.004-.022c.27-1.467.786-2.828 1.456-3.845l.011-.017L2.02 7.17z" fill="url(#meta-fill-2-${Date.now()})"/><path d="M2.807 12.264l-2.533-.6-.005.022c-.177.918-.267 1.851-.269 2.786v.023l2.598.233v-.023a12.591 12.591 0 01.21-2.44z" fill="url(#meta-fill-3-${Date.now()})"/><path d="M2.677 15.537a5.462 5.462 0 01-.079-.813v-.022L0 14.468v.024a8.89 8.89 0 00.146 1.652l2.535-.585a4.106 4.106 0 01-.004-.022z" fill="url(#meta-fill-4-${Date.now()})"/><path d="M3.27 16.89c-.284-.31-.484-.756-.589-1.328l-.004-.021-2.535.585.004.021c.192 1.01.568 1.85 1.106 2.487l.014.017 2.018-1.745a2.106 2.106 0 01-.015-.016z" fill="url(#meta-fill-5-${Date.now()})"/><path d="M10.78 9.654c-1.528 2.35-2.454 3.825-2.454 3.825-2.035 3.2-2.739 3.917-3.871 3.917a1.545 1.545 0 01-1.186-.508l-2.017 1.744.014.017C2.01 19.518 3.058 20 4.356 20c1.963 0 3.374-.928 5.884-5.33l1.766-3.13a41.283 41.283 0 00-1.227-1.886z" fill="#0082FB"/><path d="M13.502 5.946l-.016.016c-.4.43-.786.908-1.16 1.416.378.483.768 1.024 1.175 1.63.48-.743.928-1.345 1.367-1.807l.016-.016-1.382-1.24z" fill="url(#meta-fill-6-${Date.now()})"/><path d="M20.918 5.713C19.853 4.633 18.583 4 17.225 4c-1.432 0-2.637.787-3.723 1.944l-.016.016 1.382 1.24.016-.017c.715-.747 1.408-1.12 2.176-1.12.826 0 1.6.39 2.27 1.075l.015.016 1.589-1.425-.016-.016z" fill="#0082FB"/><path d="M23.998 14.125c-.06-3.467-1.27-6.566-3.064-8.396l-.016-.016-1.588 1.424.015.016c1.35 1.392 2.277 3.98 2.361 6.971v.023h2.292v-.022z" fill="url(#meta-fill-7-${Date.now()})"/><path d="M23.998 14.15v-.023h-2.292v.022c.004.14.006.282.006.424 0 .815-.121 1.474-.368 1.95l-.011.022 1.708 1.782.013-.02c.62-.96.946-2.293.946-3.91 0-.083 0-.165-.002-.247z" fill="url(#meta-fill-8-${Date.now()})"/><path d="M21.344 16.52l-.011.02c-.214.402-.519.67-.917.787l.778 2.462a3.493 3.493 0 00.438-.182 3.558 3.558 0 001.366-1.218l.044-.065.012-.02-1.71-1.784z" fill="url(#meta-fill-9-${Date.now()})"/><path d="M19.92 17.393c-.262 0-.492-.039-.718-.14l-.798 2.522c.449.153.927.222 1.46.222.492 0 .943-.073 1.352-.215l-.78-2.462c-.167.05-.341.075-.517.073z" fill="url(#meta-fill-10-${Date.now()})"/><path d="M18.323 16.534l-.014-.017-1.836 1.914.016.017c.637.682 1.246 1.105 1.937 1.337l.797-2.52c-.291-.125-.573-.353-.9-.731z" fill="url(#meta-fill-11-${Date.now()})"/><path d="M18.309 16.515c-.55-.642-1.232-1.712-2.303-3.44l-1.396-2.336-.011-.02-1.62 2.438.012.02.989 1.668c.959 1.61 1.74 2.774 2.493 3.585l.016.016 1.834-1.914a2.353 2.353 0 01-.014-.017z" fill="url(#meta-fill-12-${Date.now()})"/><defs><linearGradient id="meta-fill-0-${Date.now()}" x1="75.897%" x2="26.312%" y1="89.199%" y2="12.194%"><stop offset=".06%" stop-color="#0867DF"/><stop offset="45.39%" stop-color="#0668E1"/><stop offset="85.91%" stop-color="#0064E0"/></linearGradient><linearGradient id="meta-fill-1-${Date.now()}" x1="21.67%" x2="97.068%" y1="75.874%" y2="23.985%"><stop offset="13.23%" stop-color="#0064DF"/><stop offset="99.88%" stop-color="#0064E0"/></linearGradient><linearGradient id="meta-fill-2-${Date.now()}" x1="38.263%" x2="60.895%" y1="89.127%" y2="16.131%"><stop offset="1.47%" stop-color="#0072EC"/><stop offset="68.81%" stop-color="#0064DF"/></linearGradient><linearGradient id="meta-fill-3-${Date.now()}" x1="47.032%" x2="52.15%" y1="90.19%" y2="15.745%"><stop offset="7.31%" stop-color="#007CF6"/><stop offset="99.43%" stop-color="#0072EC"/></linearGradient><linearGradient id="meta-fill-4-${Date.now()}" x1="52.155%" x2="47.591%" y1="58.301%" y2="37.004%"><stop offset="7.31%" stop-color="#007FF9"/><stop offset="100%" stop-color="#007CF6"/></linearGradient><linearGradient id="meta-fill-5-${Date.now()}" x1="37.689%" x2="61.961%" y1="12.502%" y2="63.624%"><stop offset="7.31%" stop-color="#007FF9"/><stop offset="100%" stop-color="#0082FB"/></linearGradient><linearGradient id="meta-fill-6-${Date.now()}" x1="34.808%" x2="62.313%" y1="68.859%" y2="23.174%"><stop offset="27.99%" stop-color="#007FF8"/><stop offset="91.41%" stop-color="#0082FB"/></linearGradient><linearGradient id="meta-fill-7-${Date.now()}" x1="43.762%" x2="57.602%" y1="6.235%" y2="98.514%"><stop offset="0%" stop-color="#0082FB"/><stop offset="99.95%" stop-color="#0081FA"/></linearGradient><linearGradient id="meta-fill-8-${Date.now()}" x1="60.055%" x2="39.88%" y1="4.661%" y2="69.077%"><stop offset="6.19%" stop-color="#0081FA"/><stop offset="100%" stop-color="#0080F9"/></linearGradient><linearGradient id="meta-fill-9-${Date.now()}" x1="30.282%" x2="61.081%" y1="59.32%" y2="33.244%"><stop offset="0%" stop-color="#027AF3"/><stop offset="100%" stop-color="#0080F9"/></linearGradient><linearGradient id="meta-fill-10-${Date.now()}" x1="20.433%" x2="82.112%" y1="50.001%" y2="50.001%"><stop offset="0%" stop-color="#0377EF"/><stop offset="99.94%" stop-color="#0279F1"/></linearGradient><linearGradient id="meta-fill-11-${Date.now()}" x1="40.303%" x2="72.394%" y1="35.298%" y2="57.811%"><stop offset=".19%" stop-color="#0471E9"/><stop offset="100%" stop-color="#0377EF"/></linearGradient><linearGradient id="meta-fill-12-${Date.now()}" x1="32.254%" x2="68.003%" y1="19.719%" y2="84.908%"><stop offset="27.65%" stop-color="#0867DF"/><stop offset="100%" stop-color="#0471E9"/></linearGradient></defs></svg>' :
                                model.icon === 'gemini-svg' ? 
                                '<svg xmlns="http://www.w3.org/2000/svg" height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em"><title>Gemini</title><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="#3186FF"/><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#gemini-fill-0-${Date.now()})"/><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#gemini-fill-1-${Date.now()})"/><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#gemini-fill-2-${Date.now()})"/><defs><linearGradient gradientUnits="userSpaceOnUse" id="gemini-fill-0-${Date.now()}" x1="7" x2="11" y1="15.5" y2="12"><stop stop-color="#08B962"/><stop offset="1" stop-color="#08B962" stop-opacity="0"/></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="gemini-fill-1-${Date.now()}" x1="8" x2="11.5" y1="5.5" y2="11"><stop stop-color="#F94543"/><stop offset="1" stop-color="#F94543" stop-opacity="0"/></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="gemini-fill-2-${Date.now()}" x1="3.5" x2="17.5" y1="13.5" y2="12"><stop stop-color="#FABC12"/><stop offset=".46" stop-color="#FABC12" stop-opacity="0"/></linearGradient></defs></svg>' :
                                model.icon === 'claude-svg' ? 
                                '<svg xmlns="http://www.w3.org/2000/svg" height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em"><title>Claude</title><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill="#D97757" fill-rule="nonzero"/></svg>' :
                                `<i class="${model.icon}"></i>`
                            }
                        </div>
                        <div class="model-name">${model.name}</div>
                    </div>
                    <button class="expand-btn">Expand</button>
                </div>
                <div class="response-content">${this.escapeHTML(model.response)}</div>
                <div class="response-time">${this.formatTime(message.timestamp)}</div>
            </div>
        `).join('');
    }

    generateResponseForModel(modelId, userMessage) {
        switch (modelId) {
            case 'llama':
                return this.generateLlamaResponse(userMessage);
            case 'gemini':
                return this.generateGeminiResponse(userMessage);
            case 'qwen':
                return this.generateQwenResponse(userMessage);
            case 'claude':
                return this.generateClaudeResponse(userMessage);
            case 'gpt':
                return this.generateGPTResponse(userMessage);
            default:
                return this.generateLlamaResponse(userMessage);
        }
    }

    generateLlamaResponse(userMessage) {
        const responses = [
            `Hello! It's nice to meet you. Is there something I can help you with, or would you like to chat?`,
            `I'm here to assist you with any questions or tasks you might have. What would you like to explore?`,
            `Greetings! I'm ready to help you with information, analysis, or just a friendly conversation.`,
            `Hi there! I'm here to support you with whatever you need. How can I be of assistance today?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    generateGeminiResponse(userMessage) {
        const responses = [
            `Hello! How can I assist you today?`,
            `Hi! I'm here to help. What would you like to know or discuss?`,
            `Greetings! I'm ready to assist with your questions or tasks.`,
            `Hello there! How can I be helpful to you today?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    generateQwenResponse(userMessage) {
        const responses = [
            `Okay, the user said "${userMessage}". I should respond in a friendly and welcoming manner. Maybe start with a greeting and...`,
            `The user greeted me with "${userMessage}". I need to provide a warm, helpful response that shows I'm ready to assist...`,
            `User message: "${userMessage}". I should acknowledge this greeting and offer my assistance in a friendly way...`,
            `Received: "${userMessage}". I'll respond with a welcoming message and ask how I can help...`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    generateClaudeResponse(userMessage) {
        const responses = [
            `Hello! I'm Claude, and I'm here to help you with any questions or tasks you might have. What would you like to explore or discuss?`,
            `Greetings! I'm ready to assist you with creative problem-solving, analysis, or just a thoughtful conversation. How can I help?`,
            `Hi there! I'm here to provide insightful and creative responses to your questions. What's on your mind?`,
            `Hello! I'm excited to help you with whatever you need. Whether it's analysis, creativity, or just a chat, I'm here for you.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    generateGPTResponse(userMessage) {
        const responses = [
            `Hello! I'm GPT-4, and I'm here to help you with comprehensive and accurate information. What would you like to know?`,
            `Hi! I'm ready to provide detailed and well-researched responses to your questions. How can I assist you today?`,
            `Greetings! I'm here to help with any topic you'd like to explore. What would you like to discuss?`,
            `Hello! I'm available to help with your questions and provide thorough, accurate information. What can I help you with?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    simulateAIResponses(userMessage) {
        // Add loading state
        const loadingHTML = `
            <div class="ai-responses loading" data-loading="true">
                <div class="ai-response">
                    <div class="response-header">
                        <div class="model-info">
                            <div class="model-icon llama-icon">
                                <i class="fas fa-dice-six"></i>
                            </div>
                            <div class="model-name">Llama 4 Maverick 17B 128E Instruct</div>
                        </div>
                    </div>
                    <div class="response-content">Thinking...</div>
                </div>
            </div>
        `;
        
        const messagesContainer = document.querySelector('.messages');
        messagesContainer.insertAdjacentHTML('beforeend', loadingHTML);
        this.scrollToBottom();

        // Simulate response delay
        setTimeout(() => {
            const loadingElement = document.querySelector('[data-loading="true"]');
            if (loadingElement) {
                loadingElement.remove();
            }
            
            this.addMessageToChat('ai', userMessage);
        }, 1500 + Math.random() * 1000);
    }

    toggleDropdown() {
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const dropdownContent = document.querySelector('.dropdown-content');
        
        if (dropdownContent.classList.contains('show')) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const dropdownContent = document.querySelector('.dropdown-content');
        
        dropdownToggle.classList.add('active');
        dropdownContent.classList.add('show');
    }

    closeDropdown() {
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const dropdownContent = document.querySelector('.dropdown-content');
        
        dropdownToggle.classList.remove('active');
        dropdownContent.classList.remove('show');
    }

    toggleModelSelection(option) {
        const modelId = option.dataset.modelId;
        const isSelected = option.classList.contains('selected');
        
        if (isSelected) {
            option.classList.remove('selected');
            this.selectedModels.delete(modelId);
        } else {
            if (this.selectedModels.size >= this.maxSelectedModels) {
                this.showNotification('You can only select up to 3 models at a time.', 'warning');
                return;
            }
            
            option.classList.add('selected');
            this.selectedModels.add(modelId);
        }
        
        this.updateSelectedModelsDisplay();
        this.updateDropdownToggleText();
        
        // Add visual feedback
        option.style.transform = 'scale(0.98)';
        setTimeout(() => {
            option.style.transform = '';
        }, 150);
    }

    updateSelectedModelsDisplay() {
        const selectedModelsList = document.querySelector('.selected-models-list');
        if (!selectedModelsList) return;
        
        selectedModelsList.innerHTML = '';
        
        this.selectedModels.forEach(modelId => {
            const modelInfo = this.getModelInfo(modelId);
            if (modelInfo) {
                const tag = document.createElement('div');
                tag.className = 'selected-model-tag';
                
                let iconHTML = '';
                if (modelInfo.icon === 'qwen-svg') {
                    iconHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em"><title>Qwen</title><path d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z" fill="url(#lobe-icons-qwen-fill)" fill-rule="nonzero"/><defs><linearGradient id="lobe-icons-qwen-fill" x1="0%" x2="100%" y1="0%" y2="0%"><stop offset="0%" stop-color="#6336E7" stop-opacity=".84"/><stop offset="100%" stop-color="#6F69F7" stop-opacity=".84"/></linearGradient></defs></svg>';
                } else if (modelInfo.icon === 'llama-svg') {
                    iconHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em"><title>Meta</title><path d="M6.897 4h-.024l-.031 2.615h.022c1.715 0 3.046 1.357 5.94 6.246l.175.297.012.02 1.62-2.438-.012-.019a48.763 48.763 0 00-1.098-1.716 28.01 28.01 0 00-1.175-1.629C10.413 4.932 8.812 4 6.896 4z" fill="url(#meta-fill-0-${Date.now()})"/><path d="M6.873 4C4.95 4.01 3.247 5.258 2.02 7.17a4.352 4.352 0 00-.01.017l2.254 1.231.011-.017c.718-1.083 1.61-1.774 2.568-1.785h.021L6.896 4h-.023z" fill="url(#meta-fill-1-${Date.now()})"/><path d="M2.019 7.17l-.011.017C1.2 8.447.598 9.995.274 11.664l-.005.022 2.534.6.004-.022c.27-1.467.786-2.828 1.456-3.845l.011-.017L2.02 7.17z" fill="url(#meta-fill-2-${Date.now()})"/><path d="M2.807 12.264l-2.533-.6-.005.022c-.177.918-.267 1.851-.269 2.786v.023l2.598.233v-.023a12.591 12.591 0 01.21-2.44z" fill="url(#meta-fill-3-${Date.now()})"/><path d="M2.677 15.537a5.462 5.462 0 01-.079-.813v-.022L0 14.468v.024a8.89 8.89 0 00.146 1.652l2.535-.585a4.106 4.106 0 01-.004-.022z" fill="url(#meta-fill-4-${Date.now()})"/><path d="M3.27 16.89c-.284-.31-.484-.756-.589-1.328l-.004-.021-2.535.585.004.021c.192 1.01.568 1.85 1.106 2.487l.014.017 2.018-1.745a2.106 2.106 0 01-.015-.016z" fill="url(#meta-fill-5-${Date.now()})"/><path d="M10.78 9.654c-1.528 2.35-2.454 3.825-2.454 3.825-2.035 3.2-2.739 3.917-3.871 3.917a1.545 1.545 0 01-1.186-.508l-2.017 1.744.014.017C2.01 19.518 3.058 20 4.356 20c1.963 0 3.374-.928 5.884-5.33l1.766-3.13a41.283 41.283 0 00-1.227-1.886z" fill="#0082FB"/><path d="M13.502 5.946l-.016.016c-.4.43-.786.908-1.16 1.416.378.483.768 1.024 1.175 1.63.48-.743.928-1.345 1.367-1.807l.016-.016-1.382-1.24z" fill="url(#meta-fill-6-${Date.now()})"/><path d="M20.918 5.713C19.853 4.633 18.583 4 17.225 4c-1.432 0-2.637.787-3.723 1.944l-.016.016 1.382 1.24.016-.017c.715-.747 1.408-1.12 2.176-1.12.826 0 1.6.39 2.27 1.075l.015.016 1.589-1.425-.016-.016z" fill="#0082FB"/><path d="M23.998 14.125c-.06-3.467-1.27-6.566-3.064-8.396l-.016-.016-1.588 1.424.015.016c1.35 1.392 2.277 3.98 2.361 6.971v.023h2.292v-.022z" fill="url(#meta-fill-7-${Date.now()})"/><path d="M23.998 14.15v-.023h-2.292v.022c.004.14.006.282.006.424 0 .815-.121 1.474-.368 1.95l-.011.022 1.708 1.782.013-.02c.62-.96.946-2.293.946-3.91 0-.083 0-.165-.002-.247z" fill="url(#meta-fill-8-${Date.now()})"/><path d="M21.344 16.52l-.011.02c-.214.402-.519.67-.917.787l.778 2.462a3.493 3.493 0 00.438-.182 3.558 3.558 0 001.366-1.218l.044-.065.012-.02-1.71-1.784z" fill="url(#meta-fill-9-${Date.now()})"/><path d="M19.92 17.393c-.262 0-.492-.039-.718-.14l-.798 2.522c.449.153.927.222 1.46.222.492 0 .943-.073 1.352-.215l-.78-2.462c-.167.05-.341.075-.517.073z" fill="url(#meta-fill-10-${Date.now()})"/><path d="M18.323 16.534l-.014-.017-1.836 1.914.016.017c.637.682 1.246 1.105 1.937 1.337l.797-2.52c-.291-.125-.573-.353-.9-.731z" fill="url(#meta-fill-11-${Date.now()})"/><path d="M18.309 16.515c-.55-.642-1.232-1.712-2.303-3.44l-1.396-2.336-.011-.02-1.62 2.438.012.02.989 1.668c.959 1.61 1.74 2.774 2.493 3.585l.016.016 1.834-1.914a2.353 2.353 0 01-.014-.017z" fill="url(#meta-fill-12-${Date.now()})"/><defs><linearGradient id="meta-fill-0-${Date.now()}" x1="75.897%" x2="26.312%" y1="89.199%" y2="12.194%"><stop offset=".06%" stop-color="#0867DF"/><stop offset="45.39%" stop-color="#0668E1"/><stop offset="85.91%" stop-color="#0064E0"/></linearGradient><linearGradient id="meta-fill-1-${Date.now()}" x1="21.67%" x2="97.068%" y1="75.874%" y2="23.985%"><stop offset="13.23%" stop-color="#0064DF"/><stop offset="99.88%" stop-color="#0064E0"/></linearGradient><linearGradient id="meta-fill-2-${Date.now()}" x1="38.263%" x2="60.895%" y1="89.127%" y2="16.131%"><stop offset="1.47%" stop-color="#0072EC"/><stop offset="68.81%" stop-color="#0064DF"/></linearGradient><linearGradient id="meta-fill-3-${Date.now()}" x1="47.032%" x2="52.15%" y1="90.19%" y2="15.745%"><stop offset="7.31%" stop-color="#007CF6"/><stop offset="99.43%" stop-color="#0072EC"/></linearGradient><linearGradient id="meta-fill-4-${Date.now()}" x1="52.155%" x2="47.591%" y1="58.301%" y2="37.004%"><stop offset="7.31%" stop-color="#007FF9"/><stop offset="100%" stop-color="#007CF6"/></linearGradient><linearGradient id="meta-fill-5-${Date.now()}" x1="37.689%" x2="61.961%" y1="12.502%" y2="63.624%"><stop offset="7.31%" stop-color="#007FF9"/><stop offset="100%" stop-color="#0082FB"/></linearGradient><linearGradient id="meta-fill-6-${Date.now()}" x1="34.808%" x2="62.313%" y1="68.859%" y2="23.174%"><stop offset="27.99%" stop-color="#007FF8"/><stop offset="91.41%" stop-color="#0082FB"/></linearGradient><linearGradient id="meta-fill-7-${Date.now()}" x1="43.762%" x2="57.602%" y1="6.235%" y2="98.514%"><stop offset="0%" stop-color="#0082FB"/><stop offset="99.95%" stop-color="#0081FA"/></linearGradient><linearGradient id="meta-fill-8-${Date.now()}" x1="60.055%" x2="39.88%" y1="4.661%" y2="69.077%"><stop offset="6.19%" stop-color="#0081FA"/><stop offset="100%" stop-color="#0080F9"/></linearGradient><linearGradient id="meta-fill-9-${Date.now()}" x1="30.282%" x2="61.081%" y1="59.32%" y2="33.244%"><stop offset="0%" stop-color="#027AF3"/><stop offset="100%" stop-color="#0080F9"/></linearGradient><linearGradient id="meta-fill-10-${Date.now()}" x1="20.433%" x2="82.112%" y1="50.001%" y2="50.001%"><stop offset="0%" stop-color="#0377EF"/><stop offset="99.94%" stop-color="#0279F1"/></linearGradient><linearGradient id="meta-fill-11-${Date.now()}" x1="40.303%" x2="72.394%" y1="35.298%" y2="57.811%"><stop offset=".19%" stop-color="#0471E9"/><stop offset="100%" stop-color="#0377EF"/></linearGradient><linearGradient id="meta-fill-12-${Date.now()}" x1="32.254%" x2="68.003%" y1="19.719%" y2="84.908%"><stop offset="27.65%" stop-color="#0867DF"/><stop offset="100%" stop-color="#0471E9"/></linearGradient></defs></svg>';
                } else if (modelInfo.icon === 'gemini-svg') {
                    iconHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em"><title>Gemini</title><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="#3186FF"/><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#gemini-fill-0-${Date.now()})"/><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#gemini-fill-1-${Date.now()})"/><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#gemini-fill-2-${Date.now()})"/><defs><linearGradient gradientUnits="userSpaceOnUse" id="gemini-fill-0-${Date.now()}" x1="7" x2="11" y1="15.5" y2="12"><stop stop-color="#08B962"/><stop offset="1" stop-color="#08B962" stop-opacity="0"/></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="gemini-fill-1-${Date.now()}" x1="8" x2="11.5" y1="5.5" y2="11"><stop stop-color="#F94543"/><stop offset="1" stop-color="#F94543" stop-opacity="0"/></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="gemini-fill-2-${Date.now()}" x1="3.5" x2="17.5" y1="13.5" y2="12"><stop stop-color="#FABC12"/><stop offset=".46" stop-color="#FABC12" stop-opacity="0"/></linearGradient></defs></svg>';
                } else if (modelInfo.icon === 'claude-svg') {
                    iconHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em"><title>Claude</title><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill="#D97757" fill-rule="nonzero"/></svg>';
                } else {
                    iconHTML = `<i class="${modelInfo.icon}"></i>`;
                }
                
                tag.innerHTML = `
                    ${iconHTML}
                    <span>${modelInfo.shortName}</span>
                    <button class="remove-btn" onclick="app.removeModel('${modelId}')">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                selectedModelsList.appendChild(tag);
            }
        });
    }

    updateDropdownToggleText() {
        const dropdownToggle = document.querySelector('.dropdown-toggle span');
        if (!dropdownToggle) return;
        
        if (this.selectedModels.size === 0) {
            dropdownToggle.textContent = 'Select Models';
        } else if (this.selectedModels.size === 1) {
            const modelId = Array.from(this.selectedModels)[0];
            const modelInfo = this.getModelInfo(modelId);
            dropdownToggle.textContent = modelInfo ? modelInfo.shortName : '1 Model Selected';
        } else {
            dropdownToggle.textContent = `${this.selectedModels.size} Models Selected`;
        }
    }

    removeModel(modelId) {
        const option = document.querySelector(`[data-model-id="${modelId}"]`);
        if (option) {
            option.classList.remove('selected');
        }
        this.selectedModels.delete(modelId);
        this.updateSelectedModelsDisplay();
        this.updateDropdownToggleText();
    }

    getModelInfo(modelId) {
        const modelInfo = {
            llama: {
                name: 'Llama 4 Maverick 17B 128E Instruct',
                shortName: 'Llama 4',
                icon: 'llama-svg',
                iconClass: 'llama-icon'
            },
            gemini: {
                name: 'Gemini 2.0 Flash',
                shortName: 'Gemini 2.0',
                icon: 'gemini-svg',
                iconClass: 'gemini-icon'
            },
            qwen: {
                name: 'Qwen 3 32B',
                shortName: 'Qwen 3',
                icon: 'qwen-svg',
                iconClass: 'qwen-icon'
            },
            claude: {
                name: 'Claude 3.5 Sonnet',
                shortName: 'Claude 3.5',
                icon: 'claude-svg',
                iconClass: 'claude-icon'
            },
            gpt: {
                name: 'GPT-4 Turbo',
                shortName: 'GPT-4',
                icon: 'fas fa-dice-six',
                iconClass: 'gpt-icon'
            }
        };
        
        return modelInfo[modelId];
    }

    expandResponse(btn) {
        const response = btn.closest('.ai-response');
        const content = response.querySelector('.response-content');
        
        if (content.style.maxHeight && content.style.maxHeight !== 'none') {
            content.style.maxHeight = null;
            btn.textContent = 'Expand';
        } else {
            content.style.maxHeight = content.scrollHeight + 'px';
            btn.textContent = 'Collapse';
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const themeBtn = document.querySelector('.theme-btn i');
        
        if (document.body.classList.contains('dark-theme')) {
            themeBtn.className = 'fas fa-moon';
        } else {
            themeBtn.className = 'fas fa-sun';
        }
    }

    openSettings() {
        this.showNotification('Settings panel would open here.', 'info');
    }



    logout() {
        if (confirm('Are you sure you want to logout?')) {
            this.showNotification('Logging out...', 'info');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }

    loadChat(chatId) {
        const chat = this.chatHistory.find(c => c.id === chatId);
        if (chat) {
            this.currentChat = chat;
            this.clearChatArea();
            this.displayChat(chat);
        }
    }

    deleteChat(chatId) {
        if (confirm('Are you sure you want to delete this chat?')) {
            this.chatHistory = this.chatHistory.filter(c => c.id !== chatId);
            this.saveChatHistory();
            this.updateChatHistory();
            
            if (this.currentChat && this.currentChat.id === chatId) {
                this.currentChat = null;
                this.clearChatArea();
            }
        }
    }

    displayChat(chat) {
        const messagesContainer = document.querySelector('.messages');
        messagesContainer.innerHTML = '';
        
        chat.messages.forEach(message => {
            this.displayMessage(message);
        });
    }

    clearChatArea() {
        const messagesContainer = document.querySelector('.messages');
        messagesContainer.innerHTML = '';
    }

    updateChatHistory() {
        const chatHistoryContainer = document.querySelector('.chat-history');
        if (!chatHistoryContainer) return;
        
        chatHistoryContainer.innerHTML = this.chatHistory.map(chat => `
            <div class="chat-item" data-chat-id="${chat.id}">
                <div class="chat-info">
                    <div class="chat-title">${this.escapeHTML(chat.title)}</div>
                    <div class="chat-preview">${this.escapeHTML(chat.messages[0]?.content.substring(0, 30) || 'No messages')}...</div>
                </div>
                <button class="delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        
        // Reattach event listeners
        this.initializeEventListeners();
    }

    scrollToBottom() {
        const chatArea = document.querySelector('.chat-area');
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }

    loadChatHistory() {
        const saved = localStorage.getItem('prudence-ai-chats');
        if (saved) {
            this.chatHistory = JSON.parse(saved);
        }
    }

    saveChatHistory() {
        localStorage.setItem('prudence-ai-chats', JSON.stringify(this.chatHistory));
    }

    // Attachment methods
    openFileSelector() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.rar';
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => this.addAttachment(file));
        };
        
        input.click();
    }

    addAttachment(file) {
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showNotification('File size must be less than 10MB', 'warning');
            return;
        }

        // Check if file already exists
        const exists = this.attachments.find(att => att.name === file.name);
        if (exists) {
            this.showNotification('File already attached', 'warning');
            return;
        }

        // Add to attachments array
        this.attachments.push(file);
        this.updateAttachmentsDisplay();
    }

    removeAttachment(fileName) {
        this.attachments = this.attachments.filter(file => file.name !== fileName);
        this.updateAttachmentsDisplay();
    }

    updateAttachmentsDisplay() {
        const preview = document.querySelector('.attachments-preview');
        const list = document.querySelector('.attachments-list');
        
        if (this.attachments.length === 0) {
            preview.style.display = 'none';
            return;
        }

        preview.style.display = 'block';
        list.innerHTML = '';

        this.attachments.forEach(file => {
            const item = document.createElement('div');
            item.className = 'attachment-item';
            
            const icon = this.getFileIcon(file.name);
            
            item.innerHTML = `
                <i class="file-icon ${icon}"></i>
                <span class="file-name">${file.name}</span>
                <button class="remove-attachment" onclick="app.removeAttachment('${file.name}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            list.appendChild(item);
        });
    }

    getFileIcon(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        
        const iconMap = {
            'pdf': 'fas fa-file-pdf',
            'doc': 'fas fa-file-word',
            'docx': 'fas fa-file-word',
            'txt': 'fas fa-file-alt',
            'jpg': 'fas fa-file-image',
            'jpeg': 'fas fa-file-image',
            'png': 'fas fa-file-image',
            'gif': 'fas fa-file-image',
            'mp4': 'fas fa-file-video',
            'mp3': 'fas fa-file-audio',
            'zip': 'fas fa-file-archive',
            'rar': 'fas fa-file-archive'
        };
        
        return iconMap[extension] || 'fas fa-file';
    }

    clearAttachments() {
        this.attachments = [];
        this.updateAttachmentsDisplay();
    }

    // Sidebar toggle methods
    toggleSidebar() {
        if (this.sidebarCollapsed) {
            this.expandSidebar();
        } else {
            this.collapseSidebar();
        }
    }

    collapseSidebar() {
        const sidebar = document.querySelector('#sidebar');
        const mainContent = document.querySelector('#main-content');
        const toggleBtn = document.querySelector('#sidebar-toggle');
        
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
        this.sidebarCollapsed = true;
        
        // Update toggle button icon
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        }
    }

    expandSidebar() {
        const sidebar = document.querySelector('#sidebar');
        const mainContent = document.querySelector('#main-content');
        const toggleBtn = document.querySelector('#sidebar-toggle');
        
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('expanded');
        this.sidebarCollapsed = false;
        
        // Update toggle button icon
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="fas fa-times"></i>';
        }
    }

    // Prompt Optimizer Methods
    openPromptOptimizer() {
        const messageInput = document.querySelector('.message-input');
        const originalPromptText = document.querySelector('.original-prompt-text');
        const optimizedPromptText = document.querySelector('.optimized-prompt-text');
        const optimizerPanel = document.querySelector('.prompt-optimizer-panel');

        if (!messageInput || !originalPromptText || !optimizedPromptText || !optimizerPanel) {
            return;
        }

        const currentPrompt = messageInput.value.trim();
        if (!currentPrompt) {
            this.showNotification('Please enter a message first', 'warning');
            return;
        }

        this.originalPrompt = currentPrompt;
        originalPromptText.value = currentPrompt;
        optimizedPromptText.value = currentPrompt;
        optimizerPanel.style.display = 'block';
        this.isOptimizerOpen = true;
        optimizedPromptText.focus();
        this.showNotification('Prompt optimizer opened', 'info');
    }

    closePromptOptimizer() {
        const optimizerPanel = document.querySelector('.prompt-optimizer-panel');
        if (optimizerPanel) {
            optimizerPanel.style.display = 'none';
            this.isOptimizerOpen = false;
        }
    }

    applyQuickOptimization(action) {
        const optimizedPromptText = document.querySelector('.optimized-prompt-text');
        if (!optimizedPromptText) return;

        const currentText = optimizedPromptText.value;
        let optimizedText = '';

        switch (action) {
            case 'clarify':
                optimizedText = `Please provide a clear and detailed response to: "${currentText}". Ensure your response is well-structured, comprehensive, and professional.`;
                break;
            case 'expand':
                optimizedText = `I would like a comprehensive response to: "${currentText}". Please include background context, step-by-step breakdown, examples, and practical applications.`;
                break;
            case 'simplify':
                optimizedText = `Please provide a simple and straightforward response to: "${currentText}". Keep it clear, concise, and easy to understand.`;
                break;
            case 'professional':
                optimizedText = `I require a professional response to: "${currentText}". Please maintain a formal tone, use appropriate business language, and include relevant data if applicable.`;
                break;
            case 'creative':
                optimizedText = `I'm looking for a creative approach to: "${currentText}". Please think outside the box, offer unique perspectives, and provide innovative solutions.`;
                break;
        }

        optimizedPromptText.value = optimizedText;
        this.showNotification(`Applied ${action} optimization`, 'success');
    }

    resetOptimization() {
        const optimizedPromptText = document.querySelector('.optimized-prompt-text');
        if (optimizedPromptText) {
            optimizedPromptText.value = this.originalPrompt;
            this.showNotification('Optimization reset to original', 'info');
        }
    }

    applyOptimization() {
        const optimizedPromptText = document.querySelector('.optimized-prompt-text');
        const messageInput = document.querySelector('.message-input');
        
        if (!optimizedPromptText || !messageInput) return;

        const optimizedText = optimizedPromptText.value.trim();
        if (!optimizedText) {
            this.showNotification('Please enter an optimized prompt', 'warning');
            return;
        }

        messageInput.value = optimizedText;
        this.closePromptOptimizer();
        this.sendMessage();
        this.showNotification('Optimized prompt applied and sent', 'success');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new PrudenceAI();
    
    // Initialize the selected models display
    app.updateSelectedModelsDisplay();
    app.updateDropdownToggleText();
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .dark-theme {
            background: #1a1a1a !important;
            color: #ffffff !important;
        }
        
        .dark-theme .app-container {
            background: #2d2d2d !important;
        }
        
        .dark-theme .sidebar {
            background: #3a3a3a !important;
            border-right-color: #4a4a4a !important;
        }
        
        .dark-theme .main-content {
            background: #2d2d2d !important;
        }
        
        .dark-theme .header {
            background: #2d2d2d !important;
            border-bottom-color: #4a4a4a !important;
        }
        
        .dark-theme .chat-area {
            background: #1a1a1a !important;
        }
        
        .dark-theme .ai-response {
            background: #3a3a3a !important;
            border-color: #4a4a4a !important;
        }
        
        .dark-theme .message-input-container {
            background: #2d2d2d !important;
            border-top-color: #4a4a4a !important;
        }
        
        .dark-theme .model-selector {
            background: #3a3a3a !important;
            border-top-color: #4a4a4a !important;
        }
    `;
    document.head.appendChild(style);
});

// Add some sample data for demonstration
window.addEventListener('load', () => {
    // Add sample chat history if none exists
    if (!localStorage.getItem('prudence-ai-chats')) {
        const sampleChats = [
            {
                id: '1',
                title: 'please explain...',
                messages: [
                    {
                        id: '1',
                        sender: 'user',
                        content: 'Can you please explain how APIs work?',
                        timestamp: new Date(Date.now() - 3600000)
                    },
                    {
                        id: '2',
                        sender: 'ai',
                        content: 'APIs are interfaces that allow different software applications to communicate with each other...',
                        timestamp: new Date(Date.now() - 3600000)
                    }
                ],
                timestamp: new Date(Date.now() - 3600000)
            },
            {
                id: '2',
                title: 'what is api en...',
                messages: [
                    {
                        id: '3',
                        sender: 'user',
                        content: 'What is API endpoint?',
                        timestamp: new Date(Date.now() - 7200000)
                    },
                    {
                        id: '4',
                        sender: 'ai',
                        content: 'API endpoints are specific URLs that accept requests and return responses...',
                        timestamp: new Date(Date.now() - 7200000)
                    }
                ],
                timestamp: new Date(Date.now() - 7200000)
            }
        ];
        localStorage.setItem('prudence-ai-chats', JSON.stringify(sampleChats));
    }
}); 