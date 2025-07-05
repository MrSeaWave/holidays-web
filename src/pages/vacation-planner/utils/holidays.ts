import { isHoliday, isWeekEnd } from '@swjs/chinese-holidays';
import dayjs from 'dayjs';

/**
 * 获取指定年份的所有节假日
 */
export async function getHolidaysForYear(year: number): Promise<string[]> {
  const holidays: string[] = [];
  const startDate = dayjs().year(year).month(0).date(1); // 1月1日
  const endDate = dayjs().year(year).month(11).date(31); // 12月31日
  
  let current = startDate;
  
  while (current.isBefore(endDate) || current.isSame(endDate)) {
    const dateStr = current.format('YYYY-MM-DD');
    try {
      const isHolidayDay = await isHoliday(dateStr);
      if (isHolidayDay) {
        holidays.push(dateStr);
      }
    } catch (error) {
      console.warn(`检查节假日失败: ${dateStr}`, error);
    }
    current = current.add(1, 'day');
  }
  
  return holidays;
}

/**
 * 获取指定日期范围内的所有节假日
 */
export async function getHolidaysForDateRange(startDate: string, endDate: string): Promise<string[]> {
  const holidays: string[] = [];
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  
  let current = start;
  
  while (current.isBefore(end) || current.isSame(end)) {
    const dateStr = current.format('YYYY-MM-DD');
    try {
      const isHolidayDay = await isHoliday(dateStr);
      if (isHolidayDay) {
        holidays.push(dateStr);
      }
    } catch (error) {
      console.warn(`检查节假日失败: ${dateStr}`, error);
    }
    current = current.add(1, 'day');
  }
  
  return holidays;
}

/**
 * 批量检查日期是否为节假日
 */
export async function checkMultipleDatesIsHoliday(dates: string[]): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {};
  
  for (const date of dates) {
    try {
      result[date] = await isHoliday(date);
    } catch (error) {
      console.warn(`检查节假日失败: ${date}`, error);
      result[date] = false;
    }
  }
  
  return result;
}

/**
 * 获取指定年份的所有周末上班日
 */
export async function getWorkingWeekendsForYear(year: number): Promise<string[]> {
  const workingWeekends: string[] = [];
  const startDate = dayjs().year(year).month(0).date(1); // 1月1日
  const endDate = dayjs().year(year).month(11).date(31); // 12月31日
  
  let current = startDate;
  
  while (current.isBefore(endDate) || current.isSame(endDate)) {
    const dateStr = current.format('YYYY-MM-DD');
    const isWeekend = current.day() === 0 || current.day() === 6; // 周日或周六
    
    if (isWeekend) {
      try {
        const isWeekEndWork = await isWeekEnd(dateStr);
        // 如果是周末且需要上班（调休）
        if (!isWeekEndWork) {
          workingWeekends.push(dateStr);
        }
      } catch (error) {
        console.warn(`检查周末上班失败: ${dateStr}`, error);
      }
    }
    current = current.add(1, 'day');
  }
  
  return workingWeekends;
}

/**
 * 获取指定日期范围内的所有周末上班日
 */
export async function getWorkingWeekendsForDateRange(startDate: string, endDate: string): Promise<string[]> {
  const workingWeekends: string[] = [];
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  
  let current = start;
  
  while (current.isBefore(end) || current.isSame(end)) {
    const dateStr = current.format('YYYY-MM-DD');
    const isWeekend = current.day() === 0 || current.day() === 6;
    
    if (isWeekend) {
      try {
        const isWeekEndWork = await isWeekEnd(dateStr);
        // 如果是周末且需要上班（调休）
        if (!isWeekEndWork) {
          workingWeekends.push(dateStr);
        }
      } catch (error) {
        console.warn(`检查周末上班失败: ${dateStr}`, error);
      }
    }
    current = current.add(1, 'day');
  }
  
  return workingWeekends;
} 