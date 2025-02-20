// Load Data (Example using CSV)
d3.csv("data/mouse_data.csv").then(function(data) {
    
    // Convert data to numeric values
    data.forEach(d => {
        d.day = +d.day;
        d.temp = +d.temp;
    });

    // Set dimensions
    const width = 800, height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    // Create Scales
    const xScale = d3.scaleLinear().domain(d3.extent(data, d => d.day)).range([margin.left, width - margin.right]);
    const yScale = d3.scaleLinear().domain([36, 39]).range([height - margin.bottom, margin.top]);

    // Create SVG container
    const svg = d3.select("#tempChart");

    // Line Generator
    const line = d3.line()
        .x(d => xScale(d.day))
        .y(d => yScale(d.temp));

    // Draw Line Chart
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));

    // Tooltip
    const tooltip = d3.select("#tooltip");
    
    svg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScale(d.day))
        .attr("cy", d => yScale(d.temp))
        .attr("r", 5)
        .attr("fill", "red")
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                   .style("left", event.pageX + "px")
                   .style("top", event.pageY + "px")
                   .html(`Day: ${d.day}<br>Temp: ${d.temp}`);
        })
        .on("mouseout", () => tooltip.style("display", "none"));
});
