import React, { memo, useMemo } from 'react';

import { Typography } from 'antd';
import classNames from 'classnames';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import './style.scss';

const { Text } = Typography;

interface IYearCalendarProps {
  year: number;
  vacationDates: string[];
  excludedDates: string[];
  holidayDates: string[]; // 节假日日期列表
  workingWeekendDates: string[]; // 周末上班日期列表
  dateRange: [Dayjs, Dayjs] | null;
  onDateClick?: (date: string) => void;
}

interface IDateCellInfo {
  date: string;
  dayjs: Dayjs;
  isCurrentMonth: boolean;
  isVacation: boolean;
  isExcluded: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  isWorkingWeekend: boolean;
  isInRange: boolean;
  isToday: boolean;
}

const MONTHS = [
  '一月',
  '二月',
  '三月',
  '四月',
  '五月',
  '六月',
  '七月',
  '八月',
  '九月',
  '十月',
  '十一月',
  '十二月',
];

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export const YearCalendar = memo<IYearCalendarProps>(
  ({
    year,
    vacationDates,
    excludedDates,
    holidayDates,
    workingWeekendDates,
    dateRange,
    onDateClick,
  }) => {
    // 生成某个月的日历数据
    const generateMonthData = useMemo(() => {
      return (month: number): IDateCellInfo[] => {
        const firstDay = dayjs().year(year).month(month).date(1);
        const lastDay = firstDay.endOf('month');
        const startDate = firstDay.startOf('week'); // 从周一开始
        const endDate = lastDay.endOf('week');

        const cells: IDateCellInfo[] = [];
        let current = startDate;

        while (current.isBefore(endDate) || current.isSame(endDate)) {
          const dateStr = current.format('YYYY-MM-DD');
          const isCurrentMonth = current.month() === month;
          const isWeekend = current.day() === 0 || current.day() === 6;
          const isHolidayDay = holidayDates.includes(dateStr);
          const isWorkingWeekendDay = workingWeekendDates.includes(dateStr);
          const isInRange = dateRange
            ? (current.isSame(dateRange[0]) || current.isAfter(dateRange[0])) &&
              (current.isSame(dateRange[1]) || current.isBefore(dateRange[1]))
            : false;

          cells.push({
            date: dateStr,
            dayjs: current,
            isCurrentMonth,
            isVacation: vacationDates.includes(dateStr),
            isExcluded: excludedDates.includes(dateStr),
            isWeekend,
            isHoliday: isHolidayDay,
            isWorkingWeekend: isWorkingWeekendDay,
            isInRange,
            isToday: current.isSame(dayjs(), 'day'),
          });

          current = current.add(1, 'day');
        }

        return cells;
      };
    }, [year, vacationDates, excludedDates, holidayDates, workingWeekendDates, dateRange]);

    // 渲染单个日期单元格
    const renderDateCell = (cellInfo: IDateCellInfo): React.JSX.Element => {
      const {
        date,
        dayjs: cellDay,
        isCurrentMonth,
        isVacation,
        isExcluded,
        isWeekend,
        isHoliday,
        isWorkingWeekend,
        isInRange,
        isToday,
      } = cellInfo;

      const cellClasses = classNames('year-calendar__date-cell', {
        'year-calendar__date-cell--current-month': isCurrentMonth,
        'year-calendar__date-cell--other-month': !isCurrentMonth,
        'year-calendar__date-cell--in-range': isInRange && isCurrentMonth,
        'year-calendar__date-cell--weekend-rest':
          isWeekend && !isWorkingWeekend && !isHoliday && isCurrentMonth,
        'year-calendar__date-cell--working-weekend': isWorkingWeekend && isCurrentMonth,
        'year-calendar__date-cell--holiday': isHoliday && isCurrentMonth,
        'year-calendar__date-cell--excluded': isExcluded && isCurrentMonth,
        'year-calendar__date-cell--vacation': isVacation && isCurrentMonth,
        'year-calendar__date-cell--today': isToday,
        'year-calendar__date-cell--clickable': isCurrentMonth && onDateClick,
      });

      const handleClick = (): void => {
        if (isCurrentMonth && onDateClick) {
          onDateClick(date);
        }
      };

      // 构建tooltip信息
      let tooltipText = cellDay.format('YYYY年MM月DD日');
      if (isVacation) tooltipText += ' (休假)';
      if (isExcluded) tooltipText += ' (不可休假)';
      if (isHoliday) tooltipText += ' (节假日)';
      if (isWorkingWeekend) tooltipText += ' (周末上班)';
      else if (isWeekend && !isHoliday) tooltipText += ' (周末)';

      return (
        <div key={date} className={cellClasses} onClick={handleClick} title={tooltipText}>
          <span className="year-calendar__date-number">{cellDay.date()}</span>
          {/* 休假指示器 - 优先级最高 */}
          {isVacation && isCurrentMonth && (
            <span className="year-calendar__date-indicator year-calendar__date-indicator--vacation">
              休
            </span>
          )}
          {/* 不可休假指示器 */}
          {isExcluded && isCurrentMonth && !isVacation && (
            <span className="year-calendar__date-indicator year-calendar__date-indicator--excluded">
              禁
            </span>
          )}
          {/* 节假日指示器 */}
          {isHoliday && isCurrentMonth && !isVacation && !isExcluded && (
            <span className="year-calendar__date-indicator year-calendar__date-indicator--holiday">
              假
            </span>
          )}
          {/* 周末上班指示器 - 优先级低于休假 */}
          {isWorkingWeekend && isCurrentMonth && !isVacation && !isExcluded && !isHoliday && (
            <span className="year-calendar__date-indicator year-calendar__date-indicator--working-weekend">
              班
            </span>
          )}
        </div>
      );
    };

    // 渲染单个月份
    const renderMonth = (month: number): React.JSX.Element => {
      const monthData = generateMonthData(month);

      return (
        <div key={month} className="year-calendar__month">
          {/* 月份标题 */}
          <div className="year-calendar__month-header">
            <Text strong className="year-calendar__month-title">
              {MONTHS[month]}
            </Text>
          </div>

          {/* 星期标题 */}
          <div className="year-calendar__weekday-header">
            {WEEKDAYS.map(weekday => (
              <div key={weekday} className="year-calendar__weekday-cell">
                {weekday}
              </div>
            ))}
          </div>

          {/* 日期网格 */}
          <div className="year-calendar__date-grid">{monthData.map(renderDateCell)}</div>
        </div>
      );
    };

    return (
      <div className="year-calendar">
        <div className="year-calendar__header">
          <Typography.Title level={4} className="year-calendar__year-title">
            {year}年
          </Typography.Title>
        </div>

        <div className="year-calendar__months-grid">
          {Array.from({ length: 12 }, (_, i) => renderMonth(i))}
        </div>
      </div>
    );
  }
);

YearCalendar.displayName = 'YearCalendar';
