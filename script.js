// Load Data
d3.csv("data/mouse_data.csv").then(function(data) {
    data.forEach(d => {
        d.day = +d.day;
        d.temp = +d.temp;
    });

    // Set dimensions
    const width = 800, height = 400;
    const margin = { top: 40, right: 30, bottom: 60, left: 70 };

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

    // Add background shading for night periods
    const dayLength = 1440; // 1440 minutes in a day
    const numDays = d3.max(data, d => d.day);

    // Append background shading for each night period
    for (let i = 0; i < numDays; i++) {
        if (i % 2 === 0) {
            svg.append("rect")
                .attr("x", xScale(i + 1))  // Start of night
                .attr("y", margin.top)
                .attr("width", xScale(i + 2) - xScale(i + 1)) // Ensure width is proportional to day
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
        .text("Day");

    // Add Y-axis Label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Temperature (°C)");

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

    let zoomedRange = null;

    function updateChart(selectedMouse) {
        const filteredData = data.filter(d => d.mouse === selectedMouse);
    
        // Preserve zoom range if it exists
        if (zoomedRange) {
            xScale.domain(zoomedRange);
        } else {
            xScale.domain(d3.extent(filteredData, d => d.day));
        }
    
        yScale.domain([d3.min(filteredData, d => d.temp) - 0.5, d3.max(filteredData, d => d.temp) + 0.5]);
    
        // Remove old line and circles
        svg.selectAll(".line").remove();
        svg.selectAll("circle").remove();
    
        // Re-draw line
        svg.append("path")
            .datum(filteredData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("class", "line")
            .attr("d", line);
    
        // Re-draw circles
        svg.selectAll("circle")
            .data(filteredData)
            .enter().append("circle")
            .attr("cx", d => xScale(d.day))
            .attr("cy", d => yScale(d.temp))
            .attr("r", 2)
            .attr("fill", "red");
    
        // Re-add axes
        xAxis.call(d3.axisBottom(xScale));
        yAxis.call(d3.axisLeft(yScale));
    
        // Only reset brush if zoomedRange is null
        if (!zoomedRange) {
            svg.select(".brush").call(brush.move, null);
        }
    }
    
    svg.on("dblclick", function () {
        zoomedRange = null; // Reset zoom globally
        updateChart(dropdown.node().value);
    });    
        
    // Default selection (first mouse)
    updateChart(uniqueMice[0]);

    // Ensure the dropdown correctly updates everything
    dropdown.on("change", function() {
        const selectedMouse = this.value;
        updateChart(selectedMouse);
    });


    const brush = d3.brushX()
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
        .on("end", (event) => {
            const selection = event.selection;
            if (!selection) return;

            // Convert selection from pixel space to data domain
            const [x0, x1] = selection.map(xScale.invert);

            // Update the domain
            xScale.domain([x0, x1]);

            // Redraw elements
            svg.select(".line").attr("d", line);
            svg.selectAll("circle")
                .attr("cx", d => xScale(d.day))
                .attr("cy", d => yScale(d.temp));

            xAxis.call(d3.axisBottom(xScale));

            // Store the zoomed range globally
            zoomedRange = [x0, x1];
        });

    // Add brush to the chart
    svg.append("g").attr("class", "brush").call(brush);

});
