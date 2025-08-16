import axios from 'axios';

// 动态确定API基础URL
const getBaseURL = () => {
  if (process.env.NODE_ENV === 'production') {
    // 生产环境暂时使用模拟API，等Workers部署后再更新
    return process.env.REACT_APP_API_URL || '/api';
  } else {
    // 开发环境使用本地后端
    return 'http://localhost:3001/api/v1';
  }
};

// 创建axios实例
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
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

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API响应: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API响应错误:', error.response?.data || error.message);
    
    // 处理常见错误
    if (error.response?.status === 404) {
      throw new Error('API端点不存在');
    } else if (error.response?.status === 500) {
      throw new Error('服务器内部错误');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('无法连接到服务器，请确保后端服务正在运行');
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
  }
};

// 默认导出api实例
export default api;