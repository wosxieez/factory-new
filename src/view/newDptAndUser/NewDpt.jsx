import React, { useEffect, useCallback, useState } from 'react'
import HttpApi from '../../http/HttpApi';
import { List, Avatar, Dropdown, Menu, Icon, Button, message, Modal } from 'antd';
import NewAddDpt from './dpt/NewAddDpt';
import NewUpdateDpt from './dpt/NewUpdateDpt';
export default props => {
    const [dataSource, setDataSource] = useState([])
    const [addVisible, setAddVisible] = useState(false)
    const [updateVisible, setUpdateVisible] = useState(false)
    const [selectDpt, setSelectDpt] = useState({})

    const getDptInfo = useCallback(async () => {
        let result = await HttpApi.getLevel();
        if (result.code === 0) {
            setDataSource(result.data.map((item, index) => { item.key = index; return item }))
        }
    }, [])
    useEffect(() => {
        getDptInfo()
    }, [getDptInfo])
    const addOk = useCallback(async (v) => {
        let result = await HttpApi.addLevel(v)
        if (result.code === 0) {
            message.success('新增成功')
            getDptInfo()
        }
        setAddVisible(false)
    }, [getDptInfo])
    const addCancel = useCallback(() => {
        setAddVisible(false)
    }, [])
    const updateOk = useCallback(async (v) => {
        const id = v.id;
        delete v.id
        let result = await HttpApi.updateLevel({ query: { id }, update: v })
        if (result.code === 0) {
            message.success('修改成功')
            getDptInfo()
        }
        setUpdateVisible(false)
    }, [getDptInfo])
    const updateCancel = useCallback(() => {
        setUpdateVisible(false)
    }, [])
    const deleteDpt = useCallback(async (item) => {
        Modal.confirm({
            title: `确认要删除【${item.name}】吗？`,
            content: '请自行确保所选的信息的准确性',
            okText: '删除',
            okType: 'danger',
            onOk: async function () {
                let result = await HttpApi.deleteLevel(item.id)
                if (result.code === 0) {
                    message.success('删除成功')
                    getDptInfo()
                }
            }
        })
    }, [getDptInfo])
    return <div style={styles.root}>
        <div style={styles.header}>
            <span style={{ cursor: 'pointer', borderLeft: 4, borderLeftColor: "#3080fe", borderLeftStyle: 'solid', paddingLeft: 5, fontSize: 16, fontWeight: 800 }} onClick={() => {
                props.selectDpt(null);
            }}>部门</span>
            <Button size="small" type="primary" onClick={() => { setAddVisible(true) }}>新增部门</Button>
        </div>
        <List
            style={{ marginTop: 10 }}
            pagination
            dataSource={dataSource}
            renderItem={item => {
                return (
                    <List.Item style={styles.listItem}>
                        <List.Item.Meta
                            onClick={() => {
                                props.selectDpt(item);
                            }}
                            avatar={<Avatar style={styles.avatar}>{item.name}</Avatar>}
                            title={item.name}
                            description={item.remark}
                        />
                        <div style={styles.icon_more}>
                            <Dropdown
                                overlay={
                                    <Menu
                                        style={{ width: 120, textAlign: 'center' }}
                                        onClick={e => {
                                            if (e.key === '2') {
                                                deleteDpt(item)
                                            } else {
                                                setSelectDpt(item)
                                                setUpdateVisible(true)
                                            }
                                        }}>
                                        <Menu.Item key='1'>
                                            <span style={{ color: '#1890ff' }}><Icon type='edit' />修改</span>
                                        </Menu.Item>
                                        <Menu.Item key='2'>
                                            <span style={{ color: '#f5222d' }}><Icon type='delete' />删除</span>
                                        </Menu.Item>
                                    </Menu>
                                }
                                placement='bottomRight'
                                trigger={['click']}>
                                <Icon type='more' style={styles.icon_more2} />
                            </Dropdown>
                        </div>
                    </List.Item>
                )
            }}
        />
        <NewAddDpt visible={addVisible} onOk={addOk} onCancel={addCancel} />
        <NewUpdateDpt visible={updateVisible} onOk={updateOk} onCancel={updateCancel} level={selectDpt} />
    </div>
}
const styles = {
    root: {
        padding: '12px 24px 12px 24px',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    icon_more: {
        width: 70,
        height: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    icon_more2: { fontSize: 18 },
    listItem: {
        cursor: 'pointer'
    },
    avatar: { backgroundColor: '#1890ff', verticalAlign: 'middle' }
}
