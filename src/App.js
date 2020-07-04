import React, { useReducer } from 'react'
import { HashRouter, Route } from 'react-router-dom'
import LoginView from './view/LoginView.jsx'

//------------------------------------------------------------------------------------------------------------
// 全局状态管理
//------------------------------------------------------------------------------------------------------------
const appState = {}
function appReducer(state, action) {}
export const AppContext = React.createContext(null)

export default () => {
  const reducer = useReducer(appReducer, appState)

  return (
    <AppContext.Provider value={reducer}>
      <HashRouter>
        <div style={{ width: '100%', height: '100%' }}>
          <Route path='/' exact component={LoginView} />
        </div>
      </HashRouter>
    </AppContext.Provider>
  )
}
