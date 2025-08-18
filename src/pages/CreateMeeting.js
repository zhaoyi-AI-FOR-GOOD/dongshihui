import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Checkbox,
  FormControlLabel,
  Alert,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Person as PersonIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { directorAPI, meetingAPI } from '../services/api';

const CreateMeeting = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    discussion_mode: 'round_robin',
    max_rounds: 5,
    max_participants: 8,
    director_ids: []
  });
  
  const [selectedDirectors, setSelectedDirectors] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupSelection, setShowGroupSelection] = useState(false);

  // 获取活跃董事列表
  const { data: directorsResponse, isLoading: directorsLoading } = useQuery(
    'activeDirectors',
    () => directorAPI.getActive(),
    {
      onError: (err) => {
        toast.error('获取董事列表失败: ' + err.message);
      }
    }
  );

  const directors = directorsResponse?.data?.data || [];

  // 获取董事组合列表
  const { data: groupsResponse, isLoading: groupsLoading } = useQuery(
    'directorGroups',
    async () => {
      const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : 'https://dongshihui-api.jieshu2023.workers.dev'}/director-groups?user_id=default_user`);
      return response.json();
    },
    {
      onError: (err) => {
        console.error('获取董事组合失败:', err);
      }
    }
  );

  const directorGroups = groupsResponse?.data || [];

  // 创建会议
  const createMutation = useMutation(
    (data) => meetingAPI.create(data),
    {
      onSuccess: (response) => {
        toast.success('会议创建成功！');
        queryClient.invalidateQueries('meetings');
        navigate(`/meeting/${response.data.data.id}`);
      },
      onError: (err) => {
        toast.error('创建会议失败: ' + err.message);
      }
    }
  );

  // 处理输入变化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理董事选择
  const handleDirectorSelect = (director) => {
    const isSelected = selectedDirectors.find(d => d.id === director.id);
    
    if (isSelected) {
      // 取消选择
      setSelectedDirectors(prev => prev.filter(d => d.id !== director.id));
      setFormData(prev => ({
        ...prev,
        director_ids: prev.director_ids.filter(id => id !== director.id)
      }));
    } else {
      // 添加选择
      if (selectedDirectors.length >= formData.max_participants) {
        toast.error(`最多只能选择${formData.max_participants}位董事`);
        return;
      }
      
      setSelectedDirectors(prev => [...prev, director]);
      setFormData(prev => ({
        ...prev,
        director_ids: [...prev.director_ids, director.id]
      }));
    }
  };

  // 处理选择董事组合
  const handleSelectGroup = async (group) => {
    try {
      const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : 'https://dongshihui-api.jieshu2023.workers.dev'}/director-groups/${group.id}`);
      const result = await response.json();
      
      if (result.success) {
        const groupDirectors = result.data.members.map(m => m.director);
        setSelectedDirectors(groupDirectors);
        setFormData(prev => ({
          ...prev,
          director_ids: groupDirectors.map(d => d.id)
        }));
        setSelectedGroup(group);
        setShowGroupSelection(false);
        toast.success(`已选择组合：${group.name}`);
      }
    } catch (error) {
      console.error('获取组合详情失败:', error);
      toast.error('获取组合详情失败');
    }
  };

  // 处理表单提交
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.topic.trim()) {
      toast.error('请填写会议标题和讨论话题');
      return;
    }
    
    if (formData.director_ids.length === 0) {
      toast.error('请至少选择一位董事参与会议');
      return;
    }
    
    createMutation.mutate(formData);
  };

  // 讨论模式选项
  const discussionModes = {
    'round_robin': '轮流发言',
    'debate': '辩论模式',
    'focus': '聚焦讨论',
    'free': '自由发言'
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 页面标题 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/hall')}
          sx={{ mr: 2 }}
        >
          返回
        </Button>
        <Typography variant="h4" component="h1">
          创建新会议
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={4}>
          {/* 左侧：会议基本信息 */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                会议信息
              </Typography>
              
              <TextField
                fullWidth
                label="会议标题 *"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                sx={{ mb: 2 }}
                required
                placeholder="例如：关于人工智能发展的董事会讨论"
              />
              
              
              <TextField
                fullWidth
                label="讨论话题 *"
                multiline
                rows={4}
                value={formData.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                required
                placeholder="请描述你想讨论的问题..."
                helperText="详细的话题描述将帮助董事们更好地进行讨论"
              />
            </Paper>

            {/* 会议设置 */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                会议设置
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>讨论模式</InputLabel>
                    <Select
                      value={formData.discussion_mode}
                      label="讨论模式"
                      onChange={(e) => handleInputChange('discussion_mode', e.target.value)}
                    >
                      {Object.entries(discussionModes).map(([key, label]) => (
                        <MenuItem key={key} value={key}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="最大轮数"
                    value={formData.max_rounds}
                    onChange={(e) => handleInputChange('max_rounds', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 20 }}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="最大参与者"
                    value={formData.max_participants}
                    onChange={(e) => handleInputChange('max_participants', parseInt(e.target.value))}
                    inputProps={{ min: 1, max: 10 }}
                  />
                </Grid>
              </Grid>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>{discussionModes[formData.discussion_mode]}</strong>: 
                {formData.discussion_mode === 'round_robin' && ' 严格按加入顺序轮流发言，每轮每人一次机会，有序公平'}
                {formData.discussion_mode === 'debate' && ' 自动分正反方阵营，支持反驳回击，观点激烈碰撞'}
                {formData.discussion_mode === 'focus' && ' 围绕核心议题逐层深入，结构化探讨，层次清晰'}
                {formData.discussion_mode === 'free' && ' 随机发言顺序，支持举手插话，自然灵活互动'}
              </Alert>
            </Paper>
          </Grid>

          {/* 右侧：董事选择 */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  选择参与董事 ({selectedDirectors.length}/{formData.max_participants})
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSelectedDirectors([]);
                    setFormData(prev => ({ ...prev, director_ids: [] }));
                  }}
                  disabled={selectedDirectors.length === 0}
                >
                  清空选择
                </Button>
              </Box>

              {directorsLoading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography>加载董事列表中...</Typography>
                </Box>
              ) : directors.length === 0 ? (
                <Alert severity="warning">
                  暂无活跃董事，请先创建并激活董事。
                </Alert>
              ) : (
                <Grid container spacing={2}>
                  {directors.map((director) => {
                    const isSelected = selectedDirectors.find(d => d.id === director.id);
                    
                    return (
                      <Grid item xs={12} key={director.id}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            border: isSelected ? 2 : 1,
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            '&:hover': {
                              borderColor: 'primary.main',
                              boxShadow: 2
                            }
                          }}
                          onClick={() => handleDirectorSelect(director)}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Checkbox
                                checked={!!isSelected}
                                sx={{ mr: 2 }}
                              />
                              <Avatar 
                                src={director.avatar_url}
                                sx={{ width: 40, height: 40, mr: 2 }}
                              >
                                <PersonIcon />
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1">
                                  {director.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {director.title}
                                </Typography>
                                {director.expertise_areas && (
                                  <Box sx={{ mt: 0.5 }}>
                                    {(typeof director.expertise_areas === 'string' ? JSON.parse(director.expertise_areas) : director.expertise_areas).slice(0, 2).map((area, index) => (
                                      <Chip
                                        key={index}
                                        label={area}
                                        size="small"
                                        variant="outlined"
                                        sx={{ mr: 0.5, fontSize: '0.7rem' }}
                                      />
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}

              {/* 已选择董事预览 */}
              {selectedDirectors.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    已选择的董事：
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedDirectors.map((director) => (
                      <Chip
                        key={director.id}
                        avatar={
                          <Avatar 
                            src={director.avatar_url}
                            sx={{ width: 24, height: 24 }}
                          >
                            <PersonIcon sx={{ fontSize: 14 }} />
                          </Avatar>
                        }
                        label={director.name}
                        onDelete={() => handleDirectorSelect(director)}
                        color="primary"
                      />
                    ))}
                  </Box>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* 底部操作栏 */}
        <Paper sx={{ p: 3, mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/hall')}
          >
            取消
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            startIcon={<AddIcon />}
            disabled={createMutation.isLoading}
            size="large"
          >
            {createMutation.isLoading ? '创建中...' : '创建会议'}
          </Button>
        </Paper>
      </form>
    </Container>
  );
};

export default CreateMeeting;