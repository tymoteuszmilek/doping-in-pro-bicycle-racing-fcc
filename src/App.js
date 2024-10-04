import './App.css';
import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';

function App() {
  const [dData, setDData] = useState([]);
  const [error, setError] = useState(null);

  // Fetch the data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Transform the data
        const transformedData = data.map((d) => {
          const [minutes, seconds] = d.Time.split(":").map(Number);
          const totalTimeInSeconds = minutes * 60 + seconds;

          // Create a date string in the required format
          const date = new Date(1970, 0, 1, 0, minutes, seconds).toISOString();

          return {
            time: totalTimeInSeconds, // Total seconds
            year: d.Year,
            name: d.Name,
            nationality: d.Nationality,
            doping: d.Doping,
            date, // Store the date string
          };
        });

        setDData(transformedData); // Use the transformed dataset
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (dData.length > 0) {
      // Define constants
      const w = 800;
      const h = 500;
      const padding = 100;

      // Create scales
      const xScale = d3.scaleLinear()
        .domain(d3.extent(dData, (d) => d.year)) // Use year as x-axis
        .range([padding, w - padding]);

      const yScale = d3.scaleLinear()
        .domain([d3.max(dData, (d) => d.time), d3.min(dData, (d) => d.time)])
        .range([h - padding, padding]);

      // Clear previous chart if any
      d3.select("#chart").selectAll("*").remove();

      // Create svg
      const svg = d3.select("#chart")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

      // Create tooltip
      const tooltip = d3.select("#chart")
        .append("div")
        .attr("id", "tooltip")
        .style("opacity", "hidden");

      // Create points (for scatter plot)
      svg.selectAll("circle")
        .data(dData)
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale(d.year))
        .attr("cy", (d) => yScale(d.time))
        .attr("r", 5)
        .attr("class", "dot")
        .style("fill", (d) => (d.doping ? "navy" : "orange"))
        .attr("data-xvalue", (d) => d.year)
        .attr("data-yvalue", (d) => d.date) // Use the date for data-yvalue
        .on("mouseover", function (event, d) {
          tooltip
            .style("display", "block")
            .attr("data-year", d.year)
            .html(`${d.name}: ${d.nationality}<br>Year: ${d.year}, Time: ${Math.floor(d.time / 60)}:${(d.time % 60).toString().padStart(2, '0')}<br><br>${d.doping || 'No doping allegations'}`);
        })
        .on("mousemove", function (event) {
          tooltip
            .style("top", `${event.pageY - 50}px`) // Position above the cursor
            .style("left", `${event.pageX + 10}px`); // Position to the right of the cursor
        })
        .on("mouseout", function () {
          tooltip.style("display", "none");
        });

      // Add axes
      const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
      const yAxis = d3.axisLeft(yScale).tickFormat((d) => {
        const minutes = Math.floor(d / 60);
        const seconds = (d % 60).toString().padStart(2, "0");
        return `${minutes}:${seconds}`;
      });

      svg.append("g")
        .attr("transform", `translate(0, ${h - padding})`)
        .attr("id", "x-axis")
        .call(xAxis);

      svg.append("g")
        .attr("transform", `translate(${padding}, 0)`)
        .attr("id", "y-axis")
        .call(yAxis);

        svg.append("text")
        .attr("x", w / 2)
        .attr("y", h - 50)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label")
        .text("Year");

    svg.append("text")
        .attr("x", -h / 2)
        .attr("y", 50)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("class", "axis-label")
        .text("Time in minutes");

      // Add legend
      const legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", `translate(${w - 200}, ${h / 2 - 50})`);

      // Legend data
      const legendData = [
        { label: "No Doping Allegations", color: "orange" },
        { label: "Riders with Doping Allegations", color: "navy" },
      ];

      // Add legend items
      legend.selectAll("g")
        .data(legendData)
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(0, ${i * 30})`)
        .each(function (d) {
          const g = d3.select(this);

          // Add legend colored circles
          g.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", d.color);

          // Add legend text
          g.append("text")
            .attr("x", 20)
            .attr("y", 9)
            .text(d.label)
            .style("font-size", "12px");
        });
    }
  }, [dData]);

  return (
    <div id="main">
      <h1 id="title">Doping in Professional Bicycle Racing</h1>
      <p id="subtitle">35 Fastest times up Alpe d'Huez</p>
      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <div id="chart"></div>
      )}
    </div>
  );
}

export default App;
