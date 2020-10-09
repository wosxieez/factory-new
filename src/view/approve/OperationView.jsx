import React, { useCallback, useEffect, useState } from 'react'
import { Modal, Table, Steps, Row, Col, Radio, Input, Divider, Button, Icon, message, Tag, Tooltip, Alert } from 'antd';
import api from '../../http';
import moment from 'moment'
import { xiaomeiParseFloat } from '../../util/Tool';
import { userinfo } from '../../util/Tool';
const FORMAT = 'YYYY-MM-DD HH:mm:ss'
const { Step } = Steps;

export default props => {
    // console.log('props:', props)
    const [record, setRecord] = useState(props.record || {})
    const [workflok, setWorkflok] = useState([])
    const [orderStepLog, setOrderStepLog] = useState([])
    const getOrderData = useCallback(async () => {
        if (!props.record.id) { return }
        let result = await api.query(`select orders.*,order_type.order_name as order_type_name ,tags.name as tag_name,users.name as user_name from orders 
        left join (select * from order_type where isdelete = 0) order_type on orders.type_id = order_type.id
        left join (select * from tags where isdelete = 0) tags on orders.tag_id = tags.id
        left join (select * from users where effective = 1) users on orders.create_user = users.id
        where orders.isdelete = 0 and orders.id = ${props.record.id} `)
        if (result.code === 0) {
            // console.log('getOrderData 结果:', result.data[0][0])
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
    }, [props.record])

    useEffect(() => {
        getOrderData()
    }, [getOrderData])

    return (
        <Modal
            destroyOnClose
            width={1200}
            title='审批处理'
            visible={props.visible}
            onCancel={props.onCancel}
            footer={null}
        >
            {RenderDetail(record, workflok, orderStepLog, getOrderData, props)}
        </Modal>)
}

function RenderDetail(record, workflok, orderStepLog, getOrderData, props) {
    // console.log('RenderDetail')
    const [user] = useState(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : {})
    const [remark, setRemark] = useState('')
    const [status, setStatus] = useState(1)
    // const [stepNumber, setStepNumber] = useState(record.step_number)
    // console.log('1workflok:', workflok)
    // console.log('1orderStepLog:', orderStepLog)
    // console.log('1record:', record)
    // console.log('stepNumber:', stepNumber)
    let alertTitle = null;
    const { type_id, is_special } = record;
    if (type_id === 1) { ///申领
        if (is_special) {
            alertTitle = <Alert style={{ marginBottom: 10 }} message={'特殊时段：在【如非工作时间】下，相关物料会在领料人扫码盒前出示【领料申请单】的二维码后，认定已出库；后期流程补走时，库管确认后不会再次变更物料数量'} type='warning' showIcon />
        } else {
            alertTitle = <Alert style={{ marginBottom: 10 }} message={'正常时段：在【如工作时间】下，相关物料会在库管人员操作确认后，认定已出库'} type='info' showIcon />
        }
    } else if (type_id === 3) {///申购
        alertTitle = <Alert style={{ marginBottom: 10 }} message={'当申购流程库管确认后，不会触发仓库物料变动。一切物料采购入库行为由库管在【采购入库单】模块中进行统一操作，财务也是在【采购单审计】中进行审计'} type='info' showIcon />
    }

    if (!record.content) { return }
    let sum_price = 0;///总价
    let sum_count = 0;///总件数
    JSON.parse(record.content).forEach((item) => {
        sum_price = sum_price + item.count * item.avg_price;
        sum_count = sum_count + item.count;
    })
    let tempList = JSON.parse(record.content);
    tempList.push({ store_name: '总计', count: sum_count, o_price: sum_price, isSum: true })
    let data = tempList.map((item, index) => { item.key = index; return item })
    const columns = [{
        title: '物料', dataIndex: 'store_name',
        render: (text, record) => {
            if (record.isSum) {
                return <Tag color={'#f5222d'}>{text}</Tag>
            }
            return text
        }
    }, {
        title: '数量', dataIndex: 'count',
        render: (text, record) => {
            if (record.isSum) {
                return <Tag color={'red'}>{text}</Tag>
            }
            return text
        }
    }, {
        title: '单价【元】', dataIndex: 'o_price',
        render: (text, record) => {
            if (record.isSum) {
                return <Tag color={'red'}>{xiaomeiParseFloat(text)}</Tag>
            }
            return text
        }
    }]
    return <div>
        {alertTitle}
        <Table
            size={'small'}
            bordered
            columns={columns}
            dataSource={data}
            pagination={false}
        />
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
                            <Radio.Button value={2}>正在处理</Radio.Button>
                        </Radio.Group>
                    </Col>
                </Row>
                <Row style={styles.marginTop}>
                    <Col span={3}>
                        说明:
                    </Col>
                    <Col span={18}>
                        <Input.TextArea rows={4} placeholder='说明缘由' onChange={(e) => { setRemark(e.target.value) }} />
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
                                    // console.log('1workflok:', workflok)
                                    // console.log('record:', record)
                                    // return;
                                    /// step_number +1 用于表示当前写的审批出现在 step 中的位置
                                    let currentWirteStep = record.step_number;
                                    let step_number_next = status === 1 ? currentWirteStep + 1 : currentWirteStep ///如果选择通过 step+1
                                    // return
                                    ///插入order_step_log 表中一条记录
                                    let sql = `insert into order_step_log (order_id,assignee_id,status,remark,createdAt,step_number,step_number_next) values (${record.id},${user.id},${status},'${remark}','${moment().format(FORMAT)}',${currentWirteStep},${step_number_next})`
                                    let result = await api.query(sql)
                                    if (result.code !== 0) { return }
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
                                    } else if (status === 0) {///如果选择了 拒绝 那么 该条申请完成 order 的状态要改成 3 终止
                                        order_status = 4
                                    } else if (status === 2) {///选择了 正在处理
                                        order_status = 1
                                    }
                                    // console.log('step_number_next:', step_number_next)
                                    let sql2 = `update orders set status=${order_status},step_number=${step_number_next} where id = ${record.id}`
                                    // console.log('sql2:', sql2)
                                    // return;
                                    let result2 = await api.query(sql2)
                                    if (result2.code === 0) { message.success('审批成功', 3); getOrderData(); props.refreshTableData() }
                                    // workflok.forEach((item) => {
                                    //     // console.log('item.step_number:', item.step_number, 'record.step_number:', record.step_number, 'item.is_over:', item.is_over, 'status:', status)
                                    //     if (item.step_number === currentWirteStep && item.is_change === 1 && status === 1) {
                                    //         console.log('库管确认---仓库变动')
                                    //         console.log('record:', record)
                                    //         // api.updateStore()
                                    //         updateStoreHandler(record)
                                    //     }
                                    // })
                                    if (record.is_special) { return }///如果 是特殊时段，就不再流程中设计仓库物料变动。要再领料人扫码后直接扣除对应物料的数量
                                    for (let index = 0; index < workflok.length; index++) {
                                        const item = workflok[index];
                                        if (item.step_number === currentWirteStep && item.is_change === 1 && status === 1) {
                                            console.log('库管确认---仓库变动')
                                            console.log('record:', record)
                                            updateStoreHandler(record)
                                        }
                                    }
                                },
                            });
                        }}>提交</Button>
                    </Col>
                </Row>
            </> : null}
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
        ///这里-用的是循环调用单次修改接口一次修改一个物料，所以会出现多次返回修改结果；后期接口需要升级。支持批量修改
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