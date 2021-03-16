import { Modal, Form, Input, TreeSelect } from 'antd'
import React from 'react'

const UpdateAttributeModal = Form.create({ name: 'form' })((props) => {
    return (
        <Modal destroyOnClose {...props}>
            <Form labelCol={{ span: 7 }} wrapperCol={{ span: 14 }}>
                <Form.Item label="父级">
                    {props.form.getFieldDecorator('pid', {
                        initialValue: props.data ? props.data.dataRef.pid : null,
                        rules: [{ required: false, message: '请选择父级' }]
                    })(<TreeSelect
                        allowClear
                        treeNodeFilterProp='title'
                        showSearch
                        treeData={props.treeData}
                        style={{ width: '100%' }}
                        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                        placeholder='请选择父级'
                        showCheckedStrategy={TreeSelect.SHOW_PARENT} />)}
                </Form.Item>
            </Form>
            <Form labelCol={{ span: 7 }} wrapperCol={{ span: 14 }}>
                <Form.Item label="名称">
                    {props.form.getFieldDecorator('title', {
                        initialValue: props.data ? props.data.title : null,
                        rules: [{ required: true, message: '请输入名称' }]
                    })(<Input placeholder='请输入名称'></Input>)}
                </Form.Item>
            </Form>
        </Modal>
    )
})
export default UpdateAttributeModal
