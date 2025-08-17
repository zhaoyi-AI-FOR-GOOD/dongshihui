import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Button,
  TextField,
  Tabs,
  Tab,
  Divider,
  Alert
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  BookmarkBorder as BookmarkIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const FavoritesPage = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [filteredFavorites, setFilteredFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  const favoriteTypes = [
    { value: 'all', label: '全部收藏' },
    { value: 'statement', label: '会议发言' },
    { value: 'response', label: '问题回应' }
  ];

  useEffect(() => {
    fetchFavorites();
    fetchTags();
  }, []);

  useEffect(() => {
    filterFavorites();
  }, [favorites, currentTab, searchQuery, selectedTags]);

  const fetchFavorites = async () => {
    try {
      const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : 'https://dongshihui-api.jieshu2023.workers.dev'}/favorites?user_id=default_user`);
      const result = await response.json();
      
      if (result.success) {
        setFavorites(result.data);
      } else {
        toast.error('获取收藏失败');
      }
    } catch (error) {
      console.error('获取收藏失败:', error);
      toast.error('获取收藏失败');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : 'https://dongshihui-api.jieshu2023.workers.dev'}/favorites/tags?user_id=default_user`);
      const result = await response.json();
      
      if (result.success) {
        setAvailableTags(result.data);
      }
    } catch (error) {
      console.error('获取标签失败:', error);
    }
  };

  const filterFavorites = () => {
    let filtered = favorites;

    // 按类型筛选
    if (currentTab > 0) {
      const type = favoriteTypes[currentTab].value;
      filtered = filtered.filter(fav => fav.favorite_type === type);
    }

    // 按搜索关键词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(fav => 
        fav.content?.toLowerCase().includes(query) ||
        fav.director?.name?.toLowerCase().includes(query) ||
        fav.meeting?.title?.toLowerCase().includes(query)
      );
    }

    // 按标签筛选
    if (selectedTags.length > 0) {
      filtered = filtered.filter(fav => 
        selectedTags.some(tag => fav.tags.includes(tag))
      );
    }

    setFilteredFavorites(filtered);
  };

  const handleRemoveFavorite = async (favoriteId) => {
    try {
      const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : 'https://dongshihui-api.jieshu2023.workers.dev'}/favorites/${favoriteId}?user_id=default_user`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
        toast.success('已取消收藏');
      } else {
        toast.error('取消收藏失败');
      }
    } catch (error) {
      console.error('取消收藏失败:', error);
      toast.error('取消收藏失败');
    }
  };

  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleShare = async (favorite) => {
    const shareText = `【${favorite.director?.name}】${favorite.director?.title}\n\n"${favorite.content}"\n\n来自私人董事会系统`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${favorite.director?.name}的精彩发言`,
          text: shareText,
          url: window.location.origin
        });
      } catch (error) {
        // 用户取消分享
      }
    } else {
      // 复制到剪贴板
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('内容已复制到剪贴板');
      } catch (error) {
        toast.error('分享失败');
      }
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6">加载收藏中...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          我的收藏
        </Typography>
        <Button onClick={() => navigate('/hall')}>
          返回大厅
        </Button>
      </Box>

      {/* 搜索和筛选 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            size="small"
            placeholder="搜索收藏内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ flex: 1 }}
          />
        </Box>

        {/* 标签筛选 */}
        {availableTags.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              按标签筛选：
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => handleTagClick(tag)}
                  color={selectedTags.includes(tag) ? 'primary' : 'default'}
                  variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* 分类标签 */}
      <Tabs 
        value={currentTab} 
        onChange={(e, newValue) => setCurrentTab(newValue)}
        sx={{ mb: 3 }}
      >
        {favoriteTypes.map((type, index) => (
          <Tab key={type.value} label={type.label} />
        ))}
      </Tabs>

      {/* 收藏列表 */}
      {filteredFavorites.length === 0 ? (
        <Alert severity="info" sx={{ textAlign: 'center' }}>
          {favorites.length === 0 ? '还没有收藏任何内容' : '没有找到符合条件的收藏'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredFavorites.map((favorite) => (
            <Grid item xs={12} md={6} key={favorite.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  {/* 董事信息 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      src={favorite.director?.avatar_url}
                      sx={{ width: 40, height: 40, mr: 2 }}
                    >
                      {favorite.director?.name?.[0]}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {favorite.director?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {favorite.director?.title}
                      </Typography>
                    </Box>
                    <Chip 
                      label={favorite.favorite_type === 'statement' ? '会议发言' : '问题回应'} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  {/* 内容 */}
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      mb: 2, 
                      lineHeight: 1.6,
                      fontStyle: 'italic',
                      backgroundColor: '#f8f9fa',
                      p: 2,
                      borderRadius: 1,
                      borderLeft: 4,
                      borderLeftColor: 'primary.main'
                    }}
                  >
                    "{favorite.content}"
                  </Typography>

                  {/* 会议信息 */}
                  {favorite.meeting?.title && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        来自会议：{favorite.meeting.title}
                      </Typography>
                    </Box>
                  )}

                  {/* 标签 */}
                  {favorite.tags.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      {favorite.tags.map((tag) => (
                        <Chip 
                          key={tag} 
                          label={tag} 
                          size="small" 
                          sx={{ mr: 0.5, mb: 0.5 }} 
                        />
                      ))}
                    </Box>
                  )}

                  {/* 收藏备注 */}
                  {favorite.notes && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        备注：{favorite.notes}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ mb: 2 }} />

                  {/* 操作按钮 */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      收藏于 {format(new Date(favorite.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                    </Typography>
                    <Box>
                      <IconButton 
                        size="small" 
                        onClick={() => handleShare(favorite)}
                        title="分享"
                      >
                        <ShareIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveFavorite(favorite.id)}
                        color="error"
                        title="取消收藏"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default FavoritesPage;