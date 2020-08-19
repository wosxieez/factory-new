import React, { useCallback, useState } from 'react'
import { Row, Col } from 'antd';
import DepartmentView from '../department/View'
import UserView from '../user/View'


export default props => {
    const [selectdpt, setSelectdpt] = useState(null);
    const selectDpt = useCallback((v) => {
        setSelectdpt(v)
    }, [])

    return (<div style={styles.root}>
        <Row gutter={16}>
            <Col span={6}><DepartmentView selectDpt={selectDpt} /></Col>
            <Col span={18}><UserView selectdpt={selectdpt} /></Col>
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