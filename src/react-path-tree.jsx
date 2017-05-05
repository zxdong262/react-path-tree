import React, {PropTypes} from 'react'
import './style.styl'
import _ from 'lodash'
import * as d3 from 'd3'
const blockProps = {
  width: 180,
  height: 78,
  marginBottom: 16
}
const formatter = d3.format('.2f')
const createId = (layer, pageName) => {
  return `layer${layer}@${pageName}`
}

const sorter = (a, b) => {
  return b.type * b.weight - a.type * a.weight
}

const flatData = data => {
  console.log('here')
  let res = []
  function rec (node, pid, weightTotal) {
    let {layer, pageName, weight, children, type} = node
    let prop = layer - 1
    if (!res[prop]) {
      res[prop] = []
    }
    let id = createId(layer, pageName)
    res[prop].push({
      layer, pageName, weight,
      id,
      type,
      rate: formatter(weight * 100 / weightTotal) + '%',
      pid
    })
    console.log(weightTotal)
    let total = _.sum(children.map(c => c.weight))
    if(children.length) children.sort(sorter).forEach(c => rec(c, id, total))
  }
  rec(data, 'root', data.weight)
  console.log('here1')
  return res
}
const lineGenerator = d3.line().curve(d3.curveCardinal)

const getOkIds = min => {
  let res = []
  for (let i = 1; i < min;i ++) {
    res.push({
      left: i,
      right: i + 1,
      id: `svg-${i}-${i + 1}`
    })
  }
  return res
}

const computeHeight = (height, marginBottom, index) => {
  return (index + 0.5) * height + index * marginBottom
}

class PathTree extends React.Component {

  static propTypes = {
    data: PropTypes.object.isRequired,
    onNodeClick: PropTypes.func
  }

  static defaultProps = {
    onNodeClick: function() {}
  }

  constructor(props) {
    super(props)
    this.state = {
      activeNodeIds: [],
      data: flatData(props.data),
      activeLayers: 2
    }
  }

  componentDidMount() {
    this.updateActive()
  }

  componentDidUpdate() {
    this.renderSvgDom()
  }

  willComponentRecieveProps(nextProps) {

  }

  updateActive = () => {
    let {data} = this.state
    let id = _.get(data, '[0][0].id')
    let activeNodeIds = [id]
    this.setState({activeNodeIds}, this.renderSvgDom)
  }

  renderSvgDom = () => {
    let {data} = this.state
    let {activeLayers} = this.state
    let okIds = getOkIds(Math.min(activeLayers, data.length))
    return okIds.forEach(this.updateSvgDom)
  }

  updateSvgDom = info => {
    let {data, activeNodeIds} = this.state
    let {id, left, right} = info
    let leftId = _.find(activeNodeIds, d => d.indexOf(`layer${left}`))
    let index0 = _.findIndex(data[left - 1], a => a.id === leftId)
    let rightId = _.find(activeNodeIds, d => d.indexOf(`layer${right}`))
    let index1 = _.findIndex(data[right - 1], a => a.id === rightId)

    let {width, height, marginBottom} = blockProps
    let startPoint = [0, computeHeight(height, marginBottom, index0)]
    let rightLength = data[right - 1].length
    rightLength = rightLength > 8 ? 8 : rightLength
    let dataArray = new Array(rightLength).fill(0).map((n ,i) => {
      return [
        startPoint,
        [width, computeHeight(height, marginBottom, i)]
      ]
    })

    d3.select(`#${id}`).selectAll('svg').remove()
    dataArray.forEach(points => {
      d3
      .select(`#${id}`)
      .append('svg')
      .append('path')
      .attr('d', lineGenerator(points))
      .enter()
    })

  }

  renderSvg = i => {
    let {width, height, marginBottom} = blockProps
    let h = height * 8 + 7 * marginBottom
    return (
      <div className="pa-svg" id={`svg-${i + 1}-${i + 2}`} />

    )
  }

  renderNode = (node, i = 'last') => {
    if (!node) return null
    let {rate, pageName, weight, id, pid, type, layer} = node
    let active = this.state.activeNodeIds.includes(id)
    let key = i + '@' + id
    let title = type === 0
      ? '离开'
      : pageName
    let cls = `pa-node ${active ? 'active' : 'not-active'}`
    return this.renderNodeDom(key, cls, pageName, rate, weight)
  }

  renderOther = (rest, totalWeight, flat) => {
    if (!rest.length) return null
    let weight = rest.reduce((prev, curr) => {
      return prev + curr.weight
    }, 0)
    let rate = formatter(weight * 100 / totalWeight) + '%'
    return this.render('pa-node-other', 'pa-node', '其他', rate, weight)
  }

  renderNodeDom = (key, cls, pageName, rate, weight) => {
    return (
      <div className={cls} key={key}>
        <h3>{pageName}</h3>
        <p>{rate}</p>
        <div>会话数{weight}</div>
        <div className="pa-node-output"></div>
        <div className="pa-node-input"></div>
      </div>
    )
  }

  nodeRender = (arr, i) => {
    let shouldRender = this.state.activeLayers >= i + 1
    if (!shouldRender) return null
    let {activeNodeIds} = this.state
    let pid = i
      ? _.find(activeNodeIds, d => {
          return d.includes(`layer${i}`)
        })
      : 'root'
    if (!pid) return null
    let leave = _.find(arr, {type: 0, pid})
    let filtered = _.filter(arr, {type: 1, pid})
    let len = filtered.length
    let top6 = filtered.slice(0, 6)
    let rest = filtered.slice(6, len)
    let totalWeight = _.sum(arr.map(s => s.weight))
    console.log('here3')
    //debugger
    return (
      <div className="pt-layer" key={`pt-layer${i}`}>
        <div className="pt-nodes">
          {top6.map(this.renderNode)}
          {this.renderOther(rest, totalWeight)}
          {this.renderNode(leave, 'last')}
        </div>
        {this.renderSvg(i)}
      </div>
    )
  }

  render () {
    let {data} = this.state
    console.log('here2')
    return (
      <div className="path-tree-wrapper">
        {data.map(this.nodeRender)}
      </div>
    )
  }

}

module.exports = exports.default = PathTree
