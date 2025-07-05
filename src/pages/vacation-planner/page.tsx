import { memo, useState, useCallback, useEffect } from 'react';

import {
  CalendarOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
  StarOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  DatePicker,
  InputNumber,
  Button,
  Card,
  Form,
  Space,
  Tag,
  Statistic,
  Alert,
  Spin,
  Divider,
  Select,
  message,
  Row,
  Col,
  Typography,
  List,
  Badge,
} from 'antd';
import classNames from 'classnames';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import { PlanStatusIcon } from './components/plan-status-icon/plan-status-icon';
import { YearCalendar } from './components/year-calendar/year-calendar';
import type { IVacationPlan, IVacationConstraints } from './utils/calculate';
import { getVacationSuggestions } from './utils/calculate';
import { getHolidaysForYear, getWorkingWeekendsForYear } from './utils/holidays';

import './style.scss';

const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;

interface IFormData {
  dateRange: [Dayjs, Dayjs] | null;
  vacationDays: number;
  excludedDates: string[];
  mandatoryRanges: {
    startDate: string;
    endDate: string;
    days: number;
  }[];
  maxContinuousVacationDays?: number;
}

interface ICalculationResult {
  bestPlans: IVacationPlan[];
  summary: {
    totalWorkdays: number;
    totalHolidays: number;
    totalWeekends: number;
    vacationDays: number;
    constraints?: IVacationConstraints;
  };
}

export const VacationPlannerPage = memo(() => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ICalculationResult | null>(null);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(0);
  const [holidayDates, setHolidayDates] = useState<string[]>([]);
  const [workingWeekendDates, setWorkingWeekendDates] = useState<string[]>([]);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [formData, setFormData] = useState<IFormData>({
    dateRange: [dayjs(), dayjs().endOf('year')],
    vacationDays: 5,
    excludedDates: [],
    mandatoryRanges: [],
    maxContinuousVacationDays: 5,
  });

  // 获取节假日和周末上班数据
  useEffect(() => {
    const loadHolidaysAndWorkingWeekends = async (): Promise<void> => {
      const year = formData.dateRange ? formData.dateRange[0].year() : dayjs().year();
      setHolidayLoading(true);
      try {
        const [holidays, workingWeekends] = await Promise.all([
          getHolidaysForYear(year),
          getWorkingWeekendsForYear(year),
        ]);
        setHolidayDates(holidays);
        setWorkingWeekendDates(workingWeekends);
      } catch (error) {
        console.error('获取节假日和周末上班数据失败:', error);
      } finally {
        setHolidayLoading(false);
      }
    };

    void loadHolidaysAndWorkingWeekends();
  }, [formData.dateRange]);

  // 计算休假方案
  const handleCalculate = useCallback(async () => {
    if (!formData.dateRange) {
      message.error('请选择日期范围');
      return;
    }

    setLoading(true);
    try {
      const startDate = formData.dateRange[0].format('YYYY-MM-DD');
      const endDate = formData.dateRange[1].format('YYYY-MM-DD');

      const constraints: IVacationConstraints = {
        excludedDates: formData.excludedDates,
        mandatoryVacationWithinRange: formData.mandatoryRanges,
        maxContinuousVacationDays: formData.maxContinuousVacationDays,
      };

      const calculationResult = await getVacationSuggestions(
        startDate,
        endDate,
        formData.vacationDays,
        Object.keys(constraints).length > 0 ? constraints : undefined
      );

      setResult(calculationResult);
      message.success('计算完成！');
    } catch (error) {
      console.error('计算失败:', error);
      message.error('计算失败，请检查输入参数');
    } finally {
      setLoading(false);
    }
  }, [formData]);

  // 添加不可休假日期
  const handleAddExcludedDate = useCallback(
    (date: string) => {
      if (date && !formData.excludedDates.includes(date)) {
        setFormData(prev => ({
          ...prev,
          excludedDates: [...prev.excludedDates, date],
        }));
      }
    },
    [formData.excludedDates]
  );

  // 删除不可休假日期
  const handleRemoveExcludedDate = useCallback((date: string) => {
    setFormData(prev => ({
      ...prev,
      excludedDates: prev.excludedDates.filter(d => d !== date),
    }));
  }, []);

  // 添加强制休假范围
  const handleAddMandatoryRange = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      mandatoryRanges: [
        ...prev.mandatoryRanges,
        {
          startDate: '',
          endDate: '',
          days: 1,
        },
      ],
    }));
  }, []);

  // 更新强制休假范围
  const handleUpdateMandatoryRange = useCallback(
    (index: number, field: string, value: string | number) => {
      setFormData(prev => ({
        ...prev,
        mandatoryRanges: prev.mandatoryRanges.map((range, i) =>
          i === index ? { ...range, [field]: value } : range
        ),
      }));
    },
    []
  );

  // 删除强制休假范围
  const handleRemoveMandatoryRange = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      mandatoryRanges: prev.mandatoryRanges.filter((_, i) => i !== index),
    }));
  }, []);

  // 获取方案状态颜色
  const getPlanStatusColor = (index: number): string => {
    if (index === 0) return 'gold';
    if (index === 1) return 'cyan';
    if (index === 2) return 'blue';
    return 'default';
  };

  return (
    <div className="vacation-planner">
      <div className="vacation-planner__header">
        <Title level={2}>
          <CalendarOutlined /> 智能休假方案计算器
        </Title>
        <Paragraph type="secondary">
          基于中国节假日政策，智能推荐最佳休假方案，支持多种约束条件设置
        </Paragraph>
      </div>

      <Row gutter={24}>
        {/* 左侧输入区域 */}
        <Col span={8}>
          <Card title="参数设置" className="vacation-planner__form-card">
            <Form form={form} layout="vertical" className="vacation-planner__form">
              {/* 基础参数 */}
              <Form.Item label="日期范围" required>
                <RangePicker
                  className="vacation-planner__date-picker"
                  value={formData.dateRange}
                  onChange={dates =>
                    setFormData(prev => ({ ...prev, dateRange: dates as [Dayjs, Dayjs] | null }))
                  }
                  placeholder={['开始日期', '结束日期']}
                  disabledDate={current => current && current < dayjs().startOf('day')}
                />
              </Form.Item>

              <Form.Item label="休假天数" required>
                <InputNumber
                  min={1}
                  max={30}
                  value={formData.vacationDays}
                  onChange={value => setFormData(prev => ({ ...prev, vacationDays: value ?? 5 }))}
                  addonAfter="天"
                  className="vacation-planner__input-number"
                />
              </Form.Item>

              <Divider orientation="left">约束条件</Divider>
              {/* 连续休假天数限制 */}
              <Form.Item
                label={
                  <Space>
                    <span>最大连续休假天数</span>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      (包含中间节假日/周末)
                    </Text>
                  </Space>
                }
              >
                <InputNumber
                  min={0}
                  max={15}
                  value={formData.maxContinuousVacationDays}
                  onChange={value =>
                    setFormData(prev => ({
                      ...prev,
                      maxContinuousVacationDays: value ?? undefined,
                    }))
                  }
                  placeholder="不限制"
                  addonAfter="天"
                  className="vacation-planner__input-number"
                />
                <Text
                  type="secondary"
                  style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}
                >
                  设置为0表示不允许连续休假，留空表示不限制
                </Text>
              </Form.Item>

              {/* 不可休假日期 */}
              <Form.Item label="不可休假日期">
                <Space direction="vertical" className="vacation-planner__constraint-section">
                  <DatePicker
                    placeholder="选择不可休假日期"
                    onChange={date => {
                      if (date) {
                        handleAddExcludedDate(date.format('YYYY-MM-DD'));
                      }
                    }}
                    disabledDate={current => {
                      if (!formData.dateRange) return false;
                      return (
                        current &&
                        (current < formData.dateRange[0] ||
                          current > formData.dateRange[1] ||
                          formData.excludedDates.includes(current.format('YYYY-MM-DD')))
                      );
                    }}
                  />
                  <div className="vacation-planner__excluded-dates">
                    {formData.excludedDates.map(date => (
                      <Tag
                        key={date}
                        closable
                        onClose={() => handleRemoveExcludedDate(date)}
                        color="red"
                      >
                        {date}
                      </Tag>
                    ))}
                  </div>
                </Space>
              </Form.Item>

              {/* 强制休假范围 */}
              <Form.Item label="强制休假区间">
                <Space direction="vertical" className="vacation-planner__mandatory-section">
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={handleAddMandatoryRange}
                    className="vacation-planner__add-button"
                  >
                    添加区间约束
                  </Button>
                  {formData.mandatoryRanges.map((range, index) => (
                    <Card
                      key={index}
                      size="small"
                      className="vacation-planner__mandatory-card"
                      extra={
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveMandatoryRange(index)}
                          danger
                        />
                      }
                    >
                      <Space direction="vertical" size="small">
                        <RangePicker
                          size="small"
                          placeholder={['开始日期', '结束日期']}
                          onChange={dates => {
                            if (dates?.[0] && dates?.[1]) {
                              handleUpdateMandatoryRange(
                                index,
                                'startDate',
                                dates[0].format('YYYY-MM-DD')
                              );
                              handleUpdateMandatoryRange(
                                index,
                                'endDate',
                                dates[1].format('YYYY-MM-DD')
                              );
                            }
                          }}
                        />
                        <InputNumber
                          size="small"
                          min={1}
                          placeholder="必须休假天数"
                          value={range.days}
                          onChange={value => handleUpdateMandatoryRange(index, 'days', value ?? 1)}
                          addonAfter="天"
                        />
                      </Space>
                    </Card>
                  ))}
                </Space>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  size="large"
                  loading={loading}
                  onClick={handleCalculate}
                  className="vacation-planner__calculate-button"
                  block
                >
                  <CalendarOutlined /> 计算最佳方案
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 右侧结果区域 */}
        <Col span={16}>
          <Spin spinning={loading}>
            {result ? (
              <Space direction="vertical" size="large" className="vacation-planner__result">
                {/* 统计信息 */}
                <Card title="统计信息" className="vacation-planner__stats-card">
                  <Row gutter={16}>
                    <Col span={6}>
                      <Statistic
                        title="总工作日"
                        value={result.summary.totalWorkdays}
                        suffix="天"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="总节假日"
                        value={result.summary.totalHolidays}
                        suffix="天"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="总周末"
                        value={result.summary.totalWeekends}
                        suffix="天"
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="计划休假"
                        value={result.summary.vacationDays}
                        suffix="天"
                        valueStyle={{ color: '#f5222d' }}
                      />
                    </Col>
                  </Row>
                </Card>

                {/* 推荐方案 */}
                <Card
                  title={
                    <Space>
                      <StarOutlined />
                      推荐方案
                      <Badge count={result.bestPlans.length} />
                    </Space>
                  }
                  className="vacation-planner__plans-card"
                >
                  {result.bestPlans.length === 0 ? (
                    <Alert
                      message="未找到符合条件的方案"
                      description="请尝试调整休假天数或约束条件"
                      type="warning"
                      showIcon
                      icon={<ExclamationCircleOutlined />}
                    />
                  ) : (
                    <List
                      dataSource={result.bestPlans}
                      renderItem={(plan, index) => (
                        <List.Item className="vacation-planner__plan-item">
                          <Card
                            size="small"
                            className={classNames('vacation-planner__plan-card', {
                              'vacation-planner__plan-card--best': index === 0,
                            })}
                            title={
                              <Space>
                                <PlanStatusIcon index={index} />
                                <Text strong>
                                  方案 {index + 1}
                                  {index === 0 && (
                                    <Tag color="gold" style={{ marginLeft: 8 }}>
                                      推荐
                                    </Tag>
                                  )}
                                </Text>
                                <Tag color={getPlanStatusColor(index)}>得分: {plan.score}</Tag>
                              </Space>
                            }
                          >
                            <Space direction="vertical" className="vacation-planner__plan-content">
                              <div>
                                <Text strong>休假日期: </Text>
                                <div className="vacation-planner__plan-dates">
                                  {plan.dates.map(date => (
                                    <Tag key={date} color="blue">
                                      {date}
                                    </Tag>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <Text strong>最长连续假期: </Text>
                                <Text type="success">{plan.continuousDays} 天</Text>
                              </div>

                              <div>
                                <Text strong>假期安排: </Text>
                                <Text>{plan.description}</Text>
                              </div>
                            </Space>
                          </Card>
                        </List.Item>
                      )}
                    />
                  )}
                </Card>

                {/* 日历视图 */}
                <Card
                  title={
                    <Space>
                      <CalendarOutlined />
                      日历视图
                      {result.bestPlans.length > 1 && (
                        <Space>
                          <Text type="secondary">选择方案:</Text>
                          <Select
                            value={selectedPlanIndex}
                            onChange={setSelectedPlanIndex}
                            size="small"
                            style={{ minWidth: 100 }}
                          >
                            {result.bestPlans.map((plan, index) => (
                              <Select.Option key={index} value={index}>
                                方案 {index + 1} (得分: {plan.score})
                              </Select.Option>
                            ))}
                          </Select>
                        </Space>
                      )}
                    </Space>
                  }
                  className="vacation-planner__calendar-card"
                >
                  <div className="vacation-planner__calendar-container">
                    {/* 图例 */}
                    <div className="vacation-planner__calendar-legend">
                      <Space wrap>
                        <Tag color="red">
                          <span className="vacation-planner__legend-indicator vacation-planner__legend-indicator--vacation"></span>
                          计划休假（休）
                        </Tag>
                        <Tag color="darkgrey">
                          <span className="vacation-planner__legend-indicator vacation-planner__legend-indicator--excluded"></span>
                          不可休假（禁）
                        </Tag>
                        <Tag color="geekblue">
                          <span className="vacation-planner__legend-indicator vacation-planner__legend-indicator--today"></span>
                          今天
                        </Tag>
                        <Tag color="blue">
                          <span className="vacation-planner__legend-indicator vacation-planner__legend-indicator--working-weekend"></span>
                          周末上班（班）
                        </Tag>
                        <Tag color="magenta">
                          <span className="vacation-planner__legend-indicator vacation-planner__legend-indicator--weekend-rest"></span>
                          周末休息
                        </Tag>
                        <Tag color="green">
                          <span className="vacation-planner__legend-indicator vacation-planner__legend-indicator--range"></span>
                          选择范围
                        </Tag>
                        <Tag color="magenta">
                          <span className="vacation-planner__legend-indicator vacation-planner__legend-indicator--holiday"></span>
                          节假日（假）
                        </Tag>
                      </Space>
                      {holidayLoading && (
                        <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
                          正在加载节假日数据...
                        </Text>
                      )}
                    </div>

                    {/* Mac风格年视图日历 */}
                    <YearCalendar
                      year={formData.dateRange ? formData.dateRange[0].year() : dayjs().year()}
                      vacationDates={result.bestPlans[selectedPlanIndex]?.dates || []}
                      excludedDates={formData.excludedDates}
                      holidayDates={holidayDates}
                      workingWeekendDates={workingWeekendDates}
                      dateRange={formData.dateRange}
                      onDateClick={date => {
                        console.log('点击日期:', date);
                      }}
                    />
                  </div>
                </Card>

                {/* 约束条件验证 */}
                {result.summary.constraints && (
                  <Card
                    title={
                      <Space>
                        <InfoCircleOutlined />
                        约束条件
                      </Space>
                    }
                    className="vacation-planner__constraints-card"
                  >
                    <Space direction="vertical">
                      {result.summary.constraints.excludedDates &&
                        result.summary.constraints.excludedDates.length > 0 && (
                          <div>
                            <Text strong>不可休假日期: </Text>
                            <Space wrap>
                              {result.summary.constraints.excludedDates.map(date => (
                                <Tag key={date} color="red">
                                  {date}
                                </Tag>
                              ))}
                            </Space>
                          </div>
                        )}

                      {result.summary.constraints.mandatoryVacationWithinRange &&
                        result.summary.constraints.mandatoryVacationWithinRange.length > 0 && (
                          <div>
                            <Text strong>强制休假区间: </Text>
                            <Space direction="vertical">
                              {result.summary.constraints.mandatoryVacationWithinRange.map(
                                (range, index) => (
                                  <Tag key={index} color="orange">
                                    {range.startDate} ~ {range.endDate}: 必须休满 {range.days} 天
                                  </Tag>
                                )
                              )}
                            </Space>
                          </div>
                        )}

                      {result.summary.constraints.maxContinuousVacationDays !== undefined && (
                        <div>
                          <Text strong>连续休假限制: </Text>
                          <Tag color="purple">
                            {result.summary.constraints.maxContinuousVacationDays === 0
                              ? '不允许连续休假'
                              : `最多连续休假 ${result.summary.constraints.maxContinuousVacationDays} 天`}
                          </Tag>
                        </div>
                      )}
                    </Space>
                  </Card>
                )}
              </Space>
            ) : (
              <Card className="vacation-planner__empty-card">
                <div className="vacation-planner__empty">
                  <CalendarOutlined className="vacation-planner__empty-icon" />
                  <Title level={4} type="secondary">
                    请设置参数并计算休假方案
                  </Title>
                  <Paragraph type="secondary">
                    设置日期范围和休假天数，可选择添加约束条件，点击计算按钮获取最佳休假方案
                  </Paragraph>
                </div>
              </Card>
            )}
          </Spin>
        </Col>
      </Row>
    </div>
  );
});

VacationPlannerPage.displayName = 'VacationPlannerPage';
