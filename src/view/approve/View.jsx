import React, { useState, useEffect, useCallback, useContext } from 'react'
import { Table, Modal, Button, Input, message, Row, Col, Alert, DatePicker, Tag, Select, Form, Icon, Tooltip } from 'antd'
import OperationView, { updateStoreHandler } from './OperationView'
import api from '../../http'
import moment from 'moment'
import HttpApi from '../../http/HttpApi';
import { userinfo } from '../../util/Tool';
import { AppDataContext } from '../../redux/AppRedux'
const FORMAT = 'YYYY-MM-DD HH:mm:ss'
var allCondition = { code: null, type_list: [], major_list: [], create_user_list: [], date_range: [moment().add(0, 'month').startOf('month').format(FORMAT), moment().endOf('day').format(FORMAT)], status_list: [], currentPage: 1, currentPageSize: 10 };
export const statusOptions = [{ value: 1, type_and_step: [{ type: 1, step: 1 }, { type: 2, step: 1 }], des: '领料审批中', permission: 0 },
{ value: 2, type_and_step: [{ type: 1, step: 2 }, { type: 2, step: 2 }, { type: 3, step: 3 }], des: '待领料中', permission: 5 },
{ value: 3, type_and_step: [{ type: 3, step: 1 }], des: '财务采购确认中', permission: 6 },
{ value: 4, type_and_step: [{ type: 1, step: 3 }, { type: 2, step: 3 }], des: '财务审计中', permission: 6 },
{ value: 5, type_and_step: [{ type: 3, step: 2 }], des: '采购处理', permission: 4 },
{ value: 6, des: '完毕' },
{ value: 7, des: '拒绝' }]
export async function getOrderCount(condition_sql = '') {
    let sql = `select count(id) count from orders where isdelete = 0 ${condition_sql}`
    let result = await api.query(sql)
    if (result.code === 0) {
        let data = result.data[0]
        return data[0].count
    } else {
        return 0
    }
}
/**
 * 待审批的申请列表
 */
export default _ => {
    const [hasPermission0] = useState(userinfo().permission && userinfo().permission.split(',').indexOf('0') !== -1)
    // const [hasPermission1] = useState(userinfo().permission && userinfo().permission.split(',').indexOf('1') !== -1)
    // const [hasPermission2] = useState(userinfo().permission && userinfo().permission.split(',').indexOf('2') !== -1)
    // const [hasPermission3] = useState(userinfo().permission && userinfo().permission.split(',').indexOf('3') !== -1)
    const [hasPermission4] = useState(userinfo().permission && userinfo().permission.split(',').indexOf('4') !== -1)
    const [hasPermission5] = useState(userinfo().permission && userinfo().permission.split(',').indexOf('5') !== -1)
    const [hasPermission6] = useState(userinfo().permission && userinfo().permission.split(',').indexOf('6') !== -1)
    const { appState, appDispatch } = useContext(AppDataContext)
    const [isLoading, setIsLoading] = useState(false)
    const [operationVisible, setOperationVisible] = useState(false)
    const [orderList, setOrdersList] = useState([])
    const [currentItem, setCurrentItem] = useState({})
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    const [selectedRows, setSelectedRows] = useState([])
    const [listCount, setListCount] = useState(0)///数据总共查询到多少条
    const [defaultStatus, setDefaultStatus] = useState([])
    const [isTop, setIsTop] = useState(true)
    const getNewCode = useCallback(async () => {
        if (appState.currentcode) {
            let sql = `select orders.*,order_type.order_name as order_type_name ,majors.name as tag_name,users.name as user_name,order_workflok.name as order_workflok_name from orders 
            left join (select * from order_type where isdelete = 0) order_type on orders.type_id = order_type.id
            left join (select * from majors where effective = 1) majors on orders.tag_id = majors.id
            left join (select * from users where effective = 1) users on orders.create_user = users.id
            left join (select * from order_workflok where isdelete = 0) order_workflok on order_workflok.step_number = orders.step_number and order_workflok.order_type_id = orders.type_id
            where orders.isdelete = 0 and orders.code = '${appState.currentcode}'`
            let result = await api.query(sql)
            if (result.code === 0) {
                result.data = result.data[0]
                if (result.data.length === 1) {
                    setCurrentItem(result.data[0])
                    setOperationVisible(true)
                    if (result.data[0].is_special === 1) { ///如果是特殊时段，那么直接算作出库。并将该订单的is_special改成 2 【特殊-已出库】
                        console.log('是特殊时段直接开始算出库操作')
                        let flag = await updateStoreHandler(result.data[0])
                        if (flag) {
                            console.log('全部自动出库成功')
                            let sql = `update orders set is_special = 2 where id = ${result.data[0].id}`
                            let result2 = await api.query(sql)
                            if (result2.code === 0) {
                                message.success('特殊时段申请-自助出库成功')
                                setTimeout(() => {
                                    setOperationVisible(false)
                                }, 10000)
                            }
                        }
                    } else { console.log('正常时段-走库管人工操作审核') }
                }
            }
        }
    }, [appState.currentcode])
    const listOrders = useCallback(async () => {
        setIsLoading(true)
        setSelectedRowKeys([])
        setSelectedRows([])
        let special_top_sql = isTop ? 'order by orders.is_special desc,orders.id desc' : 'order by orders.id desc'
        let date_sql = allCondition.date_range.length > 0 ? ` and orders.createdAt>'${allCondition.date_range[0]}' and orders.createdAt<'${allCondition.date_range[1]}'` : ''
        let code_sql = allCondition.code ? ` and orders.code like '%${allCondition.code}%'` : ''
        let type_sql = allCondition.type_list && allCondition.type_list.length > 0 ? ` and orders.type_id in (${allCondition.type_list.join(',')})` : ''
        let major_sql = allCondition.major_list && allCondition.major_list.length > 0 ? ` and orders.tag_id in (${allCondition.major_list.join(',')})` : ''
        let user_sql = allCondition.create_user_list && allCondition.create_user_list.length > 0 ? ` and orders.create_user in (${allCondition.create_user_list.join(',')})` : ''
        let special_sql = allCondition.is_special && allCondition.is_special.length > 0 ? ` and orders.is_special in (${allCondition.is_special.join(',')})` : ''
        let condition_sql = code_sql + type_sql + major_sql + date_sql + user_sql + special_sql + checkStatusSql(allCondition.status_list);
        // console.log('条件sql:', condition_sql)
        let beginNum = (allCondition.currentPage - 1) * allCondition.currentPageSize
        let sql = `select orders.*,order_type.order_name as order_type_name ,majors.name as tag_name,users.name as user_name,order_workflok.name as order_workflok_name from orders 
        left join (select * from order_type where isdelete = 0) order_type on orders.type_id = order_type.id
        left join (select * from majors where effective = 1) majors on orders.tag_id = majors.id
        left join (select * from users where effective = 1) users on orders.create_user = users.id
        left join (select * from order_workflok where isdelete = 0) order_workflok on order_workflok.step_number = orders.step_number and order_workflok.order_type_id = orders.type_id
        where orders.isdelete = 0 ${condition_sql}
        ${special_top_sql} limit ${beginNum},${allCondition.currentPageSize}`
        let count_result = await getOrderCount(condition_sql)
        setListCount(count_result)
        if (hasPermission0 || hasPermission4 || hasPermission5 || hasPermission6) { appDispatch({ type: 'approvecount', data: count_result }) }
        let result = await api.query(sql)
        if (result.code === 0) {
            result.data = result.data[0]
            // console.log('分页查询获取的数据:', result.data)
            let originOrdersList = result.data.map((item, index) => { item.key = index; return item })
            setOrdersList(originOrdersList)
        }
        setIsLoading(false)
    }, [appDispatch, hasPermission0, hasPermission4, hasPermission5, hasPermission6, isTop])
    const getDefaultStatusSelect = useCallback(() => {
        let copyStatusOptions = JSON.parse(JSON.stringify(statusOptions));
        let afterFilter = copyStatusOptions.filter((item) => { return userinfo().permission.split(',').indexOf(String(item.permission)) !== -1 })
        let defaultValues = afterFilter.map((item) => { return item.value })
        let major_list = userinfo().major_id_all ? userinfo().major_id_all.split(',').map((item) => parseInt(item)) : []///设置固定的专业
        allCondition.status_list = afterFilter;
        allCondition.major_list = major_list;
        setDefaultStatus(defaultValues)
    }, [])
    useEffect(() => {
        getDefaultStatusSelect() ///先根据个人的权限 设定默认选中的 当前状态；再将状态设定到 查询条件对象中
        listOrders()
        getNewCode()
    }, [listOrders, getDefaultStatusSelect, getNewCode])

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
        {
            title: '流水', dataIndex: 'code', width: 120, align: 'center'
        },
        {
            title: '类型',
            dataIndex: 'order_type_name',
            width: 80,
            align: 'center',
            render: (_, record) => {
                let icon = <Icon type="tool" theme="twoTone" />
                let text = '申领'
                if (record.type_id === 3) {
                    icon = <Icon type="dollar" theme="twoTone" twoToneColor="#fa8c16" />
                    text = '申购'
                }
                return <div>{icon} {text}</div>
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
            // align: 'center',
            render: (text, record) => {
                let result = JSON.parse(text).map((item, index) => {
                    return (
                        <Tooltip key={index} placement='left' title={'编号' + item.num}>
                            <div style={{ marginRight: 0, marginBottom: index === JSON.parse(text).length - 1 ? 0 : 6 }}>
                                {item['has_rfid'] ? <Icon type="barcode" style={{ marginRight: 5 }} /> : null}{item.store_name} 数量:{item.count}
                            </div>
                        </Tooltip>
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
                return <div>{<Tag color={color} style={{ marginRight: 0 }}>{result}</Tag> || '/'}</div>
            }
        },
        {
            title: '时段',
            dataIndex: 'is_special',
            align: 'center',
            width: 80,
            render: (text, record) => {
                let result = '正常'
                let color = 'blue'
                if (text === 1) {
                    result = '特殊'
                    color = 'orange'
                } else if (text === 2) {
                    result = '特殊--已出库'
                    color = 'red'
                }
                return <Tag color={color} style={{ marginRight: 0 }}>{result}</Tag>
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
                    if (conditionsValue.current_status && conditionsValue.current_status.length > 0) {
                        statusOptions.forEach((item) => {
                            conditionsValue.current_status.forEach((value) => {
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
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <h3>申领、申购记录</h3>
                        <Tooltip title={isTop ? '时间排序' : '特殊时段置顶'}>
                            <Button icon={`${isTop ? 'vertical-align-middle' : 'vertical-align-top'}`} size='small' type='link' style={{ padding: 0, marginLeft: 10, marginTop: -6 }} onClick={() => {
                                setIsTop(!isTop)
                            }} />
                        </Tooltip>
                    </div>
                    <div>
                        {selectedRowKeys.length === 0 ? null : (
                            <Button icon='delete' style={styles.button} type='danger' onClick={batchDelete}>批量删除</Button>
                        )}
                    </div>
                </div>
                {userinfo().isadmin ?
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
                    rowSelection={userinfo().isadmin ? rowSelection : null}
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
    const [defaultMajor] = useState(userinfo().major_id_all ? userinfo().major_id_all.split(',').map((item) => parseInt(item)) : [])

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
                        initialValue: defaultMajor,
                        rules: [{ required: false }]
                    })(<Select disabled mode='multiple' allowClear showSearch optionFilterProp="children">
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
                    {props.form.getFieldDecorator('current_status', {
                        initialValue: props.defaultData.status,
                        rules: [{ required: false }]
                    })(<Select mode='multiple' allowClear placeholder='选择当前状态-支持名称搜索' showSearch optionFilterProp="children">
                        {statusOptions.map((item, index) => {
                            return <Select.Option value={item.value} key={index} all={item}>{item.des}</Select.Option>
                        })}
                    </Select>)}
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label='时段'  {...itemProps}>
                    {props.form.getFieldDecorator('is_special', {
                        rules: [{ required: false }]
                    })(<Select mode='multiple' allowClear placeholder='选择时段-支持名称搜索' showSearch optionFilterProp="children">
                        {[{ value: 0, des: '正常' }, { value: 1, des: '特殊' }, { value: 2, des: '特殊已出库' }].map((item, index) => {
                            return <Select.Option value={item.value} key={index} all={item}>{item.des}</Select.Option>
                        })}
                    </Select>)}
                </Form.Item>
            </Col>
            <Col span={6}>
                <div style={{ textAlign: 'right', paddingTop: 3 }}>
                    <Button type="primary" htmlType="submit">查询</Button>
                    <Button style={{ marginLeft: 8 }} onClick={() => { props.form.resetFields() }}>清除</Button>
                </div>
            </Col>
        </Row>
    </Form>
})

export function checkStatusSql(tempList) {
    if (tempList.length === 0) { return '' }
    let sql = []
    tempList.forEach((item) => {
        if (item.value < 6) {
            const type_and_step = item.type_and_step;
            type_and_step.forEach((element) => {
                sql.push(` (orders.type_id = ${element.type} and orders.step_number = ${element.step}) `)
            })
        } else if (item.value === 6) { ///完毕
            sql.push(` (orders.status = 3) `)
        } else if (item.value === 7) { ///拒绝
            sql.push(` (orders.status = 4) `)
        }
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