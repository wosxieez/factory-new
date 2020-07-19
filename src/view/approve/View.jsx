import React, { useState, useEffect, useCallback } from 'react'
import api from '../../http'
import { Table, Modal, Button, Icon, Input, message, Row, Col, Alert, Tooltip, DatePicker, Tag, TreeSelect } from 'antd'
import moment from 'moment'
import OperationView from './OperationView'
var originOrdersList
/**
 * 待审批的申请列表
 */
export default props => {
    const [treeData] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [operationVisible, setOperationVisible] = useState(false)
    const [storeList, setOrdersList] = useState([])
    const [currentItem, setCurrentItem] = useState({})
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    const [selectedRows, setSelectedRows] = useState([])
    const [searchName, setSearchName] = useState('')
    const [searchTags, setSearchTags] = useState([])
    const [searchTime, setSearchTime] = useState([])
    const listOrders = useCallback(async () => {
        setIsLoading(true)
        setSelectedRowKeys([])
        setSelectedRows([])
        let sql = `select orders.*,order_type.order_name as order_type_name ,major.name as major_name from orders 
        left join (select * from order_type where isdelete = 0) order_type on orders.type_id = order_type.id
        left join (select * from major where isdelete = 0) major on orders.major_id = major.id
        where orders.isdelete = 0
        `
        let result = await api.query(sql)
        if (result.code === 0) {
            result.data = result.data[0]
            originOrdersList = result.data
                .map((item, index) => {
                    item.key = index
                    return item
                })
                .reverse()
            // console.log('originOrdersList:', originOrdersList)
            setOrdersList(originOrdersList)
        }
        setIsLoading(false)

        // let result3 = await api.query(`select * from tags`)
        // console.log('result3:', result3)
    }, [])
    useEffect(() => {
        listOrders()
    }, [props.selectNode, listOrders])

    const batchDelete = useCallback(() => {
        Modal.confirm({
            title: `确认要批量删除这${selectedRows.length}条记录吗？`,
            content: '请自行确保所选的信息的准确性',
            okText: '删除',
            okType: 'danger',
            onOk: async function () {
                let idList = selectedRows.map(item => item.id)
                // console.log('idList:', idList.join(','))
                let sql = `update orders set isdelete = 1 where id in (${idList.join(',')})`
                let result = await api.query(sql)
                if (result.code === 0) {
                    message.success('删除成功', 4)
                }
                listOrders()
            },
            onCancel: function () {
                console.log('onCancel')
            }
        })
    }, [selectedRows, listOrders])

    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedRowKeys, selectedRows) => {
            setSelectedRowKeys(selectedRowKeys)
            setSelectedRows(selectedRows)
        }
    }
    const columns = [
        {
            title: '申请时间',
            dataIndex: 'createdAt',
            align: 'center',
            width: 140,
            render: (text, record) => {
                return <div>{text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : ''}</div>
            }
        },
        { title: '单号', dataIndex: 'code', width: 120, align: 'center' },
        {
            title: '申请类型',
            dataIndex: 'order_type_name',
            width: 120,
            align: 'center',
            render: (text, record) => {
                return <div>{text || '/'}</div>
            }
        },
        {
            title: '所属专业',
            dataIndex: 'major_name',
            width: 120,
            align: 'center',
            render: (text, record) => {
                return <div>{text || '/'}</div>
            }
        },
        {
            title: '申请人',
            dataIndex: 'create_user',
            width: 120,
            align: 'center',
            render: (text, record) => {
                return <div>{text || '/'}</div>
            }
        },
        {
            title: '申请内容',
            dataIndex: 'content',
            align: 'center',
            render: (text, record) => {
                let result = JSON.parse(text).map((item, index) => {
                    return (
                        <Tag color={'blue'} key={index}>
                            {item.store_name} 数量:{item.count}
                        </Tag>
                    )
                })
                return <div>{result || '/'}</div>
            }
        },
        {
            title: '备注',
            dataIndex: 'remark',
            align: 'center',
            width: 140,
            render: (text, record) => {
                return <div>{text || '/'}</div>
            }
        },
        {
            title: '当前状态',
            dataIndex: 'status',
            width: 140,
            align: 'center',
            render: (text, record) => {
                let result = '/'
                let color = '#AAAAAA'
                switch (text) {
                    case 0:
                        result = '待审核'
                        break
                    case 1:
                        result = '审核中'
                        color = '#2db7f5'
                        break
                    case 2:
                        result = '通过'
                        color = '#87d068'
                        break
                    case 3:
                        result = '拒绝'
                        color = '#f50'
                        break
                    case 4:
                        result = '撤销'
                        break
                    default:
                        break
                }
                return <div>{<Tag color={color}>{result}</Tag> || '/'}</div>
            }
        },
        {
            title: '操作',
            dataIndex: 'action',
            width: 80,
            align: 'center',
            render: (text, record) => {
                return (
                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                        <Button
                            type='link'
                            size='small'
                            onClick={() => {
                                setCurrentItem(record)
                                setOperationVisible(true)
                            }}>
                            处理
            </Button>
                    </div>
                )
            }
        }
    ]
    return (
        <div style={styles.root}>
            <div style={styles.header}>
                <Row gutter={16} {...rowProps}>
                    <Col span={6}>
                        <Row {...rowProps}>
                            <Col span={4}>单号:</Col>
                            <Col span={20}>
                                <Input
                                    allowClear
                                    placeholder={'请输入单号'}
                                    value={searchName}
                                    onChange={e => {
                                        setSearchName(e.target.value)
                                    }}
                                />
                            </Col>
                        </Row>
                    </Col>
                    <Col span={6}>
                        <Row {...rowProps}>
                            <Col span={4}>专业:</Col>
                            <Col span={20}>
                                <TreeSelect
                                    allowClear
                                    multiple
                                    treeNodeFilterProp='title'
                                    showSearch
                                    treeData={treeData}
                                    style={{ width: '100%' }}
                                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                                    placeholder='请选择专业'
                                    // treeCheckable={true}
                                    showCheckedStrategy={TreeSelect.SHOW_PARENT}
                                    value={searchTags}
                                    onChange={v => {
                                        setSearchTags(v)
                                    }}
                                />
                            </Col>
                        </Row>
                    </Col>
                    <Col span={6}>
                        <Row {...rowProps}>
                            <Col span={6}>发起时间:</Col>
                            <Col span={18}>
                                <DatePicker.RangePicker
                                    value={searchTime}
                                    ranges={{
                                        今日: [moment(), moment()],
                                        本月: [moment().startOf('month'), moment().endOf('month')]
                                    }}
                                    onChange={t => {
                                        setSearchTime(t)
                                    }}
                                />
                            </Col>
                        </Row>
                    </Col>
                    <Col span={4}>
                        <div style={styles.headerCell}>
                            <Button
                                type='primary'
                                style={styles.button}
                                onClick={() => {
                                    console.log(searchTime, searchTags, searchName)
                                }}>
                                查询
              </Button>
                            <Button
                                style={styles.button}
                                onClick={() => {
                                    setSearchName('')
                                    setSearchTags([])
                                    setSearchTime([])
                                }}>
                                重置
              </Button>
                        </div>
                    </Col>
                </Row>
            </div>
            <div style={styles.body}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3>申请列表</h3>
                    <div>
                        {selectedRowKeys.length === 0 ? null : (
                            <Button style={styles.button} type='danger' onClick={batchDelete}>
                                批量删除
              </Button>
                        )}
                        <Tooltip title='刷新'>
                            <Icon
                                style={styles.button}
                                type='reload'
                                onClick={() => {
                                    listOrders()
                                }}
                            />
                        </Tooltip>
                    </div>
                </div>
                <Alert
                    style={styles.marginTop}
                    message={
                        <span style={styles.alertMessage}>
                            <span>已选择 <span style={{ color: '#1890ff', fontWeight: 800 }}>{selectedRowKeys.length}</span> 项</span>
                            <Button type='link' size='small' onClick={() => {
                                setSelectedRowKeys([])
                                setSelectedRows([])
                            }}>清空</Button>
                        </span>
                    }
                    type='info'
                    showIcon
                />
                <Table
                    loading={isLoading}
                    style={styles.marginTop}
                    rowSelection={rowSelection}
                    size='small'
                    bordered
                    columns={columns}
                    dataSource={storeList}
                    pagination={{
                        total: storeList.length,
                        showTotal: () => {
                            return <div>共{storeList.length}条记录</div>
                        },
                        showSizeChanger: true,
                        showQuickJumper: true,
                        pageSizeOptions: ['10', '50', '100']
                    }}
                />
                <OperationView
                    visible={operationVisible}
                    record={currentItem}
                    onCancel={() => {
                        setOperationVisible(false)
                    }}
                    onOk={() => {
                        setOperationVisible(false)
                    }}
                />
            </div>
        </div>
    )
}
const styles = {
    root: {
        backgroundColor: '#F1F1F1',
        width: '100%',
        height: '100%'
    },
    header: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        display: 'none'
    },
    marginTop: { marginTop: 10 },
    headerCell: {
        display: 'flex',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        height: 40
    },
    body: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        // marginTop: 16
    },
    button: {
        marginLeft: 10
    },
    alertMessage: {
        display: 'flex',
        justifyContent: 'space-between'
    }
}
const rowProps = {
    type: 'flex',
    justify: 'space-around',
    align: 'middle'
}
