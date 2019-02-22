const Automerge = require("automerge")
const { fromJS } = require('immutable')
const { Backend, Frontend } = Automerge

function getClock(doc){
    return Frontend.getBackendState(doc).getIn(['opSet', 'clock']).toJS()
}

function getMissingChanges(doc, clock = {}){
    const state = Frontend.getBackendState(doc)
    return Backend.getMissingChanges(state, fromJS(clock))
}

exports = {
    getClock: getClock,
    getMissingChanges: getMissingChanges
}

Object.assign(module.exports, exports)