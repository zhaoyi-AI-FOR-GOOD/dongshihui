-- 私人董事会系统数据库初始化脚本
-- PostgreSQL 13+ 

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS private_board;

-- 使用数据库
\c private_board;

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 创建枚举类型
CREATE TYPE director_status AS ENUM ('active', 'inactive', 'retired', 'suspended', 'archived');
CREATE TYPE meeting_status AS ENUM ('preparing', 'opening', 'discussing', 'debating', 'concluding', 'finished', 'paused');
CREATE TYPE discussion_mode AS ENUM ('round_robin', 'debate', 'focus', 'free');
CREATE TYPE participant_status AS ENUM ('invited', 'joined', 'speaking', 'finished', 'left');
CREATE TYPE statement_content_type AS ENUM ('statement', 'response', 'question', 'summary', 'opening', 'closing');
CREATE TYPE sentiment_type AS ENUM ('positive', 'neutral', 'negative');

-- 创建董事表
CREATE TABLE IF NOT EXISTS directors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    era VARCHAR(100),
    avatar_url TEXT,
    system_prompt TEXT NOT NULL,
    personality_traits JSONB DEFAULT '[]',
    core_beliefs JSONB DEFAULT '[]',
    speaking_style VARCHAR(500),
    expertise_areas JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    status director_status DEFAULT 'active',
    total_statements INTEGER DEFAULT 0,
    total_meetings INTEGER DEFAULT 0,
    last_active_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(50) DEFAULT 'system',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建会议表
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    topic TEXT NOT NULL,
    status meeting_status DEFAULT 'preparing',
    max_rounds INTEGER DEFAULT 10,
    current_round INTEGER DEFAULT 0,
    discussion_mode discussion_mode DEFAULT 'round_robin',
    max_participants INTEGER DEFAULT 8,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    paused_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(50) DEFAULT 'user',
    total_statements INTEGER DEFAULT 0,
    total_participants INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    summary TEXT,
    key_points JSONB DEFAULT '[]',
    controversies JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建会议参与者表
CREATE TABLE IF NOT EXISTS meeting_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    director_id UUID NOT NULL REFERENCES directors(id) ON DELETE CASCADE,
    join_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    status participant_status DEFAULT 'joined',
    statements_count INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    last_statement_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(meeting_id, director_id)
);

-- 创建发言记录表
CREATE TABLE IF NOT EXISTS statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    director_id UUID NOT NULL REFERENCES directors(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    content_type statement_content_type DEFAULT 'statement',
    round_number INTEGER NOT NULL,
    sequence_in_round INTEGER NOT NULL,
    response_to UUID REFERENCES statements(id) ON DELETE SET NULL,
    tokens_used INTEGER DEFAULT 0,
    generation_time INTEGER DEFAULT 0,
    claude_model VARCHAR(50) DEFAULT 'claude-3-sonnet-20240229',
    emotion_level INTEGER CHECK (emotion_level >= 1 AND emotion_level <= 10),
    controversy_score INTEGER CHECK (controversy_score >= 1 AND controversy_score <= 10),
    topic_relevance INTEGER CHECK (topic_relevance >= 1 AND topic_relevance <= 10),
    keywords JSONB DEFAULT '[]',
    mentioned_directors JSONB DEFAULT '[]',
    sentiment sentiment_type,
    metadata JSONB DEFAULT '{}',
    is_appropriate BOOLEAN DEFAULT true,
    flagged_reason VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建提示词模板表
CREATE TABLE IF NOT EXISTS prompt_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    base_template TEXT NOT NULL,
    variables JSONB NOT NULL DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_by VARCHAR(50) DEFAULT 'system',
    version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_directors_name ON directors(name);
CREATE INDEX IF NOT EXISTS idx_directors_status ON directors(is_active, status);
CREATE INDEX IF NOT EXISTS idx_directors_created_at ON directors(created_at);
CREATE INDEX IF NOT EXISTS idx_directors_last_active ON directors(last_active_at);

CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at);
CREATE INDEX IF NOT EXISTS idx_meetings_started_at ON meetings(started_at);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON meetings(created_by);

CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON meeting_participants(meeting_id, join_order);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_director ON meeting_participants(director_id);

CREATE INDEX IF NOT EXISTS idx_statements_meeting_round ON statements(meeting_id, round_number, sequence_in_round);
CREATE INDEX IF NOT EXISTS idx_statements_director_time ON statements(director_id, created_at);
CREATE INDEX IF NOT EXISTS idx_statements_response_to ON statements(response_to);
CREATE INDEX IF NOT EXISTS idx_statements_created_at ON statements(created_at);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_active ON prompt_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_usage ON prompt_templates(usage_count);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表创建更新时间触发器
CREATE TRIGGER update_directors_updated_at BEFORE UPDATE ON directors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_participants_updated_at BEFORE UPDATE ON meeting_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_statements_updated_at BEFORE UPDATE ON statements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_templates_updated_at BEFORE UPDATE ON prompt_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建一些有用的视图

-- 活跃董事视图
CREATE OR REPLACE VIEW active_directors AS
SELECT * FROM directors 
WHERE is_active = true AND status = 'active'
ORDER BY last_active_at DESC NULLS LAST;

-- 进行中的会议视图
CREATE OR REPLACE VIEW active_meetings AS
SELECT * FROM meetings 
WHERE status IN ('discussing', 'debating', 'opening')
ORDER BY started_at DESC;

-- 董事统计视图
CREATE OR REPLACE VIEW director_stats AS
SELECT 
    d.id,
    d.name,
    d.title,
    d.total_statements,
    d.total_meetings,
    d.last_active_at,
    COUNT(DISTINCT mp.meeting_id) as actual_meetings_count,
    COUNT(s.id) as actual_statements_count,
    AVG(s.tokens_used) as avg_tokens_per_statement
FROM directors d
LEFT JOIN meeting_participants mp ON d.id = mp.director_id
LEFT JOIN statements s ON d.id = s.director_id
GROUP BY d.id, d.name, d.title, d.total_statements, d.total_meetings, d.last_active_at;

-- 插入初始数据将在后续的seed脚本中完成

COMMENT ON DATABASE private_board IS '私人董事会系统数据库';
COMMENT ON TABLE directors IS '历史人物董事表';
COMMENT ON TABLE meetings IS '董事会会议表';
COMMENT ON TABLE meeting_participants IS '会议参与者关联表';
COMMENT ON TABLE statements IS '董事发言记录表';
COMMENT ON TABLE prompt_templates IS '人设提示词模板表';