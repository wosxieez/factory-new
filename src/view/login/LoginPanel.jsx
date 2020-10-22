import React from 'react'
import { Row, Col } from 'antd'
import svgs from '../../assets/svgs'
import LoginForm from './LoginForm';
export default props => {
  return (
    <div style={styles.root}>
      <div style={styles.left}>
        <Row>
          <Col span={10}>{svgs.loginTitle(100, 100)}</Col>
          <Col span={14}><div style={{ marginTop: 20 }}><div style={styles.title}>Welcome</div><div style={styles.subTitle}>欢迎使用智能库管系统</div></div></Col>
        </Row>
        <LoginForm {...props} />
      </div>
      <div style={styles.right}>
        <img alt="" src='http://hefeixiaomu.oss-cn-hangzhou.aliyuncs.com/xiaomu/loginImg.png' height={400} />
      </div>
    </div>
  )
}
const styles = {
  root: {
    display: 'flex',
    flexDirection: 'row',
  },
  left: {
    padding: 24, display: 'flex', flexDirection: 'column', width: 300, height: 400, backgroundColor: '#FFFFFF'
  },
  right: {
    width: 420, height: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 800,
    fontStyle: 'oblique'
  },
  subTitle: {
    color: '#CCCCCC',
    fontStyle: 'oblique'
  },
  marginTop: {
    marginTop: 16,
  }
}
