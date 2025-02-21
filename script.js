// Load Data
d3.csv("data/mouse_data.csv").then(function(data) {
    data.forEach(d => {
        d.day = +d.day;
        d.temp = +d.temp;
    });

    // Set dimensions
    const width = 800, height = 400;
    const margin = { top: 40, right: 150, bottom: 60, left: 70 }; // Increased right margin

    // Create Scales
    let xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.day))
        .range([margin.left, width - margin.right]);

    let yScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.temp) - 0.5, d3.max(data, d => d.temp) + 0.5])
        .range([height - margin.bottom, margin.top]);

    // Create SVG container
    const svg = d3.select("#tempChart")
        .attr("width", width)
        .attr("height", height);

    // Append background shading for each night period
    function updateShading() {
        // Remove old shading
        svg.selectAll(".night-shading").remove();
    
        const dayLength = 1440; // Minutes in a day
        const numDays = Math.ceil(d3.max(data, d => d.day) / dayLength);
    
        for (let i = 0; i < numDays; i++) {
            const nightStart = i * dayLength + 720; // Night starts at 720 minutes
            const nightEnd = (i + 1) * dayLength;
    
            // Ensure shading is within zoom range
            if (nightEnd < xScale.domain()[0] || nightStart > xScale.domain()[1]) {
                continue; // Ignore if shading is outside zoom range
            }
            
            svg.append("rect")
                .attr("class", "night-shading")
                .attr("x", Math.max(margin.left, xScale(nightStart))) // Ensures shading starts within bounds
                .attr("y", margin.top)
                .attr("width", Math.max(0, xScale(nightEnd) - xScale(nightStart))) // Ensures correct width
                .attr("height", height - margin.bottom - margin.top)
                .attr("fill", "lightgray")
                .attr("opacity", 0.3); 
        }
    }

    // Add X-axis Label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 20)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Day (Minutes)");

    // Add Y-axis Label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Temperature (°C)");
    
    // Define the brush first
    const brush = d3.brushX()
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
        .on("start", function () { 
            d3.select(".brush").style("display", "block");
        })
        .on("brush", function(event) { 
            d3.select(".brush").style("display", "block");
        })
        .on("end", (event) => {
            const selection = event.selection;
            if (!selection) return;
        
            // Convert selection from pixel space to data domain
            zoomedRange = selection.map(xScale.invert);
        
            // Update the domain
            xScale.domain(zoomedRange);
        
            // Delay X-axis update slightly to ensure data updates first
            setTimeout(() => {
                xAxis.transition().duration(500).call(d3.axisBottom(xScale));
            }, 100);

            svg.selectAll(".night-shading").remove(); // Clear previous shading
            updateShading(); // Apply updated shading


            // Update chart with zoomed data
            updateChart(dropdown.node().value);

            // Ensure xScale domain is updated before filtering data
            const newFilteredData = data.filter(d => 
                d.mouse === dropdown.node().value &&
                d.day >= xScale.domain()[0] && d.day <= xScale.domain()[1]
            );

            // Re-draw line with updated data
            svg.append("path")
                .datum(newFilteredData)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2)
                .attr("class", "line")
                .attr("d", line);

            // Re-draw circles with updated data
            svg.selectAll("circle")
                .data(newFilteredData)
                .enter().append("circle")
                .attr("cx", d => xScale(d.day))
                .attr("cy", d => yScale(d.temp))
                .attr("r", 2)
                .attr("fill", "red");
        
            // Keep the brush selection active longer
            setTimeout(() => {
                d3.select(this).transition().duration(500).call(brush.move, selection);
            }, 500);
        });

    // Now append the brush AFTER defining it
    const brushGroup = svg.append("g")
        .attr("class", "brush")
        .call(brush);

    // Add Legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right + 30}, ${margin.top + 20})`); // Adjusted position

    // Nighttime color box
    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "lightgray")
        .attr("opacity", 0.3);

    legend.append("text")
        .attr("x", 25) // Adjusted from 30 to 25 for better alignment
        .attr("y", 15)
        .style("font-size", "12px")
        .text("Nighttime");
    
    legend.append("text")
        .attr("x", 25) // Adjusted from 30 to 25 for better alignment
        .attr("y", 45)
        .style("font-size", "12px")
        .text("Daytime");

    // Daytime color box
    legend.append("rect")
        .attr("x", 0)
        .attr("y", 30)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "white")
        .attr("stroke", "black");

    // Line Generator
    const line = d3.line()
        .x(d => xScale(d.day))
        .y(d => yScale(d.temp));

    // Get unique mouse IDs
    const uniqueMice = [...new Set(data.map(d => d.mouse))];

    // Add Label for Dropdown
    d3.select(".chart-container").insert("label", "#mouseSelector")
        .attr("for", "mouseSelector")
        .style("margin-right", "10px")
        .text("Select Mouse:");

    // Populate dropdown
    const dropdown = d3.select("#mouseSelector");
    dropdown.selectAll("option")
        .data(uniqueMice)
        .enter().append("option")
        .text(d => d)
        .attr("value", d => d);

    // Create axes
    const xAxis = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    const yAxis = svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));

    function updateChart(selectedMouse) {
        const filteredData = data.filter(d => d.mouse === selectedMouse);
        
        if (!zoomedRange) { 
            xScale.domain(d3.extent(filteredData, d => d.day));
        } else { 
            xScale.domain(zoomedRange);
        }
                
        // Fully reset zoom & brush selection  
        xScale.domain(d3.extent(filteredData, d => d.day));
        yScale.domain([d3.min(filteredData, d => d.temp) - 0.5, d3.max(filteredData, d => d.temp) + 0.5]);
        
        // Update axes BEFORE drawing new data
        xAxis.transition().duration(500).call(d3.axisBottom(xScale));
        yAxis.transition().duration(500).call(d3.axisLeft(yScale));

        // Remove old line and circles
        svg.selectAll(".line").remove();
    
        // Re-draw line
        svg.append("path")
            .datum(filteredData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("class", "line")
            .attr("d", line);
    
        // Remove old data points
        svg.selectAll("circle").remove();

        // Re-draw circles
        svg.selectAll("circle")
            .data(filteredData)
            .enter().append("circle")
            .attr("cx", d => xScale(d.day))
            .attr("cy", d => yScale(d.temp))
            .attr("r", 2)
            .attr("fill", "red")
            .on("mouseover", function (event, d) {
                d3.select("#tooltip")
                    .style("display", "block")
                    .style("left", `${event.pageX + 5}px`)  // Closer to the cursor
                    .style("top", `${event.pageY + 5}px`)   // Avoids overlapping the mouse
                    .html(`Day: ${d.day}<br>Temp: ${d.temp}°C`);
            })            
            .on("mouseout", function () {
                d3.select("#tooltip").style("display", "none");
            });
        
        // Clear old shading and redraw night/day shading
        svg.selectAll(".night-shading").remove();
        updateShading();
    
        svg.select(".brush").call(brush.move, null);
    }
    
    svg.on("dblclick", function () {
        zoomedRange = null; // Reset zoom globally
        xScale.domain(d3.extent(data, d => d.day)); // Reset domain
    
        // Reset X-axis and update the chart
        xAxis.transition().duration(500).call(d3.axisBottom(xScale));
        updateChart(dropdown.node().value);
    
        // Clear the brush selection completely
        svg.select(".brush").call(brush.move, null);
    });
    
    // Ensure the dropdown correctly updates everything
    dropdown.on("change", function() {
        const selectedMouse = this.value;
        zoomedRange = null; // Reset zoom when changing mouse
    
        // Clear all previous night/day shading before updating chart
        svg.selectAll(".night-shading").remove();

        // Reset brush selection
        svg.selectAll(".brush").call(brush.move, null);
    
        updateChart(selectedMouse);
    });
    
    // Default selection (first mouse)
    updateChart(uniqueMice[0]);
    
    // Move the brush to the top so it's above other elements
    brushGroup.raise();

    
});
