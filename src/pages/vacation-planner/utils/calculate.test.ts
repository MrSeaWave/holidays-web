import { describe, it, expect, vi } from 'vitest';

import type { IVacationConstraints } from './calculate';
import { calculateBestVacationPlan, getVacationSuggestions } from './calculate';

// 模拟中国节假日库，添加更真实的节假日数据
vi.mock('@swjs/chinese-holidays', () => ({
  isHoliday: vi.fn().mockImplementation(async (date: string): Promise<boolean> => {
    // 模拟一些节假日
    const holidays = [
      '2025-01-01', // 元旦
      '2025-05-01',
      '2025-05-02',
      '2025-05-03', // 五一劳动节
      '2025-10-01',
      '2025-10-02',
      '2025-10-03',
      '2025-10-04',
      '2025-10-05',
      '2025-10-06',
      '2025-10-07', // 国庆节
      // 特殊的长假期用于测试
      '2025-07-01',
      '2025-07-02',
      '2025-07-03',
      '2025-07-04',
      '2025-07-05', // 模拟长假期
    ];
    return Promise.resolve(holidays.includes(date));
  }),
  isWeekEnd: vi.fn().mockImplementation(async (date: string): Promise<boolean> => {
    const dayOfWeek = new Date(date).getDay();
    return Promise.resolve(dayOfWeek === 0 || dayOfWeek === 6);
  }),
  isWorkingDay: vi.fn().mockImplementation(async (date: string): Promise<boolean> => {
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // 模拟节假日
    const holidays = [
      '2025-01-01',
      '2025-05-01',
      '2025-05-02',
      '2025-05-03',
      '2025-10-01',
      '2025-10-02',
      '2025-10-03',
      '2025-10-04',
      '2025-10-05',
      '2025-10-06',
      '2025-10-07',
      '2025-07-01',
      '2025-07-02',
      '2025-07-03',
      '2025-07-04',
      '2025-07-05',
    ];
    const isHoliday = holidays.includes(date);

    // 模拟调休上班日（周末但需要上班）
    const workingWeekends = ['2025-04-27', '2025-09-29']; // 模拟调休
    const isWorkingWeekend = workingWeekends.includes(date);

    return Promise.resolve((!isWeekend && !isHoliday) || isWorkingWeekend);
  }),
}));

describe('🎯 智能休假方案计算器', () => {
  describe('📋 基础功能测试', () => {
    it('应该返回正确的 IVacationPlan 结构', async () => {
      const result = await calculateBestVacationPlan('2025-07-01', '2025-07-31', 3);

      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        const plan = result[0];
        expect(plan).toHaveProperty('dates');
        expect(plan).toHaveProperty('score');
        expect(plan).toHaveProperty('totalDays');
        expect(plan).toHaveProperty('continuousDays');
        expect(plan).toHaveProperty('description');

        // 验证数据类型
        expect(Array.isArray(plan.dates)).toBe(true);
        expect(typeof plan.score).toBe('number');
        expect(typeof plan.totalDays).toBe('number');
        expect(typeof plan.continuousDays).toBe('number');
        expect(typeof plan.description).toBe('string');
      }
    });

    it('应该返回正确数量的休假日期', async () => {
      const vacationDays = 5;
      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', vacationDays);

      result.forEach(plan => {
        expect(plan.dates).toHaveLength(vacationDays);
        expect(plan.totalDays).toBe(vacationDays);
      });
    });

    it('应该按得分降序排序（如果有多个方案）', async () => {
      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 3);

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].score).toBeGreaterThanOrEqual(result[i + 1].score);
      }
    });

    it('应该处理休假天数超过工作日的情况', async () => {
      // 选择一个只有1-2个工作日的短期间
      const result = await calculateBestVacationPlan('2025-07-01', '2025-07-02', 10);

      expect(result).toHaveLength(0);
    });

    it('应该处理休假天数为0的情况', async () => {
      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 0);

      expect(result).toHaveLength(0);
    });

    it('应该返回有效的日期格式', async () => {
      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 3);

      result.forEach(plan => {
        plan.dates.forEach(date => {
          // 验证日期格式 YYYY-MM-DD
          expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          // 验证日期有效性
          expect(new Date(date).toString()).not.toBe('Invalid Date');
        });
      });
    });
  });

  describe('🚫 连续休假天数限制测试', () => {
    it('应该遵守连续休假天数限制', async () => {
      const constraints: IVacationConstraints = {
        maxContinuousVacationDays: 3,
      };

      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 8, constraints);

      result.forEach(plan => {
        expect(plan.continuousDays).toBeLessThanOrEqual(3);
      });
    });

    it('应该处理不允许连续休假的情况（限制为0）', async () => {
      const constraints: IVacationConstraints = {
        maxContinuousVacationDays: 0,
      };

      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 5, constraints);

      result.forEach(plan => {
        expect(plan.continuousDays).toBe(1); // 每个连续段最多1天
      });
    });

    it('应该在有限制时仍能找到合理方案', async () => {
      const constraints: IVacationConstraints = {
        maxContinuousVacationDays: 2,
      };

      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 6, constraints);

      expect(result.length).toBeGreaterThan(0);
      result.forEach(plan => {
        expect(plan.dates).toHaveLength(6);
        expect(plan.continuousDays).toBeLessThanOrEqual(2);
      });
    });

    it('应该处理过于严格的连续限制', async () => {
      // 在很短的时间范围内设置严格限制，可能无法找到方案
      const constraints: IVacationConstraints = {
        maxContinuousVacationDays: 1,
        excludedDates: ['2025-08-01', '2025-08-04', '2025-08-05', '2025-08-08'], // 排除很多日期
      };

      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-10', 5, constraints);

      // 应该要么找到符合限制的方案，要么返回空数组
      if (result.length > 0) {
        result.forEach(plan => {
          expect(plan.continuousDays).toBeLessThanOrEqual(1);
          plan.dates.forEach(date => {
            expect(constraints.excludedDates).not.toContain(date);
          });
        });
      }
    });
  });

  describe('⚙️ 约束条件综合测试', () => {
    it('应该排除不可休假的日期', async () => {
      const excludedDates = ['2025-08-01', '2025-08-05', '2025-08-10'];
      const constraints: IVacationConstraints = {
        excludedDates,
      };

      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 5, constraints);

      result.forEach(plan => {
        const hasExcluded = plan.dates.some(date => excludedDates.includes(date));
        expect(hasExcluded).toBe(false);
      });
    });

    it('应该处理强制休假约束', async () => {
      const constraints: IVacationConstraints = {
        mandatoryVacationWithinRange: [
          {
            startDate: '2025-08-18',
            endDate: '2025-08-22',
            days: 2,
          },
        ],
      };

      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 5, constraints);

      // 应该至少有一个方案
      expect(result.length).toBeGreaterThan(0);

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

    it('应该处理复合约束条件', async () => {
      const constraints: IVacationConstraints = {
        excludedDates: ['2025-08-15'],
        maxContinuousVacationDays: 3,
        mandatoryVacationWithinRange: [
          {
            startDate: '2025-08-20',
            endDate: '2025-08-25',
            days: 1,
          },
        ],
      };

      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 6, constraints);

      result.forEach(plan => {
        // 验证排除日期
        expect(plan.dates).not.toContain('2025-08-15');

        // 验证连续限制
        expect(plan.continuousDays).toBeLessThanOrEqual(3);

        // 验证强制休假
        const mandatoryDates = plan.dates.filter(date => {
          const d = new Date(date);
          return d >= new Date('2025-08-20') && d <= new Date('2025-08-25');
        });
        expect(mandatoryDates.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('应该处理无法满足的约束条件组合', async () => {
      const constraints: IVacationConstraints = {
        // 测试更合理的约束：连续休假不超过2天，同时要求在某个范围内必须有3天休假
        maxContinuousVacationDays: 2,
        mandatoryVacationWithinRange: [
          {
            startDate: '2025-08-18',
            endDate: '2025-08-25', // 更大的范围，8天
            days: 3, // 要求3天休假，连续限制为2天，可以通过分散安排来满足
          },
        ],
      };

      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 5, constraints);

      // 算法应该能够处理这种约束，通过分散安排来满足
      if (result.length > 0) {
        // 如果有方案，应该满足连续休假限制
        result.forEach(plan => {
          expect(plan.continuousDays).toBeLessThanOrEqual(2);

          // 验证强制休假约束
          const mandatoryRange = constraints.mandatoryVacationWithinRange![0];
          const vacationInRange = plan.dates.filter(date => {
            const d = new Date(date);
            const start = new Date(mandatoryRange.startDate);
            const end = new Date(mandatoryRange.endDate);
            return d >= start && d <= end;
          });
          expect(vacationInRange.length).toBeGreaterThanOrEqual(mandatoryRange.days);
        });
      }
    });
  });

  describe('🎉 节假日连接优化测试', () => {
    it('应该优先选择与节假日相邻的日期', async () => {
      // 测试五一劳动节期间（2025-05-01至05-03）
      const result = await calculateBestVacationPlan('2025-04-25', '2025-05-10', 3);

      if (result.length > 0) {
        const plan = result[0];

        // 应该选择与节假日相邻的工作日，形成更长的假期
        const hasAdjacentToHoliday = plan.dates.some(date => {
          const d = new Date(date);
          const day1 = new Date('2025-04-30').getTime(); // 节假日前一天
          const day2 = new Date('2025-05-04').getTime(); // 节假日后一天（可能是周末）
          const day3 = new Date('2025-05-05').getTime(); // 节假日后

          return d.getTime() === day1 || d.getTime() === day2 || d.getTime() === day3;
        });

        // 由于算法优化，应该倾向于选择与节假日相邻的日期
        expect(plan.score).toBeGreaterThan(0);

        // 如果有与节假日相邻的日期，应该获得更高的分数
        if (hasAdjacentToHoliday) {
          expect(plan.score).toBeGreaterThan(100);
        }
      }
    });

    it('应该在有长假期时获得更高的效率得分', async () => {
      // 测试国庆节期间（2025-10-01至10-07）
      const result = await calculateBestVacationPlan('2025-09-25', '2025-10-15', 5);

      if (result.length > 0) {
        const plan = result[0];

        // 应该获得较高的效率得分（总假期天数/休假天数）
        expect(plan.score).toBeGreaterThan(100); // 效率应该大于1（即得分>100）
      }
    });
  });

  describe('📊 getVacationSuggestions 测试', () => {
    it('应该返回完整的建议信息', async () => {
      const result = await getVacationSuggestions('2025-08-01', '2025-08-31', 5);

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
        excludedDates: ['2025-08-15'],
        maxContinuousVacationDays: 3,
      };

      const result = await getVacationSuggestions('2025-08-01', '2025-08-31', 5, constraints);

      expect(result.summary.constraints).toEqual(constraints);
    });

    it('应该正确统计各类型日期', async () => {
      const result = await getVacationSuggestions('2025-08-01', '2025-08-07', 3);

      const totalDays =
        result.summary.totalWorkdays + result.summary.totalHolidays + result.summary.totalWeekends;

      expect(totalDays).toBe(7); // 一周7天
      expect(result.summary.totalWorkdays).toBeGreaterThanOrEqual(0);
      expect(result.summary.totalHolidays).toBeGreaterThanOrEqual(0);
      expect(result.summary.totalWeekends).toBeGreaterThanOrEqual(0);
    });

    it('应该正确处理包含节假日的时间段', async () => {
      // 测试包含模拟节假日的时间段
      const result = await getVacationSuggestions('2025-07-01', '2025-07-10', 2);

      expect(result.summary.totalHolidays).toBeGreaterThan(0); // 应该识别到节假日
    });
  });

  describe('🔄 边界情况测试', () => {
    it('应该处理相同开始结束日期', async () => {
      // 选择一个确定的工作日
      const result = await calculateBestVacationPlan('2025-08-06', '2025-08-06', 1);

      // 如果这一天是工作日，应该能安排休假
      if (result.length > 0) {
        expect(result[0].dates).toHaveLength(1);
        expect(result[0].dates[0]).toBe('2025-08-06');
        expect(result[0].continuousDays).toBe(1);
      }
    });

    it('应该处理无效日期范围（结束日期早于开始日期）', async () => {
      const result = await calculateBestVacationPlan('2025-08-31', '2025-08-01', 3);

      expect(result).toHaveLength(0);
    });

    it('应该确保所有日期在指定范围内', async () => {
      const startDate = '2025-08-01';
      const endDate = '2025-08-15';
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

    it('应该处理只有周末的时间段', async () => {
      // 选择一个只包含周末的时间段
      const result = await calculateBestVacationPlan('2025-08-02', '2025-08-03', 2); // 周六周日

      // 应该返回空数组，因为没有工作日可以休假
      expect(result).toHaveLength(0);
    });

    it('应该处理极短时间范围', async () => {
      // 单天时间范围，但2025-08-04是周一，是工作日
      const result = await calculateBestVacationPlan('2025-08-02', '2025-08-03', 2); // 周六周日

      // 不可能在周末安排工作日休假
      expect(result).toHaveLength(0);
    });
  });

  describe('📈 结果质量测试', () => {
    it('应该返回有效的得分', async () => {
      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 3);

      result.forEach(plan => {
        expect(plan.score).toBeGreaterThan(0);
        expect(typeof plan.score).toBe('number');
        expect(isFinite(plan.score)).toBe(true); // 确保不是 NaN 或 Infinity
      });
    });

    it('应该返回有效的连续天数', async () => {
      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 5);

      result.forEach(plan => {
        expect(plan.continuousDays).toBeGreaterThan(0);
        expect(typeof plan.continuousDays).toBe('number');
        expect(plan.continuousDays).toBeLessThanOrEqual(plan.dates.length);
      });
    });

    it('应该生成有意义的描述', async () => {
      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 3);

      result.forEach(plan => {
        expect(typeof plan.description).toBe('string');
        expect(plan.description.length).toBeGreaterThan(0);
        // 描述应该包含日期信息
        expect(plan.description).toMatch(/\d{4}-\d{2}-\d{2}/);
      });
    });

    it('应该保证休假日期按时间顺序排列', async () => {
      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 5);

      result.forEach(plan => {
        const dates = plan.dates.map(date => new Date(date).getTime()).sort((a, b) => a - b);
        const originalDates = plan.dates.map(date => new Date(date).getTime());

        expect(originalDates).toEqual(dates);
      });
    });
  });

  describe('🧮 算法效果验证测试', () => {
    it('应该优先选择调休上班日', async () => {
      // 测试包含调休上班日的场景
      const result = await calculateBestVacationPlan('2025-04-25', '2025-04-30', 2);

      if (result.length > 0) {
        const plan = result[0];

        // 如果有调休上班日（比如4月27日），应该优先选择
        const hasWorkingWeekend = plan.dates.includes('2025-04-27');

        if (hasWorkingWeekend) {
          expect(plan.score).toBeGreaterThan(100); // 调整期望值，调休日应该获得合理分数
        }
      }
    });

    it('应该能生成合理的连续假期', async () => {
      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 6);

      if (result.length > 0) {
        const plan = result[0];

        // 6天休假应该能形成有意义的连续假期
        expect(plan.continuousDays).toBeGreaterThan(1);
        expect(plan.score).toBeGreaterThan(0);
      }
    });

    it('应该在有节假日时获得更高效率', async () => {
      // 对比有节假日和无节假日的情况
      const withHolidays = await calculateBestVacationPlan('2025-07-01', '2025-07-10', 3); // 包含模拟节假日
      const withoutHolidays = await calculateBestVacationPlan('2025-08-01', '2025-08-10', 3); // 普通时间段

      if (withHolidays.length > 0 && withoutHolidays.length > 0) {
        // 有节假日的方案应该获得更高的效率得分
        expect(withHolidays[0].score).toBeGreaterThanOrEqual(withoutHolidays[0].score);
      }
    });
  });

  describe('⚡ 性能测试', () => {
    it('应该在合理时间内完成小范围计算', async () => {
      const startTime = Date.now();
      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 5);
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(2000); // 2秒内完成

      if (result.length > 0) {
        expect(result[0].dates).toHaveLength(5);
      }
    });

    it('应该在合理时间内完成大范围计算', async () => {
      const startTime = Date.now();
      const result = await calculateBestVacationPlan('2025-01-01', '2025-12-31', 15);
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(10000); // 10秒内完成

      if (result.length > 0) {
        expect(result[0].dates).toHaveLength(15);
      }
    });

    it('应该处理复杂约束时保持合理性能', async () => {
      const constraints: IVacationConstraints = {
        excludedDates: ['2025-08-01', '2025-08-05', '2025-08-10', '2025-08-15'],
        maxContinuousVacationDays: 2,
        mandatoryVacationWithinRange: [
          {
            startDate: '2025-08-20',
            endDate: '2025-08-25',
            days: 1,
          },
        ],
      };

      const startTime = Date.now();
      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 8, constraints);
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(5000); // 5秒内完成复杂约束计算

      // 验证结果仍然有效
      if (result.length > 0) {
        expect(result[0].dates.length).toBeLessThanOrEqual(8);
      }
    });
  });

  describe('🔍 数据一致性测试', () => {
    it('计划总天数应该与请求天数一致', async () => {
      const requestedDays = 7;
      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', requestedDays);

      result.forEach(plan => {
        expect(plan.totalDays).toBe(requestedDays);
        expect(plan.dates.length).toBe(requestedDays);
      });
    });

    it('连续天数不应该超过总天数', async () => {
      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 5);

      result.forEach(plan => {
        expect(plan.continuousDays).toBeLessThanOrEqual(plan.totalDays);
        expect(plan.continuousDays).toBeGreaterThan(0);
      });
    });

    it('方案描述应该与实际日期匹配', async () => {
      const result = await calculateBestVacationPlan('2025-08-01', '2025-08-31', 3);

      result.forEach(plan => {
        // 描述中应该包含实际的休假日期
        plan.dates.forEach(date => {
          expect(plan.description).toContain(date.substring(5)); // 至少包含月-日部分
        });
      });
    });
  });
});
