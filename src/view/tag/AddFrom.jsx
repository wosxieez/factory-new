import React from 'react'
import { Modal, Form, Input, Select } from 'antd'
import { colorList } from '../../util/tool';
const { Option } = Select;


const AddForm = Form.create({ name: 'form' })(props => {
  return (
    <Modal {...props} >
      <Form labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
        <Form.Item label='名称' >
          {props.form.getFieldDecorator('name', {
            rules: [{ required: true, message: '请输入名称' }]
          })(<Input placeholder='请输入名称' />)}
        </Form.Item>
        <Form.Item label='颜色' >
          {props.form.getFieldDecorator('color', {
            initialValue: '#f5222d',
            rules: [{ required: true, message: '请选择颜色' }]
          })(<Select placeholder='请选择颜色'>
            {colorList.map((item, index) => {
              return <Option key={index} value={item.color}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: item.color, marginRight: 10 }} />{item.label}
                </div>
              </Option>
            })}
          </Select>)}
        </Form.Item>
        <Form.Item label='备注'>{props.form.getFieldDecorator('remark')(<Input.TextArea rows={4} placeholder='选填' />)}</Form.Item>
      </Form>
    </Modal>
  )
})

export default AddForm
