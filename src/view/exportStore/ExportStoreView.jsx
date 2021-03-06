import React, { useEffect, useCallback, useState } from 'react';
import api from '../../http';
import { Table, Button, Tag, Row, Col, Input, DatePicker, Select, Form, Modal, message, Tooltip } from 'antd';
import moment from 'moment';
import { calculOrderListStoreTaxAllPrice, getTaxByOpriceAndTaxPrice, getTaxPrice, translateOrderList } from '../../util/Tool';
import HttpApi from '../../http/HttpApi';
import ExportJsonExcel from 'js-export-excel'
import SearchInput5 from '../outboundStore/SearchInput5';
var date_range;
export default _ => {
    const [isLoading, setIsLoading] = useState(false)
    const [dataSource, setDataSource] = useState([])
    const [sum_price, setSumPrice] = useState(0)
    const [sum_count, setSumCount] = useState(0)
    const [sum_tax_price, setSumTaxPrice] = useState(0)

    const listData = useCallback(async (conditionObj) => {
        setIsLoading(true)
        date_range = conditionObj.date_range || [moment().add(0, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss'), moment().endOf('day').format('YYYY-MM-DD HH:mm:ss')]
        let sql_date = ` and orders.in_out_time >= '${date_range[0]}' and orders.in_out_time <= '${date_range[1]}'`
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
        where orders.isdelete = 0 and (orders.status in (2,3) or orders.is_special = 2) and orders.type_id = 1 ${sql_condition}
        order by in_out_time desc`
        // console.log('sql:', sql)
        let result = await api.query(sql)
        if (result.code === 0) {
            // console.log('result.data[0]:', result.data[0])
            let result2 = translateOrderList(result.data[0], conditionObj.store_id_list)
            // console.log('result2:', result2)
            // console.log('ad:', result2.allStoreList.map((item, index) => { item.key = index; return item }))
            let temp = result2.allStoreList.map((item, index) => {
                item.key = index;
                // item.store.tax_price = getTaxPrice(item.store.price, item.store.tax);
                return item
            });
            let all_tax_price = calculOrderListStoreTaxAllPrice(temp)
            setSumTaxPrice(parseFloat(all_tax_price).toFixed(2))
            setDataSource(temp)
            setSumPrice(parseFloat(result2.sum_price).toFixed(2))
            setSumCount(result2.sum_count)
        }
        setIsLoading(false)
    }, [])
    const exportHandler = useCallback(() => {
        let new_list = dataSource.map((item) => {
            let data = {};
            data.tax_price = String(item.store.tax_price || '-')
            data.tax = String(getTaxByOpriceAndTaxPrice(item.store.price, item.store.tax_price) || '-')
            data.in_out_time = moment(item.order.in_out_time).format('YYYY-MM-DD HH:mm:ss');
            data.code = item.order.code;
            data.store_name = item.store.store_name;
            data.price = String(item.store.price);
            data.count = String(item.store.count);
            data.unit = item.store.unit;
            data.sum_oprice = parseFloat(item.store.price * item.store.count).toFixed(2);
            data.user_name = item.order.user_name;
            return data
        })
        if (new_list.length === 0) { message.warn('没有相关数据-可供导出'); return }
        var option = {};
        option.fileName = "流程出库记录文件";
        option.datas = [
            {
                sheetData: new_list,
                sheetName: `出库记录`,
                sheetFilter: ["in_out_time", "code", "store_name", "price", "tax", "tax_price", "count", "unit", "sum_oprice", "user_name"],
                sheetHeader: ["出库时间", "流水", "物品", "含税单价[元]", "税率", "单价[元]", "数量", "单位", "含税总价[元]", "领料人员"],
                columnWidths: [8, 8, 10, 5, 5, 5, 5, 3, 5, 5],
            }
        ];
        new ExportJsonExcel(option).saveExcel(); //保存
    }, [dataSource])
    ////////////////
    useEffect(() => {
        listData({});
    }, [listData])
    const columns = [
        // {
        //     title: '提交时间',
        //     dataIndex: 'order.createdAt',
        //     key: 'createdAt',
        //     width: 180,
        //     render: (text) => {
        //         return moment(text).format('YYYY-MM-DD HH:mm:ss')
        //     }
        // },
        {
            title: '出库时间',
            dataIndex: 'order.in_out_time',
            key: 'in_out_time',
            width: 120,
            render: (text) => {
                return text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '-'
            }
        },
        {
            title: '流水',
            dataIndex: 'order.code',
            key: 'code',
            width: 120,
        },
        {
            title: '物品',
            dataIndex: 'store.store_name',
            key: 'store_name',
            render: (text, record) => {
                return <Tooltip placement='left' title={'编号' + record.store.num}>
                    {text}
                </Tooltip>
            }
        },
        {
            title: '含税单价[元]',
            dataIndex: 'store.price',
            key: 'price',
            render: (text, record) => {
                return <Tooltip placement='left' title={'税率' + getTaxByOpriceAndTaxPrice(record.store.price, record.store.tax_price)}>
                    {text}
                </Tooltip>
            }
        },
        {
            title: '单价[元]',
            dataIndex: 'store.tax_price',
            key: 'tax_price',
        },
        {
            title: '数量',
            dataIndex: 'store.count',
            key: 'count',
        },
        {
            title: '单位',
            dataIndex: 'store.unit',
            key: 'unit',
        },
        {
            title: '含税总价[元]',
            dataIndex: 'store',
            key: 'sum_oprice',
            render: (_, record) => {
                const price = record.store.price
                const count = record.store.count
                return <span>{parseFloat(price * count).toFixed(2)}</span>
            }
        },
        {
            title: '总价[元]',
            dataIndex: 'store',
            key: 'sum_tax_price',
            render: (_, record) => {
                const price = record.store.price
                const tax = record.store.tax
                const count = record.store.count
                return <span>{parseFloat(getTaxPrice(price, tax) * count).toFixed(2)}</span>
            }
        },
        {
            title: '领料人员',
            dataIndex: 'order.user_name',
            key: 'user_name',
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
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <h3>流程出库物品记录</h3>
                    <Button icon="download" size='small' type='link' style={{ padding: 0, marginLeft: 10, marginTop: -6 }} onClick={() => {
                        Modal.confirm({
                            title: `确认导出当前页面中查询到的所有数据吗？`,
                            content: '请自行确保所选的信息的准确性；数据会保存为【流程出库记录文件】的Excel文件',
                            okText: '确定',
                            okType: 'danger',
                            onOk: exportHandler
                        })
                    }} />
                </div>
                <div>
                    <Tag color={'#1890ff'}>总数量#: {sum_count}</Tag>
                    <Tag color={'#1890ff'}>总含税价格¥: {sum_price}</Tag>
                    <Tag color={'#1890ff'} style={{ marginRight: 0 }}>总价格¥: {sum_tax_price}</Tag>
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
    const [userOptionList, setUserOptionList] = useState([])
    const listAllOptions = useCallback(async () => {
        let result_user = await HttpApi.getUserListForOutIn(1)
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
                <Form.Item label='出库时间'  {...itemProps}>
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
                <Form.Item label='物品' {...itemProps}>
                    {props.form.getFieldDecorator('store_id_list', {
                        rules: [{ required: false }]
                    })(<SearchInput5 />)}
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label='领料人'  {...itemProps}>
                    {props.form.getFieldDecorator('user_id_list', {
                        rules: [{ required: false }]
                    })(<Select mode='multiple' allowClear placeholder='选择人员-支持名称搜索' showSearch optionFilterProp="children">
                        {userOptionList.map((item, index) => {
                            return <Select.Option value={item.id} key={index} all={item}>{item.name}</Select.Option>
                        })}
                    </Select>)}
                </Form.Item>
            </Col>
        </Row>
        <Row>
            <Col span={24}>
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