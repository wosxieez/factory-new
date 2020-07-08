import React from 'react'
import DepartmentView from './department/View'
import TagView from './tag/View'
import UserView from './user/View'
import StoreHouseView from './storehouse/View'

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

  return <div>{ok ? <StoreHouseView /> : null}</div>
  // return <div>{ok ? <UserView /> : null}</div>
  // return <div>{ok ? <DepartmentView /> : null}</div>
  // return <div>{ok ? <TagView /> : null}</div>
}
