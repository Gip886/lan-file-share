import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Input,
  Modal,
  Form,
  Switch,
  message,
  Popconfirm,
  Tooltip,
  Tag,
  Breadcrumb,
  Table,
  Dropdown,
  Tabs,
  Empty,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  FolderOpenOutlined,
  DeleteOutlined,
  ScanOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  FolderOutlined,
  FileOutlined,
  ReloadOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  PictureOutlined,
  FileTextOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { fileApi, FileStats } from '../api/file';
import type { FileItem, StoragePath } from '@lan-file-share/types';
import { formatFileSize, formatDuration } from '@lan-file-share/utils';

// 文件类型配置
const categoryConfig: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  video: { name: '视频', icon: <VideoCameraOutlined />, color: 'red' },
  audio: { name: '音频', icon: <AudioOutlined />, color: 'cyan' },
  image: { name: '图片', icon: <PictureOutlined />, color: 'blue' },
  subtitle: { name: '字幕', icon: <FileTextOutlined />, color: 'orange' },
  document: { name: '文档', icon: <FileTextOutlined />, color: 'purple' },
  other: { name: '其他', icon: <FileOutlined />, color: 'default' },
};

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [storagePaths, setStoragePaths] = useState<StoragePath[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [stats, setStats] = useState<FileStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [currentCategory, setCurrentCategory] = useState('all');
  const [currentFolder, setCurrentFolder] = useState('');
  const [pathModalOpen, setPathModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 加载统计
  const loadStats = async () => {
    try {
      const res: any = await fileApi.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('加载统计失败', error);
    }
  };

  // 加载文件夹列表
  const loadFolders = async () => {
    try {
      const params: any = {};
      if (currentCategory !== 'all') {
        params.category = currentCategory;
      }
      const res: any = await fileApi.getFolders(params);
      if (res.success) {
        setFolders(res.data);
      }
    } catch (error) {
      console.error('加载文件夹失败', error);
    }
  };

  // 加载文件列表
  const loadFiles = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (search) params.search = search;
      if (currentCategory !== 'all') params.category = currentCategory;
      if (currentFolder) params.folder = currentFolder;

      const res: any = await fileApi.getFiles(params);
      if (res.success) {
        setFiles(res.data.items);
        setTotal(res.data.total);
      }
    } catch (error) {
      message.error('加载文件列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载存储路径
  const loadStoragePaths = async () => {
    try {
      const res: any = await fileApi.getStoragePaths();
      if (res.success) {
        setStoragePaths(res.data);
      }
    } catch (error) {
      console.error('加载存储路径失败', error);
    }
  };

  useEffect(() => {
    loadStats();
    loadStoragePaths();
  }, []);

  useEffect(() => {
    loadFolders();
    loadFiles();
    setSelectedRowKeys([]);
  }, [page, pageSize, search, currentCategory, currentFolder]);

  // 扫描文件
  const handleScan = async () => {
    setScanning(true);
    try {
      const res: any = await fileApi.scanFiles();
      if (res.success) {
        if (res.warnings && res.warnings.length > 0) {
          res.warnings.forEach((msg: string) => message.warning(msg, 5));
        }
        if (res.errors && res.errors.length > 0) {
          res.errors.forEach((msg: string) => message.error(msg, 5));
        }
        if (res.data.added > 0 || res.data.updated > 0) {
          message.success(res.message);
          loadStats();
          loadFolders();
          loadFiles();
        } else if (!res.warnings?.length && !res.errors?.length) {
          message.info('扫描完成，没有发现新文件');
        }
      }
    } catch (error: any) {
      message.error(error.error || '扫描失败');
    } finally {
      setScanning(false);
    }
  };

  // 删除单个文件
  const handleDelete = async (id: string) => {
    try {
      await fileApi.deleteFile(id);
      message.success('删除成功');
      loadFiles();
      loadStats();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的文件');
      return;
    }
    try {
      const res: any = await fileApi.batchDelete(selectedRowKeys as string[]);
      if (res.success) {
        message.success(res.message);
        setSelectedRowKeys([]);
        loadFiles();
        loadStats();
      }
    } catch (error: any) {
      message.error(error.error || '批量删除失败');
    }
  };

  // 删除文件夹内所有文件
  const handleDeleteFolder = async (folder: string) => {
    try {
      const res: any = await fileApi.batchDeleteFolder(folder);
      if (res.success) {
        message.success(res.message);
        loadFiles();
        loadFolders();
        loadStats();
      }
    } catch (error: any) {
      message.error(error.error || '删除失败');
    }
  };

  // 播放文件
  const handlePlay = (file: FileItem) => {
    const token = localStorage.getItem('token');
    const url = `/api/v1/stream/video/${file.id}?token=${token}`;
    window.open(url, '_blank');
  };

  // 面包屑导航
  const renderBreadcrumb = () => {
    if (!currentFolder) return null;

    const parts = currentFolder.split('/');
    const items = [
      { title: <a onClick={() => setCurrentFolder('')}>根目录</a> },
      ...parts.map((part, index) => {
        const path = parts.slice(0, index + 1).join('/');
        const isLast = index === parts.length - 1;
        return {
          title: isLast ? part : <a onClick={() => setCurrentFolder(path)}>{part}</a>,
        };
      }),
    ];
    return <Breadcrumb items={items} style={{ marginBottom: 16 }} />;
  };

  // 文件夹列表
  const renderFolders = () => {
    if (search || folders.length === 0) return null;

    // 过滤当前层级的文件夹
    const currentLevelFolders = folders.filter(f => {
      if (currentFolder) {
        if (!f.startsWith(currentFolder + '/')) return false;
        const relative = f.substring(currentFolder.length + 1);
        return !relative.includes('/');
      } else {
        return !f.includes('/');
      }
    });

    if (currentLevelFolders.length === 0) return null;

    return (
      <div style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          {currentLevelFolders.map(folder => {
            const name = currentFolder ? folder.substring(currentFolder.length + 1) : folder;
            return (
              <Col key={folder}>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'delete',
                        label: '删除文件夹内所有文件',
                        icon: <DeleteOutlined />,
                        danger: true,
                      },
                    ],
                    onClick: ({ key }) => {
                      if (key === 'delete') {
                        Modal.confirm({
                          title: '确认删除',
                          content: `确定要删除文件夹 "${name}" 内的所有文件记录吗？`,
                          onOk: () => handleDeleteFolder(folder),
                        });
                      }
                    },
                  }}
                  trigger={['contextMenu']}
                >
                  <Tag
                    style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 14 }}
                    onClick={() => setCurrentFolder(folder)}
                  >
                    <FolderOutlined /> {name}
                  </Tag>
                </Dropdown>
              </Col>
            );
          })}
        </Row>
      </div>
    );
  };

  // 分类标签页
  const renderCategoryTabs = () => {
    const totalFiles = stats.reduce((sum, s) => sum + s.count, 0);
    const tabs = [
      { key: 'all', label: `全部 (${totalFiles})` },
      ...stats.map(s => {
        const config = categoryConfig[s.category] || categoryConfig.other;
        return {
          key: s.category,
          label: `${config.name} (${s.count})`,
        };
      }),
    ];

    return (
      <Tabs
        activeKey={currentCategory}
        onChange={(key) => {
          setCurrentCategory(key);
          setCurrentFolder('');
          setPage(1);
        }}
        items={tabs.map(t => ({ key: t.key, label: t.label }))}
        style={{ marginBottom: 16 }}
      />
    );
  };

  // 统计卡片
  const renderStats = () => (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      {stats.map(s => {
        const config = categoryConfig[s.category] || categoryConfig.other;
        return (
          <Col key={s.category}>
            <Card size="small" style={{ minWidth: 120 }}>
              <Statistic
                title={<>{config.icon} {config.name}</>}
                value={s.count}
                suffix={` (${formatFileSize(Number(s.totalSize))})`}
                valueStyle={{ fontSize: 16 }}
              />
            </Card>
          </Col>
        );
      })}
    </Row>
  );

  const columns: ColumnsType<FileItem> = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text, record) => {
        const config = categoryConfig[(record as any).category] || categoryConfig.other;
        return (
          <Tooltip title={(record as any).path}>
            <Space>
              {config.icon}
              <span>{text}</span>
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: '类型',
      dataIndex: 'category',
      key: 'category',
      width: 80,
      render: (category) => {
        const config = categoryConfig[category] || categoryConfig.other;
        return <Tag color={config.color}>{config.name}</Tag>;
      },
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size) => formatFileSize(Number(size)),
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration) => duration ? formatDuration(duration) : '-',
    },
    {
      title: '分辨率',
      key: 'resolution',
      width: 100,
      render: (_, record) =>
        (record as any).width && (record as any).height
          ? `${(record as any).width}x${(record as any).height}`
          : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => {
        const category = (record as any).category;
        const items: MenuProps['items'] = [
          {
            key: 'delete',
            label: '删除',
            icon: <DeleteOutlined />,
            danger: true,
          },
        ];

        return (
          <Space>
            {(category === 'video' || category === 'audio') && (
              <Button
                type="link"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handlePlay(record)}
              >
                播放
              </Button>
            )}
            {category === 'image' && (
              <Button
                type="link"
                size="small"
                onClick={() => window.open(`/api/v1/public/raw/${record.id}`, '_blank')}
              >
                查看
              </Button>
            )}
            <Dropdown menu={{ items, onClick: ({ key }) => {
              if (key === 'delete') handleDelete(record.id);
            }}}>
              <Button type="link" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      {renderStats()}

      <Card
        title={
          <Space>
            <span>文件管理</span>
            {selectedRowKeys.length > 0 && (
              <Tag color="blue">已选 {selectedRowKeys.length} 项</Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title={`确定删除选中的 ${selectedRowKeys.length} 个文件吗？`}
                onConfirm={handleBatchDelete}
              >
                <Button danger icon={<DeleteOutlined />}>
                  批量删除
                </Button>
              </Popconfirm>
            )}
            <Input.Search
              placeholder="搜索文件"
              allowClear
              onSearch={setSearch}
              style={{ width: 200 }}
            />
            <Button icon={<ReloadOutlined />} onClick={() => { loadStats(); loadFolders(); loadFiles(); }}>
              刷新
            </Button>
            <Button icon={<FolderOpenOutlined />} onClick={() => setPathModalOpen(true)}>
              存储路径
            </Button>
            <Button type="primary" icon={<ScanOutlined />} loading={scanning} onClick={handleScan}>
              扫描文件
            </Button>
          </Space>
        }
      >
        {/* 分类标签 */}
        {renderCategoryTabs()}

        {/* 面包屑导航 */}
        {renderBreadcrumb()}

        {/* 文件夹列表 */}
        {renderFolders()}

        {/* 文件表格 */}
        <Table
          columns={columns}
          dataSource={files}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个文件`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          locale={{
            emptyText: (
              <Empty
                description={
                  search ? '未找到匹配的文件' : '暂无文件，请先添加存储路径并扫描'
                }
              />
            ),
          }}
        />
      </Card>

      {/* 存储路径管理弹窗 */}
      <Modal
        title="存储路径管理"
        open={pathModalOpen}
        onCancel={() => setPathModalOpen(false)}
        footer={null}
        width={600}
      >
        <StoragePathManager
          paths={storagePaths}
          onRefresh={loadStoragePaths}
        />
      </Modal>
    </div>
  );
}

// 存储路径管理组件
function StoragePathManager({
  paths,
  onRefresh,
}: {
  paths: StoragePath[];
  onRefresh: () => void;
}) {
  const [form] = Form.useForm();
  const [adding, setAdding] = useState(false);

  const handleAdd = async (values: { path: string }) => {
    setAdding(true);
    try {
      const res: any = await fileApi.addStoragePath(values.path);
      if (res.success) {
        message.success('添加成功');
        form.resetFields();
        onRefresh();
      }
    } catch (error: any) {
      message.error(error.error || '添加失败');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await fileApi.updateStoragePath(id, enabled);
      message.success('更新成功');
      onRefresh();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fileApi.deleteStoragePath(id);
      message.success('删除成功');
      onRefresh();
    } catch (error) {
      message.error('删除失败');
    }
  };

  return (
    <div>
      <Form form={form} onFinish={handleAdd} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item
          name="path"
          rules={[{ required: true, message: '请输入路径' }]}
          style={{ flex: 1 }}
        >
          <Input placeholder="输入文件夹路径，如：/mnt/movies" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={adding} icon={<PlusOutlined />}>
            添加
          </Button>
        </Form.Item>
      </Form>

      <Table
        dataSource={paths}
        rowKey="id"
        size="small"
        pagination={false}
        columns={[
          {
            title: '路径',
            dataIndex: 'path',
            key: 'path',
          },
          {
            title: '状态',
            dataIndex: 'enabled',
            key: 'enabled',
            width: 100,
            render: (enabled, record) => (
              <Switch
                checked={enabled}
                onChange={(checked) => handleToggle(record.id, checked)}
              />
            ),
          },
          {
            title: '操作',
            key: 'action',
            width: 80,
            render: (_, record) => (
              <Popconfirm
                title="确定删除此存储路径吗？"
                onConfirm={() => handleDelete(record.id)}
              >
                <Button type="link" danger size="small">
                  删除
                </Button>
              </Popconfirm>
            ),
          },
        ]}
      />
    </div>
  );
}
