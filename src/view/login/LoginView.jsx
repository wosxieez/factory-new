import React from 'react'
import LoginPanel from './LoginPanel.jsx'
export default props => {
    return <div style={styles.root}>
        <LoginPanel {...props} />
    </div>
}
const styles = {
    root: {
        display: 'flex',
        backgroundColor: '#F5F5FC',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center'
    }
}