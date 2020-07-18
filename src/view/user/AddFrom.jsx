import React, { useState, useCallback, useEffect } from 'react'
import { Modal, Form, Input, TreeSelect } from 'antd'
import api from '../../http'
import { getJsonTree } from '../../util/tool'

const AddForm = Form.create({ name: 'form' })(props => {
  const [treeData, setTreeData] = useState([])
  const listData = useCallback(async () => {
    let result = await api.listAllTag()
    if (result.code === 0) {
      let treeResult = result.data.map((item) => {
        return { id: item.id, pId: item.tids ? item.tids[0] : 0, value: item.id, title: item.name }
      })
      setTreeData(getJsonTree(treeResult, 0))
    }
  }, [])
  useEffect(() => {
    listData()
  }, [listData])
  return (
    <Modal {...props} >
      <Form labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
        <Form.Item label='名称' >
          {props.form.getFieldDecorator('name', {
            rules: [{ required: true, message: '请输入名称' }]
          })(<Input placeholder='请输入名称' />)}
        </Form.Item>
        <Form.Item label='账号' >
          {props.form.getFieldDecorator('phone', {
            rules: [{ required: true, message: '请输入账号' }]
          })(<Input placeholder='请输入账号' />)}
        </Form.Item>
        <Form.Item label='密码' >
          {props.form.getFieldDecorator('password', {
            rules: [{ required: true, message: '请输入密码' }]
          })(<Input.Password placeholder='请输入密码' />)}
        </Form.Item>
        <Form.Item label='确认密码' >
          {props.form.getFieldDecorator('confirm_password', {
            rules: [{ required: true, message: '请再次输入密码' }, {
              validator: (rule, value, callback) => {
                if (props.form.getFieldValue('password') && value && props.form.getFieldValue('password') !== value) {
                  callback('密码不一致');
                }
                callback()
              }
            }]
          })(<Input.Password placeholder='请再次输入密码' />)}
        </Form.Item>
        <Form.Item label='标签'>
          {props.form.getFieldDecorator('tids', {
            rules: [{ required: false, message: '请选择标签' }]
          })(
            <TreeSelect
              treeNodeFilterProp='title'
              showSearch
              multiple
              treeData={treeData}
              style={{ width: '100%' }}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              placeholder='请选择标签'
              showCheckedStrategy={TreeSelect.SHOW_PARENT}
            />
          )}
        </Form.Item>
        <Form.Item label='备注'>{props.form.getFieldDecorator('remark')(<Input.TextArea rows={4} placeholder='选填' />)}</Form.Item>
      </Form>
    </Modal>
  )
})

export default AddForm
