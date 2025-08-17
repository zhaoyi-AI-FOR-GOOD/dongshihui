import React, { useState } from 'react';
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  Box,
  Typography
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const FavoriteButton = ({ 
  statementId, 
  responseId, 
  favoriteType = 'statement',
  isFavorited = false,
  onFavoriteChange 
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFavoriteClick = () => {
    if (isFavorited) {
      handleRemoveFavorite();
    } else {
      setIsDialogOpen(true);
    }
  };

  const handleRemoveFavorite = async () => {
    // 这里需要实现取消收藏的逻辑
    if (onFavoriteChange) {
      onFavoriteChange(false);
    }
    toast.success('已取消收藏');
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : 'https://dongshihui-api.jieshu2023.workers.dev'}/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statement_id: statementId,
          response_id: responseId,
          favorite_type: favoriteType,
          tags: tags,
          notes: notes.trim(),
          user_id: 'default_user'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('收藏成功！');
        setIsDialogOpen(false);
        if (onFavoriteChange) {
          onFavoriteChange(true);
        }
        // 重置表单
        setTags([]);
        setNotes('');
        setNewTag('');
      } else {
        toast.error(result.error || '收藏失败');
      }
    } catch (error) {
      console.error('收藏失败:', error);
      toast.error('收藏失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleFavoriteClick}
        color={isFavorited ? 'error' : 'default'}
        title={isFavorited ? '取消收藏' : '收藏此内容'}
      >
        {isFavorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
      </IconButton>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>收藏精彩内容</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              添加标签（可选）
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                size="small"
                placeholder="输入标签..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                sx={{ flex: 1 }}
              />
              <Button 
                onClick={handleAddTag} 
                disabled={!newTag.trim()}
                variant="outlined"
                size="small"
              >
                添加
              </Button>
            </Box>
            
            {tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </Box>

          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="添加收藏备注（可选）..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            label="收藏备注"
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              建议标签：金句、深度、争议、启发、经典
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            取消
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? '收藏中...' : '确认收藏'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FavoriteButton;