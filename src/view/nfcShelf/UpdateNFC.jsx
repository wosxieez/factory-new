import { Form, Input, Modal, TreeSelect } from 'antd'
import React, { useRef, useEffect, useCallback, useState } from 'react'
import api from '../../http'
import { filterTag, getJsonTree } from '../../util/Tool'

export default (props) => {
    const updateNFCForm = useRef(null)
    const [treeData, setTreeData] = useState([])
    const init = useCallback(async () => {
        let result = await api.listAllTag()
        if (result.code === 0) {
            result.data = filterTag(result.data, 0)
            let treeResult = result.data.map((item) => { return { id: item.id, pId: item.tids ? item.tids[0] : 0, value: item.id, title: item.name } })
            let temp_tree = getJsonTree(treeResult, 0);
            let area_tree = temp_tree.filter((item) => item.id === 1)
            setTreeData(area_tree)
        }
    }, [])
    useEffect(() => {
        init();
    }, [init])
    return (
        <Modal
            destroyOnClose
            title='NFC信息编辑'
            visible={props.visible}
            onCancel={async () => {
                props.onCancel()
            }}
            onOk={() => {
                updateNFCForm.current.validateFields(async (error, values) => {
                    if (!error) {
                        props.onOk(values)
                    }
                })
            }}
        >
            <NFCForm ref={updateNFCForm} data={props.data} treeData={treeData} />
        </Modal>
    )
}

/**
 * 更新部门表单界面
 *
 * @param {*} props
 * @returns
 */
function UpdateNFCForm(props) {
    var data = props.data;
    const { getFieldDecorator } = props.form
    return <Form>
        <Form.Item label="名称" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
            {getFieldDecorator('name', {
                initialValue: data ? data.name : null,
                rules: [{ required: true, message: '请输入名称' }]
            })(<Input></Input>)}
        </Form.Item>
        <Form.Item label="区域" labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
            {getFieldDecorator('tag_id', {
                initialValue: data ? data.tag_id : null,
                rules: [{ required: true, message: '请选择区域' }]
            })(<TreeSelect
                treeNodeFilterProp="title"
                // showSearch
                treeData={props.treeData}
                style={{ width: '100%' }}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                placeholder="请选择区域"
                showCheckedStrategy={TreeSelect.SHOW_PARENT}
            />)}
        </Form.Item>
    </Form>
}

const NFCForm = Form.create({ name: 'nfcForm' })(UpdateNFCForm)