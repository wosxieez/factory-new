import React, { useState, useCallback, useEffect } from 'react'
import HttpApi from '../../http/HttpApi'
import { Button, Col, Form, Input, Row, Table, TreeSelect } from 'antd'
import { getJson2Tree } from '../../util/Tool'
import moment from 'moment'
const FORMAT = 'YYYY-MM-DD HH:mm:ss'
export default () => {
    const [nfclist, setNfclist] = useState([])
    const [loading, setLoading] = useState(false)
    const init = useCallback(async () => {
        setLoading(true)
        let res = await HttpApi.getNFCShelflist()
        let tempList = res.map((item, index) => { item.key = index; return item });
        setNfclist(tempList)
        setLoading(false)
    }, [])
    const startSearch = useCallback(async (v) => {
        let res = await HttpApi.getNFCShelflist(v)
        let tempList = res.map((item, index) => { item.key = index; return item });
        setNfclist(tempList)
    }, [])
    useEffect(() => {
        init();
    }, [init])
    const columns = [
        {
            title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 200, render: (text) => {
                return text ? moment(text).format(FORMAT) : '-'
            }
        },
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
                if (record.store_area_name) {
                    return record.store_area_name
                } else if (text) {
                    return text
                } else {
                    return '-'
                }
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
                    loading={loading}
                    columns={columns}
                    dataSource={nfclist}
                    size='small'
                    bordered
                    pagination={{
                        total: nfclist.length,
                        showTotal: () => {
                            return <div>共{nfclist.length}条记录</div>
                        },
                        showSizeChanger: true,
                        showQuickJumper: true,
                        pageSizeOptions: ['10', '50', '100'],
                    }}
                />
            </div>
        </div>
    )
}
const Searchfrom = Form.create({ name: 'form' })(props => {
    const [areaTreeData, setAreaTreeData] = useState([])
    const getType = useCallback(async () => {
        let res1 = await HttpApi.getStoreAttributeList({ table_index: 0 })
        if (res1.code === 0) {
            let temp_tree = getJson2Tree(res1.data, null);
            setAreaTreeData(temp_tree)
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
                        if (element) { tempObj[key] = element }
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
                    {props.form.getFieldDecorator('store_area_id', {
                        rules: [{ required: false }]
                    })(<TreeSelect
                        allowClear
                        treeNodeFilterProp='title'
                        showSearch
                        treeData={areaTreeData}
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