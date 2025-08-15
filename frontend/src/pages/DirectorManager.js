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
  FormControlLabel
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
    () => directorAPI.getAll({
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      search,
      status: 'all'
    }),
    {
      onError: (err) => {
        toast.error('获取董事列表失败: ' + err.message);
      }
    }
  );

  const directors = directorsResponse?.data?.data?.directors || [];
  const total = directorsResponse?.data?.data?.total || 0;

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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 页面标题和操作栏 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          董事管理
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => toast('批量导入功能开发中...')}
          >
            批量导入
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/directors/create')}
          >
            创建董事
          </Button>
        </Box>
      </Box>

      {/* 搜索和筛选栏 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
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
          />
        </Box>

        {/* 批量操作 */}
        {selectedDirectors.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="body2">
              已选择 {selectedDirectors.length} 个董事
            </Typography>
            
            <Button
              size="small"
              onClick={() => batchUpdateMutation.mutate({
                ids: selectedDirectors,
                is_active: false
              })}
            >
              批量禁用
            </Button>
            
            <Button
              size="small"
              onClick={() => batchUpdateMutation.mutate({
                ids: selectedDirectors,
                is_active: true,
                status: 'active'
              })}
            >
              批量启用
            </Button>
            
            <Button
              size="small"
              color="error"
              onClick={() => {
                toast.error('批量删除功能需要二次确认');
              }}
            >
              批量删除
            </Button>
          </Box>
        )}
      </Paper>

      {/* 董事表格 */}
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
                        {director.expertise_areas && director.expertise_areas.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {director.expertise_areas.slice(0, 2).join(', ')}
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

      {/* 操作菜单 */}
      <Menu
        anchorEl={actionMenu.anchorEl}
        open={Boolean(actionMenu.anchorEl)}
        onClose={() => setActionMenu({ anchorEl: null, director: null })}
      >
        <MenuItem onClick={() => {
          navigate(`/directors/${actionMenu.director.id}/stats`);
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