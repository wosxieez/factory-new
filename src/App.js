import React, { useReducer } from 'react'
import { HashRouter, Route } from 'react-router-dom'
import MainView from './view/MainView.jsx'

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
          <Route path='/' exact component={MainView} />
        </div>
      </HashRouter>
    </AppContext.Provider>
  )
}
