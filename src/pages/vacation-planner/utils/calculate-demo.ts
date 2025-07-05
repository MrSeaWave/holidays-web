import { isWeekEnd, isHoliday } from '@swjs/chinese-holidays';
import dayjs from 'dayjs';

import type { IVacationConstraints } from './calculate';
import { getVacationSuggestions } from './calculate';

/**
 * 使用示例
 * 注意：现在使用 isWeekEnd 函数来准确判断周末是否可以休息
 * 这样可以正确处理中国的调休政策（如某些周末需要上班）
 */
export async function exampleUsage(): Promise<unknown> {
  try {
    // 示例：2025年7月1日到7月31日，计划休假5天
    const startDate = '2025-07-01';
    const endDate = '2025-07-31';
    const vacationDays = 5;

    console.log('=== 休假方案计算 ===');
    console.log(`时间范围: ${startDate} 到 ${endDate}`);
    console.log(`计划休假天数: ${vacationDays}天`);
    console.log('💡 已启用智能周末识别，考虑调休政策');

    const result = await getVacationSuggestions(startDate, endDate, vacationDays);

    console.log('\n=== 时间范围统计 ===');
    console.log(`总工作日: ${result.summary.totalWorkdays}天`);
    console.log(`总节假日: ${result.summary.totalHolidays}天`);
    console.log(`总周末: ${result.summary.totalWeekends}天`);

    console.log('\n=== 推荐的休假方案 ===');
    result.bestPlans.forEach((plan, index) => {
      console.log(`\n方案 ${index + 1} (得分: ${plan.score})`);
      console.log(`休假日期: ${plan.dates.join(', ')}`);
      console.log(`最长连续假期: ${plan.continuousDays}天`);
      console.log(`连续假期安排: ${plan.description}`);
    });

    console.log('\n💡 提示：');
    console.log('   - 如需添加约束条件，请使用 exampleWithConstraints() 函数');
    console.log('   - 如需设置多个约束条件，请使用 exampleWithMultipleConstraints() 函数');

    return result;
  } catch (error) {
    console.error('计算休假方案时出错:', error);
    return null;
  }
}

/**
 * 使用约束条件的示例
 * 展示如何使用不可休假日期和必须休假的约束
 */
export async function exampleWithConstraints(): Promise<unknown> {
  try {
    // 示例：2025年7月1日到7月31日，计划休假5天
    const startDate = '2025-07-01';
    const endDate = '2025-07-31';
    const vacationDays = 5;

    // 设置约束条件
    const constraints: IVacationConstraints = {
      // 不可休假的日期（比如有重要会议）
      excludedDates: ['2025-07-10', '2025-07-20', '2025-07-30'],
      // 在7月15日到7月25日期间必须休满3天假
      mandatoryVacationWithinRange: [
        {
          startDate: '2025-07-15',
          endDate: '2025-07-25',
          days: 3,
        },
      ],
    };

    console.log('=== 带约束条件的休假方案计算 ===');
    console.log(`时间范围: ${startDate} 到 ${endDate}`);
    console.log(`计划休假天数: ${vacationDays}天`);
    console.log(`不可休假日期: ${constraints.excludedDates?.join(', ')}`);
    console.log(
      `约束条件: 在${constraints.mandatoryVacationWithinRange?.[0].startDate}到${constraints.mandatoryVacationWithinRange?.[0].endDate}期间必须休满${constraints.mandatoryVacationWithinRange?.[0].days}天假`
    );

    const result = await getVacationSuggestions(startDate, endDate, vacationDays, constraints);

    console.log('\n=== 时间范围统计 ===');
    console.log(`总工作日: ${result.summary.totalWorkdays}天`);
    console.log(`总节假日: ${result.summary.totalHolidays}天`);
    console.log(`总周末: ${result.summary.totalWeekends}天`);

    console.log('\n=== 符合约束的休假方案 ===');
    if (result.bestPlans.length === 0) {
      console.log('❌ 没有找到符合约束条件的休假方案');
    } else {
      result.bestPlans.forEach((plan, index) => {
        console.log(`\n✅ 方案 ${index + 1} (得分: ${plan.score})`);
        console.log(`休假日期: ${plan.dates.join(', ')}`);
        console.log(`最长连续假期: ${plan.continuousDays}天`);
        console.log(`连续假期安排: ${plan.description}`);
      });
    }

    return result;
  } catch (error) {
    console.error('计算带约束的休假方案时出错:', error);
    return null;
  }
}

/**
 * 多约束条件示例
 * 展示如何设置多个日期范围的休假约束
 */
export async function exampleWithMultipleConstraints(): Promise<unknown> {
  try {
    // 示例：2025年6月1日到8月31日，计划休假10天
    const startDate = '2025-06-01';
    const endDate = '2025-08-31';
    const vacationDays = 10;

    // 设置多个约束条件
    const constraints: IVacationConstraints = {
      // 不可休假的日期（重要会议、项目deadline等）
      excludedDates: [
        '2025-06-15', // 季度会议
        '2025-07-10', // 项目deadline
        '2025-08-20', // 重要发布日
      ],
      // 多个日期范围的休假约束
      mandatoryVacationWithinRange: [
        {
          startDate: '2025-06-10',
          endDate: '2025-06-30',
          days: 3, // 6月必须休满3天
        },
        {
          startDate: '2025-07-15',
          endDate: '2025-07-31',
          days: 4, // 7月下半月必须休满4天
        },
        {
          startDate: '2025-08-01',
          endDate: '2025-08-15',
          days: 2, // 8月上半月必须休满2天
        },
      ],
    };

    console.log('=== 多约束条件的休假方案计算 ===');
    console.log(`时间范围: ${startDate} 到 ${endDate}`);
    console.log(`计划休假天数: ${vacationDays}天`);
    console.log(`不可休假日期: ${constraints.excludedDates?.join(', ')}`);
    console.log('\n约束条件:');
    constraints.mandatoryVacationWithinRange?.forEach((constraint, index) => {
      console.log(
        `  ${index + 1}. 在${constraint.startDate}到${constraint.endDate}期间必须休满${constraint.days}天假`
      );
    });

    const result = await getVacationSuggestions(startDate, endDate, vacationDays, constraints);

    console.log('\n=== 时间范围统计 ===');
    console.log(`总工作日: ${result.summary.totalWorkdays}天`);
    console.log(`总节假日: ${result.summary.totalHolidays}天`);
    console.log(`总周末: ${result.summary.totalWeekends}天`);

    console.log('\n=== 符合多约束的休假方案 ===');
    if (result.bestPlans.length === 0) {
      console.log('❌ 没有找到符合所有约束条件的休假方案');
      console.log('💡 建议：');
      console.log('   - 减少休假天数');
      console.log('   - 调整约束条件的天数要求');
      console.log('   - 扩大时间范围');
    } else {
      result.bestPlans.forEach((plan, index) => {
        console.log(`\n✅ 方案 ${index + 1} (得分: ${plan.score})`);
        console.log(`休假日期: ${plan.dates.join(', ')}`);
        console.log(`最长连续假期: ${plan.continuousDays}天`);
        console.log(`连续假期安排: ${plan.description}`);

        // 验证约束条件满足情况
        console.log('📋 约束条件验证:');
        constraints.mandatoryVacationWithinRange?.forEach((constraint, idx) => {
          const vacationInRange = plan.dates.filter(date => {
            const vacationDate = dayjs(date);
            const startDate = dayjs(constraint.startDate);
            const endDate = dayjs(constraint.endDate);
            return (
              (vacationDate.isSame(startDate) || vacationDate.isAfter(startDate)) &&
              (vacationDate.isSame(endDate) || vacationDate.isBefore(endDate))
            );
          });
          console.log(
            `   ${idx + 1}. ${constraint.startDate}~${constraint.endDate}: ${vacationInRange.length}/${constraint.days}天 ${vacationInRange.length >= constraint.days ? '✅' : '❌'}`
          );
        });
      });
    }

    return result;
  } catch (error) {
    console.error('计算多约束休假方案时出错:', error);
    return null;
  }
}

/**
 * 测试周末识别功能
 * 展示 isWeekEnd 函数如何正确识别调休后的周末
 */
export async function testWeekendDetection(): Promise<void> {
  console.log('=== 测试周末识别功能 ===');

  // 测试一些日期
  const testDates = [
    '2025-01-01', // 元旦
    '2025-01-04', // 周六
    '2025-01-05', // 周日
    '2025-01-26', // 调休可能影响的日期
    '2025-02-01', // 春节前
    '2025-02-02', // 春节期间
  ];

  for (const date of testDates) {
    const isWeekend = await isWeekEnd(date);
    const isHolidayDay = await isHoliday(date);
    const dayOfWeek = dayjs(date).format('dddd');

    console.log(
      `${date} (${dayOfWeek}): 周末=${isWeekend ? '是' : '否'}, 节假日=${isHolidayDay ? '是' : '否'}`
    );
  }

  console.log('\n💡 使用 isWeekEnd 可以准确识别调休后的真实周末情况');
  console.log('💡 这比简单的星期判断更准确，能正确处理中国的调休政策');
}

/**
 * 测试节假日连接优化效果
 * 这个示例专门测试新的算法是否能更好地连接节假日
 */
export async function testHolidayConnectionOptimization(): Promise<unknown> {
  try {
    console.log('=== 节假日连接优化测试 ===');

    // 测试2024年国庆节期间的休假安排
    // 2024年国庆节假期：10月1日-10月7日（7天）
    const startDate = '2024-09-01';
    const endDate = '2024-10-31';
    const vacationDays = 5;

    console.log(`\n测试场景：${startDate} 到 ${endDate}`);
    console.log(`计划休假天数：${vacationDays}天`);
    console.log('💡 目标：测试算法是否能智能连接国庆节假期');

    const result = await getVacationSuggestions(startDate, endDate, vacationDays);

    console.log('\n=== 时间范围统计 ===');
    console.log(`总工作日: ${result.summary.totalWorkdays}天`);
    console.log(`总节假日: ${result.summary.totalHolidays}天`);
    console.log(`总周末: ${result.summary.totalWeekends}天`);

    console.log('\n=== 优化后的休假方案 ===');
    result.bestPlans.forEach((plan, index) => {
      console.log(`\n🏆 方案 ${index + 1} (得分: ${plan.score})`);
      console.log(`📅 休假日期: ${plan.dates.join(', ')}`);
      console.log(`⏰ 最长连续假期: ${plan.continuousDays}天`);
      console.log(`📝 策略描述: ${plan.description}`);

      // 分析节假日连接效果
      const beforeNationalDay = plan.dates.filter(date => dayjs(date).isBefore('2024-10-01'));
      const afterNationalDay = plan.dates.filter(date => dayjs(date).isAfter('2024-10-07'));

      if (beforeNationalDay.length > 0 || afterNationalDay.length > 0) {
        console.log(`🎯 节假日连接分析:`);
        if (beforeNationalDay.length > 0) {
          console.log(
            `   - 国庆前连接: ${beforeNationalDay.join(', ')} (${beforeNationalDay.length}天)`
          );
        }
        if (afterNationalDay.length > 0) {
          console.log(
            `   - 国庆后连接: ${afterNationalDay.join(', ')} (${afterNationalDay.length}天)`
          );
        }

        const totalHolidayLength = 7 + beforeNationalDay.length + afterNationalDay.length;
        console.log(`   ✨ 总假期长度: ${totalHolidayLength}天 (包含7天国庆假期)`);
      }
    });

    console.log('\n=== 算法改进效果分析 ===');
    const bestPlan = result.bestPlans[0];
    if (bestPlan) {
      console.log(`🔥 最佳方案得分: ${bestPlan.score}`);
      console.log(`📊 连续假期天数: ${bestPlan.continuousDays}天`);

      if (bestPlan.continuousDays >= 10) {
        console.log('🏅 恭喜！成功创造了10天以上的超长假期！');
      } else if (bestPlan.continuousDays >= 7) {
        console.log('🎉 很棒！形成了一周以上的长假期！');
      } else {
        console.log('💡 提示：可以尝试调整休假天数以获得更长的连续假期');
      }
    }

    console.log('\n💯 测试完成！新算法特点：');
    console.log('   1. 智能识别节假日群组');
    console.log('   2. 优先连接长假期（如国庆、春节等）');
    console.log('   3. 考虑桥接多个节假日的可能性');
    console.log('   4. 评分系统偏向节假日连接和长假期');

    return result;
  } catch (error) {
    console.error('测试节假日连接优化时出错:', error);
    return null;
  }
}
