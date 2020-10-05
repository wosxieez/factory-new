import React, { useState, useCallback, useEffect } from 'react'
import { Modal, Form, Input, TreeSelect } from 'antd'
import api from '../../http'
import { getJsonTree, filterTag, getDepartmentTree } from '../../util/Tool'

const UpdateForm = Form.create({ name: 'form' })(props => {
    const [tagTreeData, setTagTreeData] = useState([])
    const [dptTreeData, setDptTreeData] = useState([])
    const listData = useCallback(async () => {
        let result_tag = await api.listAllTag()
        if (result_tag.code === 0) {
            result_tag.data = filterTag(result_tag.data, 1)
            let treeResult = result_tag.data.map((item) => {
                return { id: item.id, pId: item.tids ? item.tids[0] : 0, value: item.id, title: item.name }
            })
            setTagTreeData(getJsonTree(treeResult, 0))
        }
        let result_dpt = await api.listAllDepartment()
        if (result_dpt.code === 0) {
            setDptTreeData(getDepartmentTree(result_dpt.data))
        }
    }, [])
    useEffect(() => {
        listData()
    }, [props.data, listData])
    return (
        <Modal {...props} destroyOnClose >
            <Form labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
                <Form.Item label='名称' >
                    {props.form.getFieldDecorator('name', {
                        initialValue: props.data.name,
                        rules: [{ required: true, message: '请输入名称' }]
                    })(<Input placeholder='请输入名称' />)}
                </Form.Item>
                <Form.Item label='账号' >
                    {props.form.getFieldDecorator('phone', {
                        initialValue: props.data.phone,
                        rules: [{ required: true, message: '请输入账号' }]
                    })(<Input placeholder='请输入账号' />)}
                </Form.Item>
                <Form.Item label='密码' >
                    {props.form.getFieldDecorator('password', {
                        initialValue: props.data.password,
                        rules: [{ required: true, message: '请输入密码' }]
                    })(<Input.Password placeholder='请输入密码' />)}
                </Form.Item>
                <Form.Item label='确认密码' >
                    {props.form.getFieldDecorator('confirm_password', {
                        initialValue: props.data.password,
                        rules: [{ required: true, message: '请再次输入密码' }, {
                            validator: (rule, value, callback) => {
                                if (props.form.getFieldValue('password') && value && props.form.getFieldValue('password') !== value) {
                                    callback('密码不一致');
                                }
                                callback()
                            }
                        }]
                    })(<Input.Password placeholder='请再次输入密码' />)}
                </Form.Item>
                <Form.Item label='部门'>
                    {props.form.getFieldDecorator('dids', {
                        initialValue: props.data.dids || null,
                        rules: [{ required: false, message: '请选择部门' }]
                    })(
                        <TreeSelect
                            treeNodeFilterProp='title'
                            showSearch
                            multiple
                            treeData={dptTreeData}
                            style={{ width: '100%' }}
                            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                            placeholder='请选择部门'
                            showCheckedStrategy={TreeSelect.SHOW_PARENT}
                        />
                    )}
                </Form.Item>
                <Form.Item label='标签'>
                    {props.form.getFieldDecorator('tids', {
                        initialValue: props.data.tids || null,
                        rules: [{ required: false, message: '请选择标签' }]
                    })(
                        <TreeSelect
                            treeNodeFilterProp='title'
                            showSearch
                            multiple
                            treeData={tagTreeData}
                            style={{ width: '100%' }}
                            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                            placeholder='请选择标签'
                            showCheckedStrategy={TreeSelect.SHOW_PARENT}
                        />
                    )}
                </Form.Item>
                <Form.Item label='备注'>{props.form.getFieldDecorator('remark', { initialValue: props.data.remark })(<Input.TextArea rows={4} placeholder='选填' />)}</Form.Item>
            </Form>
        </Modal>
    )
})

export default UpdateForm
