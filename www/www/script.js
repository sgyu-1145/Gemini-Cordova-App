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
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const settingsBtn = document.getElementById('settingsBtn');
const logoutBtn = document.getElementById('logoutBtn');
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
const welcomeMessage = document.querySelector('.welcome-message');
const chatContainer = document.querySelector('.chat-container');
const chatHeader = document.querySelector('.chat-header');
const chatTitle = document.querySelector('.chat-title');
const paginationInfo = document.querySelector('.pagination-info');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageNumbers = document.getElementById('pageNumbers');
const saveConversationBtn = document.getElementById('saveConversationBtn');
const deleteConversationBtn = document.getElementById('deleteConversationBtn');
const jumpToPageBtn = document.getElementById('jumpToPageBtn');
const jumpToPageInput = document.getElementById('jumpToPageInput');
const jumpToPageModal = document.getElementById('jumpToPageModal');
const jumpToPageConfirmBtn = document.getElementById('jumpToPageConfirmBtn');
const jumpToPageCancelBtn = document.getElementById('jumpToPageCancelBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginLink = document.getElementById('loginLink');
const registerLink = document.getElementById('registerLink');
const userProfile = document.getElementById('userProfile');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const darkModeToggle = document.getElementById('darkModeToggle');
const temperatureSlider = document.getElementById('temperatureSlider');
const temperatureValue = document.getElementById('temperatureValue');
const maxTokensSlider = document.getElementById('maxTokensSlider');
const maxTokensValue = document.getElementById('maxTokensValue');
const topPSlider = document.getElementById('topPSlider');
const topPValue = document.getElementById('topPValue');
const imageSelector = document.getElementById('imageSelector');
const addImageBtn = document.getElementById('addImageBtn');
const backgroundImages = document.getElementById('backgroundImages');

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  // 初始化API
  API.init();
  
  // 检查用户登录状态
  checkAuthStatus();
  
  // 设置事件监听器
  setupEventListeners();
  
  // 初始化主题
  initTheme();
  
  // 初始化背景图片
  initBackgroundImages();
  
  // 初始化设置
  initSettings();
});

// 检查用户认证状态
async function checkAuthStatus() {
  try {
    const token = localStorage.getItem('authToken');
    if (token) {
      const user = await API.auth.getCurrentUser();
      if (user) {
        currentUser = user;
        updateUserUI();
        await loadConversations();
        showChatInterface();
        return;
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
    userName.textContent = currentUser.username;
    if (currentUser.avatar) {
      userAvatar.src = currentUser.avatar;
    }
    userProfile.style.display = 'flex';
    logoutBtn.style.display = 'block';
  } else {
    userProfile.style.display = 'none';
    logoutBtn.style.display = 'none';
  }
}

// 显示聊天界面
function showChatInterface() {
  loginModal.classList.remove('active');
  registerModal.classList.remove('active');
  appContainer.style.display = 'flex';
}

// 显示登录模态框
function showLoginModal() {
  appContainer.style.display = 'none';
  loginModal.classList.add('active');
  registerModal.classList.remove('active');
}

// 显示注册模态框
function showRegisterModal() {
  appContainer.style.display = 'none';
  loginModal.classList.remove('active');
  registerModal.classList.add('active');
}

// 设置事件监听器
function setupEventListeners() {
  // 认证相关
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (registerForm) registerForm.addEventListener('submit', handleRegister);
  if (loginLink) loginLink.addEventListener('click', showLoginModal);
  if (registerLink) registerLink.addEventListener('click', showRegisterModal);
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  
  // 聊天相关
  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (messageInput) messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // 新建对话
  if (newChatBtn) newChatBtn.addEventListener('click', createNewConversation);
  
  // 设置相关
  if (settingsBtn) settingsBtn.addEventListener('click', showSettingsModal);
  if (darkModeToggle) darkModeToggle.addEventListener('change', toggleDarkMode);
  if (temperatureSlider) temperatureSlider.addEventListener('input', updateTemperatureValue);
  if (maxTokensSlider) maxTokensSlider.addEventListener('input', updateMaxTokensValue);
  if (topPSlider) topPSlider.addEventListener('input', updateTopPValue);
  if (addImageBtn) addImageBtn.addEventListener('click', addBackgroundImage);
  
  // 分页相关
  if (prevPageBtn) prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
  if (nextPageBtn) nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
  if (saveConversationBtn) saveConversationBtn.addEventListener('click', saveCurrentConversation);
  if (deleteConversationBtn) deleteConversationBtn.addEventListener('click', deleteCurrentConversation);
  if (jumpToPageBtn) jumpToPageBtn.addEventListener('click', showJumpToPageModal);
  if (jumpToPageConfirmBtn) jumpToPageConfirmBtn.addEventListener('click', jumpToPage);
  if (jumpToPageCancelBtn) jumpToPageCancelBtn.addEventListener('click', hideJumpToPageModal);
  if (jumpToPageInput) jumpToPageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      jumpToPage();
    }
  });
  
  // 回到顶部
  if (scrollToTopBtn) scrollToTopBtn.addEventListener('click', scrollToTop);
  if (chatMessages) chatMessages.addEventListener('scroll', handleScroll);
  
  // 模态框关闭按钮
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal')?.classList.remove('active');
    });
  });
  
  // 点击模态框外部关闭
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
  
  // 建议问题点击
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      if (messageInput) {
        messageInput.value = chip.textContent;
        messageInput.focus();
      }
    });
  });
}

// 处理登录
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await API.auth.login({ email, password });
    if (response.success) {
      localStorage.setItem('authToken', response.token);
      currentUser = response.user;
      updateUserUI();
      await loadConversations();
      showChatInterface();
      showNotification('登录成功', 'success');
    } else {
      showNotification(response.message || '登录失败', 'error');
    }
  } catch (error) {
    console.error('登录错误:', error);
    showNotification('登录失败，请检查网络连接', 'error');
  }
}

// 处理注册
async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  
  if (password !== confirmPassword) {
    showNotification('两次输入的密码不一致', 'error');
    return;
  }
  
  try {
    const response = await API.auth.register({ username, email, password });
    if (response.success) {
      localStorage.setItem('authToken', response.token);
      currentUser = response.user;
      updateUserUI();
      await loadConversations();
      showChatInterface();
      showNotification('注册成功', 'success');
    } else {
      showNotification(response.message || '注册失败', 'error');
    }
  } catch (error) {
    console.error('注册错误:', error);
    showNotification('注册失败，请检查网络连接', 'error');
  }
}

// 处理登出
async function handleLogout() {
  try {
    await API.auth.logout();
  } catch (error) {
    console.error('登出错误:', error);
  } finally {
    localStorage.removeItem('authToken');
    currentUser = null;
    currentConversationId = null;
    conversations = [];
    updateUserUI();
    showLoginModal();
  }
}

// 加载对话列表
async function loadConversations(page = 1) {
  if (!currentUser) return;
  
  try {
    isLoading = true;
    const response = await API.conversations.getConversations(page);
    
    if (response.success) {
      conversations = response.conversations;
      currentPage = response.currentPage;
      totalPages = response.totalPages;
      
      renderConversationList();
      updatePagination();
      
      // 如果有当前对话ID，加载该对话
      if (currentConversationId) {
        loadConversation(currentConversationId);
      } else if (conversations.length > 0) {
        // 否则加载第一个对话
        loadConversation(conversations[0]._id);
      } else {
        // 如果没有对话，显示欢迎消息
        showWelcomeMessage();
      }
    } else {
      showNotification(response.message || '加载对话失败', 'error');
    }
  } catch (error) {
    console.error('加载对话错误:', error);
    showNotification('加载对话失败，请检查网络连接', 'error');
  } finally {
    isLoading = false;
  }
}

// 渲染对话列表
function renderConversationList() {
  conversationList.innerHTML = '';
  
  conversations.forEach(conversation => {
    const conversationItem = document.createElement('div');
    conversationItem.className = `conversation-item ${conversation._id === currentConversationId ? 'active' : ''}`;
    conversationItem.dataset.id = conversation._id;
    
    const conversationTitle = document.createElement('div');
    conversationTitle.className = 'conversation-title';
    conversationTitle.textContent = conversation.title || '新对话';
    
    const conversationTime = document.createElement('div');
    conversationTime.className = 'conversation-time';
    conversationTime.textContent = formatTime(conversation.updatedAt);
    
    const conversationActions = document.createElement('div');
    conversationActions.className = 'conversation-actions';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-icon';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteConversation(conversation._id);
    });
    
    conversationActions.appendChild(deleteBtn);
    conversationItem.appendChild(conversationTitle);
    conversationItem.appendChild(conversationTime);
    conversationItem.appendChild(conversationActions);
    
    conversationItem.addEventListener('click', () => {
      loadConversation(conversation._id);
    });
    
    conversationList.appendChild(conversationItem);
  });
}

// 加载对话
async function loadConversation(conversationId) {
  if (!conversationId) return;
  
  try {
    const response = await API.conversations.getConversation(conversationId);
    
    if (response.success) {
      currentConversationId = conversationId;
      messageHistory = response.conversation.messages || [];
      
      // 更新UI
      updateConversationUI(response.conversation);
      renderMessages();
      
      // 更新对话列表中的活动状态
      document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === conversationId);
      });
      
      // 滚动到底部
      scrollToBottom();
    } else {
      showNotification(response.message || '加载对话失败', 'error');
    }
  } catch (error) {
    console.error('加载对话错误:', error);
    showNotification('加载对话失败，请检查网络连接', 'error');
  }
}

// 更新对话UI
function updateConversationUI(conversation) {
  chatTitle.textContent = conversation.title || '新对话';
  welcomeMessage.style.display = 'none';
  chatHeader.style.display = 'flex';
  chatMessages.style.display = 'flex';
}

// 渲染消息
function renderMessages() {
  chatMessages.innerHTML = '';
  
  messageHistory.forEach((message, index) => {
    const messageElement = createMessageElement(message);
    chatMessages.appendChild(messageElement);
  });
}

// 创建消息元素
function createMessageElement(message) {
  const messageContainer = document.createElement('div');
  messageContainer.className = `message ${message.role}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.innerHTML = message.role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
  
  const content = document.createElement('div');
  content.className = 'message-content';
  
  // 处理消息内容，支持Markdown渲染
  if (message.content) {
    // 简单的Markdown处理
    let htmlContent = message.content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
    
    // 处理表格
    htmlContent = htmlContent.replace(/\|(.+)\|/g, (match, content) => {
      const cells = content.split('|').map(cell => cell.trim());
      const isHeader = cells.every(cell => /^-+$/.test(cell));
      
      if (isHeader) return match; // 跳过分隔行
      
      const cellTags = cells.map(cell => `<td>${cell}</td>`).join('');
      return `<tr>${cellTags}</tr>`;
    });
    
    // 如果包含表格行，包装在表格标签中
    if (htmlContent.includes('<tr>')) {
      htmlContent = `<table>${htmlContent}</table>`;
    }
    
    content.innerHTML = htmlContent;
  }
  
  messageContainer.appendChild(avatar);
  messageContainer.appendChild(content);
  
  return messageContainer;
}

// 发送消息
async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message || !currentConversationId || isLoading) return;
  
  // 添加用户消息到UI
  const userMessage = { role: 'user', content: message };
  messageHistory.push(userMessage);
  renderMessages();
  
  // 清空输入框
  messageInput.value = '';
  
  // 显示加载指示器
  showLoadingIndicator();
  
  try {
    isLoading = true;
    
    // 获取当前设置
    const settings = getCurrentSettings();
    
    // 发送消息到API
    const response = await API.gemini.generateText({
      messages: messageHistory,
      ...settings
    });
    
    if (response.success) {
      // 添加AI回复到历史记录
      const assistantMessage = { role: 'assistant', content: response.response };
      messageHistory.push(assistantMessage);
      
      // 更新UI
      renderMessages();
      
      // 保存对话
      await saveConversationToServer();
      
      // 滚动到底部
      scrollToBottom();
    } else {
      showNotification(response.message || '发送消息失败', 'error');
      // 移除用户消息，因为发送失败
      messageHistory.pop();
      renderMessages();
    }
  } catch (error) {
    console.error('发送消息错误:', error);
    showNotification('发送消息失败，请检查网络连接', 'error');
    // 移除用户消息，因为发送失败
    messageHistory.pop();
    renderMessages();
  } finally {
    isLoading = false;
    hideLoadingIndicator();
  }
}

// 显示加载指示器
function showLoadingIndicator() {
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'message assistant loading-indicator';
  loadingIndicator.id = 'loadingIndicator';
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.innerHTML = '<i class="fas fa-robot"></i>';
  
  const content = document.createElement('div');
  content.className = 'message-content';
  content.innerHTML = `
    <div class="loading-dots">
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
      <div class="loading-dot"></div>
    </div>
    <span>AI正在思考中...</span>
  `;
  
  loadingIndicator.appendChild(avatar);
  loadingIndicator.appendChild(content);
  
  chatMessages.appendChild(loadingIndicator);
  scrollToBottom();
}

// 隐藏加载指示器
function hideLoadingIndicator() {
  const loadingIndicator = document.getElementById('loadingIndicator');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

// 创建新对话
async function createNewConversation() {
  try {
    const response = await API.conversations.createConversation({
      title: '新对话',
      messages: []
    });
    
    if (response.success) {
      currentConversationId = response.conversation._id;
      messageHistory = [];
      
      // 重新加载对话列表
      await loadConversations();
      
      // 显示欢迎消息
      showWelcomeMessage();
    } else {
      showNotification(response.message || '创建对话失败', 'error');
    }
  } catch (error) {
    console.error('创建对话错误:', error);
    showNotification('创建对话失败，请检查网络连接', 'error');
  }
}

// 保存当前对话
async function saveCurrentConversation() {
  if (!currentConversationId) return;
  
  try {
    const title = prompt('请输入对话标题:');
    if (!title) return;
    
    const response = await API.conversations.updateConversation(currentConversationId, {
      title,
      messages: messageHistory
    });
    
    if (response.success) {
      showNotification('对话保存成功', 'success');
      await loadConversations(); // 重新加载对话列表
    } else {
      showNotification(response.message || '保存对话失败', 'error');
    }
  } catch (error) {
    console.error('保存对话错误:', error);
    showNotification('保存对话失败，请检查网络连接', 'error');
  }
}

// 删除当前对话
async function deleteCurrentConversation() {
  if (!currentConversationId) return;
  
  if (!confirm('确定要删除这个对话吗？此操作不可恢复。')) return;
  
  try {
    const response = await API.conversations.deleteConversation(currentConversationId);
    
    if (response.success) {
      showNotification('对话删除成功', 'success');
      currentConversationId = null;
      messageHistory = [];
      await loadConversations();
      showWelcomeMessage();
    } else {
      showNotification(response.message || '删除对话失败', 'error');
    }
  } catch (error) {
    console.error('删除对话错误:', error);
    showNotification('删除对话失败，请检查网络连接', 'error');
  }
}

// 删除对话
async function deleteConversation(conversationId) {
  if (!conversationId) return;
  
  if (!confirm('确定要删除这个对话吗？此操作不可恢复。')) return;
  
  try {
    const response = await API.conversations.deleteConversation(conversationId);
    
    if (response.success) {
      showNotification('对话删除成功', 'success');
      
      // 如果删除的是当前对话，清空当前对话
      if (conversationId === currentConversationId) {
        currentConversationId = null;
        messageHistory = [];
        showWelcomeMessage();
      }
      
      await loadConversations();
    } else {
      showNotification(response.message || '删除对话失败', 'error');
    }
  } catch (error) {
    console.error('删除对话错误:', error);
    showNotification('删除对话失败，请检查网络连接', 'error');
  }
}

// 保存对话到服务器
async function saveConversationToServer() {
  if (!currentConversationId || !currentUser) return;
  
  try {
    await API.conversations.updateConversation(currentConversationId, {
      messages: messageHistory
    });
  } catch (error) {
    console.error('保存对话到服务器错误:', error);
  }
}

// 显示欢迎消息
function showWelcomeMessage() {
  welcomeMessage.style.display = 'flex';
  chatHeader.style.display = 'none';
  chatMessages.style.display = 'none';
  chatTitle.textContent = '';
}

// 分页相关函数
function updatePagination() {
  // 更新分页信息
  paginationInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页`;
  
  // 更新按钮状态
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;
  
  // 更新页码按钮
  pageNumbers.innerHTML = '';
  
  // 计算要显示的页码范围
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }
  
  // 添加第一页和省略号
  if (startPage > 1) {
    addPageButton(1);
    if (startPage > 2) {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '...';
      pageNumbers.appendChild(ellipsis);
    }
  }
  
  // 添加页码按钮
  for (let i = startPage; i <= endPage; i++) {
    addPageButton(i);
  }
  
  // 添加省略号和最后一页
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '...';
      pageNumbers.appendChild(ellipsis);
    }
    addPageButton(totalPages);
  }
}

function addPageButton(pageNum) {
  const pageBtn = document.createElement('button');
  pageBtn.className = `pagination-btn ${pageNum === currentPage ? 'active' : ''}`;
  pageBtn.textContent = pageNum;
  pageBtn.addEventListener('click', () => goToPage(pageNum));
  pageNumbers.appendChild(pageBtn);
}

function goToPage(page) {
  if (page < 1 || page > totalPages || page === currentPage) return;
  loadConversations(page);
}

function showJumpToPageModal() {
  jumpToPageModal.classList.add('active');
  jumpToPageInput.value = '';
  jumpToPageInput.focus();
}

function hideJumpToPageModal() {
  jumpToPageModal.classList.remove('active');
}

function jumpToPage() {
  const page = parseInt(jumpToPageInput.value, 10);
  if (isNaN(page) || page < 1 || page > totalPages) {
    showNotification(`请输入1到${totalPages}之间的页码`, 'error');
    return;
  }
  
  hideJumpToPageModal();
  goToPage(page);
}

// 设置相关函数
function showSettingsModal() {
  settingsModal.classList.add('active');
  loadSettings();
}

function loadSettings() {
  // 加载用户设置
  if (currentUser && currentUser.preferences) {
    const { theme, temperature, maxTokens, topP, backgroundImages } = currentUser.preferences;
    
    if (darkModeToggle) darkModeToggle.checked = theme === 'dark';
    if (temperatureSlider) temperatureSlider.value = temperature || 0.7;
    if (maxTokensSlider) maxTokensSlider.value = maxTokens || 1024;
    if (topPSlider) topPSlider.value = topP || 0.9;
    
    updateTemperatureValue();
    updateMaxTokensValue();
    updateTopPValue();
    
    if (backgroundImages && backgroundImages.length > 0) {
      renderBackgroundImages(backgroundImages);
    }
  }
}

function toggleDarkMode() {
  if (!darkModeToggle) return;
  
  const isDarkMode = darkModeToggle.checked;
  document.body.classList.toggle('dark-theme', isDarkMode);
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  
  // 保存用户设置
  saveUserSettings();
}

function initSettings() {
  // 初始化设置值显示
  updateTemperatureValue();
  updateMaxTokensValue();
  updateTopPValue();
}

function updateTemperatureValue() {
  if (temperatureSlider && temperatureValue) {
    temperatureValue.textContent = temperatureSlider.value;
  }
}

function updateMaxTokensValue() {
  if (maxTokensSlider && maxTokensValue) {
    maxTokensValue.textContent = maxTokensSlider.value;
  }
}

function updateTopPValue() {
  if (topPSlider && topPValue) {
    topPValue.textContent = topPSlider.value;
  }
}

function getCurrentSettings() {
  return {
    temperature: temperatureSlider ? parseFloat(temperatureSlider.value) : 0.7,
    maxTokens: maxTokensSlider ? parseInt(maxTokensSlider.value, 10) : 1024,
    topP: topPSlider ? parseFloat(topPSlider.value) : 0.9
  };
}

// 主题相关函数
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.classList.toggle('dark-theme', savedTheme === 'dark');
  if (darkModeToggle) {
    darkModeToggle.checked = savedTheme === 'dark';
  }
}

function toggleDarkMode() {
  const isDarkMode = darkModeToggle.checked;
  document.body.classList.toggle('dark-theme', isDarkMode);
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  
  // 保存用户设置
  saveUserSettings();
}

// 背景图片相关函数
function initBackgroundImages() {
  // 从localStorage加载背景图片
  const savedImages = localStorage.getItem('backgroundImages');
  if (savedImages) {
    try {
      const images = JSON.parse(savedImages);
      renderBackgroundImages(images);
    } catch (error) {
      console.error('加载背景图片错误:', error);
    }
  }
}

function renderBackgroundImages(images) {
  backgroundImages.innerHTML = '';
  
  images.forEach((image, index) => {
    const imageOption = document.createElement('div');
    imageOption.className = 'image-option';
    imageOption.dataset.index = index;
    
    const img = document.createElement('img');
    img.src = image.url;
    img.alt = `背景图片 ${index + 1}`;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.addEventListener('click', () => removeBackgroundImage(index));
    
    imageOption.appendChild(img);
    imageOption.appendChild(removeBtn);
    
    imageOption.addEventListener('click', (e) => {
      if (e.target !== removeBtn) {
        selectBackgroundImage(index);
      }
    });
    
    backgroundImages.appendChild(imageOption);
  });
}

function addBackgroundImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const newImage = {
        url: event.target.result,
        name: file.name
      };
      
      const savedImages = localStorage.getItem('backgroundImages');
      let images = savedImages ? JSON.parse(savedImages) : [];
      images.push(newImage);
      
      localStorage.setItem('backgroundImages', JSON.stringify(images));
      renderBackgroundImages(images);
      
      // 保存用户设置
      saveUserSettings();
    };
    
    reader.readAsDataURL(file);
  });
  
  input.click();
}

function removeBackgroundImage(index) {
  const savedImages = localStorage.getItem('backgroundImages');
  let images = savedImages ? JSON.parse(savedImages) : [];
  
  if (index >= 0 && index < images.length) {
    images.splice(index, 1);
    localStorage.setItem('backgroundImages', JSON.stringify(images));
    renderBackgroundImages(images);
    
    // 保存用户设置
    saveUserSettings();
  }
}

function selectBackgroundImage(index) {
  const savedImages = localStorage.getItem('backgroundImages');
  const images = savedImages ? JSON.parse(savedImages) : [];
  
  if (index >= 0 && index < images.length) {
    // 更新选中状态
    document.querySelectorAll('.image-option').forEach((option, i) => {
      option.classList.toggle('selected', i === index);
    });
    
    // 应用背景图片
    document.body.style.backgroundImage = `url(${images[index].url})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
    
    // 保存选中的背景图片
    localStorage.setItem('selectedBackgroundImage', index.toString());
    
    // 保存用户设置
    saveUserSettings();
  }
}

function saveUserSettings() {
  if (!currentUser) return;
  
  const savedImages = localStorage.getItem('backgroundImages');
  const selectedBackgroundImage = localStorage.getItem('selectedBackgroundImage');
  const theme = localStorage.getItem('theme');
  
  const preferences = {
    theme,
    temperature: temperatureSlider ? parseFloat(temperatureSlider.value) : 0.7,
    maxTokens: maxTokensSlider ? parseInt(maxTokensSlider.value, 10) : 1024,
    topP: topPSlider ? parseFloat(topPSlider.value) : 0.9,
    backgroundImages: savedImages ? JSON.parse(savedImages) : [],
    selectedBackgroundImage: selectedBackgroundImage ? parseInt(selectedBackgroundImage, 10) : -1
  };
  
  API.users.updatePreferences(preferences).catch(error => {
    console.error('保存用户设置错误:', error);
  });
}

// 滚动相关函数
function scrollToTop() {
  if (chatMessages) {
    chatMessages.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}

function scrollToBottom() {
  if (chatMessages) {
    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: 'smooth'
    });
  }
}

function handleScroll() {
  if (chatMessages) {
    const scrollTop = chatMessages.scrollTop;
    
    // 显示/隐藏回到顶部按钮
    if (scrollToTopBtn) {
      if (scrollTop > 200) {
        scrollToTopBtn.classList.add('visible');
      } else {
        scrollToTopBtn.classList.remove('visible');
      }
    }
  }
}

// 工具函数
function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) {
    return '刚刚';
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString();
  }
}

function showNotification(message, type = 'info') {
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // 添加到页面
  document.body.appendChild(notification);
  
  // 显示通知
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // 3秒后隐藏通知
  setTimeout(() => {
    notification.classList.remove('show');
    
    // 动画结束后移除元素
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}