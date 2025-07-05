/**
 * 智能休假方案计算器
 *
 * 功能特性：
 * 1. 🎯 智能识别工作日、周末、节假日
 * 2. 📅 支持中国节假日和调休政策
 * 3. 🚫 支持设置不可休假日期
 * 4. 📋 支持设置日期范围内的强制休假约束
 * 5. 🏆 多策略评分算法，自动推荐最佳方案
 * 6. 🔄 支持多个约束条件同时生效
 *
 * 使用方法：
 * - 基础用法：calculateBestVacationPlan(startDate, endDate, vacationDays)
 * - 约束用法：calculateBestVacationPlan(startDate, endDate, vacationDays, constraints)
 * - 建议接口：getVacationSuggestions(startDate, endDate, vacationDays, constraints)
 *
 * 约束类型：
 * - excludedDates: 不可休假的日期列表
 * - mandatoryVacationWithinRange: 指定日期范围内必须休假的约束
 *
 * 示例函数：
 * - exampleUsage(): 基础功能演示
 * - exampleWithConstraints(): 单约束条件演示
 * - exampleWithMultipleConstraints(): 多约束条件演示
 * - testWeekendDetection(): 周末识别测试
 */

import { isHoliday, isWeekEnd } from '@swjs/chinese-holidays';
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
  isWorkday: boolean;
}

// 休假约束条件接口
export interface IVacationConstraints {
  // 不可休假的日期列表
  excludedDates?: string[];
  // 在指定日期范围内必须休假的约束
  mandatoryVacationWithinRange?: {
    startDate: string;
    endDate: string;
    days: number;
  }[];
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

    dateInfos.push({
      date: dateStr,
      isWeekend,
      isHoliday: isHolidayDay,
      isWorkday: !isWeekend && !isHolidayDay,
    });

    current = current.add(1, 'day');
  }

  return dateInfos;
}

/**
 * 验证休假方案是否满足约束条件
 */
function validateVacationConstraints(
  vacationDates: string[],
  constraints?: IVacationConstraints
): boolean {
  if (!constraints) {
    return true;
  }

  // 检查是否有不可休假的日期
  const excludedDates = constraints.excludedDates ?? [];
  if (excludedDates.some(date => vacationDates.includes(date))) {
    return false;
  }

  // 检查"指定日期范围内必须休n天假"的约束
  if (constraints.mandatoryVacationWithinRange) {
    for (const mandatory of constraints.mandatoryVacationWithinRange) {
      const startDate = dayjs(mandatory.startDate);
      const endDate = dayjs(mandatory.endDate);
      const vacationWithinRange = vacationDates.filter(date => {
        const vacationDate = dayjs(date);
        return (
          (vacationDate.isSame(startDate) || vacationDate.isAfter(startDate)) &&
          (vacationDate.isSame(endDate) || vacationDate.isBefore(endDate))
        );
      });

      if (vacationWithinRange.length < mandatory.days) {
        return false;
      }
    }
  }

  return true;
}

/**
 * 计算休假方案的得分
 */
function calculateScore(vacationDates: string[], dateInfos: IDateInfo[]): number {
  let score = 0;
  const vacationSet = new Set(vacationDates);

  // 基础得分：每个休假日 +10 分
  score += vacationDates.length * 10;

  // 连续休假奖励
  let continuousCount = 0;
  let maxContinuous = 0;
  let totalContinuousScore = 0;

  for (const dateInfo of dateInfos) {
    if (vacationSet.has(dateInfo.date) || !dateInfo.isWorkday) {
      continuousCount++;
      maxContinuous = Math.max(maxContinuous, continuousCount);
    } else {
      if (continuousCount > 0) {
        // 连续假期的奖励是指数级的，长假期奖励更高
        totalContinuousScore += Math.pow(continuousCount, 1.5) * 3;
      }
      continuousCount = 0;
    }
  }

  // 处理最后一个连续假期
  if (continuousCount > 0) {
    totalContinuousScore += Math.pow(continuousCount, 1.5) * 3;
  }

  score += totalContinuousScore;

  // 节假日连接奖励 - 大幅提升
  let holidayConnectionBonus = 0;

  for (const vacationDate of vacationDates) {
    const vacationDay = dayjs(vacationDate);
    const prevDay = vacationDay.subtract(1, 'day').format('YYYY-MM-DD');
    const nextDay = vacationDay.add(1, 'day').format('YYYY-MM-DD');

    const prevDayInfo = dateInfos.find(d => d.date === prevDay);
    const nextDayInfo = dateInfos.find(d => d.date === nextDay);

    // 如果休假日前后是节假日，给予高额奖励
    if (prevDayInfo?.isHoliday) {
      holidayConnectionBonus += 25; // 节假日连接奖励提升
    }
    if (nextDayInfo?.isHoliday) {
      holidayConnectionBonus += 25; // 节假日连接奖励提升
    }

    // 如果休假日前后是周末，给予中等奖励
    if (prevDayInfo && prevDayInfo.isWeekend && !prevDayInfo.isHoliday) {
      holidayConnectionBonus += 15;
    }
    if (nextDayInfo && nextDayInfo.isWeekend && !nextDayInfo.isHoliday) {
      holidayConnectionBonus += 15;
    }
  }

  score += holidayConnectionBonus;

  // 黄金周奖励：如果形成了5天以上的连续假期，给予特别奖励
  if (maxContinuous >= 5) {
    score += 50; // 黄金周奖励
  }
  if (maxContinuous >= 7) {
    score += 100; // 超长假期奖励
  }

  return score;
}

/**
 * 生成所有可能的休假组合
 */
function generateVacationCombinations(workdays: string[], vacationDays: number): string[][] {
  const combinations: string[][] = [];

  function backtrack(start: number, current: string[]): void {
    if (current.length === vacationDays) {
      combinations.push([...current]);
      return;
    }

    for (let i = start; i < workdays.length; i++) {
      current.push(workdays[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }

  backtrack(0, []);
  return combinations;
}

/**
 * 计算连续休假天数
 */
function calculateContinuousDays(vacationDates: string[], dateInfos: IDateInfo[]): number {
  const vacationSet = new Set(vacationDates);
  let maxContinuous = 0;
  let currentContinuous = 0;

  for (const dateInfo of dateInfos) {
    if (vacationSet.has(dateInfo.date) || !dateInfo.isWorkday) {
      currentContinuous++;
      maxContinuous = Math.max(maxContinuous, currentContinuous);
    } else {
      currentContinuous = 0;
    }
  }

  return maxContinuous;
}

/**
 * 生成休假方案描述
 */
function generateDescription(vacationDates: string[], dateInfos: IDateInfo[]): string {
  const vacationSet = new Set(vacationDates);
  const descriptions: string[] = [];

  let currentStreak: string[] = [];
  let streakStart = '';

  for (const dateInfo of dateInfos) {
    if (vacationSet.has(dateInfo.date) || !dateInfo.isWorkday) {
      if (currentStreak.length === 0) {
        streakStart = dateInfo.date;
      }
      currentStreak.push(dateInfo.date);
    } else {
      if (currentStreak.length > 0) {
        const streakEnd = currentStreak[currentStreak.length - 1];
        if (streakStart === streakEnd) {
          descriptions.push(`${streakStart} (1天)`);
        } else {
          descriptions.push(`${streakStart} 至 ${streakEnd} (${currentStreak.length}天)`);
        }
        currentStreak = [];
      }
    }
  }

  // 处理最后一个连续假期
  if (currentStreak.length > 0) {
    const streakEnd = currentStreak[currentStreak.length - 1];
    if (streakStart === streakEnd) {
      descriptions.push(`${streakStart} (1天)`);
    } else {
      descriptions.push(`${streakStart} 至 ${streakEnd} (${currentStreak.length}天)`);
    }
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
  // 获取日期范围内的所有日期信息
  const dateInfos = await getDateInfos(startDate, endDate);

  // 获取所有工作日，并排除不可休假的日期
  let workdays = dateInfos.filter(d => d.isWorkday).map(d => d.date);

  // 排除不可休假的日期
  const excludedDates = constraints?.excludedDates ?? [];
  if (excludedDates.length > 0) {
    workdays = workdays.filter(date => !excludedDates.includes(date));
  }

  // 如果休假天数超过可用工作日天数，返回空数组
  if (vacationDays > workdays.length) {
    return [];
  }

  // 如果工作日数量较少，可以枚举所有组合
  if (workdays.length <= 20) {
    const combinations = generateVacationCombinations(workdays, vacationDays);
    const plans: IVacationPlan[] = [];

    for (const combination of combinations) {
      // 验证是否满足约束条件
      if (!validateVacationConstraints(combination, constraints)) {
        continue;
      }

      const score = calculateScore(combination, dateInfos);
      const continuousDays = calculateContinuousDays(combination, dateInfos);
      const description = generateDescription(combination, dateInfos);

      plans.push({
        dates: combination,
        score,
        totalDays: vacationDays,
        continuousDays,
        description,
      });
    }

    // 按得分降序排序
    return plans.sort((a, b) => b.score - a.score);
  } else {
    // 对于工作日数量较多的情况，使用贪心算法
    return await calculateBestVacationPlanGreedy(startDate, endDate, vacationDays, constraints);
  }
}

/**
 * 贪心算法计算最佳休假方案（适用于日期范围较大的情况）
 */
async function calculateBestVacationPlanGreedy(
  startDate: string,
  endDate: string,
  vacationDays: number,
  constraints?: IVacationConstraints
): Promise<IVacationPlan[]> {
  const dateInfos = await getDateInfos(startDate, endDate);
  let workdays = dateInfos.filter(d => d.isWorkday).map(d => d.date);

  // 排除不可休假的日期
  const excludedDates = constraints?.excludedDates ?? [];
  if (excludedDates.length > 0) {
    workdays = workdays.filter(date => !excludedDates.includes(date));
  }

  // 策略1：智能节假日连接策略
  const vacationDates1 = selectVacationDaysStrategy1(workdays, dateInfos, vacationDays);

  // 策略2：优先选择能形成最长连续假期的工作日
  const vacationDates2 = selectVacationDaysStrategy2(dateInfos, vacationDays);

  // 策略3：均匀分布策略
  const vacationDates3 = selectVacationDaysStrategy3(workdays, vacationDays);

  // 策略4：黄金周策略
  const vacationDates4 = selectVacationDaysStrategy4(workdays, dateInfos, vacationDays);

  const plans: IVacationPlan[] = [];

  for (const vacationDates of [vacationDates1, vacationDates2, vacationDates3, vacationDates4]) {
    if (vacationDates.length > 0 && validateVacationConstraints(vacationDates, constraints)) {
      const score = calculateScore(vacationDates, dateInfos);
      const continuousDays = calculateContinuousDays(vacationDates, dateInfos);
      const description = generateDescription(vacationDates, dateInfos);

      plans.push({
        dates: vacationDates,
        score,
        totalDays: vacationDays,
        continuousDays,
        description,
      });
    }
  }

  // 去重并按得分排序
  const uniquePlans = plans.filter(
    (plan, index, self) =>
      index ===
      self.findIndex(
        p => p.dates.length === plan.dates.length && p.dates.every(d => plan.dates.includes(d))
      )
  );

  return uniquePlans.sort((a, b) => b.score - a.score);
}

/**
 * 策略1：智能节假日连接策略
 */
function selectVacationDaysStrategy1(
  workdays: string[],
  dateInfos: IDateInfo[],
  vacationDays: number
): string[] {
  const selected: string[] = [];
  const candidates = [...workdays];

  // 找出所有节假日群组
  const holidayGroups = findHolidayGroups(dateInfos);

  // 计算每个工作日的优先级
  const priorities = candidates.map(date => {
    let priority = 0;

    // 基础优先级：与节假日的连接能力
    const connectionScore = calculateHolidayConnectionScore(date, dateInfos, holidayGroups);
    priority += connectionScore;

    // 桥接奖励：如果这个工作日能连接两个节假日群组
    const bridgeScore = calculateBridgeScore(date, holidayGroups);
    priority += bridgeScore;

    // 群组扩展奖励：如果选择这个日期能显著延长假期
    const extensionScore = calculateExtensionScore(date, selected);
    priority += extensionScore;

    return { date, priority };
  });

  // 按优先级排序
  priorities.sort((a, b) => b.priority - a.priority);

  // 智能选择：不仅考虑单个优先级，还要考虑组合效果
  const remainingDays = vacationDays;
  const selectedDates = selectOptimalCombination(priorities, remainingDays);

  return selectedDates;
}

/**
 * 找出所有节假日群组
 */
function findHolidayGroups(dateInfos: IDateInfo[]): string[][] {
  const groups: string[][] = [];
  let currentGroup: string[] = [];

  for (const dateInfo of dateInfos) {
    if (!dateInfo.isWorkday) {
      // 节假日或周末
      currentGroup.push(dateInfo.date);
    } else {
      if (currentGroup.length > 0) {
        groups.push([...currentGroup]);
        currentGroup = [];
      }
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * 计算与节假日的连接分数
 */
function calculateHolidayConnectionScore(
  date: string,
  dateInfos: IDateInfo[],
  holidayGroups: string[][]
): number {
  let score = 0;
  const currentDay = dayjs(date);

  // 检查前后3天范围内的节假日
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue; // 跳过当前日期

    const checkDate = currentDay.add(i, 'day').format('YYYY-MM-DD');
    const checkDateInfo = dateInfos.find(d => d.date === checkDate);

    if (checkDateInfo && !checkDateInfo.isWorkday) {
      // 距离越近，奖励越高
      const distance = Math.abs(i);
      if (checkDateInfo.isHoliday) {
        score += 10 / distance; // 节假日奖励更高
      } else if (checkDateInfo.isWeekend) {
        score += 5 / distance; // 周末奖励中等
      }
    }
  }

  // 额外奖励：如果这个日期能连接较长的节假日群组
  for (const group of holidayGroups) {
    if (group.length >= 2) {
      // 只考虑2天以上的群组
      const groupStart = dayjs(group[0]);
      const groupEnd = dayjs(group[group.length - 1]);

      // 如果当前日期紧邻节假日群组
      if (
        currentDay.isSame(groupStart.subtract(1, 'day')) ||
        currentDay.isSame(groupEnd.add(1, 'day'))
      ) {
        score += group.length * 5; // 群组越长，奖励越高
      }
    }
  }

  return score;
}

/**
 * 计算桥接分数：连接两个节假日群组的能力
 */
function calculateBridgeScore(date: string, holidayGroups: string[][]): number {
  let score = 0;
  const currentDay = dayjs(date);

  // 检查是否能连接两个节假日群组
  for (const group of holidayGroups) {
    const groupStart = dayjs(group[0]);
    const groupEnd = dayjs(group[group.length - 1]);

    // 如果当前日期在两个群组之间
    if (
      currentDay.isAfter(groupStart.subtract(4, 'day')) &&
      currentDay.isBefore(groupEnd.add(4, 'day'))
    ) {
      score += 15; // 桥接奖励
    }
  }

  return score;
}

/**
 * 计算扩展分数：延长现有假期的能力
 */
function calculateExtensionScore(date: string, selectedDates: string[]): number {
  let score = 0;
  const currentDay = dayjs(date);

  // 检查是否能延长现有的选择
  for (const selectedDate of selectedDates) {
    const selectedDay = dayjs(selectedDate);
    const daysDiff = Math.abs(currentDay.diff(selectedDay, 'day'));

    if (daysDiff <= 3) {
      score += 8 / daysDiff; // 距离越近，扩展价值越高
    }
  }

  return score;
}

/**
 * 选择最优组合
 */
function selectOptimalCombination(
  priorities: { date: string; priority: number }[],
  vacationDays: number
): string[] {
  const selected: string[] = [];
  const candidates = [...priorities];

  // 贪心算法：每次选择当前最优的日期
  for (let i = 0; i < vacationDays && candidates.length > 0; i++) {
    // 重新计算优先级（考虑已选择的日期）
    candidates.forEach(candidate => {
      const extensionScore = calculateExtensionScore(candidate.date, selected);
      candidate.priority += extensionScore;
    });

    // 排序并选择最优日期
    candidates.sort((a, b) => b.priority - a.priority);
    const bestCandidate = candidates.shift();

    if (bestCandidate) {
      selected.push(bestCandidate.date);
    }
  }

  return selected;
}

/**
 * 策略2：优先选择能形成最长连续假期的工作日
 */
function selectVacationDaysStrategy2(dateInfos: IDateInfo[], vacationDays: number): string[] {
  const selected: string[] = [];

  // 找到所有可能的连续工作日段
  const workdaySegments: string[][] = [];
  let currentSegment: string[] = [];

  for (const dateInfo of dateInfos) {
    if (dateInfo.isWorkday) {
      currentSegment.push(dateInfo.date);
    } else {
      if (currentSegment.length > 0) {
        workdaySegments.push([...currentSegment]);
        currentSegment = [];
      }
    }
  }

  if (currentSegment.length > 0) {
    workdaySegments.push(currentSegment);
  }

  // 按段长度排序
  workdaySegments.sort((a, b) => b.length - a.length);

  // 从最长的段开始选择
  let remaining = vacationDays;
  for (const segment of workdaySegments) {
    if (remaining <= 0) break;

    const toSelect = Math.min(remaining, segment.length);
    selected.push(...segment.slice(0, toSelect));
    remaining -= toSelect;
  }

  return selected;
}

/**
 * 策略3：均匀分布策略
 */
function selectVacationDaysStrategy3(workdays: string[], vacationDays: number): string[] {
  const selected: string[] = [];

  if (vacationDays >= workdays.length) {
    return [...workdays];
  }

  // 均匀分布选择
  const step = Math.floor(workdays.length / vacationDays);
  for (let i = 0; i < vacationDays; i++) {
    const index = Math.min(i * step, workdays.length - 1);
    selected.push(workdays[index]);
  }

  return selected;
}

/**
 * 策略4：黄金周策略 - 专门针对节假日连接优化
 */
function selectVacationDaysStrategy4(
  workdays: string[],
  dateInfos: IDateInfo[],
  vacationDays: number
): string[] {
  const selected: string[] = [];
  const holidayGroups = findHolidayGroups(dateInfos);

  // 找出最佳的节假日连接机会
  const connectionOpportunities = findBestConnectionOpportunities(workdays, holidayGroups);

  // 按价值排序连接机会
  connectionOpportunities.sort((a, b) => b.value - a.value);

  let remainingDays = vacationDays;

  // 优先选择高价值的连接机会
  for (const opportunity of connectionOpportunities) {
    if (remainingDays <= 0) break;

    const daysNeeded = opportunity.workdays.length;
    if (daysNeeded <= remainingDays) {
      selected.push(...opportunity.workdays);
      remainingDays -= daysNeeded;
    } else {
      // 如果剩余天数不够，选择这个机会中最重要的几天
      const sortedWorkdays = opportunity.workdays
        .map(date => ({
          date,
          score: calculateHolidayConnectionScore(date, dateInfos, holidayGroups),
        }))
        .sort((a, b) => b.score - a.score);

      for (let i = 0; i < remainingDays && i < sortedWorkdays.length; i++) {
        selected.push(sortedWorkdays[i].date);
      }
      remainingDays = 0;
    }
  }

  // 如果还有剩余天数，用常规策略补充
  if (remainingDays > 0) {
    const additionalDays = selectVacationDaysStrategy2(dateInfos, remainingDays);
    selected.push(...additionalDays);
  }

  return selected;
}

/**
 * 找出最佳的节假日连接机会
 */
function findBestConnectionOpportunities(
  workdays: string[],
  holidayGroups: string[][]
): { workdays: string[]; value: number; description: string }[] {
  const opportunities: { workdays: string[]; value: number; description: string }[] = [];

  for (const group of holidayGroups) {
    if (group.length === 0) continue;

    const groupStart = dayjs(group[0]);
    const groupEnd = dayjs(group[group.length - 1]);

    // 检查群组前的连接机会
    const beforeWorkdays = [];
    for (let i = 1; i <= 5; i++) {
      const checkDate = groupStart.subtract(i, 'day').format('YYYY-MM-DD');
      if (workdays.includes(checkDate)) {
        beforeWorkdays.unshift(checkDate);
      } else {
        break; // 遇到非工作日停止
      }
    }

    if (beforeWorkdays.length > 0) {
      const value = (group.length + beforeWorkdays.length) * beforeWorkdays.length * 10;
      opportunities.push({
        workdays: beforeWorkdays,
        value,
        description: `连接节假日群组前端，可形成${group.length + beforeWorkdays.length}天假期`,
      });
    }

    // 检查群组后的连接机会
    const afterWorkdays = [];
    for (let i = 1; i <= 5; i++) {
      const checkDate = groupEnd.add(i, 'day').format('YYYY-MM-DD');
      if (workdays.includes(checkDate)) {
        afterWorkdays.push(checkDate);
      } else {
        break; // 遇到非工作日停止
      }
    }

    if (afterWorkdays.length > 0) {
      const value = (group.length + afterWorkdays.length) * afterWorkdays.length * 10;
      opportunities.push({
        workdays: afterWorkdays,
        value,
        description: `连接节假日群组后端，可形成${group.length + afterWorkdays.length}天假期`,
      });
    }

    // 检查桥接机会（连接两个节假日群组）
    const nextGroupIndex = holidayGroups.indexOf(group) + 1;
    if (nextGroupIndex < holidayGroups.length) {
      const nextGroup = holidayGroups[nextGroupIndex];
      const nextGroupStart = dayjs(nextGroup[0]);

      const bridgeWorkdays = [];
      let current = groupEnd.add(1, 'day');
      while (current.isBefore(nextGroupStart)) {
        const currentDateStr = current.format('YYYY-MM-DD');
        if (workdays.includes(currentDateStr)) {
          bridgeWorkdays.push(currentDateStr);
        }
        current = current.add(1, 'day');
      }

      if (bridgeWorkdays.length > 0 && bridgeWorkdays.length <= 3) {
        const totalLength = group.length + bridgeWorkdays.length + nextGroup.length;
        const value = totalLength * bridgeWorkdays.length * 15; // 桥接奖励更高
        opportunities.push({
          workdays: bridgeWorkdays,
          value,
          description: `桥接两个节假日群组，可形成${totalLength}天超长假期`,
        });
      }
    }
  }

  return opportunities;
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
    totalWorkdays: dateInfos.filter(d => d.isWorkday).length,
    totalHolidays: dateInfos.filter(d => d.isHoliday).length,
    totalWeekends: dateInfos.filter(d => d.isWeekend && !d.isHoliday).length,
    vacationDays,
    constraints,
  };

  return {
    bestPlans,
    summary,
  };
}
