import React, { useState, useCallback, useEffect } from 'react'
import HttpApi from '../../http/HttpApi'
import { Button, Col, Divider, Form, Input, message, Modal, Row, Table, TreeSelect } from 'antd'
import UpdateNFC from './UpdateNFC'
import api from '../../http'
import { filterTag, getJsonTree } from '../../util/Tool'

export default () => {
    const [nfclist, setNfclist] = useState([])
    const [visible, setVisible] = useState(false)
    const [currentItem, setCurrentItem] = useState({})
    const init = useCallback(async () => {
        let res = await HttpApi.getNFCShelflist()
        let tempList = res.map((item, index) => { item.key = index; return item });
        setNfclist(tempList)
    }, [])
    const updateHandler = useCallback(async (values) => {
        let res = await HttpApi.updateNfcShelf({ code: currentItem.code, name: values.name, tagId: values.tag_id, model: values.model, num: values.num })
        if (res) { message.success('修改成功'); init(); } else { message.error('修改失败') }
        setVisible(false)
    }, [currentItem.code, init])
    const startSearch = useCallback(async (v) => {
        let res = await HttpApi.getNFCShelflist(v)
        let tempList = res.map((item, index) => { item.key = index; return item });
        setNfclist(tempList)
    }, [])
    useEffect(() => {
        init();
    }, [init])
    const columns = [
        { title: 'NFC编码', dataIndex: 'code', key: 'code' },
        {
            title: '货架编号', dataIndex: 'num', key: 'num',
            render: (text, record) => {
                return text || '-'
            }
        },
        {
            title: '名称', dataIndex: 'name', key: 'name',
            render: (text, record) => {
                return text || '-'
            }
        },
        {
            title: '型号', dataIndex: 'model', key: 'model',
            render: (text, record) => {
                return text || '-'
            }
        },
        {
            title: '区域', dataIndex: 'tag_name', key: 'tag_name',
            render: (text, record) => {
                return text || '-'
            }
        },
        {
            title: '操作', dataIndex: 'action', key: 'action', width: 180,
            render: (text, record) => {
                return <div>
                    <Button type='primary' size='small' icon='edit' onClick={() => { setVisible(true); setCurrentItem(record) }}>编辑</Button>
                    <Divider type='vertical' />
                    <Button type='danger' size='small' icon='delete' onClick={() => {
                        Modal.confirm({
                            title: `确认要删除当前对象吗？`,
                            okText: '确定',
                            okType: 'danger',
                            onOk: async function () {
                                let res = await HttpApi.deleteNfcShelf({ id: record.id })
                                if (res) { message.success('删除成功'); init(); } else { message.error('删除失败') }
                            }
                        })
                    }}>删除</Button>
                </div>
            }
        },
    ]
    return (
        <div style={styles.root}>
            <div style={styles.header}>
                <Searchfrom startSearch={startSearch} />
            </div>
            <div style={styles.body}>
                <Table
                    columns={columns}
                    dataSource={nfclist}
                    size='small'
                    bordered
                    pagination={false}
                />
                <UpdateNFC visible={visible} onCancel={() => { setVisible(false) }} data={currentItem} onOk={updateHandler} />
            </div>
        </div>
    )
}
const Searchfrom = Form.create({ name: 'form' })(props => {
    const [treeData, setTreeData] = useState([])
    const getType = useCallback(async () => {
        let result2 = await api.listAllTag()
        if (result2.code === 0) {
            result2.data = filterTag(result2.data, 0)
            let treeResult = result2.data.map((item) => { return { id: item.id, pId: item.tids ? item.tids[0] : 0, value: item.id, title: item.name } })
            let temp_tree = getJsonTree(treeResult, 0);
            let area_tree = temp_tree.filter((item) => item.id === 1)
            setTreeData(area_tree)
            // setTreeData(getJsonTree(treeResult, 0))
        }
    }, [])
    const listAllOptions = useCallback(async () => {
        getType()
    }, [getType])
    useEffect(() => {
        listAllOptions()
    }, [listAllOptions])
    const itemProps = { labelCol: { span: 6 }, wrapperCol: { span: 18 } }
    return <Form onSubmit={(e) => {
        e.preventDefault();
        props.form.validateFields((err, values) => {
            let tempObj = {};
            if (!err) {
                for (const key in values) {
                    if (values.hasOwnProperty(key)) {
                        const element = values[key];
                        if (element && element.length > 0) { tempObj[key] = element }
                    }
                }
                props.startSearch(tempObj);
            }
        });
    }}>
        <Row>
            <Col span={6}>
                <Form.Item label='编号' {...itemProps}>
                    {props.form.getFieldDecorator('num', {
                        rules: [{ required: false }]
                    })(<Input allowClear placeholder="请输入编号" />)}
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label='名称' {...itemProps}>
                    {props.form.getFieldDecorator('name', {
                        rules: [{ required: false }]
                    })(<Input allowClear placeholder="请输入名称" />)}
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label='型号' {...itemProps}>
                    {props.form.getFieldDecorator('model', {
                        rules: [{ required: false }]
                    })(<Input allowClear placeholder="请输入型号" />)}
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item label='区域' {...itemProps}>
                    {props.form.getFieldDecorator('tag_id', {
                        rules: [{ required: false }]
                    })(<TreeSelect
                        allowClear
                        multiple
                        treeNodeFilterProp='title'
                        showSearch
                        treeData={treeData}
                        style={{ width: '100%' }}
                        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                        placeholder='请选择区域-支持搜索'
                        showCheckedStrategy={TreeSelect.SHOW_PARENT}
                    />)}
                </Form.Item>
            </Col>
        </Row>
        <Row>
            <Col span={24}>
                <div style={{ textAlign: 'right' }}>
                    <Button icon='search' type="primary" htmlType="submit">查询</Button>
                    <Button icon='redo' style={{ marginLeft: 8 }} onClick={() => { props.form.resetFields() }}>清除</Button>
                </div>
            </Col>
        </Row>
    </Form>
})
const styles = {
    root: {
        backgroundColor: '#F1F2F5',
        width: '100%',
        height: '100vh'
    },
    header: {
        backgroundColor: '#FFFFFF',
        padding: '24px 24px 24px 24px',
    },
    body: {
        backgroundColor: '#FFFFFF',
        padding: 24,
        marginTop: 16
    },
    marginBottom: { marginBottom: 10 }
}