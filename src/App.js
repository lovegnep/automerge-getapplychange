import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Client from './client'

class App extends Component {
  render() {
    console.log('begin load....')
    return (
      <div className="App">
        <Client initialDocId={1} clientId={1} />
      </div>
    );
  }
}

export default App;
