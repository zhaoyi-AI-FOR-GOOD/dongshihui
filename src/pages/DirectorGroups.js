import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Chip,
  Alert,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  People as PeopleIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import toast from 'react-hot-toast';

const DirectorGroups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  // 创建组合表单
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedDirectors, setSelectedDirectors] = useState([]);
  
  // 会议创建表单
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingTopic, setMeetingTopic] = useState('');

  useEffect(() => {
    fetchGroups();
    fetchDirectors();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch(`https://dongshihui-api.jieshu2023.workers.dev/director-groups?user_id=default_user`);
      const result = await response.json();
      
      if (result.success) {
        setGroups(result.data);
      }
    } catch (error) {
      console.error('获取董事组合失败:', error);
      toast.error('获取董事组合失败');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDirectors = async () => {
    try {
      const response = await fetch(`https://dongshihui-api.jieshu2023.workers.dev/directors`);
      const result = await response.json();
      
      if (result.success) {
        setDirectors(result.data);
      }
    } catch (error) {
      console.error('获取董事列表失败:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedDirectors.length === 0) {
      toast.error('请填写组合名称并选择至少一位董事');
      return;
    }

    try {
      const response = await fetch(`https://dongshihui-api.jieshu2023.workers.dev/director-groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDescription.trim(),
          director_ids: selectedDirectors,
          user_id: 'default_user'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('董事组合创建成功！');
        setShowCreateDialog(false);
        resetCreateForm();
        fetchGroups();
      } else {
        toast.error(result.error || '创建失败');
      }
    } catch (error) {
      console.error('创建组合失败:', error);
      toast.error('创建组合失败');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('确定要删除这个董事组合吗？')) return;

    try {
      const response = await fetch(`https://dongshihui-api.jieshu2023.workers.dev/director-groups/${groupId}?user_id=default_user`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('董事组合删除成功');
        fetchGroups();
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除组合失败:', error);
      toast.error('删除组合失败');
    }
  };

  const handleCreateMeetingFromGroup = async () => {
    if (!meetingTitle.trim() || !meetingTopic.trim()) {
      toast.error('请填写会议标题和话题');
      return;
    }

    try {
      const response = await fetch(`https://dongshihui-api.jieshu2023.workers.dev/meetings/from-group/${selectedGroup.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: meetingTitle.trim(),
          topic: meetingTopic.trim(),
          discussion_mode: 'round_robin',
          max_rounds: 10
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('会议创建成功！');
        setShowMeetingDialog(false);
        setMeetingTitle('');
        setMeetingTopic('');
        navigate(`/meeting/${result.data.id}`);
      } else {
        toast.error(result.error || '创建会议失败');
      }
    } catch (error) {
      console.error('创建会议失败:', error);
      toast.error('创建会议失败');
    }
  };

  const resetCreateForm = () => {
    setGroupName('');
    setGroupDescription('');
    setSelectedDirectors([]);
  };

  const handleDirectorToggle = (directorId) => {
    setSelectedDirectors(prev => 
      prev.includes(directorId) 
        ? prev.filter(id => id !== directorId)
        : [...prev, directorId]
    );
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6">加载中...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          我的董事组合
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateDialog(true)}
        >
          创建新组合
        </Button>
      </Box>

      {groups.length === 0 ? (
        <Alert severity="info" sx={{ textAlign: 'center' }}>
          还没有创建任何董事组合，创建一个专属的董事会吧！
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {groups.map((group) => (
            <Grid item xs={12} md={6} lg={4} key={group.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h3">
                      {group.name}
                    </Typography>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  
                  {group.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {group.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip 
                      label={`${group.member_count} 位董事`} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                    />
                    <Chip 
                      label={`使用 ${group.usage_count} 次`} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                    创建于 {format(new Date(group.created_at), 'yyyy年MM月dd日', { locale: zhCN })}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PlayIcon />}
                      onClick={() => {
                        setSelectedGroup(group);
                        setShowMeetingDialog(true);
                      }}
                      sx={{ flex: 1 }}
                    >
                      创建会议
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PeopleIcon />}
                      onClick={() => navigate(`/director-groups/${group.id}`)}
                    >
                      查看详情
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 创建组合对话框 */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>创建董事组合</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="组合名称"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          
          <TextField
            fullWidth
            multiline
            rows={2}
            label="组合描述（可选）"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle1" gutterBottom>
            选择董事成员：
          </Typography>
          
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {directors.map((director) => (
              <ListItem 
                key={director.id}
                dense
                button
                onClick={() => handleDirectorToggle(director.id)}
              >
                <Checkbox
                  checked={selectedDirectors.includes(director.id)}
                  tabIndex={-1}
                  disableRipple
                />
                <ListItemAvatar>
                  <Avatar src={director.avatar_url}>
                    {director.name?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={director.name}
                  secondary={`${director.title} · ${director.era}`}
                />
              </ListItem>
            ))}
          </List>

          <Typography variant="caption" color="text.secondary">
            已选择 {selectedDirectors.length} 位董事
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowCreateDialog(false);
            resetCreateForm();
          }}>
            取消
          </Button>
          <Button 
            onClick={handleCreateGroup} 
            variant="contained"
            disabled={!groupName.trim() || selectedDirectors.length === 0}
          >
            创建组合
          </Button>
        </DialogActions>
      </Dialog>

      {/* 基于组合创建会议对话框 */}
      <Dialog open={showMeetingDialog} onClose={() => setShowMeetingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>基于 "{selectedGroup?.name}" 创建会议</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="会议标题"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="讨论话题"
            value={meetingTopic}
            onChange={(e) => setMeetingTopic(e.target.value)}
            placeholder="请输入要讨论的话题..."
          />

          {selectedGroup && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                将邀请 {selectedGroup.member_count} 位董事参与讨论
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowMeetingDialog(false);
            setMeetingTitle('');
            setMeetingTopic('');
          }}>
            取消
          </Button>
          <Button 
            onClick={handleCreateMeetingFromGroup} 
            variant="contained"
            disabled={!meetingTitle.trim() || !meetingTopic.trim()}
          >
            创建会议
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DirectorGroups;