import React from 'react'
import { Input, Button } from 'antd'
import api from '../../http'

let username, password

export default props => {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
      <Input
        placeholder='手机号'
        onChange={e => {
          username = e.target.value
        }}
      />
      <Input
        style={{ marginTop: 24 }}
        placeholder='密码'
        onChange={e => {
          password = e.target.value
        }}
      />
      <Button
        type='primary'
        style={{ marginTop: 24 }}
        onClick={async () => {
          const response = await api.login(username, password)
          if (response.code === 0) {
            api.setToken(response.token)
            props.history.push('/main')
          }
        }}>
        登录
      </Button>
    </div>
  )
}
