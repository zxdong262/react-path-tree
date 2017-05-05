import React, { Component } from 'react'
import Lib from './react-path-tree.jsx'
import data from './test.data'
import * as d3 from 'd3'
export default class App extends Component {

  state = {
    data
  }

  render() {

    return (
      <div style={{
        minHeight: 5000,
        position: 'relative'
      }}>
        <Lib {...this.state} d3={d3} />
      </div>
    )
  }
  
}