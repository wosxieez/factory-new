import React from 'react'
import LoginPanel from './LoginPanel.jsx'
// import { Icon } from 'antd';
export default props => {
    return <div style={styles.root}>
        <LoginPanel {...props} />
        {/* <div style={{ position: 'fixed', bottom: 15, textAlign: 'center' }}>
            <img style={{ cursor: 'pointer' }} src='https://hefeixiaomu.oss-cn-hangzhou.aliyuncs.com/xiaomu/xiaomu_logo_64.png' alt='' width='16' height='16' onClick={() => { window.open('https://www.ixiaomu.cn') }} />
            &nbsp;
        <span style={{ color: '#fff', fontSize: 12, cursor: 'pointer' }} onClick={() => { window.open('https://www.ixiaomu.cn') }}>小木软件提供技术支持</span>
            &nbsp;&nbsp;&nbsp;
        <Icon type='aliyun' onClick={() => { window.open('https://www.aliyun.com') }} />
            &nbsp;
        <span style={{ color: '#fff', fontSize: 12, cursor: 'pointer' }} onClick={() => { window.open('https://www.aliyun.com') }}>阿里云提供服务</span>
            &nbsp;&nbsp;&nbsp;
        <span style={{ color: '#fff', fontSize: 12, cursor: 'pointer' }} onClick={() => { window.open('http://www.beian.miit.gov.cn') }}>皖ICP备17017819号</span>
        </div> */}
    </div>
}
const styles = {
    root: {
        display: 'flex',
        backgroundColor: '#69c0ff',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center'
    }
}