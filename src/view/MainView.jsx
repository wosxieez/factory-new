import React from 'react'
import DepartmentView from './department/View'
import TagView from './tag/View'
import UserView from './user/View'
import StoreHouseView from './storehouse/View'
import ApplyView from './apply/View'
import ApproveView from './approve/View'
import { Route, Link, HashRouter, Switch } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../http'

const NavigateView = () => {
  return (
    <>
      <Link to='/departmentview'>部门列表</Link>
      <br />
      <Link to='/tagview'>标签列表</Link>
      <br />
      <Link to='/userview'>用户列表</Link>
      <br />
      <Link to='/storeview'>物品列表</Link>
      <br />
      <Link to='/applyview'>物品申请</Link>
      <br />
      <Link to='/approveview'>申请审批</Link>
    </>
  )
}

export default () => {
  const [ok, setOk] = useState(false)

  useEffect(() => {
    async function login() {
      const response = await api.login('18119645092', '18119645092')
      console.log(response)
      if (response.code === 0) {
        api.setToken(response.token)
        setOk(true)
      }
    }

    login()
  }, [])
  return (
    <div>
      {ok ? (
        <>
          <HashRouter>
            <Switch>
              <Route exact path='/' component={NavigateView} />
              <Route exact path='/approveview' component={ApproveView} />
              <Route exact path='/applyview' component={ApplyView} />
              <Route exact path='/userview' component={UserView} />
              <Route exact path='/departmentview' component={DepartmentView} />
              <Route exact path='/tagview' component={TagView} />
              <Route exact path='/storeview' component={StoreHouseView} />
            </Switch>
          </HashRouter>
        </>
      ) : null}
    </div>
  )
}
