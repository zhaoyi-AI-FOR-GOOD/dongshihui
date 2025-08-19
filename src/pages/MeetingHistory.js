import React, { useState, useMemo, useCallback } from 'react';
// 按需导入减少bundle大小
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Menu from '@mui/material/Menu';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import useMediaQuery from '@mui/material/useMediaQuery';
import useTheme from '@mui/material/styles/useTheme';

import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import TimeIcon from '@mui/icons-material/AccessTime';
import ForumIcon from '@mui/icons-material/Forum';
import PersonIcon from '@mui/icons-material/Person';
import ViewIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import toast from 'react-hot-toast';

const MeetingHistory = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // 筛选状态
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    page: 1
  });
  
  // 删除相关状态
  const [deleteDialog, setDeleteDialog] = useState({ open: false, meeting: null });
  const [actionMenu, setActionMenu] = useState({ anchorEl: null, meeting: null });

  // 获取会议列表 - 优化缓存和性能
  const { data: meetingsResponse, isLoading } = useQuery(
    ['meetings', filters],
    async () => {
      const params = new URLSearchParams({
        limit: '12',
        offset: ((filters.page - 1) * 12).toString(),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });
      
      const response = await fetch(`https://dongshihui-api.jieshu2023.workers.dev/meetings?${params}`, {
        headers: {
          'Cache-Control': 'public, max-age=300', // 5分钟缓存
        }
      });
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '获取会议列表失败');
      }
      
      return result;
    },
    {
      staleTime: 2 * 60 * 1000, // 2分钟内不重新获取
      cacheTime: 10 * 60 * 1000, // 10分钟缓存
      keepPreviousData: true, // 保持之前数据，减少加载闪烁
      onError: (err) => {
        toast.error('获取会议列表失败: ' + err.message);
      }
    }
  );

  const meetings = meetingsResponse?.data || [];
  const pagination = meetingsResponse?.pagination || {};

  // 删除会议
  const deleteMutation = useMutation(
    async (meetingId) => {
      const response = await fetch(`https://dongshihui-api.jieshu2023.workers.dev/meetings/${meetingId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '删除失败');
      }
      return result;
    },
    {
      onSuccess: () => {
        toast.success('会议删除成功');
        queryClient.invalidateQueries('meetings');
        setDeleteDialog({ open: false, meeting: null });
      },
      onError: (err) => {
        toast.error('删除失败: ' + err.message);
      }
    }
  );

  // 状态选项 - memoized避免重复创建
  const statusOptions = useMemo(() => [
    { value: 'all', label: '全部会议' },
    { value: 'preparing', label: '准备中' },
    { value: 'discussing', label: '讨论中' },
    { value: 'paused', label: '已暂停' },
    { value: 'finished', label: '已结束' }
  ], []);

  // 获取状态信息 - memoized避免重复计算
  const statusMap = useMemo(() => ({
    'preparing': { label: '准备中', color: 'default' },
    'discussing': { label: '讨论中', color: 'success' },
    'debating': { label: '辩论中', color: 'warning' },
    'paused': { label: '已暂停', color: 'info' },
    'finished': { label: '已结束', color: 'error' }
  }), []);

  const getStatusInfo = useCallback((status) => {
    return statusMap[status] || { label: status, color: 'default' };
  }, [statusMap]);

  // 处理筛选变化 - useCallback避免子组件重渲染
  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // 重置到第一页
    }));
  }, []);

  // 处理搜索 - useCallback + 防抖优化
  const handleSearch = useCallback((value) => {
    setFilters(prev => ({
      ...prev,
      search: value,
      page: 1
    }));
  }, []);

  // 处理菜单操作 - useCallback优化
  const handleMenuOpen = useCallback((event, meeting) => {
    setActionMenu({ anchorEl: event.currentTarget, meeting });
  }, []);

  const handleMenuClose = useCallback(() => {
    setActionMenu({ anchorEl: null, meeting: null });
  }, []);

  // 骨架屏组件
  const MeetingSkeleton = () => (
    <Grid container spacing={isMobile ? 2 : 3}>
      {[...Array(6)].map((_, index) => (
        <Grid item xs={12} sm={6} lg={4} key={index}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: isMobile ? 2.5 : 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ 
                  width: '60%', 
                  height: 24, 
                  bgcolor: 'grey.200', 
                  borderRadius: 1,
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
                <Box sx={{ 
                  width: 60, 
                  height: 24, 
                  bgcolor: 'grey.200', 
                  borderRadius: 12,
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
              </Box>
              <Box sx={{ 
                width: '80%', 
                height: 16, 
                bgcolor: 'grey.200', 
                borderRadius: 1, 
                mb: 1,
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
              <Box sx={{ 
                width: '60%', 
                height: 16, 
                bgcolor: 'grey.200', 
                borderRadius: 1, 
                mb: 2,
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                {[...Array(3)].map((_, i) => (
                  <Box key={i} sx={{ 
                    width: 60, 
                    height: 16, 
                    bgcolor: 'grey.200', 
                    borderRadius: 1,
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }} />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Box sx={{ 
                  width: 80, 
                  height: 36, 
                  bgcolor: 'grey.200', 
                  borderRadius: 1,
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
                <Box sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: 'grey.200', 
                  borderRadius: 1,
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  if (isLoading && !meetingsResponse) {
    return (
      <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 4 }}>
        {/* 页面标题骨架 */}
        <Box sx={{ mb: isMobile ? 3 : 4 }}>
          <Box sx={{ 
            width: 200, 
            height: 32, 
            bgcolor: 'grey.200', 
            borderRadius: 1, 
            mb: 1,
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
          <Box sx={{ 
            width: 300, 
            height: 20, 
            bgcolor: 'grey.200', 
            borderRadius: 1,
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
        </Box>
        
        {/* 搜索栏骨架 */}
        <Paper sx={{ p: isMobile ? 2 : 3, mb: isMobile ? 2 : 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                height: 56, 
                bgcolor: 'grey.200', 
                borderRadius: 1,
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ 
                height: 56, 
                bgcolor: 'grey.200', 
                borderRadius: 1,
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
            </Grid>
          </Grid>
        </Paper>
        
        <MeetingSkeleton />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 4 }}>
      {/* 页面标题 */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', 
        gap: isMobile ? 2 : 0,
        mb: isMobile ? 3 : 4 
      }}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} gutterBottom sx={{ fontWeight: 600 }}>
            会议历史
          </Typography>
          <Typography variant="body1" color="text.secondary">
            回顾和管理历史董事会会议记录
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/meetings/create')}
          sx={{ 
            borderRadius: 2,
            minHeight: isMobile ? 48 : 'auto',
            fontSize: isMobile ? '1rem' : '0.875rem'
          }}
          size={isMobile ? 'large' : 'medium'}
          fullWidth={isMobile}
        >
          创建新会议
        </Button>
      </Box>

      {/* 筛选和搜索 */}
      <Paper sx={{ p: isMobile ? 2 : 3, mb: isMobile ? 2 : 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="搜索会议标题或话题..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              size={isMobile ? 'medium' : 'medium'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>会议状态</InputLabel>
              <Select
                value={filters.status}
                label="会议状态"
                onChange={(e) => handleFilterChange('status', e.target.value)}
                size={isMobile ? 'medium' : 'medium'}
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              justifyContent: isMobile ? 'center' : 'flex-start'
            }}>
              <Typography variant="body2" color="text.secondary">
                共 {pagination.total || 0} 场会议
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 会议列表 */}
      {meetings.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {filters.search || filters.status !== 'all' ? '没有找到匹配的会议' : '还没有会议记录'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {filters.search || filters.status !== 'all' ? '尝试调整筛选条件' : '创建第一场董事会会议开始讨论'}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/meetings/create')}>
            创建新会议
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={isMobile ? 2 : 3}>
            {meetings.map((meeting) => {
              const statusInfo = getStatusInfo(meeting.status);
              
              return (
                <Grid item xs={12} sm={6} lg={4} key={meeting.id}>
                  <Card sx={{ 
                    height: '100%',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                      transform: 'translateY(-2px)'
                    }
                  }}>
                    <CardContent sx={{ p: isMobile ? 2.5 : 3 }}>
                      {/* 会议头部 */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600,
                            color: '#333',
                            fontSize: isMobile ? '1rem' : '1.1rem',
                            lineHeight: 1.3,
                            flex: 1,
                            mr: 1
                          }}
                        >
                          {meeting.title}
                        </Typography>
                        <Chip 
                          label={statusInfo.label} 
                          color={statusInfo.color} 
                          size="small"
                          sx={{ flexShrink: 0 }}
                        />
                      </Box>

                      {/* 话题预览 */}
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.5
                        }}
                      >
                        {meeting.topic}
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      {/* 会议统计 */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ForumIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {meeting.total_statements || 0} 发言
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {meeting.total_participants || 0} 董事
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {meeting.created_at && format(new Date(meeting.created_at), 'MM-dd HH:mm', { locale: zhCN })}
                          </Typography>
                        </Box>
                      </Box>

                      {/* 操作按钮 */}
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        justifyContent: 'flex-end',
                        flexDirection: isMobile ? 'column' : 'row'
                      }}>
                        <Button
                          size={isMobile ? 'medium' : 'small'}
                          startIcon={<ViewIcon />}
                          onClick={() => navigate(`/meeting/${meeting.id}`)}
                          variant="outlined"
                          fullWidth={isMobile}
                          sx={{ minHeight: isMobile ? 44 : 'auto' }}
                        >
                          {meeting.status === 'finished' ? '查看记录' : '进入会议'}
                        </Button>
                        
                        <IconButton
                          size={isMobile ? 'medium' : 'small'}
                          onClick={(event) => handleMenuOpen(event, meeting)}
                          title="更多操作"
                          sx={{ 
                            minHeight: isMobile ? 44 : 'auto',
                            alignSelf: isMobile ? 'flex-end' : 'center'
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* 分页 */}
          {pagination.total > 12 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={Math.ceil(pagination.total / 12)}
                page={filters.page}
                onChange={(e, page) => handleFilterChange('page', page)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* 操作菜单 */}
      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/meeting/${actionMenu.meeting.id}`);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {actionMenu.meeting?.status === 'finished' ? '查看记录' : '进入会议'}
          </ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            setDeleteDialog({ open: true, meeting: actionMenu.meeting });
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>
            删除会议
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, meeting: null })}
      >
        <DialogTitle>确认删除会议</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除会议 <strong>"{deleteDialog.meeting?.title}"</strong> 吗？
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            此操作将永久删除该会议的所有记录，包括发言内容、用户提问等，且无法恢复。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, meeting: null })}>
            取消
          </Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={() => deleteMutation.mutate(deleteDialog.meeting.id)}
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? '删除中...' : '确认删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MeetingHistory;