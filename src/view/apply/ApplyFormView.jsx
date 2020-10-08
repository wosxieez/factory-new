import React, { useState, useCallback, useEffect } from 'react';
import { DatePicker, Table, Button, Form, Input, Select, InputNumber, message, Tag, Modal, Row, Col, Tooltip, Alert } from 'antd';
import moment from 'moment';
import api from '../../http';
import { userinfo } from '../../util/Tool';
import HttpApi from '../../http/HttpApi';
import { checkCurrentTimeIsSpecial } from '../../util/Tool';

const FORMAT = 'YYYY-MM-DD HH:mm:ss'
var storeList = [{ key: 0 }]
const starIcon = <span style={{ color: 'red' }}>* </span>
/**
 * 申请单界面
 */
export default Form.create({ name: 'form' })(props => {
    // console.log('AppData.userinfo:', userinfo())
    const [storeOptionList, setStoreOptionList] = useState([])
    const [orderTypeList, setOrderTypeList] = useState([])
    const [marjorList, setMajorList] = useState([])
    const [selectOrderType, setSelectOrderType] = useState(1)
    const [sumCount, setSumCount] = useState(0)
    const [sumPrice, setSumPrice] = useState(0)
    const listAllStore = useCallback(async () => {
        let major_list = await HttpApi.getCurrentUserMajor()
        // console.log('major_list:', major_list)
        setMajorList(major_list)
        let response_store = await api.listAllStore()
        ///查询现有的 那些处于待审核 和 审核中的 申请。得到对应的物品的id 和 count -- 对现有的store 数据进行相减
        const response_order = await api.query(
            `select * from orders where isdelete = 0 and status in (0,1) and type_id = 1 and is_special != 2` ///考虑到 那些还没有出库的特殊领料申请
        )
        if (response_order.code === 0 && response_order.data[0].length > 0) {
            let orderList = response_order.data[0]
            // console.log('申请列表数据:', orderList)
            orderList.forEach(order => {
                let contentList = JSON.parse(order.content)
                // console.log('contentList:', contentList)
                contentList.forEach(item => {
                    response_store.data.forEach(store => {
                        if (item.store_id === store.id) {
                            store.count = store.count - item.count
                        }
                    })
                })
            })
        }
        // console.log('response_store:', response_store.data)
        setStoreOptionList(response_store.data)

        let sql = `select * from order_type where isdelete = 0`
        let result2 = await api.query(sql)
        if (result2.code === 0) {
            setOrderTypeList(result2.data[0])
        }
    }, [])
    const columns = [
        { title: '编号', dataIndex: 'key', width: 50, align: 'center', render: (text) => <div>{text + 1}</div> },
        {
            title: <div>{starIcon}物品</div>, dataIndex: 'store_id', width: 220, align: 'center', render: (text, record) => {
                return <Select placeholder='选择物品-支持名称搜索' showSearch optionFilterProp="children" value={text} onChange={(_, option) => { handleSelectChange(option, record.key) }}>
                    {
                        storeOptionList.map((item, index) => {
                            return <Select.Option value={item.id} key={index} all={item} disabled={(storeList.map((item) => item.store_id).indexOf(item.id) !== -1) || (selectOrderType === 1 && item.count === 0)}>
                                {selectOrderType === 1 ? item.name + '--剩余' + item.count : item.name}
                            </Select.Option>
                        })
                    }
                </Select >
            }
        },
        {
            title: <div>{starIcon}数量</div>, dataIndex: 'count', width: 80, align: 'center', render: (text, record) => {
                return <InputNumber placeholder='输入数量' precision={0} value={text} min={1} max={selectOrderType === 1 ? record.max_count : 99999999} disabled={!record.store_id} onChange={(v) => {
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
                return <InputNumber placeholder='输入价格' value={text} disabled></InputNumber>
            }
        },
        {
            title: <div>{starIcon}总价[元]</div>, dataIndex: 'sum_price', width: 130, align: 'center', render: (_, record) => {
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
        let param = { 'key': key, 'unit': selectObj.unit, 'price': selectObj.oprice, 'count': 1, 'store_id': selectObj.id, 'store_name': selectObj.name, 'o_count': selectObj.count, 'o_price': selectObj.oprice, 'remark': selectObj.remark, 'max_count': selectObj.count }
        changeTableListHandler(param)
    }, [changeTableListHandler])

    const resetHandler = useCallback(() => {
        props.form.resetFields()
        storeList = [{ key: 0 }]
        props.form.setFieldsValue({ storeList })
        listAllStore()
    }, [props.form, listAllStore])

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
                        let is_special = 0
                        let is_special_result = await checkCurrentTimeIsSpecial()
                        if (is_special_result && values.type_id === 1) { ///在工作时段表之外的 物料申领
                            is_special = 1
                        }
                        // console.log('asdasdasd')
                        let tempCodeHeader = ''
                        if (values.type_id === 1) {
                            tempCodeHeader = 'SL'
                        } else if (values.type_id === 2) {
                            tempCodeHeader = 'ST'
                        } else {
                            tempCodeHeader = 'SG'
                        }
                        let tempRemark = null;
                        if (values.remark) {
                            tempRemark = "'" + values.remark + "'"
                        }
                        let sql = `insert into orders (create_user,tag_id,type_id,content,remark,code,createdAt,is_special) values (${values.apply_user_id},${values.major_id},${values.type_id},'${JSON.stringify(values.storeList)}',${tempRemark},'${tempCodeHeader + moment().toDate().getTime()}','${moment().format(FORMAT)}',${is_special})`
                        // console.log('sql:', sql)
                        let result = await api.query(sql)
                        if (result.code === 0) {
                            message.success('提交成功，等待审批')
                            resetHandler()
                        }
                        // console.log('result:', result)
                    },
                })
            }
        });
    }, [props.form, resetHandler])

    useEffect(() => {
        listAllStore()
        calculSumCountAndPrice()
    }, [listAllStore, calculSumCountAndPrice])
    const itemProps = { labelCol: { span: 6 }, wrapperCol: { span: 18 } }
    return <div style={styles.root}>
        <div style={styles.body}>
            <h3>申领、申购单</h3>
            <Alert message={'注意！当有需要【申领物料】和【申购物料】时，请填写相关申请，完成流程'} type='info' showIcon />
            <Form  {...itemProps} style={{ marginTop: 16 }} onSubmit={handleSubmit}>
                <Row>
                    <Col span={6}>
                        <Form.Item label='日期' >
                            {props.form.getFieldDecorator('date', {
                                initialValue: moment(),
                                rules: [{ required: true, message: '请选择日期' }]
                            })(<DatePicker style={{ width: '100%' }} allowClear={false} disabledDate={(current) => current > moment().endOf('day')} />)}
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item label='申请类型' >
                            {props.form.getFieldDecorator('type_id', {
                                initialValue: 1,
                                rules: [{ required: true, message: '请选择申请类型' }]
                            })(<Select placeholder='请选择申请类型' showSearch optionFilterProp="children" onChange={(v) => {
                                setSelectOrderType(v)
                                // storeList = [{ key: 0 }]
                                // props.form.setFieldsValue({ storeList })
                                resetHandler()
                                calculSumCountAndPrice()
                            }}>
                                {orderTypeList.map((item, index) => {
                                    return <Select.Option value={item.id} key={index} all={item}>{item.order_name}</Select.Option>
                                })}
                            </Select>)}
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item label='申请人' >
                            {props.form.getFieldDecorator('apply_user_id', {
                                initialValue: userinfo().id,
                                rules: [{ required: true, message: '请选择申请人' }]
                            })(
                                <Select disabled>
                                    {[userinfo()].map((item, index) => {
                                        return <Select.Option value={item.id} key={index}>{item.name}</Select.Option>
                                    })}
                                </Select>
                            )}
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item label='专业' >
                            {props.form.getFieldDecorator('major_id', {
                                initialValue: marjorList[0] ? marjorList[0].mj_id : null,
                                rules: [{ required: true, message: '请选择专业' }]
                            })(
                                <Select placeholder='请选择专业' showSearch optionFilterProp="children">
                                    {marjorList.map((item, index) => {
                                        return <Select.Option value={item.mj_id} key={index} all={item}>{item.major_name}</Select.Option>
                                    })}
                                </Select>
                            )}
                        </Form.Item>
                    </Col>
                </Row>
                <Row>
                    <Form.Item label='物品明细' labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                        {props.form.getFieldDecorator('storeList', {
                            rules: [{ required: true, message: '请添加物品明细' }]
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
                                    style={{ width: '100%' }}
                                    locale={{ emptyText: "请添加物品数据" }}
                                    dataSource={storeList}
                                    pagination={false}
                                    columns={columns}
                                    bordered
                                    size='small'
                                    footer={() => <Button size='small' type='link' icon='plus' onClick={() => {
                                        storeList.push({ key: storeList.length })
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
                        })(<Input.TextArea placeholder="备注[小于100字符]" allowClear autoSize={{ minRows: 3, maxRows: 6 }} maxLength={100}></Input.TextArea>)}
                    </Form.Item>
                </Row>
                <Row>
                    {/* <Form.Item wrapperCol={{ span: 24 }}>
                        <div style={{ textAlign: 'right' }}><Button type="primary" htmlType="submit">提交</Button></div>
                    </Form.Item> */}
                    <Form.Item wrapperCol={{ span: 24 }}>
                        <div style={{ textAlign: 'right' }}>
                            <Tooltip title={`${!(userinfo().permission && (userinfo().permission.indexOf('0') !== -1 || userinfo().permission.indexOf('3') !== -1) && userinfo().major_id_all) ? '需要维修或专工权限和所属专业' : ''}`}>
                                <Button type="primary" htmlType="submit"
                                    disabled={!(userinfo().permission && (userinfo().permission.indexOf('0') !== -1 || userinfo().permission.indexOf('3') !== -1) && userinfo().major_id_all)}
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

