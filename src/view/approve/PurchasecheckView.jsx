import React, { useState, useEffect, useCallback, useContext } from 'react'
import api from '../../http'
import { Table, Button, Input, Row, Col, DatePicker, Tag, Form, Select, Radio, Modal, message, Tooltip, Alert } from 'antd'
import moment from 'moment'
import HttpApi from '../../http/HttpApi';
import { getListAllTaxPrice, userinfo } from '../../util/Tool';
import { AppDataContext } from '../../redux/AppRedux';
export async function getCountCG(condition_sql) {
    let sql = `select count(id) count from purchase_record where isdelete = 0${condition_sql} `
    let result = await api.query(sql)
    if (result.code === 0) {
        return result.data[0][0]['count']
    } else {
        return 0
    }
}
/**
 * 采购入库单记录--用于财务审计
 */
export default props => {
    const [hasPermission6] = useState(userinfo().permission && userinfo().permission.split(',').indexOf('6') !== -1)
    const { appDispatch } = useContext(AppDataContext)
    const [sum_price, setSumPrice] = useState(0)
    const [sum_count, setSumCount] = useState(0)
    const [sum_tax_price, setSumTaxPrice] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [dataSource, setDataSource] = useState([])
    const [currentItem, setCurrentItem] = useState({})
    const [isUpdating, setIsUpdating] = useState(false)
    const [count, setCount] = useState(false)

    const listData = useCallback(async (conditionObj) => {
        setIsLoading(true)
        let date_range = conditionObj.date_range || [moment().add(0, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss'), moment().endOf('day').format('YYYY-MM-DD HH:mm:ss')]
        let sql_date = ` and date >= '${date_range[0]}' and date <= '${date_range[1]}'`
        let sql_store_id = ''
        if (conditionObj.store_id_list) {
            conditionObj.store_id_list.forEach((store_id) => {
                sql_store_id = sql_store_id + ` or content like '%"store_id":${store_id},%'`
            })
            sql_store_id = ' and (' + sql_store_id.substring(4) + ')'
        }
        let sql_code = ''
        if (conditionObj.code) {
            sql_code = ` and code like '%${conditionObj.code}%'`
        }
        let sql_code_num = ''
        if (conditionObj.code_num) {
            sql_code_num = ` and code_num like '%${conditionObj.code_num}%'`
        }
        let sql_buy_user_id = ''
        if (conditionObj.buy_user_id_list) {
            sql_buy_user_id = ' and buy_user_id in (' + conditionObj.buy_user_id_list.join(',') + ')'
        }
        let sql_record_user_id = ''
        if (conditionObj.record_user_id_list) {
            sql_record_user_id = ' and record_user_id in (' + conditionObj.record_user_id_list.join(',') + ')'
        }
        let sql_check_status = ''
        if (conditionObj.check_status) {
            sql_check_status = ' and check_status in (' + conditionObj.check_status.join(',') + ')'
        }
        let sql_abstract_remark = ''
        if (conditionObj.abstract_remark) {
            sql_abstract_remark = ` and abstract_remark like '%${conditionObj.abstract_remark}%'`
        }
        let sql_condition = sql_date + sql_store_id + sql_code + sql_code_num + sql_buy_user_id + sql_record_user_id + sql_check_status + sql_abstract_remark
        let sql = `select pr.*,users1.name as buy_user_name,users2.name as record_user_name,users3.name as check_user_name from purchase_record as pr
        left join (select * from users where effective = 1) users1 on users1.id = pr.buy_user_id
        left join (select * from users where effective = 1) users2 on users2.id = pr.record_user_id
        left join (select * from users where effective = 1) users3 on users3.id = pr.check_user_id
        where pr.isdelete = 0${sql_condition} order by id desc`
        // console.log('sql:', sql)
        let result_count = await getCountCG(sql_condition)
        setCount(result_count)
        if (hasPermission6) { appDispatch({ type: 'purchasecount', data: result_count }) }
        let result = await api.query(sql)
        if (result.code === 0) {
            let tempSumcount = 0;
            let tempSumprice = 0;
            // console.log('result.data[0]:', result.data[0])
            setDataSource(result.data[0].map((item, index) => {
                tempSumcount += !item.is_rollback ? parseInt(item.sum_count) : 0;
                tempSumprice += !item.is_rollback ? parseFloat(item.sum_price) : 0;
                item.key = index;
                return item
            }))
            let tempSumTaxPrice = 0
            result.data[0].forEach((item) => {
                if (!item.is_rollback) { ///计算总含税价格 不包含撤销的记录
                    const content = JSON.parse(item.content).filter((item) => !item.removed)
                    tempSumTaxPrice = tempSumTaxPrice + getListAllTaxPrice(content)
                }
            })
            setSumTaxPrice(tempSumTaxPrice.toFixed(2))
            // console.log('tempSumcount:', tempSumcount.toFixed(0))
            // console.log('tempSumprice:', tempSumprice.toFixed(2))
            setSumCount(tempSumcount.toFixed(0))
            setSumPrice(tempSumprice.toFixed(2))
        }
        setIsLoading(false)
    }, [appDispatch, hasPermission6])
    useEffect(() => {
        listData({ check_status: [0] })
    }, [listData])

    const columns = [
        {
            title: '采购时间', dataIndex: 'date', key: 'date', width: 120,
            fixed: 'left', align: 'center'
        },
        {
            title: '单号/摘要',
            dataIndex: 'code_num',
            key: 'code_num',
            align: 'center',
            width: 200,
            fixed: 'left',
            render: (text, record) => {
                let tempCpt = record.abstract_remark ? <span> / {record.abstract_remark}</span> : null
                // return <div>
                //     <Tag color='blue' style={{ marginRight: 0 }}>{text}</Tag>
                //     {tempCpt}
                // </div>
                if (record.is_rollback === 1) {
                    return <div>
                        {text}
                        {tempCpt}
                        <Tooltip placement='left' title={<div>
                            <p>{record.rollback_time}</p>
                            <p>撤销人: {record.rollback_username}</p>
                            <p>备注: {record.rollback_des}</p>
                        </div>}>
                            <span style={{ color: '#f5222d' }}>/已撤销</span>
                        </Tooltip>
                    </div >
                } else {
                    return <div>
                        {text}
                        {tempCpt}
                    </div>
                }
            }
        },
        {
            title: '采购单',
            dataIndex: 'content',
            width: 400,
            fixed: 'left',
            render: (text, record) => {
                // let contentList = JSON.parse(text)
                // return contentList.map((item, index) => {
                //     let tool_str = '编号' + item.num
                //     if (item.temp_tax) {
                //         tool_str = tool_str + ' 税率' + item.temp_tax + '%'
                //     } else { tool_str = tool_str + ' 无税率' }
                //     return <Tooltip key={index} placement='left' title={tool_str} >
                //         <div key={index}>
                //             <Tag key={index} color={'cyan'} style={{ marginRight: 0, marginBottom: index === JSON.parse(text).length - 1 ? 0 : 6 }}>{item.store_name} 采购价{item.price}元*{item.count}</Tag><br />
                //         </div>
                //     </Tooltip>
                // })
                let contentList = JSON.parse(text)
                return contentList.map((item, index) => {
                    let tool_str = '编号'
                    if (item.num) {
                        tool_str = tool_str + item.num
                    } else { tool_str = '无编号' }
                    if (item.temp_tax) {
                        tool_str = tool_str + ' 税率' + item.temp_tax + '%'
                    } else { tool_str = tool_str + ' 无税率' }
                    return <div key={index}>
                        <Tooltip key={index + 'x'} placement='left' title={tool_str} >
                            <span key={index} color={item.removed ? '' : 'cyan'} style={{ marginRight: 0, marginBottom: 6 }}>{item.store_name} 采购价{item.price}元*{item.count}</span>
                        </Tooltip>
                        {item.removed ? <Tooltip key={index + 'y'} placement='left' title={<div>
                            <div>{item.removedTime}</div>
                            <div>{item.removedUsername}</div>
                            <div>备注: {item.removedRemark}</div>
                        </div>} >
                            <span key={index} style={{ color: '#ff0000' }}>/已撤销</span>
                        </Tooltip> : null}
                    </div>
                })
            }
        },
        {
            title: '总数量',
            dataIndex: 'sum_count',
            key: 'sum_count',
            align: 'center',
            width: 80,
        },
        {
            title: '总含税价',
            dataIndex: 'sum_price',
            key: 'sum_price',
            align: 'center',
            width: 100,
        },
        {
            title: '总价',
            dataIndex: 'content',
            key: 'content1',
            align: 'center',
            width: 100,
            render: (text) => {
                try {
                    // const contextList = JSON.parse(text)
                    const contextList = JSON.parse(text).filter((item) => !item.removed)
                    let sum_tax_price = parseFloat(getListAllTaxPrice(contextList)).toFixed(2)
                    return sum_tax_price
                } catch (error) {
                    return '-'
                }
            }
        },
        // {
        //     title: '采购人员',
        //     dataIndex: 'buy_user_name',
        //     key: 'buy_user_name',
        //     align: 'center',
        //     width: 80,
        //     render: (text) => {
        //         return text || '-'
        //     }
        // },
        {
            title: '记录人员',
            dataIndex: 'record_user_name',
            key: 'record_user_name',
            align: 'center',
            width: 80,
        },
        {
            title: '采购备注',
            dataIndex: 'remark',
            render: (text) => {
                return <div>{text || '-'}</div>
            }
        },
        {
            title: '审计状态',
            dataIndex: 'check_status',
            align: 'center',
            width: 80,
            render: (text) => {
                let result = '-'
                let color = '#BFBFBF'
                switch (text) {
                    case 0:
                        result = '未审计'
                        break;
                    case 1:
                        result = '通过'
                        color = '#52c41a'
                        break;
                    case 2:
                        result = '拒绝'
                        color = '#f5222d'
                        break;
                    default:
                        break;
                }
                return <Tag style={{ marginRight: 0 }} color={color}>{result}</Tag>
            }
        },
        {
            title: '审计时间',
            dataIndex: 'check_time',
            align: 'center',
            width: 100,
            render: (text) => {
                return <div>{text || '-'}</div>
            }
        },
        {
            title: '审计人员',
            dataIndex: 'check_user_name',
            align: 'center',
            width: 100,
            render: (text) => {
                return <div>{text || '-'}</div>
            }
        },
        {
            title: '审计说明',
            dataIndex: 'check_remark',
            align: 'center',
            width: 100,
            render: (text) => {
                return <div>{text || '-'}</div>
            }
        },
        {
            title: '操作',
            dataIndex: 'action',
            width: 80,
            align: 'center',
            fixed: 'right',
            render: (_, record) => {
                return (
                    <Button
                        type='link'
                        size='small'
                        icon='form'
                        onClick={() => {
                            setCurrentItem(record)
                            setIsUpdating(true)
                        }}>处理</Button>
                )
            }
        }
    ]
    return (
        <div style={styles.root}>
            <div style={styles.header}>
                <Searchfrom startSearch={async (conditionsValue) => {
                    // console.log('conditionsValue:', conditionsValue)
                    listData(conditionsValue)
                }} />
            </div>
            <div style={styles.body}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3>实际采购单记录</h3>
                    <div>
                        <Tag color={'#1890ff'}>总数量#: {sum_count}</Tag>
                        <Tag color={'#1890ff'}>总含税价格¥: {sum_price}</Tag>
                        <Tag color={'#1890ff'} style={{ marginRight: 0 }}>总价格¥: {sum_tax_price}</Tag>
                    </div>
                </div>
                <HandlerPanel visible={isUpdating} onCancel={() => { setIsUpdating(false) }} onOk={async (data) => {
                    // console.log('data:', data)
                    let sql = `update purchase_record set 
                    check_status = ${data.check_status},
                    check_remark =${data.check_remark ? "'" + data.check_remark + "'" : null},
                    check_user_id = ${userinfo().id},
                    check_time = '${moment().format('YYYY-MM-DD HH:mm:ss')}'
                    where id = ${currentItem.id}`
                    let result = await HttpApi.obs({ sql })
                    if (result.code === 0) {
                        message.success('操作成功')
                        listData({ check_status: [0] })
                    }
                    // console.log('result:', result)
                    setIsUpdating(false)
                }} />
                <Alert showIcon type='info' message='总数量、总含税价格、总价格的统计不包含撤销单中的物品' />
                <Table
                    scroll={{ x: 1700 }}
                    style={styles.marginTop}
                    loading={isLoading}
                    bordered
                    size='small'
                    columns={userinfo().permission.split(',').indexOf('6') !== -1 ? columns : columns.filter((item) => item.title !== '操作')}
                    dataSource={dataSource}
                    pagination={{
                        total: count,
                        showTotal: () => {
                            return <div>共{count}条记录</div>
                        },
                        showSizeChanger: true,
                        showQuickJumper: true,
                        pageSizeOptions: ['10', '50', '100'],
                    }}
                />
            </div>
        </div>
    )
}
const Searchfrom = Form.create({ name: 'form' })(props => {
    const check_status_list = [{ value: 0, des: '未审计' }, { value: 1, des: '通过' }, { value: 2, des: '拒绝' }]
    const [storeOptionList, setStoreOptionList] = useState([])
    const [userOptionList2, setUserOptionList2] = useState([])
    const listAllOptions = useCallback(async () => {
        let result = await api.listAllStore()
        if (result.code === 0) { setStoreOptionList(result.data) }
        let result_user2 = await HttpApi.getUserListForPurchase(2)
        setUserOptionList2(result_user2)
    }, [])
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
                <Form.Item label='采购时间'  {...itemProps}>
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
                <Form.Item label='单号' {...itemProps}>
                    {props.form.getFieldDecorator('code_num', {
                        rules: [{ required: false }]
                    })(<Input allowClear placeholder="请输入单号" />)}
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label='物品' {...itemProps}>
                    {props.form.getFieldDecorator('store_id_list', {
                        rules: [{ required: false }]
                    })(<Select mode='multiple' allowClear placeholder='选择物品-支持名称搜索' showSearch optionFilterProp="children"
                        filterOption={(input, option) => {
                            return option.props.children.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }}>
                        {storeOptionList.map((item, index) => {
                            return <Select.Option value={item.id} key={index} all={item}>
                                <Tooltip placement="left" key={index} title={item.num + '-' + item.name}>
                                    {item.num + '-' + item.name}
                                </Tooltip>
                            </Select.Option>
                        })}
                    </Select>)}
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label='记录人' {...itemProps}>
                    {props.form.getFieldDecorator('record_user_id_list', {
                        rules: [{ required: false }]
                    })(<Select mode='multiple' allowClear placeholder='选择人员-支持名称搜索' showSearch optionFilterProp="children">
                        {userOptionList2.map((item, index) => {
                            return <Select.Option value={item.id} key={index} all={item}>{item.name}</Select.Option>
                        })}
                    </Select>)}
                </Form.Item>
            </Col>
        </Row>
        <Row>
            <Col span={6}>
                <Form.Item label='审计状态' {...itemProps}>
                    {props.form.getFieldDecorator('check_status', {
                        initialValue: [0],
                        rules: [{ required: false }]
                    })(<Select mode='multiple' allowClear placeholder='选择状态-支持名称搜索' showSearch optionFilterProp="children">
                        {check_status_list.map((item, index) => {
                            return <Select.Option value={item.value} key={index} >{item.des}</Select.Option>
                        })}
                    </Select>)}
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label='摘要'  {...itemProps}>
                    {props.form.getFieldDecorator('abstract_remark', {
                        rules: [{ required: false }]
                    })(<Input allowClear placeholder="请输入摘要" />)}
                </Form.Item>
            </Col>
            <Col span={12}>
                <div style={{ textAlign: 'right', paddingTop: 3 }}>
                    <Button type="primary" htmlType="submit">查看</Button>
                    <Button style={{ marginLeft: 8 }} onClick={() => { props.form.resetFields() }}>清除</Button>
                </div>
            </Col>
        </Row>
    </Form >
})

function HandlerPanel(props) {
    const [checkRemark, setCheckRemark] = useState(null)
    const [checkStatus, setCheckStatus] = useState(1)
    return <Modal
        destroyOnClose
        visible={props.visible}
        title='财务审计'
        onCancel={props.onCancel}
        onOk={() => { props.onOk({ check_remark: checkRemark || null, check_status: checkStatus }) }}
    >
        <Radio.Group size='small' value={checkStatus} buttonStyle="solid" onChange={(e) => { setCheckStatus(e.target.value) }}>
            <Radio.Button value={1}>通过</Radio.Button>
            <Radio.Button value={2}>拒绝</Radio.Button>
        </Radio.Group>
        <Input.TextArea allowClear style={{ marginTop: 10 }} autoSize={{ minRows: 3, maxRows: 5 }} placeholder='审计说明（选填）' onChange={(e) => {
            setCheckRemark(e.target.value)
        }} />
    </Modal>
}
const styles = {
    root: {
        backgroundColor: '#F1F2F5',
        width: '100%',
        height: '100vh'
    },
    header: {
        backgroundColor: '#FFFFFF',
        padding: '24px 24px 0px 24px',
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