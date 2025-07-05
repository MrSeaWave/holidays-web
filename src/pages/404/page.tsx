import { memo } from 'react';
import { Link } from 'react-router-dom';

import { CalendarOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export const NotFound = memo(() => {
  console.log('import.meta.env', import.meta.env);

  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <Title level={1}>
        <CalendarOutlined style={{ color: '#667eea' }} />
        休假方案计算器演示
      </Title>

      <Paragraph style={{ fontSize: '18px', marginBottom: '32px' }}>
        智能计算最佳休假方案，基于中国节假日政策，支持多种约束条件
      </Paragraph>

      <Space direction="vertical" size="large">
        <Link to="/">
          <Button
            type="primary"
            size="large"
            icon={<CalendarOutlined />}
            style={{
              height: '48px',
              fontSize: '16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            }}
          >
            开始计算休假方案
          </Button>
        </Link>

        <div style={{ marginTop: '24px' }}>
          <Paragraph type="secondary">功能特点：</Paragraph>
          <ul style={{ textAlign: 'left', display: 'inline-block' }}>
            <li>✨ 智能推荐最佳休假方案</li>
            <li>🎯 支持中国节假日和调休政策</li>
            <li>🔧 多种约束条件设置</li>
            <li>📊 实时方案评分和排序</li>
            <li>📱 响应式设计，支持移动端</li>
          </ul>
        </div>
      </Space>
    </div>
  );
});

NotFound.displayName = 'NotFound';
