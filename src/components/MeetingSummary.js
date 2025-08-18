import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Divider,
  Rating,
  CircularProgress
} from '@mui/material';
import {
  Lightbulb as InsightIcon,
  TrendingUp as AgreementIcon,
  Warning as DisagreementIcon,
  Star as HighlightIcon,
  ArrowForward as NextStepIcon,
  Assessment as RatingIcon,
  Share as ShareIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import toast from 'react-hot-toast';

const MeetingSummary = ({ meetingId, meetingTitle, onClose }) => {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const handleGenerateSummary = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://dongshihui-api.jieshu2023.workers.dev/meetings/${meetingId}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setSummary(result.data.summary);
        setIsGenerated(true);
        toast.success('会议摘要生成成功！');
      } else {
        toast.error(result.error || '生成摘要失败');
      }
    } catch (error) {
      console.error('生成摘要失败:', error);
      toast.error('生成摘要失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!summary) return;

    const shareText = `【${meetingTitle} - 会议摘要】

核心要点：
${summary.executive_summary}

主要观点：
${summary.key_points.map((point, index) => `${index + 1}. ${point}`).join('\n')}

参与董事亮点：
${summary.participant_highlights.map(h => `• ${h.director}：${h.key_contribution}`).join('\n')}

来自私人董事会系统`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${meetingTitle} - 会议摘要`,
          text: shareText,
          url: window.location.origin
        });
      } catch (error) {
        // 用户取消分享
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('摘要已复制到剪贴板');
      } catch (error) {
        toast.error('分享失败');
      }
    }
  };

  const handleDownload = async () => {
    if (!summary) return;

    const fullReport = `私人董事会系统 - 会议摘要报告

会议标题：${meetingTitle}
生成时间：${format(new Date(), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}

═══════════════════════════════════════

【执行摘要】
${summary.executive_summary}

【关键要点】
${summary.key_points.map((point, index) => `${index + 1}. ${point}`).join('\n')}

【达成共识】
${summary.agreements.map((agreement, index) => `• ${agreement}`).join('\n') || '暂无明确共识'}

【争议分歧】
${summary.disagreements.map((disagreement, index) => `• ${disagreement}`).join('\n') || '暂无重大分歧'}

【深度洞察】
${summary.insights.map((insight, index) => `• ${insight}`).join('\n') || '暂无特殊洞察'}

【参与董事亮点】
${summary.participant_highlights.map(h => `• ${h.director}（${h.key_contribution}）`).join('\n')}

【后续方向】
${summary.next_steps.map((step, index) => `${index + 1}. ${step}`).join('\n') || '暂无后续建议'}

【质量评分】
讨论深度：${summary.rating.depth}/10
争议程度：${summary.rating.controversy}/10
洞察价值：${summary.rating.insight}/10

═══════════════════════════════════════

本报告由私人董事会系统AI自动生成
生成模型：Claude Sonnet 4`;

    try {
      await navigator.clipboard.writeText(fullReport);
      toast.success('完整报告已复制到剪贴板');
    } catch (error) {
      toast.error('下载失败');
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            会议AI摘要
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {meetingTitle}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {!isGenerated ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {isLoading ? (
              <>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  AI正在分析会议内容，生成智能摘要...
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  生成AI会议摘要
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  AI将分析整场会议的发言内容，提取关键观点、共识分歧、深度洞察等
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGenerateSummary}
                  startIcon={<InsightIcon />}
                >
                  开始生成摘要
                </Button>
              </>
            )}
          </Box>
        ) : summary && (
          <Box>
            {/* 执行摘要 */}
            <Paper sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                执行摘要
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.6, color: '#333' }}>
                {summary.executive_summary}
              </Typography>
            </Paper>

            <Grid container spacing={3}>
              {/* 关键要点 */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <InsightIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    关键要点
                  </Typography>
                  <List dense>
                    {summary.key_points.map((point, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={`${index + 1}. ${point}`} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* 参与董事亮点 */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <HighlightIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    董事亮点
                  </Typography>
                  <List dense>
                    {summary.participant_highlights.map((highlight, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={highlight.director}
                          secondary={highlight.key_contribution}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* 共识与分歧 */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom color="success.main">
                    <AgreementIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    达成共识
                  </Typography>
                  {summary.agreements.length > 0 ? (
                    <List dense>
                      {summary.agreements.map((agreement, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={`• ${agreement}`} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      暂无明确共识
                    </Typography>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom color="warning.main">
                    <DisagreementIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    争议分歧
                  </Typography>
                  {summary.disagreements.length > 0 ? (
                    <List dense>
                      {summary.disagreements.map((disagreement, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={`• ${disagreement}`} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      暂无重大分歧
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* 深度洞察 */}
              {summary.insights.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom color="info.main">
                      💡 深度洞察
                    </Typography>
                    <List dense>
                      {summary.insights.map((insight, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={`• ${insight}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              )}

              {/* 质量评分 */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <RatingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    讨论质量评分
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="body2" gutterBottom>讨论深度</Typography>
                        <Rating value={summary.rating.depth / 2} precision={0.5} readOnly />
                        <Typography variant="caption" color="text.secondary">
                          {summary.rating.depth}/10
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="body2" gutterBottom>争议程度</Typography>
                        <Rating value={summary.rating.controversy / 2} precision={0.5} readOnly />
                        <Typography variant="caption" color="text.secondary">
                          {summary.rating.controversy}/10
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box textAlign="center">
                        <Typography variant="body2" gutterBottom>洞察价值</Typography>
                        <Rating value={summary.rating.insight / 2} precision={0.5} readOnly />
                        <Typography variant="caption" color="text.secondary">
                          {summary.rating.insight}/10
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* 后续建议 */}
              {summary.next_steps.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <NextStepIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      后续探讨方向
                    </Typography>
                    <List dense>
                      {summary.next_steps.map((step, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={`${index + 1}. ${step}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {isGenerated && summary && (
          <>
            <Button startIcon={<ShareIcon />} onClick={handleShare}>
              分享摘要
            </Button>
            <Button startIcon={<DownloadIcon />} onClick={handleDownload}>
              下载报告
            </Button>
          </>
        )}
        <Button onClick={onClose}>
          关闭
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MeetingSummary;