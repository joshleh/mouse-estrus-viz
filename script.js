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

    // Function to update the chart based on selected mouse
    function updateChart(selectedMouse) {
        const filteredData = data.filter(d => d.mouse === selectedMouse);
    
        // Reset xScale domain to the full range
        xScale.domain(d3.extent(filteredData, d => d.day));
    
        // Update line
        svg.selectAll(".line").remove();
        svg.append("path")
            .datum(filteredData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("class", "line")
            .attr("d", line);
    
        // Update circles
        svg.selectAll("circle").remove();
        svg.selectAll("circle")
            .data(filteredData)
            .enter().append("circle")
            .attr("cx", d => xScale(d.day))
            .attr("cy", d => yScale(d.temp))
            .attr("r", 2)  // Reduce circle size
            .attr("fill", "red")
            .on("mouseover", (event, d) => {
                tooltip.style("display", "block")
                    .style("left", event.pageX + "px")
                    .style("top", event.pageY + "px")
                    .html(`Day: ${d.day}<br>Temp: ${d.temp}`);
            })
            .on("mouseout", () => tooltip.style("display", "none"));
    
        // ** Re-add Axes **
        xAxis.call(d3.axisBottom(xScale));
        yAxis.call(d3.axisLeft(yScale));
    
        // Reset brush selection
        svg.select(".brush").call(brush.move, null);
    }

    // Default selection (first mouse)
    updateChart(uniqueMice[0]);

    // Listen for dropdown changes
    dropdown.on("change", function() {
        updateChart(this.value);
    });

    // Brush & Zoom
    const brush = d3.brushX()
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
        .on("end", (event) => {
            const selection = event.selection;
            if (!selection) return;
    
            // Convert brush selection from pixels to data domain
            const [x0, x1] = selection.map(xScale.invert);
    
            // Update x-axis domain
            xScale.domain([x0, x1]);
    
            // Redraw elements
            svg.select(".line").attr("d", line);
            svg.selectAll("circle")
                .attr("cx", d => xScale(d.day))
                .attr("cy", d => yScale(d.temp));
    
            xAxis.call(d3.axisBottom(xScale));
        });

    // Add brush to the chart
    svg.append("g").attr("class", "brush").call(brush);
});
