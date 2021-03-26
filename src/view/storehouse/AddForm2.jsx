import React, { useState, useEffect, useCallback } from 'react'
import { Modal, Form, Input, TreeSelect, InputNumber, Alert, Row, Col } from 'antd'
import { getJson2Tree } from '../../util/Tool';
import HttpApi from '../../http/HttpApi';

const AddForm2 = Form.create({ name: 'form' })((props) => {
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
    // let result = await api.listAllTag()
    // if (result.code === 0) {
    //   result.data = filterTag(result.data, 0)
    //   let treeResult = result.data.map((item) => {
    //     return { id: item.id, pId: item.tids ? item.tids[0] : 0, value: item.id, title: item.name }
    //   })
    //   let temp = getJsonTree(treeResult, 0);
    //   let afterFilter = temp.filter((item) => item.value !== 1)
    //   setTreeData(afterFilter)
    //   let afterFilterArea = temp.filter((item) => item.value === 1)
    //   setAreaTreeData(afterFilterArea)
    // }
  }, [props.visible])
  useEffect(() => {
    listData();
  }, [listData])

  return (
    <Modal width={800} {...props}>
      {props.initData ? <Alert style={{ marginBottom: 10 }} type="warning" showIcon message={props.initData['isRFIDStore'] ?
        '创建的标签物品默认数量为 0；请在采购表单中的【数量列】进行标签的选择；若无数据，请先用PDA录入新的RFID标签'
        : '创建的普通物品默认数量为 0；请在采购表单中的【数量列】进行数量的填写'} /> : null}
      <Form labelCol={{ span: 7 }} wrapperCol={{ span: 14 }}>
        <Row>
          <Col span={12}>
            <Form.Item label="编号">
              {props.form.getFieldDecorator('num', {
                rules: [{ required: true, message: '请输入编号' }]
              })(<InputNumber style={{ width: '100%' }} placeholder='请输入编号'></InputNumber>)}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label='税率[%]' >
              {props.form.getFieldDecorator('tax', {
                initialValue: 13,
                rules: [{ required: true, message: '请输入税率' }]
              })(<InputNumber placeholder='请输入税率' min={0} style={{ width: '100%' }} />)}
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Form.Item label='物品名称' >
              {props.form.getFieldDecorator('name', {
                rules: [{ required: true, message: '请输入名称' }]
              })(<Input placeholder='请输入名称' />)}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="区域">
              {props.form.getFieldDecorator('store_area_id', {
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
            {props.initData && props.initData.count === 0 ?
              <Form.Item label='数量' >
                {props.form.getFieldDecorator('count', {
                  initialValue: 0,
                  rules: [{ required: true, message: '请输入数量' }]
                })(<InputNumber disabled placeholder='请输入数量' min={0} style={{ width: '100%' }} />)}
              </Form.Item> :
              <Form.Item label='数量' >
                {props.form.getFieldDecorator('count', {
                  initialValue: props.initData && props.initData.count === 0 ? 0 : 1,
                  rules: [{ required: true, message: '请输入数量' }]
                })(<InputNumber placeholder='请输入数量' min={0} style={{ width: '100%' }} />)}
              </Form.Item>}
          </Col>
          <Col span={12}>
            <Form.Item label='专业'>
              {props.form.getFieldDecorator('store_major_id', {
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
                initialValue: '个',
                rules: [{ required: true, message: '请输入单位' }]
              })(<Input placeholder='请输入单位' style={{ width: '100%' }} />)}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label='备注'>{props.form.getFieldDecorator('remark')(<Input.TextArea rows={1} placeholder='选填' />)}</Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <Form.Item label='含税单价[元]' >
              {props.form.getFieldDecorator('oprice', {
                rules: [{ required: true, message: '请输入单价' }]
              })(<InputNumber placeholder='请输入单价' min={0} style={{ width: '100%' }} />)}
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
})
export default AddForm2