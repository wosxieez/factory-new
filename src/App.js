import React, { useReducer } from 'react'
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
      <MainView />
    </AppContext.Provider>
  )
}
