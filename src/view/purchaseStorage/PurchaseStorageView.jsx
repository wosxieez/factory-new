import React, { useState, useCallback, useEffect } from 'react';
import { DatePicker, Table, Button, Form, Input, Select, InputNumber, message, Tag, Modal, Alert } from 'antd';
import moment from 'moment';
import api from '../../http';

var storeList = [{ key: 0 }]
const starIcon = <span style={{ color: 'red' }}>* </span>
/**
 * 采购入库单界面
 */
export default Form.create({ name: 'form' })(props => {
    const [storeOptionList, setStoreOptionList] = useState([])
    const [userOptionList, setUserOptionList] = useState([])
    const [sumCount, setSumCount] = useState(0)
    const [sumPrice, setSumPrice] = useState(0)
    const listAllStore = useCallback(async () => {
        let result = await api.listAllStore()
        if (result.code === 0) { setStoreOptionList(result.data) }
        let result_user = await api.listAllUser()
        if (result_user.code === 0) { setUserOptionList(result_user.data) }
    }, [])
    const columns = [
        { title: '编号', dataIndex: 'key', width: 50, align: 'center', render: (text) => <div>{text + 1}</div> },
        {
            title: <div>{starIcon}物品</div>, dataIndex: 'store_id', width: 220, align: 'center', render: (text, record) => {
                return <Select placeholder='选择物品-支持名称搜索' showSearch optionFilterProp="children" value={text} onChange={(_, option) => { handleSelectChange(option, record.key) }}>
                    {storeOptionList.map((item, index) => {
                        return <Select.Option value={item.id} key={index} all={item} disabled={storeList.map((item) => item.store_id).indexOf(item.id) !== -1}>{item.name}</Select.Option>
                    })}
                </Select>
            }
        },
        {
            title: <div>{starIcon}数量</div>, dataIndex: 'count', width: 80, align: 'center', render: (text, record) => {
                return <InputNumber placeholder='输入数量' precision={0} value={text} min={1} disabled={!record.store_id} onChange={(v) => {
                    if (!v) { v = 1 }
                    let param = { 'key': record.key, 'count': v }
                    changeTableListHandler(param)
                }}></InputNumber>
            }
        },
        {
            title: <div>{starIcon}单位</div>, dataIndex: 'unit', width: 70, align: 'center', render: (text) => {
                return <Input disabled value={text} />
            }
        },
        {
            title: <div>{starIcon}单价[元]</div>, dataIndex: 'price', width: 130, align: 'center', render: (text, record) => {
                return <InputNumber placeholder='输入价格' value={text} min={0.01} disabled={!record.store_id} onChange={(v) => {
                    let param = { 'key': record.key, 'price': v }
                    changeTableListHandler(param)
                }}></InputNumber>
            }
        },
        {
            title: <div>{starIcon}总价[元]</div>, dataIndex: 'sum_price', width: 130, align: 'center', render: (_, record) => {
                let sum_price = parseFloat((record.count * record.price || 0).toFixed(2))
                return <InputNumber disabled value={sum_price ? sum_price : ''}></InputNumber>
            }
        },
        {
            title: '物品备注', dataIndex: 'remark', align: 'center', render: (text, record) => {
                return <Input value={text} allowClear disabled={!record.store_id} onChange={(e) => {
                    let param = { 'key': record.key, 'remark': e.target.value }
                    changeTableListHandler(param)
                }}></Input>
            }
        },
        {
            title: '操作', dataIndex: 'action', width: 100, align: 'center', render: (_, record) => {
                return <Button size='small' type='danger' icon='delete' onClick={() => {
                    let copy = JSON.parse(JSON.stringify(storeList))
                    let afterFilter = copy.filter((item) => item.key !== record.key).map((item, index) => { item.key = index; return item })
                    storeList = afterFilter
                    console.log('删除 afterFilter:', afterFilter)
                    props.form.setFieldsValue({ storeList: afterFilter }) ///删除有问题
                }} >删除</Button>
            }
        },
    ]
    const calculSumCountAndPrice = useCallback(() => {
        let sum_count = 0;
        let sum_price = 0;
        storeList.filter((item) => {
            return item.store_id && item.price
        }).forEach((item) => {
            sum_count += item.count
            sum_price += (item.price || 0) * item.count
        })
        setSumCount(sum_count)
        setSumPrice(parseFloat((sum_price).toFixed(2)))
    }, [])
    const changeTableListHandler = useCallback((param) => {
        let afterInsert = storeList.map((item) => {
            if (item.key === param.key) {
                item = { ...item, ...param }
                let all_count = item.o_count + item.count
                let all_price = parseFloat(((item.o_price || 0) * item.o_count + item.price * item.count).toFixed(2))
                let avg_price = parseFloat((all_price / all_count).toFixed(2))
                item = { ...item, all_count, all_price, avg_price }
            }
            return item
        })
        storeList = afterInsert;
        props.form.setFieldsValue({ storeList: afterInsert })
        calculSumCountAndPrice()
    }, [props.form, calculSumCountAndPrice])

    const handleSelectChange = useCallback((option, key) => {
        const selectObj = option.props.all;
        let param = { 'key': key, 'unit': selectObj.unit, 'price': selectObj.oprice, 'count': 1, 'store_id': selectObj.id, 'store_name': selectObj.name, 'o_count': selectObj.count, 'o_price': selectObj.oprice, 'remark': selectObj.remark }
        changeTableListHandler(param)
    }, [changeTableListHandler])

    /**
     * 更新物品库存信息。同时要给记录表插入一条记录
     */
    const updateStoreAndrecordHandler = useCallback(async (formData) => {
        for (const key in formData) {
            if (formData.hasOwnProperty(key)) {
                const element = formData[key];
                if (!element) {
                    formData[key] = null
                }
            }
        }
        // console.log('formData:', formData)
        const { date, storeList, remark, buy_user_id, record_user_id, code_num } = formData;
        const code = 'CG' + moment().toDate().getTime()
        let sql = `insert into purchase_record (date,code,code_num,supplier_id,content,buy_user_id,record_user_id,remark,sum_count,sum_price) values ('${date.format('YYYY-MM-DD HH:mm:ss')}','${code}',${code_num ? '\'' + code_num + '\'' : null},${null},'${JSON.stringify(storeList)}',${buy_user_id || null},${record_user_id},${remark ? '\'' + remark + '\'' : null},${sumCount},${sumPrice})`
        let result = await api.query(sql)
        if (result.code === 0) { ///记录入库成功-开始循环修改store表中物品的信息。条件:store_id---数据:avg_price all_count remark 等
            for (let index = 0; index < storeList.length; index++) {
                const storeObj = storeList[index]
                let params = { 'oprice': storeObj.avg_price, 'count': storeObj.all_count, 'remark': storeObj.remark }
                ///这里-用的是循环调用单次修改接口一次修改一个物品，所以会出现多次返回修改结果；后期接口需要升级。支持批量修改
                let result = await api.updateStore({ id: storeObj.store_id, ...params })
                if (result.code === 0) {
                    message.success('入库成功', 3);
                }
            }
        }
    }, [sumCount, sumPrice])

    const handleSubmit = useCallback((e) => {
        props.form.setFieldsValue({ storeList })
        e.preventDefault();
        props.form.validateFields((err, values) => {
            if (!err) {
                let afterFilter = values.storeList.filter((item) => {
                    return item.store_id
                })
                if (afterFilter.length === 0) {
                    message.error('请选择物品')
                    return
                }
                let dontHavePrice = false
                afterFilter.forEach((item) => {
                    if (!item.price) {
                        dontHavePrice = true;
                    }
                })
                if (dontHavePrice) {
                    message.error('请填写物品单价')
                    return
                }
                values.storeList = afterFilter;
                Modal.confirm({
                    title: `确认要提交这些采购信息入库吗？`,
                    content: '请自行确保所选的信息的准确性',
                    okText: '提交',
                    okType: 'danger',
                    onOk: async function () {
                        // console.log('提交: ', values);
                        updateStoreAndrecordHandler(values)
                    },
                })
            }
        });
    }, [props.form, updateStoreAndrecordHandler])

    useEffect(() => {
        listAllStore()
        calculSumCountAndPrice()
    }, [listAllStore, calculSumCountAndPrice])

    return <div style={styles.root}>
        <div style={styles.body}>
            <Alert message={'注意！当同一个物品单价发生浮动时可以修改单价，数据库中就会结合原有数据计算出该物品每件的平均单价，若要区分请在【库存列表】中新建一个物品，数量设置为0'} type='info' showIcon />
            <Form>
                <Form.Item label='采购日期' >
                    {props.form.getFieldDecorator('date', {
                        initialValue: moment(),
                        rules: [{ required: true, message: '请选择采购日期' }]
                    })(<DatePicker allowClear={false} disabledDate={(current) => current > moment().endOf('day')} />)}
                </Form.Item>
            </Form>
            <Form>
                <Form.Item label='单号[选填]' >
                    {props.form.getFieldDecorator('code_num', {
                        rules: [{ required: false }]
                    })(<Input style={{ width: 300 }} />)}
                </Form.Item>
            </Form>
            <Form>
                <Form.Item label='采购人[选填]' >
                    {props.form.getFieldDecorator('buy_user_id', {
                        rules: [{ required: false }]
                    })(<Select allowClear style={{ width: 300 }} placeholder='请选择采购人' showSearch optionFilterProp="children">
                        {userOptionList.map((item, index) => {
                            return <Select.Option value={item.id} key={index} all={item}>{item.name}</Select.Option>
                        })}
                    </Select>)}
                </Form.Item>
            </Form>
            <Form>
                <Form.Item label='记录人' >
                    {props.form.getFieldDecorator('record_user_id', {
                        initialValue: JSON.parse(localStorage.getItem('user') || '{}').id || null,
                        rules: [{ required: true }]
                    })(<Select allowClear style={{ width: 300 }} placeholder='请选择采购人' showSearch optionFilterProp="children">
                        {userOptionList.map((item, index) => {
                            return <Select.Option value={item.id} key={index} all={item}>{item.name}</Select.Option>
                        })}
                    </Select>)}
                </Form.Item>
            </Form>
            <Form>
                <Form.Item label='入库明细' >
                    {props.form.getFieldDecorator('storeList', {
                        rules: [{ required: true, message: '请添加入库明细' }]
                    })(
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -46 }}>
                                <span></span>
                                <div style={{ marginBottom: 10 }}>
                                    <Tag color={'#faad14'}>总数量#: {sumCount}</Tag>
                                    <Tag color={'#fa541c'}>总价格¥: {sumPrice}</Tag>
                                </div>
                            </div>
                            <Table
                                locale={{ emptyText: "请添加物品数据" }}
                                dataSource={storeList}
                                pagination={false}
                                columns={columns}
                                bordered
                                size='small'
                                footer={() => <Button size='small' type='link' icon='plus' onClick={() => {
                                    storeList.push({ key: storeList.length })
                                    // console.log('storeList:', storeList)
                                    props.form.setFieldsValue({ storeList })
                                }}>添加</Button>}
                            />
                        </>
                    )}
                </Form.Item>
            </Form>
            <Form>
                <Form.Item label='备注[选填]' >
                    {props.form.getFieldDecorator('remark', {
                        rules: [{ required: false }]
                    })(<Input.TextArea placeholder="采购单备注[小于100字符]" allowClear autoSize={{ minRows: 3, maxRows: 6 }} maxLength={100}></Input.TextArea>)}
                </Form.Item>
            </Form>
            <Form.Item>
                <Button onClick={handleSubmit}>提交</Button>
            </Form.Item>
        </div>
    </div >
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
        // marginTop: 16
    },
    button: {
        marginLeft: 10
    },
    alertMessage: {
        display: 'flex',
        justifyContent: 'space-between'
    }
}

// const rowProps = {
//     type: 'flex',
//     justify: 'space-around',
//     align: 'middle'
// }

