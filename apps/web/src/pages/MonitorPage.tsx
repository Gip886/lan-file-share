import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tabs,
  Tag,
  Spin,
} from 'antd';
import {
  FileOutlined,
  CloudServerOutlined,
  DesktopOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { monitorApi } from '../api/monitor';
import type { MonitorStats, AccessLog, DeviceInfo, TrafficStats } from '@lan-file-share/types';
import { formatFileSize } from '@lan-file-share/utils';
import dayjs from 'dayjs';

export default function MonitorPage() {
  const [stats, setStats] = useState<MonitorStats | null>(null);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [traffic, setTraffic] = useState<TrafficStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsTotal, setLogsTotal] = useState(0);
  const [page, setPage] = useState(1);

  // 加载统计数据
  const loadStats = async () => {
    try {
      const res: any = await monitorApi.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('加载统计数据失败', error);
    }
  };

  // 加载访问日志
  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const res: any = await monitorApi.getLogs({ page, pageSize: 20 });
      if (res.success) {
        setLogs(res.data.items);
        setLogsTotal(res.data.total);
      }
    } catch (error) {
      console.error('加载访问日志失败', error);
    } finally {
      setLogsLoading(false);
    }
  };

  // 加载设备列表
  const loadDevices = async () => {
    try {
      const res: any = await monitorApi.getDevices();
      if (res.success) {
        setDevices(res.data);
      }
    } catch (error) {
      console.error('加载设备列表失败', error);
    }
  };

  // 加载流量统计
  const loadTraffic = async () => {
    try {
      const res: any = await monitorApi.getTraffic(7);
      if (res.success) {
        setTraffic(res.data);
      }
    } catch (error) {
      console.error('加载流量统计失败', error);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([loadStats(), loadLogs(), loadDevices(), loadTraffic()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [page]);

  const logColumns: ColumnsType<AccessLog> = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '用户',
      dataIndex: ['user', 'username'],
      key: 'user',
      width: 100,
      render: (username) => username || <Tag>匿名</Tag>,
    },
    {
      title: '文件',
      dataIndex: ['file', 'name'],
      key: 'file',
      ellipsis: true,
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 140,
    },
    {
      title: '设备',
      dataIndex: 'device',
      key: 'device',
      width: 100,
    },
    {
      title: '流量',
      dataIndex: 'bytesSent',
      key: 'bytesSent',
      width: 100,
      render: (bytes) => formatFileSize(Number(bytes)),
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration) => `${duration.toFixed(1)}s`,
    },
  ];

  const deviceColumns: ColumnsType<DeviceInfo> = [
    {
      title: 'IP 地址',
      dataIndex: 'ip',
      key: 'ip',
    },
    {
      title: '设备类型',
      dataIndex: 'device',
      key: 'device',
    },
    {
      title: '请求数',
      dataIndex: 'requestCount',
      key: 'requestCount',
    },
    {
      title: '总流量',
      dataIndex: 'totalBytes',
      key: 'totalBytes',
      render: (bytes) => formatFileSize(Number(bytes)),
    },
    {
      title: '最后访问',
      dataIndex: 'lastSeen',
      key: 'lastSeen',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="文件总数"
              value={stats?.totalFiles || 0}
              prefix={<FileOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总大小"
              value={Number(stats?.totalSize || 0)}
              prefix={<CloudServerOutlined />}
              formatter={(value) => formatFileSize(Number(value))}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日访问"
              value={stats?.todayAccess || 0}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃设备"
              value={stats?.activeDevices || 0}
              prefix={<DesktopOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 详细数据 */}
      <Tabs
        items={[
          {
            key: 'logs',
            label: '访问日志',
            children: (
              <Card>
                <Table
                  columns={logColumns}
                  dataSource={logs}
                  rowKey="id"
                  loading={logsLoading}
                  pagination={{
                    current: page,
                    pageSize: 20,
                    total: logsTotal,
                    onChange: setPage,
                  }}
                />
              </Card>
            ),
          },
          {
            key: 'devices',
            label: '设备列表',
            children: (
              <Card>
                <Table
                  columns={deviceColumns}
                  dataSource={devices}
                  rowKey="ip"
                  pagination={false}
                />
              </Card>
            ),
          },
          {
            key: 'traffic',
            label: '流量统计（最近7天）',
            children: (
              <Card>
                <Table
                  dataSource={traffic}
                  rowKey="date"
                  pagination={false}
                  columns={[
                    {
                      title: '日期',
                      dataIndex: 'date',
                      key: 'date',
                      render: (date) => dayjs(date).format('YYYY-MM-DD'),
                    },
                    {
                      title: '请求数',
                      dataIndex: 'requests',
                      key: 'requests',
                    },
                    {
                      title: '流量',
                      dataIndex: 'bytes',
                      key: 'bytes',
                      render: (bytes) => formatFileSize(Number(bytes)),
                    },
                  ]}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}