'use strict';

const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http)
const Automerge = require("automerge")
const initialValue = require("./initialSlateValue").initialValue
const Slate = require("slate")
const SlateAutomergeBridge = require("./dist/slateAutomergeBridge")

const PORT  = 5000;
const { slateCustomToJson } = SlateAutomergeBridge
const Value = Slate.Value
let doc
let initdoc
const createNewDocument = function(docId) {
    initdoc = Automerge.init(`server-1234`);
    const initialSlateValue = Value.fromJSON(initialValue);
    doc = Automerge.change(initdoc, "Initialize Slate state", doc => {
        const tmp = slateCustomToJson(initialSlateValue.document);
        doc.note = tmp
    })
}

let connections = {};
let clients = []
let clientIds = []
const historyDoc = new Map();
createNewDocument(1)

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

function showCurrent(){
    console.log('===========================');
    console.log(JSON.stringify(doc));
    console.log('===========================');
}

io.on('connection', function(socket) {
    const clientId = socket.handshake.query.clientId;
    clients.push(socket)
    console.log('client come...', clientId)

    socket.on('connect', function(data) {
        console.log('user connects socket');
    });

    // 异常处理
    socket.on('disconnect', (reason)=>{
        console.log('发生异常: ', reason, clientId)
    })
    socket.on('error', (err)=>{
        console.log('发生错误: ', err, clientId)
    })

    /**
     * @desc Process the Automerge operation from a client.
     */
    socket.on("send_operation", function(data) {
        console.log('receive event send_operation:',data)
        let {clientId, docId, msg} = data
        docId = Number(docId)
        doc = Automerge.applyChanges(doc, data.msg)
        socket.broadcast.emit('send_operation', data)
        showCurrent()
    })
    socket.on('offline', function() {// 客户端暂时离线了
        historyDoc.set(socket, doc)
    });
    socket.on('online', function() {// 客户端由离线变为上线
        const oldDoc = historyDoc.get(socket)
        const change = Automerge.getChanges(oldDoc, doc);
        socket.emit('send_operation', {msg:change})
    });
    socket.on('disconnect', function() {
        socket.disconnect(true)
    });
    // if(clientIds.includes(clientId)){// 断线重连
    //     const change = Automerge.getChanges(Automerge.init(), doc);
    //     socket.emit('send_operation', {msg:change})
    // }else{// 第一次连接
    //     let changes = Automerge.getChanges(initdoc, doc)
    //     socket.emit('init', changes)
    // }
    let changes = Automerge.getChanges(initdoc, doc)
    socket.emit('init', changes)
});


http.listen(PORT, function() {
    console.log('listening on *:', PORT);
});
