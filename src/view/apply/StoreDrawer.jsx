import React from 'react'
import { Drawer } from 'antd';
import StoreListView from './StoreListView';
export default props => {
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
