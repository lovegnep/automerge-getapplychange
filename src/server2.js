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
        doc.note = slateCustomToJson(initialSlateValue.document);
    })
}

let clients = []

createNewDocument(1)

let clientdoc = Automerge.init()
clientdoc = Automerge.applyChanges(clientdoc, Automerge.getChanges(initdoc, doc))

doc = Automerge.applyChanges(doc, Automerge.getChanges(Automerge.init(), clientdoc))

