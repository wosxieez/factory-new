import React, { useCallback } from 'react'
import { Button, Form, Input, message, Icon } from 'antd'
import api from '../../http';

const LoginForm = Form.create({ name: 'form' })(props => {
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        props.form.validateFields(async (err, values) => {
            if (!err) {
                const response = await api.login(values.username, values.password)
                if (response.code === 0) {
                    localStorage.setItem('token', response.token)
                    const response2 = await api.getCompany()
                    if (response2.code === 0 && response2.data) { localStorage.setItem('cname', response2.data.name) }
                    props.history.push('/main/departmentview')
                } else {
                    message.error(response.data, 3)
                }
            }
        });
    }, [props.form, props.history])
    return (
        <Form style={{ marginTop: 50 }} wrapperCol={{ span: 24 }} onSubmit={handleSubmit}>
            <Form.Item hasFeedback>
                {props.form.getFieldDecorator('username', {
                    rules: [{ required: true, message: '请输入账号' }]
                })(<Input placeholder='请输入账号' />)}
            </Form.Item>
            <Form.Item hasFeedback>
                {props.form.getFieldDecorator('password', {
                    rules: [{ required: true, message: '请输入密码' }]
                })(<Input placeholder='请输入密码' type="password" />)}
            </Form.Item>
            <Form.Item>
                <Button style={{ width: '100%' }} type="primary" htmlType="submit">登录
                <Icon type="login" />
                </Button>
            </Form.Item>
        </Form>
    )
})

export default LoginForm
