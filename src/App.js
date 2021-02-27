import React, { useReducer } from 'react'
import MainView from './view/MainView.jsx'
import { HashRouter, Route } from 'react-router-dom'
// import LoginView from './view/login/LoginView.jsx';
import LoginViewNew from './view/login/new/LoginViewNew.jsx';

//------------------------------------------------------------------------------------------------------------
// 全局状态管理
//------------------------------------------------------------------------------------------------------------
const appState = {}
function appReducer(state, action) { }
export const AppContext = React.createContext(null)

export default () => {
  const reducer = useReducer(appReducer, appState)

  return (
    <AppContext.Provider value={reducer}>
      <HashRouter>
        <div style={{ width: '100%', height: '100%' }}>
          <Route path="/" exact component={LoginViewNew} />
          <Route path="/main" component={MainView} />
        </div>
      </HashRouter>
    </AppContext.Provider>
  )
}
