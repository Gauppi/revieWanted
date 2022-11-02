
//Listen für den späteren Gebrauch
let pmidList = [];
let sekList = [];
const authorList = [];
const citidList = [];
let articles = [];

const nodes = [];
const nodesdata = [];
const childnodes = [];
const edges = [];
const citedby = [];

const directedlinks = [];


async function search() {
    try {
        //Variabeln zurücksetzen 
        // set the length to 0
        nodes.length = 0;
        // use splice to remove all items
        nodes.splice(0, nodes.length);
        // loop through array and remove each item with pop()
        while (nodes.length > 0) {
            nodes.pop();
        }

        document.getElementById("searchquery").innerHTML = document.getElementById("sterm").value.toString();
        let searchString = '("tractor"[All Fields] OR "tractors"[All Fields]) AND ("accidence"[All Fields] OR "accident s"[All Fields] OR "accidents"[MeSH Terms] OR "accidents"[All Fields] OR "accident"[All Fields])'; // Get from Form
        pmidList = [];
        sekList = [];
        let pubMedSearch = await searchPubMedData(searchString);
        let pubMedData = await fetchPubMedData(pubMedSearch);
        renderPubMedDataAsList(pubMedData);
        let iCiteData = await getICiteData(pubMedData.result.uids);
        console.log("PMID Liste zitierter Artikel:", sekList);
        let iCiteData2 = await getICiteData2(sekList);
        let data = combineData(iCiteData, iCiteData2);
        console.log("JSON created:",data);
        console.log("directed Links: ", directedlinks);
        showGraph(data);
       OBJtoXML(data);

        const a1 = document.getElementById("a1");
        const file = new Blob([data], {type: "text/plain"})
        a1.href = URL.createObjectURL(file);
        return data;
    } catch(e) {
        console.log(e)
    }
}


async function searchPubMedData(searchString) {
    let data = await $.ajax({
        type: 'GET',
        url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi',
        data: {
            db: 'pubmed',
            usehistory: 'y',
            term: searchString,
            retmode: 'json',
            retmax: 500
        }
    });
    console.log("searchPubMedData", data);
    //pmidList =  data.esearchresult.idlist;
    const nres = document.getElementById("nresults");
    nres.textContent = data.esearchresult.count.toString() + " Artikel gefunden:";
    return data;
}

async function fetchPubMedData(searchResponse) {
    let data = await $.ajax({
        type: 'GET',
        url: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi',
        data: {
            db: 'pubmed',
            usehistory: 'y',
            webenv: searchResponse.esearchresult.webenv,
            query_key: searchResponse.esearchresult.querykey,
            retmode: 'json',
            retmax: 500 // how many items to return
        }
    });
    console.log("fetchPubMedData", data);
    return data;
}

function renderPubMedDataAsList(pubMedData) {
    let output = $('#output');
    $.each(pubMedData.result, function (i, article) {
        let item = $('<li/>').appendTo(output);
        let container = $('<div/>').appendTo(item);
        pmidList.push(article.uid);
        //Publikationsdatum und Journalname
        $('<label/>', {
            text: article.pubdate + " | " +  article.fulljournalname
        }).appendTo(item);
        //PMID +Titel + Link zum Artikel
        $('<a/>', {
            href: "https://pubmed.ncbi.nlm.nih.gov/" +article.pmid,
            text: article.uid + " | " + article.title,
        }).appendTo(container);
        //Autoren
        /*
        let authorJSON = JSON.stringify(article.authors);
        let autoren = "";
        if(article.authors > 0){
            $.each(article.authors, function(i, author){
                autoren += authorJSON.name[i] + ", ";
            });
        }
        */
        $('<div/>', {
            text: JSON.stringify(article.authors)
        }).appendTo(item);
        //Trennlinie
        $('<hr width="98%" align="center" height="25px" background-color="blue">').appendTo(item);
    });
    console.log("IdList", pmidList);
}

async function getICiteData(pmidList) {
    let query = "";
    query = pmidList.toString();
    let data = await $.ajax({
            method : "GET",
            url: "https://icite.od.nih.gov/api/pubs?pmids=" + query,
            
    })
    console.log("getICiteData", data.data);
    data.data.forEach(article => {
        //console.log(article);
        nodes.push([{id : article.pmid},{group: "1"}]);
        //Weitere Attribute mitgeben
        nodesdata.push([{key : "n0"}]);

        //Überprüfung, ob die Referenzenliste leer ist
        if(article.cited_by.length != 0) {
            
            //Überprüfung, ob die PMID der Referenz undefiniert ist
            for(i = 0; i <= article.cited_by.length; i++ ){
                //citidList.push((article.cited_by[i]));
                if(article.cited_by[i] != undefined){
                    if(pmidList.includes(article.cited_by[i].toString())){
                        directedlinks.push([{target : article.pmid}, {source : article.cited_by[i]}]);
                    }
                    edges.push([{target: article.pmid},{source: article.cited_by[i]}]);
                    citedby.push([article.pmid, article.cited_by[i]]);
                    sekList.push(article.cited_by[i]);                      
                }
                    
            }
            
        }
    });
    console.log("Cited_by", citedby);
    console.log("Nodes created:", nodes);
    console.log("Edges created:", edges);
    return data;
}


function combineData(pubData, iCiteData){
    const data = {
        nodes: [nodes, nodesdata],
        edges: edges
    }
    
    let res = JSON.stringify(data)
    //nodes.push()
    data.nodes.push(res)
    return JSON.stringify({nodes: nodes, edges: edges})
}


function sliceIntoChunks(arr, chunkSize) {
    const res = [];
    for(let i = 0; i  < Math.floor(arr.length / chunkSize); i++){
        const chunk = arr.slice(i, i + chunkSize);
        console.log(i, " chunk:", chunk);
        res.push(chunk);
    }
    return res;
}

async function getICiteData2(idlist) {
    let data;
    console.log("List of PMIDs; ", idlist)
    if(idlist.length > 999){
        let subquery = sliceIntoChunks(idlist, 1000);
        console.log(subquery);
        for(let i = 0; i < Math.floor(subquery.length / 1000); i++){
            data = await getICiteData(subquery[i]);
            console.log(data);
        }
    }
    else{
        data = await getICiteData(idlist);
    }
    return data;
}


function OBJtoXML(obj) {
    var xml = '';
    for (var prop in obj) {
      xml += obj[prop] instanceof Array ? '' : "<" + prop + ">";
      if (obj[prop] instanceof Array) {
        for (var array in obj[prop]) {
          xml += "<" + prop + ">";
          xml += OBJtoXML(new Object(obj[prop][array]));
          xml += "</" + prop + ">";
        }
      } else if (typeof obj[prop] == "object") {
        xml += OBJtoXML(new Object(obj[prop]));
      } else {
        xml += obj[prop];
      }
      xml += obj[prop] instanceof Array ? '' : "</" + prop + ">";
    }
    var xml = xml.replace(/<\/?[0-9]{1,}>/g, '');
    return xml
}

function save(xml){
    var gephiXML = new gephiXML([xml], {type: "text/xml"});
    saveAs(gephiXML, "gephiXML.xml");
}

function showGraph(data) {
    var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

    var color = d3.scaleOrdinal(d3.schemeCategory20);

    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));

    d3.json("miserables.json", function(error, graph) {
    if (error) throw error;

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line")
        .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(graph.nodes)
        .enter().append("g")

    var circles = node.append("circle")
        .attr("r", 5)
        .attr("fill", function(d) { return color(d.group); });

    // Create a drag handler and append it to the node object instead
    var drag_handler = d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);

    drag_handler(node);
    
    var lables = node.append("text")
        .text(function(d) {
            return d.id;
        })
        .attr('x', 6)
        .attr('y', 3);

    node.append("title")
        .text(function(d) { return d.id; });

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    function ticked() {
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
    
        node
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
        }
    });

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }
    
    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

    




