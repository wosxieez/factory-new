import React, { useState, useCallback, useEffect } from 'react';
import { DatePicker, Table, Button, Form, Input, Select, InputNumber, message, Tag, Modal, Alert, Row, Col, Tooltip } from 'antd';
import moment from 'moment';
import api from '../../http';
import HttpApi from '../../http/HttpApi';
import { autoGetOrderNum, getTaxByOpriceAndTaxPrice, userinfo } from '../../util/Tool';
import SearchInput3 from './SearchInput3';
var storeList = [{ key: 0 }, { key: 1 }, { key: 2 }, { key: 3 }, { key: 4 }, { key: 5 }, { key: 6 }, { key: 7 }, { key: 8 }, { key: 9 }]
const starIcon = <span style={{ color: 'red' }}>* </span>
/**
 * 退料入库单界面
 */
export default Form.create({ name: 'form' })(props => {
    const [tempCodeNum, setTempCodeNum] = useState('')
    // const [storeOptionList, setStoreOptionList] = useState([])
    const [userOptionList, setUserOptionList] = useState([])
    const [sumCount, setSumCount] = useState(0)
    const [sumPrice, setSumPrice] = useState(0)
    const listAllStore = useCallback(async () => {
        // let result = await api.listAllStore()
        // if (result.code === 0) {
        //     ///暂时过滤掉【标签物品】
        //     let list = result.data.filter((item) => item['has_rfid'] !== 1)
        //     setStoreOptionList(list)
        // }
        let result_user = await HttpApi.getUserList()
        result_user = result_user.filter((item) => {
            return item.role_all && (item.role_all.indexOf('1') !== -1 || item.role_all.indexOf('4') !== -1)  ///专工权限_id 1 维修权限_id 4 过滤
        })
        setUserOptionList(result_user)
        let temp_code_num = await autoGetOrderNum({ type: 2 })///临时单号；实际单号要在插入数据库钱的一刻进行刷新
        setTempCodeNum(temp_code_num)
    }, [])
    const columns = [
        { title: '编号', dataIndex: 'key', width: 50, align: 'center', render: (text) => <div>{text + 1}</div> },
        {
            title: <div>{starIcon}物品</div>, dataIndex: 'store_id', width: 400, align: 'center', render: (text, record) => {
                // return <Select
                //     placeholder='选择物品-支持名称搜索' showSearch optionFilterProp="children" value={text}
                //     onChange={(_, option) => { handleSelectChange(option, record.key) }}>
                //     {
                //         storeOptionList.map((item, index) => {
                //             return <Select.Option value={item.id} key={index} all={item} disabled={storeList.map((item) => item.store_id).indexOf(item.id) !== -1}>{item.num + '-' + item.name + '-' + item.model}</Select.Option>
                //         })
                //     }
                // </Select >
                return <SearchInput3
                    storeList={storeList}
                    value={text}
                    onChange={(option) => {
                        handleSelectChange(option, record.key)
                    }}
                />
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
            title: <div>{starIcon}单位</div>, dataIndex: 'unit', width: 60, align: 'center', render: (text) => {
                return <Input disabled value={text} />
            }
        },
        {
            title: <div>{starIcon}含税单价[元]</div>, dataIndex: 'price', width: 80, align: 'center', render: (text, record) => {
                return <InputNumber placeholder='输入价格' value={text} min={0.01} disabled={true}></InputNumber>
            }
        },
        {
            title: <div>{starIcon}含税总价[元]</div>, dataIndex: 'sum_price', width: 80, align: 'center', render: (_, record) => {
                let sum_price = parseFloat((record.count * record.price || 0).toFixed(2))
                return <InputNumber disabled value={sum_price ? sum_price : ''}></InputNumber>
            }
        },
        {
            title: '操作', dataIndex: 'action', width: 100, align: 'center', render: (_, record) => {
                return <Button size='small' type='danger' icon='delete' onClick={() => {
                    let copy = JSON.parse(JSON.stringify(storeList))
                    let afterFilter = copy.filter((item) => item.key !== record.key).map((item, index) => { item.key = index; return item })
                    storeList = afterFilter
                    console.log('删除 afterFilter:', afterFilter)
                    calculSumCountAndPrice()
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
        let param = {
            'key': key,
            'unit': selectObj.unit,
            'price': selectObj.oprice,
            'count': 1,
            'store_id': selectObj.id,
            'store_name': selectObj.name,
            'o_count': selectObj.count,
            'o_price': selectObj.oprice,
            'remark': selectObj.remark,
            'tax_price': selectObj.tax_price,
            'num': selectObj.num,
            'temp_tax': getTaxByOpriceAndTaxPrice(selectObj.oprice, selectObj.tax_price)
        }
        changeTableListHandler(param)
    }, [changeTableListHandler])

    const resetHandler = useCallback(() => {
        props.form.resetFields();
        storeList = [{ key: 0 }, { key: 1 }, { key: 2 }, { key: 3 }, { key: 4 }, { key: 5 }, { key: 6 }, { key: 7 }, { key: 8 }, { key: 9 }]
        props.form.setFieldsValue({ storeList })
        listAllStore()
    }, [props.form, listAllStore])

    /**
     * 更新物品库存信息。同时要给记录表插入一条记录
     */
    const updateStoreAndrecordHandler = useCallback(async (formData) => {
        for (const key in formData) {
            if (formData.hasOwnProperty(key)) {
                const element = formData[key];
                if (!element && element !== 0) {
                    formData[key] = null
                }
            }
        }
        const { date, storeList, remark, return_user_id, record_user_id, abstract_remark } = formData;
        const code = moment().toDate().getTime()
        const new_code_num = await autoGetOrderNum({ type: 2 })
        let sql = `insert into return_record (date,code,code_num,content,return_user_id,record_user_id,remark,sum_count,sum_price,abstract_remark) values ('${date.format('YYYY-MM-DD HH:mm:ss')}','${code}',${new_code_num ? "'" + new_code_num + "'" : null},'${JSON.stringify(storeList)}',${return_user_id},${record_user_id},${remark ? "'" + remark + "'" : null},${sumCount},${sumPrice},${abstract_remark ? "'" + abstract_remark + "'" : null})`
        let result = await api.query(sql)
        if (result.code === 0) { ///记录入库成功-开始循环修改store表中物品的信息。条件:store_id---数据:avg_price all_count remark 等
            for (let index = 0; index < storeList.length; index++) {
                const storeObj = storeList[index]
                let params = { 'oprice': storeObj.avg_price, 'count': storeObj.all_count, 'remark': storeObj.remark }
                ///这里-用的是循环调用单次修改接口一次修改一个物品，所以会出现多次返回修改结果；后期接口需要升级。支持批量修改
                let result = await api.updateStore({ id: storeObj.store_id, ...params })
                if (result.code === 0) {
                    message.success('入库成功', 3);
                    resetHandler()
                }
            }
        }
    }, [sumCount, sumPrice, resetHandler])

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
                    title: `确认要提交这些退料信息入库吗？`,
                    content: '请自行确保所选的信息的准确性',
                    okText: '提交',
                    okType: 'danger',
                    onOk: async function () {
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
    useEffect(() => {
        return () => {
            console.log('销毁 退料入库单')
            resetHandler()
        }
        // eslint-disable-next-line
    }, [])
    const itemProps = { labelCol: { span: 6 }, wrapperCol: { span: 18 } }
    return <div style={styles.root}>
        <div style={styles.body}>
            <h3>退料入库单</h3>
            <Alert message={'注意！当有物品退库时，库管在确认后可以直接填写【退料入库单】；不需要走退料申请流程；暂时不支持【标签物品】的退料操作'} type='warning' showIcon />
            <Form  {...itemProps} style={{ marginTop: 16 }} onSubmit={handleSubmit}>
                <Row>
                    <Col span={6}>
                        <Form.Item label='日期' >
                            {props.form.getFieldDecorator('date', {
                                initialValue: moment(),
                                rules: [{ required: true, message: '请选择退料日期' }]
                            })(<DatePicker style={{ width: '100%' }} allowClear={false} disabledDate={(current) => current > moment().endOf('day')} />)}
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item label='单号' >
                            {props.form.getFieldDecorator('code_num', {
                                initialValue: tempCodeNum,
                                rules: [{ required: true }]
                            })(<Input disabled />)}
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item label='退料人' >
                            {props.form.getFieldDecorator('return_user_id', {
                                rules: [{ required: true, message: '请选择退料人' }]
                            })(<Select allowClear placeholder='请选择退料人' showSearch optionFilterProp="children">
                                {userOptionList.map((item, index) => {
                                    return <Select.Option value={item.id} key={index} all={item}>{item.name}</Select.Option>
                                })}
                            </Select>)}
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item label='记录人' >
                            {props.form.getFieldDecorator('record_user_id', {
                                initialValue: userinfo().id,
                                rules: [{ required: true, message: '请选择记录人' }]
                            })(<Select placeholder='请选择记录人' showSearch optionFilterProp="children">
                                {[userinfo()].map((item, index) => {
                                    return <Select.Option value={item.id} key={index} all={item}>{item.name}</Select.Option>
                                })}
                            </Select>)}
                        </Form.Item>
                    </Col>
                </Row>
                <Row>
                    <Col span={6}>
                        <Form.Item label='摘要' >
                            {props.form.getFieldDecorator('abstract_remark', {
                                rules: [{ required: false, message: '请输入摘要' }]
                            })(<Input placeholder='请输入摘要' />)}
                        </Form.Item>
                    </Col>
                </Row>
                <Row>
                    <Form.Item label='单据明细' labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                        {props.form.getFieldDecorator('storeList', {
                            rules: [{ required: true, message: '请添加入库明细' }]
                        })(
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -46 }}>
                                    <span></span>
                                    <div style={{ marginBottom: 10 }}>
                                        <Tag color={'#faad14'}>总数量#: {sumCount}</Tag>
                                        <Tag color={'#fa541c'}>总含税价格¥: {sumPrice}</Tag>
                                    </div>
                                </div>
                                <Table
                                    style={{ width: '100%' }}
                                    locale={{ emptyText: "请添加物品数据" }}
                                    dataSource={storeList}
                                    pagination={false}
                                    columns={columns}
                                    bordered
                                    size='small'
                                    footer={() => <Button size='small' type='link' icon='plus' onClick={() => {
                                        const addNewCount = 10
                                        let tempEmptyList = []
                                        for (let index = 0; index < addNewCount; index++) {
                                            tempEmptyList.push({ key: storeList.length + index })
                                        }
                                        storeList = storeList.concat(tempEmptyList)
                                        // storeList.push({ key: storeList.length })
                                        props.form.setFieldsValue({ storeList })
                                    }}>添加</Button>}
                                />
                            </>
                        )}
                    </Form.Item>
                </Row>
                <Row>
                    <Form.Item label='备注' labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} >
                        {props.form.getFieldDecorator('remark', {
                            rules: [{ required: false }]
                        })(<Input.TextArea placeholder="退料单备注[小于100字符]" allowClear autoSize={{ minRows: 3, maxRows: 6 }} maxLength={100}></Input.TextArea>)}
                    </Form.Item>
                </Row>
                <Row>
                    <Form.Item wrapperCol={{ span: 24 }}>
                        <div style={{ textAlign: 'right' }}>
                            <Tooltip title={`${!(userinfo().permission && userinfo().permission.split(',').indexOf('5') !== -1) ? '需要库管权限' : ''}`}>
                                <Button type="primary" htmlType="submit"
                                    disabled={!(userinfo().permission && userinfo().permission.split(',').indexOf('5') !== -1)}
                                >提交</Button>
                            </Tooltip>
                        </div>
                    </Form.Item>
                </Row>
            </Form>
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
        padding: '24px 24px 0px 24px',
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

