import React, { useCallback, useEffect, useState } from 'react'
import { Modal, Table, Steps, Row, Col, Radio, Input, Divider, Button, Icon, message, Tag, Tooltip, Alert, Descriptions, Select } from 'antd';
import api from '../../http';
import moment from 'moment'
// import { xiaomeiParseFloat } from '../../util/Tool';
import { userinfo } from '../../util/Tool';
import '../../css/styles.css'
import HttpApi from '../../http/HttpApi';
const FORMAT = 'YYYY-MM-DD HH:mm:ss'
const { Step } = Steps;

export default props => {
    // console.log('props:', props)
    const [record, setRecord] = useState(props.record || {})
    const [workflok, setWorkflok] = useState([])
    const [orderStepLog, setOrderStepLog] = useState([])
    const [rfidList, setRfidList] = useState([])

    const getOrderData = useCallback(async () => {
        if (!props.record.id) { return }
        let result = await api.query(`select orders.*,order_type.order_name as order_type_name,tags.name as tag_name,users.name as user_name,faces.gid,faces.sid,faces.did,faces.uid,faces.fid from orders 
        left join (select * from order_type where isdelete = 0) order_type on orders.type_id = order_type.id
        left join (select * from tags where isdelete = 0) tags on orders.tag_id = tags.id
        left join (select * from users where effective = 1) users on orders.create_user = users.id
        left join faces on faces.id = orders.capture_id
        where orders.isdelete = 0 and orders.id = ${props.record.id} `)
        if (result.code === 0) {
            // console.log('getOrderData 结果:', result.data[0][0])
            let content_list = JSON.parse(result.data[0][0].content)
            let response_store = await api.findStore(content_list.map((item) => item.store_id))
            if (response_store.code === 0) {
                content_list.forEach((item) => {
                    response_store.data.forEach((ele) => {
                        if (item.store_id === ele.id) {
                            item.tags = ele.tags
                        }
                    })
                })
            }
            result.data[0][0].content = JSON.stringify(content_list)
            setRecord(result.data[0][0]);
        }
        let result2 = await api.query(`select order_step_log.*,users.name as user_name from order_step_log 
        left join (select * from users where effective = 1) users on order_step_log.assignee_id = users.id
        where order_id = ${props.record.id} `)
        if (result2.code === 0) {
            // console.log('getorderSteplog 结果:', result2.data[0])
            setOrderStepLog(result2.data[0])
        }
        let result3 = await api.query(`select * from order_workflok where order_type_id = ${props.record.type_id} and isdelete = 0 order by step_number`)
        if (result3.code === 0) {
            // console.log('getworkFlok 结果:', result3.data[0])
            setWorkflok(result3.data[0])
        }
    }, [props.record])/// record 变化触发
    const getRFIDList = useCallback(async () => {
        if (!props.visible) { return }
        if (props.record && props.record.content) {
            try {
                let has_rfid_store_id_list = [];
                JSON.parse(props.record.content).forEach((storeItem) => {
                    if (storeItem['has_rfid']) { has_rfid_store_id_list.push(storeItem['store_id']) }
                })
                let res_list = await HttpApi.getRfidList({ storeIdList: has_rfid_store_id_list })
                setRfidList(res_list)
            } catch (error) {
                console.log('错误4:', error)
            }
        }
    }, [props.visible, props.record])
    useEffect(() => {
        getOrderData()
        getRFIDList()
    }, [getOrderData, getRFIDList])

    return (
        <Modal
            maskClosable={false}
            destroyOnClose={true}
            width={1200}
            title={`审批处理【${props.record.code}】`}
            visible={props.visible}
            onCancel={async () => {
                props.onCancel()
                await HttpApi.updateOrderSearchList(record.code)
            }}
            footer={null}
        >
            {RenderDetail({ record, workflok, orderStepLog, getOrderData, rfidList, props })}
        </Modal>)
}
/**
 * record  当前记录
 * workflok   工作流
 * orderStepLog  步骤日志
 * getOrderData  函数
 * rfidList 当前记录对应的store的标签数据
 * props
 * @param {*} param0 
 */
function RenderDetail({ record, workflok, orderStepLog, getOrderData, rfidList, props }) {
    // console.log('RenderDetail:', props.visible)
    const [user] = useState(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : {})
    const [remark, setRemark] = useState('')
    const [status, setStatus] = useState(1)
    const [hasRFID, setHasRFID] = useState(false)
    const [selectRfidList, setSelectRfidlist] = useState([])
    const [selectStatusIsOk, setSelectStatusIsOk] = useState(false)
    const [alertMessage, setAlertMessage] = useState('')
    const renderImg = useCallback(() => {
        if (!record.gid || !record.sid || !record.did || !record.uid || !record.fid) {
            return '-'
        }
        const imgUrl = 'https://xiaomei-face.oss-cn-hangzhou.aliyuncs.com/' + record.gid + '/' + record.sid + '/' + record.did + '/' + record.uid + '/' + record.fid + '.png'
        return <img style={{ width: 50, height: 50 }} src={imgUrl} alt='' />
    }, [record])
    const checkSelectRfidList = useCallback(() => {
        let need_rfid_list = [];///判断哪些物品，分别需要几个rfid
        let need_rfid_count_all = 0;///总共需要多少个 标签
        if (record && record.content) {
            try {
                let contentlist = JSON.parse(record.content);
                contentlist.forEach((item) => {
                    if (item['has_rfid']) {
                        need_rfid_count_all = need_rfid_count_all + item['count']
                        need_rfid_list.push({ store_id: item['store_id'], need_rfid_count: item['count'] })
                    }
                })
                if (selectRfidList.length === need_rfid_count_all) {
                    let afterTransList = selectRfidList.map((rfid_id) => {
                        return rfidList.filter((rfidItem) => rfidItem['id'] === rfid_id)[0]
                    })
                    // console.log('选择的是:', afterTransList)
                    need_rfid_list.forEach((need_item) => {
                        afterTransList.forEach((rfid_item) => {
                            if (need_item['store_id'] === rfid_item['store_id']) {
                                need_item['need_rfid_count'] = need_item['need_rfid_count'] - 1;
                            }
                        })
                    })
                    console.log('need_rfid_list:', need_rfid_list)
                    need_rfid_list.forEach((need_item) => {
                        if (need_item['need_rfid_count'] !== 0) {
                            console.log('数量对了，种类不对:')
                            setSelectStatusIsOk(false)
                            setAlertMessage('物品种类不匹配')
                        }
                    })
                    console.log('匹配')
                    setSelectStatusIsOk(true)
                    setAlertMessage('匹配')
                } else {
                    ///数量不对，直接说明不符合
                    console.log('数量不对，直接说明不符合:')
                    setSelectStatusIsOk(false)
                    setAlertMessage('标签数量不匹配')
                }
            } catch (error) {
                console.log('错误1:', error)
            }
        }
    }, [selectRfidList, record, rfidList])
    const checkIsHasRFID = useCallback(() => {
        if (record && record.content) {
            try {
                let contentlist = JSON.parse(record.content);
                setHasRFID(false)
                contentlist.forEach((item) => {
                    if (item['has_rfid']) {
                        setHasRFID(true)
                    }
                })
            } catch (error) {
                console.log('错误2:', error)
            }
        }
    }, [record])
    useEffect(() => {
        checkSelectRfidList()
        checkIsHasRFID()
    }, [checkSelectRfidList, checkIsHasRFID])
    let alertTitle = null;
    const { type_id, is_special } = record;
    if (type_id === 1) { ///申领
        if (is_special) {
            alertTitle = <Alert style={{ marginBottom: 10 }} message={'特殊时段：相关物品会在领料人扫码盒前出示【领料申请单】的二维码后，认定已出库；后期流程补走时，库管确认后不会再次变更物品数量'} type='warning' showIcon />
        } else {
            alertTitle = <Alert style={{ marginBottom: 10 }} message={'正常时段：相关物品会在库管人员操作确认后，认定已出库'} type='info' showIcon />
        }
    } else if (type_id === 3) {///申购
        alertTitle = <Alert style={{ marginBottom: 10 }} message={'当申购流程库管确认后，不会触发仓库物品变动。一切物品采购入库行为由库管在【采购入库单】模块中进行统一操作，财务也是在【采购单审计】中进行审计'} type='info' showIcon />
    }

    if (!record.content) { return }
    let sum_price = 0;///总价
    let sum_count = 0;///总件数
    JSON.parse(record.content).forEach((item) => {
        sum_price = sum_price + item.count * item.price;
        sum_count = sum_count + item.count;
    })
    let tempList = JSON.parse(record.content);
    tempList.push({ store_name: '总计', count: sum_count, price: sum_price, isSum: true })
    let data = tempList.map((item, index) => { item.key = index; return item })
    const columns = [{
        title: '物品', dataIndex: 'store_name',
        render: (text, record) => {
            if (record.isSum) {
                return <Tag color={'#f5222d'}>{text}</Tag>
            }
            let result = null;
            if (record['has_rfid']) { result = <div><Icon type="barcode" style={{ marginRight: 5 }} />{text}</div> }
            else { result = text }
            return result;
        }
    }, {
        title: '数量', dataIndex: 'count',
        render: (text, record) => {
            if (record.isSum) {
                return <Tag color={'red'}>{text}</Tag>
            }
            return text
        }
    },
    // {
    //     title: '单价【元】', dataIndex: 'price',
    //     render: (text, record) => {
    //         if (record.isSum) {
    //             return <Tag color={'red'}>{xiaomeiParseFloat(text)}</Tag>
    //         }
    //         return text
    //     }
    // },
    {
        title: '属性', dataIndex: 'tags',
        render: (text, record) => {
            return text ? text.map((item, index) => {
                return <Tag key={index} color={item.color}>{item.name}</Tag>
            }) : null
        }
    }]

    return <div>
        {alertTitle}
        <Row gutter={16}>
            <Col span={18}>
                <Table
                    size={'small'}
                    rowClassName={(record, index) => {
                        if (index < data.length - 1) {
                            if (index % 2 !== 0) {
                                return 'row'
                            }
                            else { return '' }
                        } else {
                            return 'lastrow'
                        }
                    }}
                    bordered
                    columns={columns}
                    dataSource={data}
                    pagination={false}
                />
            </Col>
            <Col span={6}>
                <Descriptions bordered size="large" column={1} >
                    <Descriptions.Item label={<div >{'抓拍照片'}</div>}>{
                        renderImg()
                    }</Descriptions.Item>
                </Descriptions>
            </Col>
        </Row>
        <h3 style={styles.marginTop}>当前进度</h3>
        <Steps style={styles.marginTop}
            current={record.step_number}
        // current={record.status === 0 ? record.step_number + 1 : record.step_number}
        >
            <Step key='0' title="提交申请" description={<div>
                <Tag color='green'>已申请</Tag>
                <Tag color={'#faad14'}>{record.user_name}</Tag>
                <div style={{ fontSize: 10, color: '#1890ff' }}>{moment(record.createdAt).format(FORMAT)}</div>
                <Tooltip placement="topLeft" title={record.remark}>
                    <div style={{ fontSize: 12 }}>{record.remark}</div>
                </Tooltip>
            </div>} />
            {renderApproveSteps(record, workflok, orderStepLog)}
            <Step key='10' title="完毕" />
        </Steps>
        {record.status < 3 && shouldRenderCurrentPanel(record, workflok) ?
            <>
                <Divider />
                <h3>{getCurrentStepName(record, workflok)}操作</h3>
                <Row style={styles.marginTop} >
                    <Col span={3}>
                        审批:
                    </Col>
                    <Col span={18}>
                        <Radio.Group value={status} buttonStyle="solid" onChange={(e) => { setStatus(e.target.value) }}>
                            <Radio.Button value={1}>通过</Radio.Button>
                            <Radio.Button disabled={record.status === 2 || record.is_special !== 0} value={0}>拒绝</Radio.Button>
                            <Radio.Button disabled={record.status === 2 || record.is_special !== 0} value={2}>正在处理</Radio.Button>
                        </Radio.Group>
                    </Col>
                </Row>
                {record.step_number === 2 && record.type_id === 1 && hasRFID ? <div>
                    <Row style={styles.marginTop}>
                        <Col span={3}></Col>
                        <Col span={18}>
                            <Alert type={selectStatusIsOk ? 'success' : 'error'} showIcon message={alertMessage} />
                        </Col>
                    </Row>
                    <Row style={styles.marginTop}>
                        <Col span={3}>标签选择: </Col>
                        <Col span={18}>
                            <Select
                                showSearch
                                optionFilterProp="children"
                                mode="multiple"
                                style={{ width: '100%' }}
                                placeholder="请选择匹配的物品标签；利用PDA扫描获取物品标签名后，手动在此处选择对应标签。请自行保证选择的准确性"
                                value={selectRfidList}
                                onChange={(v) => {
                                    setSelectRfidlist(v)
                                }}
                            >
                                {rfidList.map((item, index) => {
                                    return <Select.Option key={index} value={item.id}>{item.name}</Select.Option>
                                })}
                            </Select>
                        </Col>
                    </Row>
                </div> : null}
                <Row style={styles.marginTop}>
                    <Col span={3}>
                        备注:
                    </Col>
                    <Col span={18}>
                        <Input.TextArea rows={4} placeholder='备注选填' onChange={(e) => { setRemark(e.target.value) }} />
                    </Col>
                </Row>
                <Row style={styles.marginTop}>
                    <Col span={21}>
                        <Button type="primary" style={styles.left} onClick={() => {
                            Modal.confirm({
                                title: '确定提交吗?',
                                icon: <Icon type="info-circle" />,
                                content: '请自行确保提交信息的准确性--审批操作不可撤销',
                                onOk: async () => {
                                    console.log('1workflok:', workflok)
                                    console.log('record:', record)
                                    // let rfid_situation=false;///是否为
                                    // return;
                                    /// step_number +1 用于表示当前写的审批出现在 step 中的位置
                                    let currentWirteStep = record.step_number;
                                    let step_number_next = status === 1 ? currentWirteStep + 1 : currentWirteStep ///如果选择通过 step+1
                                    // return
                                    ////移动至下方
                                    // ///插入order_step_log 表中一条记录
                                    // let sql = `insert into order_step_log (order_id,assignee_id,status,remark,createdAt,step_number,step_number_next) values (${record.id},${user.id},${status},'${remark}','${moment().format(FORMAT)}',${currentWirteStep},${step_number_next})`
                                    // let result = await api.query(sql)
                                    // if (result.code !== 0) { return }
                                    ////移动至下方
                                    let order_status;
                                    if (status === 1 && step_number_next > workflok.length) {///如果下一步大于 该类表的审核流程数量 那么就说明流程全部走完 该条申请完成 order 的状态要改成 3 完成
                                        order_status = 3
                                    } else if (status === 1 && step_number_next <= workflok.length) {///如果下一步小于等于 该类表的审核流程数量 那么就说明还在审批流程中 该条申请完成 order 的状态要改成 1 审核过程中
                                        order_status = 1
                                        ///还要判断是不是出库的审批
                                        workflok.forEach((item) => {
                                            if (item.step_number === currentWirteStep && item.is_change === 1 && status === 1) {
                                                order_status = 2
                                            }
                                        })
                                    } else if (status === 0) {///如果选择了 拒绝 那么 该条申请完成 order 的状态要改成 4 终止
                                        order_status = 4
                                    } else if (status === 2) {///选择了 正在处理
                                        order_status = 1
                                    }
                                    if (status === 1 && order_status === 2 && !selectStatusIsOk) {
                                        message.error('请先选择好物品对应的标签')
                                        return;
                                    }
                                    console.log('selectRfidList:', selectRfidList)
                                    console.log('selectStatusIsOk:', selectStatusIsOk)
                                    // return;
                                    // console.log('step_number_next:', step_number_next)
                                    ////来自上方
                                    ///插入order_step_log 表中一条记录
                                    let sql = `insert into order_step_log (order_id,assignee_id,status,remark,createdAt,step_number,step_number_next) values (${record.id},${user.id},${status},'${remark}','${moment().format(FORMAT)}',${currentWirteStep},${step_number_next})`
                                    let result = await api.query(sql)
                                    if (result.code !== 0) { return }
                                    let sql2 = `update orders set status=${order_status},step_number=${step_number_next} where id = ${record.id}`
                                    ////来自上方
                                    // return;
                                    let result2 = await api.query(sql2)
                                    if (result2.code === 0) { message.success('审批成功', 3); getOrderData(); props.refreshTableData() }
                                    if (record.is_special) { return }///如果 是特殊时段，就不再流程中设计仓库物品变动。要再领料人扫码后直接扣除对应物品的数量
                                    for (let index = 0; index < workflok.length; index++) {
                                        const item = workflok[index];
                                        if (item.step_number === currentWirteStep && item.is_change === 1 && status === 1) {
                                            console.log('库管确认---仓库变动')
                                            console.log('record:', record)
                                            updateStoreHandler(record)
                                        }
                                    }
                                    /// 移除 标签 is_out = 1
                                    if (selectRfidList.length > 0) {
                                        await HttpApi.rfidIsOut({ rfid_id_list: selectRfidList, out_time: moment().format(FORMAT) })
                                    }
                                },
                            });
                        }}>提交</Button>
                    </Col>
                </Row>
            </> : null
        }
    </div >
}
function renderApproveSteps(record, workflok, orderStepLog) {
    // console.log('哈哈哈 orderStepLog:', orderStepLog)
    workflok.forEach((item) => {
        item.stepLog = [];
        orderStepLog.forEach((element) => {
            if (item.step_number === element.step_number) { item.stepLog.push(element) } ///每一步中理论上只会有一个记录
        })
    })
    // console.log('哈哈哈 workflok:', workflok)
    return workflok.map((item, index) => {
        return <Step key={index + 1} title={item.name}
            description={item.stepLog && item.stepLog.length > 0 ? item.stepLog.map((element, index) => <div key={index}>
                {element.status === 1 ? <Tag color='green'>已通过</Tag> : (element.status === 0 ? <Tag color='red'>已拒绝</Tag> : <Tag color='blue'>正在处理</Tag>)}
                <Tag color={'#faad14'}>{element.user_name || '-'}</Tag>
                <div style={{ fontSize: 10, color: '#1890ff' }}>{moment(element.createdAt).format(FORMAT)}</div>
                <div>{element.remark}</div>
            </div>) : null}
        />
    })
}
function shouldRenderCurrentPanel(record, workflok) {
    const hasPermission = userinfo().permission;
    let flag = false
    workflok.forEach((item) => {
        if (item.step_number === record.step_number && hasPermission.indexOf(String(item.assginee_id)) !== -1) {
            flag = true
        }
    })
    return flag
}
function getCurrentStepName(record, workflok) {
    let result = ''
    workflok.forEach((item) => {
        if (item.step_number === record.step_number) {
            result = item.name
        }
    })
    return result
}
export async function updateStoreHandler(record) {
    let sql3 = `update orders set in_out_time='${moment().format(FORMAT)}' where id = ${record.id}`
    await api.query(sql3)
    let tempList = [];
    let contentList = JSON.parse(record.content)
    contentList.forEach((element) => {
        tempList.push({ store_id: element.store_id, count: element.count }) ///cut 在数据库中 count 字段值 要减少多少
    })
    console.log('目标:', tempList)
    for (let index = 0; index < tempList.length; index++) {
        const element = tempList[index];
        if (record.type_id === 1) {
            element.count = - element.count
        }
        ///这里-用的是循环调用单次修改接口一次修改一个物品，所以会出现多次返回修改结果；后期接口需要升级。支持批量修改
        let result = await api.updateStoreCount({ id: element.store_id, count: element.count })
        if (result.code === 0) {
            message.success(record.type_id === 1 ? '出库成功' : '入库成功', 3);
        }
        console.log('库品数量修改结果：', result)
    }
    console.log('出库完毕')
    return true
}
const styles = {
    marginTop: {
        marginTop: 16
    },
    left: {
        float: 'right'
    }
}