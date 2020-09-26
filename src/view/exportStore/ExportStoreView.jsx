import React, { useEffect, useCallback, useState } from 'react';
import api from '../../http';
import { Table, Button, Tag, Row, Col, Input, DatePicker, Select, Form } from 'antd';
import moment from 'moment';
import { translateOrderList } from '../../util/tool';
import HttpApi from '../../http/HttpApi';
export default _ => {
    const [isLoading, setIsLoading] = useState(false)
    const [dataSource, setDataSource] = useState([])
    const [sum_price, setSumPrice] = useState(0)
    const [sum_count, setSumCount] = useState(0)

    const listData = useCallback(async (conditionObj) => {
        setIsLoading(true)
        let date_range = conditionObj.date_range || [moment().add(-1, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss'), moment().endOf('day').format('YYYY-MM-DD HH:mm:ss')]
        let sql_date = ` and orders.createdAt >= '${date_range[0]}' and orders.createdAt <= '${date_range[1]}'`
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
        let sql_user_id = ''
        if (conditionObj.user_id_list) {
            sql_user_id = ' and create_user in (' + conditionObj.user_id_list.join(',') + ')'
        }
        let sql_condition = sql_date + sql_store_id + sql_code + sql_user_id
        // console.log('sql_condition:', sql_condition)
        let sql = `select orders.*,users.name as user_name from orders
        left join (select * from users where effective = 1) users on orders.create_user = users.id
        where orders.isdelete = 0 and orders.status in (2,3) and orders.type_id = 1 ${sql_condition}
        order by id desc`
        // console.log('sql:', sql)
        let result = await api.query(sql)
        if (result.code === 0) {
            // console.log('result.data[0]:', result.data[0])
            let result2 = translateOrderList(result.data[0], conditionObj.store_id_list)
            // console.log('result2:', result2)
            // console.log('ad:', result2.allStoreList.map((item, index) => { item.key = index; return item }))
            setDataSource(result2.allStoreList.map((item, index) => { item.key = index; return item }))
            setSumPrice(parseFloat(result2.sum_price).toFixed(2))
            setSumCount(result2.sum_count)
        }
        setIsLoading(false)
    }, [])
    ////////////////
    useEffect(() => {
        listData({});
    }, [listData])
    const columns = [
        {
            title: '时间',
            dataIndex: 'order.createdAt',
            key: 'createdAt',
            width: 180,
            render: (text) => {
                return moment(text).format('YYYY-MM-DD HH:mm:ss')
            }
        },
        {
            title: '物品',
            dataIndex: 'store.store_name',
            key: 'store_name',
            render: (text, record) => {
                return <Tag color='cyan'>{text}</Tag>
            }
        },
        {
            title: '单价(元)',
            dataIndex: 'store.avg_price',
            key: 'avg_price',
            render: (text) => {
                return <Tag color='orange'>{text}</Tag>
            }
        },
        {
            title: '数量(个)',
            dataIndex: 'store.count',
            key: 'count',
            render: (text) => {
                return <Tag color='#faad14'>{text}</Tag>
            }
        },
        {
            title: '总价(元)',
            dataIndex: 'store',
            key: 'sum_oprice',
            render: (_, record) => {
                const avg_price = record.store.avg_price
                const count = record.store.count
                return <Tag color='#fa541c'>{parseFloat(avg_price * count).toFixed(2)}</Tag>
            }
        },
        {
            title: '领料人员',
            dataIndex: 'order.user_name',
            key: 'user_name',
            align: 'center',
            width: 100,
        },
        {
            title: '流水',
            dataIndex: 'order.code',
            key: 'code',
            render: (text) => {
                return <Tag color='blue'>{text}</Tag>
            }
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
                <h3>出库物品记录</h3>
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
    const listAllOptions = useCallback(async () => {
        let result = await api.listAllStore()
        if (result.code === 0) { setStoreOptionList(result.data) }
        let result_user = await HttpApi.getUserList()
        setUserOptionList(result_user)
        if (result_user.code === 0) { setUserOptionList(result_user.data) }
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
                <Form.Item label='人员'  {...itemProps}>
                    {props.form.getFieldDecorator('user_id_list', {
                        rules: [{ required: false }]
                    })(<Select mode='multiple' allowClear placeholder='选择人员-支持名称搜索' showSearch optionFilterProp="children">
                        {userOptionList.map((item, index) => {
                            return <Select.Option value={item.id} key={index} all={item}>{item.name}</Select.Option>
                        })}
                    </Select>)}
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
            <Col span={24}>
                <div style={{ textAlign: 'right' }}>
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
        padding: 24,
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