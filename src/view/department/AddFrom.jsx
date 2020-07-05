import React from 'react'
import { Modal, Form, Input } from 'antd'

const AddFrom = Form.create({ name: 'from' })(props => {
  return (
    <Modal {...props}>
      <Form labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
        <Form.Item label='名称' hasFeedback>
          {props.form.getFieldDecorator('name', {
            rules: [{ required: true, message: '请输入名称' }]
          })(<Input />)}
        </Form.Item>
        <Form.Item label='备注'>{props.form.getFieldDecorator('remark')(<Input.TextArea rows={4} />)}</Form.Item>
      </Form>
    </Modal>
  )
})

export default AddFrom
