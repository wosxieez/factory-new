import React, { useState, useCallback, useEffect } from 'react'
import { Descriptions, Icon, Tag } from 'antd';
import AppData from '../../util/AppData';
import api from '../../http';
export default _ => {
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
                <Descriptions.Item label="姓名">{AppData.userinfo().name}</Descriptions.Item>
                <Descriptions.Item label="账号">{AppData.userinfo().username}</Descriptions.Item>
                <Descriptions.Item label="部门">{AppData.userinfo().level_name}</Descriptions.Item>
                <Descriptions.Item label="专业">{AppData.userinfo().major_name_all}</Descriptions.Item>
                <Descriptions.Item label="权限">{AppData.userPermissions().length > 0 ? AppData.userPermissions().map((item, index) => <Tag key={index} color='blue'>{item}</Tag>) : '-'}</Descriptions.Item>
                <Descriptions.Item label="管理">{AppData.userinfo().isadmin ? <Icon type="check-circle" theme="twoTone" twoToneColor="#52c41a" /> : '-'}</Descriptions.Item>
                <Descriptions.Item label="备注">{AppData.userinfo().remark || '-'}</Descriptions.Item>
                <Descriptions.Item label="版本">{<Tag color='blue'>{AppData.version}</Tag>}</Descriptions.Item>
            </Descriptions>
        </div>
        <div style={styles.body}>
            <Descriptions title="权限信息" bordered size='small' column={2}>
                <Descriptions.Item label="维修权限">可发起申请</Descriptions.Item>
                <Descriptions.Item label="专工权限">可发起申请，参与【领料】审批流程</Descriptions.Item>
                <Descriptions.Item label="采购权限">参与【采购】处理流程</Descriptions.Item>
                <Descriptions.Item label="库管权限">参与【领料】【采购】审批流程，管理物品数量，采购录入</Descriptions.Item>
                <Descriptions.Item label="财务权限">参与【采购】审批流程，参与【领料】的最后审计</Descriptions.Item>
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