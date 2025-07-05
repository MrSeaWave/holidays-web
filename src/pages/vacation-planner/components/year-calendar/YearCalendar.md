# Mac风格年视图日历 (YearCalendar)

## 概述

`YearCalendar` 组件是一个类似Mac年维度的日历展示组件，可以在一个视图中展示整年的日历，并清晰标记休假安排。这种设计让用户能够快速了解全年的休假分布情况。

## 特性

### 🍎 Mac风格设计
- 12个月份以网格形式排列（桌面端4x3，移动端自适应）
- 每个月都是一个紧凑的日历块
- 简洁清爽的视觉效果

### 🎨 丰富的视觉标识
- **🔴 红色边框**: 计划休假日期，右上角显示"休"字
- **🟠 橙色边框**: 不可休假日期，右上角显示"禁"字
- **🔵 蓝色背景**: 周末休息日
- **🟢 绿色背景**: 在选择范围内的日期
- **🎯 蓝色背景**: 今天的日期

### 📱 响应式设计
- 大屏幕：4列3行布局
- 中屏幕：3列4行布局
- 小屏幕：2列6行布局
- 移动端：1列12行布局

### 🌙 主题适配
- 支持系统深色主题
- 平滑的主题切换效果

## 使用方法

### 基本用法

```tsx
import { YearCalendar } from './YearCalendar';

const App = () => {
  return (
    <YearCalendar
      year={2024}
      vacationDates={['2024-05-01', '2024-05-02', '2024-05-03']}
      excludedDates={['2024-07-01', '2024-09-15']}
      dateRange={[dayjs('2024-05-01'), dayjs('2024-10-15')]}
      onDateClick={(date) => console.log('点击日期:', date)}
    />
  );
};
```

### 属性说明

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `year` | `number` | ✅ | 要显示的年份 |
| `vacationDates` | `string[]` | ✅ | 休假日期数组，格式: 'YYYY-MM-DD' |
| `excludedDates` | `string[]` | ✅ | 不可休假日期数组，格式: 'YYYY-MM-DD' |
| `dateRange` | `[Dayjs, Dayjs] \| null` | ✅ | 日期范围，用于高亮显示 |
| `onDateClick` | `(date: string) => void` | ❌ | 点击日期时的回调函数 |

## 示例

### 完整示例

```tsx
import React, { useState } from 'react';
import { YearCalendar } from './YearCalendar';
import { Button, Space } from 'antd';
import dayjs from 'dayjs';

const VacationPlannerDemo = () => {
  const [year, setYear] = useState(2024);
  const [vacationDates, setVacationDates] = useState([
    '2024-05-01', '2024-05-02', '2024-05-03',
    '2024-08-15', '2024-08-16', '2024-08-17'
  ]);
  const [excludedDates, setExcludedDates] = useState([
    '2024-07-01', '2024-09-15'
  ]);
  const [dateRange, setDateRange] = useState([
    dayjs('2024-05-01'), 
    dayjs('2024-10-15')
  ]);

  const handleDateClick = (date: string) => {
    console.log('点击了日期:', date);
    // 可以在这里添加自定义逻辑
    // 比如切换休假状态、显示详情等
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2>我的休假规划</h2>
      
      <YearCalendar
        year={year}
        vacationDates={vacationDates}
        excludedDates={excludedDates}
        dateRange={dateRange}
        onDateClick={handleDateClick}
      />
      
      <div style={{ marginTop: '24px' }}>
        <Space>
          <Button onClick={() => setYear(year - 1)}>上一年</Button>
          <Button onClick={() => setYear(year + 1)}>下一年</Button>
        </Space>
      </div>
    </div>
  );
};
```

### 快速预设示例

```tsx
// 春季休假计划
const springPlan = {
  year: 2024,
  vacationDates: ['2024-04-01', '2024-04-02', '2024-04-03'],
  excludedDates: ['2024-04-15'],
  dateRange: [dayjs('2024-03-01'), dayjs('2024-06-30')]
};

// 夏季休假计划
const summerPlan = {
  year: 2024,
  vacationDates: ['2024-07-15', '2024-07-16', '2024-07-17', '2024-07-18', '2024-07-19'],
  excludedDates: ['2024-08-01'],
  dateRange: [dayjs('2024-06-01'), dayjs('2024-09-30')]
};
```

## 样式定制

### CSS类名

组件使用BEM命名规范，主要的CSS类名包括：

```scss
.year-calendar                    // 根容器
.year-calendar__header           // 年份标题区域
.year-calendar__year-title       // 年份标题
.year-calendar__months-grid      // 月份网格容器
.year-calendar__month            // 单个月份容器
.year-calendar__month-header     // 月份标题区域
.year-calendar__month-title      // 月份标题
.year-calendar__weekday-header   // 星期标题行
.year-calendar__weekday-cell     // 星期标题单元格
.year-calendar__date-grid        // 日期网格
.year-calendar__date-cell        // 日期单元格
.year-calendar__date-number      // 日期数字
.year-calendar__date-indicator   // 日期标识符（休/禁）
```

### 状态修饰符

```scss
// 日期单元格状态
.year-calendar__date-cell--current-month    // 当前月份
.year-calendar__date-cell--other-month      // 其他月份
.year-calendar__date-cell--vacation         // 休假日期
.year-calendar__date-cell--excluded         // 不可休假日期
.year-calendar__date-cell--weekend          // 周末
.year-calendar__date-cell--today            // 今天
.year-calendar__date-cell--in-range         // 在选择范围内
.year-calendar__date-cell--clickable        // 可点击
```

## 优势

### 相比传统月视图的优势

1. **全局视角**: 一眼看到全年的休假分布
2. **对比方便**: 容易比较不同月份的休假安排
3. **规划高效**: 便于制定长期休假计划
4. **空间优化**: 在有限空间内展示更多信息

### 与其他日历组件的区别

- **Ant Design Calendar**: 主要用于单月展示和日期选择
- **react-big-calendar**: 功能强大但复杂度高
- **YearCalendar**: 专注于年度视图的休假规划展示

## 技术实现

### 核心技术

- **React + TypeScript**: 类型安全的组件开发
- **dayjs**: 轻量级日期处理库
- **CSS Grid**: 响应式网格布局
- **SCSS**: 模块化样式管理

### 性能优化

- **React.memo**: 避免不必要的重新渲染
- **useMemo**: 缓存计算结果
- **CSS动画**: 流畅的交互体验

### 可访问性

- **键盘导航**: 支持Tab键导航
- **屏幕阅读器**: 提供合适的aria标签
- **颜色对比**: 符合WCAG标准
- **打印友好**: 优化打印样式

## 注意事项

1. **日期格式**: 确保日期格式为 'YYYY-MM-DD'
2. **性能考虑**: 大量数据时建议使用虚拟滚动
3. **浏览器兼容**: 支持现代浏览器，IE11需要polyfill
4. **移动端**: 在小屏幕设备上日期可能较小，注意用户体验

## 扩展功能

### 可以添加的功能

- [ ] 拖拽调整休假日期
- [ ] 多种休假类型（年假、病假、事假等）
- [ ] 导出功能（PDF、图片、日历文件）
- [ ] 团队共享功能
- [ ] 与外部日历系统集成

### 自定义主题

```scss
// 自定义主题变量
:root {
  --year-calendar-primary-color: #1890ff;
  --year-calendar-vacation-color: #ff4d4f;
  --year-calendar-excluded-color: #fa8c16;
  --year-calendar-weekend-color: #f0f8ff;
  --year-calendar-background-color: #fafafa;
}
```

## 许可证

MIT License - 可自由使用、修改和分发。 