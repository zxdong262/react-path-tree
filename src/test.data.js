const _ = require('lodash')

function divide(total, count) {
  let used = 0
  return new Array(count).fill(0).reduce((prev, n, i) => {
    if (i === count - 1) {
      prev.push(total - used)
      return prev
    }
    let rest = total - used
    let curr = Math.floor(_.random(rest * 0.8 / count, rest / count))
    used += curr
    prev.push(curr)
    return prev
  }, [])
}

function genData(level = 5) {
  function rec(node, i) {
    if(i > 4) return node
    let count = _.random(4, 12)
    let weights = divide(node.weight, count)
    node.children = new Array(count).fill(0).map((x, index) => {
      let n = {
        pageName: `page${i}-${index}`,
        layer: i,
        weight: weights[i],
        type: index === count - 1 ? 0 : 1,
        children: []
      }
      return rec(n, i + 1)
    })
    return node
  }
  let root = {
    pageName: 'page1-1',
    layer: 1,
    weight: _.random(100000, 200000),
    children: [],
    type: 1
  }
  return rec(root, 2)
}

let data = genData()
console.log(JSON.stringify(data, null, 2))
module.exports = exports.default = data
