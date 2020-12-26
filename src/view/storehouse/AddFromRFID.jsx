import React, { useState, useEffect, useCallback } from 'react'
import { Modal, Form, Input, TreeSelect, InputNumber, Select } from 'antd'
import api from '../../http';
import { getJsonTree, filterTag } from '../../util/Tool';
import HttpApi from '../../http/HttpApi';
const { Option } = Select;

const AddFromRFID = Form.create({ name: 'form' })((props) => {
  // console.log('props.initData.count:', props)
  const [treeData, setTreeData] = useState([])
  const [shelfList, setShelfList] = useState([])
  const [rfidList, setRfidLIST] = useState([])
  const listData = useCallback(async () => {
    if (!props.visible) { return }
    let result = await api.listAllTag()
    if (result.code === 0) {
      result.data = filterTag(result.data, 0)
      let treeResult = result.data.map((item) => {
        return { id: item.id, pId: item.tids ? item.tids[0] : 0, value: item.id, title: item.name }
      })
      setTreeData(getJsonTree(treeResult, 0))
    }
    let res_shelf = await HttpApi.getNfcShelfList();
    setShelfList(res_shelf)
    let res_rfid = await HttpApi.getRfidList({ hasBinded: false });
    setRfidLIST(res_rfid)
  }, [props.visible])
  useEffect(() => {
    listData();
  }, [listData])

  return (
    <Modal {...props} destroyOnClose>
      <Form labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
        <Form.Item label='名称' >
          {props.form.getFieldDecorator('name', {
            rules: [{ required: true, message: '请输入名称' }]
          })(<Input placeholder='请输入名称' />)}
        </Form.Item>
        <Form.Item label='单位' >
          {props.form.getFieldDecorator('unit', {
            initialValue: '个',
            rules: [{ required: true, message: '请输入单位' }]
          })(<Input placeholder='请输入单位' style={{ width: '100%' }} />)}
        </Form.Item>
        <Form.Item label='物品标签' >
          {props.form.getFieldDecorator('rfids', {
            rules: [{ required: true, message: '请关联上对应的物品标签' }]
          })(<Select
            showSearch
            optionFilterProp="children"
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="请选择物品标签标签"
          >
            {rfidList.map((item, index) => {
              return <Option key={index} value={item.id}>{item.name}</Option>
            })}
          </Select>)}
        </Form.Item>
        <Form.Item label='单价[元]' >
          {props.form.getFieldDecorator('oprice', {
            rules: [{ required: true, message: '请输入单价' }]
          })(<InputNumber placeholder='请输入单价' min={0} style={{ width: '100%' }} />)}
        </Form.Item>
        <Form.Item label='货架标签' >
          {props.form.getFieldDecorator('nfc_shelf_id', {
            rules: [{ required: false }]
          })(<Select style={{ width: '100%' }}
            placeholder="支持搜索"
            allowClear
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {/* {shelfList.map((item, index) => { return <Option key={index} value={item.id}>{item.name}</Option> })} */}
            {shelfList.map((item, index) => { return <Option key={index} value={item.id}>{(item.num ? item.num + '-' : '') + item.name + (item.model ? '-' + item.model : '') + '-' + item.tag_name}</Option> })}
          </Select>)}
        </Form.Item>
        <Form.Item label='编号' >
          {props.form.getFieldDecorator('no', {
            rules: [{ required: false, message: '请输入编号' }]
          })(<Input placeholder='请输入编号' style={{ width: '100%' }} />)}
        </Form.Item>
        <Form.Item label='属性'>
          {props.form.getFieldDecorator('tids', {
            rules: [{ required: false, message: '请选择属性' }]
          })(
            <TreeSelect
              allowClear
              multiple
              treeNodeFilterProp="title"
              showSearch
              treeData={treeData}
              style={{ width: '100%' }}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              placeholder="请选择属性-支持搜索"
              // treeCheckable={true}
              showCheckedStrategy={TreeSelect.SHOW_PARENT}
            />)}
        </Form.Item>
        <Form.Item label='备注'>{props.form.getFieldDecorator('remark')(<Input.TextArea rows={4} placeholder='选填' />)}</Form.Item>
      </Form>
    </Modal>
  )
})

export default AddFromRFID
