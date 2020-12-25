import React, { useState, useEffect, useCallback } from 'react'
import { Modal, Form, Input, TreeSelect, InputNumber, Select } from 'antd'
import api from '../../http';
import { getJsonTree, filterTag } from '../../util/Tool';
import HttpApi from '../../http/HttpApi';
const { Option } = Select;

const UpdateFormRFID = Form.create({ name: 'form' })((props) => {
    const [treeData, setTreeData] = useState([])
    const [shelfList, setShelfList] = useState([])
    const [rfidList, setRfidLIST] = useState([])
    const [currentStoreRfidIDList, setCurrentStoreRfidIDList] = useState(null)
    const listData = useCallback(async () => {
        if (!props.visible) { return }
        let result = await api.listAllTag()
        if (result.code === 0) {
            result.data = filterTag(result.data, 0)
            let treeResult = result.data.map((item) => { return { id: item.id, pId: item.tids ? item.tids[0] : 0, value: item.id, title: item.name } })
            let temp = getJsonTree(treeResult, 0);
            let afterFilter = temp.filter((item) => item.value !== 1)
            setTreeData(afterFilter)
        }
        let res_shelf = await HttpApi.getNfcShelfList();
        setShelfList(res_shelf)
        let res_rfid = await HttpApi.getRfidList({ hasBinded: false });///没绑定物品的标签
        let res_current_store_rfid = await HttpApi.getRfidListByStoreId({ store_id: props.data.id });///当前物品绑定的标签
        let current_store_rfid_id_list = res_current_store_rfid.map((item) => item.id)
        setRfidLIST([...res_current_store_rfid, ...res_rfid])///二者合并
        setCurrentStoreRfidIDList(current_store_rfid_id_list)
    }, [props.visible, props.data.id])
    useEffect(() => {
        listData();
    }, [listData])
    return (
        <Modal {...props} destroyOnClose>
            <Form labelCol={{ span: 4 }} wrapperCol={{ span: 18 }}>
                <Form.Item label='名称' >
                    {props.form.getFieldDecorator('name', {
                        initialValue: props.data.name,
                        rules: [{ required: true, message: '请输入名称' }]
                    })(<Input placeholder='请输入名称' />)}
                </Form.Item>
                <Form.Item label='单位' >
                    {props.form.getFieldDecorator('unit', {
                        initialValue: props.data.unit || '个',
                        rules: [{ required: true, message: '请输入单位' }]
                    })(<Input placeholder='请输入单位' style={{ width: '100%' }} />)}
                </Form.Item>
                <Form.Item label='RFID' >
                    {props.form.getFieldDecorator('rfids', {
                        initialValue: currentStoreRfidIDList,
                        rules: [{ required: false, message: '请关联上对应的RFID' }]
                    })(<Select
                        showSearch
                        optionFilterProp="children"
                        mode="multiple"
                        style={{ width: '100%' }}
                        placeholder="请选择RFID标签"
                    >
                        {rfidList.map((item, index) => {
                            return <Option key={index} value={item.id}>{item.name}</Option>
                        })}
                    </Select>)}
                </Form.Item>
                <Form.Item label='单价[元]' >
                    {props.form.getFieldDecorator('oprice', {
                        initialValue: props.data.oprice,
                        rules: [{ required: true, message: '请输入单价' }]
                    })(<InputNumber placeholder='请输入单价' min={0} style={{ width: '100%' }} />)}
                </Form.Item>
                <Form.Item label='货架NFC' >
                    {props.form.getFieldDecorator('nfc_shelf_id', {
                        initialValue: props.data.nfc_shelf_id || null,
                        rules: [{ required: false }]
                    })(<Select style={{ width: '100%' }}
                        placeholder="支持搜索"
                        allowClear
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                            option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                    >
                        {shelfList.map((item, index) => { return <Option key={index} value={item.id}>{(item.num ? item.num + '-' : '') + item.name + (item.model ? '-' + item.model : '') + '-' + item.tag_name}</Option> })}
                    </Select>)}
                </Form.Item>
                <Form.Item label='编号' >
                    {props.form.getFieldDecorator('no', {
                        rules: [{ required: false, message: '请输入编号' }]
                    })(<Input placeholder='请输入编号' style={{ width: '100%' }} />)}
                </Form.Item>
                <Form.Item label='属性'>
                    {props.form.getFieldDecorator('tids', {
                        initialValue: props.data.tids || null,
                        rules: [{ required: false, message: '请选择属性' }]
                    })(
                        <TreeSelect
                            multiple
                            treeNodeFilterProp="title"
                            showSearch
                            treeData={treeData}
                            style={{ width: '100%' }}
                            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                            placeholder="请选择属性"
                            // treeCheckable={true}
                            showCheckedStrategy={TreeSelect.SHOW_PARENT}
                        />)}
                </Form.Item>
                <Form.Item label='备注'>{props.form.getFieldDecorator('remark', { initialValue: props.data.remark })(<Input.TextArea rows={4} placeholder='选填' />)}</Form.Item>
            </Form>
        </Modal>
    )
})

export default UpdateFormRFID