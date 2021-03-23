import React, { useState, useEffect, useCallback } from 'react'
import { Modal, Form, Input, TreeSelect, InputNumber, Row, Col } from 'antd'
import { getJson2Tree } from '../../util/Tool';
import HttpApi from '../../http/HttpApi';

const UpdateForm2 = Form.create({ name: 'form' })((props) => {
  const [areaTreeData, setAreaTreeData] = useState([])///区域属性树
  const [typeTreeData, setTypeTreeData] = useState([])///类型属性树
  const [majorTreeData, setMajorTreeData] = useState([])///专业属性树

  const listData = useCallback(async () => {
    if (!props.visible) { return }
    let res1 = await HttpApi.getStoreAttributeList({ table_index: 0 })
    if (res1.code === 0) {
      let temp_tree = getJson2Tree(res1.data, null);
      setAreaTreeData(temp_tree)
    }
    let res2 = await HttpApi.getStoreAttributeList({ table_index: 1 })
    if (res2.code === 0) {
      let temp_tree = getJson2Tree(res2.data, null);
      setTypeTreeData(temp_tree)
    }
    let res3 = await HttpApi.getStoreAttributeList({ table_index: 2 })
    if (res3.code === 0) {
      let temp_tree = getJson2Tree(res3.data, null);
      setMajorTreeData(temp_tree)
    }
  }, [props.visible])
  useEffect(() => {
    listData();
  }, [listData])

  return (
    <Modal width={800} {...props} destroyOnClose>
      <Form labelCol={{ span: 7 }} wrapperCol={{ span: 14 }}>
        <Row>
          <Col span={12}>
            <Form.Item label="编号">
              {props.form.getFieldDecorator('num', {
                initialValue: props.data ? props.data.num : null,
                rules: [{ required: true, message: '请输入编号' }]
              })(<InputNumber style={{ width: '100%' }} placeholder='请输入编号'></InputNumber>)}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label='单价' >
              {props.form.getFieldDecorator('tax_price', {
                initialValue: props.data ? props.data.tax_price : null,
                rules: [{ required: true, message: '请输入单价' }]
              })(<InputNumber placeholder='请输入单价' min={0} style={{ width: '100%' }} />)}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Form.Item label='物品名称' >
              {props.form.getFieldDecorator('name', {
                initialValue: props.data ? props.data.name : null,
                rules: [{ required: true, message: '请输入名称' }]
              })(<Input placeholder='请输入名称' />)}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="区域">
              {props.form.getFieldDecorator('store_area_id', {
                initialValue: props.data ? props.data.store_area_id : null,
                rules: [{ required: true, message: '请选择区域' }]
              })(<TreeSelect
                allowClear
                showSearch
                filterOption='children'
                treeNodeFilterProp="title"
                treeData={areaTreeData}
                style={{ width: '100%' }}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                placeholder="请选择区域"
                showCheckedStrategy={TreeSelect.SHOW_PARENT}
              />)}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Form.Item label="型号">
              {props.form.getFieldDecorator('model', {
                initialValue: props.data ? props.data.model : null,
                rules: [{ required: true, message: '请输入型号' }]
              })(<Input placeholder='请输入型号'></Input>)}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label='类型'>
              {props.form.getFieldDecorator('store_type_id', {
                initialValue: props.data ? props.data.store_type_id : null,
                rules: [{ required: false, message: '请选择类型' }]
              })(<TreeSelect
                allowClear
                showSearch
                filterOption='children'
                treeNodeFilterProp="title"
                treeData={typeTreeData}
                style={{ width: '100%' }}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                placeholder="请选择类型"
                showCheckedStrategy={TreeSelect.SHOW_PARENT}
              />)}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            {props.initData && props.initData.count === 0 ? null :
              <Form.Item label='数量' >
                {props.form.getFieldDecorator('count', {
                  initialValue: props.data ? props.data.count : null,
                  rules: [{ required: true, message: '请输入数量' }]
                })(<InputNumber placeholder='请输入数量' min={0} style={{ width: '100%' }} />)}
              </Form.Item>}
          </Col>
          <Col span={12}>
            <Form.Item label='专业'>
              {props.form.getFieldDecorator('store_major_id', {
                initialValue: props.data ? props.data.store_major_id : null,
                rules: [{ required: false, message: '请选择专业' }]
              })(<TreeSelect
                allowClear
                showSearch
                filterOption='children'
                treeNodeFilterProp="title"
                treeData={majorTreeData}
                style={{ width: '100%' }}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                placeholder="请选择专业"
                showCheckedStrategy={TreeSelect.SHOW_PARENT}
              />)}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Form.Item label='单位' >
              {props.form.getFieldDecorator('unit', {
                initialValue: props.data ? props.data.unit : null,
                rules: [{ required: true, message: '请输入单位' }]
              })(<Input placeholder='请输入单位' style={{ width: '100%' }} />)}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label='备注'>{props.form.getFieldDecorator('remark', {
              initialValue: props.data ? props.data.remark : null,
            })(<Input.TextArea rows={1} placeholder='选填' />)}</Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Form.Item label='含税单价[元]' >
              {props.form.getFieldDecorator('oprice', {
                initialValue: props.data ? props.data.oprice : null,
                rules: [{ required: true, message: '请输入单价' }]
              })(<InputNumber placeholder='请输入单价' min={0} style={{ width: '100%' }} />)}
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
})
export default UpdateForm2