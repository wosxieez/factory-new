import React, { useReducer } from 'react'

const initialState = {
    version: 'Beta 0.87',
    currentcode: '', // 推送id
    approvecount: 0,//申请单计数
    purchasecount: 0,//采购单计数
    returncount: 0,//退料单计数
    outboundcount: 0,///自行出库单计数
}
function reducer(state, action) {
    switch (action.type) {
        case 'currentcode': return { ...state, currentcode: action.data }
        case 'approvecount': return { ...state, approvecount: action.data }
        case 'purchasecount': return { ...state, purchasecount: action.data }
        case 'returncount': return { ...state, returncount: action.data }
        case 'outboundcount': return { ...state, outboundcount: action.data }
        default: return state
    }
}

export const AppDataContext = React.createContext(null)

export default function AppRedux({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState)
    return <AppDataContext.Provider value={{ appState: state, appDispatch: dispatch }}>{children}</AppDataContext.Provider>
}