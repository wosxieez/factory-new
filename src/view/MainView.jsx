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

export default props => {
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
  return <div>{ok ? <>
    <HashRouter>
      <Switch>
        <Route exact path="/ApproveView" component={ApproveView} />
        <Route exact path="/ApplyView" component={ApplyView} />
        <Route exact path="/UserView" component={UserView} />
        <Route exact path="/DepartmentView" component={DepartmentView} />
        <Route exact path="/TagView" component={TagView} />
        <Route exact path="/StoreHouseView" component={StoreHouseView} />
      </Switch>
    </HashRouter>
  </> : null}</div>

}
