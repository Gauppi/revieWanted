
//Listen für den späteren Gebrauch
let pmidList = [];
let sekList = [];
let authorList = [];
let citidList = [];
let articles = [];
let reviews = [];

let nodes = [];
let childnodes = [];
let edges = [];
let graphnodes = [];
let graphedges = [];
const citedby = [];

const directedlinks = [];


//Counter Variablen für Citations und Reviews
let cit_count = 0;
let rev_count = 0;


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

        let searchString = document.getElementById("searchquery").innerHTML = document.getElementById("sterm").value.toString();
        //let searchString = '("video s"[All Fields] OR "videoed"[All Fields] OR "videotape recording"[MeSH Terms] OR ("videotape"[All Fields] AND "recording"[All Fields]) OR "videotape recording"[All Fields] OR "video"[All Fields] OR "videos"[All Fields]) AND ("game s"[All Fields] OR "games"[All Fields] OR "gaming"[All Fields]) AND ("addict"[All Fields] OR "addict s"[All Fields] OR "addicted"[All Fields] OR "addicting"[All Fields] OR "addiction s"[All Fields] OR "addictive"[All Fields] OR "addictiveness"[All Fields] OR "addictives"[All Fields] OR "addicts"[All Fields] OR "behavior, addictive"[MeSH Terms] OR ("behavior"[All Fields] AND "addictive"[All Fields]) OR "addictive behavior"[All Fields] OR "addiction"[All Fields] OR "addictions"[All Fields]) AND ("classification"[MeSH Terms] OR "classification"[All Fields] OR "systematic"[All Fields] OR "classification"[MeSH Subheading] OR "systematics"[All Fields] OR "systematical"[All Fields] OR "systematically"[All Fields] OR "systematisation"[All Fields] OR "systematise"[All Fields] OR "systematised"[All Fields] OR "systematization"[All Fields] OR "systematizations"[All Fields] OR "systematize"[All Fields] OR "systematized"[All Fields] OR "systematizes"[All Fields] OR "systematizing"[All Fields])' //'("tractor"[All Fields] OR "tractors"[All Fields]) AND ("accidence"[All Fields] OR "accident s"[All Fields] OR "accidents"[MeSH Terms] OR "accidents"[All Fields] OR "accident"[All Fields])'; // Get from Form
        // Arrays zurücksetzen 
        pmidList = [];
        nodes = [];
        edges = [];
        sekList = [];
        //PubMed Suche nach Searchterm
        let pubMedSearch = await searchPubMedData(searchString);
        //Pubmed Daten extrahieren
        let pubMedData = await fetchPubMedData(pubMedSearch);
        //PubMed Daten anzeigen
        renderPubMedDataAsList(pubMedData);
        // Zitationen und Metadaten suchen anhand der PMID (1. mal)
        let iCiteData = await getICiteData(pubMedData.result.uids);
        console.log("PMID Liste zitierter Artikel:", sekList);
        // Suche die Zitierungen von den Zitierungen (2. mal)
        let iCiteData2 = await getICiteData2(sekList);
        // Zitationsdaten zusammenführen
        let data = combineData(iCiteData, iCiteData2);
        // Ausgabe JSON und direkte Verbindungen (C1 zitiert A1 aus der PMIDliste)
        console.log("JSON created:",data);
        console.log("directed Links: ", directedlinks);
        //Resultat updaten Zitationenhinzufügen
        const nres = document.getElementById("nresults");
        nres.textContent = nres.textContent + " | Zitationen: " + cit_count + " | Reviews:" + rev_count;
        //Erstellen des force directed Graphes
        showGraph(data);
        
        //XML Parsen 
        data = combineNodes(graphnodes, graphedges);
        let res = xmltographml(OBJtoXML(data));
        console.log(res);

        //Export result via Link
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
        //First Author
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
        if(article.is_research_article == "Yes"){
            nodes.push({id : article.pmid,group: "0"});
            graphnodes.push({node: {id : article.pmid , data: {key: "n1"}}});
            //Weitere Attribute mitgeben
            //nodesdata.push({pmid : article.pmid, title: article.title, authors: article.authors, journal: article.journal, is_res_article: article.is_research_article, rcr: article.relative_citation_ratio, nih: article.nih_percentile, cit_count: article.citation_count});
        }
           
        else {
            console.log("Review found: ", article.pmid);
            rev_count++;
            nodes.push({id : article.pmid,group: "7"});
            graphnodes.push({node: {id : article.pmid , data: {key: "n1"}}});
            //Weitere Attribute mitgeben
            //nodesdata.push({pmid : article.pmid, title: article.title, authors: article.authors, journal: article.journal, is_res_article: article.is_research_article, rcr: article.relative_citation_ratio, nih: article.nih_percentile, cit_count: article.citation_count});
        }
        //Überprüfung, ob die Referenzenliste leer ist
        if(article.cited_by.length != 0) {
            
            // Durch jede Zitation loopen, um die PMID aufzunehmen
            for(i = 0; i < article.cited_by.length; i++ ){
                cit_count++;
                //Überprüfung, ob die PMID der Referenz undefiniert ist
                if(article.cited_by[i] != undefined){
                    if(pmidList.includes(article.cited_by[i].toString())){
                        console.log("Direkt Link found: gegenseitige Zitation gefunden")
                        directedlinks.push({source : article.cited_by[i], target : article.pmid, type: "CITATION"});
                        //Zitationsknoten einblenden, falls gewünscht
                        //nodes.push({id :  article.cited_by[i], group: "1"});
                        edges.push({target: article.pmid, source: article.cited_by[i], value: article.relative_citation_ratio,  type: "CITATION"});
                        graphedges.push({edge: {target: article.pmid, source: article.cited_by[i], value: article.relative_citation_ratio,  type: "CITATION", data: {key: "e1"}}});
                    }
                    citedby.push(article.pmid, article.cited_by[i]);
                    sekList.push(article.cited_by[i]);                      
                }
                    
            }
        }
    });

    console.log("Reviews found: ", rev_count);
    console.log("Cited_by", citedby);
    console.log("Nodes created:", nodes);
    console.log("Edges created:", edges);
    return data;
}


function combineData(pubData, iCiteData){
    const data = {
        nodes: nodes,
        edges: edges
    }
    return data
}

function combineNodes(nodes, nodesdata){
    const data = {
        node: graphnodes,
        edge: graphedges
    }
    return data;
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
    let xml = '';
    for (let prop in obj) {
      xml += obj[prop] instanceof Array ? '' : "<" + prop + ">";
      if (obj[prop] instanceof Array) {
        for (let array in obj[prop]) {
          xml += "<" + prop + ">";
          xml += OBJtoXML(new Object(obj[prop][array]));
          xml += "</" + prop + ">";
        }
      } else if (typeof obj[prop] == "object") {
        xml += OBJtoXML(new Object(obj[prop]));
      } else {
        xml += obj[prop];
      }
      xml += obj[prop] instanceof Array ? '' : "</" + prop + ">" + '\n';
    }
    xml = xml.replace(/<\/?[0-9]{1,}>/g, '');
    return xml
}
    
function xmltographml(obj){
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<graphml xmlns="http://graphml.graphdrawing.org/xmlns"\n' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
    'xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns\n' +
    'http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">\n' +
    '<key id="e1" for="edge" attr.name="weight" attr.type="double">\n'+
    '<default>1</default></key>\n' +
    '<key id="n1" for="node" attr.name="articles" attr.type="double">\n' +
    '<default>1</default></key>\n' +
    '<graph edgedefault="undirected">\n' + 
    obj + '\n' + 
    ' </graphml>';
    
}

function save(xml){
    let gephiXML = new gephiXML([xml], {type: "text/xml"});
    saveAs(gephiXML, "graph.graphml");
}

function showGraph(data) {    
    var svg = d3.select("#dataviz_basicZoom"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

    var svg = d3.select("#dataviz_basicZoom")
    .append("svg")
        .attr("width",  1200)
        .attr("height",  1000)
        .call(d3.zoom().on("zoom", function () {
        svg.attr("transform", d3.event.transform)
        }))
    .append("g")

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));
    
    d3.set(data)

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(data.edges)
        .enter().append("line")
        .attr("stroke-width", function(d) { return Math.sqrt(d.value); });

    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(data.nodes)
        .enter().append("g")

    var circles = node.append("circle")
        .attr("r", 6)
        .style("fill", function(d) { return color(d.group); });

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
        .nodes(data.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(data.edges);

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


    




