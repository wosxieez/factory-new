import React, { useCallback, useEffect, useState, useRef } from 'react'
import { Button, Card, Col, message, Row, Tree, Modal, Alert } from 'antd';
import HttpApi from '../../http/HttpApi';
import { getJson2Tree } from '../../util/Tool';
import UpdateAttributeModal2 from './UpdateAttributeModal2';
import AddAttributeModal2 from './AddAttributeModal2';
const { TreeNode, DirectoryTree } = Tree;
const { confirm } = Modal
export default function StoreSupplierView() {
    const addAttributeRef = useRef()
    const updateAttributeRef = useRef()
    const [jsonData, setJsonData] = useState([])
    const [treeData, setTreeData] = useState([])
    const [treeDataExceptSelectKey, setTreeDataExceptSelectKey] = useState([])
    const [selectKeys, setSelectKeys] = useState(null)
    const [selectData, setSelectData] = useState(null)
    const [addvisible, setAddvisible] = useState(false)
    const [updatevisible, setUpdatevisible] = useState(false)

    const renderTreeNodes = useCallback((data) => {
        return data.map(item => {
            if (item.children) {
                return (
                    <TreeNode title={item.num + '-' + item.title} key={item.id} dataRef={item}>
                        {renderTreeNodes(item.children)}
                    </TreeNode>
                );
            }
            return <TreeNode key={item.id} {...item} dataRef={item} title={item.num + '-' + item.title}/>;
        });
    }, [])

    const onSelect = useCallback((keys, { selected, selectedNodes, node, event }) => {
        setSelectData(selectedNodes[0].props)
        setSelectKeys(keys)
    }, [])
    const init = useCallback(async () => {
        let res = await HttpApi.getStoreAttributeList({ table_index: 3 })
        if (res.code === 0) {
            setJsonData(res.data)
            let temp_tree = getJson2Tree(res.data, null);
            setTreeData(temp_tree)
        }
    }, [])
    useEffect(() => { init() }, [init])
    const addHandler = useCallback(async (data) => {
        const pid = selectData ? selectData.dataRef.id : null
        const obj = { pid, name: data.title, num: data.num, table_index: 3 }
        let res = await HttpApi.addAttributeTable(obj)
        if (res.code === 0) {
            message.success('新增成功')
        } else {
            message.error('新增失败')
        }
        init()
    }, [selectData, init])
    const updateHandler = useCallback(async (data) => {
        if (!selectData || !selectData.dataRef.id) { return }
        const id = selectData ? selectData.dataRef.id : null
        const obj = { pid: data.pid, name: data.title, table_index: 3, id }
        let res = await HttpApi.updateAttributeTable(obj)
        if (res.code === 0) {
            message.success('修改成功')
        } else {
            message.error('修改失败')
        }
        init()
    }, [selectData, init])
    const deleteHandler = useCallback(() => {
        confirm({
            title: `确认要删除吗？`,
            okText: '确定',
            okType: 'danger',
            onOk: async function () {
                let res = await HttpApi.deleteAttributeTable({ table_index: 1, id: selectData.dataRef.id })
                if (res.code === 0) {
                    message.success('删除成功')
                } else {
                    message.error('删除失败')
                }
                init()
                setSelectData(null)
                setSelectKeys([])
            }
        })
    }, [selectData, init])
    return (
        <div>
            <Alert type='info' showIcon message='【新增供应商】按钮用于增加一级供应商；选择目标供应商后，点击【新增子供应商】创建下属供应商' />
            <Row style={styles.root}>
                <Col span={12}>
                    <Button type='primary' size='small' icon='plus' onClick={() => { setSelectKeys(null); setSelectData(null); setAddvisible(true) }}>新增供应商</Button>
                    <DirectoryTree selectedKeys={selectKeys} defaultExpandAll={true} onSelect={onSelect} >{renderTreeNodes(treeData)}</DirectoryTree>
                </Col>
                <Col span={12}>
                    {selectData ?
                        <Card title={(selectData ? '当前选择【' + selectData.title + '】' : '')} style={{ width: '100%', marginBottom: 20 }}>
                            <p><Button type='primary' size='small' icon='plus' onClick={() => { setAddvisible(true) }}>新增子供应商</Button></p>
                            <p><Button type='default' size='small' icon='edit' onClick={() => {
                                let afterFilterList = jsonData.filter((item) => { return item.id !== selectData.dataRef.id })
                                let temp_tree = getJson2Tree(afterFilterList, null);
                                setTreeDataExceptSelectKey(temp_tree)
                                setUpdatevisible(true)
                            }}>修改该供应商</Button></p>
                            <p><Button type='danger' size='small' icon='delete' onClick={deleteHandler}>删除该供应商</Button></p>
                        </Card>
                        : null}
                </Col>
            </Row>
            <AddAttributeModal2 ref={addAttributeRef} title='新增供应商' visible={addvisible} onCancel={() => { setAddvisible(false) }} onOk={() => {
                addAttributeRef.current.validateFields(async (error, data) => {
                    if (!error) {
                        addHandler(data)
                        setAddvisible(false)
                    }
                })
            }} />
            <UpdateAttributeModal2 ref={updateAttributeRef} title='修改供应商' treeData={treeDataExceptSelectKey} data={selectData} visible={updatevisible} onCancel={() => { setUpdatevisible(false) }} onOk={() => {
                updateAttributeRef.current.validateFields(async (error, data) => {
                    if (!error) {
                        updateHandler(data)
                        setUpdatevisible(false)
                        setSelectData(null)
                        setSelectKeys([])
                    }
                })
            }} />
        </div>
    )
}

const styles = {
    root: {
        marginTop: 10
    },
    left: {
        width: 500
    },
    right: {
        with: 500,
    }
}