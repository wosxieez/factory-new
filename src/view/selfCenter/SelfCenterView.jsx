import React from 'react'
import { Descriptions, Icon, Tag } from 'antd';
import AppData from '../../util/AppData';
export default _ => {
    return <div style={styles.root}>
        <div style={styles.body}>
            <Descriptions title="基本信息" bordered size='small' column={2}>
                <Descriptions.Item label="姓名">{AppData.userinfo().name}</Descriptions.Item>
                <Descriptions.Item label="账号">{AppData.userinfo().username}</Descriptions.Item>
                <Descriptions.Item label="部门">{AppData.userinfo().level_name}</Descriptions.Item>
                <Descriptions.Item label="专业">{AppData.userinfo().major_name_all}</Descriptions.Item>
                <Descriptions.Item label="权限">{AppData.userPermissions()}</Descriptions.Item>
                <Descriptions.Item label="管理">{AppData.userinfo().isadmin ? <Icon type="check-circle" theme="twoTone" twoToneColor="#52c41a" /> : '-'}</Descriptions.Item>
                <Descriptions.Item label="备注">{AppData.userinfo().remark || '-'}</Descriptions.Item>
                <Descriptions.Item label="版本">{<Tag color='blue'>{AppData.version}</Tag>}</Descriptions.Item>
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
    },
    button: {
        marginLeft: 10
    },
    alertMessage: {
        display: 'flex',
        justifyContent: 'space-between'
    }
}