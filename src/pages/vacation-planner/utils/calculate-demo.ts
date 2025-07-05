import { isWeekEnd, isHoliday } from '@swjs/chinese-holidays';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

import type { IVacationConstraints } from './calculate';
import { getVacationSuggestions } from './calculate';

// 启用 dayjs 插件
dayjs.extend(isBetween);

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
    console.log('   - 如需测试强制休假功能，请使用 exampleMandatoryVacation() 函数');

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

/**
 * 🆕 简单强制休假示例
 * 展示最基本的强制休假功能使用方法
 */
export async function exampleMandatoryVacation(): Promise<unknown> {
  try {
    console.log('=== 🎯 强制休假功能基础示例 ===');

    // 场景：员工需要在7月15-25日期间强制休假3天
    const startDate = '2025-07-01';
    const endDate = '2025-07-31';
    const vacationDays = 6;

    const constraints: IVacationConstraints = {
      mandatoryVacationWithinRange: [
        {
          startDate: '2025-07-15',
          endDate: '2025-07-25',
          days: 3, // 在指定期间内必须休满3天
        },
      ],
    };

    console.log(`📅 时间范围: ${startDate} 到 ${endDate}`);
    console.log(`🏖️ 总休假天数: ${vacationDays}天`);
    console.log(`📋 强制约束: 在7月15-25日期间必须休满3天`);
    console.log(`💡 算法会优先满足强制约束，再优化剩余3天的分配`);

    const result = await getVacationSuggestions(startDate, endDate, vacationDays, constraints);

    console.log('\n=== 📊 计算结果 ===');
    if (result.bestPlans.length === 0) {
      console.log('❌ 无法满足强制休假约束');
    } else {
      result.bestPlans.forEach((plan, index) => {
        console.log(`\n✅ 方案 ${index + 1} (得分: ${plan.score})`);
        console.log(`📅 休假日期: ${plan.dates.join(', ')}`);
        console.log(`⏰ 最长连续假期: ${plan.continuousDays}天`);

        // 分析强制休假满足情况
        const mandatoryRange = constraints.mandatoryVacationWithinRange![0];
        const mandatoryDates = plan.dates.filter(date => {
          const d = dayjs(date);
          return d.isBetween(mandatoryRange.startDate, mandatoryRange.endDate, 'day', '[]');
        });

        console.log(`🎯 强制休假分析:`);
        console.log(
          `   - 强制区间内休假: ${mandatoryDates.join(', ')} (${mandatoryDates.length}天)`
        );
        console.log(
          `   - 是否满足约束: ${mandatoryDates.length >= mandatoryRange.days ? '✅ 是' : '❌ 否'}`
        );

        const remainingDates = plan.dates.filter(date => !mandatoryDates.includes(date));
        if (remainingDates.length > 0) {
          console.log(
            `   - 其他休假日期: ${remainingDates.join(', ')} (${remainingDates.length}天)`
          );
        }
      });
    }

    console.log('\n💡 功能特点:');
    console.log('   ✅ 优先满足强制休假约束');
    console.log('   ✅ 在约束区间内智能选择最优日期');
    console.log('   ✅ 优化剩余休假天数的分配');
    console.log('   ✅ 确保生成可行的休假方案');

    return result;
  } catch (error) {
    console.error('强制休假示例执行出错:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * 🆕 国庆假期强制休假示例
 * 展示如何在节假日期间设置强制休假约束
 */
export async function exampleNationalDayMandatoryVacation(): Promise<unknown> {
  try {
    console.log('=== 🇨🇳 国庆假期强制休假示例 ===');

    // 场景：利用2024年国庆假期，在国庆前后强制安排休假
    const startDate = '2024-09-20';
    const endDate = '2024-10-15';
    const vacationDays = 8;

    const constraints: IVacationConstraints = {
      mandatoryVacationWithinRange: [
        {
          startDate: '2024-09-25',
          endDate: '2024-09-30',
          days: 3, // 国庆前必须休3天，连接假期
        },
        {
          startDate: '2024-10-08',
          endDate: '2024-10-12',
          days: 2, // 国庆后必须休2天，延长假期
        },
      ],
    };

    console.log(`📅 时间范围: ${startDate} 到 ${endDate}`);
    console.log(`🏖️ 总休假天数: ${vacationDays}天`);
    console.log(`📋 强制约束:`);
    console.log(`   1. 国庆前(9月25-30日)必须休3天 - 目标：连接国庆假期`);
    console.log(`   2. 国庆后(10月8-12日)必须休2天 - 目标：延长假期`);
    console.log(`💡 2024年国庆节假期：10月1-7日(7天)`);

    const result = await getVacationSuggestions(startDate, endDate, vacationDays, constraints);

    console.log('\n=== 📊 计算结果 ===');
    if (result.bestPlans.length === 0) {
      console.log('❌ 无法满足强制休假约束');
    } else {
      result.bestPlans.forEach((plan, index) => {
        console.log(`\n🏆 方案 ${index + 1} (得分: ${plan.score})`);
        console.log(`📅 休假日期: ${plan.dates.join(', ')}`);
        console.log(`⏰ 最长连续假期: ${plan.continuousDays}天`);

        // 分析国庆假期连接效果
        const beforeNationalDay = plan.dates.filter(date =>
          dayjs(date).isBetween('2024-09-25', '2024-09-30', 'day', '[]')
        );
        const afterNationalDay = plan.dates.filter(date =>
          dayjs(date).isBetween('2024-10-08', '2024-10-12', 'day', '[]')
        );
        const otherDates = plan.dates.filter(
          date => !beforeNationalDay.includes(date) && !afterNationalDay.includes(date)
        );

        console.log(`🎯 国庆假期连接分析:`);
        console.log(
          `   - 国庆前休假: ${beforeNationalDay.join(', ')} (${beforeNationalDay.length}天)`
        );
        console.log(`   - 国庆假期: 10月1-7日 (7天) 🇨🇳`);
        console.log(
          `   - 国庆后休假: ${afterNationalDay.join(', ')} (${afterNationalDay.length}天)`
        );
        if (otherDates.length > 0) {
          console.log(`   - 其他休假: ${otherDates.join(', ')} (${otherDates.length}天)`);
        }

        // 计算总假期长度
        const totalHolidayLength = beforeNationalDay.length + 7 + afterNationalDay.length;
        console.log(`   ✨ 预计连续假期: ${totalHolidayLength}天 (含7天国庆假期)`);

        if (totalHolidayLength >= 12) {
          console.log(`   🏅 恭喜！创造了${totalHolidayLength}天的超长假期！`);
        } else if (totalHolidayLength >= 10) {
          console.log(`   🎉 很棒！形成了${totalHolidayLength}天的长假期！`);
        }
      });
    }

    console.log('\n💡 这个示例展示了强制休假的实际应用场景：');
    console.log('   🎯 策略性地连接节假日');
    console.log('   📈 最大化休假效率');
    console.log('   🧠 智能分配有限的休假天数');
    console.log('   ⚖️ 平衡多个强制约束');

    return result;
  } catch (error) {
    console.error(
      '国庆强制休假示例执行出错:',
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * 🆕 强制休假约束冲突处理示例
 * 展示当约束条件无法满足时的处理情况
 */
export async function exampleMandatoryVacationConflict(): Promise<unknown> {
  try {
    console.log('=== ⚠️ 强制休假约束冲突处理示例 ===');

    // 设计一个无法满足的约束场景
    const startDate = '2025-07-01';
    const endDate = '2025-07-31';
    const vacationDays = 5; // 总共只有5天休假

    const constraints: IVacationConstraints = {
      excludedDates: [
        '2025-07-01',
        '2025-07-02',
        '2025-07-03',
        '2025-07-04',
        '2025-07-07',
        '2025-07-08',
        '2025-07-09',
        '2025-07-10',
        '2025-07-11',
        '2025-07-14',
      ], // 排除大量工作日
      mandatoryVacationWithinRange: [
        {
          startDate: '2025-07-01',
          endDate: '2025-07-10',
          days: 4, // 要求在工作日较少的区间内休4天
        },
        {
          startDate: '2025-07-15',
          endDate: '2025-07-25',
          days: 3, // 同时要求在另一个区间休3天
        },
      ], // 总共要求7天，但只有5天休假
    };

    console.log(`📅 时间范围: ${startDate} 到 ${endDate}`);
    console.log(`🏖️ 总休假天数: ${vacationDays}天`);
    console.log(`🚫 不可休假日期: ${constraints.excludedDates?.join(', ')}`);
    console.log(`📋 强制约束 (故意设置冲突):`);
    console.log(`   1. 7月1-10日期间必须休4天`);
    console.log(`   2. 7月15-25日期间必须休3天`);
    console.log(`⚠️ 冲突点: 强制约束要求7天，但总休假只有5天`);

    const result = await getVacationSuggestions(startDate, endDate, vacationDays, constraints);

    console.log('\n=== 📊 计算结果 ===');
    if (result.bestPlans.length === 0) {
      console.log('❌ 检测到约束冲突，无法生成休假方案');
      console.log('\n🔍 冲突分析:');
      console.log('   - 强制约束总需求: 4 + 3 = 7天');
      console.log('   - 可用休假天数: 5天');
      console.log('   - 缺口: 2天');

      console.log('\n💡 解决建议:');
      console.log('   1. 📈 增加总休假天数至7天或以上');
      console.log('   2. 📉 减少强制约束的天数要求');
      console.log('   3. 🗓️ 调整强制约束的日期范围');
      console.log('   4. 🔄 重新评估不可休假日期的必要性');
    } else {
      console.log('✅ 意外地找到了解决方案（这表明算法很智能）：');
      result.bestPlans.forEach((plan, index) => {
        console.log(`\n方案 ${index + 1}:`);
        console.log(`📅 休假日期: ${plan.dates.join(', ')}`);
        console.log(`⏰ 最长连续假期: ${plan.continuousDays}天`);
      });
    }

    console.log('\n🛡️ 错误处理机制特点:');
    console.log('   ✅ 智能检测约束冲突');
    console.log('   ✅ 提供详细的失败原因');
    console.log('   ✅ 给出具体的解决建议');
    console.log('   ✅ 避免生成无效方案');

    return result;
  } catch (error) {
    console.error('约束冲突示例执行出错:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * 🆕 复杂强制休假场景示例
 * 展示在复杂实际场景中的强制休假应用
 */
export async function exampleComplexMandatoryVacation(): Promise<unknown> {
  try {
    console.log('=== 🏢 复杂企业休假场景示例 ===');

    // 模拟企业实际场景：员工需要配合项目时间安排休假
    const startDate = '2025-06-01';
    const endDate = '2025-09-30';
    const vacationDays = 15; // 较多的休假天数

    const constraints: IVacationConstraints = {
      excludedDates: [
        '2025-06-15', // 季度总结会议
        '2025-06-30', // 月末结算
        '2025-07-31', // 月末结算
        '2025-08-15', // 产品发布日
        '2025-09-15', // 项目验收
        '2025-09-30', // 季度末
      ],
      mandatoryVacationWithinRange: [
        {
          startDate: '2025-06-20',
          endDate: '2025-06-28',
          days: 3, // 6月底前必须休假（项目间隙期）
        },
        {
          startDate: '2025-07-15',
          endDate: '2025-07-25',
          days: 5, // 7月中下旬必须休假（暑期项目暂停）
        },
        {
          startDate: '2025-08-20',
          endDate: '2025-08-31',
          days: 4, // 8月底必须休假（新项目启动前）
        },
        {
          startDate: '2025-09-05',
          endDate: '2025-09-12',
          days: 2, // 9月初必须休假（项目收尾期）
        },
      ],
    };

    console.log(`📅 时间范围: ${startDate} 到 ${endDate} (4个月)`);
    console.log(`🏖️ 总休假天数: ${vacationDays}天`);
    console.log(`🚫 重要工作日: 6月15日, 6月30日, 7月31日, 8月15日, 9月15日, 9月30日`);
    console.log(`📋 企业强制休假安排:`);
    console.log(`   1. 6月20-28日: 必须休3天 (项目间隙期)`);
    console.log(`   2. 7月15-25日: 必须休5天 (暑期项目暂停)`);
    console.log(`   3. 8月20-31日: 必须休4天 (新项目启动前)`);
    console.log(`   4. 9月5-12日: 必须休2天 (项目收尾期)`);
    console.log(`💼 强制约束总计: 3+5+4+2 = 14天，剩余自由安排: 1天`);

    const result = await getVacationSuggestions(startDate, endDate, vacationDays, constraints);

    console.log('\n=== 📊 企业休假方案分析 ===');
    if (result.bestPlans.length === 0) {
      console.log('❌ 无法满足企业休假安排要求');
    } else {
      result.bestPlans.forEach((plan, index) => {
        console.log(`\n🏆 企业休假方案 ${index + 1} (得分: ${plan.score})`);
        console.log(`📅 全年休假日期: ${plan.dates.join(', ')}`);
        console.log(`⏰ 最长连续假期: ${plan.continuousDays}天`);
        console.log(`📝 假期安排: ${plan.description}`);

        // 按季度分析休假分布
        const quarters = [
          { name: '6月', start: '2025-06-01', end: '2025-06-30' },
          { name: '7月', start: '2025-07-01', end: '2025-07-31' },
          { name: '8月', start: '2025-08-01', end: '2025-08-31' },
          { name: '9月', start: '2025-09-01', end: '2025-09-30' },
        ];

        console.log(`\n📊 月度休假分布:`);
        quarters.forEach(quarter => {
          const quarterDates = plan.dates.filter(date =>
            dayjs(date).isBetween(quarter.start, quarter.end, 'day', '[]')
          );
          console.log(`   ${quarter.name}: ${quarterDates.join(', ')} (${quarterDates.length}天)`);
        });

        // 验证强制约束满足情况
        console.log(`\n✅ 强制约束验证:`);
        constraints.mandatoryVacationWithinRange?.forEach((constraint, idx) => {
          const constraintDates = plan.dates.filter(date => {
            const d = dayjs(date);
            return d.isBetween(constraint.startDate, constraint.endDate, 'day', '[]');
          });
          const period = `${constraint.startDate.slice(5)}~${constraint.endDate.slice(5)}`;
          const status = constraintDates.length >= constraint.days ? '✅' : '❌';
          console.log(
            `   ${idx + 1}. ${period}: ${constraintDates.length}/${constraint.days}天 ${status}`
          );
        });
      });
    }

    console.log('\n🏢 企业休假管理优势:');
    console.log('   📅 配合项目周期安排休假');
    console.log('   ⚖️ 平衡工作需求和员工权益');
    console.log('   🎯 确保关键时间点有足够人力');
    console.log('   🔄 灵活应对复杂约束条件');
    console.log('   📈 提高休假计划的执行效率');

    return result;
  } catch (error) {
    console.error(
      '复杂强制休假示例执行出错:',
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

/**
 * 🆕 运行所有强制休假示例
 * 一键体验所有强制休假功能
 */
export async function runAllMandatoryVacationExamples(): Promise<void> {
  console.log('🚀 === 强制休假功能完整演示 === 🚀\n');

  const examples = [
    { name: '基础强制休假', func: exampleMandatoryVacation },
    { name: '国庆假期连接', func: exampleNationalDayMandatoryVacation },
    { name: '约束冲突处理', func: exampleMandatoryVacationConflict },
    { name: '复杂企业场景', func: exampleComplexMandatoryVacation },
  ];

  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📚 示例 ${i + 1}/${examples.length}: ${example.name}`);
    console.log(`${'='.repeat(50)}`);

    try {
      await example.func();
    } catch (error) {
      console.error(
        `❌ 示例 "${example.name}" 执行失败:`,
        error instanceof Error ? error.message : String(error)
      );
    }

    if (i < examples.length - 1) {
      console.log('\n⏳ 3秒后继续下一个示例...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n🎉 === 所有强制休假示例演示完成 === 🎉');
  console.log('💡 现在你已经了解了强制休假功能的各种使用场景！');
}
