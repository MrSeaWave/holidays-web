import { memo } from 'react';

import { StarOutlined, CheckCircleOutlined } from '@ant-design/icons';

export const PlanStatusIcon = memo(({ index }: { index: number }) => {
  if (index === 0) return <StarOutlined />;
  return <CheckCircleOutlined />;
});

PlanStatusIcon.displayName = 'PlanStatusIcon';
