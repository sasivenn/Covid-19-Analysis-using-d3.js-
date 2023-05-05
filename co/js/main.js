
var _world;
var _covid;
Promise.all(
    [
        d3.json("./data/world/worldgeo.json"),
        d3.csv("./data/covid/owid-covid-data.csv")
    ]).then(function (data) {

        
        _world = data[0];
        _covid = data[1];

        
        do_draw();
    }).catch(function (error) {
        console.log(error);
        alert("ERROR, CHECK CONSOLE LOG?");
    });




function get_covid_country_data(id)
{
    let c_data = null;
    for (let i = 0; i < _covid.length; i++)
    {
        if (_covid[i].iso_code == id) {
            if (c_data == null) {
                c_data = [];
            }

            c_data.push(_covid[i]);
        }
    }
    
    return c_data;
}
function get_covid_date_last(data_array)
{
    if (data_array == null)
        return null;
    
    let last = null;
    for (let i = 0; i < data_array.length; i++)
    {
        if (last == null) {
            last = data_array[i];
            continue;
        }

        let dt_last = new Date(last.date);
        let dt = new Date(data_array[i].date);

        if (dt_last.getTime() < dt.getTime()) {
            last = data_array[i];
        }
    }
    
    return last;
}
function get_covid_country_date_last(id) {
    return get_covid_date_last(get_covid_country_data(id));
}
function get_covid_countries_date_last() {
    let c_data = null;
    let last = null;
    for (let i = 0; i < _covid.length; i++)
    {
        let curr = _covid[i];

        if (last != null && curr.iso_code == last.iso_code)
            continue;

        curr = get_covid_country_date_last(curr.iso_code);

        if (c_data == null) {
            c_data = [];
        }
        if (curr != null && curr.location != "World") {
            c_data.push(curr);
        }
        last = curr;
    }
    
    return c_data;
}
function sort_covid_data_ascending_date(data_array) {
    if (data_array == null)
        return null;
    return data_array.sort(function (a, b) { return new Date(a.date).getTime() - new Date(b.date).getTime() });
}
function sort_covid_data_descending_date(data_array) {
    if (data_array == null)
        return null;
    data_array.sort(function (a, b) { return new Date(b.date).getTime() - new Date(a.date).getTime() });
}


function do_draw() {
    
    do_map();


    let my_data = get_covid_countries_date_last();
    
    my_data = sort_covid_data_ascending_date(my_data);
   
    
    
    var color = d3.scaleOrdinal(d3.schemePaired);
    
    
    draw_pie("#pie_tcases", my_data, 0);
    draw_pie("#pie_ncases", my_data, 1);
    draw_pie("#pie_ndeaths", my_data, 2);
    
    
    draw_bar("#bar_tcases", my_data, 0);
    draw_bar("#bar_tdeaths", my_data, 1);
}



function draw_pie(svg_id, data, content_id, custom_color_ordinal_scale = null) {
    

    var svg = d3.select(svg_id),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    
    
    var color = d3.scaleOrdinal(d3.schemePaired);
    if(custom_color_ordinal_scale != undefined || custom_color_ordinal_scale != null)
    {
        color = custom_color_ordinal_scale;
    }
    
    var pie = d3.pie()
        .value(function (d)
        {
            let amnt;
            if (content_id == 0)
                amnt = d.value.total_cases;
            if (content_id == 1)
                amnt = d.value.new_cases;
            else if (content_id == 2)
                amnt = d.value.new_deaths;

            

            return +amnt;
        })
    var data_ready = pie(d3.entries(data))

    
    
    svg.selectAll()
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', d3.arc()
            .innerRadius(width / 2)
            .outerRadius((width/2)-60)
        )
        .attr('fill', function (d) { return (color(d.data.key)) })
        .attr("stroke", "black")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
        
        .attr("class", "pie_part")
        .style("opacity", .8)
        .on("mouseover", function (d) {

            d3.selectAll(".pie_part")
                .transition()
                .style("opacity", .5);

            d3.select(this)
                .transition()
                .style("opacity", 1);
        })
        .on("mouseleave", function (d) {

            d3.selectAll(".pie_part")
                .transition()
                .style("opacity", .8);
        })
        
        .append("title").text(function (d) {
            
            return `${d.data.value.location}\nTotal:${d.data.value.total_cases}\nDeaths:${d.data.value.new_cases}\nTests:${d.data.value.new_deaths}`;
        });

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .text(function (d)
        {
            let txt = "????";
            if (content_id == 0)
                txt = "Total Cases";
            if (content_id == 1)
                txt = "New Cases";
            else if (content_id == 2)
                txt = "New Deaths";
            return txt;
        })
        .attr("text-anchor", "middle")
        .style("font-size", 16)
        .style("fill", "black");
}


function draw_bar(div_id, _data, content_id){
    
    
    let get_val = d => content_id == 0 ? d.total_cases : d.total_deaths;
    
    const display_only = 10;
    const data = _data.sort(function (a, b) { return get_val(b) - get_val(a); }).slice(0, display_only);;
    
    var margin = {top: 30, right: 30, bottom: 70, left: 60},
    width = 800 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

    
    var svg = d3.select(div_id)
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    
    
    var x = d3.scaleBand()
        .range([ 0, width ])
        .domain(data.map(function(d) { return d.location; }))
        .padding(0.2);
    
    
    
    const data_biggest = data[0];
    const max_val = get_val(data_biggest);
    
    var y = d3.scaleLinear()
        .domain([0, max_val])
        .range([ height, 0]);
    
    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

    
    svg.append("g")
    .call(d3.axisLeft(y));

    
    svg.selectAll("mybar")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", function(d) { return x(d.location); })
    .attr("y", function(d) { return y(get_val(d)); })
    .attr("width", x.bandwidth())
    .attr("height", function(d) { return height - y(get_val(d)); })
    .attr("fill", "darkred")
}




function do_map()
{
    // The svg
    var svg = d3.select("#map"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    
    var projection = d3.geoMercator()
        .scale(120)
        .center([0, 20])
        .translate([width / 2, height / 2]);

    var path = d3.geoPath().projection(projection)

    
    
    var colorScale = d3.scaleThreshold()
        .domain([1000 * 1, 1000 * 5, 1000 * 10, 1000 * 15, 1000 * 20, 1000 * 25])
        .range(d3.schemeReds[9]);


   
    
    svg.append("g")
        .selectAll("path")
        .data(_world.features)
        .enter()
        .append("path")
        
        .attr("d", path)
        
        .attr("fill", function (d) {
            let cdta = get_covid_country_date_last(d.id); 
            
            let ded = 0;
            if (cdta != undefined) {
                ded = cdta.total_cases;
            }
            else {
                //console.log("No covid data found for:" + d.id);
            }

            return colorScale(ded);
        })
        .style("stroke", "black")
        .style("stroke-width", ".5px")
        .attr("class", function (d) { return "country" })
        .style("opacity", .8)
        .on("mouseover", function (d) {

            d3.selectAll(".country")
                .transition()
                .style("opacity", .5);

            d3.select(this)
                .transition()
                .style("opacity", 1);
            
        })
        .on("mouseleave", function (d) {

            d3.selectAll(".country")
                .transition()
                .style("opacity", .8);

            
        })
        .on("click", function (d) {

            do_country(d);
        })
        
        .append("title").text(function (d) {

            let cdta = get_covid_country_date_last(d.id);//map_data.get(d.id);
            //console.log(map_data);
            let detail = "NO DATA FOUND";
            if (cdta != undefined) {
                detail = `${d.properties.name}\nDate:${cdta.date}\nTotal:${cdta.total_cases}\nDead:${cdta.total_deaths}`;
            }
            else {
                //console.log(d);
                detail = `${d.properties.name}\nNO DATA FOUND TO DISPLAY`;
            }
            return detail;
        });

    
}

// this function is called when a country is selected in world map.....
// parameter is country data. which can be used to get other information about country
function do_country(d)
{
    let c_data_all = get_covid_country_data(d.id);
    let c_data_last = get_covid_date_last(c_data_all);

    let detail = document.getElementById("detail");
    
    detail.innerHTML  =`<h3> Details about ${d.properties.name} </h3>`;
    if (c_data_last == null) {
        detail.innerHTML +=`<p> Location: ${d.properties.name} </p>`;
        detail.innerHTML +=`<p> No covid19 data was found to display. </p>`;
       
       d3.select("#line_cases").html("");
       d3.select("#line_deaths").html("");
        return;
    }

    detail.innerHTML += `<p> Location:              ${c_data_last.location}             </p>`;
    detail.innerHTML += `<p> Continent:             ${c_data_last.continent}            </p>`;
    detail.innerHTML += `<p> Code:                  ${c_data_last.iso_code}             </p>`;
    detail.innerHTML += `<p> LastUpdated:           ${c_data_last.date}                 </p>`;
    detail.innerHTML += `<p> TotalCases:            ${c_data_last.total_cases}          </p>`;
    detail.innerHTML += `<p> NewCases:              ${c_data_last.new_cases}            </p>`;
    detail.innerHTML += `<p> TotalDeaths:           ${c_data_last.total_deaths}         </p>`;
    detail.innerHTML += `<p> NewDeaths:             ${c_data_last.new_deaths}           </p>`;
    detail.innerHTML += `<p> TotalTests:            ${c_data_last.total_tests}          </p>`;
    detail.innerHTML += `<p> NewTests:              ${c_data_last.new_tests}            </p>`;
    detail.innerHTML += `<p> Population:            ${c_data_last.population}           </p>`;
    detail.innerHTML += `<p> PopulationDensity:     ${c_data_last.population_density}   </p>`;
    
    //draw line chart to display time line
    draw_line_chart("#line_cases", c_data_all, 0);
    draw_line_chart("#line_deaths", c_data_all, 1);
}

//function for drawing line charts for country specific data.......
function draw_line_chart(div_id, data, content_id) {
    
    var margin = { top: 10, right: 30, bottom: 30, left: 60 },
        width = 800 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;
    
    // append the svg object to the body of the page
    var svg = d3.select(div_id).html("")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    
    var track_line = svg
        .append('g')
            .append('line')
                .style("fill", "none")
                .attr("stroke", "black")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", 0)
                .attr("y2", height + margin.top + margin.bottom)
                .attr("width", 5)
                .style("opacity", 0);
    
    //data
    const detail_text = content_id == 0 ? "Total Cases" : "Total Deaths";
    let get_date = d => new Date(d.date).getTime();
    let get_val = d => content_id == 0 ? d.total_cases : d.total_deaths;
    
    // Add X axis --> it is a date format
    var x = d3.scaleTime()
        .domain(d3.extent(data, function (d) {  return get_date(d); }))
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
        
        
   
    var y = d3.scaleLinear()
        .domain([0, get_val(data[data.length-1])])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));


    
    var dt_txt = svg.append("text")
                        .attr("x", width / 2)
                        .attr("y", height / 2)
                        .text(detail_text)
                        .attr("text-anchor", "middle")
                        .style("font-size", 16)
                        .style("fill", "black");
    // Add the line
    svg.append("path")
        .data([data])
        .attr("fill", "none")
        .attr("stroke", function (d) { return "red"; })
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function (d) { return x(get_date(d)); })
            .y(function (d) { return y(get_val(d)); })
    );
    
    
    // SETUP TRACKER................
    
    // Create a rect on top of the svg area: this rectangle recovers mouse position
    svg
        .append('rect')
            .style("fill", "none")
            .style("pointer-events", "all")
            .attr('width', width)
            .attr('height', height)
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout);
    
    // What happens when the mouse move -> show the annotations at the right positions.
    function mouseover() {
        track_line.style("opacity", 1)
    }
    function mouseout() {
        track_line.style("opacity", 0)
        dt_txt.text(detail_text);
    }
    function mousemove() {
        // recover coordinate we need
        const coord = d3.mouse(this);
        const seldate = x.invert(coord[0]);
        
        // find the closest x index
        const bisect = d3.bisector(function(d) { return get_date(d); }).left;
        const i = bisect(data, seldate, 1);
        
        const cdata = data[i];
        
        const _val = get_val(cdata);
        
        const pos = coord[0];
        
        track_line.attr("x1", pos).attr("x2", pos);
        
        // display info
        dt_txt.text(`Date: ${cdata.date}, ${detail_text}: ${_val}`);
    }
}