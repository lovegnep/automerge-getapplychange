import { applyAutomergeOperations, applySlateOperations, automergeJsonToSlate, slateCustomToJson} from "./libs/slateAutomergeBridge"
import { Editor } from "slate-react"
import { Value } from "slate"
import Automerge from "automerge"
import EditList from "slate-edit-list"
import Immutable from "immutable";
import io from 'socket.io-client';
import React from "react"
import uuid from 'uuid'

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
        this.clientId = `client:${this.props.clientId}-${uuid()}`
        this.onChange = this.onChange.bind(this)
        this.socket = null

        this.state = {
            value: null,
            online: true,
            docId: this.props.initialDocId,
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
        console.log('onChange:',operations, value);
        this.setState({ value: value })
        let res = applySlateOperations(this.doc, this.state.docId, operations, this.clientId)
        this.doc = res.docNew
        this.sendMessage(res.changes, this.state.docId)
        this.showCurrent();
    }
    showCurrent = () =>{
        console.log('===========================');
        console.log(JSON.stringify(this.doc));
        console.log('===========================');
    }
    /**************************************
     * SOCKET OPERATIONS                  *
     **************************************/
    init = (data) => {
        console.log('receive event init:',data);
        this.doc = Automerge.applyChanges(this.doc, data)

        const newValue = automergeJsonToSlate({"document": {...this.doc.note}})
        const value = Value.fromJSON(newValue)
        this.setState({ value: value })
    }
    /**
     * @function connect
     * @desc Connect to the server, setup listeners, open the Automerge
     *    connection and emit "connect" and "did_connect" events.
     */
    connect = () => {
        if (!this.socket) {
            console.log('connecting...')
            this.clientId = `client:${this.props.clientId}-${uuid()}`
            this.socket = io("http://172.16.11.26:5000", {query: {clientId: this.clientId}})
        }

        if (!this.socket.hasListeners("send_operation")) {
            this.socket.on("send_operation", this.updateWithRemoteChanges.bind(this))
        }
        this.socket.on('error',function(err){
            console.log(err);
        })
        this.socket.on('init', this.init)
        this.socket.emit("connect", {clientId: this.clientId})
        this.socket.emit("did_connect", {clientId: this.clientId})
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

    /***************************************
     * UPDATE CLIENT FROM REMOTE OPERATION *
     ***************************************/
    /**
     * @function updateWithRemoteChanges
     * @desc Update the Automerge document with changes from another client
     * @param {Object} msg - A message created by Automerge.Connection
     */
    updateWithRemoteChanges = (msg) => {
        console.log(`Client ${this.clientId} received message:`)
        console.log(msg)
        const currentDoc = this.doc
        this.doc = Automerge.applyChanges(this.doc, msg.msg)

        const opSetDiff = Automerge.diff(currentDoc, this.doc)
        if (opSetDiff.length !== 0) {
            this.editor.change((change)=>{
                let { value } = change
                value = applyAutomergeOperations(opSetDiff, value, () => { this.updateSlateFromAutomerge() });
                if (value) {
                    this.setState({ value: value })
                }
            })
            // let change = this.state.value.change()
            // change = applyAutomergeOperations(opSetDiff, change, () => { this.updateSlateFromAutomerge() });
            // if (change) {
            //     this.setState({ value: change.value })
            // }
        }else{
            console.log('没有改变')
        }
        this.showCurrent()
    }

    /**********************************************
     * Fail-safe for Automerge->Slate conversion  *
     **********************************************/
    /**
     * @function updateSlateFromAutomerge
     * @desc Directly update the Slate Value from Automerge, ignoring Slate
     *     operations. This is not preferred when syncing documents since it
     *     causes a re-render and loss of cursor position (and on mobile,
     *     a re-render drops the keyboard).
     */
    updateSlateFromAutomerge = () => {
        const doc = this.doc
        const newJson = automergeJsonToSlate({
            "document": { ...doc.note }
        })
        this.setState({ value: Value.fromJSON(newJson) })
    }
    onKeyDown = (event, data, change) => {
        // 若按下的键不是 shift + "7" 则不返回 change。
        if (event.which != 55 || !event.shiftKey) return

        // 阻止插入 "&" 至编辑内容的行为。
        event.preventDefault()

        // 在当前光标位置插入 "and" 字符以更改 state。
        change.insertText('and')
        return true
    }
    render = () => {
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
            <div>
                <span>hehe</span>
                {body}
            </div>
        )
    }
}
export default Client
