import { Modal, Form, Input } from 'antd'
import React from 'react'

const AddAttributeModal2 = Form.create({ name: 'form' })((props) => {
    return (
        <Modal destroyOnClose {...props}>
            <Form labelCol={{ span: 7 }} wrapperCol={{ span: 14 }}>
                <Form.Item label="名称">
                    {props.form.getFieldDecorator('title', {
                        initialValue: props.data ? props.data.title : null,
                        rules: [{ required: true, message: '请输入名称' }]
                    })(<Input placeholder='请输入名称'></Input>)}
                </Form.Item>
                <Form.Item label="编号">
                    {props.form.getFieldDecorator('num', {
                        initialValue: props.data ? props.data.num : null,
                        rules: [{ required: true, message: '请输入编号' }]
                    })(<Input placeholder='请输入编号'></Input>)}
                </Form.Item>
            </Form>
        </Modal>
    )
})
export default AddAttributeModal2
