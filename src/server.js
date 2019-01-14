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
    initdoc = Automerge.init();
    const initialSlateValue = Value.fromJSON(initialValue);
    doc = Automerge.change(initdoc, "Initialize Slate state", doc => {
        doc.note = slateCustomToJson(initialSlateValue.document);
    })
}

let clients = new Map()

createNewDocument(1)

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

function showCurrent(){
    return;
    console.log('===========================');
    console.log(JSON.stringify(doc));
    console.log('===========================');
}

io.on('connection', function(socket) {
    const clientId = socket.handshake.query.clientId;
    clients.set(clientId, socket)
    console.log('client come...', clientId)

    socket.on('connect', function(data) {
        console.log('user connects socket');
    });

    // 异常处理
    socket.on('disconnect', (reason)=>{
        console.log('发生异常: ', reason, clientId)
        socket.removeAllListeners()
        clients.delete(clientId)
        socket = null
    })
    socket.on('error', (err)=>{
        console.log('发生错误: ', err, clientId)
    })

    // 处理客户端发送来的change
    socket.on("send_operation", function(data) {
        //console.log('receive event send_operation:',data)
        let {clientId, docId, msg} = data
        docId = Number(docId)
        doc = Automerge.applyChanges(doc, data.msg)
        socket.broadcast.emit('send_operation', data)
        showCurrent()
    })

    let changes = Automerge.getChanges(initdoc, doc)
    socket.emit('init', changes)
});


http.listen(PORT, function() {
    console.log('listening on *:', PORT);
});
