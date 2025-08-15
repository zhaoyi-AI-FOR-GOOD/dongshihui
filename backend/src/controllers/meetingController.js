const Meeting = require('../models/Meeting');
const MeetingParticipant = require('../models/MeetingParticipant');
const Statement = require('../models/Statement');
const Director = require('../models/Director');
const { claudeService } = require('../services/claudeService');
const { Op } = require('sequelize');

// Helper functions
async function generateStatement(meeting, director, round, sequence, type = 'statement') {
  try {
    // 获取会议上下文
    const recentStatements = await Statement.findAll({
      where: { meeting_id: meeting.id },
      include: [
        {
          model: Director,
          as: 'Director',
          attributes: ['name', 'title']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // 构建prompt
    let prompt = `${director.system_prompt}\n\n`;
    prompt += `会议主题：${meeting.topic}\n\n`;
    
    if (type === 'opening') {
      prompt += `这是会议的开始，请做一个简短的开场发言，表达你对这个话题的初步看法。`;
    } else if (type === 'closing') {
      prompt += `这是会议的结束，请做一个总结性发言，回顾讨论并表达最终观点。`;
    } else {
      prompt += `这是第${round}轮讨论，你是第${sequence}个发言的人。`;
      
      if (recentStatements.length > 0) {
        prompt += `\n\n最近的发言：\n`;
        recentStatements.reverse().forEach(stmt => {
          prompt += `${stmt.Director.name}(${stmt.Director.title})：${stmt.content}\n\n`;
        });
      }
      
      prompt += `请根据以上内容，以你的身份和观点进行回应或发表新的见解。`;
    }
    
    prompt += `\n\n请保持发言简洁明了，控制在200字以内，体现你的个人特色和专业背景。`;

    // 调用Claude API
    const response = await claudeService.generateResponse(prompt);
    
    if (response.success) {
      return response.content;
    } else {
      // 使用fallback内容
      return getFallbackStatement(director, type, meeting.topic);
    }

  } catch (error) {
    console.error('❌ 生成发言内容失败:', error);
    return getFallbackStatement(director, type, meeting.topic);
  }
}

// 获取备用发言内容
function getFallbackStatement(director, type, topic) {
  const fallbacks = {
    opening: [
      `作为${director.title}，我认为这个关于"${topic}"的话题非常重要，值得我们深入讨论。`,
      `从我的经验来看，"${topic}"这一议题需要我们仔细考虑各个方面。`,
      `我很高兴能参与这次关于"${topic}"的讨论，这确实是一个值得关注的话题。`
    ],
    closing: [
      `经过这次讨论，我对"${topic}"有了更深的理解，感谢各位的真知灼见。`,
      `这次会议让我受益匪浅，关于"${topic}"的各种观点都很有价值。`,
      `总结来说，"${topic}"确实是一个复杂的议题，需要我们继续关注和思考。`
    ],
    statement: [
      `关于这个话题，我认为我们需要从多个角度来审视。`,
      `基于我的经验，我想补充一些观点。`,
      `我同意之前发言者的部分观点，但我想提出一些不同的看法。`
    ]
  };

  const options = fallbacks[type] || fallbacks.statement;
  return options[Math.floor(Math.random() * options.length)];
}

// 获取下一个发言者
async function getNextSpeaker(meeting, participants) {
  const statements = await Statement.findAll({
    where: {
      meeting_id: meeting.id,
      round_number: meeting.current_round
    },
    order: [['sequence_in_round', 'ASC']]
  });

  let nextIndex, sequenceInRound;

  switch (meeting.discussion_mode) {
    case 'round_robin':
      nextIndex = statements.length % participants.length;
      sequenceInRound = statements.length + 1;
      break;
    
    case 'free':
      // 随机选择
      nextIndex = Math.floor(Math.random() * participants.length);
      sequenceInRound = statements.length + 1;
      break;
    
    case 'debate':
      // 辩论模式：轮流对立观点
      nextIndex = statements.length % 2;
      sequenceInRound = statements.length + 1;
      break;
    
    default:
      nextIndex = 0;
      sequenceInRound = 1;
  }

  const participant = participants[nextIndex];
  const director = await Director.findByPk(participant.director_id);

  return { director, sequence: sequenceInRound };
}

// 生成会议摘要
async function generateMeetingSummary(meeting) {
  try {
    const statements = await Statement.findAll({
      where: { meeting_id: meeting.id },
      include: [
        {
          model: Director,
          as: 'Director',
          attributes: ['name', 'title']
        }
      ],
      order: [['created_at', 'ASC']]
    });

    if (statements.length === 0) {
      return;
    }

    let summaryPrompt = `请为以下董事会会议生成一份简洁的摘要：\n\n`;
    summaryPrompt += `会议主题：${meeting.topic}\n`;
    summaryPrompt += `参与人数：${meeting.total_participants}人\n`;
    summaryPrompt += `发言总数：${statements.length}条\n\n`;
    summaryPrompt += `会议内容：\n`;

    statements.forEach((stmt, index) => {
      summaryPrompt += `${index + 1}. ${stmt.Director.name}：${stmt.content}\n`;
    });

    summaryPrompt += `\n请生成一份300字以内的会议摘要，包括：\n1. 主要讨论点\n2. 不同观点\n3. 达成的共识（如有）\n4. 待解决的问题`;

    const response = await claudeService.generateResponse(summaryPrompt);
    
    if (response.success) {
      meeting.summary = response.content;
      await meeting.save();
    }

  } catch (error) {
    console.error('❌ 生成会议摘要失败:', error);
  }
}

class MeetingController {
  
  // 创建新会议
  async createMeeting(req, res) {
    try {
      const {
        title,
        description,
        topic,
        discussion_mode = 'round_robin',
        max_rounds = 10,
        max_participants = 8,
        director_ids = []
      } = req.body;

      // 验证必要字段
      if (!title || !topic) {
        return res.status(400).json({
          success: false,
          message: '标题和讨论话题为必填项'
        });
      }

      // 验证参与董事
      if (director_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '至少需要选择一位董事参与会议'
        });
      }

      if (director_ids.length > max_participants) {
        return res.status(400).json({
          success: false,
          message: `参与董事数量不能超过${max_participants}人`
        });
      }

      // 验证董事是否存在且活跃
      const directors = await Director.findAll({
        where: {
          id: director_ids,
          is_active: true,
          status: 'active'
        }
      });

      if (directors.length !== director_ids.length) {
        return res.status(400).json({
          success: false,
          message: '部分董事不存在或未激活'
        });
      }

      // 创建会议
      const meeting = await Meeting.create({
        title,
        description,
        topic,
        discussion_mode,
        max_rounds,
        max_participants,
        total_participants: director_ids.length,
        status: 'preparing'
      });

      // 添加参与者
      const participants = [];
      for (let i = 0; i < director_ids.length; i++) {
        const participant = await MeetingParticipant.create({
          meeting_id: meeting.id,
          director_id: director_ids[i],
          join_order: i + 1,
          status: 'joined'
        });
        participants.push(participant);
      }

      // 获取完整的会议信息
      const meetingWithParticipants = await Meeting.findByPk(meeting.id, {
        include: [
          {
            model: MeetingParticipant,
            as: 'participants',
            include: [
              {
                model: Director,
                as: 'director',
                attributes: ['id', 'name', 'title', 'avatar_url']
              }
            ]
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: '会议创建成功',
        data: meetingWithParticipants
      });

    } catch (error) {
      console.error('❌ 创建会议失败:', error);
      res.status(500).json({
        success: false,
        message: '创建会议失败: ' + error.message
      });
    }
  }

  // 获取会议列表
  async getMeetings(req, res) {
    try {
      const {
        status = 'all',
        limit = 20,
        offset = 0,
        search = ''
      } = req.query;

      // 构建查询条件
      const whereClause = {};
      
      if (status !== 'all') {
        whereClause.status = status;
      }

      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { topic: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // 获取总数
      const total = await Meeting.count({ where: whereClause });

      // 获取会议列表
      const meetings = await Meeting.findAll({
        where: whereClause,
        include: [
          {
            model: MeetingParticipant,
            as: 'participants',
            include: [
              {
                model: Director,
                as: 'director',
                attributes: ['id', 'name', 'title', 'avatar_url']
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          meetings,
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('❌ 获取会议列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取会议列表失败: ' + error.message
      });
    }
  }

  // 获取单个会议详情
  async getMeeting(req, res) {
    try {
      const { id } = req.params;

      const meeting = await Meeting.findByPk(id, {
        include: [
          {
            model: MeetingParticipant,
            as: 'participants',
            include: [
              {
                model: Director,
                as: 'director',
                attributes: ['id', 'name', 'title', 'avatar_url', 'system_prompt']
              }
            ],
            order: [['join_order', 'ASC']]
          },
          {
            model: Statement,
            as: 'statements',
            include: [
              {
                model: Director,
                as: 'Director',
                attributes: ['id', 'name', 'title', 'avatar_url']
              }
            ],
            order: [['round_number', 'ASC'], ['sequence_in_round', 'ASC']]
          }
        ]
      });

      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: '会议不存在'
        });
      }

      res.json({
        success: true,
        data: meeting
      });

    } catch (error) {
      console.error('❌ 获取会议详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取会议详情失败: ' + error.message
      });
    }
  }

  // 开始会议
  async startMeeting(req, res) {
    try {
      const { id } = req.params;

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
          message: '只有准备中的会议才能开始'
        });
      }

      // 开始会议
      await meeting.start();

      // 生成开场发言
      const participants = await MeetingParticipant.getActiveByMeeting(id);
      if (participants.length > 0) {
        const firstParticipant = participants[0];
        const director = await Director.findByPk(firstParticipant.director_id);
        
        // 生成开场发言
        const openingStatement = await generateStatement(
          meeting, 
          director, 
          1, 
          1, 
          'opening'
        );

        if (openingStatement) {
          await Statement.create({
            meeting_id: meeting.id,
            director_id: director.id,
            content: openingStatement,
            content_type: 'opening',
            round_number: 1,
            sequence_in_round: 1
          });

          await firstParticipant.incrementStatement();
          await meeting.increment('total_statements');
        }
      }

      res.json({
        success: true,
        message: '会议已开始',
        data: { meeting_id: meeting.id, status: meeting.status }
      });

    } catch (error) {
      console.error('❌ 开始会议失败:', error);
      res.status(500).json({
        success: false,
        message: '开始会议失败: ' + error.message
      });
    }
  }

  // 暂停会议
  async pauseMeeting(req, res) {
    try {
      const { id } = req.params;

      const meeting = await Meeting.findByPk(id);
      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: '会议不存在'
        });
      }

      if (!['discussing', 'debating'].includes(meeting.status)) {
        return res.status(400).json({
          success: false,
          message: '只有进行中的会议才能暂停'
        });
      }

      await meeting.pause();

      res.json({
        success: true,
        message: '会议已暂停',
        data: { meeting_id: meeting.id, status: meeting.status }
      });

    } catch (error) {
      console.error('❌ 暂停会议失败:', error);
      res.status(500).json({
        success: false,
        message: '暂停会议失败: ' + error.message
      });
    }
  }

  // 结束会议
  async finishMeeting(req, res) {
    try {
      const { id } = req.params;

      const meeting = await Meeting.findByPk(id);
      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: '会议不存在'
        });
      }

      if (meeting.status === 'finished') {
        return res.status(400).json({
          success: false,
          message: '会议已经结束'
        });
      }

      // 生成结束语
      const participants = await MeetingParticipant.getActiveByMeeting(id);
      if (participants.length > 0) {
        const lastParticipant = participants[participants.length - 1];
        const director = await Director.findByPk(lastParticipant.director_id);
        
        const closingStatement = await generateStatement(
          meeting, 
          director, 
          meeting.current_round, 
          participants.length, 
          'closing'
        );

        if (closingStatement) {
          await Statement.create({
            meeting_id: meeting.id,
            director_id: director.id,
            content: closingStatement,
            content_type: 'closing',
            round_number: meeting.current_round,
            sequence_in_round: participants.length + 1
          });
        }
      }

      await meeting.finish();

      // 生成会议摘要（这里可以调用AI来生成）
      await generateMeetingSummary(meeting);

      res.json({
        success: true,
        message: '会议已结束',
        data: { meeting_id: meeting.id, status: meeting.status }
      });

    } catch (error) {
      console.error('❌ 结束会议失败:', error);
      res.status(500).json({
        success: false,
        message: '结束会议失败: ' + error.message
      });
    }
  }

  // 生成下一个发言
  async generateNextStatement(req, res) {
    try {
      const { id } = req.params;
      const { force_director_id } = req.body;

      const meeting = await Meeting.findByPk(id);
      if (!meeting) {
        return res.status(404).json({
          success: false,
          message: '会议不存在'
        });
      }

      if (!['discussing', 'debating'].includes(meeting.status)) {
        return res.status(400).json({
          success: false,
          message: '只有进行中的会议才能生成发言'
        });
      }

      // 获取参与者
      const participants = await MeetingParticipant.getActiveByMeeting(id);
      if (participants.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有活跃的参与者'
        });
      }

      // 确定下一个发言者
      let nextDirector;
      let sequenceInRound;

      if (force_director_id) {
        nextDirector = await Director.findByPk(force_director_id);
        if (!nextDirector) {
          return res.status(400).json({
            success: false,
            message: '指定的董事不存在'
          });
        }
      } else {
        // 根据讨论模式确定下一个发言者
        const result = await getNextSpeaker(meeting, participants);
        nextDirector = result.director;
        sequenceInRound = result.sequence;
      }

      // 生成发言内容
      const content = await generateStatement(
        meeting, 
        nextDirector, 
        meeting.current_round, 
        sequenceInRound || 1
      );

      if (!content) {
        return res.status(500).json({
          success: false,
          message: '生成发言失败'
        });
      }

      // 创建发言记录
      const statement = await Statement.create({
        meeting_id: meeting.id,
        director_id: nextDirector.id,
        content,
        content_type: 'statement',
        round_number: meeting.current_round,
        sequence_in_round: sequenceInRound || 1,
        tokens_used: content.length // 简单估算
      });

      // 更新统计
      const participant = participants.find(p => p.director_id === nextDirector.id);
      if (participant) {
        await participant.incrementStatement();
      }
      await meeting.increment('total_statements');

      // 检查是否需要进入下一轮
      const currentRoundStatements = await Statement.count({
        where: {
          meeting_id: meeting.id,
          round_number: meeting.current_round
        }
      });

      if (currentRoundStatements >= participants.length && meeting.current_round < meeting.max_rounds) {
        await meeting.nextRound();
      }

      res.json({
        success: true,
        message: '发言生成成功',
        data: {
          statement,
          director: {
            id: nextDirector.id,
            name: nextDirector.name,
            title: nextDirector.title,
            avatar_url: nextDirector.avatar_url
          },
          meeting_status: {
            current_round: meeting.current_round,
            total_statements: meeting.total_statements
          }
        }
      });

    } catch (error) {
      console.error('❌ 生成发言失败:', error);
      res.status(500).json({
        success: false,
        message: '生成发言失败: ' + error.message
      });
    }
  }


}

module.exports = new MeetingController();