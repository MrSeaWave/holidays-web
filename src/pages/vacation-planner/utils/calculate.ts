/**
 * 智能休假方案计算器 (精简版)
 *
 * 核心功能：
 * 1. 🎯 智能识别工作日、周末、节假日、调休上班日
 * 2. 📅 支持中国节假日和调休政策
 * 3. 🚫 支持设置不可休假日期
 * 4. ⏰ 支持连续休假天数限制
 * 5. 🏆 智能推荐高效休假方案
 */

import { isHoliday, isWeekEnd, isWorkingDay } from '@swjs/chinese-holidays';
import dayjs from 'dayjs';

// 休假方案接口
export interface IVacationPlan {
  dates: string[];
  score: number;
  totalDays: number;
  continuousDays: number;
  description: string;
}

// 日期信息接口
export interface IDateInfo {
  date: string;
  isWeekend: boolean;
  isHoliday: boolean;
  isWorkingDay: boolean;
}

// 休假约束条件接口
export interface IVacationConstraints {
  excludedDates?: string[];
  mandatoryVacationWithinRange?: {
    startDate: string;
    endDate: string;
    days: number;
  }[];
  maxContinuousVacationDays?: number;
}

/**
 * 获取指定日期范围内的所有日期信息
 */
async function getDateInfos(startDate: string, endDate: string): Promise<IDateInfo[]> {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const dateInfos: IDateInfo[] = [];

  let current = start;
  while (current.isBefore(end) || current.isSame(end)) {
    const dateStr = current.format('YYYY-MM-DD');
    const isWeekend = await isWeekEnd(dateStr);
    const isHolidayDay = await isHoliday(dateStr);
    const isActualWorkingDay = await isWorkingDay(dateStr);

    dateInfos.push({
      date: dateStr,
      isWeekend,
      isHoliday: isHolidayDay,
      isWorkingDay: isActualWorkingDay,
    });

    current = current.add(1, 'day');
  }

  return dateInfos;
}

/**
 * 计算连续休假段的长度（只计算实际休假天数）
 */
function calculateContinuousVacationSegments(
  vacationDates: string[],
  dateInfos: IDateInfo[]
): number[] {
  const vacationSet = new Set(vacationDates);
  const segments: number[] = [];
  let currentSegment = 0;
  let inSegment = false;

  for (const dateInfo of dateInfos) {
    if (vacationSet.has(dateInfo.date)) {
      currentSegment++;
      inSegment = true;
    } else if (!dateInfo.isWorkingDay) {
      // 非工作日：继续段但不计入休假天数
    } else {
      // 工作日且不是休假日：结束当前段
      if (inSegment && currentSegment > 0) {
        segments.push(currentSegment);
      }
      currentSegment = 0;
      inSegment = false;
    }
  }

  if (inSegment && currentSegment > 0) {
    segments.push(currentSegment);
  }

  return segments;
}

/**
 * 验证休假方案是否满足约束条件
 */
function validateConstraints(
  vacationDates: string[],
  dateInfos: IDateInfo[],
  constraints?: IVacationConstraints
): boolean {
  if (!constraints) return true;

  // 检查不可休假日期
  if (constraints.excludedDates?.some(date => vacationDates.includes(date))) {
    return false;
  }

  // 检查连续休假限制
  if (constraints.maxContinuousVacationDays !== undefined) {
    const segments = calculateContinuousVacationSegments(vacationDates, dateInfos);
    const maxSegment = Math.max(...segments, 0);
    if (maxSegment > constraints.maxContinuousVacationDays) {
      return false;
    }
  }

  // 检查强制休假约束
  if (constraints.mandatoryVacationWithinRange) {
    for (const mandatory of constraints.mandatoryVacationWithinRange) {
      const vacationInRange = vacationDates.filter(date => {
        const d = new Date(date);
        const start = new Date(mandatory.startDate);
        const end = new Date(mandatory.endDate);
        return d >= start && d <= end;
      });

      if (vacationInRange.length < mandatory.days) {
        return false;
      }
    }
  }

  return true;
}

/**
 * 计算休假方案的总假期天数
 */
function calculateTotalHolidayDays(vacationDates: string[], dateInfos: IDateInfo[]): number {
  const vacationSet = new Set(vacationDates);
  let totalDays = 0;
  let inHolidayPeriod = false;

  for (const dateInfo of dateInfos) {
    if (vacationSet.has(dateInfo.date) || !dateInfo.isWorkingDay) {
      if (!inHolidayPeriod) {
        inHolidayPeriod = true;
      }
      totalDays++;
    } else if (inHolidayPeriod) {
      inHolidayPeriod = false;
    }
  }

  return totalDays;
}

/**
 * 找出长假期（3天以上的连续非工作日）
 */
function findLongHolidays(
  dateInfos: IDateInfo[]
): { start: string; end: string; dates: string[] }[] {
  const holidays: { start: string; end: string; dates: string[] }[] = [];
  let currentHoliday: string[] = [];

  for (const dateInfo of dateInfos) {
    if (!dateInfo.isWorkingDay) {
      currentHoliday.push(dateInfo.date);
    } else {
      if (currentHoliday.length >= 3) {
        holidays.push({
          start: currentHoliday[0],
          end: currentHoliday[currentHoliday.length - 1],
          dates: [...currentHoliday],
        });
      }
      currentHoliday = [];
    }
  }

  if (currentHoliday.length >= 3) {
    holidays.push({
      start: currentHoliday[0],
      end: currentHoliday[currentHoliday.length - 1],
      dates: [...currentHoliday],
    });
  }

  return holidays;
}

/**
 * 智能选择休假日期
 */
function selectOptimalVacationDates(
  dateInfos: IDateInfo[],
  vacationDays: number,
  constraints?: IVacationConstraints
): string[] {
  // 获取所有可休假的工作日
  const workingDays = dateInfos
    .filter(d => d.isWorkingDay && !constraints?.excludedDates?.includes(d.date))
    .map(d => d.date);

  // 处理强制休假约束
  let forcedVacationDates: string[] = [];
  if (constraints?.mandatoryVacationWithinRange) {
    for (const mandatory of constraints.mandatoryVacationWithinRange) {
      const datesInRange = workingDays.filter(date => {
        const d = new Date(date);
        const start = new Date(mandatory.startDate);
        const end = new Date(mandatory.endDate);
        return d >= start && d <= end;
      });

      // 选择评分最高的日期来满足强制休假要求
      const scoredDates = datesInRange.map(date => {
        let score = 0;
        const dateInfo = dateInfos.find(d => d.date === date)!;
        const currentDay = dayjs(date);

        // 调休上班日高分
        if (dateInfo.isWeekend) {
          score += 100;
        }

        // 检查与非工作日的邻近程度
        for (let i = -3; i <= 3; i++) {
          if (i === 0) continue;
          const checkDate = currentDay.add(i, 'day').format('YYYY-MM-DD');
          const checkDateInfo = dateInfos.find(d => d.date === checkDate);

          if (checkDateInfo && !checkDateInfo.isWorkingDay) {
            const distance = Math.abs(i);
            score += checkDateInfo.isHoliday ? 30 / distance : 10 / distance;
          }
        }

        return { date, score };
      });

      scoredDates.sort((a, b) => b.score - a.score);

      // 选择足够的日期来满足强制休假要求
      const mandatoryDates = scoredDates.slice(0, mandatory.days).map(item => item.date);

      forcedVacationDates.push(...mandatoryDates);
    }
  }

  // 去除重复的强制休假日期
  forcedVacationDates = [...new Set(forcedVacationDates)];

  // 如果强制休假日期已经达到或超过了所需天数，直接返回
  if (forcedVacationDates.length >= vacationDays) {
    return forcedVacationDates.slice(0, vacationDays);
  }

  // 剩余需要选择的天数
  const remainingDays = vacationDays - forcedVacationDates.length;

  // 从可选工作日中排除已经选择的强制休假日期
  const availableWorkingDays = workingDays.filter(date => !forcedVacationDates.includes(date));

  // 找出长假期
  const longHolidays = findLongHolidays(dateInfos);

  let bestCombination: string[] = [];
  let bestEfficiency = 0;

  // 针对每个长假期，尝试前后连接的组合
  for (const holiday of longHolidays) {
    const holidayStart = dayjs(holiday.start);
    const holidayEnd = dayjs(holiday.end);

    // 找出假期前后的工作日
    const beforeDays = availableWorkingDays
      .filter(date => dayjs(date).isBefore(holidayStart))
      .slice(-remainingDays); // 最多取remainingDays个

    const afterDays = availableWorkingDays
      .filter(date => dayjs(date).isAfter(holidayEnd))
      .slice(0, remainingDays); // 最多取remainingDays个

    // 生成前后组合
    for (
      let beforeCount = 0;
      beforeCount <= Math.min(beforeDays.length, remainingDays);
      beforeCount++
    ) {
      for (
        let afterCount = 0;
        afterCount <= Math.min(afterDays.length, remainingDays - beforeCount);
        afterCount++
      ) {
        if (beforeCount + afterCount === remainingDays && beforeCount + afterCount > 0) {
          const combination = [
            ...forcedVacationDates,
            ...beforeDays.slice(-beforeCount),
            ...afterDays.slice(0, afterCount),
          ];

          // 验证约束条件
          if (validateConstraints(combination, dateInfos, constraints)) {
            const totalHolidays = calculateTotalHolidayDays(combination, dateInfos);
            const efficiency = totalHolidays / combination.length;

            if (efficiency > bestEfficiency) {
              bestEfficiency = efficiency;
              bestCombination = combination;
            }
          }
        }
      }
    }
  }

  // 如果没有找到好的组合，使用贪心算法
  if (bestCombination.length === 0) {
    const greedySelection = selectGreedyVacation(
      availableWorkingDays,
      remainingDays,
      dateInfos,
      constraints
    );
    bestCombination = [...forcedVacationDates, ...greedySelection];
  }

  return bestCombination;
}

/**
 * 贪心算法选择休假日期
 */
function selectGreedyVacation(
  workingDays: string[],
  vacationDays: number,
  dateInfos: IDateInfo[],
  constraints?: IVacationConstraints
): string[] {
  // 为每个工作日评分
  const scoredDays = workingDays.map(date => {
    let score = 0;
    const dateInfo = dateInfos.find(d => d.date === date)!;
    const currentDay = dayjs(date);

    // 调休上班日高分
    if (dateInfo.isWeekend) {
      score += 100;
    }

    // 检查与非工作日的邻近程度
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      const checkDate = currentDay.add(i, 'day').format('YYYY-MM-DD');
      const checkDateInfo = dateInfos.find(d => d.date === checkDate);

      if (checkDateInfo && !checkDateInfo.isWorkingDay) {
        const distance = Math.abs(i);
        score += checkDateInfo.isHoliday ? 30 / distance : 10 / distance;
      }
    }

    return { date, score };
  });

  scoredDays.sort((a, b) => b.score - a.score);

  // 贪心选择
  const selected: string[] = [];
  for (const candidate of scoredDays) {
    if (selected.length >= vacationDays) break;

    const testDates = [...selected, candidate.date];
    if (validateConstraints(testDates, dateInfos, constraints)) {
      selected.push(candidate.date);
    }
  }

  return selected;
}

/**
 * 生成方案描述
 */
function generateDescription(vacationDates: string[], dateInfos: IDateInfo[]): string {
  const vacationSet = new Set(vacationDates);
  const descriptions: string[] = [];
  let currentStreak: string[] = [];
  let streakStart = '';

  for (const dateInfo of dateInfos) {
    if (vacationSet.has(dateInfo.date) || !dateInfo.isWorkingDay) {
      if (currentStreak.length === 0) {
        streakStart = dateInfo.date;
      }
      currentStreak.push(dateInfo.date);
    } else {
      if (currentStreak.length > 0) {
        const streakEnd = currentStreak[currentStreak.length - 1];
        descriptions.push(
          streakStart === streakEnd
            ? `${streakStart} (1天)`
            : `${streakStart} 至 ${streakEnd} (${currentStreak.length}天)`
        );
        currentStreak = [];
      }
    }
  }

  if (currentStreak.length > 0) {
    const streakEnd = currentStreak[currentStreak.length - 1];
    descriptions.push(
      streakStart === streakEnd
        ? `${streakStart} (1天)`
        : `${streakStart} 至 ${streakEnd} (${currentStreak.length}天)`
    );
  }

  return descriptions.join(', ');
}

/**
 * 计算最佳休假方案
 */
export async function calculateBestVacationPlan(
  startDate: string,
  endDate: string,
  vacationDays: number,
  constraints?: IVacationConstraints
): Promise<IVacationPlan[]> {
  const dateInfos = await getDateInfos(startDate, endDate);
  const vacationDates = selectOptimalVacationDates(dateInfos, vacationDays, constraints);

  if (vacationDates.length === 0) {
    return [];
  }

  const totalHolidays = calculateTotalHolidayDays(vacationDates, dateInfos);
  const segments = calculateContinuousVacationSegments(vacationDates, dateInfos);
  const maxSegment = Math.max(...segments, 0);
  const efficiency = totalHolidays / vacationDates.length;
  const description = generateDescription(vacationDates, dateInfos);

  return [
    {
      dates: vacationDates.sort(),
      score: efficiency * 100, // 简化得分为效率
      totalDays: vacationDays,
      continuousDays: maxSegment,
      description,
    },
  ];
}

/**
 * 获取休假建议
 */
export async function getVacationSuggestions(
  startDate: string,
  endDate: string,
  vacationDays: number,
  constraints?: IVacationConstraints
): Promise<{
  bestPlans: IVacationPlan[];
  summary: {
    totalWorkdays: number;
    totalHolidays: number;
    totalWeekends: number;
    vacationDays: number;
    constraints?: IVacationConstraints;
  };
}> {
  const dateInfos = await getDateInfos(startDate, endDate);
  const bestPlans = await calculateBestVacationPlan(startDate, endDate, vacationDays, constraints);

  const summary = {
    totalWorkdays: dateInfos.filter(d => d.isWorkingDay).length,
    totalHolidays: dateInfos.filter(d => d.isHoliday).length,
    totalWeekends: dateInfos.filter(d => d.isWeekend && !d.isHoliday).length,
    vacationDays,
    constraints,
  };

  return { bestPlans, summary };
}
