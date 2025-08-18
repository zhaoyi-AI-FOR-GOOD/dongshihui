import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Chip,
  IconButton,
  Button,
  Box,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Grid,
  Hidden
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Download as DownloadIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { directorAPI } from '../services/api';

const DirectorManager = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // 状态管理
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedDirectors, setSelectedDirectors] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, director: null });
  const [actionMenu, setActionMenu] = useState({ anchorEl: null, director: null });

  // 获取董事列表
  const { data: directorsResponse, isLoading } = useQuery(
    ['directors', page, rowsPerPage, search],
    () => directorAPI.getAll(),
    {
      onError: (err) => {
        toast.error('获取董事列表失败: ' + err.message);
      }
    }
  );

  const allDirectors = directorsResponse?.data?.data || [];
  
  // 前端过滤和分页
  const filteredDirectors = allDirectors.filter(director => 
    !search || 
    director.name.toLowerCase().includes(search.toLowerCase()) ||
    director.title.toLowerCase().includes(search.toLowerCase())
  );
  
  const directors = filteredDirectors.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const total = filteredDirectors.length;

  // 删除董事
  const deleteMutation = useMutation(
    (id) => directorAPI.delete(id),
    {
      onSuccess: () => {
        toast.success('董事删除成功');
        queryClient.invalidateQueries('directors');
        setDeleteDialog({ open: false, director: null });
      },
      onError: (err) => {
        toast.error('删除失败: ' + err.message);
      }
    }
  );

  // 批量更新状态
  const batchUpdateMutation = useMutation(
    ({ ids, status, isActive }) => directorAPI.batchUpdateStatus(ids, status, isActive),
    {
      onSuccess: (data) => {
        toast.success(`成功更新 ${data.data.updated_count} 个董事`);
        queryClient.invalidateQueries('directors');
        setSelectedDirectors([]);
      },
      onError: (err) => {
        toast.error('批量更新失败: ' + err.message);
      }
    }
  );

  // 处理搜索
  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(0); // 重置到第一页
  };

  // 处理选择
  const handleSelectDirector = (directorId) => {
    setSelectedDirectors(prev => 
      prev.includes(directorId) 
        ? prev.filter(id => id !== directorId)
        : [...prev, directorId]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedDirectors(directors.map(d => d.id));
    } else {
      setSelectedDirectors([]);
    }
  };

  // 获取状态显示
  const getStatusChip = (director) => {
    if (!director.is_active) {
      return <Chip label="已禁用" color="error" size="small" />;
    }
    
    switch (director.status) {
      case 'active':
        return <Chip label="活跃" color="success" size="small" />;
      case 'inactive':
        return <Chip label="非活跃" color="warning" size="small" />;
      case 'retired':
        return <Chip label="已退休" color="default" size="small" />;
      default:
        return <Chip label={director.status} color="default" size="small" />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 4 }}>
      {/* 页面标题和操作栏 */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', 
        gap: isMobile ? 2 : 0,
        mb: isMobile ? 3 : 4 
      }}>
        <Typography variant={isMobile ? "h5" : "h4"} component="h1">
          董事管理
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          gap: isMobile ? 1 : 2,
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => toast('批量导入功能开发中...')}
            size={isMobile ? 'large' : 'medium'}
            fullWidth={isMobile}
            sx={{ minHeight: isMobile ? 48 : 'auto' }}
          >
            批量导入
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/directors/create')}
            size={isMobile ? 'large' : 'medium'}
            fullWidth={isMobile}
            sx={{ minHeight: isMobile ? 48 : 'auto' }}
          >
            创建董事
          </Button>
        </Box>
      </Box>

      {/* 搜索和筛选栏 */}
      <Paper sx={{ p: isMobile ? 2 : 3, mb: isMobile ? 2 : 3 }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          alignItems: 'center', 
          mb: 2,
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <TextField
            placeholder="搜索董事姓名或身份..."
            value={search}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
            fullWidth={isMobile}
            size={isMobile ? 'medium' : 'medium'}
          />
        </Box>

        {/* 批量操作 */}
        {selectedDirectors.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            gap: isMobile ? 1 : 2, 
            alignItems: 'center',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center'
          }}>
            <Typography variant="body2" sx={{ textAlign: isMobile ? 'center' : 'left' }}>
              已选择 {selectedDirectors.length} 个董事
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              flexDirection: isMobile ? 'column' : 'row',
              width: isMobile ? '100%' : 'auto'
            }}>
              <Button
                size={isMobile ? 'medium' : 'small'}
                onClick={() => batchUpdateMutation.mutate({
                  ids: selectedDirectors,
                  is_active: false
                })}
                fullWidth={isMobile}
                sx={{ minHeight: isMobile ? 44 : 'auto' }}
              >
                批量禁用
              </Button>
              
              <Button
                size={isMobile ? 'medium' : 'small'}
                onClick={() => batchUpdateMutation.mutate({
                  ids: selectedDirectors,
                  is_active: true,
                  status: 'active'
                })}
                fullWidth={isMobile}
                sx={{ minHeight: isMobile ? 44 : 'auto' }}
              >
                批量启用
              </Button>
              
              <Button
                size={isMobile ? 'medium' : 'small'}
                color="error"
                onClick={() => {
                  toast.error('批量删除功能需要二次确认');
                }}
                fullWidth={isMobile}
                sx={{ minHeight: isMobile ? 44 : 'auto' }}
              >
                批量删除
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* 桌面端表格 */}
      <Hidden mdDown>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedDirectors.length > 0 && selectedDirectors.length < directors.length}
                    checked={directors.length > 0 && selectedDirectors.length === directors.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>董事</TableCell>
                <TableCell>身份</TableCell>
                <TableCell>时代</TableCell>
                <TableCell>状态</TableCell>
                <TableCell align="center">统计</TableCell>
                <TableCell>创建时间</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                      加载中...
                    </TableCell>
                  </TableRow>
                ))
              ) : directors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 8 }}>
                    <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      {search ? '没有找到匹配的董事' : '还没有董事，点击"创建董事"开始添加'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                directors.map((director) => (
                  <TableRow 
                    key={director.id}
                    selected={selectedDirectors.includes(director.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedDirectors.includes(director.id)}
                        onChange={() => handleSelectDirector(director.id)}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          src={director.avatar_url}
                          sx={{ width: 40, height: 40 }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {director.name}
                          </Typography>
                          {director.expertise_areas && (
                            <Typography variant="caption" color="text.secondary">
                              {(typeof director.expertise_areas === 'string' 
                                ? JSON.parse(director.expertise_areas) 
                                : director.expertise_areas
                              ).slice(0, 2).join(', ')}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {director.title}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {director.era || '-'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusChip(director)}
                    </TableCell>
                    
                    <TableCell align="center">
                      <Box>
                        <Typography variant="body2">
                          {director.total_statements} 发言
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {director.total_meetings} 会议
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(director.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="center">
                      <IconButton
                        onClick={() => navigate(`/directors/edit/${director.id}`)}
                        title="编辑董事"
                      >
                        <EditIcon />
                      </IconButton>
                      
                      <IconButton
                        onClick={(event) => setActionMenu({ 
                          anchorEl: event.currentTarget, 
                          director 
                        })}
                        title="更多操作"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* 分页 */}
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="每页显示:"
            labelDisplayedRows={({ from, to, count }) => 
              `${from}-${to} 共 ${count} 条`
            }
          />
        </TableContainer>
      </Hidden>

      {/* 移动端卡片布局 */}
      <Hidden mdUp>
        {isLoading ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6">加载董事列表中...</Typography>
          </Paper>
        ) : directors.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {search ? '没有找到匹配的董事' : '还没有董事'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {search ? '尝试调整搜索条件' : '创建第一个董事开始管理'}
            </Typography>
            <Button variant="contained" onClick={() => navigate('/directors/create')}>
              创建董事
            </Button>
          </Paper>
        ) : (
          <>
            <Grid container spacing={2}>
              {directors.map((director) => (
                <Grid item xs={12} key={director.id}>
                  <Card sx={{ 
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                      transform: 'translateY(-2px)'
                    }
                  }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Checkbox
                          checked={selectedDirectors.includes(director.id)}
                          onChange={() => handleSelectDirector(director.id)}
                          sx={{ mr: 1 }}
                        />
                        <Avatar 
                          src={director.avatar_url}
                          sx={{ width: 48, height: 48, mr: 2 }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                            {director.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {director.title}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            onClick={() => navigate(`/directors/edit/${director.id}`)}
                            title="编辑董事"
                            size="large"
                            sx={{ minHeight: 44, minWidth: 44 }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={(event) => setActionMenu({ 
                              anchorEl: event.currentTarget, 
                              director 
                            })}
                            title="更多操作"
                            size="large"
                            sx={{ minHeight: 44, minWidth: 44 }}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                          {getStatusChip(director)}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {director.era || '未设置时代'}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          参与统计：
                        </Typography>
                        <Typography variant="body2">
                          {director.total_statements} 发言 • {director.total_meetings} 会议
                        </Typography>
                      </Box>

                      {director.expertise_areas && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            专业领域：
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(typeof director.expertise_areas === 'string' 
                              ? JSON.parse(director.expertise_areas) 
                              : director.expertise_areas
                            ).map((area, index) => (
                              <Chip 
                                key={index} 
                                label={area} 
                                size="small" 
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      <Typography variant="caption" color="text.secondary">
                        创建于 {format(new Date(director.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* 移动端分页 */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25]}
                labelRowsPerPage="每页:"
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}-${to} / ${count}`
                }
                sx={{ 
                  '& .MuiTablePagination-toolbar': {
                    paddingLeft: 1,
                    paddingRight: 1
                  },
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    fontSize: '0.875rem'
                  }
                }}
              />
            </Box>
          </>
        )}
      </Hidden>

      {/* 操作菜单 */}
      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={() => setActionMenu({ anchorEl: null, director: null })}
      >
        <MenuItem onClick={() => {
          navigate(`/directors/details/${actionMenu.director.id}`);
          setActionMenu({ anchorEl: null, director: null });
        }}>
          查看统计
        </MenuItem>
        
        <MenuItem onClick={() => {
          navigate(`/directors/details/${actionMenu.director.id}`);
          setActionMenu({ anchorEl: null, director: null });
        }}>
          查看详情
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            setDeleteDialog({ open: true, director: actionMenu.director });
            setActionMenu({ anchorEl: null, director: null });
          }}
          sx={{ color: 'error.main' }}
        >
          删除董事
        </MenuItem>
      </Menu>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, director: null })}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除董事 "{deleteDialog.director?.name}" 吗？
            此操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, director: null })}>
            取消
          </Button>
          <Button 
            color="error" 
            onClick={() => deleteMutation.mutate(deleteDialog.director.id)}
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? '删除中...' : '确认删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DirectorManager;