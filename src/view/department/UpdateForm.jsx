import React, { useState, useCallback, useEffect } from 'react'
import { Modal, Form, Input, TreeSelect } from 'antd'
import api from '../../http'
import { getDepartmentTree } from '../../util/Tool'

const UpdateForm = Form.create({ name: 'form' })(props => {
  const [treeData, setTreeData] = useState([])
  const listData = useCallback(async () => {
    let result = await api.listAllDepartment()
    ///移除当前部门，防止出现父级部门选自己-出现套娃
    if (result.code === 0) {
      let afterFilter = result.data.filter((item) => { return item.id !== props.data.id })
      setTreeData(getDepartmentTree(afterFilter))
    }
  }, [props.data])
  useEffect(() => {
    listData()
  }, [props.data, listData])
  return (
    <Modal {...props} destroyOnClose>
      <Form labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
        <Form.Item label='部门名称'>
          {props.form.getFieldDecorator('name', {
            initialValue: props.data.name,
            rules: [{ required: true, message: '请输入部门名称' }]
          })(<Input placeholder='请输入名称' />)}
        </Form.Item>
        <Form.Item label='上级部门'>
          {props.form.getFieldDecorator('dids', {
            initialValue: props.data.dids ? props.data.dids[0] : null,
            rules: [{ required: false, message: '请选择上级部门' }]
          })(
            <TreeSelect
              treeNodeFilterProp='title'
              showSearch
              treeData={treeData}
              style={{ width: '100%' }}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              placeholder='请选择上级部门'
              showCheckedStrategy={TreeSelect.SHOW_PARENT}
            />
          )}
        </Form.Item>
        <Form.Item label='备注信息'>
          {props.form.getFieldDecorator('remark', { initialValue: props.data.remark })(
            <Input.TextArea rows={4} placeholder='选填' />
          )}
        </Form.Item>
      </Form>
    </Modal>
  )
})

export default UpdateForm
