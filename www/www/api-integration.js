// API集成脚本 - 连接前端与后端API
// 这个文件包含了所有与后端API交互的函数

// API基础URL
const API_BASE_URL = window.location.origin + '/api';

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

// 通用API请求函数
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
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
    const response = await fetch(url, finalOptions);
    
    // 处理401未授权错误
    if (response.status === 401) {
      clearAuthToken();
      window.location.href = '/login.html';
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
    const token = getAuthToken();
    const url = `${API_BASE_URL}/gemini/generate-stream`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt,
        ...options
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '请求失败');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // 处理SSE数据
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // 保留不完整的行
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (onChunk) onChunk(data);
              if (data.done) return data;
            } catch (e) {
              console.error('解析SSE数据错误:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
};

// 用户相关API
const userAPI = {
  // 获取用户信息
  async getProfile() {
    return apiRequest('/users/profile');
  },
  
  // 更新用户信息
  async updateProfile(userData) {
    return apiRequest('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },
  
  // 更新用户偏好设置
  async updatePreferences(preferences) {
    return apiRequest('/users/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
  },
  
  // 上传头像
  async uploadAvatar(file) {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await fetch(`${API_BASE_URL}/users/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '上传失败');
    }
    
    return response.json();
  },
  
  // 删除头像
  async deleteAvatar() {
    return apiRequest('/users/avatar', {
      method: 'DELETE',
    });
  },
  
  // 修改密码
  async changePassword(passwordData) {
    return apiRequest('/users/password', {
      method: 'PATCH',
      body: JSON.stringify(passwordData),
    });
  }
};

// 检查用户是否已登录
function isLoggedIn() {
  return !!getAuthToken();
}

// 初始化应用
async function initializeApp() {
  // 如果用户已登录，获取用户信息
  if (isLoggedIn()) {
    try {
      const userData = await authAPI.getCurrentUser();
      return userData.user;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      clearAuthToken();
      return null;
    }
  }
  
  return null;
}

// 导出API对象
// 初始化API
window.API = {
  auth: authAPI,
  conversation: conversationAPI,
  gemini: geminiAPI,
  user: userAPI,
  initializeApp,
  isLoggedIn,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  init: function(config = {}) {
    // 如果提供了配置，更新API基础URL
    if (config.baseUrl) {
      API_BASE_URL = config.baseUrl;
    }
    
    // 设置请求超时
    if (config.timeout) {
      REQUEST_TIMEOUT = config.timeout;
    }
    
    return this;
  }
};

// 导出API对象（用于Node.js环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.API;
}