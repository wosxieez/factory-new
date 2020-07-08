import React, { useState, useEffect, useCallback } from 'react'
import { Modal, Form, Input, TreeSelect } from 'antd'
import api from '../../http';
import { getJsonTree } from '../../util/tool';
const { TreeNode } = TreeSelect;

const AddForm = Form.create({ name: 'form' })((props) => {
    const [treeData, setTreeData] = useState([])
    const listData = useCallback(async () => {
        let result = await api.listTag()
        if (result.code === 0) {
            let treeResult = result.data.map((item) => { return { id: item.id, pId: item.tids ? JSON.parse(item.tids)[0] : 0, value: item.id, title: item.name } })
            setTreeData(getJsonTree(treeResult, 0))
        }
    }, [])
    useEffect(() => {
        listData();
    }, [listData])
    return (
        <Modal {...props} >
            <Form labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
                <Form.Item label='名称' hasFeedback>
                    {props.form.getFieldDecorator('name', {
                        initialValue: props.data.name,
                        rules: [{ required: true, message: '请输入名称' }]
                    })(<Input placeholder='请输入名称' />)}
                </Form.Item>
                <Form.Item label='标签'>
                    {props.form.getFieldDecorator('tids', {
                        initialValue: props.data.tids || null,
                        rules: [{ required: false, message: '请选择标签' }]
                    })(
                        <TreeSelect
                            multiple
                            treeNodeFilterProp="title"
                            showSearch
                            treeData={treeData}
                            style={{ width: '100%' }}
                            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                            placeholder="请选择标签"
                            treeCheckable={true}
                            showCheckedStrategy={TreeSelect.SHOW_PARENT}
                        />)}
                </Form.Item>
                <Form.Item label='备注'>{props.form.getFieldDecorator('remark', { initialValue: props.data.remark })(<Input.TextArea rows={4} placeholder='选填' />)}</Form.Item>
            </Form>
        </Modal>
    )
})

export default AddForm