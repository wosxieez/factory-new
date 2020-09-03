import React from 'react'
import { Modal, Form, Input } from 'antd'

/**
 * 添加部门的表单界面
 *
 * @param {*} props
 * @returns
 */
function AddStaffTypeForm(props) {
    const { getFieldDecorator } = props.form

    return <Form>
        <Form.Item label="部门名称" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
            {getFieldDecorator('name', {
                rules: [{ required: true, message: '请输入部门名称' }]
            })(<Input></Input>)}
        </Form.Item>
    </Form>
}

const StaffTypeForm = Form.create({ name: 'form' })(AddStaffTypeForm)


/**
 * 添加部门
 *
 * @export
 * @param {*} props
 * @returns
 */
export default function NewAddDpt(props) {
    const staffFormRef = React.useRef(null)

    const handlerOk = () => {
        staffFormRef.current.validateFields((error, values) => {
            if (!error) {
                props.onOk(values)
            }
        })
    }
    return <Modal centered onOk={handlerOk} title="新增部门"
        onCancel={props.onCancel}
        visible={props.visible}>
        <StaffTypeForm ref={staffFormRef}></StaffTypeForm>
    </Modal>
}