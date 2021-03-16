import React, { useState, useEffect, useCallback } from 'react'
import { Modal, Form, Input, TreeSelect, InputNumber } from 'antd'
import api from '../../http';
import { getJsonTree, filterTag } from '../../util/Tool';

const UpdateForm = Form.create({ name: 'form' })((props) => {
    const [treeData, setTreeData] = useState([])
    const [areaTreeData, setAreaTreeData] = useState([])///区域属性树
    // const [shelfList, setShelfList] = useState([])
    const listData = useCallback(async () => {
        if (!props.visible) { return }
        console.log('props:', props)
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
    }, [props])
    useEffect(() => {
        listData();
    }, [listData])
    return (
        <Modal {...props} destroyOnClose>
            <Form labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
                <Form.Item label="编号">
                    {props.form.getFieldDecorator('num', {
                        initialValue: props.data.nfc_shelf ? props.data.nfc_shelf.num : null,
                        rules: [{ required: true, message: '请输入编号' }]
                    })(<Input placeholder='请输入编号'></Input>)}
                </Form.Item>
                <Form.Item label='物品名称' >
                    {props.form.getFieldDecorator('name', {
                        initialValue: props.data.name,
                        rules: [{ required: true, message: '请输入名称' }]
                    })(<Input placeholder='请输入名称' />)}
                </Form.Item>
                <Form.Item label="型号">
                    {props.form.getFieldDecorator('model', {
                        initialValue: props.data.nfc_shelf ? props.data.nfc_shelf.model : null,
                        rules: [{ required: true, message: '请输入型号' }]
                    })(<Input placeholder='请输入型号【必填】'></Input>)}
                </Form.Item>
                <Form.Item label='数量' >
                    {props.form.getFieldDecorator('count', {
                        initialValue: props.data.count,
                        rules: [{ required: true, message: '请输入数量' }]
                    })(<InputNumber placeholder='请输入数量' min={0} style={{ width: '100%' }} />)}
                </Form.Item>
                <Form.Item label='单位' >
                    {props.form.getFieldDecorator('unit', {
                        initialValue: props.data.unit || '个',
                        rules: [{ required: true, message: '请输入单位' }]
                    })(<Input placeholder='请输入单位' style={{ width: '100%' }} />)}
                </Form.Item>
                <Form.Item label='含税单价[元]' >
                    {props.form.getFieldDecorator('oprice', {
                        initialValue: props.data.oprice,
                        rules: [{ required: true, message: '请输入单价' }]
                    })(<InputNumber placeholder='请输入单价' min={0} style={{ width: '100%' }} />)}
                </Form.Item>
                <Form.Item label='税率[%]' >
                    {props.form.getFieldDecorator('tax', {
                        initialValue: props.data.tax,
                        rules: [{ required: true, message: '请输入税率' }]
                    })(<InputNumber placeholder='请输入税率' min={0} style={{ width: '100%' }} />)}
                </Form.Item>
                <Form.Item label='属性'>
                    {props.form.getFieldDecorator('tids', {
                        initialValue: props.data.tids || null,
                        rules: [{ required: false, message: '请选择属性' }]
                    })(
                        <TreeSelect
                            multiple
                            treeNodeFilterProp="title"
                            showSearch
                            treeData={treeData}
                            style={{ width: '100%' }}
                            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                            placeholder="请选择属性"
                            // treeCheckable={true}
                            showCheckedStrategy={TreeSelect.SHOW_PARENT}
                        />)}
                </Form.Item>
                <Form.Item label='所在区域'>
                    {props.form.getFieldDecorator('tag_id', {
                        initialValue: props.data.nfc_shelf ? props.data.nfc_shelf.tag_id : null,
                        rules: [{ required: true, message: '请选择所在区域' }]
                    })(
                        <TreeSelect
                            multiple
                            treeNodeFilterProp="title"
                            showSearch
                            treeData={areaTreeData}
                            style={{ width: '100%' }}
                            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                            placeholder="请选择所在区域"
                            // treeCheckable={true}
                            showCheckedStrategy={TreeSelect.SHOW_PARENT}
                        />)}
                </Form.Item>
                <Form.Item label='备注'>{props.form.getFieldDecorator('remark', { initialValue: props.data.remark })(<Input.TextArea rows={4} placeholder='选填' />)}</Form.Item>
            </Form>
        </Modal>
    )
})

export default UpdateForm