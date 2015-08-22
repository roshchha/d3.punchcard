
(function(global) {
    function moduleDefinition(d3) {

        function D3punchcard(options) {

            // Reverse the data as we draw
            // from the bottom up.
            this.data = options.data.reverse();
            this.element = options.element;
            this.disableRowHeadersHover = options.disableRowHeadersHover || false;
            this.disableOriginHover = options.disableOriginHover || false;
            this.originHoverAction = options.originHoverAction;
            this.tipText = options.tipText || '';
            this.originClick = options.originClick;
			this.originColor = options.originColor || '#000';

            // Find the max value to normalize the size of the circles.
            this.max = d3.max(this.data, function(array) {

                // we ignore the first element as it is metadata
                return d3.max(array.slice(1), function(obj) {

                    // and we only return the interger verion of the value, not the key
                    return parseFloat(obj.value);
                });
            });

            // set the upperlimit if we have it
            // otherwise use the max
            if (options.upperLimit) {
                this.upperLimit = options.upperLimit;
            } else {
                this.upperLimit = this.max;
            }
            return this;
        }

        D3punchcard.prototype.originHoverActionEnum = {
            text: 0, //not implemented. Like this - http://bl.ocks.org/kaezarrex/10122633
            tooltip: 1
        }
        D3punchcard.prototype.draw = function(options) {

            //var origHoverAction = this.originHoverAction == 'text' ? this.originHoverActionEnum.text : this.originHoverActionEnum.tooltip;
			var origHoverAction = this.originHoverActionEnum.tooltip;
			
            var _this = this,
                margin = 10,
                lineHeight = 5,
                width = options.width,
                paneLeft = 40,
                paneRight = width - paneLeft,
                sectionHeight = 35,
                height = (sectionHeight * this.data.length),
                sectionWidth = paneRight / this.data[0].length,
                circleRadius = 14,
                x,
                y,
                punchcard,
                punchcardRow,
                xAxis,
                rScale,
                rowCount = this.data.length;

            // X-Axis.
            x = d3.scale.linear().domain([0, this.data[0].length - 1]).
            range([paneLeft + (sectionWidth / 2), paneRight + (sectionWidth / 2)]);

            // Y-Axis.
            y = d3.scale.linear().domain([0, this.data.length - 1]).
            range([0, height - sectionHeight]);

            rScale = d3.scale.linear()
                .domain([0, this.upperLimit, this.max])
                .range([0, circleRadius, circleRadius]);

            // these functions hide and show the circles and text values
            function handleRowMouseover() {
                var g = d3.select(this).node().parentNode;
                d3.select(g).selectAll('circle').style('display', 'none');
                d3.select(g).selectAll('text.value').style('display', 'block');
            }

            function handleRowMouseout() {
                var g = d3.select(this).node().parentNode;
                d3.select(g).selectAll('circle').style('display', 'block');
                d3.select(g).selectAll('text.value').style('display', 'none');
            }

            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function(d) {
                    return _this.tipText == "" ? "<strong>" + d.value + "</strong>" : _this.tipText.replace("{dataValue}", d.value);
                })

            // The main SVG element.
            punchcard = d3.select(this.element)
                .html('')
                .append('svg')
                .attr('width', width)
                .attr('height', height + (margin * 3))
                .append('g');

            // register tip function on svg element
            punchcard.call(tip);

            // create the x axis holder
            xAxis = punchcard.selectAll('.row')
                .data([this.data[0].slice(1)])
                .enter()
                .append('g')
                .attr('class', 'xaxis');

            // create the x axis line
            xAxis.
            append('line').
            attr('x1', 0).
            attr('x2', width).
            attr('y1', (margin * 3)).
            attr('y2', (margin * 3)).
            style('stroke-width', 1).
            style('stroke', '#efefef');


            // create x-axis ticks
            xAxis.
            selectAll('line.tick').
            data(function(d, i) {
                return d;
            }).
            enter().
            append('line').
            attr('class', 'tick').
            attr('x1', function(d, i) {
                return paneLeft + x(i);
            }).
            attr('x2', function(d, i) {
                return paneLeft + x(i);
            }).
            attr('y1', function(d, i) {
                return margin * 2;
            }).
            attr('y2', function(d, i) {
                return (margin * 3);
            }).
            style('stroke-width', 1).
            style('stroke', '#efefef');

            // create x-axis tick text.
            xAxis.
            selectAll('.rule').
            data(function(d, i) {
                return d;
            }).
            enter().
            append('text').
            attr('class', 'rule').
            attr('x', function(d, i) {
                return paneLeft + x(i);
            }).
            attr('y', margin + lineHeight).
            attr('text-anchor', 'middle').
            text(function(d) {
                return d.key;
            });

            // create rows
            punchcardRow = punchcard.selectAll('.row')
                .data(this.data)
                .enter()
                .append('g')
                .attr('class', 'row')
                .attr('dyIdx', function(d, i) {
                    return (rowCount - i);
                }) //becuase we have reversed the data while building the graph
                .attr('transform', function(d, i) {
                    var ty = height - y(i) - (sectionHeight / 2) + (margin * 3);
                    return 'translate(0, ' + ty + ')';
                });

            // create row divinding lines 
            punchcardRow.
            selectAll('line').
            data([0]).
            enter().
            append('line').
            attr('x1', 0).
            attr('x2', width).
            attr('y1', (sectionHeight / 2)).
            attr('y2', (sectionHeight / 2)).
            style('stroke-width', 1).
            style('stroke', '#efefef');


            // create row headers
            var textHeaders = punchcardRow.
            selectAll('.textheader').
            data(function(d, i) {

                // we only return the first element of each array
                // which contains the header text
                return [d[0]];
            }).
            enter().
            append('text').
            attr('x', 0).
            attr('y', function(d, i) {
                return lineHeight;
            }).
            attr('class', 'textheader').
            attr('text-anchor', 'left').
            text(function(d, i) {
                    return d.value;
                });
			if(!this.disableRowHeadersHover){
				textHeaders.on('mouseover', handleRowMouseover)
                textHeaders.on('mouseout', handleRowMouseout);

			}
                
            // draw circles for each row
            var punchCardCircle = punchcardRow.
            selectAll('circle').
            data(function(d, i) {
                return d.slice(1);
            }).
            enter().
            append('circle').
            style('fill', this.originColor).
            attr('r', function(d, i) {
                return rScale(parseFloat(d.value));
            }).
            attr('transform', function(d, i) {
                var tx = paneLeft + x(i);
                return 'translate(' + tx + ', 0)';
            });

			if(!this.disableOriginHover){
            // draw labels for hover on circles
				var dotLabels = punchcardRow.selectAll('.dot-label')
					.data(function(d, i) {
						return d.slice(1);
					})

				var dotLabelEnter = dotLabels.enter().append('g')
					.attr('class', 'dot-label')
					.attr('dxIdx', function(d, i) {
						return i + 1;
					})
					.style('cursor','pointer')
					.on('mouseover', tip.show)
					.on('mouseout', tip.hide)

				dotLabelEnter.append('text')
					.style('text-anchor', 'middle')
					.style('fill', '#ffffff')
					.style('opacity', 0)

				if (this.originClick) {
					dotLabelEnter.on('click', function() {
						xIdx = d3.select(this).attr('dxIdx');
						yIdx = d3.select(this.parentNode).attr('dyIdx');
						_this.originClick.call(null, xIdx, yIdx);
					});
				}
				dotLabels.exit().remove()
				dotLabels
					.attr('transform', function(d, i) {
						var tx = paneLeft + x(i);
						return 'translate(' + tx + ', 5)';
					})
					.select('text')
					.text(function(d, i) {
						return d.value
					})

			}
            // draw text values for each row
            punchcardRow.
            selectAll('text.value').
            data(function(d, i) {
                return d.slice(1);
            }).
            enter().
            append('text').
            attr('class', 'value').
            style('display', 'none').
            text(function(d, i) {
                return d.value;
            }).
            attr('text-anchor', 'middle').
            attr('x', function(d, i) {
                return paneLeft + x(i);
            }).
            attr('y', function(d, i) {
                return lineHeight;
            });

            return this;
        };

        /**
         * Expose D3punchcard
         */

        return D3punchcard;
        // ---------------------------------------------------------------------------

    }
    if (typeof exports === 'object') {
        // node export
        module.exports = moduleDefinition(require('d3'));
    } else if (typeof define === 'function' && define.amd) {
        // amd anonymous module registration
        define(['d3'], moduleDefinition);
    } else {
        // browser global
        global.D3punchcard = moduleDefinition(global.d3);
    }
}(this));