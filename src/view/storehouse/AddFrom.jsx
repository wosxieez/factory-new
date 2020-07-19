import React, { useState, useEffect, useCallback } from 'react'
import { Modal, Form, Input, TreeSelect, InputNumber } from 'antd'
import api from '../../http';
import { getJsonTree, filterTag } from '../../util/tool';

const AddForm = Form.create({ name: 'form' })((props) => {
  const [treeData, setTreeData] = useState([])
  const listData = useCallback(async () => {
    let result = await api.listAllTag()
    if (result.code === 0) {
      result.data = filterTag(result.data, '物品大类')
      let treeResult = result.data.map((item) => {
        return { id: item.id, pId: item.tids ? item.tids[0] : 0, value: item.id, title: item.name }
      })
      setTreeData(getJsonTree(treeResult, 0))
    }
  }, [])
  useEffect(() => {
    listData();
  }, [listData])

  return (
    <Modal {...props} >
      <Form labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
        <Form.Item label='名称' >
          {props.form.getFieldDecorator('name', {
            rules: [{ required: true, message: '请输入名称' }]
          })(<Input placeholder='请输入名称' />)}
        </Form.Item>
        <Form.Item label='数量' >
          {props.form.getFieldDecorator('count', {
            initialValue: 1,
            rules: [{ required: true, message: '请输入数量' }]
          })(<InputNumber placeholder='请输入数量' min={1} />)}
        </Form.Item>
        <Form.Item label='标签'>
          {props.form.getFieldDecorator('tids', {
            rules: [{ required: false, message: '请选择标签' }]
          })(
            <TreeSelect
              allowClear
              multiple
              treeNodeFilterProp="title"
              showSearch
              treeData={treeData}
              style={{ width: '100%' }}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              placeholder="请选择标签-支持搜索"
              // treeCheckable={true}
              showCheckedStrategy={TreeSelect.SHOW_PARENT}
            />)}
        </Form.Item>
        <Form.Item label='备注'>{props.form.getFieldDecorator('remark')(<Input.TextArea rows={4} placeholder='选填' />)}</Form.Item>
      </Form>
    </Modal>
  )
})

export default AddForm
