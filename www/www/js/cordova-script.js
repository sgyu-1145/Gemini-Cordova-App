// Cordova应用脚本 - Gemini聊天助手移动版
// 这个文件包含了所有前端逻辑，适配Cordova移动应用环境

// 全局变量
let currentUser = null;
let conversations = [];
let currentConversationId = null;
let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let messageHistory = [];

// DOM 元素
const appContainer = document.querySelector('.app-container');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const settingsModal = document.getElementById('settingsModal');
const conversationList = document.querySelector('.conversation-list');
const chatMessages = document.querySelector('.chat-messages');
const chatInput = document.getElementById('chatInput'); // 注意：在Cordova版本中ID是chatInput
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const settingsBtn = document.getElementById('settingsBtn');
const loginBtn = document.getElementById('loginBtn');
const userInfo = document.getElementById('userInfo');
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
const welcomeMessage = document.getElementById('welcomeMessage');
const chatContainer = document.querySelector('.chat-container');
const chatHeader = document.querySelector('.chat-header');
const chatTitle = document.getElementById('chatTitle');
const pageInfo = document.getElementById('pageInfo');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const sidebar = document.getElementById('sidebar');
const renameChatBtn = document.getElementById('renameChatBtn');
const deleteChatBtn = document.getElementById('deleteChatBtn');

// 设置相关元素
const apiKeyInput = document.getElementById('apiKey');
const modelSelect = document.getElementById('model');
const temperatureInput = document.getElementById('temperature');
const temperatureValue = document.getElementById('temperatureValue');
const maxTokensInput = document.getElementById('maxTokens');
const themeSelect = document.getElementById('theme');
const fontSizeSelect = document.getElementById('fontSize');
const backgroundTypeSelect = document.getElementById('backgroundType');
const imageUploadGroup = document.getElementById('imageUploadGroup');
const backgroundImageInput = document.getElementById('backgroundImage');
const imagePreview = document.getElementById('imagePreview');

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  // 初始化主题
  initTheme();
  
  // 初始化设置
  initSettings();
  
  // 设置事件监听器
  setupEventListeners();
  
  // 检查用户登录状态
  checkAuthStatus();
  
  // 初始化Cordova特定功能
  if (window.cordova) {
    initCordovaFeatures();
  }
});

// 初始化Cordova特定功能
function initCordovaFeatures() {
  // 监听设备准备就绪事件
  document.addEventListener('deviceready', function() {
    console.log('Cordova设备准备就绪');
    
    // 设置状态栏样式
    if (window.StatusBar) {
      StatusBar.styleLightContent();
      StatusBar.backgroundColorByHexString('#424242');
    }
    
    // 处理网络状态变化
    if (navigator.connection) {
      document.addEventListener('online', function() {
        showNotification('网络连接已恢复', 'success');
      });
      
      document.addEventListener('offline', function() {
        showNotification('网络连接已断开', 'warning');
      });
    }
    
    // 处理返回按钮
    document.addEventListener('backbutton', function(e) {
      handleBackButton();
    });
  });
}

// 处理返回按钮
function handleBackButton() {
  // 如果有模态框打开，关闭模态框
  const openModal = document.querySelector('.modal.show');
  if (openModal) {
    openModal.classList.remove('show');
    return;
  }
  
  // 如果侧边栏打开，关闭侧边栏
  if (sidebar && sidebar.classList.contains('show')) {
    sidebar.classList.remove('show');
    return;
  }
  
  // 如果在聊天界面，询问是否退出
  if (confirm('确定要退出应用吗？')) {
    navigator.app.exitApp();
  }
}

// 检查用户认证状态
async function checkAuthStatus() {
  try {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const user = await api.auth.getCurrentUser();
        if (user) {
          currentUser = user;
          updateUserUI();
          await loadConversations();
          showChatInterface();
          return;
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        // 清除无效token
        localStorage.removeItem('authToken');
      }
    }
    
    // 如果没有有效的token，显示登录界面
    showLoginModal();
  } catch (error) {
    console.error('认证检查失败:', error);
    showLoginModal();
  }
}

// 更新用户UI
function updateUserUI() {
  if (currentUser) {
    userInfo.innerHTML = `
      <div class="user-avatar">
        <i class="fas fa-user"></i>
      </div>
      <span class="username">${currentUser.username}</span>
      <button class="btn btn-icon" id="logoutBtn" title="登出">
        <i class="fas fa-sign-out-alt"></i>
      </button>
    `;
    
    // 添加登出按钮事件监听器
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
  } else {
    userInfo.innerHTML = '<button class="btn btn-text" id="loginBtn">登录</button>';
    
    // 添加登录按钮事件监听器
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', showLoginModal);
    }
  }
}

// 显示聊天界面
function showChatInterface() {
  if (loginModal) loginModal.classList.remove('show');
  if (registerModal) registerModal.classList.remove('show');
  if (settingsModal) settingsModal.classList.remove('show');
  appContainer.style.display = 'block';
}

// 显示登录模态框
function showLoginModal() {
  appContainer.style.display = 'none';
  if (loginModal) loginModal.classList.add('show');
  if (registerModal) registerModal.classList.remove('show');
}

// 显示注册模态框
function showRegisterModal() {
  appContainer.style.display = 'none';
  if (loginModal) loginModal.classList.remove('show');
  if (registerModal) registerModal.classList.add('show');
}

// 设置事件监听器
function setupEventListeners() {
  // 新建对话
  if (newChatBtn) {
    newChatBtn.addEventListener('click', createNewConversation);
  }
  
  // 设置按钮
  if (settingsBtn) {
    settingsBtn.addEventListener('click', showSettingsModal);
  }
  
  // 聊天输入
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    // 自动调整文本框高度
    chatInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  }
  
  // 发送按钮
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }
  
  // 切换侧边栏
  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', toggleSidebar);
  }
  
  // 重命名对话
  if (renameChatBtn) {
    renameChatBtn.addEventListener('click', renameCurrentConversation);
  }
  
  // 删除对话
  if (deleteChatBtn) {
    deleteChatBtn.addEventListener('click', deleteCurrentConversation);
  }
  
  // 分页
  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
  }
  
  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
  }
  
  // 回到顶部
  if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener('click', scrollToTop);
  }
  
  if (chatMessages) {
    chatMessages.addEventListener('scroll', handleScroll);
  }
  
  // 模态框关闭按钮
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) modal.classList.remove('show');
    });
  });
  
  // 点击模态框外部关闭
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });
  
  // 登录表单
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // 注册表单
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
  
  // 显示注册按钮
  const showRegisterBtn = document.getElementById('showRegisterBtn');
  if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', showRegisterModal);
  }
  
  // 显示登录按钮
  const showLoginBtn = document.getElementById('showLoginBtn');
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', showLoginModal);
  }
  
  // 设置相关
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => {
      if (settingsModal) settingsModal.classList.remove('show');
    });
  }
  
  const closeLoginBtn = document.getElementById('closeLoginBtn');
  if (closeLoginBtn) {
    closeLoginBtn.addEventListener('click', () => {
      if (loginModal) loginModal.classList.remove('show');
    });
  }
  
  const closeRegisterBtn = document.getElementById('closeRegisterBtn');
  if (closeRegisterBtn) {
    closeRegisterBtn.addEventListener('click', () => {
      if (registerModal) registerModal.classList.remove('show');
    });
  }
  
  // 设置表单
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveSettings);
  }
  
  const resetSettingsBtn = document.getElementById('resetSettingsBtn');
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', resetSettings);
  }
  
  // 温度滑块
  if (temperatureInput) {
    temperatureInput.addEventListener('input', () => {
      if (temperatureValue) {
        temperatureValue.textContent = temperatureInput.value;
      }
    });
  }
  
  // 背景类型选择
  if (backgroundTypeSelect) {
    backgroundTypeSelect.addEventListener('change', handleBackgroundTypeChange);
  }
  
  // 背景图片上传
  if (backgroundImageInput) {
    backgroundImageInput.addEventListener('change', handleBackgroundImageUpload);
  }
  
  // 建议问题点击
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const suggestion = chip.getAttribute('data-suggestion');
      if (chatInput) {
        chatInput.value = suggestion;
        chatInput.focus();
      }
    });
  });
}

// 处理登录
async function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  
  if (!username || !password) {
    showNotification('请输入用户名和密码', 'error');
    return;
  }
  
  try {
    const response = await api.auth.login({ username, password });
    currentUser = response.user;
    updateUserUI();
    await loadConversations();
    showChatInterface();
    showNotification('登录成功', 'success');
  } catch (error) {
    showNotification(error.message || '登录失败', 'error');
  }
}

// 处理注册
async function handleRegister(e) {
  e.preventDefault();
  
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (!username || !email || !password || !confirmPassword) {
    showNotification('请填写所有字段', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showNotification('两次输入的密码不一致', 'error');
    return;
  }
  
  try {
    const response = await api.auth.register({ username, email, password });
    currentUser = response.user;
    updateUserUI();
    await loadConversations();
    showChatInterface();
    showNotification('注册成功', 'success');
  } catch (error) {
    showNotification(error.message || '注册失败', 'error');
  }
}

// 处理登出
async function handleLogout() {
  try {
    await api.auth.logout();
  } catch (error) {
    console.error('登出请求失败:', error);
  } finally {
    currentUser = null;
    currentConversationId = null;
    conversations = [];
    updateUserUI();
    showLoginModal();
    showNotification('已登出', 'info');
  }
}

// 创建新对话
async function createNewConversation() {
  try {
    const response = await api.conversations.createConversation({
      title: '新对话',
      messages: []
    });
    
    currentConversationId = response._id;
    await loadConversations();
    loadConversation(currentConversationId);
    showNotification('已创建新对话', 'success');
  } catch (error) {
    showNotification(error.message || '创建对话失败', 'error');
  }
}

// 加载对话列表
async function loadConversations(page = 1) {
  try {
    isLoading = true;
    const response = await api.conversations.getConversations(page, 20);
    conversations = response.conversations;
    currentPage = response.currentPage;
    totalPages = response.totalPages;
    
    renderConversationList();
    updatePaginationUI();
  } catch (error) {
    showNotification(error.message || '加载对话列表失败', 'error');
  } finally {
    isLoading = false;
  }
}

// 渲染对话列表
function renderConversationList() {
  if (!conversationList) return;
  
  if (conversations.length === 0) {
    conversationList.innerHTML = '<div class="empty-state">暂无对话</div>';
    return;
  }
  
  conversationList.innerHTML = conversations.map(conv => `
    <div class="conversation-item ${conv._id === currentConversationId ? 'active' : ''}" data-id="${conv._id}">
      <div class="conversation-title">${conv.title}</div>
      <div class="conversation-date">${formatDate(conv.updatedAt)}</div>
    </div>
  `).join('');
  
  // 添加点击事件
  document.querySelectorAll('.conversation-item').forEach(item => {
    item.addEventListener('click', () => {
      const conversationId = item.getAttribute('data-id');
      loadConversation(conversationId);
    });
  });
}

// 加载对话内容
async function loadConversation(conversationId) {
  try {
    currentConversationId = conversationId;
    const conversation = await api.conversations.getConversation(conversationId);
    
    // 更新UI
    updateConversationUI(conversation);
    
    // 渲染消息
    renderMessages(conversation.messages || []);
    
    // 更新对话列表中的活动状态
    document.querySelectorAll('.conversation-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-id') === conversationId);
    });
  } catch (error) {
    showNotification(error.message || '加载对话失败', 'error');
  }
}

// 更新对话UI
function updateConversationUI(conversation) {
  if (chatTitle) {
    chatTitle.textContent = conversation.title;
  }
  
  // 隐藏欢迎消息
  if (welcomeMessage) {
    welcomeMessage.style.display = 'none';
  }
}

// 渲染消息
function renderMessages(messages) {
  if (!chatMessages) return;
  
  // 清空现有消息，但保留欢迎消息
  const welcomeMsg = chatMessages.querySelector('.welcome-message');
  chatMessages.innerHTML = '';
  
  if (welcomeMsg) {
    chatMessages.appendChild(welcomeMsg);
  }
  
  messages.forEach(message => {
    addMessageToUI(message);
  });
  
  // 滚动到底部
  scrollToBottom();
}

// 添加消息到UI
function addMessageToUI(message) {
  if (!chatMessages) return;
  
  const messageElement = document.createElement('div');
  messageElement.className = `message ${message.role}`;
  
  const avatar = message.role === 'user' ? 
    '<div class="message-avatar"><i class="fas fa-user"></i></div>' : 
    '<div class="message-avatar"><i class="fas fa-robot"></i></div>';
  
  const content = `
    <div class="message-content">
      <div class="message-text">${formatMessageContent(message.content)}</div>
      <div class="message-time">${formatTime(message.timestamp)}</div>
    </div>
  `;
  
  messageElement.innerHTML = avatar + content;
  chatMessages.appendChild(messageElement);
  
  // 滚动到底部
  scrollToBottom();
}

// 发送消息
async function sendMessage() {
  if (!chatInput || !sendBtn) return;
  
  const messageText = chatInput.value.trim();
  if (!messageText) return;
  
  // 如果没有当前对话，创建一个新对话
  if (!currentConversationId) {
    await createNewConversation();
  }
  
  // 禁用输入和发送按钮
  chatInput.disabled = true;
  sendBtn.disabled = true;
  
  // 添加用户消息到UI
  const userMessage = {
    role: 'user',
    content: messageText,
    timestamp: new Date()
  };
  addMessageToUI(userMessage);
  
  // 清空输入框
  chatInput.value = '';
  chatInput.style.height = 'auto';
  
  try {
    // 获取设置
    const settings = getSettings();
    
    // 发送消息到API
    const response = await api.gemini.generate(messageText, {
      model: settings.model,
      temperature: parseFloat(settings.temperature),
      maxTokens: parseInt(settings.maxTokens)
    });
    
    // 添加AI响应到UI
    const aiMessage = {
      role: 'assistant',
      content: response.text,
      timestamp: new Date()
    };
    addMessageToUI(aiMessage);
    
    // 保存消息到后端
    await api.conversations.addMessage(currentConversationId, userMessage);
    await api.conversations.addMessage(currentConversationId, aiMessage);
    
    // 更新对话列表
    await loadConversations();
  } catch (error) {
    showNotification(error.message || '发送消息失败', 'error');
    
    // 移除用户消息（如果发送失败）
    const lastMessage = chatMessages.lastElementChild;
    if (lastMessage && lastMessage.classList.contains('user')) {
      lastMessage.remove();
    }
  } finally {
    // 重新启用输入和发送按钮
    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatInput.focus();
  }
}

// 重命名当前对话
async function renameCurrentConversation() {
  if (!currentConversationId) return;
  
  const conversation = conversations.find(c => c._id === currentConversationId);
  if (!conversation) return;
  
  const newTitle = prompt('请输入新的对话标题:', conversation.title);
  if (!newTitle || newTitle.trim() === '') return;
  
  try {
    await api.conversations.updateConversationTitle(currentConversationId, newTitle.trim());
    await loadConversations();
    updateConversationUI({ ...conversation, title: newTitle.trim() });
    showNotification('对话标题已更新', 'success');
  } catch (error) {
    showNotification(error.message || '重命名失败', 'error');
  }
}

// 删除当前对话
async function deleteCurrentConversation() {
  if (!currentConversationId) return;
  
  if (!confirm('确定要删除这个对话吗？此操作不可撤销。')) return;
  
  try {
    await api.conversations.deleteConversation(currentConversationId);
    currentConversationId = null;
    await loadConversations();
    
    // 重置聊天界面
    if (chatTitle) {
      chatTitle.textContent = '新对话';
    }
    
    if (welcomeMessage) {
      welcomeMessage.style.display = 'block';
    }
    
    if (chatMessages) {
      const messages = chatMessages.querySelectorAll('.message');
      messages.forEach(msg => msg.remove());
    }
    
    showNotification('对话已删除', 'success');
  } catch (error) {
    showNotification(error.message || '删除对话失败', 'error');
  }
}

// 切换侧边栏
function toggleSidebar() {
  if (sidebar) {
    sidebar.classList.toggle('show');
  }
}

// 跳转到指定页面
async function goToPage(page) {
  if (page < 1 || page > totalPages || page === currentPage) return;
  
  await loadConversations(page);
}

// 更新分页UI
function updatePaginationUI() {
  if (pageInfo) {
    pageInfo.textContent = `${currentPage} / ${totalPages}`;
  }
  
  if (prevPageBtn) {
    prevPageBtn.disabled = currentPage <= 1;
  }
  
  if (nextPageBtn) {
    nextPageBtn.disabled = currentPage >= totalPages;
  }
}

// 滚动到底部
function scrollToBottom() {
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// 处理滚动
function handleScroll() {
  if (!chatMessages || !scrollToTopBtn) return;
  
  const { scrollTop, scrollHeight, clientHeight } = chatMessages;
  const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
  const isScrolled = scrollTop > 100;
  
  // 显示/隐藏回到顶部按钮
  scrollToTopBtn.style.display = isScrolled ? 'flex' : 'none';
}

// 回到顶部
function scrollToTop() {
  if (chatMessages) {
    chatMessages.scrollTop = 0;
  }
}

// 显示设置模态框
function showSettingsModal() {
  if (settingsModal) {
    settingsModal.classList.add('show');
    loadSettingsToUI();
  }
}

// 初始化主题
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.className = savedTheme === 'dark' ? 'dark-theme' : '';
  
  if (themeSelect) {
    themeSelect.value = savedTheme;
  }
}

// 初始化设置
function initSettings() {
  // 从localStorage加载设置
  const savedSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');
  
  // 应用设置
  applySettings(savedSettings);
}

// 加载设置到UI
function loadSettingsToUI() {
  const settings = getSettings();
  
  if (apiKeyInput) {
    apiKeyInput.value = settings.apiKey || '';
  }
  
  if (modelSelect) {
    modelSelect.value = settings.model || 'gemini-1.5-flash';
  }
  
  if (temperatureInput) {
    temperatureInput.value = settings.temperature || 0.7;
  }
  
  if (temperatureValue) {
    temperatureValue.textContent = settings.temperature || 0.7;
  }
  
  if (maxTokensInput) {
    maxTokensInput.value = settings.maxTokens || 2048;
  }
  
  if (themeSelect) {
    themeSelect.value = settings.theme || 'light';
  }
  
  if (fontSizeSelect) {
    fontSizeSelect.value = settings.fontSize || 'medium';
  }
  
  if (backgroundTypeSelect) {
    backgroundTypeSelect.value = settings.backgroundType || 'none';
    handleBackgroundTypeChange();
  }
}

// 获取设置
function getSettings() {
  return JSON.parse(localStorage.getItem('appSettings') || '{}');
}

// 保存设置
function saveSettings() {
  const settings = {
    apiKey: apiKeyInput ? apiKeyInput.value : '',
    model: modelSelect ? modelSelect.value : 'gemini-1.5-flash',
    temperature: temperatureInput ? parseFloat(temperatureInput.value) : 0.7,
    maxTokens: maxTokensInput ? parseInt(maxTokensInput.value) : 2048,
    theme: themeSelect ? themeSelect.value : 'light',
    fontSize: fontSizeSelect ? fontSizeSelect.value : 'medium',
    backgroundType: backgroundTypeSelect ? backgroundTypeSelect.value : 'none'
  };
  
  localStorage.setItem('appSettings', JSON.stringify(settings));
  applySettings(settings);
  
  if (settingsModal) {
    settingsModal.classList.remove('show');
  }
  
  showNotification('设置已保存', 'success');
}

// 重置设置
function resetSettings() {
  if (!confirm('确定要重置所有设置吗？')) return;
  
  localStorage.removeItem('appSettings');
  initSettings();
  loadSettingsToUI();
  showNotification('设置已重置', 'info');
}

// 应用设置
function applySettings(settings) {
  // 应用主题
  if (settings.theme === 'dark') {
    document.body.className = 'dark-theme';
  } else {
    document.body.className = '';
  }
  
  // 应用字体大小
  document.body.className += ` font-size-${settings.fontSize || 'medium'}`;
  
  // 应用背景
  applyBackground(settings.backgroundType || 'none', settings.backgroundImage);
}

// 处理背景类型变化
function handleBackgroundTypeChange() {
  if (!backgroundTypeSelect || !imageUploadGroup) return;
  
  const backgroundType = backgroundTypeSelect.value;
  imageUploadGroup.style.display = backgroundType === 'image' ? 'block' : 'none';
}

// 处理背景图片上传
function handleBackgroundImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(event) {
    const imageDataUrl = event.target.result;
    
    // 保存到localStorage
    const settings = getSettings();
    settings.backgroundImage = imageDataUrl;
    localStorage.setItem('appSettings', JSON.stringify(settings));
    
    // 应用背景
    applyBackground('image', imageDataUrl);
    
    // 显示预览
    if (imagePreview) {
      imagePreview.innerHTML = `<img src="${imageDataUrl}" alt="背景预览">`;
    }
  };
  
  reader.readAsDataURL(file);
}

// 应用背景
function applyBackground(type, imageData) {
  const body = document.body;
  
  // 移除所有背景类
  body.classList.remove('bg-gradient', 'bg-image');
  body.style.backgroundImage = '';
  
  switch (type) {
    case 'gradient':
      body.classList.add('bg-gradient');
      break;
    case 'image':
      if (imageData) {
        body.classList.add('bg-image');
        body.style.backgroundImage = `url(${imageData})`;
      }
      break;
  }
}

// 显示通知
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // 添加到通知容器
  const container = document.getElementById('notificationContainer');
  if (container) {
    container.appendChild(notification);
  } else {
    document.body.appendChild(notification);
  }
  
  // 显示通知
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // 自动隐藏通知
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// 格式化消息内容
function formatMessageContent(content) {
  // 简单的Markdown转HTML
  let formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
  
  return formatted;
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString();
  }
}

// 格式化时间
function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// 导出全局函数
window.showLoginModal = showLoginModal;
window.showNotification = showNotification;