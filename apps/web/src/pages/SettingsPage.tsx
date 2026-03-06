import { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Modal,
  Form,
  Input,
  message,
  Statistic,
  Row,
  Col,
  Divider,
} from 'antd';
import { LockOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/auth';
import { authApi } from '../api/auth';
import { adminApi } from '../api/admin';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 加载系统信息（管理员）
  const loadSystemInfo = async () => {
    if (user?.role !== 'admin') return;
    try {
      const res: any = await adminApi.getSystemInfo();
      if (res.success) {
        setSystemInfo(res.data);
      }
    } catch (error) {
      console.error('加载系统信息失败', error);
    }
  };

  useEffect(() => {
    loadSystemInfo();
  }, [user]);

  // 修改密码
  const handleChangePassword = async (values: { oldPassword: string; newPassword: string }) => {
    setLoading(true);
    try {
      const res: any = await authApi.changePassword(values.oldPassword, values.newPassword);
      if (res.success) {
        message.success('密码修改成功');
        setPasswordModalOpen(false);
        form.resetFields();
      }
    } catch (error: any) {
      message.error(error.error || '修改失败');
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  };

  return (
    <div>
      <Card title="用户信息" style={{ marginBottom: 24 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
          <Descriptions.Item label="角色">
            {user?.role === 'admin' ? '管理员' : '普通用户'}
          </Descriptions.Item>
        </Descriptions>
        <Divider />
        <Button icon={<LockOutlined />} onClick={() => setPasswordModalOpen(true)}>
          修改密码
        </Button>
      </Card>

      {user?.role === 'admin' && systemInfo && (
        <Card
          title="系统信息"
          extra={
            <Button icon={<ReloadOutlined />} onClick={loadSystemInfo}>
              刷新
            </Button>
          }
        >
          <Row gutter={24}>
            <Col span={6}>
              <Statistic title="用户数" value={systemInfo.userCount} />
            </Col>
            <Col span={6}>
              <Statistic title="文件数" value={systemInfo.fileCount} />
            </Col>
            <Col span={6}>
              <Statistic title="存储路径" value={systemInfo.storagePathCount} />
            </Col>
            <Col span={6}>
              <Statistic title="访问记录" value={systemInfo.accessLogCount} />
            </Col>
          </Row>
          <Divider />
          <Descriptions column={2}>
            <Descriptions.Item label="运行时间">
              {formatUptime(systemInfo.uptime)}
            </Descriptions.Item>
            <Descriptions.Item label="Node.js 版本">
              {systemInfo.nodeVersion}
            </Descriptions.Item>
            <Descriptions.Item label="平台">
              {systemInfo.platform}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onCancel={() => {
          setPasswordModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleChangePassword} layout="vertical">
          <Form.Item
            name="oldPassword"
            label="旧密码"
            rules={[{ required: true, message: '请输入旧密码' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              确认修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}