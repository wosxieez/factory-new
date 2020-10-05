import React, { useState, useCallback, useEffect } from 'react'
import { Modal, Form, Input, TreeSelect, Select } from 'antd'
import api from '../../http'
import { getJsonTree, colorList } from '../../util/Tool'
const { Option } = Select;

const UpdateForm = Form.create({ name: 'form' })(props => {
    const [treeData, setTreeData] = useState([])
    const listData = useCallback(async () => {
        let result = await api.listAllTag()
        ///移除当前部门，防止出现父级部门选自己-出现套娃
        if (result.code === 0) {
            let treeResult = result.data.map((item) => {
                return { id: item.id, pId: item.tids ? item.tids[0] : 0, value: item.id, title: item.name, allselectable: true }
            })
            let afterFilter = treeResult.filter((item) => { return item.id !== props.data.id })
            setTreeData(getJsonTree(afterFilter, 0))
        }
    }, [props.data])
    useEffect(() => {
        listData()
    }, [props.data, listData])
    return (
        <Modal {...props} destroyOnClose>
            <Form labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
                <Form.Item label='名称' >
                    {props.form.getFieldDecorator('name', {
                        initialValue: props.data.name,
                        rules: [{ required: true, message: '请输入名称' }]
                    })(<Input placeholder='请输入名称' />)}
                </Form.Item>
                <Form.Item label='上级标签'>
                    {props.form.getFieldDecorator('tids', {
                        initialValue: props.data.tids ? props.data.tids[0] : null,
                        rules: [{ required: false, message: '请选择上级标签' }]
                    })(
                        <TreeSelect
                            treeNodeFilterProp='title'
                            showSearch
                            treeData={treeData}
                            style={{ width: '100%' }}
                            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                            placeholder='请选择上级标签'
                            showCheckedStrategy={TreeSelect.SHOW_PARENT}
                        />
                    )}
                </Form.Item>
                <Form.Item label='颜色' >
                    {props.form.getFieldDecorator('color', {
                        initialValue: props.data.color || '#f5222d',
                        rules: [{ required: true, message: '请选择颜色' }]
                    })(<Select placeholder='请选择颜色'>
                        {colorList.map((item, index) => {
                            return <Option key={index} value={item.color}>
                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                    <div style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: item.color, marginRight: 10 }} />{item.label}
                                </div>
                            </Option>
                        })}
                    </Select>)}
                </Form.Item>
                <Form.Item label='备注'>{props.form.getFieldDecorator('remark', { initialValue: props.data.remark })(<Input.TextArea rows={4} placeholder='选填' />)}</Form.Item>
            </Form>
        </Modal>
    )
})

export default UpdateForm
