import React, { useEffect, useCallback, useState } from 'react'
import HttpApi, { permisstion } from '../../http/HttpApi';
import { Tooltip, Button, Table, message, Icon, Modal } from 'antd';
import NewAddUser from './user/NewAddUser';
import NewUpdateUser from './user/NewUpdateUser';
var dataSourceCopy = [];
export default props => {
    const [dataSource, setDataSource] = useState([])
    const [addVisible, setAddVisible] = useState(false)
    const [updateVisible, setUpdateVisible] = useState(false)
    const [selectItem, setSelectItem] = useState(null)
    const [majorFilter, setMajorFilter] = useState([])
    const [permissionFilter, setPermissionFilter] = useState([])
    const filterBySelectDpt = useCallback(() => {
        if (props.selectdpt && props.selectdpt.id) {
            let afterFilter = dataSourceCopy.filter((user) => {
                return user.level_id === props.selectdpt.id
            });
            setDataSource(afterFilter)
        } else {
            setDataSource(dataSourceCopy)
        }
    }, [props.selectdpt])
    const getUserInfo = useCallback(async () => {
        let userList = await HttpApi.getUserList()
        dataSourceCopy = userList.map((item, index) => { item.key = index; return item })
        filterBySelectDpt()
    }, [filterBySelectDpt])

    const getOptions = useCallback(async () => {
        let major_filter = [];
        let result = await HttpApi.getMajor();
        if (result.code === 0) {
            result.data.forEach((item) => { major_filter.push({ text: item.name, value: item.id }) })
        }
        setMajorFilter(major_filter)
        let permission_filter = [];
        permisstion.forEach((item) => { permission_filter.push({ text: item.name, value: item.value }) })
        setPermissionFilter(permission_filter)
    }, [])

    const addOk = useCallback(async (newValues) => {
        if (newValues.permission) {
            newValues.permission = newValues.permission.join(',')
        }
        newValues.isGroupLeader = newValues.isGroupLeader ? 1 : 0
        let result = await HttpApi.addUser(newValues)
        if (result.code === 0) {
            setAddVisible(false)
            let lastUserId = result.data.id; ///刚刚添加的一个user的数据库id
            let str = '';
            if (newValues.major_id) { ///数组
                newValues.major_id.forEach((major_id) => {
                    str = str + `(${lastUserId},${major_id}),`
                })
                str = str.substring(0, str.length - 1)
                let sql = `insert into user_map_major (user_id,mj_id) VALUES ${str}`
                HttpApi.obs({ sql }, (res) => {
                    if (res.code === 0) {
                        getUserInfo()
                        message.success('添加成功')
                    }
                })
            }
        } else {
            message.error(result.data)
        }
        setAddVisible(false)
    }, [getUserInfo])
    const addCancel = useCallback(() => {
        setAddVisible(false)
    }, [])
    const updateOk = useCallback(async (newValues) => {
        let user_id = newValues.id;
        newValues.isadmin = newValues.isadmin ? 1 : 0
        newValues.isGroupLeader = newValues.isGroupLeader ? 1 : 0
        if (newValues.permission) newValues.permission = newValues.permission.join(',')
        let result = await HttpApi.updateUser({ query: { id: user_id }, update: newValues })
        if (result.code === 0) {
            let sql = `update user_map_major set effective = 0 where user_id = ${user_id}`
            HttpApi.obs({ sql }, (res) => {
                if (res.code === 0) {
                    if (newValues.major_id && newValues.major_id.length > 0) { ///数组
                        let str = ''
                        newValues.major_id.forEach((major_id) => {
                            str = str + `(${user_id},${major_id}),`
                        })
                        str = str.substring(0, str.length - 1)
                        let sql = `insert into user_map_major (user_id,mj_id) VALUES ${str}`
                        HttpApi.obs({ sql }, (res) => {
                            if (res.code === 0) {
                                getUserInfo()
                                message.success('更新成功')
                            }
                        })
                    } else {
                        getUserInfo()
                        message.success('更新成功')
                    }
                }
            })
        }
        setUpdateVisible(false)
    }, [getUserInfo])
    const updateCancel = useCallback(() => {
        setUpdateVisible(false)
    }, [])
    const deleteUser = useCallback(async (id) => {
        let result = await HttpApi.deleteUser(id)
        if (result.code === 0) { message.success('删除成功') } else { message.error('删除失败') }
        getUserInfo()
    }, [getUserInfo])

    useEffect(() => {
        getUserInfo()
        getOptions()
    }, [getUserInfo, getOptions])
    const columns = [
        {
            title: '部门',
            dataIndex: 'level_id',
            width: 100,
            align: 'center',
            onFilter: (value, record) => record.level_id === value,
            render: (text, record) => {
                return <div>{record.level_name}</div>;
            }
        },
        {
            title: '姓名',
            dataIndex: 'name',
            width: 80,
            align: 'center',
            render: (text, record) => (
                <div>{text}</div>
            )
        },
        {
            title: '登陆账户',
            dataIndex: 'username',
            width: 130,
            align: 'center',
            render: (text, record) => (
                <div>{text}</div>
            )
        },
        {
            title: '权限',
            dataIndex: 'permission',
            width: 120,
            filters: permissionFilter,
            align: 'center',
            onFilter: (value, record) => {
                if (record.permission) {
                    return record.permission.split(',').indexOf(String(value)) !== -1
                } else {
                    return false
                }
            },
            render: (text, record) => {
                let result = getPermissionLabByIdStr(text);
                return <div className='hideText lineClamp5'>
                    <Tooltip title={result}>{result || '/'}
                    </Tooltip>
                </div>
            }
        },
        {
            title: '专业',
            dataIndex: 'major_id_all',
            filters: majorFilter,
            align: 'center',
            onFilter: (value, record) => {
                if (record.major_id_all) {
                    return record.major_id_all.split(',').indexOf(String(value)) !== -1
                } else {
                    return false
                }
            },
            render: (text, record) => (
                <div className='hideText lineClamp5'>
                    <Tooltip title={record.major_name_all}>{record.major_name_all || '/'}</Tooltip>
                </div>
            )
        },
        {
            title: '备注',
            dataIndex: 'remark',
            align: 'center',
            render: (text, record) => (
                <div className='hideText lineClamp5'>
                    <Tooltip title={text}>
                        <span>{text || '/'}</span>
                    </Tooltip>
                </div>
            )
        },
        {
            title: '操作',
            dataIndex: 'actions',
            width: 80,
            align: 'center',
            render: (text, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#1890ff', cursor: 'pointer' }} onClick={() => { setUpdateVisible(true); setSelectItem(record) }}><Icon type='edit' />修改</span>
                    <div style={{ borderBottomStyle: 'solid', borderBottomColor: '#D0D0D0', borderBottomWidth: 1, margin: 10 }} />
                    <span style={{ color: '#f5222d', cursor: 'pointer' }} onClick={() => {
                        Modal.confirm({
                            title: `确认要删【${record.name}】吗？`,
                            content: '请自行确保所选的信息的准确性',
                            okText: '删除',
                            okType: 'danger',
                            onOk: function () {
                                deleteUser(record.id)
                            }
                        })
                    }}><Icon type='delete' />删除</span>
                </div>
            )
        }
    ];
    return <div style={styles.root}>
        <div style={styles.header}>
            <span style={{ borderLeft: 4, borderLeftColor: "#3080fe", borderLeftStyle: 'solid', paddingLeft: 5, fontSize: 16, fontWeight: 800 }}>人员</span>
            <Button size="small" type="primary" onClick={() => { setAddVisible(true) }}>新增人员</Button>
        </div>
        <Table
            style={{ marginTop: 10 }}
            size='small'
            bordered
            dataSource={dataSource}
            columns={columns}
            pagination={{
                showTotal: () => {
                    return <div>共{dataSource.length}条记录</div>
                },
                showSizeChanger: true,
                pageSizeOptions: ['10', '50', '100'],
            }}
        />
        <NewAddUser onOk={addOk} onCancel={addCancel} visible={addVisible} level_id={props.selectdpt ? props.selectdpt.id : null} />
        <NewUpdateUser onOk={updateOk} onCancel={updateCancel} visible={updateVisible} staff={selectItem} />
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
}

function getPermissionLabByIdStr(idStr) {
    if (idStr) {
        let nameList = [];
        idStr.split(',').forEach((id) => {
            permisstion.forEach((item) => {
                if (String(item.value) === id) { nameList.push(item.name) }
            })
        })
        return nameList.join(',')
    }
}