const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');

// 会议管理路由

// 创建新会议
router.post('/', meetingController.createMeeting);

// 获取会议列表
router.get('/', meetingController.getMeetings);

// 获取单个会议详情
router.get('/:id', meetingController.getMeeting);

// 开始会议
router.post('/:id/start', meetingController.startMeeting);

// 暂停会议
router.post('/:id/pause', meetingController.pauseMeeting);

// 结束会议
router.post('/:id/finish', meetingController.finishMeeting);

// 生成下一个发言
router.post('/:id/next-statement', meetingController.generateNextStatement);

// 恢复暂停的会议
router.post('/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;
    const Meeting = require('../models/Meeting');
    
    const meeting = await Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: '会议不存在'
      });
    }

    if (meeting.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: '只有暂停的会议才能恢复'
      });
    }

    meeting.status = 'discussing';
    await meeting.save();

    res.json({
      success: true,
      message: '会议已恢复',
      data: { meeting_id: meeting.id, status: meeting.status }
    });

  } catch (error) {
    console.error('❌ 恢复会议失败:', error);
    res.status(500).json({
      success: false,
      message: '恢复会议失败: ' + error.message
    });
  }
});

// 获取会议统计
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const Meeting = require('../models/Meeting');
    const Statement = require('../models/Statement');
    const MeetingParticipant = require('../models/MeetingParticipant');
    const Director = require('../models/Director');

    const meeting = await Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: '会议不存在'
      });
    }

    // 获取发言统计
    const statementStats = await Statement.findAll({
      where: { meeting_id: id },
      attributes: [
        'director_id',
        [Statement.sequelize.fn('COUNT', '*'), 'statement_count'],
        [Statement.sequelize.fn('AVG', Statement.sequelize.col('tokens_used')), 'avg_tokens']
      ],
      group: ['director_id'],
      include: [
        {
          model: Director,
          attributes: ['name', 'title', 'avatar_url']
        }
      ]
    });

    // 获取轮次统计
    const roundStats = await Statement.findAll({
      where: { meeting_id: id },
      attributes: [
        'round_number',
        [Statement.sequelize.fn('COUNT', '*'), 'statement_count']
      ],
      group: ['round_number'],
      order: [['round_number', 'ASC']]
    });

    // 计算会议时长
    const duration = meeting.getDuration();

    res.json({
      success: true,
      data: {
        meeting_info: {
          id: meeting.id,
          title: meeting.title,
          status: meeting.status,
          duration: duration,
          total_statements: meeting.total_statements,
          current_round: meeting.current_round,
          max_rounds: meeting.max_rounds
        },
        participant_stats: statementStats,
        round_stats: roundStats
      }
    });

  } catch (error) {
    console.error('❌ 获取会议统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取会议统计失败: ' + error.message
    });
  }
});

// 获取会议发言记录
router.get('/:id/statements', async (req, res) => {
  try {
    const { id } = req.params;
    const { round, limit = 50, offset = 0 } = req.query;
    const Statement = require('../models/Statement');
    const Director = require('../models/Director');

    const statements = await Statement.getByMeeting(id, {
      round: round ? parseInt(round) : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: statements
    });

  } catch (error) {
    console.error('❌ 获取发言记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取发言记录失败: ' + error.message
    });
  }
});

// 添加会议参与者
router.post('/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;
    const { director_ids } = req.body;
    
    const Meeting = require('../models/Meeting');
    const MeetingParticipant = require('../models/MeetingParticipant');
    const Director = require('../models/Director');

    const meeting = await Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: '会议不存在'
      });
    }

    if (meeting.status !== 'preparing') {
      return res.status(400).json({
        success: false,
        message: '只有准备中的会议才能添加参与者'
      });
    }

    // 验证董事存在
    const directors = await Director.findAll({
      where: {
        id: director_ids,
        is_active: true
      }
    });

    if (directors.length !== director_ids.length) {
      return res.status(400).json({
        success: false,
        message: '部分董事不存在或未激活'
      });
    }

    // 检查是否已经参与
    const existingParticipants = await MeetingParticipant.findAll({
      where: {
        meeting_id: id,
        director_id: director_ids
      }
    });

    if (existingParticipants.length > 0) {
      return res.status(400).json({
        success: false,
        message: '部分董事已经在会议中'
      });
    }

    // 获取当前参与者数量
    const currentParticipantCount = await MeetingParticipant.count({
      where: { meeting_id: id }
    });

    if (currentParticipantCount + director_ids.length > meeting.max_participants) {
      return res.status(400).json({
        success: false,
        message: '超出最大参与者限制'
      });
    }

    // 添加参与者
    const participants = [];
    for (let i = 0; i < director_ids.length; i++) {
      const participant = await MeetingParticipant.create({
        meeting_id: id,
        director_id: director_ids[i],
        join_order: currentParticipantCount + i + 1,
        status: 'joined'
      });
      participants.push(participant);
    }

    // 更新会议参与者总数
    meeting.total_participants = currentParticipantCount + director_ids.length;
    await meeting.save();

    res.json({
      success: true,
      message: '参与者添加成功',
      data: participants
    });

  } catch (error) {
    console.error('❌ 添加参与者失败:', error);
    res.status(500).json({
      success: false,
      message: '添加参与者失败: ' + error.message
    });
  }
});

// 移除会议参与者
router.delete('/:id/participants/:participantId', async (req, res) => {
  try {
    const { id, participantId } = req.params;
    
    const Meeting = require('../models/Meeting');
    const MeetingParticipant = require('../models/MeetingParticipant');

    const meeting = await Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: '会议不存在'
      });
    }

    if (!['preparing', 'paused'].includes(meeting.status)) {
      return res.status(400).json({
        success: false,
        message: '只有准备中或暂停的会议才能移除参与者'
      });
    }

    const participant = await MeetingParticipant.findOne({
      where: {
        id: participantId,
        meeting_id: id
      }
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: '参与者不存在'
      });
    }

    await participant.leave();

    res.json({
      success: true,
      message: '参与者已移除'
    });

  } catch (error) {
    console.error('❌ 移除参与者失败:', error);
    res.status(500).json({
      success: false,
      message: '移除参与者失败: ' + error.message
    });
  }
});

module.exports = router;