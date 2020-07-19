import React from 'react'
import { Row, Col } from 'antd'
import svgs from '../../assets/svgs'
import LoginForm from './LoginForm';
export default props => {
  return (
    <div style={styles.root}>
      <div style={styles.left}>
        <Row>
          <Col span={6}>{svgs.loginTitle(40, 40)}</Col>
          <Col span={18}><div style={styles.title}>Welcome</div><div style={styles.subTitle}>使用你的账号和密码登陆</div></Col>
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
    color: '#CCCCCC'
  },
  marginTop: {
    marginTop: 16,
  }
}
