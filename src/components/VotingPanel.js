import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Alert,
  LinearProgress,
  Chip,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  HowToVote as VoteIcon,
  ThumbUp as AgreeIcon,
  ThumbDown as DisagreeIcon,
  HelpOutline as AbstainIcon
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { meetingAPI } from '../services/api';

const VotingPanel = ({ meeting, participants }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const queryClient = useQueryClient();
  
  const [voteChoice, setVoteChoice] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  // 获取投票结果
  const { data: votingResults, refetch: refetchResults } = useQuery(
    ['votingResults', meeting.id],
    () => meetingAPI.getVotingResults(meeting.id),
    {
      enabled: meeting.voting_status === 'active' || meeting.voting_status === 'ended',
      refetchInterval: meeting.voting_status === 'active' ? 3000 : false,
      onError: (err) => {
        console.error('获取投票结果失败:', err);
      }
    }
  );

  // 发起投票
  const startVotingMutation = useMutation(
    (votingData) => meetingAPI.startVoting(meeting.id, votingData),
    {
      onSuccess: () => {
        toast.success('投票已发起！');
        queryClient.invalidateQueries(['meeting', meeting.id]);
      },
      onError: (err) => {
        toast.error('发起投票失败: ' + err.message);
      }
    }
  );

  // 提交投票
  const submitVoteMutation = useMutation(
    (voteData) => meetingAPI.submitVote(meeting.id, voteData),
    {
      onSuccess: () => {
        toast.success('投票已提交！');
        setHasVoted(true);
        refetchResults();
      },
      onError: (err) => {
        toast.error('提交投票失败: ' + err.message);
      }
    }
  );

  // 结束投票
  const endVotingMutation = useMutation(
    () => meetingAPI.endVoting(meeting.id),
    {
      onSuccess: () => {
        toast.success('投票已结束！');
        queryClient.invalidateQueries(['meeting', meeting.id]);
      },
      onError: (err) => {
        toast.error('结束投票失败: ' + err.message);
      }
    }
  );

  const handleStartVoting = () => {
    const votingData = {
      title: meeting.title,
      description: meeting.topic,
      options: ['赞成', '反对', '弃权']
    };
    startVotingMutation.mutate(votingData);
  };

  const handleSubmitVote = () => {
    if (!voteChoice) {
      toast.error('请选择投票选项');
      return;
    }

    const voteData = {
      vote: voteChoice,
      voter_id: 'user' // 在实际应用中，这应该是当前用户的ID
    };
    
    submitVoteMutation.mutate(voteData);
  };

  const voteOptions = [
    { value: 'agree', label: '赞成', icon: <AgreeIcon />, color: '#4CAF50' },
    { value: 'disagree', label: '反对', icon: <DisagreeIcon />, color: '#F44336' },
    { value: 'abstain', label: '弃权', icon: <AbstainIcon />, color: '#FF9800' }
  ];

  // 计算投票结果
  const votingData = votingResults?.data?.data;
  const totalVotes = votingData?.votes?.length || 0;
  const voteStats = votingData?.votes?.reduce((acc, vote) => {
    acc[vote.vote] = (acc[vote.vote] || 0) + 1;
    return acc;
  }, {}) || {};

  // 显示条件：董事会模式且达到一定轮次
  if (meeting.discussion_mode !== 'board' || meeting.current_round < 2) {
    return null;
  }

  return (
    <Paper sx={{ p: isMobile ? 2 : 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <VoteIcon color="primary" sx={{ fontSize: isMobile ? 24 : 28 }} />
        <Typography variant={isMobile ? "h6" : "h5"} component="h2" fontWeight="bold">
          投票表决
        </Typography>
      </Box>

      {/* 还未发起投票 */}
      {!meeting.voting_status && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            董事会讨论已进行了 {meeting.current_round} 轮，可以发起投票表决了。
          </Alert>
          
          <Typography variant="h6" gutterBottom>
            表决议题：{meeting.title}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {meeting.topic}
          </Typography>

          <Button
            variant="contained"
            startIcon={<VoteIcon />}
            onClick={handleStartVoting}
            disabled={startVotingMutation.isLoading}
            size={isMobile ? 'large' : 'medium'}
            sx={{ minHeight: isMobile ? 48 : 'auto' }}
          >
            {startVotingMutation.isLoading ? '发起中...' : '发起投票'}
          </Button>
        </Box>
      )}

      {/* 投票进行中 */}
      {meeting.voting_status === 'active' && (
        <Box>
          <Alert severity="success" sx={{ mb: 3 }}>
            投票正在进行中，请各位董事表决！
          </Alert>

          {!hasVoted ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                请就以下议题进行表决：
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {meeting.topic}
              </Typography>

              <RadioGroup
                value={voteChoice}
                onChange={(e) => setVoteChoice(e.target.value)}
                sx={{ mb: 3 }}
              >
                {voteOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio sx={{ color: option.color }} />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: option.color }}>{option.icon}</Box>
                        <Typography>{option.label}</Typography>
                      </Box>
                    }
                    sx={{
                      border: '1px solid',
                      borderColor: voteChoice === option.value ? option.color : 'divider',
                      borderRadius: 1,
                      p: 1,
                      mb: 1,
                      backgroundColor: voteChoice === option.value ? `${option.color}15` : 'transparent'
                    }}
                  />
                ))}
              </RadioGroup>

              <Button
                variant="contained"
                onClick={handleSubmitVote}
                disabled={!voteChoice || submitVoteMutation.isLoading}
                size={isMobile ? 'large' : 'medium'}
                sx={{ minHeight: isMobile ? 48 : 'auto' }}
              >
                {submitVoteMutation.isLoading ? '提交中...' : '提交投票'}
              </Button>
            </Box>
          ) : (
            <Alert severity="success">
              您已完成投票，等待其他董事表决中...
            </Alert>
          )}

          {/* 实时投票统计 */}
          {totalVotes > 0 && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                投票进度：{totalVotes}/{participants.length}
              </Typography>
              
              <LinearProgress 
                variant="determinate" 
                value={(totalVotes / participants.length) * 100} 
                sx={{ mb: 2, height: 8, borderRadius: 4 }}
              />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {voteOptions.map((option) => {
                  const count = voteStats[option.value] || 0;
                  const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : 0;
                  
                  return (
                    <Chip
                      key={option.value}
                      icon={option.icon}
                      label={`${option.label}: ${count} (${percentage}%)`}
                      sx={{ 
                        backgroundColor: `${option.color}20`,
                        color: option.color,
                        fontWeight: 600
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          )}

          {/* 结束投票按钮 */}
          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => endVotingMutation.mutate()}
              disabled={endVotingMutation.isLoading}
              size="small"
            >
              {endVotingMutation.isLoading ? '结束中...' : '结束投票'}
            </Button>
          </Box>
        </Box>
      )}

      {/* 投票已结束 */}
      {meeting.voting_status === 'ended' && votingData && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            投票已结束，以下是最终表决结果：
          </Alert>

          <Typography variant="h6" gutterBottom>
            表决结果
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            {voteOptions.map((option) => {
              const count = voteStats[option.value] || 0;
              const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : 0;
              
              return (
                <Chip
                  key={option.value}
                  icon={option.icon}
                  label={`${option.label}: ${count}票 (${percentage}%)`}
                  size={isMobile ? 'medium' : 'large'}
                  sx={{ 
                    backgroundColor: `${option.color}20`,
                    color: option.color,
                    fontWeight: 600,
                    fontSize: isMobile ? '0.875rem' : '1rem'
                  }}
                />
              );
            })}
          </Box>

          {/* 表决结论 */}
          <Box sx={{ mt: 3, p: 2, backgroundColor: '#F5F5F5', borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              表决结论：
            </Typography>
            <Typography variant="body1">
              {voteStats.agree > voteStats.disagree 
                ? '✅ 议案通过' 
                : voteStats.agree < voteStats.disagree 
                  ? '❌ 议案否决'
                  : '⚖️ 票数相等，需要进一步讨论'}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              总投票数：{totalVotes}/{participants.length}
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default VotingPanel;