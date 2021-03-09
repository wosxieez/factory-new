import React, { useState, useEffect, useCallback } from 'react'
import { Modal, Form, Input, TreeSelect, InputNumber, Alert } from 'antd'
import api from '../../http';
import { getJsonTree, filterTag } from '../../util/Tool';

const AddForm2 = Form.create({ name: 'form' })((props) => {
  const [treeData, setTreeData] = useState([])///属性树
  const [areaTreeData, setAreaTreeData] = useState([])///区域属性树
  const listData = useCallback(async () => {
    if (!props.visible) { return }
    let result = await api.listAllTag()
    if (result.code === 0) {
      result.data = filterTag(result.data, 0)
      let treeResult = result.data.map((item) => {
        return { id: item.id, pId: item.tids ? item.tids[0] : 0, value: item.id, title: item.name }
      })
      let temp = getJsonTree(treeResult, 0);
      let afterFilter = temp.filter((item) => item.value !== 1)
      setTreeData(afterFilter)
      let afterFilterArea = temp.filter((item) => item.value === 1)
      setAreaTreeData(afterFilterArea)
    }
  }, [props.visible])
  useEffect(() => {
    listData();
  }, [listData])

  return (
    <Modal {...props} destroyOnClose>
      {props.initData ? <Alert style={{ marginBottom: 10 }} type="warning" showIcon message={props.initData['isRFIDStore'] ?
        '创建的标签物品默认数量为 0；请在采购表单中的【数量列】进行标签的选择；若无数据，请先用PDA录入新的RFID标签'
        : '创建的普通物品默认数量为 0；请在采购表单中的【数量列】进行数量的填写'} /> : null}
      <Form labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
        <Form.Item label='种类名称' >
          {props.form.getFieldDecorator('name', {
            rules: [{ required: true, message: '请输入名称' }]
          })(<Input placeholder='请输入名称' />)}
        </Form.Item>
        {props.initData && props.initData.count === 0 ? null :
          <Form.Item label='数量' >
            {props.form.getFieldDecorator('count', {
              initialValue: props.initData && props.initData.count === 0 ? 0 : 1,
              rules: [{ required: true, message: '请输入数量' }]
            })(<InputNumber placeholder='请输入数量' min={0} style={{ width: '100%' }} />)}
          </Form.Item>}
        <Form.Item label='单位' >
          {props.form.getFieldDecorator('unit', {
            initialValue: '个',
            rules: [{ required: true, message: '请输入单位' }]
          })(<Input placeholder='请输入单位' style={{ width: '100%' }} />)}
        </Form.Item>
        <Form.Item label='单价[元]' >
          {props.form.getFieldDecorator('oprice', {
            rules: [{ required: true, message: '请输入单价' }]
          })(<InputNumber placeholder='请输入单价' min={0} style={{ width: '100%' }} />)}
        </Form.Item>
        <Form.Item label='税率[%]' >
          {props.form.getFieldDecorator('tax', {
            rules: [{ required: true, message: '请输入税率' }]
          })(<InputNumber placeholder='请输入税率' min={0} style={{ width: '100%' }} />)}
        </Form.Item>
        <Form.Item label='物品编号' >
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

        <Form.Item label="货架编号">
          {props.form.getFieldDecorator('num', {
            initialValue: props.data ? props.data.num : null,
            rules: [{ required: true, message: '请输入编号' }]
          })(<Input placeholder='请输入编号'></Input>)}
        </Form.Item>
        <Form.Item label="货架名称">
          {props.form.getFieldDecorator('shelf_name', {
            initialValue: props.data ? props.data.name : null,
            rules: [{ required: true, message: '请输入名称' }]
          })(<Input placeholder='请输入名称'></Input>)}
        </Form.Item>
        <Form.Item label="货架区域">
          {props.form.getFieldDecorator('tag_id', {
            initialValue: props.data ? props.data.tag_id : null,
            rules: [{ required: true, message: '请选择区域' }]
          })(<TreeSelect
            treeNodeFilterProp="title"
            // showSearch
            treeData={areaTreeData}
            style={{ width: '100%' }}
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
            placeholder="请选择区域"
            showCheckedStrategy={TreeSelect.SHOW_PARENT}
          />)}
        </Form.Item>
        <Form.Item label="型号">
          {props.form.getFieldDecorator('model', {
            initialValue: props.data ? props.data.model : null,
            rules: [{ required: false, message: '请输入型号' }]
          })(<Input placeholder='请输入型号【选填】'></Input>)}
        </Form.Item>
      </Form>
    </Modal>
  )
})

export default AddForm2
