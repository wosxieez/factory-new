import React, { useState, useCallback, useEffect } from 'react';
import { Descriptions, Select, Table, Input, InputNumber, Popconfirm, Button, Modal, Icon, message, Drawer } from 'antd';
import api from '../../http';
import moment from 'moment'
import StoreDrawer from './StoreDrawer';
const FORMAT = 'YYYY-MM-DD HH:mm:ss'
const { confirm } = Modal;
const Option = Select.Option;
const major_options = [{ id: 1, label: '测试专业1' }].map((item, index) => { return <Option key={index} value={item.id}>{item.label}</Option> })
/**
 * 退料申请表
 */
export default props => {
    const [dataSource, setDataSource] = useState([])
    const [majorId, setMajorId] = useState(null)
    const [remarkText, setRemarkText] = useState('')
    const [showDrawer, setShowDrawer] = useState(false)
    const addHandler = useCallback(async () => {
        ///打开抽屉
        setShowDrawer(true)
        // const newData = {
        //     key: parseInt(dataSource.length),
        //     store_id: 1,
        //     count: 1
        // };
        // setDataSource([...dataSource, newData])
    }, [])

    const deleteHandle = useCallback(async (key) => {
        setDataSource((dataSource.filter(item => item.key !== key)).map((item, index) => { item.key = parseInt(index); return item }))
    }, [dataSource])

    const changeHandler = useCallback((record, val, targetField) => {
        let copyData = JSON.parse(JSON.stringify(dataSource))
        copyData.forEach(element => {
            if (element.key === record.key) {
                element[targetField] = val
            }
        });
        setDataSource(copyData)
    }, [dataSource])

    const columns = [
        { title: '物料', align: 'center', dataIndex: 'store_name' },
        {
            title: '数量', align: 'center', dataIndex: 'count', width: 120, render: (text, record) => {
                return <InputNumber value={parseInt(text)} min={0} max={1000} onChange={(v) => { changeHandler(record, v, 'count') }} />
            }
        },
        {
            title: '操作', align: 'center', dataIndex: 'actions', width: 70, render: (_, record) => {
                return <Popconfirm title="确认删除吗?" onConfirm={() => deleteHandle(record.key)}>
                    <Button size="small" type='danger'>删除</Button>
                </Popconfirm>
            }
        },
    ]

    return <div style={styles.root}>
        <Descriptions size='small' bordered column={1}>
            <Descriptions.Item label='申请人'>测试人员</Descriptions.Item>
            <Descriptions.Item label='所属专业'><Select style={{ width: '100%' }} value={majorId} onChange={(v) => { setMajorId(parseInt(v)) }}>
                {major_options}
            </Select></Descriptions.Item>
        </Descriptions>
        <Button style={styles.marginTop} type='primary' icon='plus' onClick={addHandler}>选择物料</Button>
        <Table
            style={styles.marginTop}
            size='small'
            bordered
            dataSource={dataSource}
            columns={columns}
            pagination={false}
        />
        <Input.TextArea style={styles.marginTop} placeholder='选填 备注说明' rows={4} value={remarkText} onChange={(e) => { setRemarkText(e.target.value) }} />
        <Button disabled={!(majorId && dataSource.length > 0)} style={{ ...styles.marginTop, float: 'right' }} type='primary' onClick={() => {
            confirm({
                title: '确定提交吗?',
                icon: <Icon type="info-circle" />,
                content: '请自行确保提交信息的准确性',
                onOk: async () => {
                    let content = JSON.parse(JSON.stringify(dataSource)).map((item) => { delete item.key; return item })
                    let sql = `insert into orders (create_user,major_id,type_id,content,remark,code,createdAt) values (1,1,${props.orderType},'${JSON.stringify(content)}','${remarkText}','TW${moment().toDate().getTime()}','${moment().format(FORMAT)}')`
                    let result = await api.query(sql)
                    if (result.code === 0) { message.success('提交成功-等待审核', 3) }
                },
            });
        }}>提交</Button>
        <StoreDrawer showDrawer={showDrawer} onClose={() => { setShowDrawer(false) }} isReture={true} selectStore={(store) => {
            // console.log('store:', store)
            setShowDrawer(false)
            const newData = {
                key: parseInt(dataSource.length),
                store_id: store.id,
                store_name: store.name,
                max_count: store.count,
                count: 1
            };
            console.log('newData:', newData)
            setDataSource([...dataSource, newData])
        }} />
    </div >
}
const styles = {
    root: {
        // backgroundColor: '#F1F2F5',
        width: 600,
        padding: 24,
    },
    marginTop: {
        marginTop: 10
    }
}