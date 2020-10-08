import React, { useState, useCallback, useEffect, useContext } from 'react'
import { Descriptions, Icon, Tag } from 'antd';
import { userinfo, userPermissions } from '../../util/Tool';
import api from '../../http';
import { AppDataContext } from '../../redux/AppRedux';
export default _ => {
    const { appState } = useContext(AppDataContext)
    const [flok, setFolk] = useState([])
    const getFlok = useCallback(async () => {
        let sql = `select order_type.order_name,order_workflok.* from order_type 
        left join (
        select order_workflok.order_type_id as type_id, group_concat(order_workflok.name) as step_list from
        (select * from order_workflok where isdelete = 0 order by order_type_id,step_number) order_workflok
        group by order_type_id) order_workflok on order_workflok.type_id = order_type.id
        where order_type.isdelete = 0`
        let result = await api.query(sql)
        if (result.code === 0) {
            setFolk(result.data[0])
        }
    }, [])
    useEffect(() => {
        getFlok()
    }, [getFlok])
    return <div style={styles.root}>
        <div style={styles.body}>
            <Descriptions title="个人信息" bordered size='small' column={2}>
                <Descriptions.Item label="姓名">{userinfo().name}</Descriptions.Item>
                <Descriptions.Item label="账号">{userinfo().username}</Descriptions.Item>
                <Descriptions.Item label="部门">{userinfo().level_name}</Descriptions.Item>
                <Descriptions.Item label="专业">{userinfo().major_name_all}</Descriptions.Item>
                <Descriptions.Item label="权限">{userPermissions().length > 0 ? userPermissions().map((item, index) => <Tag key={index} color='blue'>{item}</Tag>) : '-'}</Descriptions.Item>
                <Descriptions.Item label="管理">{userinfo().isadmin ? <Icon type="check-circle" theme="twoTone" /> : '-'}</Descriptions.Item>
                <Descriptions.Item label="备注">{userinfo().remark || '-'}</Descriptions.Item>
                <Descriptions.Item label="版本">{<Tag color='blue'>{appState.version}</Tag>}</Descriptions.Item>
            </Descriptions>
        </div>
        <div style={styles.body}>
            <Descriptions title="权限信息" bordered size='small' column={2}>
                <Descriptions.Item label="维修权限">可发起申请</Descriptions.Item>
                <Descriptions.Item label="专工权限">可发起申请，参与【申领】审批流程</Descriptions.Item>
                <Descriptions.Item label="采购权限">参与【申购】流程中的处理流程；将该条申请标记成采购中状态</Descriptions.Item>
                <Descriptions.Item label="库管权限">参与【申领】【申购】审批流程，管理物品【添加、删除、采购录入等】</Descriptions.Item>
                <Descriptions.Item label="财务权限">参与【申购】审批流程，参与【采购】【申领】的最后审计</Descriptions.Item>
            </Descriptions>
        </div>
        <div style={styles.body}>
            <Descriptions title="流程信息" bordered size='small' column={1}>
                {flok.map((item, index) => {
                    return <Descriptions.Item key={index + 1} label={item.order_name + '流程'}>
                        <Tag color={'blue'}>提交申请</Tag><span style={{ color: '#1890ff' }}>-></span>
                        {item.step_list.split(',').join(' -> ').split(' ').map((ele, index2) => {
                            if (ele === '->') {
                                return <span style={{ color: '#1890ff' }} key={index2}>{ele}</span>
                            } else {
                                return <Tag style={{ marginLeft: 10 }} key={index2} color={'blue'}>{ele}</Tag>
                            }
                        })}
                    </Descriptions.Item>
                })}
            </Descriptions>
        </div>
        <div style={styles.body}>
            <Descriptions title="特别说明" bordered size='small' column={1}>
                <Descriptions.Item label="申购">对某些物料发起采购申请后，库管在人工汇总确认后，结合实际情况进行统一的采购行为，后期再通过【采购入库单】进行物料数据统一的录入</Descriptions.Item>
                <Descriptions.Item label="采购入库单">考虑到实际采购情况，会与【申购】的物料数据有所出入，故独立出采购入库的入口，库管自行填写</Descriptions.Item>
            </Descriptions>
        </div>
        <div style={styles.body}>
            <Descriptions title="时段信息" bordered size='small' column={1}>
                <Descriptions.Item label="正常">申领、申购单走人工审核流程。其中【申领】在库管确认操作后，才会判定物料出库</Descriptions.Item>
                <Descriptions.Item label="特殊">特殊时段下的【申领】在扫码后自动判定物料出库，后续人工审批流程不再影响物料数量</Descriptions.Item>
            </Descriptions>
        </div>
    </div>
}

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
        marginBottom: 16,
    },
    button: {
        marginLeft: 10
    },
    alertMessage: {
        display: 'flex',
        justifyContent: 'space-between'
    }
}