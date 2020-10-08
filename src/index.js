import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import * as serviceWorker from './serviceWorker'
import { ConfigProvider } from 'antd'
import zh_CN from 'antd/lib/locale-provider/zh_CN'
import moment from 'moment'
import 'moment/locale/zh-cn'
import './http/index'
import AppRedux from './redux/AppRedux'

moment.locale('zh-cn')
ReactDOM.render(
  <ConfigProvider locale={zh_CN}>
    <AppRedux>
      <App />
    </AppRedux>
  </ConfigProvider>,
  document.getElementById('root')
)
serviceWorker.unregister()
