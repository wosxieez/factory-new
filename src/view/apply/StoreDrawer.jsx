import React, { useState, useCallback, useEffect } from 'react'
import { Drawer, List, Avatar, Row, Col, Breadcrumb } from 'antd';
import api from '../../http';
import StoreListView from './StoreListView';
export default props => {
    const [storelist, setStoreList] = useState([])
    const [listIsLoading, setListIsLoading] = useState(false)

    const listStore = useCallback(async () => {
        let result = await api.listStore(null);
        let result_tag = await api.listTag(null);
        result.data = result.data.map((item) => { item.type = 'store'; return item })
        result_tag.data = result_tag.data.map((item) => { item.type = 'tag'; return item })
        let temp = [...result_tag.data, ...result.data].map((item, index) => { item.key = index; return item })
        console.log('temp:', temp)
        setStoreList(temp)
    }, [])

    useEffect(() => {
        listStore()
    }, [])
    return <Drawer
        width={400}
        destroyOnClose
        title="物料列表"
        placement='left'
        closable={true}
        onClose={() => { props.onClose(false) }}
        visible={props.showDrawer}
    >
        <StoreListView onClose={props.onClose} selectStore={props.selectStore} isReture={props.isReture} />
    </Drawer>
}

const styles = {
    listItem: {
        cursor: 'pointer'
    },
    avatar: { backgroundColor: '#1890ff', verticalAlign: 'middle' }
}