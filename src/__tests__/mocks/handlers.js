import { rest } from 'msw';
import { mockDirectors, mockMeetings } from '../utils/test-utils';

const API_BASE_URL = 'https://dongshihui-api.jieshu2023.workers.dev';

export const handlers = [
  // 董事相关API
  rest.get(`${API_BASE_URL}/directors/active/list`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockDirectors.filter(d => d.is_active)
      })
    );
  }),

  rest.get(`${API_BASE_URL}/directors`, (req, res, ctx) => {
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const limit = parseInt(req.url.searchParams.get('limit') || '10');
    const search = req.url.searchParams.get('search') || '';
    
    let filteredDirectors = mockDirectors;
    if (search) {
      filteredDirectors = mockDirectors.filter(d => 
        d.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = filteredDirectors.slice(start, end);
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: paginatedData,
        pagination: {
          total: filteredDirectors.length,
          page,
          limit,
          pages: Math.ceil(filteredDirectors.length / limit)
        }
      })
    );
  }),

  rest.get(`${API_BASE_URL}/directors/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const director = mockDirectors.find(d => d.id === id);
    
    if (!director) {
      return res(
        ctx.status(404),
        ctx.json({ success: false, error: 'Director not found' })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: director
      })
    );
  }),

  rest.post(`${API_BASE_URL}/directors`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: {
          id: 'new-director-id',
          ...req.body,
          created_at: new Date().toISOString()
        }
      })
    );
  }),

  rest.delete(`${API_BASE_URL}/directors/:id`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Director deleted successfully'
      })
    );
  }),

  // 会议相关API
  rest.get(`${API_BASE_URL}/meetings`, (req, res, ctx) => {
    const limit = parseInt(req.url.searchParams.get('limit') || '12');
    const offset = parseInt(req.url.searchParams.get('offset') || '0');
    const status = req.url.searchParams.get('status');
    const search = req.url.searchParams.get('search');
    
    let filteredMeetings = [...mockMeetings];
    
    if (status && status !== 'all') {
      filteredMeetings = filteredMeetings.filter(m => m.status === status);
    }
    
    if (search) {
      filteredMeetings = filteredMeetings.filter(m => 
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.topic.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const paginatedData = filteredMeetings.slice(offset, offset + limit);
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: paginatedData,
        pagination: {
          total: filteredMeetings.length,
          limit,
          offset,
          pages: Math.ceil(filteredMeetings.length / limit)
        }
      })
    );
  }),

  rest.get(`${API_BASE_URL}/meetings/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const meeting = mockMeetings.find(m => m.id === id);
    
    if (!meeting) {
      return res(
        ctx.status(404),
        ctx.json({ success: false, error: 'Meeting not found' })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: meeting
      })
    );
  }),

  rest.post(`${API_BASE_URL}/meetings`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: {
          id: 'new-meeting-id',
          ...req.body,
          status: 'preparing',
          created_at: new Date().toISOString()
        }
      })
    );
  }),

  rest.post(`${API_BASE_URL}/meetings/:id/start`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Meeting started successfully'
      })
    );
  }),

  rest.post(`${API_BASE_URL}/meetings/:id/next-statement`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          id: 'new-statement-id',
          content: '这是一个测试发言内容。',
          director: mockDirectors[0],
          created_at: new Date().toISOString()
        }
      })
    );
  }),

  rest.delete(`${API_BASE_URL}/meetings/:id`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Meeting deleted successfully'
      })
    );
  }),

  // 错误处理测试
  rest.get(`${API_BASE_URL}/error-test`, (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        success: false,
        error: 'Internal server error for testing'
      })
    );
  })
];