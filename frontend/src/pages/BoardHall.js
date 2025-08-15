import React from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Box,
  Chip,
  Avatar,
  Paper,
  Fade,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Forum as ForumIcon,
  Add as AddIcon,
  Edit as EditIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { directorAPI } from '../services/api';

const BoardHall = () => {
  const navigate = useNavigate();

  // 获取活跃董事列表
  const { data: directorsResponse, isLoading, error } = useQuery(
    'activeDirectors',
    () => directorAPI.getActive(),
    {
      onError: (err) => {
        toast.error('获取董事列表失败: ' + (err.response?.data?.error || err.message));
      }
    }
  );

  const directors = directorsResponse?.data?.data || [];

  // 董事卡片组件
  const DirectorCard = ({ director }) => {
    return (
      <Fade in timeout={800}>
        <Card
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
            },
          }}
        >
          {/* 董事头像区域 */}
          <Box sx={{ position: 'relative', p: 2, textAlign: 'center' }}>
            <Avatar
              src={director.avatar_url}
              sx={{ 
                width: 80, 
                height: 80, 
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main'
              }}
            >
              <PersonIcon sx={{ fontSize: 40 }} />
            </Avatar>
            
            {/* 状态指示器 */}
            <Chip
              label={director.status === 'active' ? '活跃' : '暂停'}
              size="small"
              color={director.status === 'active' ? 'success' : 'default'}
              sx={{ position: 'absolute', top: 8, right: 8 }}
            />
          </Box>

          <CardContent sx={{ flexGrow: 1, pt: 0 }}>
            {/* 董事信息 */}
            <Typography variant="h6" component="h2" gutterBottom align="center">
              {director.name}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
              {director.title}
            </Typography>

            {/* 专业领域标签 */}
            {director.expertise_areas && director.expertise_areas.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {director.expertise_areas.slice(0, 3).map((area, index) => (
                  <Chip
                    key={index}
                    label={area}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
                {director.expertise_areas.length > 3 && (
                  <Chip
                    label={`+${director.expertise_areas.length - 3}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            )}

            {/* 统计信息 */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ForumIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {director.total_statements || 0} 发言
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {director.total_meetings || 0} 会议
                </Typography>
              </Box>
            </Box>
          </CardContent>

          <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
            {/* 编辑董事 */}
            <IconButton
              size="small"
              onClick={() => navigate(`/directors/edit/${director.id}`)}
              title="编辑董事"
            >
              <EditIcon />
            </IconButton>

            {/* 发起会议 */}
            <Button
              variant="contained"
              size="small"
              startIcon={<PlayIcon />}
              onClick={() => {
                // TODO: 实现发起会议功能
                toast.success('会议功能开发中...');
              }}
            >
              发起讨论
            </Button>
          </CardActions>
        </Card>
      </Fade>
    );
  };

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            加载失败
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error.message}
          </Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            重新加载
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 页面标题 */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom
          sx={{
            background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}
        >
          私人董事会
        </Typography>
        
        <Typography variant="h6" color="text.secondary" gutterBottom>
          与历史伟人共商天下事
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          在这里，您可以邀请历史上的杰出人物加入您的董事会，
          就现代问题进行深入的讨论和辩论。
        </Typography>
      </Box>

      {/* 董事列表 */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            活跃董事 ({directors.length})
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/directors/create')}
            size="large"
          >
            添加董事
          </Button>
        </Box>

        {isLoading ? (
          <Grid container spacing={3}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: 300 }}>
                  <CardContent>
                    <Box sx={{ textAlign: 'center' }}>
                      <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }} />
                      <Typography variant="h6">加载中...</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : directors.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              还没有董事
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              开始创建您的第一位历史人物董事吧！
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/directors/create')}
              sx={{ mt: 2 }}
            >
              创建董事
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {directors.map((director) => (
              <Grid item xs={12} sm={6} md={4} key={director.id}>
                <DirectorCard director={director} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* 快速操作区域 */}
      <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          快速开始
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/directors')}
            size="large"
          >
            管理所有董事
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => navigate('/meetings')}
            size="large"
          >
            查看会议历史
          </Button>
          
          <Button
            variant="contained"
            onClick={() => {
              if (directors.length >= 2) {
                toast.success('会议功能开发中...');
              } else {
                toast.error('至少需要2位董事才能开始会议');
              }
            }}
            size="large"
          >
            开始新会议
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default BoardHall;