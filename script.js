/// URL for API JSON ///
var gamesURL = 'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/video-game-sales-data.json';
var moviesURL = 'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/movie-data.json';
var ksURL = 'https://cdn.rawgit.com/freeCodeCamp/testable-projects-fcc/a80ce8f9/src/data/tree_map/kickstarter-funding-data.json';

/// Call back /// 
// will update the page depending on the anchor chosen on page
// also requests JSON and creates graph in real time
function renderPage(url) {

    // remove any previous 
    var main = document.getElementById('main');
    while (main.firstChild) {
        main.removeChild(main.firstChild);
    }

    // Add title and description again
    d3.select('#main')
        .append('h1')
        .attr('id', 'title');
    d3.select('#main')
        .append('p')
        .attr('id', 'description');

    const h = 600; 
    const w = 1200;

    const svg = d3.select('#main')
                .append('svg')
                .attr('width', w)
                .attr('height', h);

    const treemap = d3.treemap()            // intialize treemap
                    .size([w,h])            // sizing for treemap
                    .paddingOuter(1);

    /// tooltip creation ///

    let tooltip = d3.select('body')
                    .append('div')
                    .attr('id', 'tooltip')
                    .style('position', 'absolute')
                    .style('z-index', '10')
                    .style('visibility', 'hidden')

    /// AJAX request using d3 ///  

    d3.json(url).then( (data) => {

        /// Change Title and Description ///

        if (data.name === "Kickstarter") {

            d3.select('#title')
                .text('Kickstarter Sale');
            d3.select('#description')
                .text('Top 100 Most Pledged Kickstarter Campaigns Grouped By Category');

        } else if (data.name === "Movies") {

            d3.select('#title')
                .text('Movie Sale');
            d3.select('#description')
                .text('Top 100 Highest Grossing Movies Grouped By Genre');

        } else {

            d3.select('#title')
                .text('Video Game Sale');
            d3.select('#description')
                .text('Top 100 Most Sold Video Games Grouped By Platform');

        }

        // set up hierarchy and root for tree
        let root = d3.hierarchy(data);

        root.sum( function(d) {     // traverses tree and sum up each child node
            return d.value;
        });

        root.sort(function(a, b) {  // sort tree in ascending height
            return b.value - a.value; 
        });

        treemap(root);              // set root of treemap after summing up value

        // create color ranges for tiles and legend
        let categories = data.children.map(d => d.name); 
        
        /* // color option interpolater 
        let color = d3.scaleLinear()
                        .domain([0, categories.length - 1])
                        .range(['#E7F7D4', '#F7D4F6'])
                        .interpolate(d3.interpolateHslLong) */

        // manually create color range. 
        const color = ['#FF2E51','#FF3A2E','#FF682F','#FF9730','#FFC531','#FFF232','#DEFF33','#B1FF34','#84FF35',
        '#58FF35','#36FF40','#37FF6D','#38FF99','#39FFC6','#3AFFF1','#3BE0FF','#3CB5FF' ,'#3D8BFF', '#403dff'];

        let colorMap = {};

        categories.forEach( function(key, i) {
            colorMap[key] = color[i];
        });

        // create treemap 
        d3.select('svg')            // constructor tree map
            .selectAll('g')         // join our nodes and to rect and update attributes
            .data(root.leaves())    // just use leaf for each cell data
            .enter()
            .append('g')
            .attr('class', 'group') // group all <g> together to add text later
            .append('rect')
            .attr('x', function(d) { return d.x0; })
            .attr('y', function(d) { return d.y0; })
            .attr('width', function(d) { return d.x1 - d.x0; })
            .attr('height', function(d) { return d.y1 - d.y0; }) 
            .attr('class', 'tile')
            .attr('data-name', d => d.data.name)
            .attr('data-category', d => d.data.category)
            .attr('data-value', d => d.value)
            .style('fill', d => colorMap[d.data.category])
            .on('mouseover', d => { // have tootip respond <rect>. Above layer (<foreignObject>) pointer-event is disabled.
                tooltip.attr('data-value', d.value);  
                
                let format = `Name: ${d.data.name}<br>Category: ${d.data.category}<br>Value: ${d.value}`;
                tooltip.html(format);

                return tooltip.style("top", d3.event.pageY - 15 + "px")
                                .style("left", d3.event.pageX + 5 + "px")
                                .style('visibility', 'visible');
            })
            .on('mousemove', () => { // dynamically move tooltip with mouse position on rect

                return tooltip.style("top", d3.event.pageY - 15 + "px")
                                .style("left", d3.event.pageX + 5 + "px")
                                .style('visibility', 'visible');

            })
            .on('mouseout', () => {
                return tooltip.style('visibility', 'hidden');
            });
        // fill in text for each group with <rect> 
        d3.selectAll('.group')
            .append('foreignObject')    // add text to rectangle argument
            .attr('class', 'rectText')
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .attr('fill', 'black')
            .text(d => d.data.name);

            
        let legendH = 300;
        let legendW = 375;

        /// Legend ///    
        let legend = d3.select('#main')    
                        .append('svg')
                        .attr('id', 'legend')
                        .attr('width', legendW)
                        .attr('height', legendH)

        legend.selectAll('g')
            .data(categories)
            .enter()
            .append('g')
            .attr('class', 'legendGroup')
            .append('rect')
            .attr('class', 'legend-item')
            .attr('x', (d,i) => { // position rectangle every third pos (ROW)
                return i%3 * legendW / 3;
            })
            .attr('y', (d,i) => { // position rectangle in new row after every third pos (COL)
                return Math.floor(i / 3) * legendW / 12;
            })
            .attr('fill', d => { 
                return colorMap[d];
            })

        // add text next to colored boxes
        d3.selectAll('.legendGroup')
            .append('text')
            .attr('x', (d,i) => i%3 * legendW / 3 + 20)
            .attr('y', (d,i) => Math.floor(i / 3) * legendW / 12 + 10 )
            .attr('width', 120)
            .text(d => d)
            .style('fill', 'black')
            .style('font-size', '14px')
        
    });

}

// loaded games data set by default
renderPage(gamesURL);

// event handling for each anchor chosen
// document.getElementById("games").onclick = function(){renderPage(gamesURL);}
// document.getElementById("movies").onclick = function(){renderPage(moviesURL);}
// document.getElementById("kickstart").onclick = function(){renderPage(ksURL);}