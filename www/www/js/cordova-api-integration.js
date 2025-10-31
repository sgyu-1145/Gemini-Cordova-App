// Cordova API集成脚本 - 连接前端与后端API
// 这个文件包含了所有与后端API交互的函数，适配Cordova移动应用环境

// API基础URL - 在Cordova应用中需要配置为实际的服务器地址
// 注意：在Cordova应用中，不能使用相对路径，需要使用完整URL
const API_BASE_URL = 'http://localhost:3000/api'; // 请替换为您的实际服务器地址

// 请求超时时间（毫秒）
const REQUEST_TIMEOUT = 30000;

// 获取当前用户的认证令牌
function getAuthToken() {
  return localStorage.getItem('authToken');
}

// 设置认证令牌
function setAuthToken(token) {
  localStorage.setItem('authToken', token);
}

// 清除认证令牌
function clearAuthToken() {
  localStorage.removeItem('authToken');
}

// 检查网络连接状态
function checkNetworkConnection() {
  return new Promise((resolve, reject) => {
    if (navigator.connection) {
      const networkState = navigator.connection.type;
      if (networkState === 'none') {
        reject(new Error('无网络连接'));
        return;
      }
    }
    resolve();
  });
}

// 通用API请求函数
async function apiRequest(endpoint, options = {}) {
  // 检查网络连接
  try {
    await checkNetworkConnection();
  } catch (error) {
    showNotification('网络连接不可用，请检查您的网络设置', 'error');
    throw error;
  }
  
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: REQUEST_TIMEOUT,
  };
  
  // 如果有令牌，添加到请求头
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }
  
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  try {
    // 在Cordova中，可能需要使用cordova-plugin-file-transfer或cordova-plugin-advanced-http
    // 这里使用fetch API，如果遇到问题，可以考虑使用上述插件
    
    const response = await fetch(url, finalOptions);
    
    // 处理401未授权错误
    if (response.status === 401) {
      clearAuthToken();
      // 在Cordova应用中，不能直接重定向到登录页面，需要显示登录模态框
      if (typeof showLoginModal === 'function') {
        showLoginModal();
      }
      return;
    }
    
    // 解析响应
    const data = await response.json();
    
    // 检查响应是否成功
    if (!response.ok) {
      throw new Error(data.error || '请求失败');
    }
    
    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    
    // 在Cordova应用中显示友好的错误消息
    if (error.message === 'Failed to fetch') {
      showNotification('无法连接到服务器，请检查网络连接', 'error');
    } else {
      showNotification(error.message || '请求失败', 'error');
    }
    
    throw error;
  }
}

// 认证相关API
const authAPI = {
  // 用户注册
  async register(userData) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  // 用户登录
  async login(credentials) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (data.token) {
      setAuthToken(data.token);
    }
    
    return data;
  },
  
  // 获取当前用户信息
  async getCurrentUser() {
    return apiRequest('/auth/me');
  },
  
  // 刷新令牌
  async refreshToken() {
    const data = await apiRequest('/auth/refresh', {
      method: 'POST',
    });
    
    if (data.token) {
      setAuthToken(data.token);
    }
    
    return data;
  },
  
  // 用户登出
  async logout() {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
      });
    } finally {
      clearAuthToken();
    }
  }
};

// 对话相关API
const conversationAPI = {
  // 获取对话列表
  async getConversations(page = 1, limit = 20, archived = false) {
    return apiRequest(`/conversations?page=${page}&limit=${limit}&archived=${archived}`);
  },
  
  // 获取特定对话
  async getConversation(id) {
    return apiRequest(`/conversations/${id}`);
  },
  
  // 创建新对话
  async createConversation(conversationData) {
    return apiRequest('/conversations', {
      method: 'POST',
      body: JSON.stringify(conversationData),
    });
  },
  
  // 更新对话标题
  async updateConversationTitle(id, title) {
    return apiRequest(`/conversations/${id}/title`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  },
  
  // 添加消息到对话
  async addMessage(id, messageData) {
    return apiRequest(`/conversations/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },
  
  // 归档/取消归档对话
  async toggleArchiveConversation(id, archive = true) {
    return apiRequest(`/conversations/${id}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ archive }),
    });
  },
  
  // 删除对话
  async deleteConversation(id) {
    return apiRequest(`/conversations/${id}`, {
      method: 'DELETE',
    });
  },
  
  // 批量删除对话
  async deleteConversations(conversationIds) {
    return apiRequest('/conversations', {
      method: 'DELETE',
      body: JSON.stringify({ conversationIds }),
    });
  }
};

// Gemini AI相关API
const geminiAPI = {
  // 获取可用模型列表
  async getModels() {
    return apiRequest('/gemini/models');
  },
  
  // 生成AI响应
  async generate(prompt, options = {}) {
    return apiRequest('/gemini/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        ...options
      }),
    });
  },
  
  // 流式生成AI响应
  async generateStream(prompt, options = {}, onChunk) {
    // 在Cordova中实现流式响应比较复杂，这里简化为普通请求
    // 如果需要真正的流式响应，可以考虑使用WebSocket
    const response = await apiRequest('/gemini/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        stream: true,
        ...options
      }),
    });
    
    if (onChunk && typeof onChunk === 'function') {
      // 模拟流式响应
      const chunks = response.text.split(' ');
      for (let i = 0; i < chunks.length; i++) {
        onChunk(chunks[i] + (i < chunks.length - 1 ? ' ' : ''));
        await new Promise(resolve => setTimeout(resolve, 50)); // 模拟延迟
      }
    }
    
    return response;
  }
};

// 用户设置相关API
const settingsAPI = {
  // 获取用户设置
  async getUserSettings() {
    return apiRequest('/users/settings');
  },
  
  // 更新用户设置
  async updateUserSettings(settings) {
    return apiRequest('/users/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },
  
  // 上传头像
  async uploadAvatar(file) {
    // 在Cordova中，文件上传需要特殊处理
    const formData = new FormData();
    formData.append('avatar', file);
    
    return apiRequest('/users/avatar', {
      method: 'POST',
      body: formData,
      headers: {}, // 让浏览器自动设置Content-Type为multipart/form-data
    });
  }
};

// Cordova应用初始化函数
function initCordovaApp() {
  // 等待设备准备就绪
  document.addEventListener('deviceready', function() {
    console.log('设备准备就绪');
    
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
      // 如果有模态框打开，关闭模态框
      const openModal = document.querySelector('.modal.show');
      if (openModal) {
        openModal.classList.remove('show');
        return;
      }
      
      // 如果侧边栏打开，关闭侧边栏
      const sidebar = document.getElementById('sidebar');
      if (sidebar && sidebar.classList.contains('show')) {
        sidebar.classList.remove('show');
        return;
      }
      
      // 默认行为：退出应用
      if (confirm('确定要退出应用吗？')) {
        navigator.app.exitApp();
      }
    });
  });
}

// 显示通知函数（如果script.js中未定义）
function showNotification(message, type = 'info') {
  // 如果script.js中已定义showNotification函数，则使用它
  if (typeof window.showNotification === 'function') {
    window.showNotification(message, type);
    return;
  }
  
  // 否则，实现一个简单的通知
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
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

// 初始化Cordova应用
if (window.cordova) {
  initCordovaApp();
}

// 导出API对象
window.api = {
  auth: authAPI,
  conversations: conversationAPI,
  gemini: geminiAPI,
  settings: settingsAPI
};