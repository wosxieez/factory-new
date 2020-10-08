import React, { useReducer } from 'react'

const initialState = {
    version: 'Beta 0.3',
    currentcode: '', // 推送id
}
function reducer(state, action) {
    switch (action.type) {
        case 'currentcode': return { ...state, currentcode: action.data }
        default: return state
    }
}

export const AppDataContext = React.createContext(null)

export default function AppRedux({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState)
    return <AppDataContext.Provider value={{ appState: state, appDispatch: dispatch }}>{children}</AppDataContext.Provider>
}