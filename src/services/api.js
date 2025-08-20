import axios from 'axios';

// 动态确定API基础URL
const getBaseURL = () => {
  if (process.env.NODE_ENV === 'production') {
    // 生产环境使用Workers API
    return process.env.REACT_APP_API_URL || 'https://dongshihui-api.jieshu2023.workers.dev';
  } else {
    // 开发环境也使用Workers API（本地服务器已停止）
    return process.env.REACT_APP_API_URL || 'https://dongshihui-api.jieshu2023.workers.dev';
  }
};

// API重试配置
const retryConfig = {
  retries: 3,
  retryDelay: (retryCount) => Math.min(1000 * Math.pow(2, retryCount), 5000), // 指数退避
  retryCondition: (error) => {
    // 重试条件：网络错误、503服务不可用、超时等
    return !error.response || 
           error.response.status === 503 || 
           error.response.status >= 500 ||
           error.code === 'ECONNABORTED' ||
           error.code === 'NETWORK_ERROR';
  }
};

// 创建axios实例
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 20000, // 增加超时时间适应503错误恢复
  headers: {
    'Content-Type': 'application/json',
    // 移除Cache-Control头避免CORS问题
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 API请求: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API请求错误:', error);
    return Promise.reject(error);
  }
);

// API重试函数
const retryRequest = async (config, retryCount = 0) => {
  try {
    const response = await api.request(config);
    console.log(`✅ API响应: ${config.url}`, response.data);
    return response;
  } catch (error) {
    console.error(`❌ API响应错误 (尝试 ${retryCount + 1}/${retryConfig.retries + 1}):`, error.response?.data || error.message);
    
    // 检查是否应该重试
    if (retryCount < retryConfig.retries && retryConfig.retryCondition(error)) {
      const delay = retryConfig.retryDelay(retryCount);
      console.warn(`⏱️ ${delay}ms 后重试...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(config, retryCount + 1);
    }
    
    // 处理特定错误状态
    if (error.response?.status === 400) {
      // 400错误：请求参数错误或业务逻辑错误
      const errorMsg = error.response?.data?.error || error.response?.data?.message || '请求参数错误';
      throw new Error(errorMsg);
    } else if (error.response?.status === 503) {
      throw new Error('服务暂时不可用，请稍后重试');
    } else if (error.response?.status === 404) {
      throw new Error('API端点不存在');
    } else if (error.response?.status >= 500) {
      throw new Error('服务器内部错误，请稍后重试');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('无法连接到服务器');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('请求超时，请检查网络连接');
    }
    
    throw error;
  }
};

// 响应拦截器 - 使用重试机制
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API响应: ${response.config.url}`, response.data);
    return response;
  },
  async (error) => {
    const config = error.config;
    
    // 避免重复重试已经标记的请求
    if (config._retry) {
      throw error;
    }
    
    config._retry = true;
    
    // 检查是否应该重试
    if (retryConfig.retryCondition(error)) {
      console.warn('🔄 触发API重试机制...');
      return retryRequest(config);
    }
    
    throw error;
  }
);

// 董事相关API
export const directorAPI = {
  // 获取所有董事
  getAll: (params = {}) => {
    return api.get('/directors', { params });
  },

  // 获取单个董事
  getById: (id) => {
    return api.get(`/directors/${id}`);
  },

  // 创建董事
  create: (data) => {
    return api.post('/directors', data);
  },

  // 更新董事
  update: (id, data) => {
    return api.put(`/directors/${id}`, data);
  },

  // 删除董事
  delete: (id) => {
    return api.delete(`/directors/${id}`);
  },

  // 获取活跃董事列表
  getActive: () => {
    return api.get('/directors/active/list');
  },

  // 解析人设提示词
  parsePrompt: (systemPrompt) => {
    return api.post('/directors/parse-prompt', { 
      system_prompt: systemPrompt 
    });
  },

  // 智能创建董事
  createFromPrompt: (systemPrompt, avatarUrl = null) => {
    return api.post('/directors/create-from-prompt', {
      system_prompt: systemPrompt,
      avatar_url: avatarUrl
    });
  },

  // 获取董事统计
  getStats: (id) => {
    return api.get(`/directors/${id}/stats`);
  },

  // 批量更新状态
  batchUpdateStatus: (directorIds, status, isActive) => {
    return api.patch('/directors/batch-status', {
      director_ids: directorIds,
      status,
      is_active: isActive
    });
  },

  // 重新解析董事人设
  reparseDirector: (id) => {
    return api.post(`/directors/${id}/reparse`);
  },

  // 获取董事组合列表
  getGroups: (userId = 'default_user') => {
    return api.get(`/director-groups`, { params: { user_id: userId } });
  },

  // 获取董事组合详情
  getGroupById: (id) => {
    return api.get(`/director-groups/${id}`);
  },

  // 创建董事组合
  createGroup: (data) => {
    return api.post('/director-groups', data);
  },

  // 删除董事组合
  deleteGroup: (id, userId = 'default_user') => {
    return api.delete(`/director-groups/${id}`, { params: { user_id: userId } });
  }
};

// 会议相关API
export const meetingAPI = {
  // 获取所有会议
  getAll: (params = {}) => {
    return api.get('/meetings', { params });
  },

  // 创建会议
  create: (data) => {
    return api.post('/meetings', data);
  },

  // 获取会议详情
  getById: (id) => {
    return api.get(`/meetings/${id}`);
  },

  // 开始会议
  start: (id) => {
    return api.post(`/meetings/${id}/start`);
  },

  // 暂停会议
  pause: (id) => {
    return api.post(`/meetings/${id}/pause`);
  },

  // 结束会议
  finish: (id) => {
    return api.post(`/meetings/${id}/finish`);
  },

  // 恢复会议
  resume: (id) => {
    return api.post(`/meetings/${id}/resume`);
  },

  // 生成下一个发言
  generateNextStatement: (id, data = {}) => {
    return api.post(`/meetings/${id}/next-statement`, data);
  },

  // 获取会议发言记录
  getStatements: (id, params = {}) => {
    return api.get(`/meetings/${id}/statements`, { params });
  },

  // 获取会议统计
  getStats: (id) => {
    return api.get(`/meetings/${id}/stats`);
  },

  // 添加参与者
  addParticipants: (id, data) => {
    return api.post(`/meetings/${id}/participants`, data);
  },

  // 删除会议
  delete: (id) => {
    return api.delete(`/meetings/${id}`);
  },

  // 从董事组合创建会议
  createFromGroup: (groupId, data) => {
    return api.post(`/meetings/from-group/${groupId}`, data);
  },

  // 导出会议
  export: (id, format = 'json') => {
    return api.get(`/meetings/${id}/export`, { 
      params: { format },
      responseType: format === 'pdf' ? 'blob' : 'json'
    });
  },

  // 获取会议总结
  getSummary: (id, options = {}) => {
    return api.post(`/meetings/${id}/summary`, options);
  },

  // 提问功能
  submitQuestion: (id, question) => {
    return api.post(`/meetings/${id}/questions`, { question });
  },

  // 获取问题回应
  getQuestionResponse: (meetingId, questionId) => {
    return api.post(`/meetings/${meetingId}/questions/${questionId}/respond`);
  }
};

// 收藏相关API
export const favoriteAPI = {
  // 获取收藏列表
  getAll: (userId = 'default_user', params = {}) => {
    return api.get('/favorites', { params: { user_id: userId, ...params } });
  },

  // 获取收藏标签
  getTags: (userId = 'default_user') => {
    return api.get('/favorites/tags', { params: { user_id: userId } });
  },

  // 添加收藏
  create: (data) => {
    return api.post('/favorites', data);
  },

  // 删除收藏
  delete: (favoriteId, userId = 'default_user') => {
    return api.delete(`/favorites/${favoriteId}`, { params: { user_id: userId } });
  }
};

// 发言相关API
export const statementAPI = {
  // 获取发言卡片
  getCard: (statementId) => {
    return api.get(`/statements/${statementId}/card`);
  }
};

// 默认导出api实例
export default api;