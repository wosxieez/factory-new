import React, { useEffect, useCallback, useState } from 'react';
import api from '../../http';
import { Table, Button, Tag, Row, Col, Input, DatePicker, Select, Form } from 'antd';
import moment from 'moment';
import { translatePurchaseRecordList } from '../../util/tool';
import HttpApi from '../../http/HttpApi';
export default _ => {
    const [isLoading, setIsLoading] = useState(false)
    const [dataSource, setDataSource] = useState([])
    const [sum_price, setSumPrice] = useState(0)
    const [sum_count, setSumCount] = useState(0)

    const listData = useCallback(async (conditionObj) => {
        setIsLoading(true)
        let date_range = conditionObj.date_range || [moment().add(-1, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss'), moment().endOf('day').format('YYYY-MM-DD HH:mm:ss')]
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
        let sql_bug_user_id = ''
        if (conditionObj.bug_user_id_list) {
            sql_bug_user_id = ' and buy_user_id in (' + conditionObj.bug_user_id_list.join(',') + ')'
        }
        let sql_record_user_id = ''
        if (conditionObj.record_user_id_list) {
            sql_record_user_id = ' and record_user_id in (' + conditionObj.record_user_id_list.join(',') + ')'
        }
        let sql_condition = sql_date + sql_store_id + sql_code + sql_code_num + sql_bug_user_id + sql_record_user_id
        // console.log('sql_condition:', sql_condition)
        let sql = `select pr.*,users1.name as buy_user_name,users2.name as record_user_name from purchase_record as pr
        left join (select * from users where effective = 1) users1 on users1.id = pr.buy_user_id
        left join (select * from users where effective = 1) users2 on users2.id = pr.record_user_id
        where pr.isdelete = 0${sql_condition} order by id desc`
        // console.log('sql:', sql)
        let result = await api.query(sql)
        if (result.code === 0) {
            let storeData = translatePurchaseRecordList(result.data[0])
            ///过滤物品id,因为一单中可能有多个物品
            if (conditionObj.store_id_list) {
                storeData = storeData.filter((item) => {
                    return conditionObj.store_id_list.indexOf(item.store_id) !== -1
                })
            }
            setDataSource(storeData.map((item, index) => { item.key = index; return item }))
            let records_sum_price = 0
            let records_sum_count = 0
            storeData.forEach((item) => {
                records_sum_price += parseFloat(item.count * item.price)
                records_sum_count += parseFloat(item.count)
            })
            setSumPrice(parseFloat(records_sum_price).toFixed(2))
            setSumCount(records_sum_count)
        }
        setIsLoading(false)
    }, [])
    ////////////////
    useEffect(() => {
        listData({});
    }, [listData])
    const columns = [
        {
            title: '入库时间',
            dataIndex: 'other.date',
            key: 'other.date',
            width: 180,
            render: (text) => {
                return moment(text).format('YYYY-MM-DD HH:mm:ss')
            }
        },
        {
            title: '单号',
            dataIndex: 'other.code_num',
            key: 'other.code_num',
            render: (text) => {
                return text ? <Tag color='blue'>{text}</Tag> : null
            }
        },
        {
            title: '物品',
            dataIndex: 'store_name',
            key: 'store_name',
            render: (text, record) => {
                return <Tag color='cyan'>{text}</Tag>
            }
        },
        {
            title: '入库单价(元)',
            dataIndex: 'price',
            key: 'price',
            render: (text) => {
                return <Tag color='orange'>{text}</Tag>
            }
        },
        {
            title: '入库数量(个)',
            dataIndex: 'count',
            key: 'count',
            render: (text) => {
                return <Tag color='#faad14'>{text}</Tag>
            }
        },
        {
            title: '入库总价(元)',
            dataIndex: 'sum_oprice',
            key: 'sum_oprice',
            render: (_, record) => {
                return <Tag color='#fa541c'>{parseFloat((record.count * record.price || 0).toFixed(2))}</Tag>
            }
        },
        {
            title: '采购人员',
            dataIndex: 'other.buy_user_name',
            key: 'other.buy_user_name',
            align: 'center',
            width: 100,
        },
        {
            title: '记录人员',
            dataIndex: 'other.record_user_name',
            key: 'other.record_user_name',
            align: 'center',
            width: 100,
        },
        {
            title: '流水',
            dataIndex: 'other.code',
            key: 'other.code',
            render: (text) => {
                return <Tag color='blue'>{text}</Tag>
            }
        },
        {
            title: '入库备注',
            dataIndex: 'other.remark',
            key: 'other.remark',
            align: 'center',
            width: 100,
        },
    ]
    return (<div style={styles.root}>
        <div style={styles.header}>
            <Searchfrom startSearch={(conditionsValue) => {
                listData(conditionsValue)
            }} />
        </div>
        <div style={styles.body}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3>入库物品记录</h3>
                <div>
                    <Tag color={'#faad14'}>总数量#: {sum_count}</Tag>
                    <Tag color={'#fa541c'}>总价格¥: {sum_price}</Tag>
                </div>
            </div>
            <Table
                loading={isLoading}
                style={styles.marginTop}
                size='small'
                bordered
                columns={columns}
                dataSource={dataSource}
                pagination={{
                    total: dataSource.length,
                    showTotal: () => {
                        return <div>共{dataSource.length}条记录</div>
                    },
                    showSizeChanger: true,
                    showQuickJumper: true,
                    pageSizeOptions: ['10', '50', '100'],
                }}
            />
        </div>
    </div >
    )
}
const Searchfrom = Form.create({ name: 'form' })(props => {
    const [storeOptionList, setStoreOptionList] = useState([])
    const [userOptionList, setUserOptionList] = useState([])
    const [userOptionList2, setUserOptionList2] = useState([])
    const listAllOptions = useCallback(async () => {
        let result = await api.listAllStore()
        if (result.code === 0) { setStoreOptionList(result.data) }
        let result_user = await HttpApi.getUserListForPurchase(1)
        setUserOptionList(result_user)
        let result_user2 = await HttpApi.getUserListForPurchase(2)
        setUserOptionList2(result_user2)
        // if (result_user.code === 0) { setUserOptionList(result_user.data) }
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
                <Form.Item label='入库时间'  {...itemProps}>
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
                    })(<Select mode='multiple' allowClear placeholder='选择物品-支持名称搜索' showSearch optionFilterProp="children">
                        {storeOptionList.map((item, index) => {
                            return <Select.Option value={item.id} key={index} all={item}>{item.name}</Select.Option>
                        })}
                    </Select>)}
                </Form.Item>
            </Col>
        </Row>
        <Row>
            <Col span={6}>
                <Form.Item label='采购人'  {...itemProps}>
                    {props.form.getFieldDecorator('bug_user_id_list', {
                        rules: [{ required: false }]
                    })(<Select mode='multiple' allowClear placeholder='选择人员-支持名称搜索' showSearch optionFilterProp="children">
                        {userOptionList.map((item, index) => {
                            return <Select.Option value={item.id} key={index} all={item}>{item.name}</Select.Option>
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
            <Col span={6}>
            </Col>
            <Col span={6}>
                <div style={{ textAlign: 'right', paddingTop: 3 }}>
                    <Button type="primary" htmlType="submit">查看</Button>
                    <Button style={{ marginLeft: 8 }} onClick={() => { props.form.resetFields() }}>清除</Button>
                </div>
            </Col>
        </Row>
    </Form>
})
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