import React from 'react'
import { Modal, Form, Input } from 'antd'

/**
 * 更新部门表单界面
 *
 * @param {*} props
 * @returns
 */
function UpdateStaffForm(props) {
    const { getFieldDecorator } = props.form
    return <Form>
        <Form.Item label="部门名称" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
            {getFieldDecorator('name', {
                initialValue: props.level.name,
                rules: [{ required: true, message: '请输入部门名称' }]
            })(<Input></Input>)}
        </Form.Item>
    </Form>
}

const StaffForm = Form.create({ name: 'staffForm' })(UpdateStaffForm)


/**
 * 更新部门
 *
 * @export
 * @param {*} props
 * @returns
 */
export default function NewUpdateDpt(props) {
    const staffFormRef = React.useRef(null)
    React.useEffect(() => {
        if (staffFormRef.current) {
            staffFormRef.current.resetFields()
        }
    }, [props.level])

    const handlerOk = () => {
        staffFormRef.current.validateFields((error, values) => {
            if (!error) {
                props.onOk({ id: props.level.id, ...values })
            }
        })
    }

    return <Modal centered onOk={handlerOk} title="修改部门"
        onCancel={props.onCancel}
        visible={props.visible}>
        <StaffForm ref={staffFormRef} level={props.level}></StaffForm>
    </Modal>
}