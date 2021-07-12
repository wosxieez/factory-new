import React, { useEffect, useCallback, useState, useRef, forwardRef } from 'react';
import api from '../../http';
import { Table, Button, Tag, Row, Col, Input, DatePicker, Select, Form, Modal, message, Tooltip, Icon, TreeSelect, Dropdown, Menu, Alert, Drawer } from 'antd';
import moment from 'moment';
import { addRemoveRemarkForStoreItem, allStoreItemIsRemoved, calculPriceAndTaxPriceAndCount, checkSumCountAndSumPrice, checkWhichItemReadyRemove, deleteListSomeKeys, getJson2Tree, getTaxPrice, translatePurchaseRecordList, userinfo } from '../../util/Tool';
import HttpApi from '../../http/HttpApi';
import ExportJsonExcel from 'js-export-excel'
import SearchInput5 from '../outboundStore/SearchInput5';
import StoreHistoryView from '../storehouse/StoreHistoryView';

var date_range;
/***
 * 采购物品记录
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
        let sql_store_supplier_id = ''
        if (conditionObj.store_supplier_id) {
            sql_store_supplier_id = ` and store_supplier_id in (${conditionObj.store_supplier_id.join(',')})`
        }
        let sql_condition = sql_date + sql_store_id + sql_code + sql_code_num + sql_bug_user_id + sql_record_user_id + sql_abstract_remark + sql_store_supplier_id
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
                if (!item.removed) { ///不统计撤销的采购单
                    records_sum_price += parseFloat(item.count * item.price)
                    records_sum_count += parseFloat(item.count)
                    records_sum_tax_price += parseFloat(item.count * getTaxPrice(item.price, item.temp_tax))
                }
            })
            setSumPrice(parseFloat(records_sum_price).toFixed(2))
            setSumCount(records_sum_count)
            setSumTaxPrice(parseFloat(records_sum_tax_price).toFixed(2))
        }
        setIsLoading(false)
    }, [])
    const exportHandler = useCallback(() => {
        let new_list = dataSource.filter((item) => { return !item.removed }).map((item) => {
            let data = {};
            data.tax_price = String(item.temp_tax_price || '-')
            data.tax = String(item.temp_tax || '-')
            data.date = item.other.date;
            data.code_num = item.other.code_num || '-'
            data.abstract_remark = item.other.abstract_remark || '-';
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
                sheetFilter: ["date", "code_num", "abstract_remark", "store_name", "price", "tax", "tax_price", "count", "unit", "sum_oprice", "buy_user_name", "record_user_name", "remark"],
                sheetHeader: ["采购时间", "单号", "摘要", "物品", "含税单价[元]", "税率[%]", "单价[元]", "采购数量", "单位", "含税总价[元]", "采购人员", "记录人员", "采购备注"],
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
            title: '采购时间',
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
                // let tempCpt = record.other.abstract_remark ? <Tag color='blue' style={{ marginRight: 0 }}>{record.other.abstract_remark}</Tag> : null
                // return <div>
                //     <Tag color='blue' style={{ marginRight: 0 }}>{text}</Tag>
                //     {tempCpt}
                // </div>
                let tempCpt = record.other.abstract_remark ? <span> / {record.other.abstract_remark}</span> : null
                if (userinfo().permission && userinfo().permission.split(',').indexOf('5') !== -1) {
                    return <Dropdown overlay={<Menu onClick={async (e) => {
                        if (e.key === '1') {
                            let all_store_count_is_reduced = true ///所有物品都发生的减少
                            let all_store_is_removed = false///数据库中对应的物品都删除了
                            const storeList = record.record_content
                            let store_id_list = storeList.map((item) => item.store_id)
                            let sql = `select * from stores where id in (${store_id_list.join(',')}) and isdelete = 0`
                            let result = await api.query(sql)
                            if (result.code === 0) {
                                let res_store_list = result.data[0]
                                if (res_store_list.length === 0) { all_store_is_removed = true } ///数据库中没有采购单中的物品=>单中物品都删除成立
                                storeList.forEach((store) => {
                                    res_store_list.forEach((db_store) => {
                                        if (store.store_id === db_store.id) {
                                            store.db_count = db_store.count ///获取物品对应在数据库中的数量
                                            if (db_store.count < store.count) {///物品数量发生变动[数据库中物品比采购单中的数量少；说明有物品已经出库或编辑减去了]
                                                store.db_is_reduced = true ///某个物品数据库中的数量已经发生了减少
                                            } else {
                                                store.db_is_reduced = false ///该物品数据库中的存量足够减去采购单中的数量
                                                all_store_count_is_reduced = false///所有物品都不够减flag不成立
                                            }
                                        }
                                    })
                                })
                                storeList.forEach((store) => {
                                    if (!(store.db_count >= 0)) { ///上一步 db_count 没有被赋值 为undefined 说明 该物品已经移除
                                        store.db_is_removed = true ///该物品已经移除
                                    } else { ///否则 该物品存在
                                        store.db_is_removed = false ///该物品没有被移除
                                    }
                                })
                            }

                            let all_store_is_rollbacked = allStoreItemIsRemoved(storeList) ///所有物品都已经做过撤销操作了 物品的removed属性为true
                            let new_record = { ...record, record_content: storeList, all_store_count_is_reduced, all_store_is_removed, all_store_is_rollbacked }
                            // console.log('new_record:', new_record)
                            setOperationRecord(new_record)
                            setModalPanelVisible(true)
                        } else if (e.key === '2') {
                            // console.log('record:', record)
                            props.history.push({ pathname: '/main/purchasestorageview', state: { is_insert: true, target_table_data: { ...record.other, content: record.record_content } } })
                        }
                    }}>
                        <Menu.Item key="1"><Icon type="rollback" /><span>撤销采购库单记录</span></Menu.Item>
                        <Menu.Item key="2"><Icon type="plus" /><span>补录采购单</span></Menu.Item>
                    </Menu>} trigger={['contextMenu']}>
                        <div>
                            <span>{text}</span>
                            {tempCpt}
                        </div>
                    </Dropdown>
                } else {
                    return <div>
                        <span>{text}</span>
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
                return <div>
                    <Tooltip placement='left' title={<div>
                        {record.is_insert ? (record.insert_remark ? <div>
                            <div>{record.num ? '编号:' + record.num : '无编号'}<Button type='link' size='small' onClick={() => { getHistory(record) }}>历史记录</Button></div>
                            <div>{'备注:' + record.insert_remark}</div>
                            <div>{'时间:' + record.insert_time}</div>
                        </div> : <div>
                            <div>{record.num ? '编号:' + record.num : '无编号'}<Button type='link' size='small' onClick={() => { getHistory(record) }}>历史记录</Button></div>
                            <div>{'时间:' + record.insert_time}</div>
                        </div>) : <div>
                            <div>{record.num ? '编号:' + record.num : '无编号'}<Button type='link' size='small' onClick={() => { getHistory(record) }}>历史记录</Button></div>
                            {record.remark ? <div>{'备注:' + record.remark}</div> : null}
                        </div>}
                    </div>}>
                        <span>{(record.origin_index + 1 + ' ')}{text}</span>
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
            dataIndex: 'temp_tax_price',
            key: 'temp_tax_price',
        },
        {
            title: '采购数量',
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
                return <span>{parseFloat((record.count * record.price || 0).toFixed(2))}</span>
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
                return <span>{parseFloat(getTaxPrice(price, tax) * count).toFixed(2)}</span>
            }
        },
        {
            title: '供应商',
            dataIndex: 'other.store_supplier_name',
            key: 'other.store_supplier_name',
            align: 'center',
            width: 120,
            render: (text, record) => {
                return <Tooltip title={record.other.store_supplier_id + ' ' + text} placement="topLeft">
                    <div className='hideText lineClamp2'>{text}</div>
                </Tooltip>
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
            title: '采购备注',
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
            <Modal destroyOnClose width={800} title={operationRecord.other ? `确定要撤销单号【${operationRecord.other.code_num}】的采购单吗?` : ''} visible={modalPanelVisible} onCancel={() => { setModalPanelVisible(false) }} onOk={async () => {
                if (operationRecord.all_store_is_rollbacked || operationRecord.all_store_count_is_reduced || operationRecord.all_store_is_removed) { setModalPanelVisible(false); return }
                // console.log(refRemark.current.state.value);
                // console.log(refPassword.current.state.value);
                const remarkValue = refRemark.current.state.value
                const passwrodValue = refPassword.current.state.value
                const selectStoreListValue = refSubTable.current.props.rowSelection.selectedRows
                console.log('选择撤销的物品列表:', selectStoreListValue)///选择撤销的物品列表 对应物品减少对应数量
                if (selectStoreListValue.length === 0) { message.error('勾选的物品不可为空'); return }
                if (!remarkValue) { message.error('备注不可为空'); return }
                if (!passwrodValue) { message.error('密码不可为空'); return }
                if (passwrodValue !== userinfo().password) { message.error('密码不正确'); return }
                let new_content_list = checkWhichItemReadyRemove({ targetList: operationRecord.record_content, conditionList: selectStoreListValue, targetKey: ['store_id', 'key'], conditionKey: ['store_id', 'key'] })
                let { newSumCount, newSumPrice } = checkSumCountAndSumPrice(new_content_list)///修改记录中的 sum_count sum_price
                console.log('new_content_list:', new_content_list)
                console.log('newSumCount, newSumPrice:', newSumCount, newSumPrice)
                const id = operationRecord.other.id ///记录id
                const username = userinfo().name///撤销人id
                const time = moment().format('YYYY-MM-DD HH:mm:ss')///撤销时间
                let final_content_list = addRemoveRemarkForStoreItem({ targetList: new_content_list, removedRemark: remarkValue, removedTime: time, removedUsername: username })
                // console.log('final_content_list:', final_content_list)
                let after_delete_some_key = deleteListSomeKeys(final_content_list) ///删除不需要的属性
                // console.log('after_delete_some_key:', after_delete_some_key) ///删除不需要的属性
                // selectStoreListValue.forEach((store_data) => {
                //     let result = calculPriceAndTaxPriceAndCount(store_data)
                //     console.log('result:', result);
                // })
                ///////////////////////////
                ///selectStoreListValue 选择的物品列表，循环查询库存单价去税加的数据。
                // for (let index = 0; index < selectStoreListValue.length; index++) {
                //     const oneStore = selectStoreListValue[index]
                //     const store_id = oneStore.store_id;
                //     console.log("store_id:", store_id);
                //     let res = await HttpApi.getStoreListById({ id: store_id })
                //     if (res.code === 0 && res.data.length > 0) {
                //         const db_store = res.data[0]
                //         let calcul_res = calculPriceAndTaxPriceAndCount(db_store, oneStore)
                //         console.log('calcul_res:', calcul_res)
                //         // let update_res = await api.updateStore({ id: oneStore.id, ...calcul_res })
                //         // if (update_res.code === 0) {
                //         //     message.success('物品数量恢复成功', 3);
                //         // }
                //     }
                // }
                //////////////////////////
                // return;
                let sql = `update purchase_record set content = '${JSON.stringify(after_delete_some_key)}',sum_count= ${newSumCount},sum_price = ${newSumPrice} where id = ${id}`
                // console.log('sql:', sql)
                let result = await api.query(sql)
                if (result.code === 0) { ///记录入库成功-开始循环修改store表中物品的信息。条件:store_id---数据:avg_price all_count remark 等
                    console.log('采购单修改成功')
                    for (let index = 0; index < selectStoreListValue.length; index++) {
                        const oneStore = selectStoreListValue[index]
                        const store_id = oneStore.store_id;
                        let res = await HttpApi.getStoreListById({ id: store_id })
                        if (res.code === 0 && res.data.length > 0) {
                            const db_store = res.data[0]
                            let calcul_res = calculPriceAndTaxPriceAndCount(db_store, oneStore)
                            console.log('calcul_res:', calcul_res)
                            let update_res = await api.updateStore({ id: store_id, ...calcul_res })
                            if (update_res.code === 0) {
                                console.log('撤销成功！物品数量恢复成功')
                                message.success('物品数量恢复成功', 3);
                            }
                        }
                    }
                }
                setModalPanelVisible(false)
                listData({})
            }}>
                <div>
                    <Alert showIcon type={operationRecord.all_store_count_is_reduced || operationRecord.all_store_is_rollbacked || operationRecord.all_store_is_removed ? 'error' : 'warning'}
                        message={operationRecord.all_store_count_is_reduced || operationRecord.all_store_is_removed ? '当前数据库中物料数量已经发生变动[可能已出库]、或物品已被删除；此单不可再做撤销操作。' : (operationRecord.all_store_is_rollbacked ? '所有物品都已做过撤销操作' : '点击确定后；出库单中所有物品都将恢复(-减少)对应数量')} />
                    {operationRecord.record_content ? <StoreListSubTable ref={refSubTable} data={operationRecord.record_content} /> : null}
                    {operationRecord.all_store_count_is_reduced || operationRecord.all_store_is_rollbacked || operationRecord.all_store_is_removed ?
                        null : <div>
                            <Input style={styles.marginTop} ref={refRemark} maxLength={50} placeholder='备注撤销原因[必填]' allowClear />
                            <Input style={styles.marginTop} ref={refPassword} maxLength={30} placeholder='库管人员密码[必填]' allowClear />
                        </div>}
                </div>
            </Modal>
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
    const [supplierTreeData, setSupplierTreeData] = useState([])
    const [userOptionList2, setUserOptionList2] = useState([])
    const listAllOptions = useCallback(async () => {
        let result_user2 = await HttpApi.getUserListForPurchase(2)
        setUserOptionList2(result_user2)
        let res1 = await HttpApi.getStoreAttributeList({ table_index: 3 })
        if (res1.code === 0) {
            let temp_tree = getJson2Tree(res1.data, null);
            temp_tree = temp_tree.map((item) => { item.title = item.num + '-' + item.title; return item })
            setSupplierTreeData(temp_tree)
        }
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
                <Form.Item label='供应商'  {...itemProps}>
                    {props.form.getFieldDecorator('store_supplier_id', {
                        rules: [{ required: false }]
                    })(<TreeSelect
                        multiple
                        allowClear
                        showSearch
                        filterOption='children'
                        treeNodeFilterProp="title"
                        treeData={supplierTreeData}
                        style={{ width: '100%' }}
                        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                        placeholder="请选择供应商"
                        showCheckedStrategy={TreeSelect.SHOW_PARENT}
                    />)}
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
    console.log('props.data:', props.data);
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    const [selectedRows, setselectedRows] = useState([])
    const columns_sub = [
        {
            title: '编号',
            dataIndex: 'num',
            key: 'num',
            render: (text, record) => {
                if (record.removed) { return <s style={{ color: 'red' }}>{text}</s> }
                if (record.db_is_removed) { return <span><s style={{ color: 'red' }}>{text}</s> <span>已被删</span></span> }
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
            title: '含税单价',
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
                if (record.db_count < record.count) { return <span><s style={{ color: 'red' }}>{text}</s> <span>{record.db_count}</span></span> }
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
        // console.log('record.db_count:', record.db_count, 'record.count:', record.count)
        // console.log('getCheckboxPropsHandler record:', record)
        return ({
            disabled: record.removed || record.db_is_reduced || record.db_is_removed
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