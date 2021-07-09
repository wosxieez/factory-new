import React, { useEffect, useCallback, useState, useRef, forwardRef } from 'react';
import api from '../../http';
import { Table, Button, Tag, Row, Col, Input, DatePicker, Select, Form, Modal, message, Tooltip, Menu, Dropdown, Icon, Alert } from 'antd';
import moment from 'moment';
import { addRemoveRemarkForStoreItem, allStoreItemIsRemoved, checkSumCountAndSumPrice, checkWhichItemReadyRemove, translatePurchaseRecordList, userinfo } from '../../util/Tool';
import HttpApi from '../../http/HttpApi';
import ExportJsonExcel from 'js-export-excel'
import SearchInput5 from './SearchInput5';

var date_range;
/***
 * 自行出库物品记录
 */
export default props => {
    const refRemark = useRef(null)
    const refPassword = useRef(null)
    const refSubTable = useRef(null)
    const [isLoading, setIsLoading] = useState(false)
    const [dataSource, setDataSource] = useState([])
    const [sum_price, setSumPrice] = useState(0)
    const [sum_count, setSumCount] = useState(0)
    const [sum_tax_price, setSumTaxPrice] = useState(0)
    const [modalPanelVisible, setModalPanelVisible] = useState(false)
    const [operationRecord, setOperationRecord] = useState({})
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
        let sql_out_user_id = ''
        if (conditionObj.out_user_id_list) {
            sql_out_user_id = ' and out_user_id in (' + conditionObj.out_user_id_list.join(',') + ')'
        }
        let sql_record_user_id = ''
        if (conditionObj.record_user_id_list) {
            sql_record_user_id = ' and record_user_id in (' + conditionObj.record_user_id_list.join(',') + ')'
        }
        let sql_abstract_remark = ''
        if (conditionObj.abstract_remark) {
            sql_abstract_remark = ` and abstract_remark like '%${conditionObj.abstract_remark}%'`
        }
        let sql_condition = sql_date + sql_store_id + sql_code + sql_code_num + sql_out_user_id + sql_record_user_id + sql_abstract_remark
        // console.log('sql_condition:', sql_condition)
        let sql = `select pr.*,users1.name as out_user_name,users2.name as record_user_name from outbound_record as pr
        left join (select * from users where effective = 1) users1 on users1.id = pr.out_user_id
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
                item.origin_index = item.key
                item.key = index;
                // item.tax_price = getTaxPrice(item.price, item.tax);
                return item
            })
            // console.log('temp:', temp)
            setDataSource(temp)
            let records_sum_price = 0
            let records_sum_count = 0
            let records_sum_tax_price = 0
            storeData.forEach((item) => {
                if (!item.removed) { ///不统计撤销的出库单
                    records_sum_price += parseFloat(item.count * item.price)
                    records_sum_count += parseFloat(item.count)
                    records_sum_tax_price += parseFloat(item.count * item.tax_price)
                }
            })
            setSumPrice(parseFloat(records_sum_price).toFixed(2))
            setSumCount(records_sum_count)
            setSumTaxPrice(parseFloat(records_sum_tax_price).toFixed(2))
        }
        setIsLoading(false)
    }, [])
    const exportHandler = useCallback(() => {
        // console.log('dataSource:', dataSource)
        // return
        let new_list = dataSource.filter((item) => { return !item.removed }).map((item) => {
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
            data.out_user_name = item.other.out_user_name || '-';
            data.record_user_name = item.other.record_user_name || '-';
            data.remark = item.other.remark;
            return data
        })
        if (new_list.length === 0) { message.warn('没有相关数据-可供导出'); return }
        var option = {};
        option.fileName = "自行出库记录文件";
        option.datas = [
            {
                sheetData: new_list,
                sheetName: `出库记录`,
                sheetFilter: ["date", "code_num", "abstract_remark", "store_name", "price", "tax", "tax_price", "count", "unit", "sum_oprice", "out_user_name", "record_user_name", "remark"],
                sheetHeader: ["出库时间", "单号", "摘要", "物品", "含税单价[元]", "税率[%]", "单价[元]", "出库数量", "单位", "含税总价[元]", "领料人员", "记录人员", "出库备注"],
                columnWidths: [8, 8, 8, 10, 5, 5, 5, 5, 3, 5, 5, 5, 5],
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
            title: '出库时间',
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
                let tempCpt = record.other.abstract_remark ? <sapn style={{ marginRight: 0 }}> / {record.other.abstract_remark}</sapn> : null
                if (userinfo().permission && userinfo().permission.split(',').indexOf('5') !== -1) {
                    return <Dropdown overlay={<Menu onClick={e => {
                        if (e.key === '1') {
                            setOperationRecord(record)
                            setModalPanelVisible(true)
                        } else if (e.key === '2') {
                            // console.log('record:', record)
                            props.history.push({ pathname: '/main/outboundstorageview', state: { is_insert: true, target_table_data: { ...record.other, content: record.record_content } } })
                        }
                    }}>
                        <Menu.Item key="1" ><Icon type="rollback" /><span>撤销出库单记录</span></Menu.Item>
                        <Menu.Item key="2" ><Icon type="plus" /><span>补录出库单</span></Menu.Item>
                    </Menu>} trigger={['contextMenu']}>
                        <div>
                            <sapn style={{ marginRight: 0 }}>{text}</sapn>
                            {tempCpt}
                        </div>
                    </Dropdown>
                } else {
                    return <div>
                        <Tag style={{ marginRight: 0 }}>{text}</Tag>
                        {tempCpt}
                    </div>
                }
            }
        },
        {
            title: '物品',
            dataIndex: 'store_name',
            key: 'store_name',
            render: (text, record) => {
                // console.log('record:', record)
                return <div>
                    <Tooltip placement='left' title={<div>
                        {record.is_insert ? (record.insert_remark ? <div>
                            <div>{record.num ? '编号:' + record.num : '无编号'}</div>
                            <div>{'备注:' + record.insert_remark}</div>
                            <div>{'时间:' + record.insert_time}</div>
                        </div> : <div>
                            <div>{record.num ? '编号:' + record.num : '无编号'}</div>
                            <div>{'时间:' + record.insert_time}</div>
                        </div>) : <div>
                            <div>{record.num ? '编号:' + record.num : '无编号'}</div>
                            {record.remark ? <div>{'备注:' + record.remark}</div> : null}
                        </div>}
                    </div>}>
                        <span style={{ marginRight: 0 }}>{(record.origin_index + 1 + ' ')}{text}</span>
                        {record.is_insert ? <span style={{ color: '#1890ff' }}>/补录</span> : null}
                    </Tooltip>
                    {record.removed ?
                        <Tooltip placement='left' title={<div>
                            <div>{record.removedTime}</div>
                            <div>{record.removedUsername}</div>
                            <div>备注: {record.removedRemark}</div>
                        </div>}>
                            <span style={{ color: '#f5222d' }}>/已撤销</span>
                        </Tooltip>
                        : null}
                </div>
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
            title: '出库数量',
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
                return <sapn>{parseFloat((record.count * record.price || 0).toFixed(2))}</sapn>
            }
        },
        {
            title: '总价[元]',
            dataIndex: 'sum_tax_price',
            key: 'sum_tax_price',
            render: (_, record) => {
                const price = record.tax_price
                const count = record.count
                return <sapn>{parseFloat(price * count).toFixed(2)}</sapn>
            }
        },
        {
            title: '领料人员',
            dataIndex: 'other.out_user_name',
            key: 'other.out_user_name',
            align: 'center',
            width: 100,
            render: (text) => {
                return text || '-'
            }
        },
        {
            title: '记录人员',
            dataIndex: 'other.record_user_name',
            key: 'other.record_user_name',
            align: 'center',
            width: 100,
        },
        {
            title: '出库备注',
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
                // console.log('conditionsValue:', conditionsValue)
                listData(conditionsValue)
            }} />
        </div>
        <div style={styles.body}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <h3>自行出库物品记录</h3>
                    <Button icon="download" size='small' type='link' style={{ padding: 0, marginLeft: 10, marginTop: -6 }} onClick={() => {
                        Modal.confirm({
                            title: `确认导出当前页面中查询到的所有数据吗？`,
                            content: '请自行确保所选的信息的准确性；数据会保存为【自行出库记录文件】的Excel文件',
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
            <Alert showIcon type='info' message='总数量、总含税价格、总价格的统计不包含撤销单中的物品' />
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
            <Modal destroyOnClose width={800} title={operationRecord.other ? `确定要撤销单号【${operationRecord.other.code_num}】的出库单吗?` : ''} visible={modalPanelVisible} onCancel={() => { setModalPanelVisible(false) }} onOk={async () => {
                if (allStoreItemIsRemoved(operationRecord.record_content)) { setModalPanelVisible(false); return }
                const remarkValue = refRemark.current.state.value
                const passwrodValue = refPassword.current.state.value
                const selectStoreListValue = refSubTable.current.props.rowSelection.selectedRows
                // console.log('selectStoreListValue:', selectStoreListValue)///选择撤销的物品列表 对应物品增加对应数量
                // console.log('operationRecord:', operationRecord)
                if (selectStoreListValue.length === 0) { message.error('勾选的物品不可为空'); return }
                if (!remarkValue) { message.error('备注不可为空'); return }
                if (!passwrodValue) { message.error('密码不可为空'); return }
                if (passwrodValue !== userinfo().password) { message.error('密码不正确'); return }
                let new_content_list = checkWhichItemReadyRemove({ targetList: operationRecord.record_content, conditionList: selectStoreListValue, targetKey: ['store_id', 'key'], conditionKey: ['store_id', 'key'] })
                let { newSumCount, newSumPrice } = checkSumCountAndSumPrice(new_content_list)///修改记录中的 sum_count sum_price
                // console.log('new_content_list:', new_content_list)
                // console.log('newSumCount, newSumPrice:', newSumCount, newSumPrice)
                const id = operationRecord.other.id ///记录id
                const username = userinfo().name///撤销人id
                const time = moment().format('YYYY-MM-DD HH:mm:ss')///撤销时间
                let final_content_list = addRemoveRemarkForStoreItem({ targetList: new_content_list, removedRemark: remarkValue, removedTime: time, removedUsername: username })
                // console.log('final_content_list:', final_content_list)///修改记录中的 content
                // return;
                let sql = `update outbound_record set content = '${JSON.stringify(final_content_list)}',sum_count= ${newSumCount},sum_price = ${newSumPrice} where id = ${id}`
                // console.log('sql:', sql)
                // let sql_old = `update outbound_record_copy set is_rollback = 1,rollback_des = '${des}',rollback_username = '${username}',rollback_time = '${time}' where id = ${id}`
                // // console.log('storeList:', storeList)
                let result = await api.query(sql)
                if (result.code === 0) { ///记录入库成功-开始循环修改store表中物品的信息。条件:store_id---数据:avg_price all_count remark 等
                    console.log('出库单修改成功')
                    for (let index = 0; index < selectStoreListValue.length; index++) {
                        const storeObj = selectStoreListValue[index]
                        let result = await api.updateStoreCount({ id: storeObj.store_id, count: storeObj.count })
                        if (result.code === 0) {
                            message.success('物品数量恢复成功', 3);
                        }
                    }
                }
                setModalPanelVisible(false)
                listData({})
            }}>
                <div>
                    <Alert showIcon type={allStoreItemIsRemoved(operationRecord.record_content) ? 'error' : 'warning'} message={allStoreItemIsRemoved(operationRecord.record_content) ? '此单所有物品都已撤销' : '点击确定后；勾选的物品都将恢复(+增加)对应数量；已撤销过的物品不可再次操作'} />
                    {/* <Descriptions style={styles.marginTop} bordered title="此单物料列表" size={'small'}>
                        {operationRecord.record_content ? operationRecord.record_content.map((item, index) => {
                            return [
                                <Descriptions.Item label="编号">{item.num}</Descriptions.Item>,
                                <Descriptions.Item label="名称">{item.store_name}</Descriptions.Item>,
                                <Descriptions.Item label="数量">{item.count}</Descriptions.Item>,
                            ]
                        }) : ''}
                    </Descriptions> */}
                    {operationRecord.record_content ? <StoreListSubTable ref={refSubTable} data={operationRecord.record_content} /> : null}
                    {allStoreItemIsRemoved(operationRecord.record_content) ? null :
                        <div>
                            <Input style={styles.marginTop} ref={refRemark} maxLength={50} placeholder='备注撤销原因[必填]' allowClear />
                            <Input style={styles.marginTop} ref={refPassword} maxLength={30} placeholder='库管人员密码[必填]' allowClear />
                        </div>}
                </div>
            </Modal>
        </div>
    </div >
    )
}
const Searchfrom = Form.create({ name: 'form' })(props => {
    const [userOptionList, setUserOptionList] = useState([])
    const [userOptionList2, setUserOptionList2] = useState([])
    const listAllOptions = useCallback(async () => {
        let result_user = await HttpApi.getUserListForOutbound(1)
        setUserOptionList(result_user)
        let result_user2 = await HttpApi.getUserListForOutbound(2)
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
                <Form.Item label='领料人'  {...itemProps}>
                    {props.form.getFieldDecorator('out_user_id_list', {
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

const StoreListSubTable = forwardRef((props, ref) => {
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    const [selectedRows, setselectedRows] = useState([])
    const columns_sub = [
        {
            title: '编号',
            dataIndex: 'num',
            key: 'num',
            render: (text, record) => {
                if (record.removed) { return <s style={{ color: 'red' }}>{text}</s> }
                return text
            }
        },
        {
            title: '名称',
            dataIndex: 'store_name',
            key: 'store_name',
            render: (text, record) => {
                let key_num = record.key + 1
                if (record.removed) { return <s style={{ color: 'red' }}>{key_num} {text}</s> }
                return key_num + ' ' + text
            }
        },
        {
            title: '单价[含税]',
            dataIndex: 'price',
            key: 'price',
            render: (text, record) => {
                return text
            }
        },
        {
            title: '数量',
            dataIndex: 'count',
            key: 'count',
            render: (text, record) => {
                if (record.removed) { return <s style={{ color: 'red' }}>{text}</s> }
                return text
            }
        },
        {
            title: '撤销备注',
            dataIndex: 'removedRemark',
            key: 'removedRemark',
            render: (text) => {
                return text
            }
        },
    ]
    const onSelectChange = useCallback((sRowKeys, sRows) => {
        setSelectedRowKeys(sRowKeys)
        setselectedRows(sRows)
    }, [])
    const getCheckboxPropsHandler = useCallback((record) => {
        return ({
            disabled: record.removed
        })
    }, [])
    const rowSelection = {
        selectedRowKeys,
        selectedRows,
        onChange: onSelectChange,
        getCheckboxProps: getCheckboxPropsHandler
    };
    return <Table style={styles.marginTop} ref={ref} rowSelection={rowSelection} dataSource={props.data} columns={columns_sub} size='small' bordered pagination={false} />
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