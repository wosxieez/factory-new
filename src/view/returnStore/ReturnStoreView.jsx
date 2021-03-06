import React, { useEffect, useCallback, useState } from 'react';
import api from '../../http';
import { Table, Button, Tag, Row, Col, Input, DatePicker, Select, Form, Modal, message, Tooltip, Drawer } from 'antd';
import moment from 'moment';
import { getTaxPrice, translatePurchaseRecordList } from '../../util/Tool';
import HttpApi from '../../http/HttpApi';
import ExportJsonExcel from 'js-export-excel'
import SearchInput5 from '../outboundStore/SearchInput5';
import StoreHistoryView from '../storehouse/StoreHistoryView';

var date_range;
/***
 * 退料物品记录
 */
export default _ => {
    const [isLoading, setIsLoading] = useState(false)
    const [dataSource, setDataSource] = useState([])
    const [sum_price, setSumPrice] = useState(0)
    const [sum_count, setSumCount] = useState(0)
    const [sum_tax_price, setSumTaxPrice] = useState(0)
    const [historyStoreId, setHistoryStoreId] = useState(null)
    const [drawerVisible, setDrawerVisible] = useState(false)

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
        if (conditionObj.buy_user_id_list) {
            sql_bug_user_id = ' and buy_user_id in (' + conditionObj.buy_user_id_list.join(',') + ')'
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
        let sql = `select pr.*,users1.name as return_user_name,users2.name as record_user_name from return_record as pr
        left join (select * from users where effective = 1) users1 on users1.id = pr.return_user_id
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
            // setDataSource(storeData.map((item, index) => { item.key = index; return item }))
            let temp = storeData.map((item, index) => {
                item.origin_index = item.key
                item.key = index;
                return item
            })
            setDataSource(temp)
            let records_sum_price = 0
            let records_sum_count = 0
            let records_sum_tax_price = 0
            storeData.forEach((item) => {
                records_sum_price += parseFloat(item.count * item.price)
                records_sum_count += parseFloat(item.count)
                records_sum_tax_price += parseFloat(item.count * item.tax_price)
            })
            setSumPrice(parseFloat(records_sum_price).toFixed(2))
            setSumCount(records_sum_count)
            setSumTaxPrice(parseFloat(records_sum_tax_price).toFixed(2))
        }
        setIsLoading(false)
    }, [])
    const exportHandler = useCallback(() => {
        // console.log('dataSource:', dataSource)
        let new_list = dataSource.map((item) => {
            let data = {};
            data.tax_price = String(item.tax_price || '-')
            data.tax = String(item.temp_tax || '-')
            data.date = item.other.date;
            data.code_num = item.other.code_num || '-'
            data.abstract_remark = item.other.abstract_remark || '-';
            data.store_name = item.store_name;
            data.price = String(item.price);
            data.count = String(item.count);
            data.unit = item.unit;
            data.sum_oprice = parseFloat(item.price * item.count).toFixed(2);
            data.return_user_name = item.other.return_user_name || '-';
            data.record_user_name = item.other.record_user_name || '-';
            data.remark = item.other.remark;
            return data
        })
        if (new_list.length === 0) { message.warn('没有相关数据-可供导出'); return }
        var option = {};
        option.fileName = "退料记录文件";
        option.datas = [
            {
                sheetData: new_list,
                sheetName: `退料记录`,
                sheetFilter: ["date", "code_num", "abstract_remark", "store_name", "price", "tax", "tax_price", "count", "unit", "sum_oprice", "return_user_name", "record_user_name", "remark"],
                sheetHeader: ["退料时间", "单号", "摘要", "物品", "含税单价[元]", "税率[%]", "单价[元]", "退料数量", "单位", "含税总价[元]", "退料人员", "记录人员", "退料备注"],
                columnWidths: [8, 8, 8, 10, 5, 5, 5, 5, 3, 5, 5, 5, 5],
            }
        ];
        new ExportJsonExcel(option).saveExcel(); //保存
    }, [dataSource])
    const getHistory = useCallback((record) => {
        setHistoryStoreId(record.store_id)
        setDrawerVisible(true)
    }, [])
    ////////////////
    useEffect(() => {
        listData({});
    }, [listData])
    const columns = [
        {
            title: '退料时间',
            dataIndex: 'other.date',
            key: 'other.date',
            width: 120,
            render: (text) => {
                return moment(text).format('YYYY-MM-DD HH:mm:ss')
            }
        },
        {
            title: '单号/摘要',
            dataIndex: 'other.code_num',
            key: 'other.code_num',
            render: (text, record) => {
                let tempCpt = record.other.abstract_remark ? <span> / {record.other.abstract_remark}</span> : null
                return <div>
                    <span>{text}</span>
                    {tempCpt}
                </div>
            }
        },
        {
            title: '物品',
            dataIndex: 'store_name',
            key: 'store_name',
            render: (text, record) => {
                let title_cpt = null
                if (record.num) {
                    title_cpt = <div>编号{record.num}<Button type='link' size='small' onClick={() => { getHistory(record) }}>历史记录</Button></div>
                } else {
                    title_cpt = <div>无编号<Button type='link' size='small' onClick={() => { getHistory(record) }}>历史记录</Button></div>
                }
                return <Tooltip placement='left' title={title_cpt}>
                    <span>{(record.origin_index + 1 + ' ')}{text}</span>
                </Tooltip>
            }
        },
        {
            title: '含税单价[元]',
            dataIndex: 'price',
            key: 'price',
            render: (text, record) => {
                return <Tooltip placement='left' title={record.temp_tax ? '税率' + record.temp_tax + '%' : '无税率'}>
                    {text}
                </Tooltip>
            }
        },
        {
            title: '单价[元]',
            dataIndex: 'tax_price',
            key: 'tax_price',

        },
        {
            title: '退料数量',
            dataIndex: 'count',
            key: 'count',

        },
        {
            title: '单位',
            dataIndex: 'unit',
            key: 'unit',

        },
        {
            title: '含税总价[元]',
            dataIndex: 'sum_price',
            key: 'sum_price',
            render: (_, record) => {
                return <span >{parseFloat((record.count * record.price || 0).toFixed(2))}</span>
            }
        },
        {
            title: '总价[元]',
            dataIndex: 'sum_tax_price',
            key: 'sum_tax_price',
            render: (_, record) => {
                const price = record.price
                const tax = record.tax
                const count = record.count
                return <span >{parseFloat(getTaxPrice(price, tax) * count).toFixed(2)}</span>
            }
        },
        {
            title: '退料人员',
            dataIndex: 'other.return_user_name',
            key: 'other.return_user_name',
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
            title: '退料备注',
            dataIndex: 'other.remark',
            key: 'other.remark',
            align: 'center',
            width: 100,
            render: (text) => {
                if (text) {
                    return <Tooltip title={text} placement="topLeft">
                        <div className='hideText lineClamp2'>{text}</div>
                    </Tooltip>
                } else { return '-' }
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
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <h3>退料入库物品记录</h3>
                    <Button icon="download" size='small' type='link' style={{ padding: 0, marginLeft: 10, marginTop: -6 }} onClick={() => {
                        Modal.confirm({
                            title: `确认导出当前页面中查询到的所有数据吗？`,
                            content: '请自行确保所选的信息的准确性；数据会保存为【退料记录文件】的Excel文件',
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
        <Drawer
            title="物品历史记录"
            width={800}
            onClose={() => { setDrawerVisible(false) }}
            visible={drawerVisible}
            destroyOnClose={true}
            placement={'left'}
        >
            <StoreHistoryView id={historyStoreId} />
        </Drawer>
    </div >
    )
}
const Searchfrom = Form.create({ name: 'form' })(props => {
    const [userOptionList, setUserOptionList] = useState([])
    const [userOptionList2, setUserOptionList2] = useState([])
    const listAllOptions = useCallback(async () => {
        let result_user = await HttpApi.getUserListForReturn(1)
        setUserOptionList(result_user)
        let result_user2 = await HttpApi.getUserListForReturn(2)
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
                <Form.Item label='退料时间'  {...itemProps}>
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
                    })(<SearchInput5 />)}
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
                <Form.Item label='退料人'  {...itemProps}>
                    {props.form.getFieldDecorator('buy_user_id_list', {
                        rules: [{ required: false }]
                    })(<Select mode='multiple' allowClear placeholder='选择人员-支持名称搜索' showSearch optionFilterProp="children">
                        {userOptionList.map((item, index) => {
                            return <Select.Option value={item.id} key={index} all={item}>{item.name}</Select.Option>
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