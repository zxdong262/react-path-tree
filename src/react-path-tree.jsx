import React, {PropTypes} from 'react'
import _ from 'lodash'
import * as d3 from 'd3'
import deepCopy from 'json-deep-copy'

const formatter = d3.format('.2f')
const createId = (layer, index, pid) => {
  return `layer${layer}#${index}@${pid}`
}
const removeSameLayerId = (activeNodeIds, layer) => {
  return activeNodeIds.filter(id => {
    let count = parseInt(id.split('#')[0].replace('layer', ''), 10)
    return count < layer
  })
}
const sorter = (a, b) => {
  return b.type * b.weight - a.type * a.weight
}

const flatData = data => {
  let res = []
  function rec (node, pid, index) {
    let {layer, pageName, weight, children, type, rate} = node
    let prop = layer - 1
    if (!res[prop]) {
      res[prop] = []
    }
    let id = createId(layer, index, pid)
    res[prop].push({
      layer, pageName, weight,
      id,
      type,
      rate: formatter((rate || 1) * 100) + '%',
      originalRate: rate,
      pid
    })
    if(children.length) children.sort(sorter).forEach((c, i) => rec(c, id, i))
  }
  rec(data, 'root', 0)
  return res
}

const lineFactory = d3.line().curve(d3.curveCatmullRom.alpha(0.90))
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

const getRealIndex = (ind, rightLength) => {
  if (rightLength < 9) return ind
  if( ind === rightLength - 1) {
    return 7
  } else if (ind >= 6) {
    return 6
  } else return ind
}

export default class PathTree extends React.Component {

  static propTypes = {
    data: PropTypes.object.isRequired,
    onNodeClick: PropTypes.func,
    direction: PropTypes.string,
    blockStyle: PropTypes.object
  }

  static defaultProps = {
    onNodeClick: function() {},
    direction: 'normal',
    blockStyle: {
      width: 180,
      height: 76,
      marginBottom: 16
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      activeNodeIds: [],
      data: flatData(props.data),
      direction: props.direction,
      activeLayers: 2,
      loading: {}
    }
  }

  componentDidMount() {
    this.updateActive()
  }

  componentWillReceiveProps(nextProps) {
    let {data} = nextProps
    if (!_.isEqual(data, this.props.data)) {
      this.setState({
        data: flatData(data),
        activeLayers: 2,
        direction: nextProps.direction,
        activeNodeIds: [createId(data.layer, 0, 'root')]
      })
    }
  }

  componentDidUpdate() {
    this.renderSvgDom()
  }

  updateActive = () => {
    let {data} = this.state
    if (!_.isArray(data)) return
    let id = _.get(data, '[0][0].id')
    let activeNodeIds = [id]
    this.setState({activeNodeIds}, this.renderSvgDom)
  }

  renderSvgDom = () => {
    let {data} = this.state
    if (!_.isArray(data)) return
    let {activeLayers} = this.state
    let okIds = getOkIds(Math.min(activeLayers, data.length))
    d3.selectAll('svg.pt-svg path').remove()
    return okIds.forEach(this.updateSvgDom)
  }

  updateSvgDom = info => {
    let {data, activeNodeIds, direction} = this.state
    let {id, left, right} = info
    let leftId = _.find(activeNodeIds, d => _.startsWith(d, `layer${left}`))
    let itemLeft = _.find(data[left - 1], {id: leftId})
    let poolLeft = data[left - 1].filter(it => it.pid === itemLeft.pid)
    let indexLeft = _.findIndex(
      poolLeft,
      a => a.id === leftId
    )
    indexLeft = getRealIndex(indexLeft, poolLeft)
    let rightId = _.find(activeNodeIds, d => _.startsWith(d, `layer${right}`))
    let itemRight = _.find(data[right - 1], {pid: leftId}) || {}
    let poolRight = data[right - 1].filter(it => it.pid === itemRight.pid)
    if (!poolRight.length) return
    let indexRight = _.findIndex(
      poolRight,
      a => a.id === rightId
    )
    indexRight = getRealIndex(indexRight, poolRight)
    let {width, height, marginBottom} = this.props.blockSytle
    let startLeft = direction === 'normal'
      ? 0
      : width
    let startRight = direction === 'normal'
      ? width
      : 0
    let startPoint = [startLeft, computeHeight(height, marginBottom, indexLeft)]
    let rightLength = poolRight.length
    rightLength = rightLength > 8 ? 8 : rightLength
    let dataArray = new Array(rightLength).fill(0).map((n ,i) => {
      let target = [startRight, computeHeight(height, marginBottom, i)]
      let middle = direction === 'normal'
        ? [target[0] - 5, target[1]]
        : [target[0] + 5, target[1]]
      return [
        startPoint,
        middle,
        target
      ]
    })
    let hasLeave = _.find(poolRight, {type: 0})

    dataArray.forEach((points, ind) => {
      let stoke = ind === indexRight
        ? '#d4b9ff'
        : '#f0f0f0'
      if (hasLeave && ind === rightLength - 1) {
        stoke = '#fff2e5'
      }
      let stokeWidth = ind !== indexRight
        ? 5
        : 3

      d3.select(`#${id} .pt-svg`)
      .append('path')
      .datum(points)
      .attr('fill', 'rgba(0,0,0,0)')
      .attr('stroke', stoke)
      .attr('stroke-width', stokeWidth)
      .attr('d', lineFactory(points))
      .enter()
    })

  }

  renderSvg = i => {
    return (
      <div className="pt-svg-wrapper" id={`svg-${i + 1}-${i + 2}`}>
        <svg className="pt-svg" />
      </div>
    )
  }

  onClickNode = node => {
    return () => {
      let {layer, id, type} = node
      if (!type) return
      let {activeNodeIds} = this.state
      let update = {}
      update.activeLayers = layer + 1
      update.activeNodeIds = removeSameLayerId(activeNodeIds, layer)
      update.activeNodeIds.push(id)
      this.setState(update)
    }
  }

  renderNode = (node, i) => {
    if (!node) return null
    let {activeNodeIds} = this.state
    let {rate, pageName, weight, id, userIds} = node
    let active = this.state.activeNodeIds.includes(id)
    let key = i + '@' + id
    let title = i === 'leave'
      ? '离开'
      : pageName
    let cls = `pt-node pt-node-${i} ${active ? 'active' : 'not-active'}`
    let onClick = activeNodeIds.includes(id)
      ? _.noop
      : this.onClickNode(node)

    if (!userIds || !userIds.length) {
      return this.renderNodeDom(key, cls, title, rate, weight, onClick)
    }

    return this.renderNodeDom('', cls, title, rate, weight, onClick)

  }

  onClickRow = record => {
    this.onClickNode(record)()
  }

  getRowClassName = record => {
    let {activeNodeIds} = this.state
    return activeNodeIds.includes(record.id)
      ? 'pa-row-active'
      : ''
  }

  renderOther = (rest) => {
    if (!rest.length) return null
    let rate = rest.reduce((prev, curr) => {
      return prev + curr.originalRate
    }, 0)
    rate = formatter(rate * 100) + '%'
    return this.renderNodeDom(
      'pt-node-other', 'pt-node',
      'Other', rate, 0, _.noop
    )
  }

  renderNodeDom = (key, cls, pageName, rate, weight, onClick) => {
    return (
      <div
        className={cls}
        key={key}
        onClick={onClick}
        title={pageName}
      >
        <h3 className="elli">{pageName}</h3>
        <p className="elli">{rate}</p>
        <div className="pt-node-output" />
        <div className="pt-node-input" />
      </div>
    )
  }

  nodeRender = (arr, i) => {
    let shouldRender = this.state.activeLayers >= i + 1
    if (!shouldRender) return null
    let {activeNodeIds, direction} = this.state
    let pid = i
      ? _.find(activeNodeIds, d => {
        return _.startsWith(d, `layer${i}`)
      })
      : 'root'
    if (!pid) return null
    let leave = _.find(arr, {type: 0, pid})
    let filtered = _.filter(arr, {type: 1, pid})
    let len = filtered.length
    let top6 = filtered.slice(0, 6)
    let rest = filtered.slice(6, len)
    let totalWeight = _.sum(arr.map(s => s.weight))
    let prop = direction === 'normal'
      ? 'left'
      : 'right'
    let style = {
      [prop]: this.props.blockStyle.width * 2 * i
    }
    return (
      <div
        className="pt-layer"
        key={`pt-layer${i}`}
        style={style}
      >
        <div className="pt-nodes">
          {top6.map(this.renderNode)}
          {this.renderOther(rest, totalWeight)}
          {this.renderNode(leave, 'leave')}
        </div>
        {this.renderSvg(i)}
      </div>
    )
  }

  render () {
    let {data, activeLayers, direction, height} = this.state
    let count = activeLayers < 4 ? 4 : activeLayers
    let style0 = {
      height
    }
    let style1 = {
      width: count * this.props.blockStyle.width * 2
    }
    return (
      <div
        className="path-tree-box pd3x pd2y"
        id="path-tree-box"
        style={style0}
      >
        <div
          className={`path-tree-wrapper ${direction}`}
          style={style1}
          id="path-tree-wrapper"
        >
          {data.map(this.nodeRender)}
        </div>
      </div>
    )
  }

}
