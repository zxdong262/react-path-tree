
import Dtree from '../dist/react-path-tree'
import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import data from '../src/test.data.js'
const pack = require('../package.json')

describe(pack.name, function () {

	let scope, sandboxEl

	beforeEach(function () {
		sandboxEl = $('<div>').attr('id', 'sandbox').appendTo($('body'))
	})

	afterEach(function() {
		$('#sandbox').remove()
	})

	function nextTick(run) {
		setTimeout(run, 100)
	}
	
	function prepare(_props = {}) {

		let mountNode = sandboxEl[0]
		class App extends Component {
			constructor(props) {
				super(props)
				this.state = $.extend({}, {
					data
				}, _props)
			}


			render() {
				return <Dtree {...this.state} />
			}
		}

		ReactDOM.render(
			<App />,
			mountNode
		)

	}

	// Tests

	describe('basic', function () {

		it('should 1 + 0 = 1', function(done) {
			prepare()
			setTimeout(function() {
				expect($('.pa-node').length > 1).to.equal(true)
				done()
			}, 100)
		})

	})

	//end
})
