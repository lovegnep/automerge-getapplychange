import { applyAutomergeOperations, applySlateOperations, automergeJsonToSlate, slateCustomToJson} from "./libs/slateAutomergeBridge"
import { Editor } from "slate-react"
import { Value } from "slate"
import Automerge from "automerge"
import EditList from "slate-edit-list"
import Immutable from "immutable";
import io from 'socket.io-client';
import React from "react"
import uuid from 'uuid'
// const url = 'http://thoughts-release.project.ci'
const url = 'http://47.98.136.138:40001'
// const url = 'http://localhost:5000'
// const url = 'http://172.16.11.26:5000'
const initialValue = require("./initialSlateValue").initialValue
const plugin = EditList();
const plugins = [plugin];

function renderNode(props) {
    const { node, attributes, children, editor } = props;
    const isCurrentItem = plugin.utils
        .getItemsAtRange(editor.value)
        .contains(node);

    switch (node.type) {
        case "ul_list":
            return <ul {...attributes}>{children}</ul>;
        case "ol_list":
            return <ol {...attributes}>{children}</ol>;

        case "list_item":
            return (
                <li
                    className={isCurrentItem ? "current-item" : ""}
                    title={isCurrentItem ? "Current Item" : ""}
                    {...props.attributes}
                >
                    {props.children}
                </li>
            );

        case "paragraph":
            return <div {...attributes}>{children}</div>;
        case "heading":
            return <h1 {...attributes}>{children}</h1>;
        default:
            return <div {...attributes}>{children}</div>;
    }
}

class Client extends React.Component {

    constructor(props) {
        super(props)
        this.doc = Automerge.init()
        this.oldDoc = null; //记录offline那一刻的doc
        this.recordDoc = null;// 记录断线前的老doc
        this.clientId = `client:${this.props.clientId}-${uuid()}`
        this.onChange = this.onChange.bind(this)
        this.socket = null

        this.state = {
            value: null,
            online: false,
            docId: this.props.initialDocId,
            docNameList:[],
            curDocName:''
        }
    }

    componentDidMount = () => {
        console.log('componentDidMount:...')
        this.connect()
    }

    componentWillUnmount = () => {
        this.disconnect()
    }

    /**************************************
     * UPDATE CLIENT FROM LOCAL OPERATION *
     **************************************/
    onChange = ({ operations, value }) => {
        this.setState({ value: value })
        let res = applySlateOperations(this.doc, this.state.docId, operations, this.clientId)
        this.doc = res.docNew
        if(res.changes.length <= 0) {
            return
        }
        console.log('发送change:', res.changes)
        this.socket.emit('send_operation', res.changes);
    }
    showCurrent = () =>{
        return;
        console.log('===========================');
        console.log(JSON.stringify(this.doc));
        console.log('===========================');
    }

    init = (data) => {
        console.log('receive event init:',data);
        this.doc = Automerge.applyChanges(this.doc, data)

        const newValue = automergeJsonToSlate({"document": {...this.doc.note}})
        const value = Value.fromJSON(newValue)
        this.setState({ value: value })
    }

    docNameList = (list) => {
        this.setState({docNameList: list})
    }

    connect = () => {
        if (!this.socket) {
            console.log('connecting...')
            this.clientId = `client:${this.props.clientId}-${uuid()}`
            this.socket = io(url, {query: {clientId: this.clientId},forceNew:true})
        }
        this.socket.on('connect',()=>{
            console.log('连接成功');
            this.setState({online:true})
        })
        if (!this.socket.hasListeners("send_operation")) {
            this.socket.on("send_operation", this.updateWithRemoteChanges.bind(this))
        }


        // 异常处理
        this.socket.on('error',(err)=>{
            console.log('发生错误：',err);
        })
        this.socket.on('disconnect',(reason)=>{
            console.log('发生disconnect事件：', reason);
            this.setState({online:false})
        })
        this.socket.on('reconnect',(e)=>{
            console.log('重连成功：' , e);
            this.setState({online:true})
            if(this.state.curDocName){//之前已经加入过房间
                const change = Automerge.getChanges(Automerge.init(), this.doc);
                console.log('发送joinRoom')
                this.socket.emit('joinRoom', this.state.curDocName, (flag)=>{
                    console.log('send_operation')
                    this.socket.emit('send_operation', change)
                    this.socket.emit('init')
                })
            }
        })

        this.socket.on('docList', this.docNameList)
        this.socket.on('init', this.init)
        console.log('done')
    }

    /**
     * @function sendMessage
     * @desc Disconnect the Automerge.Connection and disconnect from the socket.
     * @param {Object} msg - The Automerge message to send.
     * @param {number} docId - The ID of the document to join.
     */
    sendMessage = (msg, docId) => {
        console.log('sendMessage:', msg, docId);
        if (!docId) { docId = this.state.docId }
        const data = { clientId: this.clientId, docId: docId, msg }
        if (this.socket) {
            this.socket.emit("send_operation", data)
        }
    }

    updateWithRemoteChanges = (msg) => {
        console.log(`Client ${this.clientId} received message:`)
        const currentDoc = this.doc
        this.doc = Automerge.applyChanges(this.doc, msg)

        const opSetDiff = Automerge.diff(currentDoc, this.doc)
        if (opSetDiff.length !== 0) {
            let change = this.state.value.change()
            change = applyAutomergeOperations(opSetDiff, change, () => { this.updateSlateFromAutomerge() });
            if (change) {
                this.setState({ value: change.value })
            }
        }else{
            console.log('没有改变')
        }
        this.showCurrent()
    }

    updateSlateFromAutomerge = () => {
        const doc = this.doc
        const newJson = automergeJsonToSlate({
            "document": { ...doc.note }
        })
        this.setState({ value: Value.fromJSON(newJson) })
    }
    disconnect = ()=>{
        if (this.socket.hasListeners("send_operation")) {
            this.socket.removeListener("send_operation")
        }
        // 记录下离线时刻的doc，待上线时方便计算离线期间的本地的change
        this.oldDoc = this.doc;

        // 告诉服务端自己离线了，后期考虑优化，因为客户端对离线不可知
        this.socket.emit('offline')
        this.setState({online:false})
    }
    reconnect = () =>{
        if (!this.socket.hasListeners("send_operation")) {
            this.socket.on("send_operation", this.updateWithRemoteChanges.bind(this))
        }
        const offlineChange = Automerge.getChanges(this.oldDoc, this.doc);
        this.socket.emit('online')

        this.setState({online:true}, ()=>{
            this.sendMessage(offlineChange, this.state.docId)
        })
    }
    toggleConnection = ()=>{
        const { online } = this.state;
        if(online){
            this.disconnect()
        }else{
            this.reconnect()
        }
    }
    onDocChange = (docName) => {
        if(docName === this.state.curDocName) {
            return;
        }
        this.socket.emit('joinRoom', docName, (flag)=>{
            this.doc = Automerge.init()
            this.setState({curDocName:docName})
            this.socket.emit('init')
        })
    }
    render = () => {
        const {docNameList, curDocName} = this.state
        let body;
        if (this.state.value !== null) {
            body = (
                <Editor
                    key={this.clientId}
                    ref={(e) => { this.editor = e }}
                    renderNode={renderNode}
                    onChange={this.onChange}
                    plugins={plugins}
                    value={this.state.value}
                />
            )
        }
        return (
            <div style={{width:'100%'}}>
                <div style={{margin:30}}>
                    <span style={{marginRight:20}}>当前状态：{this.state.online ? 'online' : 'offline'}</span>
                </div>
                <div style={{width:'20%', float:'left', border:'1px solid'}}>
                    <p style={{textAlign:'center'}}>请选择文档</p>
                    {docNameList.map((docName)=>{
                        return <p key={docName} style={curDocName === docName ? {fontWeight:"bold"} : {}} onClick={()=>{this.onDocChange(docName)}}>{docName}</p>
                    })}
                </div>
                <div style={{width:'75%',float:'left', border:'1px solid', padding:10}}>
                    <p style={{textAlign:'center'}}>在此处编辑</p>
                    {body}
                </div>
            </div>
        )
    }
}
export default Client
