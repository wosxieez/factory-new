import React, { useCallback, useState } from 'react'
import { Row, Col } from 'antd';
import NewDpt from './NewDpt'
import NewUser from './NewUser'


export default props => {
    const [selectdpt, setSelectdpt] = useState(null);
    const selectDpt = useCallback((v) => {
        setSelectdpt(v)
    }, [])

    return (<div style={styles.root}>
        <Row gutter={16}>
            <Col span={6}><NewDpt selectDpt={selectDpt} /> </Col>
            <Col span={18}><NewUser selectdpt={selectdpt} /></Col>
        </Row>
    </div>)
}
const styles = {
    root: {
        width: '100%',
        height: '100vh',
        backgroundColor: '#F1F2F5'
    }
}