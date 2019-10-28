'use script';

(function() {
    
    let data = "no data";
    let svg = "";

    const measurements = {
        width: 800,
        height: 600, 
        margin: 50 
    };

    window.onload =  function() {
        svg = d3.select('body')
            .append('svg')
            .attr('height', measurements.height)
            .attr('width', measurements.width);

        // Load data
        d3.csv("dataEveryYear.csv")
            .then((csvdata) => {
                data = csvdata;
                allYearsData = csvdata;
            })
            .then(() => {
                let years = [...new Set(allYearsData.map((row) => row["time"]))];

                let dropdown = d3.select('body')
                    .append('select')
                    .attr('id', 'selectedYear')
                    .on('change', function() {
                        makeScatterPlot(this.value);
                    });
                
                let options = dropdown.selectAll('option')
                    .data(years)
                    .enter()
                    .append('option')
                    .text((d) => {return d;});
                
                makeScatterPlot(Math.min(years))
                
                
            })
          
    }

    function makeScatterPlot(year) {
        filterByYear(year);
        svg.html("");

        // get array of values for both the axes
        let fertility_rate = data.map((row) => parseFloat(row["fertility_rate"]));
        let life_expectancy = data.map((row) => parseFloat(row["life_expectancy"]));

        // find axes limits
        let axesLimits = findMinMax(fertility_rate, life_expectancy);

        // draw axes 
        let funcs = drawAxes(axesLimits, "fertility_rate", "life_expectancy", svg, {min: measurements.margin, max: measurements.width - measurements.margin}, {min: measurements.margin, max: measurements.height - measurements.margin})

        // plot data as points on the graph and add toollkit functionality 
        plotData(funcs);

        //draw title and makr axes labels 
        makeLabels();
    }

    function makeLabels() {
        console.log(data);
        svg.append('text')
        .attr('x', 50)
        .attr('y', 30)
        .attr('id', "title")
        .style('font-size', '14pt')
        .text("Life Expectancy vs Fertility Rate")
    
      svg.append('text')
        .attr('x', 300)
        .attr('y', 600)
        .attr('id', "x-label")
        .style('font-size', '10pt')
        .text('Fertility Rates (Avg Children per Woman)')
    
      svg.append('text')
        .attr('transform', 'translate(15, 300)rotate(-90)')
        .style('font-size', '10pt')
        .text('Life Expectancy (years)')
    }

    function plotData(funcs) {
        // get population data as array
        let pop_data = data.map((row) => +row["pop_mlns"])
        let pop_limits = d3.extent(pop_data)
        // make size scaling function for population
        let pop_map_func = d3.scaleLinear()
            .domain([pop_limits[0], pop_limits[1]])
            .range([3, 20])

        // mapping functions
        let xMap = funcs.x
        let yMap = funcs.y

        // make tooltip
        let div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)

        // append data to svg and plot
        svg.selectAll('.dot')
            .data(data)
            .enter()
            .append('circle')
                .attr('cx', xMap)
                .attr('cy', yMap)
                .attr('r', (d) => pop_map_func(d["pop_mlns"]))
                .attr('fill', "#4286f4")
                // add tooltip functionality to points
                .on("mouseover", (d) => {
                    div.transition()
                        .duration(200)
                        .style("opacity", .9);
                    div.html('<pre>' + 
                            'Country:         ' + d.location + '<br/>' + 
                            'Year:            ' + d.time + '<br/>' + 
                            'Fertility Rate:  ' + d.fertility_rate + '<br/>' + 
                            'Life Expectancy: ' + d.life_expectancy + '<br/>' + 
                            'Population:      ' + numberWithCommas(d["pop_mlns"]*1000000) + 
                            '</pre>'
                        )
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                })
                .on("mouseout", (d) => {
                    div.transition()
                        .duration(500)
                        .style("opacity", 0);
                });
            
            d3.select(".tooltip")
                .select(".tooltip")
                .style("color", "white");

    }

    
    

    function drawAxes(limits, x, y, svg, rangeX, rangeY) {
        // return x value from a row of data
        let xValue = function(d) { return +d[x] }

        // function to scale x value
        let xScale = d3.scaleLinear()
            .domain([limits.xMin, limits.xMax]) // give domain buffer room
            .range([rangeX.min, rangeX.max])

        // xMap returns a scaled x value from a row of data
        let xMap = function(d) { return xScale(xValue(d)) }

        // plot x-axis at bottom of SVG
        let xAxis = d3.axisBottom().scale(xScale)
        svg.append("g")
            .attr('transform', 'translate(0, ' + rangeY.max + ')')
            .attr('id', "x-axis")
            .call(xAxis)

        // return y value from a row of data
        let yValue = function(d) { return +d[y]}

        // function to scale y
        let yScale = d3.scaleLinear()
            .domain([limits.yMax, limits.yMin]) // give domain buffer
            .range([rangeY.min, rangeY.max])

        // yMap returns a scaled y value from a row of data
        let yMap = function (d) { return yScale(yValue(d)) }

        // plot y-axis at the left of SVG
        let yAxis = d3.axisLeft().scale(yScale)
        svg.append('g')
            .attr('transform', 'translate(' + rangeX.min + ', 0)')
            .attr('id', "y-axis")
            .call(yAxis)

        // return mapping and scaling functions
        return {
            x: xMap,
            y: yMap,
            xScale: xScale,
            yScale: yScale
        }
    }

    function filterByYear(year) {
        data = allYearsData.filter((row) => row['time'] == year);
    }

    function findMinMax(x, y) {
        // get min/max x values
        let xMin = d3.min(x);
        let xMax = d3.max(x);

        // get min/max y values
        let yMin = d3.min(y);
        let yMax = d3.max(y);

        // return formatted min/max data as an object
        return {
        xMin : xMin,
        xMax : xMax,
        yMin : yMin,
        yMax : yMax
        }
    }
    // format numbers
    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
})();
