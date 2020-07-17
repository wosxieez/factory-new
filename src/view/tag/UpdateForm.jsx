import React from 'react'
import { Modal, Form, Input } from 'antd'

const UpdateForm = Form.create({ name: 'form' })(props => {
    return (
        <Modal {...props} >
            <Form labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
                <Form.Item label='名称' >
                    {props.form.getFieldDecorator('name', {
                        initialValue: props.data.name,
                        rules: [{ required: true, message: '请输入名称' }]
                    })(<Input placeholder='请输入名称' />)}
                </Form.Item>
                <Form.Item label='备注'>{props.form.getFieldDecorator('remark', { initialValue: props.data.remark })(<Input.TextArea rows={4} placeholder='选填' />)}</Form.Item>
            </Form>
        </Modal>
    )
})

export default UpdateForm
