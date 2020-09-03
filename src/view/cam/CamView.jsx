import React, { useRef, useEffect, useCallback } from 'react'
import WebCamWebAPI from '../../util/WebCamWebAPI';
import { Input, Row, Col } from 'antd';
import HttpApi from '../../http/HttpApi';
const fileTypes = [{ 'TYPE_CODE': 3, 'TYPE_DESC': '身份证正面' }]
export default props => {
    const camApi = useRef();
    const getUserInfo = useCallback(async () => {
        let userList = await HttpApi.getUserList()
        console.log('userList:', userList)
        let levelList = await HttpApi.getLevelList();
        console.log('levelList:', levelList)
    }, [])
    useEffect(() => {
        getUserInfo()
    }, [getUserInfo])
    return <div style={{ backgroundColor: '#FFFFFF' }}>
        <Row>
            <Col span={2}>
                二维码数据:
            </Col>
            <Col span={22}>
                <Input autoFocus
                    onPressEnter={(e) => {
                        console.log('onPressEnter', e.target.value);
                        camApi.current.takePicturePreView()
                    }} />
            </Col>
        </Row>
        <WebCamWebAPI
            ref={camApi}
            fileTypes={fileTypes}
            addFile={(imgObj) => {
                // this.handleApplyPhoto(imgObj);
                console.log('imgObj:', imgObj)
            }}
            onClose={() => {
                // this.setState({
                //     PhotoUploadVisible: false
                // })
            }}
        /></div>
}