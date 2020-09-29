import React, { useState, useEffect, useCallback } from 'react'
import { Table, Modal, Button, Input, message, Row, Col, Alert, DatePicker, Tag, Select, Form } from 'antd'
import OperationView from './OperationView'
import api from '../../http'
import moment from 'moment'
import HttpApi from '../../http/HttpApi';
import AppData from '../../util/AppData';

var allCondition = { code: null, type_list: [], major_list: [], create_user_list: [], date_range: [], status_list: [], currentPage: 1, currentPageSize: 10 };
const statusOptions = [{ value: 1, type_and_step: [{ type: 1, step: 1 }, { type: 2, step: 1 }], des: '专工确认中', permission: 0 },
{ value: 2, type_and_step: [{ type: 1, step: 2 }, { type: 2, step: 2 }, { type: 3, step: 3 }], des: '库管确认中', permission: 5 },
{ value: 3, type_and_step: [{ type: 3, step: 1 }], des: '财务采购确认中', permission: 6 },
{ value: 4, type_and_step: [{ type: 1, step: 3 }, { type: 2, step: 3 }], des: '财务审计中', permission: 6 },
{ value: 5, type_and_step: [{ type: 3, step: 2 }], des: '采购处理', permission: 4 }]
/**
 * 待审批的申请列表
 */
export default _ => {
    const [isLoading, setIsLoading] = useState(false)
    const [operationVisible, setOperationVisible] = useState(false)
    const [orderList, setOrdersList] = useState([])
    const [currentItem, setCurrentItem] = useState({})
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    const [selectedRows, setSelectedRows] = useState([])
    const [listCount, setListCount] = useState(0)///数据总共查询到多少条
    const [defaultStatus, setDefaultStatus] = useState([])
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
        let date_sql = allCondition.date_range.length > 0 ? ` and orders.createdAt>'${allCondition.date_range[0]}' and orders.createdAt<'${allCondition.date_range[1]}'` : ''
        let code_sql = allCondition.code ? ` and orders.code like '%${allCondition.code}%'` : ''
        let type_sql = allCondition.type_list && allCondition.type_list.length > 0 ? ` and orders.type_id in (${allCondition.type_list.join(',')})` : ''
        let major_sql = allCondition.major_list && allCondition.major_list.length > 0 ? ` and orders.tag_id in (${allCondition.major_list.join(',')})` : ''
        let user_sql = allCondition.create_user_list && allCondition.create_user_list.length > 0 ? ` and orders.create_user in (${allCondition.create_user_list.join(',')})` : ''
        let condition_sql = code_sql + type_sql + major_sql + date_sql + user_sql + checkStatusSql(allCondition.status_list);
        // console.log('条件sql:', condition_sql)
        getOrderCount(condition_sql)
        let beginNum = (allCondition.currentPage - 1) * allCondition.currentPageSize
        let sql = `select orders.*,order_type.order_name as order_type_name ,majors.name as tag_name,users.name as user_name,order_workflok.name as order_workflok_name from orders 
        left join (select * from order_type where isdelete = 0) order_type on orders.type_id = order_type.id
        left join (select * from majors where effective = 1) majors on orders.tag_id = majors.id
        left join (select * from users where effective = 1) users on orders.create_user = users.id
        left join (select * from order_workflok where isdelete = 0) order_workflok on order_workflok.step_number = orders.step_number and order_workflok.order_type_id = orders.type_id
        where orders.isdelete = 0 ${condition_sql}
        order by orders.id desc limit ${beginNum},${allCondition.currentPageSize}
        `
        // console.log('sql:', sql)
        let result = await api.query(sql)
        if (result.code === 0) {
            result.data = result.data[0]
            // console.log('分页查询获取的数据:', result.data)
            let originOrdersList = result.data.map((item, index) => { item.key = index; return item })
            setOrdersList(originOrdersList)
        }
        setIsLoading(false)
    }, [getOrderCount])
    const getDefaultStatusSelect = useCallback(() => {
        let copyStatusOptions = JSON.parse(JSON.stringify(statusOptions));
        let afterFilter = copyStatusOptions.filter((item) => { return AppData.userinfo().permission.indexOf(String(item.permission)) !== -1 })
        let defaultValues = afterFilter.map((item) => { return item.value })
        allCondition.status_list = afterFilter;
        setDefaultStatus(defaultValues)
    }, [])
    useEffect(() => {
        getDefaultStatusSelect() ///先根据个人的权限 设定默认选中的 当前状态；再将状态设定到 查询条件对象中
        listOrders()
    }, [listOrders, getDefaultStatusSelect])

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
        { title: '流水', dataIndex: 'code', width: 120, align: 'center' },
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
            title: '专业',
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
                return <div>{text || '-'}</div>
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
                        result = record.order_workflok_name + '中'
                        break
                    case 1:
                        result = record.order_workflok_name + '中'
                        color = '#2db7f5'
                        break
                    case 2:
                        result = (record.type_id === 1 ? '已出库' : '已入库') + '-' + record.order_workflok_name + '中'
                        color = '#722ed1'
                        break
                    case 3:
                        result = '完毕'
                        color = '#87d068'
                        break
                    case 4:
                        result = record.order_workflok_name + '-已拒绝'
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
                <Searchfrom defaultData={{ status: defaultStatus }} startSearch={(conditionsValue) => {
                    let tempList = [];
                    if (conditionsValue.curent_status && conditionsValue.curent_status.length > 0) {
                        statusOptions.forEach((item) => {
                            conditionsValue.curent_status.forEach((value) => {
                                if (item.value === value) { tempList.push(item) }
                            })
                        })
                    }
                    allCondition = { currentPage: allCondition.currentPage, currentPageSize: allCondition.currentPageSize, ...conditionsValue, status_list: tempList }
                    listOrders()
                }} />
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
                {AppData.userinfo().isadmin ?
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
                    /> : null}
                <Table
                    loading={isLoading}
                    style={styles.marginTop}
                    rowSelection={AppData.userinfo().isadmin ? rowSelection : null}
                    size='small'
                    bordered
                    columns={columns}
                    dataSource={orderList}
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
const Searchfrom = Form.create({ name: 'form' })(props => {
    const [userOptionList, setUserOptionList] = useState([])
    const [typeOptions, setTypeOptions] = useState([])///类型选项数据
    const [majorOptions, setMajorOptions] = useState([])

    const getType = useCallback(async () => {
        let sql = `select * from order_type where isdelete = 0`
        let result = await api.query(sql)
        if (result.code === 0) {
            let data = result.data[0]
            setTypeOptions(data)
        }
    }, [])
    const getMajor = useCallback(async () => {
        let result = await HttpApi.getMajor();
        if (result.code === 0) {
            setMajorOptions(result.data)
        }
    }, [])
    const getUser = useCallback(async () => {
        let result_user = await HttpApi.getOrderUserList()
        setUserOptionList(result_user)
    }, [])
    const listAllOptions = useCallback(async () => {
        getUser()
        getType()
        getMajor()
    }, [getUser, getType, getMajor])
    useEffect(() => {
        listAllOptions()
    }, [listAllOptions])
    const itemProps = { labelCol: { span: 6 }, wrapperCol: { span: 18 } }
    return <Form onSubmit={(e) => {
        e.preventDefault();
        props.form.validateFields((err, values) => {
            ///values搜寻条件数据过滤
            let newObj = {};
            for (const key in values) {
                if (values.hasOwnProperty(key)) {
                    const element = values[key];
                    if (element && element.length > 0) {
                        if (key === 'date_range') {
                            newObj[key] = [element[0].startOf('day').format('YYYY-MM-DD HH:mm:ss'), element[1].endOf('day').format('YYYY-MM-DD HH:mm:ss')]
                        } else {
                            newObj[key] = values[key]
                        }
                    }
                }
            }
            props.startSearch(newObj);
        });
    }}>
        <Row>
            <Col span={6}>
                <Form.Item label='日期区间'  {...itemProps}>
                    {props.form.getFieldDecorator('date_range', {
                        initialValue: [moment().add(0, 'month').startOf('month'), moment().endOf('day')],
                        rules: [{ required: false }]
                    })(
                        <DatePicker.RangePicker
                            allowClear={false}
                            style={{ width: '100%' }}
                            disabledDate={(current) => {
                                return current > moment().endOf('day');
                            }}
                            ranges={{
                                今日: [moment(), moment()],
                                昨日: [moment().add(-1, 'day'), moment().add(-1, 'day')],
                                本月: [moment().startOf('month'), moment().endOf('day')],
                                上月: [moment().add(-1, 'month').startOf('month'), moment().add(-1, 'month').endOf('month')]
                            }}
                        />
                    )}
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label='流水' {...itemProps}>
                    {props.form.getFieldDecorator('code', {
                        rules: [{ required: false }]
                    })(<Input allowClear placeholder="请输入流水号" />)}
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label='类型' {...itemProps}>
                    {props.form.getFieldDecorator('type_list', {
                        rules: [{ required: false }]
                    })(<Select mode='multiple' allowClear placeholder='选择申请类型-支持名称搜索' showSearch optionFilterProp="children">
                        {typeOptions.map((item, index) => {
                            return <Select.Option value={item.id} key={index} all={item}>{item.order_name}</Select.Option>
                        })}
                    </Select>)}
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label='专业' {...itemProps}>
                    {props.form.getFieldDecorator('major_list', {
                        rules: [{ required: false }]
                    })(<Select mode='multiple' allowClear placeholder='选择专业-支持名称搜索' showSearch optionFilterProp="children">
                        {majorOptions.map((item, index) => {
                            return <Select.Option value={item.id} key={index} all={item}>{item.name}</Select.Option>
                        })}
                    </Select>)}
                </Form.Item>
            </Col>
        </Row>
        <Row>
            <Col span={6}>
                <Form.Item label='申请人'  {...itemProps}>
                    {props.form.getFieldDecorator('create_user_list', {
                        rules: [{ required: false }]
                    })(<Select mode='multiple' allowClear placeholder='选择申请人-支持名称搜索' showSearch optionFilterProp="children">
                        {userOptionList.map((item, index) => {
                            return <Select.Option value={item.create_user} key={index} all={item}>{item.user_name}</Select.Option>
                        })}
                    </Select>)}
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label='当前状态'  {...itemProps}>
                    {props.form.getFieldDecorator('curent_status', {
                        initialValue: props.defaultData.status,
                        rules: [{ required: false }]
                    })(<Select mode='multiple' allowClear placeholder='选择当前状态-支持名称搜索' showSearch optionFilterProp="children">
                        {statusOptions.map((item, index) => {
                            return <Select.Option value={item.value} key={index} all={item}>{item.des}</Select.Option>
                        })}
                    </Select>)}
                </Form.Item>
            </Col>
            <Col span={12}>
                <div style={{ textAlign: 'right', paddingTop: 3 }}>
                    <Button type="primary" htmlType="submit">查询</Button>
                    <Button style={{ marginLeft: 8 }} onClick={() => { props.form.resetFields() }}>清除</Button>
                </div>
            </Col>
        </Row>
    </Form>
})

function checkStatusSql(tempList) {
    if (tempList.length === 0) { return '' }
    let sql = []
    tempList.forEach((item) => {
        const type_and_step = item.type_and_step;
        type_and_step.forEach((element) => {
            sql.push(` (orders.type_id = ${element.type} and orders.step_number = ${element.step}) `)
        })
    })
    if (sql.length === 0) {
        return ''
    }
    return ' and (' + sql.join('or') + ')'
}
const styles = {
    root: {
        backgroundColor: '#F1F1F1',
        width: '100%',
        height: '100%'
    },
    header: {
        backgroundColor: '#FFFFFF',
        padding: '24px 24px 0px 24px',
    },
    marginTop: { marginTop: 10 },
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