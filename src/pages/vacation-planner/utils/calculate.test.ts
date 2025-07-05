import { describe, it, expect, vi } from 'vitest';

import type { IVacationConstraints } from './calculate';
import { calculateBestVacationPlan, getVacationSuggestions } from './calculate';

// 模拟中国节假日库
vi.mock('@swjs/chinese-holidays', () => ({
  isHoliday: vi.fn().mockResolvedValue(false),
  isWeekEnd: vi.fn().mockImplementation(async (date: string): Promise<boolean> => {
    const dayOfWeek = new Date(date).getDay();
    return Promise.resolve(dayOfWeek === 0 || dayOfWeek === 6);
  }),
}));

describe('休假方案计算器', () => {
  describe('基础功能测试', () => {
    it('应该返回 IVacationPlan 数组', async () => {
      const result = await calculateBestVacationPlan('2025-07-01', '2025-07-31', 3);

      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        const plan = result[0];
        expect(plan).toHaveProperty('dates');
        expect(plan).toHaveProperty('score');
        expect(plan).toHaveProperty('totalDays');
        expect(plan).toHaveProperty('continuousDays');
        expect(plan).toHaveProperty('description');
      }
    });

    it('应该返回正确数量的休假日期', async () => {
      const vacationDays = 5;
      const result = await calculateBestVacationPlan('2025-07-01', '2025-07-31', vacationDays);

      result.forEach(plan => {
        expect(plan.dates).toHaveLength(vacationDays);
        expect(plan.totalDays).toBe(vacationDays);
      });
    });

    it('应该按得分降序排序', async () => {
      const result = await calculateBestVacationPlan('2025-07-01', '2025-07-31', 3);

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].score).toBeGreaterThanOrEqual(result[i + 1].score);
      }
    });

    it('应该处理休假天数超过工作日的情况', async () => {
      const result = await calculateBestVacationPlan('2025-07-01', '2025-07-02', 10);

      expect(result).toHaveLength(0);
    });

    it('应该处理休假天数为0的情况', async () => {
      const result = await calculateBestVacationPlan('2025-07-01', '2025-07-31', 0);

      expect(result).toHaveLength(0);
    });
  });

  describe('约束条件测试', () => {
    it('应该排除不可休假的日期', async () => {
      const excludedDates = ['2025-07-01', '2025-07-02', '2025-07-03'];
      const constraints: IVacationConstraints = {
        excludedDates,
      };

      const result = await calculateBestVacationPlan('2025-07-01', '2025-07-31', 3, constraints);

      result.forEach(plan => {
        const hasExcluded = plan.dates.some(date => excludedDates.includes(date));
        expect(hasExcluded).toBe(false);
      });
    });

    it('应该处理强制休假约束', async () => {
      const constraints: IVacationConstraints = {
        mandatoryVacationWithinRange: [
          {
            startDate: '2025-07-15',
            endDate: '2025-07-25',
            days: 2,
          },
        ],
      };

      const result = await calculateBestVacationPlan('2025-07-01', '2025-07-31', 5, constraints);

      result.forEach(plan => {
        const mandatoryRange = constraints.mandatoryVacationWithinRange![0];
        const vacationInRange = plan.dates.filter(date => {
          const d = new Date(date);
          const start = new Date(mandatoryRange.startDate);
          const end = new Date(mandatoryRange.endDate);
          return d >= start && d <= end;
        });

        expect(vacationInRange.length).toBeGreaterThanOrEqual(mandatoryRange.days);
      });
    });

    it('应该处理无法满足的强制休假约束', async () => {
      const constraints: IVacationConstraints = {
        mandatoryVacationWithinRange: [
          {
            startDate: '2025-07-15',
            endDate: '2025-07-25',
            days: 10, // 要求天数过多
          },
        ],
      };

      const result = await calculateBestVacationPlan('2025-07-01', '2025-07-31', 5, constraints);

      expect(result).toHaveLength(0);
    });
  });

  describe('getVacationSuggestions 测试', () => {
    it('应该返回完整的建议信息', async () => {
      const result = await getVacationSuggestions('2025-07-01', '2025-07-31', 5);

      expect(result).toHaveProperty('bestPlans');
      expect(result).toHaveProperty('summary');
      expect(result.bestPlans).toBeInstanceOf(Array);
      expect(result.summary).toHaveProperty('totalWorkdays');
      expect(result.summary).toHaveProperty('totalHolidays');
      expect(result.summary).toHaveProperty('totalWeekends');
      expect(result.summary).toHaveProperty('vacationDays');
      expect(result.summary.vacationDays).toBe(5);
    });

    it('应该在summary中包含约束条件', async () => {
      const constraints: IVacationConstraints = {
        excludedDates: ['2025-07-15'],
      };

      const result = await getVacationSuggestions('2025-07-01', '2025-07-31', 5, constraints);

      expect(result.summary.constraints).toEqual(constraints);
    });

    it('应该正确统计各类型日期', async () => {
      const result = await getVacationSuggestions('2025-07-01', '2025-07-07', 3);

      const totalDays =
        result.summary.totalWorkdays + result.summary.totalHolidays + result.summary.totalWeekends;

      expect(totalDays).toBe(7);
      expect(result.summary.totalWorkdays).toBeGreaterThan(0);
    });
  });

  describe('边界情况测试', () => {
    it('应该处理相同开始结束日期', async () => {
      const result = await calculateBestVacationPlan('2025-07-01', '2025-07-01', 1);

      // 根据是否为工作日决定结果
      if (result.length > 0) {
        expect(result[0].dates).toHaveLength(1);
        expect(result[0].dates[0]).toBe('2025-07-01');
      }
    });

    it('应该处理无效日期范围', async () => {
      const result = await calculateBestVacationPlan('2025-07-31', '2025-07-01', 3);

      expect(result).toHaveLength(0);
    });

    it('应该确保所有日期在指定范围内', async () => {
      const startDate = '2025-07-01';
      const endDate = '2025-07-31';
      const result = await calculateBestVacationPlan(startDate, endDate, 5);

      const startTime = new Date(startDate).getTime();
      const endTime = new Date(endDate).getTime();

      result.forEach(plan => {
        plan.dates.forEach(date => {
          const dateTime = new Date(date).getTime();
          expect(dateTime).toBeGreaterThanOrEqual(startTime);
          expect(dateTime).toBeLessThanOrEqual(endTime);
        });
      });
    });
  });

  describe('结果质量测试', () => {
    it('应该返回有效的得分', async () => {
      const result = await calculateBestVacationPlan('2025-07-01', '2025-07-31', 3);

      result.forEach(plan => {
        expect(plan.score).toBeGreaterThan(0);
        expect(typeof plan.score).toBe('number');
      });
    });

    it('应该返回有效的连续天数', async () => {
      const result = await calculateBestVacationPlan('2025-07-01', '2025-07-31', 3);

      result.forEach(plan => {
        expect(plan.continuousDays).toBeGreaterThan(0);
        expect(typeof plan.continuousDays).toBe('number');
      });
    });

    it('应该生成有意义的描述', async () => {
      const result = await calculateBestVacationPlan('2025-07-01', '2025-07-31', 3);

      result.forEach(plan => {
        expect(typeof plan.description).toBe('string');
        expect(plan.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内完成计算', async () => {
      const startTime = Date.now();
      const result = await calculateBestVacationPlan('2025-01-01', '2025-12-31', 10);
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(10000); // 10秒内完成

      if (result.length > 0) {
        expect(result[0].dates).toHaveLength(10);
      }
    });
  });
});
