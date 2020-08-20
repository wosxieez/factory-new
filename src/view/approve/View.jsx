import React, { useState, useEffect, useCallback } from 'react'
import { Table, Modal, Button, Input, message, Row, Col, Alert, DatePicker, Tag, TreeSelect, Select } from 'antd'
import OperationView from './OperationView'
import { getJsonTree, filterTag } from '../../util/tool';
import api from '../../http'
import moment from 'moment'
const { Option } = Select;
var originOrdersList

var allCondition = { code: null, type: null, tag: null, dateDuring: [], currentPage: 1, currentPageSize: 10 };
/**
 * 待审批的申请列表
 */
export default props => {
    const [isLoading, setIsLoading] = useState(false)
    const [operationVisible, setOperationVisible] = useState(false)
    const [storeList, setOrdersList] = useState([])
    const [currentItem, setCurrentItem] = useState({})
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    const [selectedRows, setSelectedRows] = useState([])
    const [listCount, setListCount] = useState(0)///数据总共查询到多少条
    const [typeOptions, setTypeOptions] = useState([])///类型选项数据
    const [treeData, setTreeData] = useState([])///标签选项数据


    const getType = useCallback(async () => {
        let sql = `select * from order_type where isdelete = 0`
        let result = await api.query(sql)
        if (result.code === 0) {
            let data = result.data[0]
            setTypeOptions(data)
        }
    }, [])

    const getTag = useCallback(async () => {
        let result = await api.listAllTag()
        if (result.code === 0) {
            result.data = filterTag(result.data, 1)
            let treeResult = result.data.map((item) => {
                return { id: item.id, pId: item.tids ? item.tids[0] : 0, value: item.id, title: item.name }
            })
            setTreeData(getJsonTree(treeResult, 0))
        }
    }, [])

    const getOrderCount = useCallback(async (condition_sql = '') => {
        let sql = `select count(id) count from orders where isdelete = 0 ${condition_sql}`
        let result = await api.query(sql)
        if (result.code === 0) {
            let data = result.data[0]
            setListCount(data[0].count)
        }
    }, [])

    const listOrders = useCallback(async () => {
        setIsLoading(true)
        setSelectedRowKeys([])
        setSelectedRows([])

        let code_sql = allCondition.code ? ` and orders.code like '%${allCondition.code}%'` : ''
        let type_sql = allCondition.type ? ` and orders.type_id = ${allCondition.type}` : ''
        let tag_sql = allCondition.tag ? ` and orders.tag_id = ${allCondition.tag}` : ''
        let date_sql = allCondition.dateDuring.length > 0 ? ` and orders.createdAt>'${allCondition.dateDuring[0].startOf('day').format('YYYY-MM-DD HH:mm:ss')}' and orders.createdAt<'${allCondition.dateDuring[1].endOf('day').format('YYYY-MM-DD HH:mm:ss')}'` : ''
        let condition_sql = code_sql + type_sql + tag_sql + date_sql;
        // console.log('条件sql:', condition_sql)
        getOrderCount(condition_sql)

        let beginNum = (allCondition.currentPage - 1) * allCondition.currentPageSize
        let sql = `select orders.*,order_type.order_name as order_type_name ,tags.name as tag_name,users.name as user_name from orders 
        left join (select * from order_type where isdelete = 0) order_type on orders.type_id = order_type.id
        left join (select * from tags where isdelete = 0) tags on orders.tag_id = tags.id
        left join (select * from users where isdelete = 0) users on orders.create_user = users.id
        where orders.isdelete = 0 ${condition_sql}
        order by orders.id desc limit ${beginNum},${allCondition.currentPageSize}
        `
        // console.log('sql:', sql)
        let result = await api.query(sql)
        if (result.code === 0) {
            result.data = result.data[0]
            // console.log('分页查询获取的数据:', result.data)
            originOrdersList = result.data.map((item, index) => { item.key = index; return item })
            setOrdersList(originOrdersList)
        }
        setIsLoading(false)
        // eslint-disable-next-line
    }, []) ///code, type, tag, dateDuring,
    /**
     * 整合搜索筛选条件
     */
    // const getCondition = useCallback(() => {
    //     let code_sql = code ? ` and orders.code like '%${code}%'` : ''
    //     let type_sql = type ? ` and orders.type_id = ${type}` : ''
    //     let tag_sql = tag ? ` and orders.tag_id = ${tag}` : ''
    //     let date_sql = dateDuring.length > 0 ? `and orders.createdAt>'${dateDuring[0].startOf('day').format('YYYY-MM-DD HH:mm:ss')}' and orders.createdAt<'${dateDuring[1].endOf('day').format('YYYY-MM-DD HH:mm:ss')}'` : ''
    //     let condition_sql = code_sql + type_sql + tag_sql + date_sql;
    //     console.log('condition_sql:', condition_sql)
    //     listOrders(condition_sql)
    //     getOrderCount(condition_sql)

    // }, [code, dateDuring, type, tag, listOrders, getOrderCount])

    useEffect(() => {
        listOrders()
        getType()
        getTag()
    }, [listOrders, getType, getTag])

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
            title: '标签',
            dataIndex: 'tag_name',
            width: 120,
            align: 'center',
            render: (text, record) => {
                return <div>{text || '/'}</div>
            }
        },
        {
            title: '申请人',
            dataIndex: 'user_name',
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
                        result = record.type_id === 1 ? '已出库' : '已入库'
                        color = '#722ed1'
                        break
                    case 3:
                        result = '完毕'
                        color = '#87d068'
                        break
                    case 4:
                        result = '拒绝'
                        color = '#f50'
                        break
                    case 5:
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
                            icon='form'
                            onClick={() => {
                                setCurrentItem(record)
                                setOperationVisible(true)
                            }}>
                            处理</Button>
                    </div>
                )
            }
        }
    ]
    return (
        <div style={styles.root}>
            <div style={styles.header}>
                <Row gutter={16} {...rowProps}>
                    <Col span={5}>
                        <Row {...rowProps}>
                            <Col span={4}>单号:</Col>
                            <Col span={20}>
                                <Input
                                    allowClear
                                    placeholder={'请输入单号'}
                                    onChange={e => {
                                        allCondition.code = e.target.value;
                                    }}
                                />
                            </Col>
                        </Row>
                    </Col>
                    <Col span={5}>
                        <Row {...rowProps}>
                            <Col span={4}>类型:</Col>
                            <Col span={20}>
                                <Select
                                    allowClear
                                    showSearch
                                    style={{ width: '100%' }}
                                    placeholder="请选择类型"
                                    optionFilterProp="children"
                                    onChange={(v) => { allCondition.type = v }}
                                    filterOption={(input, option) =>
                                        option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                    }
                                >
                                    {typeOptions.map((item, index) => { return <Option value={item.id} key={index}>{item.order_name}</Option> })}
                                </Select>
                            </Col>
                        </Row>
                    </Col>
                    <Col span={5}>
                        <Row {...rowProps}>
                            <Col span={4}>标签:</Col>
                            <Col span={20}>
                                <TreeSelect
                                    allowClear
                                    treeNodeFilterProp='title'
                                    showSearch
                                    treeData={treeData}
                                    style={{ width: '100%' }}
                                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                                    placeholder='请选择标签'
                                    showCheckedStrategy={TreeSelect.SHOW_PARENT}
                                    onChange={v => {
                                        allCondition.tag = v
                                    }}
                                />
                            </Col>
                        </Row>
                    </Col>
                    <Col span={7}>
                        <Row {...rowProps}>
                            <Col span={3}>时间:</Col>
                            <Col span={21}>
                                <DatePicker.RangePicker
                                    style={{ width: '100%' }}
                                    disabledDate={(current) => {
                                        return current > moment().endOf('day');
                                    }}
                                    ranges={{
                                        今日: [moment(), moment()],
                                        本月: [moment().startOf('month'), moment().endOf('day')]
                                    }}
                                    onChange={t => {
                                        allCondition.dateDuring = t;
                                    }}
                                />
                            </Col>
                        </Row>
                    </Col>
                    <Col span={2}>
                        <div style={styles.headerCell}>
                            <Button
                                icon='search'
                                // size='small'
                                type='primary'
                                style={styles.button}
                                onClick={() => {
                                    // console.log(code, type, tag, dateDuring)
                                    listOrders();
                                }}>查询</Button>
                        </div>
                    </Col>
                </Row>
            </div>
            <div style={styles.body}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3>申请列表</h3>
                    <div>
                        {selectedRowKeys.length === 0 ? null : (
                            <Button icon='delete' style={styles.button} type='danger' onClick={batchDelete}>批量删除</Button>
                        )}
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
                        total: listCount,
                        showTotal: () => {
                            return <div>共{listCount}条记录</div>
                        },
                        showSizeChanger: true,
                        showQuickJumper: true,
                        pageSizeOptions: ['10', '50', '100'],
                        onChange: (page, pageSize) => {
                            // setCurrentPage(page)
                            // setCurrentPageSize(pageSize)
                            allCondition.currentPage = page
                            allCondition.currentPageSize = pageSize
                            listOrders()
                        },
                        onShowSizeChange: (page, pageSize) => {
                            // setCurrentPage(page)
                            // setCurrentPageSize(pageSize)
                            allCondition.currentPage = page
                            allCondition.currentPageSize = pageSize
                            listOrders()
                        },
                    }}
                />
                <OperationView
                    refreshTableData={() => { listOrders() }}
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
        // display: 'none'
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
        marginTop: 16
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
