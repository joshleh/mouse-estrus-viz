// // Load Data (Example using CSV)
// d3.csv("data/mouse_data.csv").then(function(data) {
    
//     // Convert data to numeric values
//     data.forEach(d => {
//         d.day = +d.day;
//         d.temp = +d.temp;
//     });

//     // Set dimensions
//     const width = 800, height = 400;
//     const margin = { top: 20, right: 30, bottom: 40, left: 50 };

//     // Create Scales
//     const xScale = d3.scaleLinear().domain(d3.extent(data, d => d.day)).range([margin.left, width - margin.right]);
//     const yScale = d3.scaleLinear().domain([36, 39]).range([height - margin.bottom, margin.top]);

//     // Create SVG container
//     const svg = d3.select("#tempChart");

//     // Line Generator
//     const line = d3.line()
//         .x(d => xScale(d.day))
//         .y(d => yScale(d.temp));

//     // Draw Line Chart
//     svg.append("path")
//         .datum(data)
//         .attr("fill", "none")
//         .attr("stroke", "steelblue")
//         .attr("stroke-width", 2)
//         .attr("d", line);

//     // Axes
//     svg.append("g")
//         .attr("transform", `translate(0,${height - margin.bottom})`)
//         .call(d3.axisBottom(xScale));

//     svg.append("g")
//         .attr("transform", `translate(${margin.left},0)`)
//         .call(d3.axisLeft(yScale));

//     // Tooltip
//     const tooltip = d3.select("#tooltip");
    
//     svg.selectAll("circle")
//         .data(data)
//         .enter().append("circle")
//         .attr("cx", d => xScale(d.day))
//         .attr("cy", d => yScale(d.temp))
//         .attr("r", 5)
//         .attr("fill", "red")
//         .on("mouseover", (event, d) => {
//             tooltip.style("display", "block")
//                    .style("left", event.pageX + "px")
//                    .style("top", event.pageY + "px")
//                    .html(`Day: ${d.day}<br>Temp: ${d.temp}`);
//         })
//         .on("mouseout", () => tooltip.style("display", "none"));
// });

// Load Data
d3.csv("data/mouse_data.csv").then(function(data) {
    data.forEach(d => {
        d.day = +d.day;
        d.temp = +d.temp;
    });

    // Set dimensions
    const width = 800, height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    // Create Scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.day))
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.temp) - 0.5, d3.max(data, d => d.temp) + 0.5])
        .range([height - margin.bottom, margin.top]);

    // Create SVG container
    const svg = d3.select("#tempChart")
        .attr("width", width)
        .attr("height", height);

    // Line Generator
    const line = d3.line()
        .x(d => xScale(d.day))
        .y(d => yScale(d.temp));

    // Get unique mouse IDs
    const uniqueMice = [...new Set(data.map(d => d.mouse))];

    // Populate dropdown
    const dropdown = d3.select("#mouseSelector");
    dropdown.selectAll("option")
        .data(uniqueMice)
        .enter().append("option")
        .text(d => d)
        .attr("value", d => d);

    // Function to update the chart based on selected mouse
    function updateChart(selectedMouse) {
        const filteredData = data.filter(d => d.mouse === selectedMouse);

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
            .attr("r", 4)  // Reduce circle size
            .attr("fill", "red")
            .on("mouseover", (event, d) => {
                tooltip.style("display", "block")
                    .style("left", event.pageX + "px")
                    .style("top", event.pageY + "px")
                    .html(`Day: ${d.day}<br>Temp: ${d.temp}`);
            })
            .on("mouseout", () => tooltip.style("display", "none"));
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
        .on("brush end", ({ selection }) => {
            if (!selection) return;

            const [x0, x1] = selection.map(xScale.invert);
            xScale.domain([x0, x1]);

            svg.select(".line").attr("d", line);
            svg.selectAll("circle")
                .attr("cx", d => xScale(d.day))
                .attr("cy", d => yScale(d.temp));

            svg.select(".x-axis").call(d3.axisBottom(xScale));
        });

    svg.append("g").attr("class", "brush").call(brush);
});