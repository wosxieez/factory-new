import { Card } from 'antd';
import React from 'react'
import LoginFormNew from './LoginFormNew';
export default props => {
  return (
    <div style={styles.root}>
      {/* <div style={styles.left}>
        <LoginForm {...props} />
      </div> */}
      <Card
        title={<div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
          <span style={{ color: '#888' }}>登录</span>
        </div>}
        style={{ width: 300, height: 280, marginRight: 120 }}
      >
        <LoginFormNew {...props} />
      </Card>
    </div>
  )
}
const styles = {
  root: {
    display: 'flex',
    flexDirection: 'row',
  },
}
