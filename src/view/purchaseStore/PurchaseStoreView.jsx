import React, { useEffect, useCallback, useState } from 'react';
import api from '../../http';
import { Table, Button, Tag, Row, Col, Input, DatePicker, Select, Form, Modal, message, Tooltip, Icon } from 'antd';
import moment from 'moment';
import { getTaxPrice, translatePurchaseRecordList } from '../../util/Tool';
import HttpApi from '../../http/HttpApi';
import ExportJsonExcel from 'js-export-excel'

var date_range;
/***
 * 采购物品记录
 */
export default _ => {
    const [isLoading, setIsLoading] = useState(false)
    const [dataSource, setDataSource] = useState([])
    const [sum_price, setSumPrice] = useState(0)
    const [sum_count, setSumCount] = useState(0)
    const [sum_tax_price, setSumTaxPrice] = useState(0)

    const listData = useCallback(async (conditionObj) => {
        setIsLoading(true)
        date_range = conditionObj.date_range || [moment().add(0, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss'), moment().endOf('day').format('YYYY-MM-DD HH:mm:ss')]
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
        let sql_abstract_remark = ''
        if (conditionObj.abstract_remark) {
            sql_abstract_remark = ` and abstract_remark like '%${conditionObj.abstract_remark}%'`
        }
        let sql_condition = sql_date + sql_store_id + sql_code + sql_code_num + sql_bug_user_id + sql_record_user_id + sql_abstract_remark
        // console.log('sql_condition:', sql_condition)
        let sql = `select pr.*,store_suppliers.name as store_supplier_name,users2.name as record_user_name from purchase_record as pr
        left join (select * from store_suppliers where isdelete = 0) store_suppliers on store_suppliers.id = pr.store_supplier_id
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
            let temp = storeData.map((item, index) => {
                item.key = index;
                // item.tax_price = getTaxPrice(item.price, item.tax);
                return item
            })
            setDataSource(temp)
            let records_sum_price = 0
            let records_sum_count = 0
            let records_sum_tax_price = 0
            storeData.forEach((item) => {
                records_sum_price += parseFloat(item.count * item.price)
                records_sum_count += parseFloat(item.count)
                records_sum_tax_price += parseFloat(item.count * getTaxPrice(item.price, item.temp_tax))
            })
            setSumPrice(parseFloat(records_sum_price).toFixed(2))
            setSumCount(records_sum_count)
            setSumTaxPrice(parseFloat(records_sum_tax_price).toFixed(2))
        }
        setIsLoading(false)
    }, [])
    const exportHandler = useCallback(() => {
        let new_list = dataSource.map((item) => {
            let data = {};
            data.tax_price = String(item.temp_tax_price || '-')
            data.tax = String(item.tax || '-')
            data.date = item.other.date;
            data.code_num = item.other.code_num || '-'
            data.code = item.other.code;
            data.store_name = item.store_name;
            data.price = String(item.price);
            data.count = String(item.count);
            data.unit = item.unit;
            data.sum_oprice = parseFloat(item.price * item.count).toFixed(2);
            data.buy_user_name = item.other.buy_user_name || '-';
            data.record_user_name = item.other.record_user_name || '-';
            data.remark = item.other.remark;
            return data
        })
        if (new_list.length === 0) { message.warn('没有相关数据-可供导出'); return }
        var option = {};
        option.fileName = "采购记录文件";
        option.datas = [
            {
                sheetData: new_list,
                sheetName: `采购记录`,
                sheetFilter: ["date", "code_num", "code", "store_name", "price", "tax", "tax_price", "count", "unit", "sum_oprice", "buy_user_name", "record_user_name", "remark"],
                sheetHeader: ["采购时间", "单号", "流水", "物品", "含税单价[元]", "税率", "单价[元]", "采购数量", "单位", "含税总价[元]", "采购人员", "记录人员", "采购备注"],
                columnWidths: [8, 5, 8, 10, 5, 5, 5, 5, 3, 5, 5, 5, 5],
            }
        ];
        new ExportJsonExcel(option).saveExcel(); //保存
    }, [dataSource])
    ////////////////
    useEffect(() => {
        listData({});
    }, [listData])
    const columns = [
        {
            title: '采购时间',
            dataIndex: 'other.date',
            key: 'other.date',
            width: 180,
            render: (text) => {
                return moment(text).format('YYYY-MM-DD HH:mm:ss')
            }
        },
        {
            title: '单号/摘要',
            dataIndex: 'other.code_num',
            key: 'other.code_num',
            render: (text, record) => {
                let tempCpt = record.other.abstract_remark ? <Tag color='blue' style={{ marginRight: 0 }}>{record.other.abstract_remark}</Tag> : null
                return <div>
                    <Tag color='blue' style={{ marginRight: 0 }}>{text}</Tag>
                    {tempCpt}
                </div>
            }
        },
        {
            title: '物品',
            dataIndex: 'store_name',
            key: 'store_name',
            render: (text, record) => {
                return <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <Tooltip placement='left' title={record.num ? '编号' + record.num : '无编号'}>
                        <Tag color='cyan' style={{ marginRight: 0 }}>{text}</Tag>
                    </Tooltip>
                    {record.temp_remark ? <Tooltip placement='top' title={record.temp_remark}>
                        <Icon style={{ marginLeft: 10 }} type="exclamation-circle" theme="twoTone" />
                    </Tooltip> : null}
                </div>
            }
        },
        {
            title: '含税单价[元]',
            dataIndex: 'price',
            key: 'price',
            render: (text, record) => {
                return <Tooltip placement='left' title={record.temp_tax ? '税率' + record.temp_tax + '%' : '无税率'}>
                    <Tag color='orange' style={{ marginRight: 0 }}>{text}</Tag>
                </Tooltip>
            }
        },
        {
            title: '单价[元]',
            dataIndex: 'temp_tax_price',
            key: 'temp_tax_price',
            render: (text, record) => {
                return <Tag color='#722ed1' style={{ marginRight: 0 }}>{text}</Tag>

            }
        },
        {
            title: '采购数量',
            dataIndex: 'count',
            key: 'count',
            render: (text) => {
                return <Tag color='#faad14' style={{ marginRight: 0 }}>{text}</Tag>
            }
        },
        {
            title: '单位',
            dataIndex: 'unit',
            key: 'unit',
            render: (text) => {
                return <Tag color='orange' style={{ marginRight: 0 }}>{text}</Tag>
            }
        },
        {
            title: '含税总价[元]',
            dataIndex: 'sum_price',
            key: 'sum_price',
            render: (_, record) => {
                return <Tag color='#fa541c' style={{ marginRight: 0 }}>{parseFloat((record.count * record.price || 0).toFixed(2))}</Tag>
            }
        },
        {
            title: '总价[元]',
            dataIndex: 'sum_tax_price',
            key: 'sum_tax_price',
            render: (_, record) => {
                const price = record.price
                const tax = record.temp_tax
                const count = record.count
                return <Tag color='#722ed1' style={{ marginRight: 0 }}>{parseFloat(getTaxPrice(price, tax) * count).toFixed(2)}</Tag>
            }
        },
        {
            title: '供应商',
            dataIndex: 'other.store_supplier_name',
            key: 'other.store_supplier_name',
            align: 'center',
        },
        {
            title: '记录人员',
            dataIndex: 'other.record_user_name',
            key: 'other.record_user_name',
            align: 'center',
            width: 100,
        },
        {
            title: '采购备注',
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
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <h3>采购入库物品记录</h3>
                    <Button icon="download" size='small' type='link' style={{ padding: 0, marginLeft: 10, marginTop: -6 }} onClick={() => {
                        Modal.confirm({
                            title: `确认导出当前页面中查询到的所有数据吗？`,
                            content: '请自行确保所选的信息的准确性；数据会保存为【采购记录文件】的Excel文件',
                            okText: '确定',
                            okType: 'danger',
                            onOk: exportHandler
                        })
                    }} />
                </div>
                <div>
                    <Tag color={'#faad14'}>总数量#: {sum_count}</Tag>
                    <Tag color={'#fa541c'}>总含税价格¥: {sum_price}</Tag>
                    <Tag color={'#722ed1'} style={{ marginRight: 0 }}>总价格¥: {sum_tax_price}</Tag>
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
    // const [userOptionList, setUserOptionList] = useState([])
    const [userOptionList2, setUserOptionList2] = useState([])
    const listAllOptions = useCallback(async () => {
        let result = await api.listAllStore()
        if (result.code === 0) { setStoreOptionList(result.data) }
        // let result_user = await HttpApi.getUserListForPurchase(1)
        // setUserOptionList(result_user)
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
                <Form.Item label='摘要'  {...itemProps}>
                    {props.form.getFieldDecorator('abstract_remark', {
                        rules: [{ required: false }]
                    })(<Input allowClear placeholder="请输入摘要" />)}
                </Form.Item>
            </Col>
            <Col span={18}>
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