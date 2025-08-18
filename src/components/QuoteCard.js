import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogContent,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Share as ShareIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const QuoteCard = ({ statementId, onClose }) => {
  const [cardData, setCardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const cardRef = useRef(null);

  React.useEffect(() => {
    if (statementId) {
      fetchCardData();
    }
  }, [statementId]);

  const fetchCardData = async () => {
    try {
      const response = await fetch(`https://dongshihui-api.jieshu2023.workers.dev/statements/${statementId}/card`);
      const result = await response.json();
      
      if (result.success) {
        setCardData(result.data);
      } else {
        console.error('卡片API返回错误:', result.error);
        // 如果API失败，创建一个默认的cardData以便测试长图功能
        setCardData({
          id: statementId,
          content: "这是一个测试金句，用于演示长图分享功能。",
          director: {
            name: "测试董事",
            title: "AI测试专家",
            avatar_url: null,
            era: "2024年"
          },
          meeting: {
            title: "测试会议",
            topic: "测试长图分享功能"
          },
          analysis: {
            keywords: ["测试", "长图", "分享"],
            theme_color: "#1976d2",
            category: "测试",
            highlight_quote: "这是一个测试金句"
          },
          created_at: new Date().toISOString(),
          round_number: 1
        });
        toast.error('获取卡片数据失败，使用测试数据');
      }
    } catch (error) {
      console.error('获取卡片数据失败:', error);
      // 网络错误时也使用测试数据
      setCardData({
        id: statementId,
        content: "网络连接失败，这是测试数据用于演示长图分享功能。",
        director: {
          name: "测试董事", 
          title: "系统测试员",
          avatar_url: null,
          era: "现代"
        },
        meeting: {
          title: "测试会议",
          topic: "网络错误处理测试"
        },
        analysis: {
          keywords: ["网络", "错误", "测试"],
          theme_color: "#f44336", 
          category: "错误",
          highlight_quote: "网络连接失败时的处理"
        },
        created_at: new Date().toISOString(),
        round_number: 1
      });
      toast.error('网络连接失败，使用测试数据');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!cardData) return;

    const shareText = `【${cardData.director.name}】${cardData.director.title}\n\n"${cardData.analysis.highlight_quote || cardData.content}"\n\n来自私人董事会系统 - ${cardData.meeting.title}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cardData.director.name}的金句`,
          text: shareText,
          url: window.location.origin
        });
      } catch (error) {
        // 用户取消分享
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('内容已复制到剪贴板');
      } catch (error) {
        toast.error('分享失败');
      }
    }
  };

  const handleGenerateImage = async () => {
    if (!cardData) return;
    
    setIsGeneratingImage(true);
    try {
      // 创建完全独立的iframe来隔离CSS
      const iframe = document.createElement('iframe');
      iframe.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        width: 480px;
        height: 600px;
        border: none;
        visibility: hidden;
      `;
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      
      // 写入完全独立的HTML和CSS
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
              font-family: -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', sans-serif;
            }
            *::before, *::after { 
              display: none !important; 
              content: none !important; 
            }
            body { 
              width: 480px; 
              min-height: 600px; 
              padding: 30px; 
              background: linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%);
              border: 2px solid #1976d2;
              border-radius: 12px;
              position: relative;
              overflow: hidden;
              color: #333;
            }
            .decor { 
              position: absolute; 
              top: -30px; 
              right: -30px; 
              width: 160px; 
              height: 160px; 
              background: radial-gradient(circle, rgba(25, 118, 210, 0.05) 0%, transparent 70%); 
              border-radius: 50%; 
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              margin-bottom: 24px; 
            }
            .category { 
              background: #1976d2; 
              color: white; 
              padding: 6px 16px; 
              border-radius: 4px; 
              font-weight: bold; 
              font-size: 14px; 
            }
            .round { 
              font-size: 12px; 
              color: #666; 
            }
            .director-info { 
              display: flex; 
              align-items: center; 
              margin-bottom: 24px; 
            }
            .avatar { 
              width: 60px; 
              height: 60px; 
              border-radius: 50%; 
              background: #1976d2; 
              color: white; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold; 
              font-size: 20px; 
              margin-right: 16px; 
              border: 3px solid #1976d2; 
            }
            .name { 
              font-size: 20px; 
              font-weight: bold; 
              margin-bottom: 4px; 
            }
            .title { 
              font-size: 16px; 
              color: #666; 
              margin-bottom: 2px; 
            }
            .era { 
              font-size: 14px; 
              color: #666; 
            }
            .quote-box { 
              text-align: center; 
              margin: 24px 0; 
              padding: 24px; 
              background: rgba(255,255,255,0.9); 
              border-radius: 8px; 
              position: relative; 
              min-height: 80px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
            }
            .quote-text { 
              font-size: 18px; 
              font-weight: bold; 
              line-height: 1.4; 
              color: #1976d2; 
              font-style: italic; 
              max-width: 320px; 
              word-break: break-word; 
              overflow-wrap: break-word; 
            }
            .meta { 
              text-align: center; 
              margin: 20px 0; 
              color: #666; 
            }
            .meeting { 
              font-size: 14px; 
              margin-bottom: 4px; 
            }
            .date { 
              font-size: 12px; 
            }
            .footer { 
              border-top: 1px solid #e0e0e0; 
              padding-top: 16px; 
              margin-top: 20px; 
              text-align: center; 
            }
            .brand { 
              font-size: 16px; 
              font-weight: bold; 
              color: #1976d2; 
              margin-bottom: 8px; 
            }
            .url { 
              font-size: 12px; 
              color: #666; 
            }
          </style>
        </head>
        <body>
          <div class="decor"></div>
          <div class="header">
            <div class="category">${(cardData.analysis.category || '发言').replace(/[^\u4e00-\u9fff\u0030-\u0039\u0041-\u005a\u0061-\u007a]/g, '')}</div>
            <div class="round">第${cardData.round_number}轮发言</div>
          </div>
          <div class="director-info">
            <div class="avatar">${cardData.director.name ? cardData.director.name[0] : 'A'}</div>
            <div>
              <div class="name">${(cardData.director.name || '匿名董事').replace(/[^\u4e00-\u9fff\u0030-\u0039\u0041-\u005a\u0061-\u007a]/g, '')}</div>
              <div class="title">${(cardData.director.title || '董事会成员').replace(/[^\u4e00-\u9fff\u0030-\u0039\u0041-\u005a\u0061-\u007a]/g, '')}</div>
              <div class="era">${(cardData.director.era || '现代').replace(/[^\u4e00-\u9fff\u0030-\u0039\u0041-\u005a\u0061-\u007a]/g, '')}</div>
            </div>
          </div>
          <div class="quote-box">
            <div class="quote-text">${(cardData.analysis.highlight_quote || cardData.content || '精彩发言').replace(/[^\u4e00-\u9fff\u0030-\u0039\u0041-\u005a\u0061-\u007a\u3000-\u303f\uff00-\uffef\s.,!?;:()"""''，。！？；：（）]/g, '')}</div>
          </div>
          <div class="meta">
            <div class="meeting">来自会议：${(cardData.meeting.title || '未知会议').replace(/[^\u4e00-\u9fff\u0030-\u0039\u0041-\u005a\u0061-\u007a\s]/g, '')}</div>
            <div class="date">${format(new Date(cardData.created_at), 'yyyy年MM月dd日', { locale: zhCN })}</div>
          </div>
          <div class="footer">
            <div class="brand">私人董事会</div>
            <div class="url">dongshihui.xyz 与历史人物共商大事</div>
          </div>
        </body>
        </html>
      `);
      iframeDoc.close();
      
      // 等待iframe加载完成
      await new Promise(resolve => {
        if (iframe.contentWindow.document.readyState === 'complete') {
          resolve();
        } else {
          iframe.onload = resolve;
        }
      });
      
      // 使用html2canvas转换iframe内容
      const canvas = await html2canvas(iframe.contentDocument.body, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        removeContainer: false,
        imageTimeout: 0,
        logging: false,
        width: 480,
        height: 600
      });
      
      // 清理iframe
      document.body.removeChild(iframe);
      
      return canvas;
    } catch (error) {
      console.error('生成图片失败:', error);
      toast.error('生成图片失败');
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadImage = async () => {
    const canvas = await handleGenerateImage();
    if (!canvas) return;
    
    try {
      // 将canvas转换为blob并下载
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `金句卡片-${cardData.director.name}-${format(new Date(cardData.created_at), 'yyyyMMdd-HHmm')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('长图已下载到本地');
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('下载图片失败:', error);
      toast.error('下载失败');
    }
  };

  const handleShareImage = async () => {
    const canvas = await handleGenerateImage();
    if (!canvas) return;
    
    try {
      // 尝试使用Web Share API分享图片
      if (navigator.share && navigator.canShare) {
        canvas.toBlob(async (blob) => {
          const file = new File([blob], `金句卡片-${cardData.director.name}.png`, { type: 'image/png' });
          
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: `${cardData.director.name}的金句`,
                text: `"${cardData.analysis.highlight_quote || cardData.content}" —— ${cardData.director.name}`,
                files: [file]
              });
            } catch (shareError) {
              // 如果分享失败，退回到下载
              await handleDownloadImage();
            }
          } else {
            await handleDownloadImage();
          }
        }, 'image/png', 1.0);
      } else {
        // 不支持Web Share API，直接下载
        await handleDownloadImage();
      }
    } catch (error) {
      console.error('分享图片失败:', error);
      toast.error('分享失败');
    }
  };

  const handleDownload = async () => {
    if (!cardData || !cardRef.current) return;

    try {
      // 提供文本版本的备选方案
      const cardText = `${cardData.director.name}（${cardData.director.title}）

"${cardData.content}"

来自会议：${cardData.meeting.title}
话题：${cardData.meeting.topic}
发言时间：${format(new Date(cardData.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}

关键词：${cardData.analysis.keywords.join(', ')}
分类：${cardData.analysis.category}

—— 私人董事会系统`;

      await navigator.clipboard.writeText(cardText);
      toast.success('卡片内容已复制到剪贴板');
    } catch (error) {
      toast.error('复制失败');
    }
  };

  if (isLoading) {
    return (
      <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            正在生成金句卡片...
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  if (!cardData) {
    return (
      <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="error">
            卡片生成失败
          </Typography>
          <Button onClick={onClose} sx={{ mt: 2 }}>
            关闭
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ position: 'relative' }}>
          <IconButton
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>

          <Paper 
            ref={cardRef}
            sx={{ 
              p: 4,
              background: `linear-gradient(135deg, ${cardData.analysis.theme_color}22 0%, ${cardData.analysis.theme_color}11 100%)`,
              border: `2px solid ${cardData.analysis.theme_color}`,
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              width: 480, // 固定宽度，适合分享
              minHeight: 600, // 最小高度
              margin: '0 auto'
            }}
          >
            {/* 装饰性背景 */}
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                background: `radial-gradient(circle, ${cardData.analysis.theme_color}15 0%, transparent 70%)`,
                borderRadius: '50%'
              }}
            />

            {/* 分类标签 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Chip 
                label={cardData.analysis.category} 
                sx={{ 
                  backgroundColor: cardData.analysis.theme_color,
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
              <Typography variant="caption" color="text.secondary">
                第{cardData.round_number}轮发言
              </Typography>
            </Box>

            {/* 董事信息 */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar 
                src={cardData.director.avatar_url}
                sx={{ 
                  width: 60, 
                  height: 60, 
                  mr: 2,
                  border: `3px solid ${cardData.analysis.theme_color}`
                }}
              >
                {cardData.director.name?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {cardData.director.name}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {cardData.director.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {cardData.director.era}
                </Typography>
              </Box>
            </Box>

            {/* 核心金句 */}
            <Box 
              sx={{ 
                textAlign: 'center',
                mb: 3,
                p: 3,
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: 2,
                position: 'relative'
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  fontStyle: 'italic',
                  lineHeight: 1.4,
                  color: cardData.analysis.theme_color,
                  fontWeight: 500,
                  position: 'relative',
                  '&::before': {
                    content: '"',
                    fontSize: '3em',
                    position: 'absolute',
                    left: -20,
                    top: -20,
                    opacity: 0.3,
                    color: cardData.analysis.theme_color
                  },
                  '&::after': {
                    content: '"',
                    fontSize: '3em',
                    position: 'absolute',
                    right: -20,
                    bottom: -30,
                    opacity: 0.3,
                    color: cardData.analysis.theme_color
                  }
                }}
              >
                {cardData.analysis.highlight_quote || cardData.content}
              </Typography>
            </Box>

            {/* 关键词 */}
            {cardData.analysis.keywords.length > 0 && (
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                {cardData.analysis.keywords.map((keyword, index) => (
                  <Chip 
                    key={index}
                    label={keyword} 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      mr: 0.5, 
                      mb: 0.5,
                      borderColor: cardData.analysis.theme_color,
                      color: cardData.analysis.theme_color
                    }}
                  />
                ))}
              </Box>
            )}

            {/* 会议信息 */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                来自会议：{cardData.meeting.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(cardData.created_at), 'yyyy年MM月dd日', { locale: zhCN })}
              </Typography>
            </Box>

            {/* 品牌标识和网站信息 */}
            <Box sx={{ 
              textAlign: 'center', 
              borderTop: 1, 
              borderColor: 'divider', 
              pt: 2,
              mt: 2
            }}>
              <Typography variant="body2" color="text.secondary" fontWeight="bold" sx={{ mb: 1 }}>
                私人董事会
              </Typography>
              <Typography variant="caption" color="text.secondary">
                dongshihui.xyz 与历史人物共商大事
              </Typography>
            </Box>
          </Paper>

          {/* 操作按钮 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 3, pb: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={isGeneratingImage ? <CircularProgress size={16} color="inherit" /> : <ImageIcon />}
              onClick={handleShareImage}
              disabled={isGeneratingImage}
              sx={{ 
                backgroundColor: cardData.analysis.theme_color,
                minWidth: 120
              }}
            >
              {isGeneratingImage ? '生成中...' : '分享长图'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleShare}
              sx={{ 
                borderColor: cardData.analysis.theme_color, 
                color: cardData.analysis.theme_color,
                minWidth: 100
              }}
            >
              分享文本
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ 
                borderColor: cardData.analysis.theme_color, 
                color: cardData.analysis.theme_color,
                minWidth: 100
              }}
            >
              复制内容
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteCard;