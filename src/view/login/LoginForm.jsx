import React, { useCallback } from 'react'
import { Button, Form, Input, message, Icon } from 'antd'
import HttpApi from '../../http/HttpApi';
import { checkPasswordChart } from '../../util/Tool';
// import api from '../../http/index'

const LoginForm = Form.create({ name: 'form' })(props => {
    const handleSubmit = useCallback(async (e) => {
        // let result = await HttpApi.test();
        // console.log('result:', result)
        // return;
        e.preventDefault();
        props.form.validateFields(async (err, values) => {
            if (!err) {
                ///老的登录接口
                // const response = await api.login(values.username, values.password)
                // if (response.code === 0) {
                //     localStorage.setItem('user', JSON.stringify(response.data))
                //     localStorage.setItem('token', response.token)
                //     const response2 = await api.getCompany()
                //     if (response2.code === 0 && response2.data) { localStorage.setItem('cname', response2.data.name) }
                //     props.history.push('/main/storeview')
                // } else {
                //     message.error(response.data, 3)
                // }
                let is_legal = checkPasswordChart(values.password)
                if (!is_legal) { message.error('非法密码，请重新输入密码'); return }
                ///新的根据工厂数据库中的用户数据表
                let response = await HttpApi.getUserList(values.username, values.password);
                if (response.length > 0) {
                    localStorage.setItem('user', JSON.stringify(response[0]))
                    // props.history.push('/main/storeview')
                    props.history.replace('/main/storeview')
                } else {
                    message.error('账号或密码可能错误')
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
